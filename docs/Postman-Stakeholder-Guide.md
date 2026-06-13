# Prompt‑Engineer for Postman – PNC‑SPTS‑API

## Overview
This guide helps **non‑technical stakeholders** (Department Admin, Teachers, IT Department, Students) use the **Postman collection** included in this repository to interact with the NestJS API. Each folder in the collection mirrors a stakeholder group and contains ready‑to‑run requests with example payloads.

---

## 1. Access the collection in Postman

### Option A: Using Postman Desktop with Local Workspace (Recommended)
1. Open **Postman Desktop** application.
2. Create or open a **Local Workspace** linked to this repository.
3. Navigate to **File → Open Folder** and select this project directory:
   ```
   C:\Users\LOQ\Desktop\School Document\PNC_PROJECT\PNC-SPTS-API
   ```
4. Postman will automatically detect and load collections from the `postman/collections/` folder.
5. The collection will appear as **PNC‑SPTS‑API** in your workspace sidebar.

### Option B: Import from Cloud Workspace
1. If the collection is already published to a Postman cloud workspace, join that workspace.
2. The collection will be available under **Collections** in the left sidebar.
3. You can **Pull from Cloud** to sync the latest changes to your local workspace.

---

## 2. Understanding the File System Mode structure

This project uses **YAML-based File System Mode**, where collections are stored as files in the repository:

```
postman/
├── collections/
│   └── PNC-SPTS-API/              # Main collection folder
│       ├── Auth/                   # Authentication requests
│       ├── Follow-Up Cases/        # Follow-up case management
│       ├── Health/                 # System health checks
│       ├── Roles & Permissions/    # Role management
│       ├── Students/               # Student operations
│       ├── User Profile/           # User profile management
│       └── Users/                  # User management
├── environments/
│   ├── api-stgs-pnc.environment.yaml
│   ├── PNC-SPTS - Development.environment.yaml
│   ├── PNC-SPTS - Local.environment.yaml
│   ├── PNC-SPTS - Production.environment.yaml
│   └── PNC-SPTS - Staging.environment.yaml
└── globals/
    └── workspace.globals.yaml
```

**Benefits of YAML format:**
- Version control friendly (easy to track changes in Git)
- Human-readable and editable in any text editor
- Automatic sync between Postman and your local files
- Team collaboration through Git workflows

---

## 3. Set up environment variables

The project includes **5 pre-configured environments** in `postman/environments/`:

### Available Environments:
| Environment | Purpose | Base URL Example |
|-------------|---------|------------------|
| **PNC-SPTS - Local** | Local development | `http://localhost:3000/api` |
| **PNC-SPTS - Development** | Dev server | `https://dev.pnc-spts.com/api` |
| **PNC-SPTS - Staging** | Staging/testing | `https://staging.pnc-spts.com/api` |
| **api-stgs-pnc** | Active staging environment | *(currently active)* |
| **PNC-SPTS - Production** | Live production | `https://api.pnc-spts.com/api` |

### Key Variables:
| Variable | Description | Usage |
|----------|-------------|-------|
| `base_url` | Base URL of the API | Used in all requests as `{{base_url}}` |
| `token` | JWT authentication token | Auto-set after login, used in Authorization header |

### To switch environments:
1. Click the **environment dropdown** in the top-right corner of Postman.
2. Select the desired environment (e.g., "PNC-SPTS - Local" for local testing).
3. All requests will automatically use the `{{base_url}}` from that environment.

### To edit environment variables:
1. Click the **environment dropdown** → **Edit** (pencil icon).
2. Modify the `CURRENT VALUE` column (not synced to Git).
3. The `INITIAL VALUE` is stored in the YAML file and synced via Git.

---

## 4. Folder structure & purpose

| Folder (Postman) | Stakeholder | Typical actions | Example requests |
|-------------------|------------|----------------|------------------|
| **Auth** | All users | Login, register, password reset | `POST {{base_url}}/auth/login` |
| **Users** | Admin, IT Department | User management, role assignment | `GET {{base_url}}/users` |
| **Roles & Permissions** | Admin, Department heads | Configure access control | `POST {{base_url}}/roles` |
| **Students** | Teachers, Admin | Student records, enrollment | `GET {{base_url}}/students` |
| **Follow-Up Cases** | Teachers, Counselors | Daily follow-up recording | `POST {{base_url}}/follow-up-cases` |
| **User Profile** | All authenticated users | View/update own profile | `GET {{base_url}}/profile` |
| **Health** | IT Department | System monitoring, health checks | `GET {{base_url}}/health` |

Each folder contains multiple requests stored as `.request.yaml` files in the file system.

---

## 5. Using a request

1. **Navigate to the folder** that matches your role in the Collections sidebar.
2. **Click the request** (e.g., *Login*, *Create Follow-Up Case*).
3. Review the **Headers** tab – `Content-Type: application/json` and `Authorization: Bearer {{token}}` are configured automatically.
4. **Edit the Body** tab if you need different data; example JSON payloads are pre-filled.
5. **Select the correct environment** from the dropdown (top-right).
6. Press **Send** and inspect the response pane.

