# CALO — Supabase Integration Foundation

**Status:** Phases 3A-3E2 are implemented against the local stack: authenticated accounts read and write through claims-verified, owner-scoped repositories, while anonymous visitors keep the demo provider. TypeScript, lint, 223 automated tests, production build, and all 57 local pgTAP tests passed. Google OAuth remains unconfigured. Custom-food create/edit is implemented through owner-scoped repository writes; delete, duplicate, and local-to-cloud migration remain separate approved work.
**Prepared:** 2026-11-01
**Scope:** Architecture and local-only Supabase foundation, database/RLS, and authentication. The hosted project and local CALO demo data have not been changed or uploaded.

## 1. Current readiness

- The app uses Next.js 16.4.3 App Router, React 19, TypeScript, Zod 4, and Vitest 4.
- Anonymous visitors use the `DemoDataProvider` and the centralized, versioned LocalStorage client. Authenticated accounts use `CloudDataProvider`, which reads and writes through claims-verified repositories and never falls back to LocalStorage after a cloud error. Sign-in does not yet sync or migrate existing demo data.
- `src/types/database.ts` is generated from the locally applied public schema with the Supabase CLI. Browser, server, and Proxy clients use this generated `Database` type.
- `src/lib/repositories/` exposes typed browser/server repository factories for all 12 current user-owned tables. Each operation obtains the owner from `auth.getClaims()`; RLS remains the database authorization boundary.
- Repository mappers validate database records and preserve logged food nutrition and saved-meal food snapshots exactly as stored. Empty collections return empty arrays; missing singleton records return `null` (search history returns an empty list).
- The repository API is not wired into `DemoDataProvider`; existing anonymous demo mode and LocalStorage data remain unchanged. Cloud persistence is a separate provider selected after identity is verified.
- Storage domains use independent version 1 envelopes. Invalid data is quarantined without deleting the original; newer versions are read-only.
- `@supabase/ssr` and `@supabase/supabase-js` are installed. Browser and request-scoped server clients, environment validation, and the Next.js 16 session-refresh Proxy are implemented.
- Local Supabase configuration and versioned migrations are under `supabase/`. The schema is applied only to the local database: 12 user-owned tables, 48 RLS policies, and 57 pgTAP tests passed.
- The project now has `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, and `/auth/complete` routes, localized English and Bahasa Indonesia forms, and a claims-based Next.js 16 Proxy.
- Profile provisioning uses the verified Auth claim's subject and an idempotent insert. The local `profiles` table has no `auth.users` trigger, so no duplicate provisioning mechanism was added.
- The existing demo feature routes remain public and local-first. `/auth/complete` is protected; routes that later read private cloud data must verify identity server-side and continue to rely on RLS.
- The local Auth config has email confirmations disabled, so local email/password signup normally returns an immediate session. Mailpit is available at `http://127.0.0.1:54324` for local verification and recovery email testing.
- Google OAuth is not configured in `supabase/config.toml`. The app keeps the Google option disabled unless `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`; no credentials have been added and OAuth has not been tested.
- The local Supabase CLI is installed as a pinned project dev dependency and Docker-backed local development is configured. No hosted database migration has been applied.
- `.env.example` contains placeholders only; `.env.local` is configured with the required public variables and remains Git-ignored.
- Automated coverage includes auth validation, form behavior, callback/profile provisioning, safe redirects, Proxy behavior, and translation parity. Local email/password signup, sign-in, recovery, password reset, sign-out, and localized navigation were manually browser-tested. Google OAuth provider testing remains pending because local credentials are not configured.
- Several persisted entity schemas currently validate only common metadata and pass other fields through. `readStorage()` alone is therefore not sufficient validation for cloud upload; explicit migration still needs complete, domain-specific validation.
- Built-in foods in `src/data/foods.ts` are version-controlled static demo data. Their nutritional values are explicitly illustrative and unverified; they are not proposed as trusted public database records.
- `CustomFood` and its storage schema exist, and the create/edit UI in My Collection writes through owner-scoped repositories. Delete and duplicate are not implemented.
- Production responses carry CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict `Referrer-Policy`, and a `Permissions-Policy` that denies camera, microphone, geolocation, and payment. The CSP `connect-src` is derived from `NEXT_PUBLIC_SUPABASE_URL`, and configuration rejects an http Supabase URL on any host that is not localhost.

