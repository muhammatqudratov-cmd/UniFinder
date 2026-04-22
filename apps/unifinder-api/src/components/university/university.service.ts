import { ViewService } from './../view/view.service';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import * as moment from 'moment';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { Universities, University } from '../../libs/dto/university/university';
import {
	AgentUniversitiesInquiry,
	AllUniversitiesInquiry,
	UniveristiesInquiry,
	UniversityInput,
} from '../../libs/dto/university/univeristy.input';
import { UniversityStatus } from '../../libs/enums/university.enum';
import { UniversityUpdate } from '../../libs/dto/university/university.update';

@Injectable()
export class UniversityService {
	constructor(
		@InjectModel('University')
		private readonly universityModel: Model<University>,
		private memberService: MemberService,
		private viewService: ViewService,
	) {}

	public async createUniversity(input: UniversityInput): Promise<University> {
		try {
			const result = await this.universityModel.create(input);

			// increase memberProperties
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberUniversities',
				modifier: 1,
			});
			return result;
		} catch (err) {
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getUniversity(memberId: ObjectId, universityId: ObjectId): Promise<University> {
		const search: T = {
			_id: universityId,
			universityStatus: UniversityStatus.ACTIVE,
		};

		const targetUniversity: University = await this.universityModel.findOne(search).lean().exec();
		if (!targetUniversity) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: universityId, viewGroup: ViewGroup.UNIVERSITY };
			const newView = await this.viewService.recordView(viewInput);

			if (newView) {
				await this.universityStatsEditor({ _id: universityId, targetKey: 'universityViews', modifier: 1 });
				targetUniversity.universityViews++;
			}

			// meLiked
		}

		targetUniversity.memberData = await this.memberService.getMember(null, targetUniversity.memberId);
		return targetUniversity;
	}

	public async updateUniversity(memberId: ObjectId, input: UniversityUpdate): Promise<University> {
		let { universityStatus } = input;
		const search: T = {
			_id: input._id,
			memberId: memberId, // agent property bo'lishi shart
			universityStatus: UniversityStatus.ACTIVE,
		};

		if (universityStatus === UniversityStatus.SOLD) input.soldAt = moment().toDate();
		else if (universityStatus === UniversityStatus.DELETE) input.deletedAt = moment().toDate(); // delete bolsa ststusni delete ga o'zgartirib qo'yadi va deletedAt ni hozirgi vaqtga o'zgartiradi
		const result = await this.universityModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (input.soldAt || input.deletedAt) {
			// if properties sell then it works
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberUniversities',
				modifier: -1,
			});
		}

		return result;
	}

	public async getUniversities(memberId: ObjectId, input: UniveristiesInquiry): Promise<Universities> {
		const match: T = { universityStatus: UniversityStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input); // COMPLEX SHAPE MATCH QUERY "object oriented programing "
		console.log('match:', match);

		const result = await this.universityModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meLiked
							lookupMember, // member ma'lumotlarini qo'shish va olish uchun
							{ $unwind: '$memberData' }, // memberData ni array dan object ga o'tkazish
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
	private shapeMatchQuery(match: T, input: UniveristiesInquiry): void {
		const {
			memberId,
			locationList,
			roomsList,
			bedsList,
			typeList,
			periodsRange,
			pricesRange,
			squaresRange,
			options,
			text,
		} = input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (locationList) match.universityLocation = { $in: locationList };
		if (roomsList) match.universityRooms = { $in: roomsList };
		if (bedsList) match.universityBeds = { $in: bedsList };
		if (typeList) match.universityType = { $in: typeList };

		if (pricesRange) match.universityPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: new Date(periodsRange.start), $lte: new Date(periodsRange.end) };
		if (squaresRange) match.universitySquare = { $gte: squaresRange.start, $lte: squaresRange.end };

		if (text) match.universityTitle = { $regex: new RegExp(text, 'i') };
		if (options) {
			match['$or'] = options.map((ele) => {
				// BARTER OR RENT qismi
				return { [ele]: true };
			});
		}
	}

	public async getAgentUniversities(memberId: ObjectId, input: AgentUniversitiesInquiry): Promise<Universities> {
		const { universityStatus } = input.search;
		if (universityStatus === UniversityStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			universityStatus: universityStatus ?? { $ne: UniversityStatus.DELETE },
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.universityModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember, // member ma'lumotlarini qo'shish va olish uchun
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0]; // birinchi elementni qaytarish kerak chunki aggregate har doim array qaytaradi va bizga faqat bitta element kerak bo'ladi, chunki biz paginatsiya qilamiz va har doim bitta page ni qaytaramiz, shuning uchun result[0] ni qaytaramiz.
	}

	public async getAllUniversitiesByAdmin(input: AllUniversitiesInquiry): Promise<Universities> {
		const { universityStatus, universityLocationList } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (universityStatus) match.universityStatus = universityStatus;
		if (universityLocationList) match.universityLocation = { $in: universityLocationList };

		const result = await this.universityModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' }, // array ni tushurib yuboradi
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateUniversityByAdmin(input: UniversityUpdate): Promise<University> {
		let { universityStatus, soldAt, deletedAt } = input;
		const search: T = {
			_id: input._id,
			universityStatus: UniversityStatus.ACTIVE,
		};
		if (universityStatus === UniversityStatus.SOLD) soldAt = moment().toDate();
		else if (universityStatus === UniversityStatus.DELETE) deletedAt = moment().toDate();

		const result = await this.universityModel
			.findOneAndUpdate(search, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		if (soldAt || deletedAt) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberUniversities',
				modifier: -1,
			});
		}
		return result;
	}

	public async removeUniversityByAdmin(universityId: ObjectId): Promise<University> {
		const search: T = { _id: universityId, universityStatus: UniversityStatus.DELETE };
		const result = await this.universityModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async universityStatsEditor(input: StatisticModifier): Promise<University> {
		const { _id, targetKey, modifier } = input;
		return await this.universityModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}
}
