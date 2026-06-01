# Uni-Finder Backend — Documentation

## Project Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string)
- `.env` file at project root

### Environment Variables
```env
PORT_API=3000
NODE_ENV=DEVELOPMENT          # or PRODUCTION
MONGO_DEV=mongodb://localhost:27017/unifinder
MONGO_PROD=mongodb+srv://...  # only needed for production
SECRET_TOKEN=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token  # optional, for Telegram auth
```

### Install & Run
```bash
npm install

# Development (API server with hot reload)
npm run start:dev

# Development (batch server)
npm run start:dev:batch

# Production
npm run start:prod
npm run start:prod:batch

# Build
npm run build
```

### GraphQL Playground
Open `http://localhost:3000/graphql` — Apollo Sandbox is enabled by default.

### File Upload
Uploaded images are saved to `./uploads/<target>/<uuid>.<ext>` and served statically at `http://localhost:3000/uploads/<target>/<uuid>.<ext>`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     NestJS Monorepo                         │
│                                                             │
│  ┌──────────────────────────────┐  ┌─────────────────────┐ │
│  │     unifinder-api (:3000)    │  │  unifinder-batch    │ │
│  │                              │  │                     │ │
│  │  GraphQL (Apollo)            │  │  Cron scheduler     │ │
│  │  ├── AuthGuard               │  │  ├── batchRollback  │ │
│  │  ├── RolesGuard              │  │  ├── batchTopUnis   │ │
│  │  ├── WithoutGuard            │  │  └── batchTopAgents │ │
│  │  │                          │  │                     │ │
│  │  Components:                 │  └─────────────────────┘ │
│  │  ├── MemberModule            │              │            │
│  │  ├── UniversityModule        │              │            │
│  │  ├── BoardArticleModule      │              ▼            │
│  │  ├── CommentModule           │         MongoDB           │
│  │  ├── LikeModule              │  ┌─────────────────────┐ │
│  │  ├── ViewModule              │  │  Collections:       │ │
│  │  ├── FollowModule            │  │  members            │ │
│  │  └── AuthModule              │  │  universities       │ │
│  │                              │  │  boardArticles      │ │
│  │  SocketModule (WebSocket)    │  │  comments           │ │
│  └──────────────────────────────┘  │  likes              │ │
│                                    │  views              │ │
│                                    │  follows            │ │
│                                    │  notices            │ │
│                                    │  notifications      │ │
│                                    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow
```
Client → HTTP POST /graphql
  → LoggingInterceptor (logs request body)
  → ValidationPipe (validates InputType via class-validator)
  → Guard (AuthGuard | RolesGuard | WithoutGuard)
      → AuthService.verifyToken() → injects authMember into request.body
  → Resolver method
      → @AuthMember('_id') extracts memberId from request.body.authMember
  → Service method
      → Mongoose query / aggregate
  → LoggingInterceptor (logs response + duration)
  → GraphQL response
```

### Authentication Flow
1. Client sends `Authorization: Bearer <JWT>` header.
2. Guard calls `AuthService.verifyToken(token)` which uses `jwtService.verifyAsync`.
3. Verified member object is written to `request.body.authMember`.
4. `@AuthMember('_id')` param decorator reads it from the request.
5. JWT is created on signup/login/updateMember and contains the full member document (minus password).

---

## Module Structure Guide

### MemberModule
**File:** `components/member/`  
**Responsible for:** Registration, login, profile management, image upload, agent directory.  
**Depends on:** AuthModule, ViewModule, LikeModule, Follow schema  
**Exports:** MemberService (used by many other modules)

### UniversityModule
**File:** `components/university/`  
**Responsible for:** University CRUD, rich search/filter, favorites, visited history, ranking.  
**Depends on:** AuthModule, MemberModule, ViewModule, LikeModule  
**Only AGENT role** can create/update their own universities.  
**Admin role** can update or hard-delete any university.

### BoardArticleModule
**File:** `components/board-article/`  
**Responsible for:** Community posts (free, recommend, news, humor categories).  
**Depends on:** MemberModule, ViewModule, LikeModule

### CommentModule
**File:** `components/comment/`  
**Responsible for:** Comments on universities, articles, and members.  
**Depends on:** MemberModule, BoardArticleModule, UniversityModule  
When a comment is created it increments the `*Comments` counter on the target via the respective service's `*StatsEditor`.

