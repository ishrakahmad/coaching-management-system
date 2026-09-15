# Coaching Management System — Phase 1

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
| POST   | `/auth/register`     | নতুন user register                                          | Public (Phase 2 এ restrict হবে) |
| POST   | `/auth/login`         | Login → access + refresh token                                | Public                           |
| GET    | `/auth/me`             | Current logged-in user                                        | Authenticated                    |
| GET    | `/institutes`         | সব institute (SaaS mode এর জন্য)                             | Super Admin                      |
| GET/POST | `/subjects`          | Institute-এর সব subject / নতুন subject                        | Authenticated / Admin-Manager    |
| GET/POST | `/teachers`          | সব teacher / নতুন teacher (User + Teacher profile তৈরি করে)   | Authenticated / Admin-Manager    |
| GET/POST | `/batches`           | সব batch / নতুন batch                                         | Authenticated / Admin-Manager    |
| GET/POST | `/students`          | সব student / নতুন student admission (auto studentId generate) | Authenticated / Admin-Manager    |

## Design Decisions

- **Single institute, multi-tenant-ready schema**: প্রতিটা entity-তে `instituteId` আছে, তাই
  Phase 2-এ চাইলে সহজে একাধিক institute (SaaS) সাপোর্ট যোগ করা যাবে — বড় schema change লাগবে না।
- **Soft delete**: সব entity `deletedAt` রাখে (TypeORM `softRemove`), তাই কোনো data সরাসরি হারায় না।
- **Auto-generated Student ID**: `STD-<year>-<seq>` ফরম্যাটে, প্রতিটা institute-এর জন্য আলাদাভাবে।
- **Role-based guards**: `@Roles()` decorator + `RolesGuard` দিয়ে endpoint-level access control।

## Next Phases (এখনো বাকি)

- Attendance (Student / Teacher / Employee)
- Fees, Payments (bKash/Nagad/Rocket/SSLCommerz), Due tracking, Discounts
- Homework, Study Materials
- Exam, Marks, Result publish, Rank list, Transcript
- Reports (Attendance/Income/Expense/Due/Student/Teacher)
- Notifications (SMS/Email/Push), Activity/Audit log
- Multi-institute (SaaS) admin, multi-branch
- Student & Teacher & Guardian portals (separate React apps)
