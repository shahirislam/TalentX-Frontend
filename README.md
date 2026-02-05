# TalentX – AI & Data Expert Marketplace (Frontend MVP)

Frontend-only MVP with mocked data and simulated auth. No backend.

## Stack

- React 18 + Vite
- Tailwind CSS
- Lucide React (icons)
- React Router v6

## Run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## Build

```bash
npm run build
```

## Features

- **Roles (mock):** Guest, Employer, Talent. Choose role on Login; stored in `localStorage`.
- **Public:** Job listing with search, Job detail with Apply (guest → login redirect; talent → apply).
- **Employer dashboard:** Create job, generate JD with “AI”, my jobs, applicants, top matched talents + invite.
- **Talent dashboard:** AI job match feed, invitations (accept/decline), application history.

All data is in-memory (with optional `localStorage` persistence for jobs/applications/invitations). AI is simulated via `src/api/fakeAi.js`.
