# 🎓 Student Follow-Up System (SFS) — Backend Development Plan

> **Project:** Student Follow-Up System · **Version:** MVP 1.0 · **Stack:** Node.js + Express.js + Oracle DB · **Classification:** Confidential

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [API Reference](#-api-reference)
- [Authentication & Security](#-authentication--security)
- [Development Sprints](#-development-sprints)
- [Environment Setup](#-environment-setup)
- [Coding Standards](#-coding-standards)
- [Non-Functional Requirements](#-non-functional-requirements)
- [Future Enhancements](#-future-enhancements)

---

## 🌐 Project Overview

The **Student Follow-Up System (SFS)** is a web-based platform that centralises student monitoring activities. It replaces fragmented workflows across spreadsheets, Trello boards, and informal channels with a single source of truth for teachers and administrators.

### Core MVP Features

| Feature | Description |
|---|---|
| Student Management | Add, search, filter, and view student profiles |
| Follow-Up Records | Create and manage follow-up entries with a Rich Text Editor |
| File Attachments | Upload and retrieve supporting documents per record |
| Timeline History | Chronological follow-up history per student |
| Role-Based Access | Teacher and Admin roles with scoped permissions |
| JWT Authentication | RS256-signed access + refresh token flow |
| Audit Trail | Full `created_by`, `updated_by`, `deleted_at` tracking |

### Out of Scope (MVP)

- Student self-service portal
- Email / SMS notifications
- Mobile native application
- Advanced analytics dashboards
- LMS or ERP integrations

---

## 🛠 Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js (LTS) | Server-side JavaScript |
| Framework | Express.js | RESTful API server |
| Database | Oracle Database | AL32UTF8 charset, relational |
| Authentication | JWT — RS256 | Access: 15 min · Refresh: 7 days |
| Password Hashing | bcrypt | Cost factor ≥ 12 |
| File Uploads | Multer | Max 20 MB, MIME whitelist |
| HTML Sanitisation | DOMPurify (server-side) | XSS prevention on rich-text fields |
| Security Headers | Helmet.js | CSP, HSTS, XSS filter |
| Schema Migrations | Flyway / Liquibase | Versioned Oracle DDL scripts |
| API Docs | Swagger / OpenAPI 3.0 | Auto-generated from route definitions |
| Linting | ESLint + Prettier | Enforced in CI pipeline |
| CI/CD | GitHub Actions | lint → test → build pipeline |

---

## 📁 Project Structure

```
sfs-api/
├── src/
│   ├── config/
│   │   ├── database.js          # Oracle OCI connection pool
│   │   ├── jwt.js               # RS256 key configuration
│   │   └── storage.js           # StorageService config
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── rbac.middleware.js   # Role-based access (Teacher / Admin)
│   │   ├── upload.middleware.js # Multer + MIME whitelist
│   │   └── error.middleware.js  # Global error handler
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   │
│   │   ├── students/
│   │   │   ├── student.controller.js
│   │   │   ├── student.service.js
│   │   │   ├── student.repository.js
│   │   │   └── student.routes.js
│   │   │
│   │   ├── follow-ups/
│   │   │   ├── followUp.controller.js
│   │   │   ├── followUp.service.js
│   │   │   ├── followUp.repository.js
│   │   │   └── followUp.routes.js
│   │   │
│   │   ├── attachments/
│   │   │   ├── attachment.controller.js
│   │   │   ├── attachment.service.js
│   │   │   ├── attachment.repository.js
│   │   │   └── attachment.routes.js
│   │   │
│   │   └── admin/
│   │       ├── admin.controller.js
│   │       ├── admin.service.js
│   │       └── admin.routes.js
│   │
│   ├── services/
│   │   └── storage.service.js   # Abstracted file storage (local → S3-ready)
│   │
│   ├── utils/
│   │   ├── response.js          # Standard envelope helpers
│   │   ├── sanitize.js          # DOMPurify wrapper
│   │   └── logger.js            # Winston logger (no PII)
│   │
│   └── app.js                   # Express app entry point
│
├── db/
│   └── migrations/              # Versioned DDL scripts (Flyway)
│       ├── V1__create_roles.sql
│       ├── V2__create_users.sql
│       ├── V3__create_students.sql
│       ├── V4__create_follow_up_types.sql
│       ├── V5__create_follow_up_cases.sql
│       ├── V6__create_follow_up_attachments.sql
│       └── V7__create_indexes.sql
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
└── README.md
```

### Architecture Pattern

Every module follows a strict three-layer separation:

```
Request → Controller → Service → Repository → Oracle DB
```

| Layer | Responsibility |
|---|---|
| **Controller** | Parse request, validate input, call service, return HTTP response |
| **Service** | Business logic, orchestration, HTML sanitisation, auth guards |
| **Repository** | All SQL queries using Oracle bind variables (no raw interpolation) |

---

## 🗄 Database Design

### Entity-Relationship Overview

```
roles ──< users ──< follow_up_cases ──< follow_up_attachments
                         ^
students ───────────────┘
follow_up_types ────────┘
```

### Standard Audit Columns (all tables)

| Column | Type | Description |
|---|---|---|
| `created_by` | NUMBER (FK users) | Populated from JWT `sub` on INSERT |
| `created_at` | TIMESTAMP | Oracle `SYSTIMESTAMP` on INSERT |
| `updated_by` | NUMBER (FK users) | Populated from JWT `sub` on UPDATE |
| `updated_at` | TIMESTAMP | Oracle `SYSTIMESTAMP` on UPDATE |
| `deleted_at` | TIMESTAMP | Set on soft-delete; `NULL` = active |

---

### Table: `roles`

| Column | Type | Constraints |
|---|---|---|
| `role_id` | NUMBER | PK, NOT NULL |
| `role_name` | VARCHAR2(50) | UNIQUE, NOT NULL — `Teacher` / `Admin` |
| `description` | VARCHAR2(255) | NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |

---

### Table: `users`

| Column | Type | Constraints |
|---|---|---|
| `user_id` | NUMBER | PK, NOT NULL |
| `role_id` | NUMBER | FK → `roles.role_id`, NOT NULL |
| `full_name` | VARCHAR2(100) | NOT NULL |
| `email` | VARCHAR2(255) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR2(255) | NOT NULL — bcrypt |
| `is_active` | NUMBER(1) | NOT NULL, DEFAULT 1 |
| `last_login_at` | TIMESTAMP | NULL |
| `created_by` | NUMBER | FK → `users.user_id`, NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `updated_by` | NUMBER | FK → `users.user_id`, NULL |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `deleted_at` | TIMESTAMP | NULL |

---

### Table: `students`

| Column | Type | Constraints |
|---|---|---|
| `student_id` | NUMBER | PK, NOT NULL |
| `student_code` | VARCHAR2(20) | UNIQUE, NOT NULL |
| `full_name` | VARCHAR2(100) | NOT NULL |
| `gender` | VARCHAR2(10) | NOT NULL — `Male` / `Female` / `Other` |
| `batch` | VARCHAR2(20) | NOT NULL |
| `class` | VARCHAR2(50) | NOT NULL |
| `department` | VARCHAR2(100) | NOT NULL |
| `phone` | VARCHAR2(20) | NULL |
| `email` | VARCHAR2(255) | NULL |
| `status` | VARCHAR2(20) | NOT NULL, DEFAULT `Active` |
| `assigned_to` | NUMBER | FK → `users.user_id`, NULL |
| `created_by` | NUMBER | FK → `users.user_id`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `updated_by` | NUMBER | FK → `users.user_id`, NULL |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `deleted_at` | TIMESTAMP | NULL |

---

### Table: `follow_up_types`

| Column | Type | Constraints |
|---|---|---|
| `type_id` | NUMBER | PK, NOT NULL |
| `type_name` | VARCHAR2(100) | UNIQUE, NOT NULL |
| `description` | VARCHAR2(255) | NULL |
| `is_active` | NUMBER(1) | NOT NULL, DEFAULT 1 |
| `created_by` | NUMBER | FK → `users.user_id`, NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |

---

### Table: `follow_up_cases`

| Column | Type | Constraints |
|---|---|---|
| `case_id` | NUMBER | PK, NOT NULL |
| `student_id` | NUMBER | FK → `students.student_id`, NOT NULL |
| `type_id` | NUMBER | FK → `follow_up_types.type_id`, NOT NULL |
| `created_by` | NUMBER | FK → `users.user_id`, NOT NULL |
| `subject` | VARCHAR2(200) | NOT NULL |
| `comment` | CLOB | NOT NULL — sanitised HTML |
| `follow_up_date` | DATE | NOT NULL — cannot be future |
| `priority` | VARCHAR2(20) | NOT NULL — `Low` / `Medium` / `High` / `Critical` |
| `status` | VARCHAR2(20) | NOT NULL, DEFAULT `Open` |
| `updated_by` | NUMBER | FK → `users.user_id`, NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `deleted_at` | TIMESTAMP | NULL |

---

### Table: `follow_up_attachments`

| Column | Type | Constraints |
|---|---|---|
| `attachment_id` | NUMBER | PK, NOT NULL |
| `case_id` | NUMBER | FK → `follow_up_cases.case_id`, NOT NULL |
| `original_filename` | VARCHAR2(255) | NOT NULL |
| `stored_filename` | VARCHAR2(255) | NOT NULL — UUID-prefixed |
| `file_path` | VARCHAR2(500) | NOT NULL — relative to storage root |
| `mime_type` | VARCHAR2(100) | NOT NULL |
| `file_size` | NUMBER | NOT NULL — bytes |
| `uploaded_by` | NUMBER | FK → `users.user_id`, NOT NULL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT SYSTIMESTAMP |
| `deleted_at` | TIMESTAMP | NULL |

---

### Indexes

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `IDX_STUDENTS_CODE` | students | `student_code` | Unique lookup by institutional ID |
| `IDX_STUDENTS_DEPT` | students | `department`, `status` | Filter queries |
| `IDX_STUDENTS_BATCH` | students | `batch` | Batch filter |
| `IDX_STUDENTS_NAME` | students | `full_name` | Name search |
| `IDX_CASES_STUDENT` | follow_up_cases | `student_id` | Timeline queries |
| `IDX_CASES_TEACHER` | follow_up_cases | `created_by` | Teacher's own records |
| `IDX_CASES_DATE` | follow_up_cases | `follow_up_date DESC` | Chronological sort |
| `IDX_CASES_STATUS` | follow_up_cases | `status` | Status filter |
| `IDX_ATTACH_CASE` | follow_up_attachments | `case_id` | Attachment lookup |

---

## 📡 API Reference

### Conventions

| Rule | Detail |
|---|---|
| Base URL | `/api/v1` |
| Content-Type | `application/json` (file uploads: `multipart/form-data`) |
| Authentication | `Authorization: Bearer <accessToken>` on all protected routes |
| Date Format | ISO 8601 — `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ` |
| Pagination | `?page=1&limit=20` on all list endpoints |

### Standard Response Envelope

```json
// Success
{
  "success": true,
  "data": { },
  "message": "Operation successful",
  "meta": { "page": 1, "limit": 20, "total": 150 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [{ "field": "email", "message": "Invalid format" }]
  }
}
```

### HTTP Status Codes

| Status | Meaning | When |
|---|---|---|
| `200 OK` | Success | GET, PUT |
| `201 Created` | Resource created | POST |
| `204 No Content` | Success, no body | DELETE |
| `400 Bad Request` | Validation error | Invalid input |
| `401 Unauthorized` | Missing/invalid token | Not authenticated |
| `403 Forbidden` | Insufficient role | Not authorised |
| `404 Not Found` | Resource absent | Soft-deleted or missing |
| `409 Conflict` | Duplicate | Unique constraint violated |
| `413 Payload Too Large` | File too big | Upload > 20 MB |
| `500 Internal Server Error` | Server fault | Unhandled exception |

---

### 🔐 Auth Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate and receive JWT tokens |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for new access token |
| `POST` | `/auth/logout` | Authenticated | Invalidate refresh token server-side |

#### `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "teacher@school.edu",
  "password": "P@ssw0rd!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>",
    "expiresIn": 900,
    "user": { "userId": 1, "fullName": "Jane Smith", "role": "Teacher" }
  }
}
```

**Error cases:** `401` Invalid credentials · `403` Account deactivated

> **Security note:** After 5 consecutive failed attempts, account is locked for 15 minutes. Error messages are intentionally generic to avoid revealing which field is wrong.

---

### 👤 Student Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/students` | Teacher, Admin | Paginated list with search & filter |
| `POST` | `/students` | Teacher, Admin | Create a new student record |
| `GET` | `/students/:id` | Teacher, Admin | Full profile with follow-up summary |
| `PUT` | `/students/:id` | Teacher (own), Admin | Update student information |
| `DELETE` | `/students/:id` | Admin only | Soft-delete student record |

#### `GET /api/v1/students` — Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Case-insensitive search on `student_code` and `full_name` |
| `batch` | string | Filter by batch |
| `department` | string | Filter by department |
| `status` | string | `Active` / `Inactive` / `Graduated` |
| `page` | integer | Page number (default: `1`) |
| `limit` | integer | Items per page (default: `20`, max: `100`) |
| `sortBy` | string | `full_name`, `batch`, `department` |
| `sortDir` | string | `asc` / `desc` (default: `asc`) |

#### `POST /api/v1/students` — Request Body

```json
{
  "studentCode": "STU-2024-001",
  "fullName": "Ahmad Ali",
  "gender": "Male",
  "batch": "2024",
  "class": "CS-3A",
  "department": "Computer Science",
  "phone": "+60-12-345-6789",
  "email": "ahmad.ali@school.edu",
  "status": "Active"
}
```

---

### 📝 Follow-Up Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/follow-ups` | Teacher (own), Admin (all) | Paginated follow-up cases |
| `POST` | `/follow-ups` | Teacher, Admin | Create a new follow-up record |
| `GET` | `/follow-ups/:id` | Teacher, Admin | Single record with attachments |
| `PUT` | `/follow-ups/:id` | Creator or Admin | Update a follow-up record |
| `DELETE` | `/follow-ups/:id` | Creator or Admin | Soft-delete a record |

#### `POST /api/v1/follow-ups` — Request Body

```json
{
  "studentId": 42,
  "typeId": 3,
  "subject": "Academic performance concern",
  "comment": "<p>Student has missed <strong>3</strong> consecutive assignments.</p>",
  "followUpDate": "2026-06-01",
  "priority": "High",
  "status": "Open"
}
```

> **Note:** `createdBy` and `createdAt` are **auto-populated** from the JWT and server timestamp. The `comment` field is sanitised with DOMPurify before database persistence.

#### `GET /api/v1/follow-ups` — Query Parameters

`studentId` · `typeId` · `priority` · `status` · `dateFrom` · `dateTo` · `page` · `limit`

---

### 📎 Attachment Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/attachments/upload` | Teacher, Admin | Upload files to a follow-up case |
| `GET` | `/attachments/:id` | Teacher, Admin | Stream file for download |
| `DELETE` | `/attachments/:id` | Creator or Admin | Soft-delete attachment |

#### `POST /api/v1/attachments/upload`

- **Content-Type:** `multipart/form-data`
- **Form fields:** `caseId` (integer, required) · `files` (array, max 10 files, 20 MB each)
- **Accepted types:** `jpg`, `jpeg`, `png`, `gif`, `webp`, `pdf`, `docx`, `doc`, `xlsx`, `xls`, `csv`

**Response `201`:**
```json
{
  "success": true,
  "data": [
    {
      "attachmentId": 101,
      "originalFilename": "progress_report.pdf",
      "mimeType": "application/pdf",
      "fileSize": 204800,
      "uploadedAt": "2026-06-01T08:30:00Z"
    }
  ]
}
```

**Error cases:** `400` missing `caseId` · `413` file > 20 MB · `415` unsupported type

> **Architecture note:** File storage is abstracted behind a `StorageService` interface. Local filesystem is used for MVP; the interface allows migration to AWS S3 or Azure Blob without API changes.

---

### ⚙️ Admin Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin | List all teacher accounts |
| `POST` | `/admin/users` | Admin | Create a teacher account |
| `PUT` | `/admin/users/:id` | Admin | Update user or toggle active status |
| `GET` | `/admin/follow-up-types` | Admin | List all follow-up types |
| `POST` | `/admin/follow-up-types` | Admin | Create a follow-up type |
| `PUT` | `/admin/follow-up-types/:id` | Admin | Update or deactivate a type |

---

## 🔐 Authentication & Security

### JWT Flow

```
[Login] → bcrypt verify → sign accessToken (15 min, RS256) + refreshToken (7 days)
        → store refreshToken server-side → return tokens in HttpOnly cookie

[Request] → verify accessToken → extract userId + role → inject into req.user

[Refresh] → validate refreshToken → issue new accessToken

[Logout] → invalidate refreshToken server-side
```

### Security Requirements

| Requirement | Specification |
|---|---|
| JWT Algorithm | RS256 — asymmetric key signing |
| Password Hashing | bcrypt, cost factor ≥ 12 |
| Brute-Force | Lock account 15 min after 5 failed login attempts |
| SQL Injection | All queries use Oracle bind variables (parameterised) |
| XSS Prevention | DOMPurify sanitises rich-text on server input and client output |
| CSRF | `SameSite=Strict` cookie + CSRF token on state-changing requests |
| File Safety | MIME whitelist validated server-side; files stored outside web root |
| HTTPS | TLS 1.2+ enforced; HTTP redirects to HTTPS |
| RBAC | Middleware enforces role on every protected route |
| Logging | No passwords or PII in logs; log files have restricted OS permissions |

### RBAC Middleware Logic

```
Teacher → can access own follow-up records only
Admin   → can access all records across all teachers
Both    → cannot access soft-deleted records (unless Admin requests archive)
```

---

## 🚀 Development Sprints

### 8-Week MVP Roadmap

| Sprint | Duration | Focus |
|---|---|---|
| Sprint 0 | Week 0 | Environment, Oracle schema, project scaffolding |
| Sprint 1 | Weeks 1–2 | Authentication, user management, roles |
| Sprint 2 | Weeks 3–4 | Student CRUD, search, filter, profile |
| Sprint 3 | Weeks 5–6 | Follow-up records, rich text, file upload |
| Sprint 4 | Weeks 7–8 | Admin panel, testing, QA, UAT prep |

---

### Sprint 0 — Foundation

| Task | Category | Description |
|---|---|---|
| T-001 | Setup | Initialise Git repo with branching strategy (`main` / `develop` / `feature/*`) |
| T-002 | Setup | Configure Oracle DB instance; apply `AL32UTF8` charset |
| T-003 | Setup | Write and execute DDL migration scripts (6 tables + indexes) |
| T-004 | Setup | Scaffold Express.js project: folder structure, middleware stack, error handler |
| T-005 | Setup | Scaffold Vue 3 project with Vite, Tailwind CSS, Pinia, Vue Router |
| T-006 | Setup | Configure `.env`, CORS policy, and Helmet.js security headers |
| T-007 | Setup | Configure ESLint + Prettier (frontend and backend) |
| T-008 | Setup | Set up CI pipeline (GitHub Actions): lint → unit test → build |

---

### Sprint 1 — Authentication & Users

| Task | Category | Description |
|---|---|---|
| T-009 | Backend | `POST /auth/login` — bcrypt password validation |
| T-010 | Backend | JWT generation (access + refresh) with RS256 |
| T-011 | Backend | JWT middleware for route protection |
| T-012 | Backend | RBAC middleware (Teacher / Admin role check) |
| T-013 | Backend | `POST /auth/refresh` and `POST /auth/logout` |
| T-014 | Backend | Admin user CRUD endpoints |
| T-015 | Frontend | Login page (form, validation, error state) |
| T-016 | Frontend | Pinia auth store (token management, user state) |
| T-017 | Frontend | Vue Router guards (redirect unauthenticated users) |
| T-018 | Frontend | App shell: top nav, sidebar, responsive layout |
| T-019 | Testing | Unit tests: auth service, JWT utilities, RBAC middleware |

---

### Sprint 2 — Student Management

| Task | Category | Description |
|---|---|---|
| T-020 | Backend | `GET /students` — pagination, search, filter |
| T-021 | Backend | `POST /students` — validation and creation |
| T-022 | Backend | `GET /students/:id` — profile with follow-up summary |
| T-023 | Backend | `PUT /students/:id` and `DELETE /students/:id` (soft delete) |
| T-024 | Frontend | Student List page: table, search bar, filters, pagination |
| T-025 | Frontend | Add Student form with inline validation |
| T-026 | Frontend | Student Profile page: info panel + stats strip |
| T-027 | Frontend | Pinia students store |
| T-028 | Testing | Unit tests: student service, repository; E2E: student CRUD flow |

---

### Sprint 3 — Follow-Ups & Attachments

| Task | Category | Description |
|---|---|---|
| T-029 | Backend | `GET /follow-ups` — filtering and pagination |
| T-030 | Backend | `POST /follow-ups` — HTML sanitisation via DOMPurify |
| T-031 | Backend | `PUT /follow-ups/:id` — creator or Admin guard |
| T-032 | Backend | `DELETE /follow-ups/:id` — soft delete |
| T-033 | Backend | `StorageService` abstraction layer |
| T-034 | Backend | `POST /attachments/upload` — Multer, 20 MB limit, MIME whitelist |
| T-035 | Backend | `GET /attachments/:id` — streaming file download |
| T-036 | Frontend | TipTap rich text editor integration |
| T-037 | Frontend | Follow-Up form (all fields, validation, drag-and-drop file zone) |
| T-038 | Frontend | Follow-Up Timeline component (cards, badges, attachments) |
| T-039 | Frontend | Pinia follow-up store |
| T-040 | Testing | Unit tests: follow-up service, storage service; E2E: create + upload |

---

### Sprint 4 — Admin Panel & QA

| Task | Category | Description |
|---|---|---|
| T-041 | Frontend | Dashboard: stat cards, recent activity feed, quick actions |
| T-042 | Frontend | Teacher Management page (Admin) |
| T-043 | Frontend | Follow-Up Type Management page (Admin) |
| T-044 | Backend | Follow-up type CRUD admin endpoints |
| T-045 | QA | Integration test suite: all API endpoints |
| T-046 | QA | Performance test: search < 2s, timeline < 3s at 50 concurrent users |
| T-047 | QA | Security scan: OWASP Top 10 checklist |
| T-048 | QA | Cross-browser testing: Chrome, Firefox, Safari, Edge |
| T-049 | Docs | API documentation (Swagger / OpenAPI 3.0) |
| T-050 | Docs | Deployment guide and environment setup README |

---

## ⚙️ Environment Setup

### Prerequisites

- Node.js LTS
- Oracle Database (AL32UTF8 charset)
- Flyway or Liquibase (schema migrations)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/sfs-api.git
cd sfs-api

# 2. Install dependencies
npm install

# 3. Copy environment file and configure
cp .env.example .env

# 4. Run database migrations
flyway -url=jdbc:oracle:thin:@localhost:1521/XEPDB1 migrate

# 5. Start development server
npm run dev
```

### Environment Variables (`.env`)

```env
# Server
NODE_ENV=development
PORT=3000

# Oracle Database
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE=XEPDB1
DB_USER=sfs_user
DB_PASSWORD=your_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT (RS256)
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800

# File Storage
STORAGE_ROOT=./uploads
STORAGE_MAX_FILE_SIZE=20971520
STORAGE_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,text/csv

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **Never commit `.env` to version control.** Keep secrets in a secrets manager in production.

---

## 📐 Coding Standards

### Backend Rules

- Follow **SOLID principles** — single responsibility per module
- Use **async/await** with try/catch; never mix callbacks and promises
- All database queries use **Oracle bind variables** — no string interpolation
- All rich-text fields must be **sanitised with DOMPurify** before INSERT or UPDATE
- **No hardcoded secrets** — all config via `.env`
- Every service method returns a plain object; never return raw DB row objects
- Log errors with Winston; **never log passwords, tokens, or PII**

### Git Branching Strategy

```
main          ← production-ready only
develop       ← integration branch
feature/*     ← one branch per task (e.g. feature/T-009-auth-login)
fix/*         ← bug fixes
```

### Commit Message Format

```
type(scope): short description

feat(auth): implement JWT RS256 login endpoint
fix(students): correct soft-delete query filter
refactor(attachments): extract StorageService interface
test(follow-ups): add unit tests for create service
```

---

## 📊 Non-Functional Requirements

### Performance Targets

| Metric | Target |
|---|---|
| Student search response | < 2 seconds (P95) |
| Follow-up timeline load (200 records) | < 3 seconds |
| API response (non-file) | < 500 ms (P95) |
| File upload (20 MB) | < 30 seconds |
| Concurrent users (MVP) | 50 simultaneous without degradation |

### Availability

| Requirement | Specification |
|---|---|
| Uptime target | 99.5% during school hours (07:00–20:00, Mon–Fri) |
| Planned downtime | 48 hours advance notice required |
| DB backup | Daily full backup, 30-day retention |

### Soft-Delete Policy

All deletions are **logical only**. The `deleted_at` timestamp is set by server middleware from the JWT `sub`. Soft-deleted records are **excluded from all queries** by default. Admins may request archived records explicitly. Physical file cleanup is handled by a scheduled background job.

---

## 🔮 Future Enhancements — Phase 2

| Feature | Priority | Description |
|---|---|---|
| Email Notifications | High | Automated alerts on record create/update |
| In-App Notifications | High | Real-time toasts via WebSockets or SSE |
| Follow-Up Reminders | High | Scheduled digests for overdue open cases |
| Teacher Assignment Workflow | Medium | Formal student reassignment with approval flow |
| Case Escalation | Medium | Escalate critical cases to department head |
| Student Self-Service Portal | Medium | Read-only student view of their own follow-up summary |
| Analytics Dashboard | Medium | KPIs: cases by type, resolution time, teacher workload |
| Export & Reports | Medium | PDF / Excel export; scheduled delivery |
| Advanced Search | Low | Full-text search across comment bodies |
| Mobile Application | Low | React Native / Flutter companion app |
| LMS / ERP Integration | Low | Webhook sync with institutional systems |
| Bulk Import | Low | CSV upload for bulk student registration |
| Cloud File Storage | Low | Migrate `StorageService` to AWS S3 or Azure Blob |
| Two-Factor Authentication | Low | TOTP 2FA for Admin accounts |

---

## 📖 Glossary

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| MVP | Minimum Viable Product — first releasable version |
| JWT | JSON Web Token — compact, URL-safe claims representation |
| RBAC | Role-Based Access Control |
| Soft Delete | Logical deletion by setting `deleted_at`; data retained in DB |
| CLOB | Oracle data type for large text fields (up to 4 GB) |
| DOMPurify | Library for sanitising HTML to prevent XSS attacks |
| TipTap | Headless rich-text editor built for Vue 3 |
| Pinia | Official state management library for Vue 3 |
| StorageService | Abstract service layer decoupling file storage from business logic |
| Audit Trail | Automatic recording of who created/modified a record and when |
| Timeline | Chronological feed of all follow-up records for a student |

---

<div align="center">

**Student Follow-Up System · MVP v1.0 · Confidential**

*Prepared by Business Analysis & Architecture Team · June 2026*

</div>
