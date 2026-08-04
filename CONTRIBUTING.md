# Contributing to EventQR

Thank you for taking the time to contribute! The following guidelines help keep the project consistent and the review process smooth.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it. Please report unacceptable behaviour to support@magitecx.com.

---

## Getting Started

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/your-username/EventQrAttendance.git
   cd EventQrAttendance
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment files** (see [README](README.md#getting-started) for details):
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp .env.example .env
   ```

4. **Start PostgreSQL and run migrations:**
   ```bash
   docker compose up -d
   cd backend && npx prisma migrate deploy && npm run prisma:seed
   ```

5. **Start the dev servers:**
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

---

## How to Contribute

### Reporting Bugs

Before opening a bug report, search existing issues to avoid duplicates. When filing a new bug, use the **Bug Report** issue template and include:

- Steps to reproduce
- Expected vs. actual behaviour
- Your environment (OS, Node version, browser)
- Any relevant logs or screenshots

### Suggesting Features

Open a **Feature Request** issue. Describe the problem you're trying to solve and your proposed solution. Feature requests that align with the project's core scope (QR attendance for recurring events) are prioritised.

### Submitting Code

- Bug fixes and documentation improvements are always welcome.
- For larger features, **open an issue first** to discuss the approach before writing code. This prevents wasted effort if the direction doesn't fit the roadmap.

---

## Pull Request Process

1. Create a branch from `main`:
   ```bash
   git checkout -b fix/descriptive-name
   # or
   git checkout -b feat/descriptive-name
   ```

2. Make your changes and ensure everything builds:
   ```bash
   npm run build
   ```

3. Push your branch and open a Pull Request against `main`.

4. Fill in the PR template — describe what changed and why.

5. A maintainer will review your PR. Please respond to feedback promptly. PRs with no activity for 14 days may be closed.

---

## Coding Standards

- **TypeScript** is required throughout — no `any` unless genuinely unavoidable, add a comment explaining why.
- **Backend:** Follow the existing module structure (`controller → service → prisma`). Validate all request input with Zod schemas.
- **Frontend:** Use React Query for server state. Keep components focused — extract logic into `lib/` utilities where it makes sense.
- **Formatting:** The project uses ESLint. Run `npm run lint` before committing.
- **No commented-out code** in PRs.

---

## Commit Messages

Use conventional commit prefixes:

```
feat: add CSV export for attendance reports
fix: clear timeout ref on scanner page unmount
docs: update environment variable table
chore: bump prisma to 6.18
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

---

Thanks again for contributing!