### LikeModule
**File:** `components/like/`  
**No resolver** — purely a helper consumed by other modules.  
`toggleLike()` creates or deletes a like document and returns `+1` or `-1` for the caller to apply via `$inc`.  
Also implements `getFavoriteUniversities()` (used by UniversityService).

### ViewModule
**File:** `components/view/`  
**No resolver** — purely a helper.  
`recordView()` is idempotent: if the (memberId, viewRefId) pair already exists it returns null (no double-count).  
Also implements `getVisitedUniversities()` (used by UniversityService).

### FollowModule
**File:** `components/follow/`  
`subscribe` / `unsubscribe` update `memberFollowings` and `memberFollowers` counters on both members.  
Self-subscription is rejected at the service level.

### AuthModule
**File:** `components/auth/`  
**No resolver.** Provides three guards and the `@AuthMember` decorator.  
Re-exported by every module that needs guards.

### SocketModule
**File:** `socket/`  
Tracks number of connected WebSocket clients. Minimal implementation — no business logic yet.

---

## Database Entities and Relations

### Member
**Collection:** `members`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `memberType` | enum | USER, AGENT, ADMIN |
| `memberStatus` | enum | ACTIVE, BLOCK, DELETE |
| `memberAuthType` | enum | PHONE, TELEGRAM |
| `memberPhone` | String | unique, sparse |
| `memberNick` | String | unique, sparse |
| `memberPassword` | String | select: false |
| `memberFullName` | String | optional |
| `memberImage` | String | default '' |
| `memberAddress` | String | optional |
| `memberDesc` | String | optional |
| `memberUniversities` | Number | denormalized counter |
| `memberArticles` | Number | denormalized counter |
| `memberFollowers` | Number | denormalized counter |
| `memberFollowings` | Number | denormalized counter |
| `memberPoints` | Number | default 0 |
| `memberLikes` | Number | denormalized counter |
| `memberViews` | Number | denormalized counter |
| `memberComments` | Number | denormalized counter |
| `memberRank` | Number | computed by batch |
| `memberWarnings` | Number | default 0 |
| `memberBlocks` | Number | default 0 |
| `memberTelegramId` | Number | unique, sparse |
| `deletedAt` | Date | optional |
| `createdAt` | Date | timestamps |
| `updatedAt` | Date | timestamps |

### University
**Collection:** `universities`  
**Unique index:** `(universityType, universityLocation, universityName, universityTuition)`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `universityType` | enum | NATIONAL, PRIVATE, SCIENCE, ART, POLYTECHNIC |
| `universityStatus` | enum | ACTIVE, INACTIVE, DELETE |
| `universityLocation` | enum | SEOUL, BUSAN, INCHEON, DAEGU, GYEONGJU, GWANGJU, CHONJU, DAEJON, JEJU |
| `universityAddress` | String | required |
| `universityName` | String | required |
| `universityTuition` | Number | annual tuition in KRW |
| `universityCampusSize` | Number | in m² |
| `universityCapacity` | Number | total student capacity |
| `universityFaculties` | Number | number of faculties |
| `universityViews` | Number | denormalized counter |
| `universityLikes` | Number | denormalized counter |
| `universityComments` | Number | denormalized counter |
| `universityRank` | Number | computed by batch: likes×2 + views×1 |
| `universityImages` | [String] | required, array of upload paths |
| `universityDesc` | String | optional |
| `universityScholarship` | Boolean | default false |
| `universityDormitory` | Boolean | default false |
| `memberId` | ObjectId → Member | the agent who listed it |
| `soldAt` | Date | set when status → INACTIVE |
| `deletedAt` | Date | set when status → DELETE |
| `constructedAt` | Date | optional, year founded |

### BoardArticle
**Collection:** `boardArticles`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `articleCategory` | enum | FREE, RECOMMEND, NEWS, HUMOR |
| `articleStatus` | enum | ACTIVE, DELETE |
| `articleTitle` | String | required |
| `articleContent` | String | required |
| `articleImage` | String | optional |
| `articleLikes` | Number | counter |
| `articleViews` | Number | counter |
| `articleComments` | Number | counter |
| `memberId` | ObjectId → Member | author |

### Comment
**Collection:** `comments`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `commentStatus` | enum | ACTIVE, DELETE |
| `commentGroup` | enum | MEMBER, ARTICLE, UNIVERSITY |
| `commentContent` | String | required |
| `commentRefId` | ObjectId | target (university/article/member _id) |
| `memberId` | ObjectId → Member | author |

