# PNC-SPTS API - Role-Based Access Control Guide

## Overview

The PNC-SPTS (Student Progress Tracking System) API implements a comprehensive Role-Based Access Control (RBAC) system. This guide maps the system roles to your organizational structure and details what each role can access.

---

## Role Mapping to Your Organization

| System Role | Your Organization | Description |
|-------------|-------------------|-------------|
| **ADMIN** | Department Administrator | Full access to all student, user, and case management |
| **TUTOR** | Teacher | Access to assigned students and evaluations |
| **SUPER_ADMIN** | IT Department | System administration and configuration |
| **STUDENT** | Student | Self-service access to own records |
| **FOLLOWUP_OFFICER** | Follow-Up Staff | Specialized case management |
| **ACADEMIC_MANAGER** | Academic Oversight | Approval and reporting authority |

---

## 1. ADMIN (Department Administrator)

### 🎯 Access Level: **FULL ACCESS** to all operational features

Department Administrators have complete control over day-to-day operations including user management, student records, and follow-up cases.

### ✅ What ADMIN Can Do

#### **User Management**
- ✅ Create new users (teachers, students, staff)
- ✅ View all users in the system
- ✅ Update user information
- ✅ Assign roles to users (except SUPER_ADMIN)
- ✅ Activate/deactivate user accounts
- ✅ View and update own profile

#### **Student Management**
- ✅ Create new student records
- ✅ View all students (paginated, searchable)
- ✅ Update student information
- ✅ Delete student records
- ✅ Search students by name, code, or other criteria

#### **Follow-Up Case Management**
- ✅ Create follow-up cases for any student
- ✅ View all follow-up cases
- ✅ Update case details (status, priority, notes)
- ✅ Delete follow-up cases
- ✅ Assign cases to teachers/officers

#### **Evaluation & Reports**
- ✅ View all evaluations
- ✅ Create and update evaluations
- ✅ Access system reports
- ✅ Export data

#### **System Access**
- ✅ Health check endpoint
- ✅ All authentication features

### ❌ What ADMIN Cannot Do

- ❌ Create or modify system roles
- ❌ Manage permissions
- ❌ Delete other ADMIN or SUPER_ADMIN users
- ❌ Access system configuration
- ❌ View audit logs

### 📋 Postman Collection Folders for ADMIN

**Accessible Folders:**
```
✅ Auth/
   ├── Login
   ├── Register
   ├── Logout
   ├── Logout All
   ├── Refresh Token
   ├── Forgot Password
   ├── Reset Password
   └── Change Password

✅ Users/
   ├── Create User
   ├── Get All Users
   ├── Get User by ID
   ├── Update User
   ├── Assign Role to User
   ├── Update User Status
   ├── Get My Profile
   └── (DELETE User - NOT ALLOWED)

✅ Students/
   ├── Create Student
   ├── Get All Students
   ├── Get Student by ID
   ├── Update Student
   └── Delete Student

✅ Follow-Up Cases/
   ├── Create Follow-Up Case
   ├── Get All Follow-Up Cases
   ├── Get Follow-Up Case by ID
   ├── Update Follow-Up Case
   └── Delete Follow-Up Case

✅ User Profile/
   └── Get User Profile

✅ Health/
   └── Get Health Status

❌ Roles & Permissions/ (NOT ACCESSIBLE)
```

### 🔑 Permissions

```
user.create, user.read, user.update, user.assign_role
student.* (all student operations)
followup.* (all follow-up operations)
evaluation.* (all evaluation operations)
report.read
```

### 💡 Common Use Cases for ADMIN

1. **Onboarding New Teacher**
   - POST `/users` with role "TUTOR"
   - Assign students to teacher
   - Verify teacher can login

2. **Creating Follow-Up Case**
   - POST `/follow-up/cases` with student ID and teacher ID
   - Set priority and description
   - Track case status

3. **Managing Student Records**
   - POST `/students` to add new student
   - PATCH `/students/:id` to update information
   - GET `/students` to search and filter

---

## 2. TUTOR (Teacher)

### 🎯 Access Level: **LIMITED** - Assigned students and evaluations only

