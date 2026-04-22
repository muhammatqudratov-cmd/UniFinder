import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	UNIVERSITY = 'UNIVERSITY',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