## 2. Proposed database model

Use PostgreSQL `public` tables only for app data that belongs to a signed-in user. Every such table has a `user_id uuid not null references auth.users(id) on delete cascade`. Preserve local string IDs as `text` for multi-row entities because the current app prefixes generated IDs; a profile/target's synthetic local `id` is replaced by the authenticated user ID because each is a singleton per account. The prepared, unapplied migration is `supabase/migrations/20261101140000_create_calo_user_data.sql`.

| Database table | Existing local source | Mapping and relationship |
|---|---|---|
| `profiles` | `calo:profile` | One row per `user_id`; map display name, age, biological sex, height, weight, activity, workout days, goal, target weight, desired rate, macro preference, custom macro split, and timestamps. Do not copy the synthetic local profile ID. |
| `nutrition_targets` | `calo:targets` | One row per `user_id`; retain manual/calculated source, calories/macros, BMR, TDEE, PAL, formula version, calculation time, requested/actual deficit, and guardrail metadata. Copy values as stored; never recalculate during migration. |
| `meal_sessions` | Derived from `calo:food-diary` entries | No independent session collection exists locally. Materialize one session per date/category/session ID group for relational queries. Preserve a local session ID where present; synthesize a stable ID for legacy entries without one using the current grouping rule. |
| `food_entries` | `calo:food-diary` | One row per entry. Keep `food_id`, name, grams, category, timestamp, and the saved calories, protein, carbohydrate, fat, fiber, sugar, saturated-fat, and sodium snapshots. Optional micronutrients remain `NULL` when absent, not zero. Do not make `food_id` a foreign key to mutable catalog data. |
| `custom_foods` | `calo:custom-foods` | One row per user-created food. Map the stable ID, name, category, default grams, eight required nutrition values, synonyms, source reference, and timestamps. The current UI creates and edits these rows through owner-scoped repository writes; delete and duplicate are not implemented. |
| `favorite_foods` | `calo:collections.favoriteFoods` | One row per favorite. Resolve the legacy `foodId` to either a static catalog ID or that user's custom-food ID. Proposed nullable `catalog_food_id` / `custom_food_id` columns with an exactly-one check; custom-food references use a composite same-user foreign key. Unknown or ambiguous IDs block migration for review. |
| `saved_meals` | `calo:collections.savedMeals` | One row per saved meal, preserving ID, name, and timestamps. |
| `saved_meal_items` | `calo:collections.savedMeals[].items` | Child rows keyed by position. Keep grams, the food ID, and the embedded food snapshot as JSONB so later catalog edits/deletions cannot change the saved meal's existing contents. |
| `weight_records` | `calo:weight-records` | One row per record with weight, logged timestamp, ID, and timestamps. |
| `meal_cart_drafts` | `calo:meal-cart-draft` | At most one draft per user. Store date, meal category, item quantities, and food snapshots. LocalStorage can remain a working cache, but the authenticated account is the source of truth. |
| `account_preferences` | `calo:settings`, `calo:app.catalogViewMode` | One row per user for theme, language, and grid/list catalog view mode. LocalStorage remains a cache/device preference store. Preserve unknown `calo:app` fields locally and do not upload them without a mapping. |
| `search_history` | `calo:search-history` | One row per user containing the existing recent-query list. |

### Relationships and data constraints

