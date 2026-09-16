# Coaching Management System — Phase 2

Multi-institute-ready Coaching Management System. Phase 1 scope: **Auth (JWT + Role-based)**,
**Institutes**, **Users**, **Teachers**, **Subjects**, **Batches**, **Students**.
Attendance, Fees/Payments, Homework, Exam & Results, Reports — Phase 2+ এ যোগ হবে।

## Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, JWT (Passport), Swagger, class-validator
- **Frontend (Admin)**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router
- **Shared**: `packages/types` — backend আর frontend দুই জায়গায় একই TypeScript types

## Folder Structure

```
coaching-management-system/
├── apps/
│   ├── api/            # NestJS backend
│   └── admin-web/       # React admin panel
├── packages/
│   └── types/           # Shared TS types
├── docker/
│   └── docker-compose.yml   # Local PostgreSQL
└── docs/
```

## Local Setup

### 1. Database (PostgreSQL via Docker)

```bash
cd docker
docker compose up -d
```

Docker না থাকলে, নিজের PostgreSQL-এ `coaching_management` নামে একটা database বানিয়ে নিন,
আর `apps/api/.env`-এ credentials বসিয়ে দিন।

### 2. Backend (NestJS API)

```bash
cd apps/api
cp .env.example .env
npm install
npm run start:dev
```

- API: `http://localhost:4000/api/v1`
- Swagger docs: `http://localhost:4000/api/docs`

API চালু হওয়ার সময় বাকি থাকা database migration নিজে থেকেই চলে (নতুন database-এ সব table তৈরি হয়,
পুরোনো database-এ শুধু নতুন পরিবর্তন যোগ হয়)। তারপর demo institute, admin, চলতি session আর class বসাতে:

```bash
npm run seed
```

এটা বানাবে:
- Institute: **Demo Coaching Center**
- Admin login: `admin@democoaching.com` / `Admin@123`
- চলতি বছরের session আর Class 6 থেকে HSC 2nd Year পর্যন্ত class

### 3. Frontend (Admin Panel)

```bash
cd apps/admin-web
cp .env.example .env
npm install
npm run dev
```

- Admin panel: `http://localhost:5173`
- উপরের seed করা admin credentials দিয়ে লগইন করুন।

## API Overview (Phase 1)

| Method | Endpoint            | বর্ণনা                                                     | Role                            |
|--------|----------------------|--------------------------------------------------------------|----------------------------------|
| POST   | `/auth/login`         | Login → access + refresh token                                | Public                           |
| POST   | `/auth/refresh`        | Refresh token দিয়ে নতুন token pair (পুরোনোটা বাতিল)             | Public (valid refresh token)     |
| POST   | `/auth/logout`         | Refresh token বাতিল                                           | Public (valid refresh token)     |
| GET    | `/auth/me`             | Current logged-in user                                        | Authenticated                    |
| GET    | `/institutes`         | সব institute (SaaS mode এর জন্য)                             | Super Admin                      |
| GET/POST | `/subjects`          | Institute-এর সব subject / নতুন subject                        | Authenticated / Admin-Manager    |
| GET/POST | `/teachers`          | সব teacher / নতুন teacher (User + Teacher profile তৈরি করে)   | Authenticated / Admin-Manager    |
| GET/POST | `/batches`           | সব batch / নতুন batch                                         | Authenticated / Admin-Manager    |
| GET/POST | `/students`          | সব student / নতুন student admission (auto studentId generate) | Authenticated / Admin-Manager    |

### Phase 2 endpoints

