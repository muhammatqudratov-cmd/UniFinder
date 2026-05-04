import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'apps/unifinder-api/src/libs/dto/member/member';
import { University } from 'apps/unifinder-api/src/libs/dto/university/university';
import { MemberStatus, MemberType } from 'apps/unifinder-api/src/libs/enums/member.enum';
import { UniversityStatus } from 'apps/unifinder-api/src/libs/enums/university.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('University') private readonly universityModel: Model<University>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.universityModel
			.updateMany(
				// birinchii arguenti filter boladi
				{
					universityStatus: UniversityStatus.ACTIVE,
				},
				{ universityRank: 0 }, // 0 ga tenglavoldik
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					memberType: MemberType.AGENT,
				},
				{ memberRank: 0 },
			)
			.exec();
	}

	public async batchTopUniversities(): Promise<void> {
		const universities: University[] = await this.universityModel
			.find({
				universityStatus: UniversityStatus.ACTIVE,
				universityRank: 0,
			})
			.exec();

		const promisedList = universities.map(async (ele: University) => {
			const { _id, universityLikes, universityViews } = ele;
			const rank = universityLikes * 2 + universityViews * 1;
			return await this.universityModel.findByIdAndUpdate(_id, { universityRank: rank });
		});
		await Promise.all(promisedList); // yuqoridagi mantiqni ishltish uchun kerak boladi
	}
	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberUniversities, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberUniversities * 4 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}
	public getHello(): string {
		return 'Welcome to Nestar Batch Server!';
	}
}
