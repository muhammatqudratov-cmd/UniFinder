# Uni-Finder Backend Skills

Repeatable step-by-step workflows for common Uni-Finder backend tasks.

---

## Skill 1 — Create a New NestJS Module (full: module + resolver + service)

> Example: adding a `Review` module.

### Step 1 — Enum file
`apps/unifinder-api/src/libs/enums/review.enum.ts`
```ts
import { registerEnumType } from '@nestjs/graphql';

export enum ReviewStatus {
  ACTIVE = 'ACTIVE',
  DELETE = 'DELETE',
}
registerEnumType(ReviewStatus, { name: 'ReviewStatus' });
```

### Step 2 — Mongoose schema
`apps/unifinder-api/src/schemas/Review.model.ts`
```ts
import { Schema } from 'mongoose';
import { ReviewStatus } from '../libs/enums/review.enum';

const ReviewSchema = new Schema(
  {
    reviewStatus: { type: String, enum: ReviewStatus, default: ReviewStatus.ACTIVE },
    reviewContent: { type: String, required: true },
    reviewRefId: { type: Schema.Types.ObjectId, required: true },
    memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
  },
  { timestamps: true, collection: 'reviews' },
);

export default ReviewSchema;
```

### Step 3 — DTO response class
`apps/unifinder-api/src/libs/dto/review/review.ts`
```ts
import { Field, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ReviewStatus } from '../../enums/review.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class Review {
  @Field(() => String)  _id: ObjectId;
  @Field(() => ReviewStatus) reviewStatus: ReviewStatus;
  @Field(() => String) reviewContent: string;
  @Field(() => String) reviewRefId: ObjectId;
  @Field(() => String) memberId: ObjectId;
  @Field(() => Date) createdAt: Date;
  @Field(() => Date) updatedAt: Date;

  @Field(() => Member, { nullable: true }) memberData?: Member;
}

@ObjectType()
export class Reviews {
  @Field(() => [Review]) list: Review[];
  @Field(() => [TotalCounter], { nullable: true }) metaCounter: TotalCounter[];
}
```

### Step 4 — DTO input class
`apps/unifinder-api/src/libs/dto/review/review.input.ts`
```ts
import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ReviewInput {
  @IsNotEmpty()
  @Length(1, 200)
  @Field(() => String)
  reviewContent: string;

  @IsNotEmpty()
  @Field(() => String)
  reviewRefId: ObjectId;

  memberId?: ObjectId;  // injected server-side
}

@InputType()
class RISearch {
  @IsNotEmpty()
  @Field(() => String)
  reviewRefId: ObjectId;
}

@InputType()
export class ReviewsInquiry {
  @IsNotEmpty() @Min(1) @Field(() => Int) page: number;
  @IsNotEmpty() @Min(1) @Field(() => Int) limit: number;
  @IsOptional() @Field(() => Direction, { nullable: true }) direction?: Direction;
  @IsNotEmpty() @Field(() => RISearch) search: RISearch;
}
```

### Step 5 — Service
`apps/unifinder-api/src/components/review/review.service.ts`
```ts
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Review, Reviews } from '../../libs/dto/review/review';
import { ReviewInput, ReviewsInquiry } from '../../libs/dto/review/review.input';
import { Message, Direction } from '../../libs/enums/common.enum';
import { ReviewStatus } from '../../libs/enums/review.enum';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';

@Injectable()
export class ReviewService {
  constructor(@InjectModel('Review') private readonly reviewModel: Model<Review>) {}

  public async createReview(memberId: ObjectId, input: ReviewInput): Promise<Review> {
    input.memberId = memberId;
    try {
      return await this.reviewModel.create(input);
    } catch (err) {
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getReviews(memberId: ObjectId, input: ReviewsInquiry): Promise<Reviews> {
    const { reviewRefId } = input.search;
    const match: T = { reviewRefId, reviewStatus: ReviewStatus.ACTIVE };
    const sort: T = { createdAt: input.direction ?? Direction.DESC };

    const result = await this.reviewModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupMember,
            { $unwind: '$memberData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]).exec();
    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return result[0];
  }
}
```

### Step 6 — Resolver
`apps/unifinder-api/src/components/review/review.resolver.ts`
```ts
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ReviewService } from './review.service';
import { Review, Reviews } from '../../libs/dto/review/review';
import { ReviewInput, ReviewsInquiry } from '../../libs/dto/review/review.input';

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @Mutation(() => Review)
  public async createReview(
    @Args('input') input: ReviewInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Review> {
    console.log('Mutation: createReview');
    return await this.reviewService.createReview(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query(() => Reviews)
  public async getReviews(
    @Args('input') input: ReviewsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Reviews> {
    console.log('Query: getReviews');
    input.search.reviewRefId = shapeIntoMongoObjectId(input.search.reviewRefId);
    return await this.reviewService.getReviews(memberId, input);
  }
}
```

### Step 7 — Module
`apps/unifinder-api/src/components/review/review.module.ts`
```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ReviewSchema from '../../schemas/Review.model';
import { AuthModule } from '../auth/auth.module';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Review', schema: ReviewSchema }]),
    AuthModule,
  ],
  providers: [ReviewResolver, ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
```

