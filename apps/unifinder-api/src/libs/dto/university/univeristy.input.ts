import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { availableUniversitySorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { UniversityLocation, UniversityStatus, UniversityType } from '../../enums/university.enum';

@InputType()
export class UniversityInput {
	@IsNotEmpty()
	@Field(() => UniversityType)
	universityType: UniversityType;

	@IsNotEmpty()
	@Field(() => UniversityLocation)
	universityLocation: UniversityLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	universityAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	universityName: string;

	@IsNotEmpty()
	@Field(() => Number)
	universityTuition: number;

	@IsNotEmpty()
	@Field(() => Number)
	universityCampusSize: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	universityCapacity: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	universityFaculties: number;

	@IsNotEmpty()
	@Field(() => [String])
	universityImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	universityDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	universityScholarship?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	universityDormitory?: boolean;

	memberId: ObjectId;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	constructedAt?: Date;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class SquaresRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class PISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [UniversityLocation], { nullable: true })
	locationList?: UniversityLocation[];

	@IsOptional()
	@Field(() => [UniversityType], { nullable: true })
	typeList?: UniversityType[];

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	facultiesList?: Number[];

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	capacityList?: Number[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	options?: string[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => SquaresRange, { nullable: true })
	squaresRange?: SquaresRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class UniveristiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableUniversitySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
class APISearch {
	@IsOptional()
	@Field(() => UniversityStatus, { nullable: true })
	universityStatus?: UniversityStatus;
}

@InputType()
export class AgentUniversitiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableUniversitySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search: APISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => UniversityStatus, { nullable: true })
	universityStatus?: UniversityStatus;

	@IsOptional()
	@Field(() => [UniversityLocation], { nullable: true })
	universityLocationList?: UniversityLocation[];
}

@InputType()
export class AllUniversitiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableUniversitySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