- `auth.users` has one `profiles` row and one `nutrition_targets` row at most. Targets may be created without a profile, so both reference `auth.users` directly.
- Every session is keyed by `(user_id, log_date, meal_category, session_id)`. This matches the UI grouping, which partitions entries by date and category before grouping by session ID, and handles a reused legacy ID safely.
- `food_entries` reference that composite session key when `session_id` is present. Entries with no legacy session ID are assigned a deterministic migration ID that preserves the current date/category/time grouping.
- Row IDs remain text to preserve existing prefixed local IDs. `user_id` is the UUID ownership key and singleton profile, target, preference, draft, and search-history primary key.
- `saved_meal_items` reference `(user_id, saved_meal_id)` with `ON DELETE CASCADE`. Custom-food favorite references also include `user_id`, preventing cross-account relationships.
- Use `numeric`, not floating-point columns, for gram and nutrition values. Preserve decimal precision. Keep optional existing food nutrients nullable; do not constrain historical 4-4-9 totals to exact equality.
- Use `timestamptz` for timestamps, text checks/enums for the existing categories and preference values, and non-negative checks where the current schema supports them. Store formula metadata as nullable columns and retain formula version `1`.
- Add indexes for `food_entries(user_id, log_date, meal_category)`, `food_entries(user_id, session_id)`, and `weight_records(user_id, logged_at)`. The meal-session primary key begins with `(user_id, log_date, meal_category)`; child primary/foreign keys begin with `user_id` to support ownership filters.
- Historical food nutrition fields are stored directly on `food_entries`; no food-catalog foreign key can recalculate or cascade-delete diary snapshots. Saved meal food objects are retained as JSONB snapshots.
- Add `food_entries.log_date date` as an explicit diary date for new writes. The current model stores only a timestamp and derives its day in the browser's current timezone. A migration can preview the date as interpreted on the current device, but cannot recover the original timezone if it changed; show those dates in the confirmation preview and require user review where uncertain.

### Global catalog boundary

Keep the built-in catalog separate from private user tables. For the current MVP it remains static, version-controlled data and is not copied into a per-user table. It contains no user data and can be served publicly by the app. If a database catalog is adopted later, use a separate read-only public catalog with deliberate `SELECT` grants/policy; never place custom foods or account data in that public table.

## 3. Row Level Security design

The migration enables RLS on all 12 user-owned tables. It revokes client-role privileges on only those tables, then grants `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to `authenticated`; it grants no access to `anon` and no `TRUNCATE`.

Create separate policies for each operation, targeted `TO authenticated`:

- `SELECT`: `USING ((select auth.uid()) = user_id)`
- `INSERT`: `WITH CHECK ((select auth.uid()) = user_id)`
- `UPDATE`: both `USING ((select auth.uid()) = user_id)` and `WITH CHECK ((select auth.uid()) = user_id)`
- `DELETE`: `USING ((select auth.uid()) = user_id)`

Composite foreign keys must also include `user_id`, so one user's entry cannot reference another user's session, saved meal, or custom food. Do not expose private rows through views or `SECURITY DEFINER` functions. Any future view must be reviewed for RLS bypass behavior.

The `supabase/tests/database/rls.test.sql` suite checks RLS/grant/policy coverage for every table, owner reads, cross-user SELECT/INSERT denial, ownership transfer denial, cross-owner child references, permitted owner changes, and unchanged diary snapshots after food edits. All 57 pgTAP tests passed against the local Supabase database. RLS is the authorization boundary; route guards and frontend checks are additional UX controls only. Never put a Supabase secret/service-role key in browser code.

## 4. Authentication and Next.js 16 design

Follow Supabase's current SSR guidance with `@supabase/ssr` and cookie-backed PKCE sessions:

- Create separate browser and request-scoped server clients. Server clients use Next's asynchronous cookie APIs and pass refreshed cookies through responses.
- Use `src/proxy.ts`, the Next.js 16 Proxy convention, to refresh sessions using `supabase.auth.getClaims()`. Do not create the older `middleware.ts` convention.
- `getClaims()` verifies identity for server checks. Do not trust `getSession()` in Proxy or server code as proof of identity. Proxy is not the only authorization boundary; verify users in protected Server Components, Route Handlers, and Server Actions, then rely on RLS for database access.
- The `/auth/callback` Route Handler exchanges PKCE codes for a session and accepts only safe same-site return destinations.
- Email/password sign-up, sign-in, sign-out, verification callback handling, password recovery, and password update are implemented with localized loading, validation, success, and safe error states. Signup supports both immediate-session and verification-required responses.
- Local browser QA verified immediate-session signup, sign-in, recovery through Mailpit, password reset, sign-out, validation feedback, language switching, and auth navigation. The local Auth config disables email confirmation, so the verification-required path is covered by automated tests rather than a live confirmation-email run.
- Google OAuth is wired through `signInWithOAuth`, but remains disabled until credentials are configured in the local Supabase provider settings and the public feature flag is enabled.
- `/auth/complete` checks verified claims and provisions the current user's profile only. The Proxy refreshes claims, protects this completion route, and redirects signed-in users away from login/signup. Local demo pages remain public and do not read cloud data.
- Email recovery links return through `/auth/callback` to `/reset-password`. Local generated emails can be inspected at `http://127.0.0.1:54324`; the local configuration does not send production email.
- Display loading, validation, and error states in English and Bahasa Indonesia. Password recovery uses a non-enumerating success message.
- Do not add a service-role key. The browser uses only the project's URL and publishable key; RLS protects table access.

