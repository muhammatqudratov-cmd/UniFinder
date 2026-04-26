import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViewModule } from '../view/view.module';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import UniversitySchema from '../../schemas/University.model';
import { UniversityService } from './university.service';
import { UniversityResolver } from './university.resolver';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'University', schema: UniversitySchema }]),
		ViewModule,
		AuthModule,
		MemberModule,
		LikeModule,
	],
	providers: [UniversityResolver, UniversityService],
	exports: [UniversityService],
})
export class UniversityModule {}