### Follow
**Collection:** `follows`  
**Unique index:** `(followingId, followerId)`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `followingId` | ObjectId → Member | the member being followed |
| `followerId` | ObjectId → Member | the member who follows |

### Like
**Collection:** `likes`  
**Unique index:** `(memberId, likeRefId)`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `likeGroup` | enum | MEMBER, UNIVERSITY, ARTICLE |
| `likeRefId` | ObjectId | target document _id |
| `memberId` | ObjectId → Member | who liked |

### View
**Collection:** `views`  
**Unique index:** `(memberId, viewRefId)` — one view per member per target

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `viewGroup` | enum | MEMBER, ARTICLE, UNIVERSITY |
| `viewRefId` | ObjectId | target document _id |
| `memberId` | ObjectId → Member | who viewed |

### Notice
**Collection:** `notices` — admin-managed announcements (no module wired yet)

| Field | Type | Notes |
|---|---|---|
| `noticeCategory` | enum | FAQ, TERMS, INQUIRY |
| `noticeStatus` | enum | HOLD, ACTIVE, DELETE |
| `noticeTitle` | String | required |
| `noticeContent` | String | required |
| `memberId` | ObjectId → Member | author (admin) |

### Notification
**Collection:** `notifications` — system notifications (no module wired yet)

| Field | Type | Notes |
|---|---|---|
| `notificationType` | enum | LIKE, COMMENT |
| `notificationStatus` | enum | WAIT, READ |
| `notificationGroup` | enum | MEMBER, ARTICLE, UNIVERSITY |
| `notificationTitle` | String | required |
| `notificationDesc` | String | optional |
| `authorId` | ObjectId → Member | who triggered the notification |
| `receiverId` | ObjectId → Member | recipient |
| `propertyId` | ObjectId | optional legacy reference |
| `articleId` | ObjectId → BoardArticle | optional |

---

## API Endpoints Reference

All operations are GraphQL via `POST /graphql`.

### Member Operations

#### Mutations

| Operation | Auth | Description |
|---|---|---|
| `signup(input: MemberInput): Member` | None | Register with nick, password, phone. Returns JWT. |
| `login(input: LoginInput): Member` | None | Login with nick + password. Returns JWT. |
| `telegramLogin(input: TelegramAuthInput): Member` | None | Login or register via Telegram widget data. Returns JWT. |
| `updateMember(input: MemberUpdate): Member` | AuthGuard | Update own profile. `_id` in input is ignored — uses JWT id. |
| `likeTargetMember(memberId: String): Member` | AuthGuard | Toggle like on a member. |
| `imageUploader(file: Upload, target: String): String` | AuthGuard | Upload single image. Returns file path. |
| `imagesUploader(files: [Upload], target: String): [String]` | AuthGuard | Upload multiple images. Returns array of file paths. |
| `updateMemberByAdmin(input: MemberUpdate): Member` | ADMIN | Admin can update any member (status, type, etc.). |

#### Queries

| Operation | Auth | Description |
|---|---|---|
| `checkAuth: String` | AuthGuard | Returns `Hi <nick>`. Auth smoke test. |
| `checkAuthRoles: String` | AGENT or USER | Returns nick + role. Role smoke test. |
| `getMember(memberId: String): Member` | WithoutGuard | Get a member profile. Records a view if authenticated. |
| `getAgents(input: AgentsInquiry): Members` | WithoutGuard | Paginated list of AGENT members. Filterable by nick text. |
| `getAllMembersByAdmin(input: MembersInquiry): Members` | ADMIN | Paginated all members with status/type filters. |

---

### University Operations

#### Mutations

| Operation | Auth | Description |
|---|---|---|
| `createUniversity(input: UniversityInput): University` | AGENT | Create a new university listing. |
| `updateUniversity(input: UniversityUpdate): University` | AGENT | Update own university. Setting status to INACTIVE sets `soldAt`. |
| `likeTargetUniversity(universityId: String): University` | AuthGuard | Toggle like. |
| `updateUniversityByAdmin(input: UniversityUpdate): University` | ADMIN | Admin update any university. |
| `removeUniversityByAdmin(universityId: String): University` | ADMIN | Hard-delete a university (must already be in DELETE status). |

#### Queries

