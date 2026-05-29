# PNC Student Performance Tracking System

This document consolidates the provided database specification and the current repository state into a production-oriented analysis and design guide.

## Scope and Current Repository State

The repository currently contains a minimal NestJS 11 backend with Prisma, MySQL, Redis, Swagger pages, and basic auth and health endpoints. The implemented Prisma schema is limited to `User`, `Role`, and `Permission`. The attached business document describes a much larger target system, so this document separates what is already implemented from what is required next.

## 1. Business Analysis

### What the system is

PNC Student Performance Tracking System is a school operations platform for tracking student follow-up cases, tutor assignments, performance evaluations, subject scores, and academic history across terms.

### What problem it solves

The system replaces fragmented manual tracking with a centralized, auditable record of student interventions, academic results, and workflow history.

### Main business goals

- Identify and monitor at-risk students.
- Assign and track tutors and responsible teachers.
- Record reports, evidence, evaluations, and scores.
- Preserve historical records for audits and reporting.
- Support future analytics, notifications, and automation.

### Main actors

- Super Admin
- Admin
- Manager
- Teacher
- Tutor
- Database administrator

### Feature analysis

- Authentication features: register, login, logout, and future refresh-token support.
- User features: staff account management, profile access, and lifecycle control.
- Admin features: role management, permission management, seeding, and configuration.
- Permission features: RBAC enforcement by module and action.
- Reporting features: follow-up reports, evaluation reports, and score summaries.
- Notification features: reminders, overdue alerts, escalation alerts, and tutor alerts.

### Flow analysis

- Registration flow: should be controlled by policy; public self-registration with arbitrary role selection is not safe for production.
- Login flow: email and password authenticate the user and issue JWT access tokens; refresh tokens are required for the target architecture.
- User journey: staff logs in, accesses a student record, opens or updates a follow-up case, submits reports, records evaluations and scores, and reviews status changes over time.
- Payment flow: not documented.
- Approval flow: not documented, but future case closure or role changes may require approval.

## 2. Database Analysis

### Current implemented schema

The repository currently has only three Prisma mohhdels:

- `User`: id, email, password, createdAt, updatedAt, roleId.
- `Role`: id, name.
- `Permission`: id, name.

This is only enough for a basic auth foundation. It does not yet cover the academic and follow-up domain described in the business document.

### Target domain tables

#### Academic core

| Table | Purpose | Key columns | Relationships | Index and constraint notes |
| --- | --- | --- | --- | --- |
| students | Stores student master data | student_id, student_code, first_name, last_name, gender, date_of_birth, place_of_birth, phone, email, profile_image, class_id, status, created_at, updated_at | Many students to one class; one student to many cases, scores, evaluations, and tutor assignments | Unique on student_code and email; index class_id and status |
| teachers | Stores teacher and staff data | teacher_id, teacher_code, first_name, last_name, email, phone, role, status, created_at | One teacher opens cases, writes reports, assigns tutors, records scores, and evaluates students | Unique on teacher_code and email; index role and status |
| classes | Stores class groups | class_id, class_name, batch_year, created_at | One class has many students | Consider unique class_name + batch_year |
| terms | Stores academic terms | term_id, academic_year, semester, start_date, end_date, status | One term has many cases, scores, evaluations, and assignments | Unique academic_year + semester; index status and date range |
| subjects | Stores subject catalog | subject_id, subject_code, subject_name, credit, created_at | One subject has many scores and teacher assignments | Unique subject_code |
| teacher_subjects | Maps teachers to subjects by term and class | teacher_subject_id, teacher_id, subject_id, term_id, class_id | Many-to-many bridge with context | Composite unique on teacher_id + subject_id + term_id + class_id |

#### Follow-up and monitoring

