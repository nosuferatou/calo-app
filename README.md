# CALO

Minimalist nutrition and calorie tracker: log meals by category, follow calories and
macronutrients against personal targets, review history and trends, and track body weight.
Interface in English and Bahasa Indonesia, with light, dark, and system themes.

CALO runs in two data modes:

- **Demo mode** — anonymous visitors. Everything stays in this browser's LocalStorage, and a
  status banner appears when that storage is read-only or unavailable.
- **Cloud mode** — signed-in accounts. Reads and writes go to your own Supabase project
  through repositories that derive the owner from the verified auth token, with Row Level
  Security as the final authority. A failed cloud write is reported to the user; it never
  falls back to LocalStorage.

Signing in does not move demo data to the account yet. That migration is deliberately
unbuilt until it has validation, a preview, and explicit confirmation.

## Stack

Next.js 16 App Router (Turbopack, Cache Components, Partial Prefetching), React 19,
TypeScript, Tailwind CSS 4, Zod 4, Recharts, Vitest 4, Supabase (PostgreSQL, Auth, RLS,
pgTAP). No backend other than Supabase, and no external nutrition API.

## Requirements

- Node.js — this workspace is verified on Node 26.
- Docker, for the local Supabase stack.
- The Supabase CLI is a pinned project dev dependency.

## Local setup

```bash
npm install
cp .env.example .env.local      # then fill in the local Supabase values
npx supabase start              # API 54321, Postgres 54322, Studio 54323, Mailpit 54324
npx supabase db push            # applies supabase/migrations to the LOCAL database only
npm run dev                     # http://localhost:3000
```

`npx supabase start` prints the project URL, the publishable key, and the service-role key.
Only the URL and the publishable key belong in `.env.local`. Never put a secret key in a
`NEXT_PUBLIC_*` variable, and never commit `.env.local`.

Local email confirmation is disabled, so email/password sign-up returns a session
immediately. Password-recovery mail is captured by Mailpit at http://127.0.0.1:54324.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Vitest unit and integration suites |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript typecheck |
| `npx supabase test db` | pgTAP database tests (needs the local stack running) |

## Documentation

The documents below are the source of truth. If they conflict, follow the approved product
requirements and ask before changing a technical or design decision.

- `PRODUCT.md` — product intent and boundaries.
- `PRD.md` — requirements, including the product rules in `AGENTS.md`.
- `TECH_STACK.md` — architecture and technical decisions.
- `DESIGN.md` — visual direction, navigation, themes, and accessibility rules.
- `NUTRITION_CALCULATIONS.md` — the approved BMR, TDEE, target, and food-database assumptions.
- `SUPABASE_FOUNDATION.md` — schema, RLS, authentication, migration design, and the
  Supabase Dashboard checklist.
- `TASKS.md` — task status and deferred scope.
- `CHANGELOG.md` — notable changes.
- `AGENTS.md` — mandatory instructions for AI coding agents.

## Before any public deployment

Deployment has not happened, and the hosted Supabase project has not been touched. The
application code, migrations, and checks are ready; what remains is owner-controlled.
`TASKS.md` section 14 lists the exact steps and stops, and `SUPABASE_FOUNDATION.md` section
6 lists the Dashboard configuration. Read `NUTRITION_CALCULATIONS.md` first if you intend to
change how targets are calculated.

Build on the hosting platform, never upload a local `.next`: `NEXT_PUBLIC_*` values are
inlined into the client bundle at build time, so a local build points at the local Supabase
origin.

Built-in foods are a labeled initial dataset, not verified reference data: the catalog states
"Sample dataset. Values are illustrative and are not verified nutrition data," and each food's
source note is shown in its detail dialog. Replace the dataset with sourced records before
relying on it. CALO does not provide medical advice.
