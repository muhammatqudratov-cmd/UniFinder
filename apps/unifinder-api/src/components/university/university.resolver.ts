import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { UniversityService } from './university.service';
import {
	AgentUniversitiesInquiry,
	AllUniversitiesInquiry,
	OrdinaryInquiry,
	UniveristiesInquiry,
	UniversityInput,
} from '../../libs/dto/university/univeristy.input';
import { UniversityUpdate } from '../../libs/dto/university/university.update';
import { Universities, University } from '../../libs/dto/university/university';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class UniversityResolver {
	constructor(private readonly universityService: UniversityService) {}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => University)
	public async createUniversity(
		@Args('input') input: UniversityInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<University> {
		console.log('Mutation: createUniversity');
		input.memberId = memberId;
		return await this.universityService.createUniversity(input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => University)
	public async getUniversity(
		@Args('universityId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<University> {
		console.log('Query: getUniversity');
		const universityId = shapeIntoMongoObjectId(input);
		return await this.universityService.getUniversity(memberId, universityId);
	}

	@Roles(MemberType.AGENT) // Authur
	@UseGuards(RolesGuard)
	@Mutation((returns) => University)
	public async updateUniversity(
		@Args('input') input: UniversityUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<University> {
		console.log('Mutation: updateUniversity');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.universityService.updateUniversity(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Universities)
	public async getUniversities(
		@Args('input') input: UniveristiesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Universities> {
		console.log('Query: getUniversities');
		return await this.universityService.getUniversities(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Universities)
	public async myFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Universities> {
		console.log('Query: myFavorites');
		return await this.universityService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Universities)
	public async myVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Universities> {
		console.log('Query: myVisited');
		return await this.universityService.getVisited(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query((returns) => Universities)
	public async getAgentUniversities(
		@Args('input') input: AgentUniversitiesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Universities> {
		console.log('Query: getAgentUniversities');
		return await this.universityService.getAgentUniversities(memberId, input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Universities)
	public async getAllUniversitiesByAdmin(
		@Args('input') input: AllUniversitiesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Universities> {
		console.log('Query: getAllUniversitiesByAdmin');
		return await this.universityService.getAllUniversitiesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => University)
	public async updateUniversityByAdmin(@Args('input') input: UniversityUpdate): Promise<University> {
		console.log('Mutation: updateUniversityByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.universityService.updateUniversityByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => University)
	public async removeUniversityByAdmin(@Args('universityId') input: string): Promise<University> {
		console.log('Mutation: removeUniversityByAdmin');
		const universityId = shapeIntoMongoObjectId(input);
		return await this.universityService.removeUniversityByAdmin(universityId);
	}
}