## 5. Explicit local-to-cloud migration

Do not upload on sign-in automatically. Keep the existing browser data unchanged until the user completes review and confirms:

1. After sign-in, scan only known CALO storage keys using the existing versioned storage reader. Never read or upload unrelated browser storage.
2. Detect missing, corrupt, quarantined, unsupported-newer-version, and unknown fields. Preserve them locally. Add complete, domain-specific Zod validation for every entity and nested snapshot before upload; current entity schemas are not deep enough to trust for this purpose. Explain blockers and keep the original recoverable.
3. Build a stable snapshot and preview counts for profile, target, diary entries/sessions, custom foods, favorites, saved meals/items, weight records, cart draft, and preferences. The current model has no reliable provenance field across all entities, so do not identify demo versus user-created records from ID prefixes alone. Show all stored data as-is, label provenance as unknown where necessary, and let the user explicitly choose whether to include it.
4. Validate references and relationships, including catalog/custom favorite resolution and diary session grouping. Show diary dates as interpreted on this device. The existing JSON backup parser is not a complete migration source: it omits custom foods, drafts, settings, app preferences, and search history.
5. Query the signed-in user's cloud data before upload. Classify records as identical duplicates, cloud-only records, or same-ID/different-content conflicts. Never overwrite cloud data. Stop for explicit resolution of differing conflicts; leave server-only records untouched.
6. Require the user to confirm the exact preview. Insert only missing records, retaining stable IDs. Upload parent rows before children. Use idempotent inserts and re-check duplicate IDs; do not use blind upserts.
7. If a request fails partway, keep the local data, report which categories completed, and allow a retry. On retry, compare existing IDs/content and continue with missing records. A differing record remains a conflict, not a reason to overwrite.
8. Re-read uploaded IDs and compare normalized values/counts with the approved snapshot. Show success only after verification. Retain all original LocalStorage records; any later local cleanup must be a separate, explicit user action.

The migration preview and retry behavior need focused component/integration tests before release. Local-to-cloud migration must never recalculate targets or replace historical food nutrition snapshots.

## 6. Supabase Dashboard setup checklist

Before authentication or database features are enabled:

