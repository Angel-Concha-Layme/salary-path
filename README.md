# Salary Path

Web application for modeling professional salary progression, with authentication, onboarding, employment history management, and versioned APIs.

## Current status

Implemented today:
- Authentication with Better Auth (email/password, GitHub, and Google).
- Session management in frontend and backend (cookie and JWT bearer for API).
- Step-up verification for `/comparison` using email OTP (Resend).
- Initial onboarding (`/onboarding`).
- Companies and salary events module (`/companies`).
- User profile (`/profile`).
- Admin users panel (`/admin/users`).
- REST API at `/api/v1/*` with typed contracts.
- Turso/libSQL database + Drizzle with migrations in `/drizzle`.

Pending or visual placeholder:
- `/explore`
- `/personal-path`
- `/comparison` (feature content remains placeholder, access is OTP-protected)
- `/settings`
- `/admin/users/[userId]`

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Better Auth
- Drizzle ORM + drizzle-kit
- Turso/libSQL
- TanStack Query v4
- Tailwind CSS + internal UI components
- Sonner (notifications)
- Vitest

## Requirements

- Node.js 20+
- pnpm
- Accessible Turso database

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Create environment variables:

```bash
cp .env.example .env
```

3. Complete `.env` with your actual credentials.

4. Run migrations:

```bash
pnpm db:migrate
```

5. Start the app:

```bash
pnpm dev
```

The app runs at [http://localhost:3001](http://localhost:3001).

## Scripts

- `pnpm dev`: local environment on port `3001`.
- `pnpm build`: runs migrations (`prebuild`) and compiles for production.
- `pnpm start`: starts server in production mode.
- `pnpm typecheck`: TypeScript validation.
- `pnpm lint`: project linting.
- `pnpm test`: unit tests with Vitest.
- `pnpm db:generate`: generates migrations from schema.
- `pnpm db:migrate`: applies pending migrations.

## Environment variables

Defined in `.env.example`:
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `BETTER_AUTH_JWT_ISSUER`
- `BETTER_AUTH_JWT_AUDIENCE`
- `BETTER_AUTH_JWT_EXPIRATION`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO` (optional)
- `ADMIN_EMAILS`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Main routes

Public:
- `/sign-in`
- `/explore`

Protected:
- `/onboarding`
- `/personal-path`
- `/companies`
- `/comparison`
- `/profile`
- `/settings`

Admin:
- `/admin/users`
- `/admin/users/[userId]`

## API

- Base URL: `/api/v1`
- Response envelope:
  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, error: { status, code, message, details? } }`
- Auth API:
  - Better Auth session cookie.
  - Or `Authorization: Bearer <jwt>` for external consumers.
- Route access step-up API:
  - `GET /route-access/status?routeKey=comparison`
  - `POST /route-access/email-otp/send`
  - `POST /route-access/email-otp/verify`

Endpoint details: see [`/docs/api-v1.md`](docs/api-v1.md).

## Database and migrations

- Drizzle configuration: `drizzle.config.ts`
- Schema: `app/lib/db/schema/*`
- SQL migrations: `/drizzle`
- `pnpm build` already runs `pnpm db:migrate` automatically before compiling.

## Documentation

- General index: [`/docs/README.md`](docs/README.md)
- Previous README audit: [`/docs/readme-audit.md`](docs/readme-audit.md)
- Original README copy (template): [`/docs/readme-original-next-template.md`](docs/readme-original-next-template.md)
- Project status review: [`/docs/project-review.md`](docs/project-review.md)
