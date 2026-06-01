# Uni-Finder Backend — Agent Instruction

## Backend Overview

Uni-Finder is a NestJS **code-first GraphQL** API for a university discovery platform. It lets students browse Korean universities, agents list universities they represent, and all users interact via likes, comments, follows, and board articles.

**What the API provides:**
- Member auth (phone/password signup, JWT login, Telegram OAuth)
- University CRUD with rich search/filter, like/favorite/visit tracking
- Community board (articles + comments with like support)
- Social graph (follow/unfollow members, view follower/following lists)
- Image upload (single and multi-file, stored under `uploads/`)
- Real-time connection tracking via WebSocket gateway
- Admin panel operations (manage members, universities, articles, comments)
- Batch rank computation via a separate scheduled microservice

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | NestJS 10 |
| API protocol | GraphQL (code-first) via `@nestjs/graphql` + Apollo Server 4 |
| ORM / DB | Mongoose 8 + MongoDB (`@nestjs/mongoose`) |
| Auth | JWT (`@nestjs/jwt`, 10-day expiry) + bcryptjs |
| File upload | `graphql-upload` (max 15 MB, max 10 files) |
| WebSockets | `ws` via `@nestjs/platform-ws` |
| Scheduling | `@nestjs/schedule` (batch app only) |
| Validation | `class-validator` + `class-transformer` via global `ValidationPipe` |
| Config | `@nestjs/config` (reads `.env`) |

---

## Folder / Module Structure

```
apps/
├── unifinder-api/          # Main GraphQL server (PORT_API, default 3000)
│   └── src/
│       ├── app.module.ts           # Root module; wires GraphQL, DB, Components, Socket
│       ├── main.ts                 # Bootstrap: pipes, interceptors, CORS, uploads, WS
│       ├── components/             # All feature modules
│       │   ├── components.module.ts    # Barrel that imports every feature module
│       │   ├── auth/               # JWT helpers, guards, decorators (no resolver)
│       │   │   ├── auth.service.ts     # hashPassword, comparePasswords, createToken, verifyToken, validateTelegramAuth
│       │   │   ├── guards/             # AuthGuard (required), RolesGuard (role-based), WithoutGuard (optional)
│       │   │   └── decorators/         # @AuthMember(), @Roles()
│       │   ├── member/             # Users & agents — signup, login, profile, image upload
│       │   ├── university/         # University listings — full CRUD + search
│       │   ├── board-article/      # Community posts
│       │   ├── comment/            # Comments on universities, articles, and members
│       │   ├── like/               # Like toggle + favorite university list (no resolver)
│       │   ├── view/               # View deduplication + visited university list (no resolver)
│       │   └── follow/             # Subscribe / unsubscribe between members
│       ├── database/
│       │   └── database.module.ts  # MongooseModule.forRootAsync; reads MONGO_DEV / MONGO_PROD
│       ├── schemas/                # Raw Mongoose Schema definitions (PascalCase .model.ts)
│       │   ├── Member.model.ts
│       │   ├── University.model.ts
│       │   ├── BoardArticle.model.ts
│       │   ├── Comment.model.ts
│       │   ├── Follow.model.ts
│       │   ├── Like.model.ts
│       │   ├── View.model.ts
│       │   ├── Notice.model.ts         # schema only, no module yet
│       │   └── Notification.model.ts   # schema only, no module yet
│       ├── libs/
│       │   ├── config.ts           # Sort allowlists, image helpers, MongoDB $lookup pipeline helpers
│       │   ├── dto/                # GraphQL ObjectTypes (responses) and InputTypes (requests)
│       │   │   ├── member/         # member.ts, member.input.ts, member.update.ts
│       │   │   ├── university/     # university.ts, univeristy.input.ts, university.update.ts
│       │   │   ├── board-article/
│       │   │   ├── comment/
│       │   │   ├── follow/
│       │   │   ├── like/
│       │   │   └── view/
│       │   ├── enums/              # All GraphQL-registered enums (one file per domain)
│       │   ├── types/
│       │   │   └── common.ts       # T (any-object alias), StatisticModifier interface
│       │   └── interceptor/
│       │       └── Logging.interceptor.ts   # Logs every GraphQL request/response + duration
│       └── socket/
│           └── socket.gateway.ts   # WebSocket gateway — tracks connected client count
└── unifinder-batch/        # Scheduled rank computation (separate process)
    └── src/
        ├── batch.module.ts     # Imports ScheduleModule, University + Member models
        └── batch.service.ts    # batchRollback, batchTopUniversities, batchTopAgents
```

