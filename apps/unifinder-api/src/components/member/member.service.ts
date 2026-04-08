import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { LoginInput, MemberInput } from '../../libs/dto/member/member.input';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum copy';

@Injectable()
export class MemberService {
	constructor(@InjectModel('Member') private readonly memberModel: Model<Member>) {}

	// SIGN UP
	public async signup(input: MemberInput): Promise<Member> {
		// Hash password

		try {
			const result = await this.memberModel.create(input);
			// Authentication proccess with Token
			return result;
		} catch (err) {
			console.log(' Error, Service.model:', err.message);
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	// LOGIN
	public async login(input: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = input;
		const response: Member = await this.memberModel
			.findOne({ memberNick: memberNick })
			.select('+memberPassword')
			.exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = memberPassword === response.memberPassword;
		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

		return response;
	}

	// UPDATE MEMBER
	public async updateMember(): Promise<string> {
		return 'updateMember executed!';
	}

	// GET MEMBER
	public async getMember(): Promise<string> {
		return 'getMember executed!';
	}
}
