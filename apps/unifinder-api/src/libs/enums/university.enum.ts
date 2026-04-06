import { registerEnumType } from '@nestjs/graphql';

export enum UniversityType {
	NATIONAL = 'NATIONAL',
	PRIVATE = 'PRIVATE',
	SCIENCE = 'SCIENCE',
	ART = 'ART',
	POLYTECHNIC = 'POLYTECHNIC',
}
registerEnumType(UniversityType, {
	name: 'UniversityType',
});
export enum UniversityStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(UniversityStatus, {
	name: 'UniversityStatus',
});

export enum UniversityLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(UniversityLocation, {
	name: 'UniversityLocation',
});