1. Verify the existing project is in the user's own organization, choose/confirm its database region, and save the database password in a password manager. Do not share secrets in chat.
2. For each environment, configure the site URL and exact callback/recovery redirect URLs. Local config allows `localhost` and `127.0.0.1` app URLs for local development; these local-only patterns support query parameters on the PKCE callback. Restart local Supabase after changing `config.toml`. Add the real production domain and narrowly scoped Vercel preview patterns before deployment. Do not use a broad wildcard for production.
3. In **Authentication → Providers**, keep Email enabled and choose the production email-confirmation behavior. Local confirmation is disabled for immediate-session testing; production SMTP and confirmation/reset email templates must be configured before public rollout.
4. For Google, create a Google Cloud Web OAuth client. Add the local and real production origins. Set the authorized redirect URI to the callback URL shown by the Supabase Google provider setup (`https://<project-ref>.supabase.co/auth/v1/callback` for a hosted project), then enter the Google client ID/secret only in the Supabase Dashboard. Request only `openid`, `email`, and `profile` scopes. Do not enable the app flag until the provider is configured.
5. Keep database access limited to the required exposed schema. Confirm no user table is granted to `anon`; the reviewed migrations must enable RLS and grant only intended `authenticated` operations.
6. Later, add the project URL and publishable key to local `.env.local` and Vercel's Development/Preview/Production environment settings. Never commit `.env.local`; never add a secret/service-role key to `NEXT_PUBLIC_*`.

## 7. Environment template

