# BukkaPay

## Structure

- **frontend/** — Expo (React Native) app from https://github.com/profyk/BukkaPay-Expo
  - `app/` — Expo Router screens and layouts
  - `pages/` — Page components (auth, wallet, payments, etc.)
  - `components/` — Shared UI components
  - `lib/` — Utility libraries
  - `hooks/` — Custom React hooks
  - `assets/` — Images and fonts
  - `app.json` — Expo config (backend URL, plugins, EAS project)
  - `package.json` — dependencies: expo, react-native, supabase, react-navigation, etc.

- **backend/** — Node.js/TypeScript Express API (restored from git history)
  - `src/index.ts` — Express server entry point (Stripe init, middleware, routes)
  - `src/routes.ts` — All API routes (auth, wallet, payments, rental, merchants, etc.)
  - `src/auth.ts` — Authentication helpers (signup, login, password hashing)
  - `src/storage.ts` — Database access layer (Drizzle ORM)
  - `src/db/index.ts` — PostgreSQL connection via Drizzle
  - `src/shared/schema.ts` — Full database schema (users, wallets, transactions, etc.)
  - `src/stripe-client.ts` — Stripe SDK client
  - `src/stripe-service.ts` — Stripe service methods
  - `src/stripe-webhooks.ts` — Stripe webhook handler
  - `src/supabase.ts` — Supabase client
  - `bukkapay_supabase.sql` — SQL schema file
  - `package.json` — dependencies: express, drizzle-orm, pg, stripe, zod, etc.
  - `tsconfig.json` — TypeScript config

## Workflows

| Name     | Command                              | Port | Type    |
|----------|--------------------------------------|------|---------|
| Frontend | `cd frontend && npx expo start --web --port 5000` | 5000 | webview |
| Backend  | `cd backend && PORT=3000 npm run dev` | 3000 | console |

## Runtime

- Node.js 20

## Merged From

- https://github.com/profyk/BukkaPay-Expo (frontend)
- https://github.com/profyk/BukkaPay-Backend (backend, merged with git-history restore)

**Merge result:** Source code was identical between the GitHub repo and git history restore. Merged packages added: `dotenv`, `drizzle-kit`, `@types/bcrypt`. Existing packages kept: `pg`, `zod`, `tsx`, `stripe-replit-sync`.

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous key
- `STRIPE_SECRET_KEY` — Stripe secret key (optional, skipped if missing)