| Table | Purpose | Key columns | Relationships | Index and constraint notes |
| --- | --- | --- | --- | --- |
| follow_up_cases | Main student follow-up record | follow_up_case_id, student_id, opened_by_teacher_id, term_id, title, description, priority, status_id, opened_date, closed_date, created_at | One student to many cases; one term to many cases; one case to many reports and attachments | Index student_id, term_id, status_id, opened_date |
| follow_up_case_types | Configurable follow-up categories | follow_up_type_id, type_name, description, is_active | Many types to many cases via map table | Unique type_name |
| follow_up_case_type_map | Junction between cases and types | case_type_map_id, follow_up_case_id, follow_up_type_id | Many-to-many | Composite unique on case and type |
| follow_up_statuses | Workflow statuses | status_id, status_name, color_code | One status to many cases | Unique status_name |
| follow_up_reports | Teacher progress reports | report_id, follow_up_case_id, teacher_id, report_date, progress_status, observation, next_action, created_at | One case has many reports; one report can have many attachments | Index follow_up_case_id, teacher_id, report_date |
| follow_up_attachments | Uploaded evidence metadata | attachment_id, report_id, file_name, file_path, file_type, uploaded_at | One report has many attachments | Index report_id; store files in object storage, not in DB |
| follow_up_removals | Removal audit history | removal_id, follow_up_case_id, removed_by_teacher_id, removal_reason, removal_date | One case can have many removal records over time | Index follow_up_case_id and removed_by_teacher_id |

#### Evaluation system

| Table | Purpose | Key columns | Relationships | Index and constraint notes |
| --- | --- | --- | --- | --- |
| evaluation_categories | Evaluation dimensions | category_id, category_name, description, is_active, created_at | One category to many student evaluations | Unique category_name |
| rating_scales | Score configuration | rating_scale_id, scale_name, min_value, max_value, description | One scale to many evaluations | Unique scale_name; min_value must be less than max_value |
| student_evaluations | Student evaluation records | evaluation_id, student_id, teacher_id, term_id, category_id, rating_scale_id, score, comment, evaluated_at | One student to many evaluations; one category to many evaluations | Index student_id, term_id, category_id |

#### Tutor assignment

| Table | Purpose | Key columns | Relationships | Index and constraint notes |
| --- | --- | --- | --- | --- |
| tutor_assignments | Tutor-student assignment history | tutor_assignment_id, student_id, teacher_id, assigned_by_teacher_id, assigned_date, end_date, status, notes, created_at | One teacher tutors many students; one student can have many tutors over time | Index student_id, teacher_id, status, assigned_date |

#### Score management

| Table | Purpose | Key columns | Relationships | Index and constraint notes |
| --- | --- | --- | --- | --- |
| score_types | Score category master data | score_type_id, score_type_name, percentage_weight, description | One score type to many student scores | Unique score_type_name |
| student_scores | Academic score records | student_score_id, student_id, subject_id, teacher_id, term_id, score_type_id, score_value, max_score, remarks, recorded_at | One student to many scores; one subject to many scores; one teacher to many scores | Index student_id, subject_id, term_id, score_type_id |

### Relationship cardinalities

| Relationship | Cardinality |
| --- | --- |
| classes to students | 1 to many |
| students to follow_up_cases | 1 to many |
| follow_up_cases to follow_up_reports | 1 to many |
| follow_up_reports to follow_up_attachments | 1 to many |
| follow_up_cases to follow_up_case_types | many to many |
| teachers to students in tutoring | many to many over time |
| teachers to subjects | many to many |
| students to evaluations | 1 to many |
| evaluation_categories to evaluations | 1 to many |
| students to scores | 1 to many |
| subjects to scores | 1 to many |
| score_types to scores | 1 to many |

### Performance considerations

- Follow-up cases, reports, scores, and evaluations will be the highest-growth tables.
- Foreign key columns must be indexed.
- Composite unique keys are needed on junction tables and repeated-entry tables.
- Term-scoped and student-scoped filters should be optimized first.

## 3. Database Improvement Review

### Missing or weak areas

- The current schema does not cover the academic domain.
- The current auth model is too small for enterprise RBAC.
- The public register flow should not accept arbitrary role assignment.
- Lookup tables and transactional tables are not yet separated in the implemented schema.
- Audit fields are missing from most target tables.

### Recommended improvements before implementation

- Add soft delete fields where retention matters: deleted_at and deleted_by.
- Add created_by and updated_by for auditability.
- Add refresh token storage or hash-based token revocation support.
- Replace enum-based staff authorization with roles and permissions tables.
- Enforce composite unique keys on all many-to-many bridges.
- Use lookup tables for dynamic statuses, categories, and score types.
- Add file metadata fields for attachments: storage_provider, file_size, mime_type, checksum.
- Add check constraints for rating scales and score values where supported.

### Naming consistency

- Use snake_case plural table names.
- Use table_name_id for primary keys.
- Use referenced_table_id for foreign keys.
- Use created_at and updated_at consistently.
- Prefer explicit junction table names such as entity_entity_map.

## 4. NestJS Architecture

### Recommended structure