### Step 8 — Register in ComponentsModule
In `apps/unifinder-api/src/components/components.module.ts`, add:
```ts
import { ReviewModule } from './review/review.module';
// ...
@Module({ imports: [ ...existingModules, ReviewModule ] })
```

---

## Skill 2 — Create a GraphQL Query and Mutation

### Query (public, with optional auth)
```ts
@UseGuards(WithoutGuard)
@Query(() => University)
public async getUniversity(
  @Args('universityId') input: string,      // raw string from client
  @AuthMember('_id') memberId: ObjectId,    // null if not logged in
): Promise<University> {
  console.log('Query: getUniversity');
  const universityId = shapeIntoMongoObjectId(input);
  return await this.universityService.getUniversity(memberId, universityId);
}
```

### Mutation (authenticated + role-restricted)
```ts
@Roles(MemberType.AGENT)
@UseGuards(RolesGuard)
@Mutation(() => University)
public async createUniversity(
  @Args('input') input: UniversityInput,
  @AuthMember('_id') memberId: ObjectId,
): Promise<University> {
  console.log('Mutation: createUniversity');
  input.memberId = memberId;  // always inject server-side
  return await this.universityService.createUniversity(input);
}
```

### Guard selection guide
| Scenario | Guard |
|---|---|
| Any logged-in user | `@UseGuards(AuthGuard)` |
| Specific role(s) | `@Roles(MemberType.AGENT) @UseGuards(RolesGuard)` |
| Logged in or not (personalized results) | `@UseGuards(WithoutGuard)` |
| Fully public, no personalization | No guard |

---

## Skill 3 — Create an Entity with Relations

**Relation to Member (many-to-one):**
```ts
// In the Mongoose schema
memberId: {
  type: Schema.Types.ObjectId,
  required: true,
  ref: 'Member',
},
```

**Join member data in aggregation (GraphQL ObjectType):**
```ts
// In the DTO @ObjectType()
@Field(() => Member, { nullable: true })
memberData?: Member;
```
```ts
// In the service aggregate pipeline
lookupMember,           // from libs/config.ts
{ $unwind: '$memberData' },
```

**Compound unique index (prevent duplicates):**
```ts
// After schema definition
FooSchema.index({ memberId: 1, fooRefId: 1 }, { unique: true });
```

**Self-referencing (follow pattern):**
```ts
followingId: { type: Schema.Types.ObjectId, required: true },
followerId:  { type: Schema.Types.ObjectId, required: true },
// Unique pair:
FollowSchema.index({ followingId: 1, followerId: 1 }, { unique: true });
```

---

## Skill 4 — Create a DTO (InputType)

### Input DTO structure
```ts
@InputType()
export class FooInput {
  // Required fields
  @IsNotEmpty()
  @Field(() => FooType)
  fooType: FooType;

  @IsNotEmpty()
  @Length(3, 100)
  @Field(() => String)
  fooName: string;

  @IsNotEmpty()
  @Field(() => Number)
  fooValue: number;

  // Optional fields
  @IsOptional()
  @Field(() => String, { nullable: true })
  fooDesc?: string;

  // Server-injected — no @Field decorator
  memberId?: ObjectId;
}
```

### Inquiry (paginated list) DTO
```ts
@InputType()
class FooISearch {
  @IsOptional()
  @Field(() => FooStatus, { nullable: true })
  fooStatus?: FooStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  text?: string;
}

@InputType()
export class FoosInquiry {
  @IsNotEmpty() @Min(1) @Field(() => Int) page: number;
  @IsNotEmpty() @Min(1) @Field(() => Int) limit: number;

  @IsOptional()
  @IsIn(availableFooSorts)   // add to libs/config.ts
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => FooISearch)
  search: FooISearch;
}
```

### Update DTO
```ts
@InputType()
export class FooUpdate {
  @IsNotEmpty()
  @Field(() => String)
  _id: ObjectId;        // always required

  @IsOptional()
  @Field(() => FooStatus, { nullable: true })
  fooStatus?: FooStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  fooName?: string;

  deletedAt?: Date;     // no @Field — set server-side only
}
```

---

## Skill 5 — Add a New Field to Existing Schema

> Example: adding `universityWebsite: string` to University.

### 1 — Mongoose schema (`schemas/University.model.ts`)
```ts
universityWebsite: {
  type: String,
},
```

### 2 — GraphQL ObjectType (`libs/dto/university/university.ts`)
```ts
@Field(() => String, { nullable: true })
universityWebsite?: string;
```

### 3 — Input DTO (`libs/dto/university/univeristy.input.ts`)
```ts
@IsOptional()
@Field(() => String, { nullable: true })
universityWebsite?: string;
```

### 4 — Update DTO (`libs/dto/university/university.update.ts`)
```ts
@IsOptional()
@Field(() => String, { nullable: true })
universityWebsite?: string;
```

No resolver or service changes needed — Mongoose `findOneAndUpdate` passes the field through automatically.

### Adding a filterable field
If the field should be searchable, add it to the `PISearch` inner class in the input DTO AND handle it in the service's `shapeMatchQuery` method:
```ts
if (websiteSearch) match.universityWebsite = { $regex: new RegExp(websiteSearch, 'i') };
```