| Method | Endpoint | বর্ণনা | Role |
|--------|----------|--------|------|
| GET/POST | `/sessions` | Session তালিকা / নতুন session | Authenticated / Admin-Manager |
| GET | `/sessions/current` | চলতি session (না থাকলে 404) | Authenticated |
| GET/POST | `/classes` | Class তালিকা (sortOrder অনুযায়ী) / নতুন class | Authenticated / Admin-Manager |
| GET | `/batches?sessionId=&classId=` | Session/class দিয়ে filter, প্রতিটায় `activeStudentCount` | Authenticated |
| GET/POST | `/guardians?search=` | নাম বা phone দিয়ে খোঁজা / নতুন guardian | Staff / Admin-Manager |
| POST | `/guardians/:id/account` | Guardian-কে login account দেওয়া (role=guardian) | Admin-Manager |
| GET/POST | `/students/:id/enrollments` | Student-এর batch ইতিহাস / নতুন batch-এ ভর্তি | Staff / Admin-Manager |
| GET | `/batches/:id/enrollments?includeLeft=` | Batch-এর student তালিকা | Staff |
| PATCH | `/enrollments/:id` | ভর্তির তারিখ বা আলাদা fee (`feeOverride`) | Admin-Manager |
| POST | `/enrollments/:id/leave` | Batch ছেড়ে যাওয়া (তারিখসহ) | Admin-Manager |

"Staff" = institute admin, manager, accountant, teacher। Teacher list (salary থাকায়) শুধু admin, manager, accountant দেখতে পারে।

Subjects, Teachers, Batches, Students — প্রতিটাতে `GET/PATCH/DELETE /:id` আছে। PATCH শুধু institute admin/manager, DELETE শুধু institute admin। Super admin সব role-check পার হয়।

## Design Decisions

- **Single institute, multi-tenant-ready schema**: প্রতিটা entity-তে `instituteId` আছে, তাই
  Phase 2-এ চাইলে সহজে একাধিক institute (SaaS) সাপোর্ট যোগ করা যাবে — বড় schema change লাগবে না।
- **Soft delete**: সব entity `deletedAt` রাখে (TypeORM `softRemove`), তাই কোনো data সরাসরি হারায় না।
- **Auto-generated Student ID**: `STD-<year>-<seq>` ফরম্যাটে, প্রতিটা institute-এর জন্য আলাদাভাবে।
- **Role-based guards**: `@Roles()` decorator + `RolesGuard` দিয়ে endpoint-level access control।

## Phase 2 — Academic structure

- **Session** (`/sessions`): শিক্ষাবর্ষ। একসাথে একটাই চলতি session থাকে, আর সেটা database নিজেই নিশ্চিত করে।
- **Class** (`/classes`): Class 9, HSC 1st Year ইত্যাদি। `sortOrder` দিয়ে সাজানো, পরে promotion এই ক্রম মানবে।
- **Batch**: free-text `session`-এর বদলে এখন `sessionId` আর `classId`। Batch response-এ শিক্ষকের শুধু নাম থাকে, salary থাকে না।
- **Guardian** (`/guardians`): আলাদা record। ভর্তির সময় একই institute-এ একই phone নম্বর থাকলে (ভাই-বোন) আগের guardian-ই যুক্ত হয়। `+880`, `880`, `01...` সব একই নম্বর ধরা হয়।
- **Enrollment**: student ও batch-এর সম্পর্ক এখন ইতিহাসসহ: কবে ভর্তি, কবে ছেড়েছে, আর আলাদা মাসিক fee (`feeOverride`)। Fees module (Phase 3) এর উপর ভিত্তি করে হিসাব করবে। Student delete করলে তার সক্রিয় enrollment বন্ধ হয়।
- **Privacy**: Student ও guardian তালিকা (phone, ঠিকানা) এখন শুধু staff দেখতে পারে। আগে student বা guardian login করেও সবার তালিকা দেখতে পারত।
- **Migration**: `synchronize` বন্ধ; schema এখন `src/database/migrations`-এ। API চালু হলে migration নিজে থেকে চলে।
- **Admin panel**: Guardians (নাম/phone search), Classes, Sessions page; Students-এ guardian ও বর্তমান batch; Batches-এ session filter ও student সংখ্যা; Dashboard-এ চলতি session।

> **Phase 1.5 database থেকে upgrade**: আলাদা কিছু করতে হবে না, API চালু করলেই migration চলবে। Batch-এর পুরোনো session লেখা থেকে session তৈরি হয়,
> student-এর guardian নাম/phone থেকে guardian তৈরি হয় (একই phone = এক guardian), আর পুরোনো batch সম্পর্ক enrollment হয়ে যায়।
> Migration কোনো session-কে "চলতি" বানায় না, এটা admin-কে ঠিক করে দিতে হবে। দরকার হলে `npm run migration:revert` দিয়ে Phase 1.5-এ ফেরা যায়।

