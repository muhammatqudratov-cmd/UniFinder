import { Schema } from 'mongoose';
import { UniversityLocation, UniversityStatus, UniversityType } from '../libs/enums/university.enum';

const UniversitySchema = new Schema(
	{
		universityType: {
			type: String,
			enum: UniversityType,
			required: true,
		},

		universityStatus: {
			type: String,
			enum: UniversityStatus,
			default: UniversityStatus.ACTIVE,
		},

		universityLocation: {
			type: String,
			enum: UniversityLocation,
			required: true,
		},

		universityAddress: {
			type: String,
			required: true,
		},

		universityName: {
			type: String,
			required: true,
		},

		universityTuition: {
			type: Number,
			required: true,
		},

		universityCampusSize: {
			type: Number,
			required: true,
		},

		universityCapacity: {
			type: Number,
			required: true,
		},

		universityFaculties: {
			type: Number,
			required: true,
		},

		universityViews: {
			type: Number,
			default: 0,
		},

		universityLikes: {
			type: Number,
			default: 0,
		},

		universityComments: {
			type: Number,
			default: 0,
		},

		universityRank: {
			type: Number,
			default: 0,
		},

		universityImages: {
			type: [String],
			required: true,
		},

		universityDesc: {
			type: String,
		},

		universityScholarship: {
			type: Boolean,
			default: false,
		},

		universityDormitory: {
			type: Boolean,
			default: false,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		soldAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},

		constructedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'universities' },
);

UniversitySchema.index(
	{ universityType: 1, universityLocation: 1, universityName: 1, universityPrice: 1 },
	{ unique: true },
);

export default UniversitySchema;