| Operation | Auth | Description |
|---|---|---|
| `getUniversity(universityId: String): University` | WithoutGuard | Single university. Records view + `meLiked` if authenticated. Joins `memberData`. |
| `getUniversities(input: UniversitiesInquiry): Universities` | WithoutGuard | Filtered + paginated list. Joins `meLiked` and `memberData`. |
| `getAgentUniversities(input: AgentUniversitiesInquiry): Universities` | AGENT | Own universities by status. |
| `myFavorites(input: OrdinaryInquiry): Universities` | AuthGuard | Universities the user has liked. |
| `myVisited(input: OrdinaryInquiry): Universities` | AuthGuard | Universities the user has viewed. |
| `getAllUniversitiesByAdmin(input: AllUniversitiesInquiry): Universities` | ADMIN | All universities with status/location filters. |

**UniversitiesInquiry search fields:**
- `memberId` — filter by agent
- `locationList: [UniversityLocation]`
- `typeList: [UniversityType]`
- `facultiesList: [Int]`
- `capacityList: [Int]`
- `options: [String]` — `universityScholarship`, `universityDormitory`
- `pricesRange: { start, end }` — tuition range
- `squaresRange: { start, end }` — campus size range
- `periodsRange: { start, end }` — createdAt date range
- `text` — regex search on universityName

---

### Board Article Operations

#### Mutations

| Operation | Auth | Description |
|---|---|---|
| `createBoardArticle(input: BoardArticleInput): BoardArticle` | AuthGuard | Create a community post. |
| `updateBoardArticle(input: BoardArticleUpdate): BoardArticle` | AuthGuard | Update own post. Setting status DELETE decrements memberArticles. |
| `likeTargetBoardArticle(articleId: String): BoardArticle` | AuthGuard | Toggle like. |
| `updateBoardArticleByAdmin(input: BoardArticleUpdate): BoardArticle` | ADMIN | Admin update any article. |
| `removeBoardArticleByAdmin(articleId: String): BoardArticle` | ADMIN | Hard-delete (must be in DELETE status). |

#### Queries

| Operation | Auth | Description |
|---|---|---|
| `getBoardArticle(articleId: String): BoardArticle` | WithoutGuard | Single article. Records view + `meLiked`. Joins `memberData`. |
| `getBoardArticles(input: BoardArticlesInquiry): BoardArticles` | WithoutGuard | Filtered list by category / text / memberId. |
| `getAllBoardArticlesByAdmin(input: AllBoardArticlesInquiry): BoardArticles` | ADMIN | All articles with status/category filters. |

---

### Comment Operations

#### Mutations

| Operation | Auth | Description |
|---|---|---|
| `createComment(input: CommentInput): Comment` | AuthGuard | Create comment on a university, article, or member. Increments target's `*Comments` counter. |
| `updateComment(input: CommentUpdate): Comment` | AuthGuard | Update own active comment. |
| `removeCommentByAdmin(commentId: String): Comment` | ADMIN | Hard-delete any comment. |

#### Queries

| Operation | Auth | Description |
|---|---|---|
| `getComments(input: CommentsInquiry): Comments` | WithoutGuard | Paginated comments for a target (`commentRefId` required). Joins `memberData`. |

---

### Follow Operations

#### Mutations

| Operation | Auth | Description |
|---|---|---|
| `subscribe(input: String): Follower` | AuthGuard | Follow a member. Self-follow rejected. Increments both members' counters. |
| `unsubscribe(input: String): Follower` | AuthGuard | Unfollow. Decrements both counters. |

#### Queries

| Operation | Auth | Description |
|---|---|---|
| `getMemberFollowings(input: FollowInquiry): Followings` | WithoutGuard | Members that `followerId` follows. Includes `meFollowed[]` + `meLiked[]`. |
| `getMemberFollowers(input: FollowInquiry): Followers` | WithoutGuard | Members that follow `followingId`. Includes `meFollowed[]` + `meLiked[]`. |

---

## Batch Server

Runs as a separate process (`npm run start:dev:batch`).

| Method | What it does |
|---|---|
| `batchRollback()` | Resets all active university and agent ranks to 0 |
| `batchTopUniversities()` | Recomputes university ranks: `likes × 2 + views × 1` |
| `batchTopAgents()` | Recomputes agent ranks: `universities × 4 + articles × 3 + likes × 2 + views × 1` |

Intended to run as cron jobs (e.g. nightly): first call `batchRollback`, then `batchTopUniversities` + `batchTopAgents`.

---

## WebSocket

Endpoint: `ws://localhost:3000`  
The gateway tracks connected clients and echoes a `'Hello world!'` response to `message` events. Production notification delivery is not yet implemented.
