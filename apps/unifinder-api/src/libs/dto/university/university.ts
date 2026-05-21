import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { UniversityLocation, UniversityStatus, UniversityType } from '../../enums/university.enum';
import { MeLiked } from '../like/like';

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
	universityName: string;

	@Field(() => Number)
	universityTuition: number;

	@Field(() => Number)
	universityCampusSize: number;

	@Field(() => Int)
	universityCapacity: number;

	@Field(() => Int)
	universityFaculties: number;

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

	@Field(() => Boolean, { nullable: true })
	universityScholarship?: boolean;

	@Field(() => Boolean, { nullable: true })
	universityDormitory?: boolean;

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

	/** from aggregations **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Universities {
	@Field(() => [University])
	list: University[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