Teachers can view and evaluate students assigned to them. Data is automatically filtered to show only their assigned students.

### ✅ What TUTOR Can Do

#### **Student Access (Assigned Only)**
- ✅ View list of assigned students
- ✅ View details of assigned students
- ✅ Search within assigned students

#### **Evaluation & Scoring**
- ✅ Create evaluations for assigned students
- ✅ Update own evaluations
- ✅ Submit evaluations
- ✅ Create and update scores

#### **Follow-Up Cases (Limited)**
- ⚠️ View cases for assigned students
- ⚠️ Create cases for assigned students
- ⚠️ Update cases they created

#### **Profile Management**
- ✅ View own profile
- ✅ Update own profile
- ✅ Upload profile image
- ✅ Change password

#### **System Access**
- ✅ Health check endpoint
- ✅ All authentication features

### ❌ What TUTOR Cannot Do

- ❌ View or manage other users
- ❌ Create, update, or delete student records
- ❌ View students not assigned to them
- ❌ Delete follow-up cases
- ❌ Access system administration
- ❌ View all users or roles
- ❌ Assign roles or permissions

### 📋 Postman Collection Folders for TUTOR

**Accessible Folders:**
```
✅ Auth/
   └── (All authentication endpoints)

✅ User Profile/
   ├── Get User Profile
   └── (Update profile via Users/Get My Profile)

⚠️ Students/ (FILTERED - Assigned only)
   ├── Get All Students (returns only assigned)
   └── Get Student by ID (only if assigned)

⚠️ Follow-Up Cases/ (LIMITED)
   ├── Create Follow-Up Case (for assigned students)
   ├── Get All Follow-Up Cases (filtered to assigned students)
   └── Get Follow-Up Case by ID (if related to assigned student)

✅ Health/
   └── Get Health Status

❌ Users/ (NOT ACCESSIBLE except own profile)
❌ Roles & Permissions/ (NOT ACCESSIBLE)
```

### 🔑 Permissions

```
student.read_assigned (only assigned students)
evaluation.create, evaluation.update, evaluation.submit
score.create, score.update
```

### 💡 Common Use Cases for TUTOR

1. **View Assigned Students**
   - GET `/students` - Returns only students assigned to this teacher
   - GET `/students/:id` - View specific student details

2. **Create Evaluation**
   - POST `/evaluations` for assigned student
   - Add scores and comments
   - Submit evaluation

3. **Create Follow-Up Case**
   - POST `/follow-up/cases` for struggling student
   - Describe the issue
   - Set priority level

### ⚠️ Important Notes for Teachers

- **Data Filtering:** The system automatically filters all student data to show only students assigned to you. You won't see other teachers' students.
- **Case Creation:** You can create follow-up cases for your assigned students, but you cannot delete them.
- **Read-Only Students:** You cannot modify student records (name, code, etc.) - only view and evaluate.

---

## 3. SUPER_ADMIN (IT Department)

### 🎯 Access Level: **COMPLETE SYSTEM ACCESS**

IT Department has unrestricted access to all system features including system configuration, role management, and audit logs.

### ✅ What SUPER_ADMIN Can Do

#### **Everything ADMIN Can Do, PLUS:**

#### **Role & Permission Management**
- ✅ Create new roles
- ✅ Update role definitions
- ✅ Delete roles (except system roles)
- ✅ View all permissions
- ✅ Assign permissions to roles
- ✅ Manage role hierarchy

#### **Advanced User Management**
- ✅ Delete any user (including ADMIN)
- ✅ Create SUPER_ADMIN accounts
- ✅ Assign any role to any user
- ✅ View user audit logs

#### **System Administration**
- ✅ System configuration
- ✅ View audit logs
- ✅ Database management
- ✅ System health monitoring
- ✅ Security settings

#### **All Operational Features**
- ✅ Complete access to users, students, cases
- ✅ All CRUD operations on all entities
- ✅ Override any permission check

### ❌ What SUPER_ADMIN Cannot Do

- Nothing - SUPER_ADMIN has complete system access
- ⚠️ **Use with caution** - This role bypasses all security checks