```text
src/
  main.ts
  common/
	 decorators/
	 exceptions/
	 filters/
	 guards/
	 interceptors/
	 middleware/
  config/
	 app.config.ts
	 database.config.ts
	 jwt.config.ts
	 redis.config.ts
	 swagger.config.ts
  database/
	 database.module.ts
	 prisma.service.ts
	 prisma.extension.ts
  prisma/
	 schema.prisma
	 seed.ts
  modules/
	 auth/
	 users/
	 roles/
	 permissions/
	 notifications/
	 health/
	 students/
	 teachers/
	 classes/
	 terms/
	 subjects/
	 follow-up/
	 evaluations/
	 tutor-assignments/
	 scores/
	 audit/
  shared/
	 constants/
	 dto/
	 types/
	 utils/
```

### Why each module exists

- auth: login, logout, token refresh, and session control.
- users: staff account lifecycle and profile operations.
- roles: role lifecycle and assignment management.
- permissions: permission catalog and enforcement support.
- notifications: reminders and alert delivery.
- health: uptime and dependency checks.
- students, teachers, classes, terms, subjects: academic master data.
- follow-up: cases, reports, statuses, attachments, and removals.
- evaluations: categories, scales, and evaluation records.
- tutor-assignments: tutor history and active assignment rules.
- scores: score types and score entry records.
- audit: system change history and compliance logging.
- shared: reusable contracts and cross-cutting helpers.

### Architectural principles

- Keep business modules isolated from framework concerns.
- Put shared behavior in common or shared layers only when it is truly cross-cutting.
- Use DTOs for all input boundaries.
- Use guards for authorization and interceptors for cross-cutting response behavior.
- Keep Prisma access behind services, not in controllers.

## 5. Prisma Schema Design

### Model groups to implement

- Identity and access: User, Role, Permission, RolePermission, UserRole, RefreshToken, AuditLog.
- Academic core: Student, Teacher, Class, Term, Subject, TeacherSubject.
- Follow-up: FollowUpCase, FollowUpCaseType, FollowUpCaseTypeMap, FollowUpStatus, FollowUpReport, FollowUpAttachment, FollowUpRemoval.
- Evaluation: EvaluationCategory, RatingScale, StudentEvaluation.
- Tutoring and scoring: TutorAssignment, ScoreType, StudentScore.
- Future support: Notification, NotificationReceiver, WorkflowEvent.

### Required audit fields

- createdAt
- updatedAt
- deletedAt
- createdBy
- updatedBy

### Relation rules

- All lookup-to-transaction links should use explicit foreign keys.
- All many-to-many relations should use explicit junction tables.
- All repeated-entry entities should have composite unique constraints if the business allows only one active record for a given scope.
- Soft delete should be applied selectively to operational entities, not all lookup data.

### Relation design notes

- If students or teachers need to authenticate, connect them to User rather than duplicating credentials.
- If one user can have multiple roles, keep UserRole. If one role per user is guaranteed, a single roleId on User is acceptable, but do not mix both patterns without a clear rule.
- If refresh tokens are required, store hashed refresh tokens with expiry and revocation tracking.

## 6. Migration Plan

### Suggested migration order

1. 001_init_access_control
	- Creates users, roles, permissions, junction tables, refresh token storage, and audit logs.
	- This is the security foundation.

2. 002_init_academic_core
	- Creates classes, terms, subjects, students, teachers, and teacher_subjects.
	- Depends on access control only if staff accounts are linked to users.

3. 003_init_follow_up_core
	- Creates follow_up_statuses, follow_up_case_types, follow_up_cases, follow_up_case_type_map, follow_up_reports, follow_up_attachments, follow_up_removals.

4. 004_init_evaluation_core
	- Creates evaluation_categories, rating_scales, student_evaluations.

5. 005_init_tutor_assignments
	- Creates tutor_assignments.

6. 006_init_score_management
	- Creates score_types and student_scores.

7. 007_init_notifications
	- Creates notifications and notification_receivers.

8. 008_add_indexes_and_constraints
	- Adds composite indexes, unique constraints, and any required checks.

### Why this order works

- Access control comes first so seed data and future admin workflows have a security base.
- Academic core comes before operational modules because follow-up, evaluations, tutor assignment, and scoring all depend on it.
- Lookup and transaction tables should be introduced before optimization migrations so foreign key paths are stable.

## 7. Seeder Plan

### Default roles

- Super Admin
- Admin
- Manager
- Teacher

### Default permissions