`.env.example` contains placeholders only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Enable only after the Google provider and redirect URLs exist in Supabase.
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false
```

The publishable key is designed for browser use and is not an authorization mechanism. RLS must protect the database. No secret/service-role key belongs in this template.

## 8. Phased implementation checklist

### Phase 3A: foundation preparation

- [x] Inspect current app, storage model, tests, and existing worktree changes.
- [x] Review current Supabase SSR, Next.js App Router, RLS, migration, email/password, OAuth, and redirect documentation.
- [x] Document the proposed relational schema, local mapping, RLS, auth, migration, and Dashboard setup.
- [x] Add placeholder-only environment template and allow it to be tracked.
- [x] Check local CLI, Docker, `supabase/`, and environment-template readiness.
- [x] User creates a Supabase project; local credentials remain in ignored `.env.local`.

### Phase 3B: client foundation

- [x] Add Supabase client dependencies and environment validation.
- [x] Implement cookie-based browser/server clients and the Next.js 16 session-refresh Proxy.
- [x] Add focused configuration and client initialization tests.
- [x] Generate database types from the local schema and type the browser/server/Proxy clients.
- [x] Connect authenticated repositories to the app data provider while preserving anonymous demo mode. (Delivered in Phase 3E2; see below.)
- [ ] Implement explicit migration preview, validation, conflict handling, resumable insert, and verification.

The client and repository layers alone do not provide app-level cloud persistence; the Phase 3E2 provider selection does, and anonymous demo mode is unchanged by it.

### Phase 3C: database schema and RLS

- [x] Apply the versioned schema migration to local Supabase.
- [x] Validate 12 user-owned tables and 48 explicit authenticated RLS policies.
- [x] Run all 57 pgTAP database tests against the local instance.
- [ ] Review and approve any hosted-project migration separately before deployment.
- [ ] Deploy reviewed migrations only after separate explicit approval.

Hosted database changes remain out of scope and have not been applied.

### Phase 3D: authentication

- [x] Add localized login, signup, recovery, password reset, and sign-out flows.
- [x] Handle email verification and PKCE callback exchange with safe return destinations.
- [x] Add Google OAuth integration behind a disabled-by-default configuration flag.
- [x] Verify identity with `getClaims()` in the Next.js 16 Proxy and completion route.
- [x] Provision profiles from the verified identity without adding a database trigger.
- [x] Add validation, form, callback, Proxy, profile, and translation-parity tests.
- [x] Complete TypeScript, lint, all 185 automated tests, production build, and all 57 local pgTAP tests for this authentication change.
- [x] Manually verify local email/password signup, sign-in, Mailpit recovery, password reset, sign-out, and localized auth navigation in the browser.
- [ ] Configure Google credentials through Supabase's local provider settings before testing Google sign-in.
- [x] Keep repository foundation, app integration, and migration as separate steps; no cloud sync occurs here.

### Phase 3E1: data repositories

- [x] Generate TypeScript database types from the locally applied schema; verify all 12 public app tables and their relationships.
- [x] Type browser, request-scoped server, and Next.js 16 Proxy Supabase clients with the generated schema.
- [x] Implement typed repositories for profiles, nutrition targets, diary sessions and entries, custom foods, favorites, saved meals/items, weights, meal-cart drafts, account preferences, and search history.
- [x] Derive ownership from verified `getClaims()` results on every repository operation; rely on RLS for final enforcement.
- [x] Validate database-to-domain mappings and preserve existing historical food nutrition and saved-food snapshots without recalculation.
- [x] Add repository tests for identity, ownership filters, CRUD paths, empty states, invalid inputs, database errors, and snapshot mapping.
- [x] Keep `DemoDataProvider` and all existing LocalStorage data untouched; add no automatic sync or migration.
- [ ] Add the explicit, validated, conflict-aware LocalStorage-to-cloud migration flow before moving existing local data.

Saved-meal creation spans separate parent/item requests because the current schema has no transactional repository RPC. If an item insert fails, the repository reports `partial-write`; callers must surface that error rather than treating the meal as complete.

### Phase 3E2: authenticated cloud data integration

- [x] Resolve authenticated claims before selecting cloud data; retain the demo provider for anonymous users.
- [x] Bind each cloud provider instance to its verified user ID and remount provider state when the account changes.
- [x] Load and persist profile, nutrition targets, diary entries/sessions, favorites, saved meals, weights, preferences, search history, and meal-cart drafts through user-owned repositories.
- [x] Load repository-backed custom foods without changing the global food catalog.
- [x] Add a custom-food create/edit UI in My Collection, backed by owner-scoped repository writes; delete and duplicate are out of scope.
- [x] Keep demo-only import/export/reset hidden from authenticated accounts; never fall back to LocalStorage after cloud errors.
- [x] Preserve stored food nutrition snapshots, and expose partial saved-meal writes as errors.
- [x] Add automated provider-selection tests for authenticated, anonymous, and account-switch states.
- [x] Verify two synthetic accounts in the local browser: diary, weight, and favorite isolation; refresh persistence; account switching; anonymous route protection; demo-mode preservation; simulated expired session; and failed cloud writes.
- [ ] Implement explicit, validated, conflict-aware local-to-cloud migration in a separate approved phase.

No Supabase schema or RLS policy changes were made for Phase 3E2. Browser checks confirmed that each synthetic account loaded only its own diary, weight, and favorite records after account switches and refreshes. The expired-session test returned to anonymous demo mode without rendering the prior account's records. During a local REST outage, a cloud favorite deletion returned HTTP 503, displayed an error, retained the favorite, and did not change the existing LocalStorage data. LocalStorage fingerprints matched before and after the browser tests. Existing demo data was not uploaded, migrated, overwritten, or deleted. Custom-food create/edit now uses the same owner-scoped repositories and is covered by automated tests; its dialog interaction has not been re-checked in a browser. Local-to-cloud migration remains separately scoped.

### Dependency audit

The read-only `npm audit` reported 16 moderate advisories, all in development-only ESLint tooling and its transitive dependency tree. `npm audit --omit=dev` reported zero vulnerabilities in production dependencies (rechecked 2026-11-02: unchanged). npm's proposed audit fixes require major dependency changes; none were applied. Recheck compatibility before choosing a manual upgrade path.

## 9. Official guidance reviewed

Reviewed 2026-11-01:

- [Supabase Auth server-side rendering](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Next.js Auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase SSR client creation for Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase local database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Supabase email/password Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Next.js `proxy.ts` convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

Supabase currently labels `@supabase/ssr` as beta in its SSR guidance. Use it as recommended for cookie-based SSR, but pin and review compatible versions during implementation.

**End of Supabase Integration Foundation**
