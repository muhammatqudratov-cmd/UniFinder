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

		universityTitle: {
			type: String,
			required: true,
		},

		universityPrice: {
			type: Number,
			required: true,
		},

		universitySquare: {
			type: Number,
			required: true,
		},

		universityBeds: {
			type: Number,
			required: true,
		},

		universityRooms: {
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

		universityBarter: {
			type: Boolean,
			default: false,
		},

		universityRent: {
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

UniversitySchema.index({ universityType: 1, universityLocation: 1, universityTitle: 1, universityPrice: 1 }, { unique: true });

export default UniversitySchema;