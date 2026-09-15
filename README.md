# Coaching Management System — Phase 1.5

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

প্রথমবার চালানোর সময় `synchronize: true` (development mode) থাকায় টেবিলগুলো auto-create হয়ে যাবে।
তারপর demo institute + admin user বসাতে:

```bash
npm run seed
```

এটা বানাবে:
- Institute: **Demo Coaching Center**
- Admin login: `admin@democoaching.com` / `Admin@123`

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

Subjects, Teachers, Batches, Students — প্রতিটাতে `GET/PATCH/DELETE /:id` আছে। PATCH শুধু institute admin/manager, DELETE শুধু institute admin। Super admin সব role-check পার হয়।

## Design Decisions

- **Single institute, multi-tenant-ready schema**: প্রতিটা entity-তে `instituteId` আছে, তাই
  Phase 2-এ চাইলে সহজে একাধিক institute (SaaS) সাপোর্ট যোগ করা যাবে — বড় schema change লাগবে না।
- **Soft delete**: সব entity `deletedAt` রাখে (TypeORM `softRemove`), তাই কোনো data সরাসরি হারায় না।
- **Auto-generated Student ID**: `STD-<year>-<seq>` ফরম্যাটে, প্রতিটা institute-এর জন্য আলাদাভাবে।
- **Role-based guards**: `@Roles()` decorator + `RolesGuard` দিয়ে endpoint-level access control।

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

- Attendance (Student / Teacher / Employee)
- Fees, Payments (bKash/Nagad/Rocket/SSLCommerz), Due tracking, Discounts
- Homework, Study Materials
- Exam, Marks, Result publish, Rank list, Transcript
- Reports (Attendance/Income/Expense/Due/Student/Teacher)
- Notifications (SMS/Email/Push), Activity/Audit log
- Multi-institute (SaaS) admin, multi-branch
- Student & Teacher & Guardian portals (separate React apps)
