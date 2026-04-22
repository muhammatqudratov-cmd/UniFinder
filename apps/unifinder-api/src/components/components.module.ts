import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { UniversityModule } from './university/university.module';

@Module({
	imports: [MemberModule, UniversityModule],
})
export class ComponentsModule {}
