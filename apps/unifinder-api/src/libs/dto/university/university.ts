import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { Member, TotalCounter } from '../member/member';
import { UniversityLocation, UniversityStatus, UniversityType } from '../../enums/university.enum';

@ObjectType()
export class University {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => UniversityType)
	universityType: UniversityType;

	@Field(() => UniversityStatus)
	universityStatus: UniversityStatus;

	@Field(() => UniversityLocation)
	universityLocation: UniversityLocation;

	@Field(() => String)
	universityAddress: string;

	@Field(() => String)
	universityTitle: string;

	@Field(() => Number)
	universityPrice: number;

	@Field(() => Number)
	universitySquare: number;

	@Field(() => Int)
	universityBeds: number;

	@Field(() => Int)
	universityRooms: number;

	@Field(() => Int)
	universityViews: number;

	@Field(() => Int)
	universityLikes: number;

	@Field(() => Int)
	universityComments: number;

	@Field(() => Int)
	universityRank: number;

	@Field(() => [String])
	universityImages: string[];

	@Field(() => String, { nullable: true })
	universityDesc?: String;

	@Field(() => Boolean)
	universityBarter: boolean;

	@Field(() => Boolean)
	universityRent: boolean;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date, { nullable: true })
	constructedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from agrigations **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Universities {
	@Field(() => [University])
	list: University[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
