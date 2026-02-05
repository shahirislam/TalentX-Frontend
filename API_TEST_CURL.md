# TalentX API – curl commands for testing

Use these from a terminal. Ensure the **backend is running** (`cd TalentX-Backend && npm start`, default port **3000**).

Base URL: **http://localhost:3000** (or set `VITE_API_BASE_URL` in `.env`).

---

## 1. Health check

```bash
curl -s http://localhost:3000/health
```

Expected: `{"ok":true}`

---

## 2. List jobs (home page uses this)

```bash
curl -s http://localhost:3000/jobs
```

Expected: JSON array of job objects, e.g. `[{ "_id": "...", "title": "...", "companyName": "...", ... }]`. Can be `[]` if the database has no jobs.

With response status:

```bash
curl -s -w "\nHTTP %{http_code}\n" http://localhost:3000/jobs
```

---

## 3. Get one job by ID

Replace `JOB_ID` with a MongoDB ObjectId from the list (e.g. `674a1b2c3d4e5f6789abcdef`).

```bash
curl -s http://localhost:3000/jobs/JOB_ID
```

---

## 4. Windows (PowerShell)

```powershell
# Health
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get

# List jobs
Invoke-RestMethod -Uri "http://localhost:3000/jobs" -Method Get
```

---

## If the home page shows nothing

1. **Run the curl** for `GET /jobs` above. If it fails or returns non-JSON, fix the backend first.
2. **CORS**: Backend allows `http://localhost:5173` by default. If the frontend runs on another port, set `CORS_ORIGIN` in the backend `.env`.
3. **Empty list**: If `GET /jobs` returns `[]`, seed the database (e.g. run the backend seed script if available).
4. **Browser**: Open DevTools → Network, reload the home page, and check the request to `http://localhost:3000/jobs` for status and response body.