- users.create, users.read, users.update, users.delete
- roles.create, roles.read, roles.update, roles.delete
- permissions.create, permissions.read, permissions.update, permissions.delete
- students.create, students.read, students.update, students.delete
- teachers.create, teachers.read, teachers.update, teachers.delete
- classes.create, classes.read, classes.update, classes.delete
- terms.create, terms.read, terms.update, terms.delete
- subjects.create, subjects.read, subjects.update, subjects.delete
- follow-up.create, follow-up.read, follow-up.update, follow-up.delete
- evaluations.create, evaluations.read, evaluations.update, evaluations.delete
- scores.create, scores.read, scores.update, scores.delete
- notifications.read, notifications.manage
- audit.read

### Default seed data

- One environment-driven Super Admin account.
- Baseline role-permission mappings.
- Default follow-up statuses: Open, Monitoring, Improving, Escalated, Closed.
- Default rating scale, such as 0 to 5.
- Default score types such as Quiz, Assignment, Lab, Midterm, and Final.

## 8. API Plan

### Module list

- auth
- users
- roles
- permissions
- students
- teachers
- classes
- terms
- subjects
- follow-up
- evaluations
- tutor-assignments
- scores
- notifications
- audit

### Core endpoints

- auth: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me
- users: GET /users, GET /users/:id, POST /users, PATCH /users/:id, DELETE /users/:id
- roles: GET /roles, POST /roles, PATCH /roles/:id, DELETE /roles/:id
- permissions: GET /permissions, POST /permissions, PATCH /permissions/:id, DELETE /permissions/:id
- students: GET /students, GET /students/:id, POST /students, PATCH /students/:id, DELETE /students/:id
- teachers: GET /teachers, POST /teachers, PATCH /teachers/:id, DELETE /teachers/:id
- follow-up: GET /follow-up/cases, POST /follow-up/cases, PATCH /follow-up/cases/:id, POST /follow-up/cases/:id/reports, POST /follow-up/cases/:id/attachments, POST /follow-up/cases/:id/close
- evaluations: GET /evaluations, POST /evaluations, GET /evaluation-categories, GET /rating-scales
- scores: GET /scores, POST /scores, GET /score-types

### DTO and validation expectations

- Use class-validator and class-transformer for all request DTOs.
- Enforce strong email, password, enum, and pagination validation.
- Validate IDs consistently based on the chosen identifier strategy.
- Keep create and update DTOs separate.

### Guards and permissions

- JWT auth guard
- Roles guard
- Permission guard
- Ownership guard for self-service endpoints when needed

## 9. Security Review

### Required security controls

- JWT access token and refresh token strategy.
- Refresh token rotation and revocation support.
- RBAC enforced through role and permission tables.
- Permission checks at the endpoint or handler level.
- Password hashing with bcrypt and a deliberate cost factor.
- Rate limiting for login, refresh, and registration.
- CORS restricted per environment.
- Helmet or equivalent security headers.
- Audit logging for sensitive changes.
- File upload validation for type, size, and metadata.

### Security concerns in the current repo

- Public registration currently accepts roleId, which is unsafe for production.
- Login currently returns only an access token.
- Logout is stateless and does not revoke tokens.
- The current role and permission model is too minimal for the target authorization scope.

## 10. Implementation Roadmap

### Phase 1: Database, Prisma, and migrations

- Finalize the target domain model.
- Expand schema.prisma.
- Generate ordered migrations.

### Phase 2: Authentication

- Implement access and refresh tokens.
- Add logout and refresh flows.
- Add profile endpoint.

### Phase 3: User management

- Build staff account lifecycle endpoints.
- Add profile and password management.

### Phase 4: Roles and permissions

- Implement role and permission modules.
- Add guards and seeding.

### Phase 5: Business modules

- Build students, teachers, classes, terms, subjects.
- Add follow-up, evaluations, tutor assignment, and score modules.

### Phase 6: Testing

- Add unit tests for services and guards.
- Add integration tests for Prisma-backed workflows.
- Add e2e tests for auth and core business flows.

### Phase 7: Deployment

- Harden Docker images and compose settings.
- Separate development, staging, and production config.
- Add monitoring, backup, and migration runbooks.

## Open Questions

- Are students system users or domain records only?
- Is one role per user guaranteed, or can a user have multiple roles?
- Is follow-up closure an approval-based workflow?
- Can a student have more than one active tutor at the same time?
- Should score entries be append-only or updatable?
- Are notifications required in the first implementation phase or later?