# Global Frontend — Global Talent Plus Recruitment System

Standalone React + TypeScript + Vite frontend for the Global Talent Plus
Enterprise ATS. Talks to `GlobalBackend` over HTTP — it does not run its
own server.

## Folder structure

```
GlobalFrontend/
├── src/
│   ├── api/                # One file per backend module — all calls go through client.ts
│   │   ├── client.ts        # Shared fetch wrapper + VITE_API_URL base
│   │   ├── jobsApi.ts
│   │   ├── applicationsApi.ts
│   │   ├── assessmentApi.ts
│   │   ├── interviewsApi.ts
│   │   ├── emailLogsApi.ts
│   │   ├── documentsApi.ts
│   │   └── usersApi.ts
│   ├── auth/                # AuthContext, LoginForm, SignUpForm, AuthModal
│   ├── components/          # Reusable UI (Navbar, Sidebar, JobCard, modals, ...)
│   ├── pages/                # One file per route/screen (JobBoardPage, PipelinePage, ...)
│   ├── data/                 # mockData.ts — local fallback/demo data
│   ├── types/                # Shared TypeScript interfaces (mirrors backend types)
│   ├── utils/                 # pdfGenerator.ts and other helpers
│   ├── AppShell.tsx           # Top-level layout/shell + routing
│   ├── App.tsx                 # Wraps AppShell with AuthProvider
│   └── main.tsx                 # React DOM entry point
├── index.html
├── vite.config.ts
├── .env.example
└── package.json
```

Every backend module (jobs, applications, assessments, interviews,
email-logs, documents, users) has its own dedicated `src/api/*.ts` file,
and most have a matching `src/pages/*.ts` — so a change to one feature
never touches unrelated files.

## Setup

```bash
npm install
cp .env.example .env      # points at the backend, defaults to http://localhost:5000/api
npm run dev
```

The app runs on **http://localhost:5173** by default.

Make sure `GlobalBackend` is running first (see its own README) and that
its `CLIENT_ORIGIN` includes `http://localhost:5173` so CORS allows
requests from here.

## How data flows

```
Page/Component  →  src/api/<module>Api.ts  →  apiFetch() (client.ts)
                                                     ↓
                                     GlobalBackend  (http://localhost:5000/api/...)
                                                     ↓
                                            MySQL (via Sequelize)
```

## Adding a new page/module

1. Add the module's endpoints to a new `src/api/<module>Api.ts` file,
   using `apiFetch` from `src/api/client.ts` (never call `fetch()` with a
   relative `/api/...` path directly — the backend is a different origin).
2. Add a page in `src/pages/`.
3. Add a route/link for it in `src/AppShell.tsx` (and `Sidebar.tsx` /
   `Navbar.tsx` if it needs navigation).
4. Add the matching `server/routes` + `server/controllers` file on the
   backend — see `GlobalBackend/README.md`.
