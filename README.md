<div align="center">

<img src="frontend/public/logo.png" alt="EventQR Logo" width="180" />

# EventQR

**QR-based attendance tracking for recurring workshops, classes, and event series.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Live Demo](https://eventqr.magitecx.com) · [Report a Bug](https://github.com/issues) · [Request a Feature](https://github.com/issues)

</div>

---

## Overview

EventQR lets organizers manage multi-session events under a single series, assign unique QR codes to attendees, and check in with a phone camera — with full attendance reports and CSV/Excel exports. Multiple organizations are supported from one account, making it ready for schools, bootcamps, corporate workshops, and community events.

## Features

- **Event series & sessions** — group recurring events and track each session separately
- **Secure QR identity** — each attendee gets a unique token-based QR for tamper-resistant check-in
- **Live camera scanner** — browser-based QR scanner with duplicate protection and instant feedback
- **Shareable scan links** — send a phone-only scanner link to staff with no login required
- **Attendance matrix** — per-session joined/missed view with percentage tracking
- **CSV & Excel export** — full attendance reports with one click
- **Multi-organization** — one account can belong to many workspaces with role-based access
- **Invite system** — join via code or shareable invite link
- **Profile image uploads** — server-side validated, rewritten, and sanitized via Sharp
- **Password reset** — email-based flow via Resend

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (access tokens) |
| Email | Resend |
| Image processing | Sharp |
| Dev database | Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### 1. Clone and install

```bash
git clone https://github.com/your-username/EventQrAttendance.git
cd EventQrAttendance
npm run install:all
```

### 2. Set up environment files

```bash
# Linux / macOS
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp .env.example .env

# Windows
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
copy .env.example .env
```

Open each `.env` file and fill in your values — see [Environment Variables](#environment-variables) below.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run migrations and seed

```bash
cd backend
npx prisma migrate deploy
npm run prisma:seed
```

### 5. Start the dev servers

```bash
# from the root
npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173
```

## Documentation

- [Deletion lifecycle](docs/deletion-lifecycle.md)
- [Local production runbook](docs/production-local.md)

## Environment Variables

### Root `.env` (docker-compose)

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |

### `backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma connection string |
| `JWT_SECRET` | Strong random secret (32+ chars) |
| `PORT` | Backend port (default `4000`) |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | Sender address for transactional email |
| `APP_URL` | Your production domain |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | Reset link expiry (default `15`) |
| `ORGANIZATION_INACTIVE_WARNING_DAYS` | Days before inactive warning (default `75`) |
| `ORGANIZATION_HARD_DELETE_DAYS` | Days before hard delete (default `90`) |
| `ORGANIZATION_CLEANUP_INTERVAL_MINUTES` | Cleanup job interval (default `60`) |
| `SEED_USER_NAME` | _(optional)_ Seed user display name |
| `SEED_USER_EMAIL` | _(optional)_ Seed user email |
| `SEED_USER_PASSWORD` | _(optional)_ Seed user password |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (e.g. `http://localhost:4000/api`) |
| `VITE_SITE_URL` | Public site URL — used for canonical URLs and sitemap |

## Project Structure

```
EventQrAttendance/
├── backend/
│   ├── prisma/          # Schema, migrations, seed
│   └── src/
│       ├── config/      # Env validation
│       ├── lib/         # Prisma client, email
│       ├── middleware/  # Auth, error handling
│       ├── modules/     # Feature modules (auth, orgs, attendees, scan, reports)
│       └── utils/       # JWT, QR token helpers
├── frontend/
│   └── src/
│       ├── components/  # UI, layout, SEO components
│       ├── lib/         # API client, auth, utils
│       ├── pages/       # Route-level page components
│       └── types/       # Shared API types
├── docker-compose.yml
├── .env.example
└── README.md
```

## Routes

### Frontend

| Path | Description |
|---|---|
| `/` | Public landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/forgot-password` | Request password reset |
| `/reset-password?token=...` | Set new password |
| `/invite/:token` | Accept invite and auto-join org |
| `/scan/:token` | Public phone scanner (no login required) |
| `/app/onboarding` | Create or join a workspace |
| `/app/*` | Authenticated workspace |

### API (summary)

<details>
<summary>Auth</summary>

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
POST   /api/auth/switch-organization
PATCH  /api/auth/account
POST   /api/auth/change-password
```
</details>

<details>
<summary>Organizations</summary>

```
GET    /api/organizations
POST   /api/organizations
POST   /api/organizations/join
GET    /api/organizations/invites/:token
POST   /api/organizations/invites/:token/accept
GET    /api/organizations/current
PATCH  /api/organizations/current
POST   /api/organizations/current/regenerate-join-code
POST   /api/organizations/current/invites
POST   /api/organizations/current/leave
PATCH  /api/organizations/current/members/:membershipId
DELETE /api/organizations/current/members/:membershipId
```
</details>

<details>
<summary>Attendance & Scanning</summary>

```
GET    /api/event-series
POST   /api/event-series
GET    /api/event-series/:id
POST   /api/event-series/:id/sessions
GET    /api/attendees
POST   /api/attendees
GET    /api/attendees/:id
PATCH  /api/attendees/:id
DELETE /api/attendees/:id
POST   /api/scan/check-in
GET    /api/scan/sessions/:eventSessionId/share-link
GET    /api/public/scan/:token
POST   /api/public/scan/:token/check-in
GET    /api/reports/event-series/:id
GET    /api/reports/event-series/:id/export.csv
GET    /api/reports/event-series/:id/export.xlsx
```
</details>

## Seed Data

Running `npm run prisma:seed` creates:

- 2 organizations
- 1 event series with 5 sessions
- 10 attendees with sample attendance records

If `SEED_USER_NAME`, `SEED_USER_EMAIL`, and `SEED_USER_PASSWORD` are set in `backend/.env`, seed also creates a user account attached to both organizations.

## Deployment

After a `git pull`, redeploy with:

```bash
# Frontend only
cd frontend && npm install && npm run build && pm2 restart eventqr-frontend

# Backend only
cd backend && npm install && npm run build && pm2 restart eventqr-backend --update-env

# Both + database migrations
cd backend && npm install && npx prisma migrate deploy && npm run build && pm2 restart eventqr-backend --update-env
cd ../frontend && npm install && npm run build && pm2 restart eventqr-frontend
```

## Useful Commands

```bash
npm run db:up          # Start PostgreSQL container
npm run db:down        # Stop PostgreSQL container
npm run dev:backend    # Backend dev server with hot reload
npm run dev:frontend   # Frontend dev server with HMR
npm run build          # Build both frontend and backend
npm run seed           # Run database seed
```

## Attendance Formula

```
attendancePercentage = attendedSessions / totalSessions × 100
```

## Upload Security

Attendee profile images go through:

- Browser MIME allowlist
- Server-side image decode validation
- Dimension and pixel limits
- Image rewriting via Sharp (strips metadata, re-encodes)
- Filename and path sanitization
- Static file serving with `X-Content-Type-Options: nosniff`

Supported formats: JPEG, PNG, WebP — max 5 MB.

---

<div align="center">

Built by [Magitecx](https://magitecx.com)

</div>
