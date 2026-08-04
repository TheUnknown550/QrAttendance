# Local Production Runbook

This project can run in a production-style local environment without third-party vendors.

## Goals

- keep the backend stateless except for PostgreSQL and local uploads
- use short-lived access tokens with rotating refresh sessions
- keep large frontend code paths lazy-loaded
- avoid unbounded in-memory list and export workloads

## Required setup

1. Configure `backend/.env`
2. Configure `frontend/.env`
3. Ensure PostgreSQL credentials in `DATABASE_URL` are valid
4. Apply Prisma migrations:

```bash
cd backend
npx prisma migrate deploy
```

## New backend environment settings

- `ACCESS_TOKEN_TTL_MINUTES`
- `REFRESH_TOKEN_TTL_DAYS`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `COOKIE_DOMAIN`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX_REQUESTS`
- `REPORT_EXPORT_MAX_ROWS`
- `DEFAULT_PAGE_SIZE`
- `MAX_PAGE_SIZE`

## Auth behavior

- access tokens expire quickly and are refreshed silently
- refresh tokens are stored in `httpOnly` cookies
- refresh tokens are rotated on refresh
- password changes and password resets revoke all refresh sessions
- expired refresh sessions are cleaned up automatically on startup and hourly

## Health checks

- liveness: `GET /api/health`
- readiness: `GET /api/health/ready`

`/api/health/ready` verifies database reachability.

## Rate limiting and origin checks

- auth-sensitive endpoints are rate-limited in memory
- refresh/logout endpoints require a trusted request origin

For multi-instance deployments later, replace the in-memory limiter with a shared store.

## Uploads

- attendee images remain on local disk under `backend/uploads`
- static upload responses are cacheable and immutable because filenames are unique
- if you later move to another storage backend, keep the current public URL contract stable

## Pagination and exports

- attendee listing is paginated server-side
- report exports are capped by `REPORT_EXPORT_MAX_ROWS`
- CSV exports are streamed instead of materialized as one big string

## Backups

At minimum, back up:

- PostgreSQL database
- `backend/uploads`
- `.env` files stored securely outside the repo

Recommended local backup cadence:

1. nightly PostgreSQL dump
2. nightly copy of `backend/uploads`
3. periodic restore test into a non-production database

## Pre-launch checklist

1. set `COOKIE_SECURE=true` when serving over HTTPS
2. keep `CORS_ORIGIN` restricted to your real frontend origins
3. verify `DATABASE_URL` points to the intended database
4. run `npm run build` in both `backend` and `frontend`
5. run `npx prisma migrate deploy`
6. verify login, refresh, logout, password reset, attendee deletion, and organization deletion

## Local scaling notes

The current implementation is production-safer than the initial version, but these areas should be upgraded first if usage grows:

1. replace the in-memory rate limiter with a shared store
2. move exports and image-heavy jobs to a worker process
3. move uploads to a dedicated storage system you control
4. add audit logging for destructive actions
