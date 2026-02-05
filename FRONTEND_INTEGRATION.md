# TalentX Backend – Frontend Integration Guide

This document describes how to integrate the TalentX frontend with the backend REST API.

---

## 1. Base URL and environment

- **Base URL:** Use an environment variable, e.g. `VITE_API_BASE_URL` or `REACT_APP_API_BASE_URL`, so you can switch between local and production.
- **Examples:**
  - Local: `http://localhost:3000`
  - Production: `https://api.your-talentx-domain.com`

All endpoints are relative to this base (e.g. `GET {baseUrl}/jobs`).

**Health check:** `GET /health` → `{ "ok": true }`. Use this to verify the backend is up.

---

## 2. Authentication

The backend uses **Firebase Authentication**. For every protected request:

1. Get the current user’s **Firebase ID token** (e.g. `user.getIdToken()` or `auth.currentUser.getIdToken()`).
2. Send it in the **Authorization** header:

```http
Authorization: Bearer <idToken>
```

- **Missing or invalid token** → `401` with `{ "error": "Missing or invalid Authorization header" }` or `{ "error": "Invalid or expired token" }`.
- **Valid token but wrong role for the endpoint** → `403` with `{ "error": "Forbidden", "code": "ROLE_MISMATCH" }`.

**When to send the header:** For all routes marked “Auth: yes” in the tables below. Do not send the header for public routes (e.g. `GET /jobs`, `GET /jobs/:id`) unless you want to identify the user for other reasons.

**Token refresh:** ID tokens expire. Refresh the token (e.g. `getIdToken(true)`) when you get `401` and retry the request, or use a short-lived refresh strategy so the header is always valid.

---

## 3. User roles and onboarding

- **Roles:** `EMPLOYER` | `TALENT`. Set once during onboarding.
- **Onboarding:** After the user signs in with Firebase, call `POST /users/onboard` with their chosen role. Until then, `req.user.role` is not set and role-protected endpoints will return `403`.

Store the onboarded user (e.g. `uid`, `name`, `email`, `role`, and optionally `skills`) in your app state so you can:
- Show role-specific UI (employer vs talent).
- Only call employer-only or talent-only endpoints when the role matches.

---

## 4. Error responses

All errors return JSON in this shape:

```json
{
  "error": "Human-readable message",
  "code": "OPTIONAL_CODE"
}
```

Common status codes:

| Status | Meaning |
|--------|--------|
| 400 | Bad request (validation, business rule, e.g. deadline passed, already applied). |
| 401 | Missing or invalid Firebase token. |
| 403 | Forbidden (wrong role or not owner of resource). |
| 404 | Resource not found (e.g. job, invitation). |
| 500 | Server error. |
| 502 / 503 | AI (Gemini) or external service failure. |

Always read `error` (and optional `code`) to show a message or handle retry/redirect (e.g. 401 → re-auth).

---

## 5. API reference

### 5.1 Auth / user

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/users/onboard` | yes | any | Create or update profile and set role. |

**Request body (POST /users/onboard):**

```json
{
  "name": "string",
  "email": "string",
  "role": "EMPLOYER | TALENT"
}
```

**Response:** `200` – User document (see [User object](#user-object)).

---

### 5.2 Jobs (public)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/jobs` | no | - | List all jobs. |
| GET | `/jobs/:id` | no | - | Get a single job by ID. |

