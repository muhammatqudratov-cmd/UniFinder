import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './university/university.module';

@Module({
	imports: [MemberModule, PropertyModule],
})
export class ComponentsModule {}