### 📋 Postman Collection Folders for SUPER_ADMIN

**Accessible Folders:**
```
✅ Auth/
   └── (All authentication endpoints)

✅ Users/
   ├── Create User
   ├── Get All Users
   ├── Get User by ID
   ├── Update User
   ├── Delete User ⭐ (SUPER_ADMIN only)
   ├── Assign Role to User
   ├── Update User Status
   └── Get My Profile

✅ Roles & Permissions/ ⭐ (SUPER_ADMIN only)
   ├── Create Role
   ├── Get All Roles
   ├── Get Role by ID
   ├── Update Role
   ├── Delete Role
   ├── Get All Permissions
   └── Assign Permissions to Role

✅ Students/
   └── (All student operations)

✅ Follow-Up Cases/
   └── (All case operations)

✅ User Profile/
   └── Get User Profile

✅ Health/
   └── Get Health Status

✅ Root/
   └── Root Endpoint
```

### 🔑 Permissions

```
user.create, user.read, user.update, user.delete, user.assign_role
role.create, role.read, role.update, role.delete
permission.read, permission.assign
system.manage, audit.read
+ ALL other permissions (bypass enabled)
```

### 💡 Common Use Cases for SUPER_ADMIN

1. **Create New Role**
   - POST `/roles` with role name and description
   - POST `/roles/:id/permissions` to assign permissions
   - Test role with test user

2. **System Maintenance**
   - GET `/health` to check system status
   - Review audit logs
   - Manage database backups

3. **Emergency User Management**
   - Reset user passwords
   - Unlock accounts
   - Delete problematic users

### ⚠️ Security Best Practices for IT Department

- **Limit SUPER_ADMIN accounts** - Only create when absolutely necessary
- **Use ADMIN for daily tasks** - Reserve SUPER_ADMIN for system configuration
- **Audit regularly** - Review who has SUPER_ADMIN access
- **Rotate credentials** - Change passwords regularly
- **Log all actions** - Monitor SUPER_ADMIN activity

---

## 4. STUDENT

### 🎯 Access Level: **SELF-SERVICE ONLY**

Students can only view their own information. All data is strictly filtered to their own records.

### ✅ What STUDENT Can Do

#### **Profile Management**
- ✅ View own profile
- ✅ Update own profile information
- ✅ Upload profile image
- ✅ Change password

#### **View Own Records**
- ⚠️ View own student record
- ⚠️ View own follow-up cases
- ⚠️ View own evaluations
- ⚠️ View own scores

#### **System Access**
- ✅ Health check endpoint
- ✅ All authentication features

### ❌ What STUDENT Cannot Do

- ❌ View other students' information
- ❌ View other users
- ❌ Create, update, or delete any records
- ❌ View all students or cases
- ❌ Create follow-up cases
- ❌ Access administration features

### 📋 Postman Collection Folders for STUDENT

**Accessible Folders:**
```
✅ Auth/
   └── (All authentication endpoints)

✅ User Profile/
   └── Get User Profile (own only)

⚠️ Students/ (OWN RECORD ONLY)
   └── Get Student by ID (only own ID)

⚠️ Follow-Up Cases/ (OWN CASES ONLY)
   ├── Get All Follow-Up Cases (filtered to own)
   └── Get Follow-Up Case by ID (only own cases)

✅ Health/
   └── Get Health Status

❌ Users/ (NOT ACCESSIBLE)
❌ Roles & Permissions/ (NOT ACCESSIBLE)
```

### 🔑 Permissions

```
profile.read
followup.read_own (only own cases)
evaluation.read_own (only own evaluations)
score.read_own (only own scores)
```

### 💡 Common Use Cases for STUDENT

1. **View Own Profile**
   - GET `/users/profile` - View own information
   - PATCH `/users/profile` - Update contact info

2. **Check Follow-Up Cases**
   - GET `/follow-up/cases` - View cases about you
   - GET `/follow-up/cases/:id` - View case details

3. **View Grades/Evaluations**
   - GET `/evaluations` - View your evaluations
   - GET `/scores` - View your scores

