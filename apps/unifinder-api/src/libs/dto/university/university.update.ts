import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { UniversityLocation, UniversityStatus, UniversityType } from '../../enums/university.enum';

@InputType()
export class UniversityUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => UniversityType, { nullable: true })
	universityType?: UniversityType;

	@IsOptional()
	@Field(() => UniversityStatus, { nullable: true })
	universityStatus?: UniversityStatus;

	@IsOptional()
	@Field(() => UniversityLocation, { nullable: true })
	universityLocation?: UniversityLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	universityAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	universityTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	universityPrice?: number;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	universitySquare?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	universityBeds?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	universityRooms?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	universityImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	universityDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	universityBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	universityRent?: boolean;

	soldAt?: Date;

	memberId?: ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	constructedAt?: Date;

	deletedAt?: Date;
}