**Response (GET /jobs):** `200` – Array of [Job](#job-object) objects.

**Response (GET /jobs/:id):** `200` – Single [Job](#job-object).  
**Error:** `404` if job not found.

---

### 5.3 Jobs (employer)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/jobs` | yes | EMPLOYER | Create a job. |
| POST | `/jobs/generate-jd` | yes | EMPLOYER | Generate job description with AI. |
| GET | `/jobs/:id/applicants` | yes | EMPLOYER | List applicants for a job (only if you own the job). |

**Request body (POST /jobs):**

```json
{
  "title": "string (required)",
  "companyName": "string (required)",
  "techStack": ["string"],
  "description": "string",
  "deadline": "ISO 8601 date string (required)"
}
```

**Response:** `201` – Created [Job](#job-object).

**Request body (POST /jobs/generate-jd):**

```json
{
  "title": "string (required)",
  "techStack": ["string"]
}
```

**Response:** `200` – `{ "description": "string" }`.

**Response (GET /jobs/:id/applicants):** `200` – Array of applicant objects, each like:

```json
{
  "_id": "ObjectId",
  "jobId": "ObjectId",
  "talentId": "string (uid)",
  "source": "manual | invitation",
  "createdAt": "ISO date",
  "talent": {
    "uid": "string",
    "name": "string",
    "email": "string",
    "skills": ["string"]
  }
}
```

**Errors:** `403` if job is not owned by current user; `404` if job not found.

---

### 5.4 Jobs (talent) – apply

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/jobs/:id/apply` | yes | TALENT | Apply to a job. |

No body required.

**Response:** `201` – [Application](#application-object)-like object.

**Errors:** `400` if deadline passed or already applied; `404` if job not found.

---

### 5.5 Talents (employer) – AI match

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/talents/matched?jobId=<id>` | yes | EMPLOYER | Get talents with AI match score for a job. |

**Query:** `jobId` (required) – job ObjectId.

**Response:** `200` – Array of:

```json
{
  "talent": { "uid", "name", "email", "skills" },
  "score": 0-100,
  "reason": "string"
}
```

**Errors:** `400` if `jobId` missing; `403` if not job owner; `404` if job not found.

---

### 5.6 Talent (talent) – AI job feed

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/talent/jobs/matched` | yes | TALENT | Get jobs ranked by AI relevance for current user. |

**Response:** `200` – Array of:

```json
{
  "job": { ...Job object },
  "score": 0-100,
  "reason": "string"
}
```

---

### 5.7 Invitations

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/invitations` | yes | EMPLOYER | Invite a talent to a job. |
| GET | `/invitations` | yes | TALENT | List my invitations. |
| POST | `/invitations/:id/respond` | yes | TALENT | Accept or decline an invitation. |

**Request body (POST /invitations):**

```json
{
  "jobId": "ObjectId string (required)",
  "talentId": "string (uid, required)"
}
```

**Response:** `201` – [Invitation](#invitation-object) object.

**Response (GET /invitations):** `200` – Array of invitation objects with `jobId` populated (job details included).

**Request body (POST /invitations/:id/respond):**

```json
{
  "status": "accepted | declined"
}
```

**Response:** `200` – Updated [Invitation](#invitation-object) (with `jobId` populated).

**Errors:** `400` if invitation already responded or invalid body; `403` if not the invited talent; `404` if invitation or job not found.

---

## 6. Data shapes (for reference)

### User object

```ts
{
  _id: ObjectId,
  uid: string,        // Firebase UID
  name: string,
  email: string,
  role: "EMPLOYER" | "TALENT",
  skills?: string[],
  createdAt: string,  // ISO date
  updatedAt: string
}
```

### Job object

```ts
{
  _id: ObjectId,
  title: string,
  companyName: string,
  techStack: string[],
  description: string,
  deadline: string,   // ISO date
  createdBy: string, // Employer uid
  applicationsCount: number,
  createdAt: string,
  updatedAt: string
}
```

### Application object

```ts
{
  _id: ObjectId,
  jobId: ObjectId,
  talentId: string,  // uid
  source: "manual" | "invitation",
  createdAt: string,
  updatedAt: string
}
```

### Invitation object

```ts
{
  _id: ObjectId,
  jobId: ObjectId | PopulatedJob,
  employerId: string,
  talentId: string,
  status: "pending" | "accepted" | "declined",
  createdAt: string,
  updatedAt: string
}
```

---

## 7. Recommended integration flows

### After Firebase sign-in

1. Get ID token: `await user.getIdToken()`.
2. Call `POST /users/onboard` with `{ name, email, role }` (use displayName/email from Firebase if needed).
3. Store the returned user (including `role`) in app state.
4. Route the user to employer or talent dashboard based on `role`.

### Employer: post a job

1. (Optional) Call `POST /jobs/generate-jd` with `{ title, techStack }`, show `description` in the form.
2. Call `POST /jobs` with `{ title, companyName, techStack, description, deadline }`.
3. Use the returned job (e.g. `_id`) for “view job” or “applicants” links.

### Employer: see applicants and match talents

1. List jobs (from your state or `GET /jobs` filtered by `createdBy` if you persist it).
2. For a job, call `GET /jobs/:id/applicants` to get applicants.
3. Call `GET /talents/matched?jobId=<id>` to get AI-ranked talents; use this to invite: `POST /invitations` with `jobId` and `talentId`.

### Talent: browse and apply

1. List jobs: `GET /jobs` (or use AI feed: `GET /talent/jobs/matched`).
2. For a job, call `POST /jobs/:id/apply` (no body). Handle `400` if already applied or deadline passed.
3. List invitations: `GET /invitations`. Show “Accept” / “Decline” and call `POST /invitations/:id/respond` with `{ status: "accepted" | "declined" }`.

### Talent: AI job feed

1. After login (as TALENT), call `GET /talent/jobs/matched`.
2. Display jobs with `score` and optional `reason`; link to job detail and apply.

---

## 8. CORS and headers

- The API uses **JSON** for request and response bodies (`Content-Type: application/json`).
- Send **Accept: application/json** if you want to ensure JSON responses.
- If the frontend runs on a different origin (e.g. `localhost:5173`), the backend must allow that origin in CORS. If you see CORS errors, ask the backend team to add your origin to the CORS allowlist.

---

## 9. Quick reference – all endpoints

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/health` | no | - |
| POST | `/users/onboard` | yes | any |
| GET | `/jobs` | no | - |
| GET | `/jobs/:id` | no | - |
| POST | `/jobs` | yes | EMPLOYER |
| POST | `/jobs/generate-jd` | yes | EMPLOYER |
| GET | `/jobs/:id/applicants` | yes | EMPLOYER |
| POST | `/jobs/:id/apply` | yes | TALENT |
| GET | `/talents/matched?jobId=` | yes | EMPLOYER |
| GET | `/talent/jobs/matched` | yes | TALENT |
| GET | `/invitations` | yes | TALENT |
| POST | `/invitations` | yes | EMPLOYER |
| POST | `/invitations/:id/respond` | yes | TALENT |

All IDs in URLs are MongoDB ObjectIds (24-character hex strings), except `talentId`/`employerId`/`createdBy`, which are Firebase UIDs.