---

## Coding Conventions

### GraphQL: code-first, dual-class pattern
Every domain has two files:
- `dto/foo/foo.ts` — `@ObjectType()` classes returned by the API
- `dto/foo/foo.input.ts` — `@InputType()` classes accepted as arguments
- `dto/foo/foo.update.ts` — `@InputType()` for partial updates (always includes `_id`)

### Three-guard system
```ts
@UseGuards(AuthGuard)         // JWT required; throws if no/invalid token
@UseGuards(WithoutGuard)      // JWT optional; sets authMember = null if absent
@Roles(MemberType.AGENT)
@UseGuards(RolesGuard)        // JWT required AND role must match @Roles()
```
Decorators are stacked **above** `@Query`/`@Mutation`, applied bottom-to-top.

### Authenticated member injection
```ts
@AuthMember('_id') memberId: ObjectId   // extract one field
@AuthMember() authMember: Member        // extract whole member object
```
The guard writes `request.body.authMember`; the decorator reads it.

### Pagination pattern
Every list query uses `{ page, limit, sort?, direction?, search }`. Services always:
1. Build a `match` object from `search`
2. Run `$facet` with `list` (skip/limit + lookups) and `metaCounter` (`$count: 'total'`)
3. Return `result[0]` which is `{ list: T[], metaCounter: [{ total: number }] }`

### Stats counter pattern
All counters (likes, views, comments, rank) are updated with:
```ts
await this.fooService.fooStatsEditor({ _id, targetKey: 'fooLikes', modifier: +1 | -1 });
// internally: findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
```
Never assign counters directly — always use `$inc`.

### ObjectId conversion
Any string ID coming from a GraphQL argument must be converted before use:
```ts
const id = shapeIntoMongoObjectId(input); // returns ObjectId if string, passthrough otherwise
```

### Mongoose pipeline helpers (`libs/config.ts`)
- `lookupMember` — joins `members` on `memberId`
- `lookupAuthMemberLiked(memberId)` — joins `likes` to populate `meLiked[]`
- `lookupAuthMemberFollowed({ followerId, followingId })` — joins `follows` to populate `meFollowed[]`
- `lookupFollowingData` / `lookupFollowerData` — follow-specific member joins

### Enum registration
Every enum must call `registerEnumType(Enum, { name: 'Enum' })` directly after its definition.

### Schema definition vs DTO
Schemas live in `schemas/*.model.ts` using raw `new Schema({})`. DTOs live in `libs/dto/` using NestJS GraphQL decorators. They are **separate**; keep them that way.

---

## Hard Rules

1. **Never trust `memberId` from client input.** Always inject it server-side from `@AuthMember('_id')` and assign `input.memberId = memberId` in the resolver before passing to the service.

2. **`memberPassword` is never returned.** It is `select: false` in the schema. The JWT payload explicitly deletes it before signing.

3. **Only AGENT role creates/updates universities.** Guard: `@Roles(MemberType.AGENT) @UseGuards(RolesGuard)`.

4. **Only ADMIN role performs hard deletes or bypasses status restrictions.**

5. **Stats counters are only modified via `$inc`.** Direct assignment breaks the integrity of denormalized counters.

6. **Uniqueness is enforced at the schema level with compound indexes:**
   - University: `(universityType, universityLocation, universityName, universityTuition)`
   - Follow: `(followingId, followerId)`
   - Like: `(memberId, likeRefId)`
   - View: `(memberId, viewRefId)`

7. **All enums must be registered with `registerEnumType` for GraphQL.** Missing registration causes runtime schema errors.

8. **Image files are served statically from `uploads/`.** The path returned to the client (`uploads/<target>/<uuid>.<ext>`) is the URL path — store it as-is.

9. **Soft-delete pattern:** status → `DELETE` first (via `findOneAndUpdate`), then hard-delete only after status is already `DELETE` (via `findOneAndDelete`). The university resolver's `removeUniversityByAdmin` enforces this.

10. **Batch server is a separate NestJS app.** It shares schemas from the API app but has its own `DatabaseModule` and runs on a different port. Never import batch logic into the API app.
