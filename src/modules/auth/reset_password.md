# Authentication - Change Password & Password Reset

## Overview

This module provides secure password management functionality for authenticated users and password recovery for users who have forgotten their passwords.

## Features

- Change password for authenticated users
- Password reset request via email
- Secure reset token generation
- One-time password reset token usage
- Token expiration after 1 hour
- Password hashing using bcrypt
- Automatic revocation of all active sessions after password reset
- Protection against email enumeration attacks

---

# Endpoints

## 1. Change Password

### Endpoint

```http
POST /api/auth/change-password
```

### Authentication

Required (JWT Access Token)

### Request Body

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

### Process

1. Verify authenticated user.
2. Retrieve user password hash from database.
3. Compare `currentPassword` with stored hash using bcrypt.
4. Validate new password policy.
5. Hash new password using bcrypt.
6. Update user password.
7. Return success response.

### Success Response

```json
{
  "message": "Password changed successfully"
}
```

### Error Responses

#### Invalid Current Password

```json
{
  "error": "INVALID_CURRENT_PASSWORD"
}
```

#### Validation Error

```json
{
  "error": "VALIDATION_ERROR"
}
```

---

# 2. Forgot Password

### Endpoint

```http
POST /api/auth/forgot-password
```

### Authentication

Not Required

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Process

1. Accept email address.
2. Search user by email.
3. If user exists:
   - Generate secure random token.
   - Hash token before storing.
   - Store token in `password_reset_tokens`.
   - Set expiration to 1 hour.
   - Publish event or trigger email service.
4. If user does not exist:
   - Do nothing.
5. Always return 200 OK.

### Security

To prevent email enumeration attacks, the API always returns the same response regardless of whether the email exists.

### Success Response

```json
{
  "message": "If the account exists, a password reset link has been sent."
}
```

---

# Password Reset Token Storage

## Table: password_reset_tokens

| Column | Description |
|----------|------------|
| id | Primary key |
| user_id | Related user |
| token_hash | Hashed reset token |
| expires_at | Expiration timestamp |
| used_at | Token usage timestamp |
| created_at | Creation timestamp |

### Example

```sql
id
user_id
token_hash
expires_at
used_at
created_at
```

---

# 3. Reset Password

### Endpoint

```http
POST /api/auth/reset-password
```

### Authentication

Not Required

### Request Body

```json
{
  "token": "reset_token",
  "newPassword": "NewPassword123"
}
```

### Process

1. Validate token exists.
2. Validate token is not expired.
3. Validate token has not been used.
4. Hash new password using bcrypt.
5. Update user password.
6. Mark reset token as used.
7. Revoke all active refresh tokens.
8. Return success response.

### Success Response

```json
{
  "message": "Password reset successfully"
}
```

### Error Responses

#### Invalid Token

```json
{
  "error": "INVALID_RESET_TOKEN"
}
```

#### Expired Token

```json
{
  "error": "RESET_TOKEN_EXPIRED"
}
```

#### Used Token

```json
{
  "error": "RESET_TOKEN_ALREADY_USED"
}
```

---

# Session Revocation

After successful password reset:

- All refresh tokens belonging to the user are revoked.
- All active sessions are invalidated.
- User must log in again on all devices.

Example:

```sql
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE user_id = ?;
```

---

# Security Considerations

## Password Hashing

Passwords are never stored in plain text.

Implementation uses:

```ts
bcrypt.hash(password, saltRounds);
```

Recommended:

```ts
const saltRounds = 12;
```

---

## Reset Token Security

- Token generated using cryptographically secure random bytes.
- Raw token is never stored.
- Only hashed token is saved.
- Token expires after 1 hour.
- Token can only be used once.

Example:

```ts
const token = crypto.randomBytes(32).toString('hex');

const tokenHash = await bcrypt.hash(token, 10);
```

---

# Acceptance Criteria

## Change Password

- [x] Requires authentication
- [x] Validates current password
- [x] Hashes new password using bcrypt
- [x] Updates password successfully

## Forgot Password

- [x] Accepts email address
- [x] Generates secure reset token
- [x] Stores hashed token
- [x] Token expires after 1 hour
- [x] Triggers email/event service
- [x] Always returns 200 OK

## Reset Password

- [x] Validates token existence
- [x] Rejects expired tokens
- [x] Rejects used tokens
- [x] Updates password using bcrypt hash
- [x] Marks token as used
- [x] Revokes all active sessions

## Security

- [x] Password stored as bcrypt hash
- [x] Reset token is single-use
- [x] Reset token expires after 1 hour
- [x] Email enumeration prevention implemented