## Database migrations

```bash
cd apps/api
npm run migration:show                                   # কোনটা চলেছে, কোনটা বাকি
npm run migration:generate -- src/database/migrations/Name   # entity বদলানোর পর নতুন migration
npm run migration:run                                    # বাকি migration চালানো
npm run migration:revert                                 # শেষ migration ফিরিয়ে নেওয়া
```

Entity বদলালে অবশ্যই migration generate করুন, আর commit করার আগে file খুলে দেখুন: column rename বা data সরানোর দরকার হলে generate করা migration data মুছে ফেলতে পারে।

## Phase 1.5 — Security & data integrity fixes

- **Password hash leak বন্ধ**: global `ClassSerializerInterceptor`, তাই `@Exclude()` field response-এ যায় না।
- **Public `/auth/register` সরানো হয়েছে**: user তৈরি হয় শুধু admin-এর মাধ্যমে (teachers/students endpoint)।
- **Tenant isolation**: প্রতিটা read/update/delete query `instituteId` দিয়ে scoped। অন্য institute-এর subject/batch/teacher ID পাঠালে 400।
- **Update DTO**: প্রতিটা PATCH-এর নিজস্ব DTO; `instituteId`, `userId` বা অজানা field পাঠালে 400।
- **Student ID**: `id_counters` table থেকে atomic sequence, প্রতি institute ও প্রতি বছরে আলাদা, delete-এর পরেও কখনো reuse হয় না। Unique constraint এখন `(institute_id, studentId)`।
- **Transactions**: User + Teacher/Student একসাথে save হয়; মাঝপথে fail করলে কিছুই থাকে না। Delete করলে linked user-ও soft delete হয় (login বন্ধ)।
- **Refresh token rotation**: `refresh_tokens` table-এ শুধু SHA-256 hash থাকে। প্রতিবার refresh-এ নতুন token, পুরোনোটা বাতিল; বাতিল token আবার ব্যবহার হলে ওই user-এর সব session বন্ধ হয়। একাধিক device-এ আলাদা session চলে।
- **Frontend**: 401 পেলে একবার refresh করে request আবার পাঠায় (একসাথে অনেক request fail করলেও refresh একবারই হয়)। Logout server-এ token বাতিল করে।
- **ছোট fix**: decimal column (fee, salary) এখন number হিসেবে আসে; database error (duplicate, invalid UUID) সঠিক 409/400 দেয়; `SUPER_ADMIN` সব role check পার হয়; production-এ দুর্বল JWT secret থাকলে app চালু হয় না; `CORS_ORIGIN` env; `dotenv` dependency; frontend-এ `vite-env.d.ts` (এটা ছাড়া `npm run build` fail করত)।

> **Existing dev database**: `synchronize` নতুন table (`refresh_tokens`, `id_counters`) আর নতুন index নিজেই বানাবে। আগে issue হওয়া Student ID-এর পর থেকে counter শুরু হয়, তাই পুরোনো data-র সাথে collision হবে না।
> আগে login করা user-দের একবার logout করে আবার login করতে হবে (পুরোনো refresh token-এর কোনো DB record নেই)।

## Next Phases (এখনো বাকি)

- Admin panel-এ create/edit form (student admission, guardian, batch, enrollment)
- Phone দিয়ে student/guardian login (এখনো email লাগে)
- Groups (Science/Commerce/Arts), multi-branch

- Attendance (Student / Teacher / Employee)
- Fees, Payments (bKash/Nagad/Rocket/SSLCommerz), Due tracking, Discounts
- Homework, Study Materials
- Exam, Marks, Result publish, Rank list, Transcript
- Reports (Attendance/Income/Expense/Due/Student/Teacher)
- Notifications (SMS/Email/Push), Activity/Audit log
- Multi-institute (SaaS) admin, multi-branch
- Student & Teacher & Guardian portals (separate React apps)
