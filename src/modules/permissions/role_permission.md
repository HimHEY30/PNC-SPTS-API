# User Management & Role Assignment Module

## Overview

The User Management module is responsible for creating, updating, assigning roles, activating, and deactivating users within the Student Follow-Up System.

The system uses Role-Based Access Control (RBAC) to ensure that users can only perform actions allowed by their assigned role.

Public registration is disabled. All users must be created by authorized system users.

---

# Role Hierarchy

```text
SUPER_ADMIN
├── ADMIN
│   ├── ACADEMIC_MANAGER
│   ├── FOLLOWUP_OFFICER
│   ├── TUTOR
│   └── STUDENT
```

Higher-level roles can manage lower-level roles only.

---

# User Registration Policy

## Public Registration

Public registration is NOT supported.

```http
POST /api/auth/register
```

Status:

```text
DISABLED
```

Reason:

- Internal management system
- User accounts are controlled by authorized staff
- Prevent unauthorized access

---

# User Creation

## Endpoint

```http
POST /api/users
```

## Authentication

```http
Authorization: Bearer <access_token>
```

## Permission Required

```text
user.create
```

## Request Body

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "012345678",
  "password": "TempPassword123!",
  "role": "TUTOR"
}
```

---

# Validation Rules

## First Name

- Required
- Maximum 100 characters

## Last Name

- Required
- Maximum 100 characters

## Email

- Required
- Must be unique
- Valid email format

## Phone

- Optional
- Must be unique

## Password

- Required
- Minimum 8 characters
- Must contain:
  - Uppercase letter
  - Lowercase letter
  - Number
  - Special character

## Role

- Required
- Must exist in roles table

---

# Role Creation Matrix

## SUPER_ADMIN

Can Create:

```text
ADMIN
ACADEMIC_MANAGER
FOLLOWUP_OFFICER
TUTOR
STUDENT
```

Cannot Create:

```text
SUPER_ADMIN
```

---

## ADMIN

Can Create:

```text
ACADEMIC_MANAGER
FOLLOWUP_OFFICER
TUTOR
STUDENT
```

Cannot Create:

```text
SUPER_ADMIN
ADMIN
```

---

## ACADEMIC_MANAGER

Can Create:

```text
FOLLOWUP_OFFICER
TUTOR
STUDENT
```

Cannot Create:

```text
SUPER_ADMIN
ADMIN
ACADEMIC_MANAGER
```

---

## FOLLOWUP_OFFICER

Can Create:

```text
STUDENT
```

Cannot Create:

```text
SUPER_ADMIN
ADMIN
ACADEMIC_MANAGER
FOLLOWUP_OFFICER
TUTOR
```

---

## TUTOR

Cannot create users.

---

## STUDENT

Cannot create users.

---

# Role Assignment

## Endpoint

```http
PATCH /api/users/:id/role
```

## Permission Required

```text
user.assign_role
```

## Request Body

```json
{
  "role": "ACADEMIC_MANAGER"
}
```

---

# Role Assignment Rules

Users may assign only roles that they are authorized to create.

### SUPER_ADMIN

Can Assign:

```text
ADMIN
ACADEMIC_MANAGER
FOLLOWUP_OFFICER
TUTOR
STUDENT
```

### ADMIN

Can Assign:

```text
ACADEMIC_MANAGER
FOLLOWUP_OFFICER
TUTOR
STUDENT
```

### ACADEMIC_MANAGER

Can Assign:

```text
FOLLOWUP_OFFICER
TUTOR
STUDENT
```

### FOLLOWUP_OFFICER

Can Assign:

```text
STUDENT
```

---

# User Update

## Endpoint

```http
PATCH /api/users/:id
```

## Permission Required

```text
user.update
```

## Request Body

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "012345678"
}
```

---

# User Status Management

## Endpoint

```http
PATCH /api/users/:id/status
```

## Permission Required

```text
user.update
```

## Request Body

```json
{
  "status": "ACTIVE"
}
```

---

# User Status Values

```text
ACTIVE
INACTIVE
SUSPENDED
LOCKED
```

### ACTIVE

User can access the system.

### INACTIVE

User cannot login.

### SUSPENDED

User is temporarily blocked.

### LOCKED

System automatically locks account after security violations.

---

# Soft Delete Policy

Users are never permanently deleted.

Instead:

```text
status = INACTIVE
deleted_at = timestamp
```

Benefits:

- Preserve audit history
- Preserve relationships
- Support account recovery

---

# Default Permissions

## SUPER_ADMIN

```text
user.create
user.read
user.update
user.delete
user.assign_role

role.create
role.read
role.update
role.delete

permission.read
permission.assign

system.manage
audit.read
```

---

## ADMIN

```text
user.create
user.read
user.update
user.assign_role

student.*
followup.*
evaluation.*
report.read
```

---

## ACADEMIC_MANAGER

```text
student.read
student.update

followup.read
followup.approve

evaluation.read
evaluation.approve

report.read
```

---

## FOLLOWUP_OFFICER

```text
student.read
student.update

followup.create
followup.update
followup.close
```

---

## TUTOR

```text
student.read_assigned

evaluation.create
evaluation.update
evaluation.submit

score.create
score.update
```

---

## STUDENT

```text
profile.read

followup.read_own

evaluation.read_own

score.read_own
```

---

# Security Rules

## Prevent Privilege Escalation

The backend must validate role assignment permissions.

Example:

```json
{
  "role": "SUPER_ADMIN"
}
```

An ADMIN attempting this action must receive:

```http
403 Forbidden
```

Response:

```json
{
  "error": "FORBIDDEN",
  "message": "You are not allowed to assign this role."
}
```

---

# Audit Logging

Every sensitive user action must be logged.

## User Created

```json
{
  "action": "USER_CREATED",
  "performed_by": 1,
  "target_user": 25,
  "role_assigned": "TUTOR"
}
```

---

## Role Changed

```json
{
  "action": "ROLE_CHANGED",
  "performed_by": 1,
  "target_user": 25,
  "old_role": "STUDENT",
  "new_role": "TUTOR"
}
```

---

## User Disabled

```json
{
  "action": "USER_DISABLED",
  "performed_by": 1,
  "target_user": 25
}
```

---

# Acceptance Criteria

- Public registration is disabled
- Only authorized users can create accounts
- Role hierarchy is enforced
- Users cannot assign higher roles than permitted
- Email addresses must be unique
- Password policy is enforced
- User creation is logged
- Role changes are logged
- Soft delete is supported
- Inactive users cannot login
- RBAC permissions are enforced across all protected endpoints
- Audit logs are generated for security-sensitive actions

---

# Future Enhancements

- Multi-role support
- Department-based permissions
- Permission groups
- User invitation workflow
- Email verification
- SSO Integration (Google, Microsoft, LDAP)
- Two-Factor Authentication (2FA)
- Advanced Audit Reports