### Authentication Flow:
1. Start with **Auth → Login** request.
2. The response will contain a `token` field.
3. This token is **automatically saved** to the `token` environment variable via a post-response script.
4. All subsequent requests will use `{{token}}` in the Authorization header.

---

## 6. Example JSON payloads

### Auth – Login
```json
{
  "email": "admin@pnc.edu",
  "password": "SecurePassword123!"
}
```

### Teachers – Create Follow-Up Case
```json
{
  "studentId": "STU-12345",
  "teacherId": "TCH-67890",
  "date": "2026-06-13",
  "category": "Academic",
  "description": "Students struggled with Chapter 5; assigned extra reading.",
  "actionTaken": "Scheduled tutoring session",
  "followUpRequired": true
}
```

### IT Department – Health Check
*GET request – no body required.*
```
GET {{base_url}}/health
```

### Users – Get All Users (Admin)
*GET request with optional query parameters:*
```
GET {{base_url}}/users?page=1&limit=10&role=teacher
```

### Students – List Students
*GET request – no body required.*
```
GET {{base_url}}/students
```

---

## 7. Extending the collection

### Adding a new request:
1. **In Postman**: Right-click the appropriate folder → **Add Request**.
2. Configure method, URL (using `{{base_url}}`), headers, and body.
3. **Save** – Postman automatically creates a `.request.yaml` file in the corresponding folder.
4. The file appears in your Git working directory under `postman/collections/PNC-SPTS-API/`.

### Adding a new folder:
1. Right-click the collection → **Add Folder**.
2. Name it appropriately (e.g., "Reports", "Notifications").
3. A new subfolder is created in the file system.

### Syncing changes:
1. **Local changes** are automatically reflected in the YAML files.
2. **Commit to Git**:
   ```bash
   git add postman/
   git commit -m "Add new stakeholder requests"
   git push
   ```
3. **Team members** can pull the changes and see the updated collection in their Postman.

---

## 8. Collaboration workflow

### For team members:
1. **Clone the repository** or pull latest changes:
   ```bash
   git pull origin main
   ```
2. **Open the workspace** in Postman Desktop (File → Open Folder).
3. Postman automatically loads the updated collections and environments.

### For cloud sync:
1. If working in a cloud workspace, use **Pull from Cloud** to get latest changes.
2. Make your changes in Postman.
3. **Commit and push** the YAML files to Git.
4. Other team members can **Pull from Cloud** or sync via Git.

### Resolving conflicts:
- If you have local changes and cloud changes, Postman will show a **Pull from Cloud** dialog.
- Review conflicts and choose which version to keep.
- Commit your resolved changes to Git.

---

## 9. Troubleshooting

### Common issues:

**401 Unauthorized**
- Verify that you're logged in (run the **Auth → Login** request first).
- Check that `{{token}}` variable is set in your active environment.
- Token may be expired – login again to refresh.

**404 Not Found**
- Ensure the endpoint path matches the NestJS controller routes.
- Verify you're using the correct environment (Local vs Development vs Production).
- Check that `{{base_url}}` is correctly set in your active environment.

**500 Internal Server Error**
- Check NestJS logs: `docker logs nestjs` or view console output.
- Database migration errors (P3009) must be resolved before the API works.
- Verify database connection in your `.env` file.

**Collection not appearing in Postman**
- Ensure you've opened the correct folder in Postman (File → Open Folder).
- Check that the `postman/collections/` directory exists and contains YAML files.
- Try closing and reopening the workspace.

**Environment variables not working**
- Verify you've selected an environment from the dropdown (top-right).
- Check that variables are defined in the environment (click the eye icon 👁️).
- Use `{{variable_name}}` syntax in requests (double curly braces).

**Pull from Cloud issues**
- Ensure you have no uncommitted Git changes: `git status`
- Commit local changes first: `git add . && git commit -m "Save local changes"`
- Then retry the pull operation in Postman.

---

## 10. Quick start checklist

- [ ] Clone the repository and open it in Postman Desktop (File → Open Folder).
- [ ] Select the **PNC-SPTS - Local** environment from the dropdown.
- [ ] Update the `base_url` variable to match your local server (e.g., `http://localhost:3000/api`).
- [ ] Run **Auth → Login** to authenticate and set the `{{token}}` variable.
- [ ] Test **Health → Health Check** to verify API connectivity (should return `200 OK`).
- [ ] Execute a **Follow-Up Cases → Create Follow-Up Case** request to test data creation.
- [ ] Retrieve **Students → Get All Students** to verify data retrieval.
- [ ] Commit any changes to Git and push to share with your team.

---

## 11. Additional resources

- **Postman File System Mode Documentation**: [Learn about local workspaces](https://learning.postman.com/docs/collaborating-in-postman/using-workspaces/file-system-workspaces/)
- **Environment Variables Guide**: [Using variables in Postman](https://learning.postman.com/docs/sending-requests/variables/)
- **Collection Format (v3 YAML)**: [Postman Collection Format](https://learning.postman.com/collection-format/)
- **NestJS API Documentation**: See `README.md` in the project root

---

*Updated for YAML-based File System Mode – Last modified: 2026-06-13*