### ⚠️ Important Notes for Students

- **Privacy Protected:** You can only see your own information, never other students' data
- **Read-Only:** You cannot create or modify records, only view
- **Case Visibility:** You can see follow-up cases created about you by teachers

---

## Quick Reference: Access Comparison Table

| Feature | ADMIN | TUTOR | SUPER_ADMIN | STUDENT |
|---------|-------|-------|-------------|---------|
| **User Management** |
| Create users | ✅ | ❌ | ✅ | ❌ |
| View all users | ✅ | ❌ | ✅ | ❌ |
| Delete users | ❌ | ❌ | ✅ | ❌ |
| Assign roles | ✅ | ❌ | ✅ | ❌ |
| **Student Management** |
| Create students | ✅ | ❌ | ✅ | ❌ |
| View all students | ✅ | ⚠️ Assigned | ✅ | ⚠️ Own |
| Update students | ✅ | ❌ | ✅ | ❌ |
| Delete students | ✅ | ❌ | ✅ | ❌ |
| **Follow-Up Cases** |
| Create cases | ✅ | ⚠️ Limited | ✅ | ❌ |
| View all cases | ✅ | ⚠️ Assigned | ✅ | ⚠️ Own |
| Update cases | ✅ | ⚠️ Limited | ✅ | ❌ |
| Delete cases | ✅ | ❌ | ✅ | ❌ |
| **Roles & Permissions** |
| Create roles | ❌ | ❌ | ✅ | ❌ |
| View roles | ❌ | ❌ | ✅ | ❌ |
| Assign permissions | ❌ | ❌ | ✅ | ❌ |
| **System** |
| View audit logs | ❌ | ❌ | ✅ | ❌ |
| System config | ❌ | ❌ | ✅ | ❌ |

**Legend:**
- ✅ Full access
- ❌ No access
- ⚠️ Limited/filtered access

---

## Testing in Postman

### Step 1: Set Up Environment

1. Open Postman and select your environment (e.g., `api-stgs-pnc`)
2. Verify these variables are set:
   - `base_url` - Your API URL
   - `token` - Will be set automatically after login

### Step 2: Login as Different Roles

Use the **Login** request in the **Auth** folder:

```yaml
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Test Accounts (if seeded):**
- ADMIN: `admin@example.com`
- TUTOR: `teacher@example.com`
- SUPER_ADMIN: `superadmin@example.com`
- STUDENT: `student@example.com`

The response includes an `accessToken` which is automatically saved to the `token` variable.

### Step 3: Test Role Access

#### Testing ADMIN Access:
```
✅ GET /users → Should return 200 with all users
✅ POST /students → Should return 201 with new student
✅ POST /follow-up/cases → Should return 201
❌ POST /roles → Should return 403 Forbidden
❌ DELETE /users/:id → Should return 403 Forbidden
```

#### Testing TUTOR Access:
```
✅ GET /students → Should return 200 (only assigned students)
✅ GET /users/profile → Should return 200 (own profile)
❌ GET /users → Should return 403 Forbidden
❌ POST /students → Should return 403 Forbidden
❌ DELETE /follow-up/cases/:id → Should return 403 Forbidden
```

#### Testing SUPER_ADMIN Access:
```
✅ GET /users → Should return 200
✅ POST /roles → Should return 201
✅ DELETE /users/:id → Should return 200
✅ GET /permissions → Should return 200
✅ Everything → Should work
```

#### Testing STUDENT Access:
```
✅ GET /users/profile → Should return 200 (own profile)
✅ GET /follow-up/cases → Should return 200 (own cases only)
❌ GET /users → Should return 403 Forbidden
❌ GET /students → Should return 403 Forbidden
❌ POST /follow-up/cases → Should return 403 Forbidden
```

### Step 4: Verify Error Responses

**401 Unauthorized** - No token or expired token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Valid token but insufficient permissions:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**404 Not Found** - Resource doesn't exist or filtered out:
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

---

## Postman Collection Structure

Your collection is organized in folders. Here's what each role can access:

```
PNC-SPTS-API/
├── Auth/                    ✅ All roles
├── Users/                   ✅ ADMIN, SUPER_ADMIN | ❌ TUTOR, STUDENT
├── Roles & Permissions/     ✅ SUPER_ADMIN only
├── Students/                ✅ ADMIN, SUPER_ADMIN | ⚠️ TUTOR (filtered) | ⚠️ STUDENT (own)
├── Follow-Up Cases/         ✅ ADMIN, SUPER_ADMIN | ⚠️ TUTOR (limited) | ⚠️ STUDENT (own)
├── User Profile/            ✅ All roles (own profile)
├── Health/                  ✅ All roles
└── Root/                    ✅ All roles
```

---

## Role Assignment Workflow

### How to Assign Roles (ADMIN or SUPER_ADMIN)

1. **Create User First:**
   ```
   POST /users
   {
     "email": "newteacher@school.edu",
     "password": "SecurePass123!",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```

2. **Assign Role:**
   ```
   PATCH /users/:userId/role
   {
     "roleId": "role-uuid-here"
   }
   ```

3. **Get Role IDs:**
   ```
   GET /roles
   ```
   Response includes role IDs for ADMIN, TUTOR, STUDENT, etc.

### Role Hierarchy for Assignment

| Your Role | Can Assign These Roles |
|-----------|------------------------|
| SUPER_ADMIN | ADMIN, TUTOR, STUDENT, FOLLOWUP_OFFICER, ACADEMIC_MANAGER |
| ADMIN | TUTOR, STUDENT, FOLLOWUP_OFFICER, ACADEMIC_MANAGER |
| Others | Cannot assign roles |

---

## Security Best Practices

### For IT Department (SUPER_ADMIN)
1. ✅ Create minimal SUPER_ADMIN accounts (1-2 maximum)
2. ✅ Use ADMIN accounts for daily operations
3. ✅ Enable audit logging
4. ✅ Rotate passwords every 90 days
5. ✅ Use strong passwords (12+ characters)
6. ✅ Monitor access logs regularly

### For Department Administrators (ADMIN)
1. ✅ Don't share credentials
2. ✅ Logout when leaving workstation
3. ✅ Use HTTPS only (never HTTP)
4. ✅ Verify user identity before creating accounts
5. ✅ Review user access quarterly

### For Teachers (TUTOR)
1. ✅ Only access assigned students
2. ✅ Don't share login credentials
3. ✅ Report suspicious activity
4. ✅ Logout after each session

### For Students
1. ✅ Keep password private
2. ✅ Change password if compromised
3. ✅ Report any data access issues

---

## Troubleshooting

### Problem: "403 Forbidden" Error

**Cause:** Your role doesn't have permission for this endpoint

**Solution:**
1. Verify you're logged in (check `token` variable)
2. Confirm your role with `GET /users/profile`
3. Check this guide for your role's permissions
4. Contact ADMIN if you need different access

### Problem: "401 Unauthorized" Error

**Cause:** No token or expired token

**Solution:**
1. Login again: `POST /auth/login`
2. Check token is saved in environment variable
3. Use refresh token: `POST /auth/refresh`

### Problem: Empty Results When Expecting Data

**Cause:** Data filtering (TUTOR seeing no students, STUDENT seeing no cases)

**Solution:**
1. **TUTOR:** Verify students are assigned to you (contact ADMIN)
2. **STUDENT:** Verify you have cases/evaluations created
3. Check you're using correct student/user ID

### Problem: Cannot Delete User

**Cause:** Only SUPER_ADMIN can delete users

**Solution:**
1. Use `PATCH /users/:id/status` to deactivate instead
2. Contact IT Department for permanent deletion

---

## API Endpoint Reference

### Authentication Endpoints (All Roles)
```
POST   /auth/register          - Register new account
POST   /auth/login             - Login
POST   /auth/logout            - Logout current session
POST   /auth/logout-all        - Logout all sessions
POST   /auth/refresh           - Refresh access token
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset password with token
POST   /auth/change-password   - Change password (authenticated)
```

### User Endpoints
```
POST   /users                  - Create user (ADMIN, SUPER_ADMIN)
GET    /users                  - List users (ADMIN, SUPER_ADMIN)
GET    /users/:id              - Get user (ADMIN, SUPER_ADMIN)
PATCH  /users/:id              - Update user (ADMIN, SUPER_ADMIN)
DELETE /users/:id              - Delete user (SUPER_ADMIN only)
PATCH  /users/:id/role         - Assign role (ADMIN, SUPER_ADMIN)
PATCH  /users/:id/status       - Update status (ADMIN, SUPER_ADMIN)
GET    /users/profile          - Get own profile (All authenticated)
PATCH  /users/profile          - Update own profile (All authenticated)
POST   /users/profile/image    - Upload profile image (All authenticated)
```

### Role & Permission Endpoints
```
POST   /roles                  - Create role (SUPER_ADMIN only)
GET    /roles                  - List roles (SUPER_ADMIN only)
GET    /roles/:id              - Get role (SUPER_ADMIN only)
PATCH  /roles/:id              - Update role (SUPER_ADMIN only)
DELETE /roles/:id              - Delete role (SUPER_ADMIN only)
GET    /permissions            - List permissions (SUPER_ADMIN only)
POST   /roles/:id/permissions  - Assign permissions (SUPER_ADMIN only)
```

### Student Endpoints
```
POST   /students               - Create student (ADMIN, SUPER_ADMIN)
GET    /students               - List students (ADMIN, SUPER_ADMIN, TUTOR*, STUDENT*)
GET    /students/:id           - Get student (ADMIN, SUPER_ADMIN, TUTOR*, STUDENT*)
PATCH  /students/:id           - Update student (ADMIN, SUPER_ADMIN)
DELETE /students/:id           - Delete student (ADMIN, SUPER_ADMIN)

* TUTOR: Only assigned students
* STUDENT: Only own record
```

### Follow-Up Case Endpoints
```
POST   /follow-up/cases        - Create case (ADMIN, SUPER_ADMIN, TUTOR*)
GET    /follow-up/cases        - List cases (ADMIN, SUPER_ADMIN, TUTOR*, STUDENT*)
GET    /follow-up/cases/:id    - Get case (ADMIN, SUPER_ADMIN, TUTOR*, STUDENT*)
PUT    /follow-up/cases/:id    - Update case (ADMIN, SUPER_ADMIN, TUTOR*)
DELETE /follow-up/cases/:id    - Delete case (ADMIN, SUPER_ADMIN)

* TUTOR: Limited to assigned students
* STUDENT: Only own cases
```

### System Endpoints (All Roles)
```
GET    /                       - Root endpoint
GET    /health                 - Health check
```

---

## Additional Resources

- **Postman Collection:** `postman/collections/PNC-SPTS-API/`
- **Environment Files:** `postman/environments/`
- **Source Code:** `src/modules/permissions/rbac.constants.ts`
- **API Documentation:** Access Swagger UI at `{{base_url}}/api-docs`

---

## Document Information

**Version:** 1.0  
**Last Updated:** June 2026  
**Maintained By:** IT Department  
**Contact:** For access issues or questions, contact your system administrator

---

## Quick Start Checklist

### For New ADMIN Users:
- [ ] Receive credentials from IT Department
- [ ] Login via Postman Auth/Login
- [ ] Test access with GET /users
- [ ] Create test student record
- [ ] Create test follow-up case
- [ ] Update own profile

### For New TUTOR Users:
- [ ] Receive credentials from ADMIN
- [ ] Login via Postman Auth/Login
- [ ] Verify assigned students with GET /students
- [ ] Test creating evaluation
- [ ] Update own profile

### For New STUDENT Users:
- [ ] Receive credentials from ADMIN
- [ ] Login via Postman Auth/Login
- [ ] View own profile with GET /users/profile
- [ ] Check follow-up cases with GET /follow-up/cases

### For IT Department (SUPER_ADMIN):
- [ ] Secure SUPER_ADMIN credentials
- [ ] Create ADMIN accounts
- [ ] Configure roles and permissions
- [ ] Set up monitoring and audit logs
- [ ] Test all role access levels
- [ ] Document custom configurations
