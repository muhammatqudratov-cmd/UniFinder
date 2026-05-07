import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Member } from '../../libs/dto/member/member';
import { TelegramAuthInput } from '../../libs/dto/member/member.input';
import { JwtService } from '@nestjs/jwt';
import { T } from '../../libs/types/common';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const payload: T = {};
		Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
			payload[`${ele}`] = member[`${ele}`];
		});
		delete payload.memberPassword;

		return await this.jwtService.signAsync(payload);
	}

	public async verifyToken(token: string): Promise<Member> {
		const member = await this.jwtService.verifyAsync(token);
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}

	public validateTelegramAuth(input: TelegramAuthInput): boolean {
		const { hash, ...data } = input;

		const checkString = Object.keys(data)
			.sort()
			.map((key) => `${key}=${data[key]}`)
			.join('\n');

		const secretKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN).digest();
		const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
		const isExpired = Date.now() / 1000 - Number(data.auth_date) > 86400;

		return computedHash === hash && !isExpired;
	}
}
