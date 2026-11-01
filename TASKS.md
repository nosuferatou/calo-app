# CALO — Development Roadmap &amp; Task Management

**Document Version:** 1.2  
**Status:** Approved v1.0; Phase 3E2 authenticated cloud integration recorded in sections 1.4 and 15

## 1. Purpose

This document defines the implementation roadmap for CALO MVP.

Development must follow the phases and dependencies defined below.

The coding agent must:

- Work incrementally.
- Complete one logical task at a time.
- Follow [PRD.md](http://PRD.md), TECH\_[STACK.md](http://STACK.md), and [DESIGN.md](http://DESIGN.md).
- Avoid implementing unapproved features.
- Update this document when tasks are completed.
- Report blockers instead of making unsupported assumptions.

Do not attempt to implement the entire application in one task.

---

## 2. Development Rules

1. Inspect the existing project before modifying files.
2. Read all relevant project documentation before implementation.
3. Do not overwrite existing working code without understanding its purpose.
4. Keep changes focused and maintainable.
5. Follow TypeScript strict mode.
6. Reuse existing components and utilities.
7. Avoid unnecessary dependencies.
8. Test important functionality before marking tasks complete.
9. Do not mark unfinished work as completed.
10. Update documentation when implementation decisions change.

---

## 3. Phase 0 — Project Initialization

### 0.1 Workspace Setup

- [x] Inspect the existing project directory.
- [x] Verify Git repository status.
- [x] Initialize Git if necessary.
- [x] Create a Next.js App Router project with TypeScript.
- [x] Configure Tailwind CSS.
- [x] Configure ESLint.
- [x] Configure path aliases.
- [x] Verify development server.
- [x] Verify production build.
- [x] Create initial [README.md](http://README.md).
- [x] Create .gitignore.

### 0.2 UI Foundation

- [x] Configure shadcn/ui.
- [x] Configure Lucide icons.
- [x] Establish CSS design tokens.
- [x] Establish typography.
- [x] Configure light and dark themes.
- [x] Create base reusable components.
- [x] Complete semantic color tokens and status colors.
- [x] Add badge, progress, and skeleton components.
- [x] Verify responsive layout foundation.

**Completion criteria:** The application starts successfully and the basic UI foundation is ready.

---

## 4. Phase 1 — Application Foundation

### 1.1 Architecture

- [x] Implement the agreed project structure.
- [x] Establish reusable layout components.
- [x] Implement application routing.
- [x] Implement shared navigation.
- [x] Implement desktop sidebar.
- [x] Implement tablet navigation behavior.
- [x] Implement mobile bottom navigation.

### 1.2 Core Infrastructure

- [x] Define core TypeScript types.
- [x] Implement LocalStorage utility.
- [x] Implement storage schema versioning.
- [x] Implement data validation.
- [x] Implement safe storage initialization.
- [x] Implement storage migration foundation.
- [x] Implement centralized error handling.
- [x] Implement toast notifications.

### 1.2.1 Foundation Remediation (Phase A)

- [x] Bind storage schemas to keys through `StoredDataMap`.
- [x] Replace the global schema version with per-key versions.
- [x] Require explicit confirmation for destructive storage operations.
- [x] Deduplicate and enumerate quarantine records.
- [x] Add safe domain recovery and full data reset.
- [x] Fix storage status subscription and server snapshot behavior.
- [x] Enforce degraded read-only mode.
- [x] Improve toast persistence, pause, and live-region announcements.
- [x] Standardize UTC ISO timestamp helpers.
- [x] Fix verified contrast issues and control cursor affordances.
- [x] Resolve the Vitest configuration warning.
- [x] Add storage, migration, status, datetime, and toast tests.

### 1.3 Application Preferences

- [x] Implement theme preference.
- [x] Implement language preference.
- [x] Implement English translations.
- [x] Implement Bahasa Indonesia translations.
- [x] Persist preferences locally.

**Completion criteria:** Navigation, shared layout, preferences, and core storage infrastructure work correctly.

### 1.4 Approved Multi-User Architecture Alignment

- [x] Align documentation with the approved public multi-user architecture (Supabase, PostgreSQL, Row Level Security, Vercel).
- [x] Implement Supabase authentication and PostgreSQL persistence for authenticated users (local Supabase only; hosted migration awaits separate approval — see sections 1.4.3-1.4.5).
- [x] Define local-to-cloud data migration strategy (design documented; implementation pending).
- [x] Keep LocalStorage as supporting storage for preferences, temporary drafts, caching, and pre-authentication data.

**Completion criteria:** Documentation reflects the approved architecture and the local foundation is implemented; hosted deployment and local-to-cloud migration remain pending.

### 1.4.1 Supabase Integration Foundation (Phase 3A)

- [x] Inspect current persisted entities, storage validation/versioning, auth placeholders, dependencies, and tests.
- [x] Review current official Supabase SSR, Next.js 16 Proxy, RLS, Auth, redirects, and local migrations guidance.
- [x] Propose PostgreSQL tables, relationships, constraints, indexes, and local storage mapping.
- [x] Document explicit authenticated-only RLS policy design and required policy tests.
- [x] Document email/password, Google OAuth, cookie sessions, protected routes, and localized auth flow.
- [x] Document explicit, validated, conflict-aware, resumable local-to-cloud migration.
- [x] Add placeholder-only `.env.example`; exclude it from the `.env*` ignore rule.
- [x] Inspect Supabase CLI, Docker, existing Supabase config, and environment templates.
- [x] User creates a Supabase project; local credentials remain in ignored `.env.local`.
- [x] Begin Phase 3B client integration after the user configured the Supabase project and local public environment variables.

**Status:** Phase 3A architecture preparation and Phase 3B client foundation are complete. The hosted project remains untouched.

### 1.4.2 Database Schema & RLS (Phase 3C)

- [x] Draft versioned tables and relationships for profiles, targets, diary sessions/entries, custom foods, favorites, saved meals/items, weight, meal-cart draft, preferences, and search history.
- [x] Add authenticated-only per-operation RLS policies, explicit grants, ownership constraints, indexes, and historical nutrition snapshots.
- [x] Draft pgTAP coverage for schema/RLS/grants, owner and cross-user access, foreign-key ownership, and snapshot independence.
- [x] Initialize local Supabase with a pinned project CLI and running Docker Engine.
- [x] Apply the migration locally; all 57 pgTAP tests pass across 12 user-owned tables and 48 RLS policies.
- [ ] Obtain separate approval before applying reviewed migrations to the hosted project.

**Status:** Schema and RLS are validated against local Supabase only. No hosted migration or CALO LocalStorage upload has occurred.

### 1.4.3 Authentication (Phase 3D)

- [x] Implement localized email/password signup, login, sign-out, email callback, password recovery, and password reset.
- [x] Add Google OAuth integration with a disabled-by-default flag; local Google credentials are not configured.
- [x] Verify identity in the Next.js 16 Proxy and completion route using `getClaims()`.
- [x] Provision profiles from verified claims using the existing schema, with no duplicate trigger or client-supplied user ID.
- [x] Keep local-first feature routes public and protect the authenticated completion route.
- [x] Add form validation, callback, safe redirect, Proxy, profile, and locale-parity tests.
- [x] Complete TypeScript, lint, all 185 automated tests, production build, and all 57 local pgTAP tests for Phase 3D.
- [x] Manually test local signup, sign-in, recovery through Mailpit, password reset, sign-out, and localized auth navigation in the browser.
- [ ] Configure Google OAuth only through Supabase provider settings before testing it.

**Status:** Local email/password authentication is implemented and browser-verified. Google OAuth remains unconfigured, and authentication does not enable cloud data access or local-to-cloud migration.

### 1.4.4 Supabase Data Repositories (Phase 3E1)

- [x] Generate TypeScript database types from the applied local schema.
- [x] Type the browser, request-scoped server, and Next.js 16 Proxy clients with the generated database schema.
- [x] Implement typed repositories for all 12 current user-owned tables.
- [x] Derive owner IDs from verified Supabase claims; keep RLS as the database authorization boundary.
- [x] Validate row mappings, empty states, invalid input, database errors, and historical snapshot preservation.
- [x] Add unit coverage for repository identity, owner-scoped operations, CRUD behavior, and mapping.
- [x] Leave the existing demo provider and LocalStorage data unchanged; perform no automatic upload or migration.
- [ ] Build and test the explicit local-to-cloud migration and conflict-resolution flow before any upload.

**Status:** The typed repository layer is integrated through a claims-verified provider boundary. Existing demo data and LocalStorage remain available only in anonymous demo mode; no automatic upload or migration occurs.

### 1.4.5 Authenticated Cloud Data Integration (Phase 3E2)

- [x] Select demo or cloud data only after resolving the authenticated identity; remount cloud state for account changes.
- [x] Load authenticated profile, targets, diary data, custom foods, favorites, saved meals, weights, preferences, search history, and cart drafts from repositories.
- [x] Persist profile, targets, diary entries/sessions, favorites, saved meals, weight records, preferences, search history, and cart drafts through repositories.
- [x] Keep demo-only import, export, and reset controls unavailable to authenticated accounts.
- [x] Preserve historical nutrition snapshots and surface repository failures and partial saved-meal writes.
- [x] Add provider-selection tests for authenticated, anonymous, and account-switch states.
- [x] Verify two synthetic accounts in the local browser: diary, weight, and favorite isolation; refresh persistence; account switching; anonymous route protection; demo-mode preservation; simulated expired session; and failed cloud writes.
- [x] Add a user-facing custom-food create/edit flow in My Collection; deleting and duplicating custom foods remain out of scope.
- [ ] Build the explicit, validated, conflict-aware LocalStorage-to-cloud migration flow before moving existing local data.

**Status:** Complete. Browser isolation passed with two synthetic local accounts. Each account saw only its own diary entry, weight record, and favorite after account switches and refreshes. An expired synthetic session returned to demo mode without showing account data. A local REST outage returned an error, retained the cloud UI state, and made no LocalStorage changes. Anonymous access to `/auth/complete` redirected to login. Custom-food create/edit is now available in both demo and authenticated modes, with local persistence and owner-scoped repository writes covered by automated tests; delete, duplicate, and local-to-cloud migration remain unimplemented. TypeScript, lint, all 215 automated tests, production build, and all 57 local pgTAP tests passed. Existing demo LocalStorage fingerprints were unchanged. Final manual browser QA (18/18 tests, 4 suites: demo mode, validation, authenticated cloud persistence, responsive/localization) passed with no application code changes required; see the retrospective summary in `QA-REPORT-3E2.md`. Raw browser logs and screenshots from that session were not retained.

---

## 5. Phase 2 — Onboarding &amp; Nutrition Calculations

### 2.1 Onboarding

- [x] Build onboarding wizard.
- [x] Implement progress indicator.
- [x] Implement profile input forms.
- [x] Implement form validation.
- [x] Implement Back and Next navigation.
- [x] Implement profile persistence.
- [x] Implement target review screen.
- [x] Implement onboarding completion flow.

### 2.2 Nutrition Calculations

- [x] Research candidate BMR/TDEE formulas and macro allocation rules.
- [x] Document formula sources, assumptions, units, rounding, edge cases, and limitations in `NUTRITION_CALCULATIONS.md`.
- [x] Approve the proposed formula specification.
- [x] Select and record the approved BMR calculation formula.
- [x] Implement BMR calculation.
- [x] Implement TDEE estimation.
- [x] Define calorie target adjustments for fitness goals.
- [x] Define macronutrient allocation rules.
- [x] Implement macro calculations.
- [x] Implement manual target editing.
- [x] Implement recalculation after profile updates.
- [x] Add unit and component tests for calculations and target flows.

**Important:** Calculation formulas must be documented and approved before implementation. Do not invent medical or nutritional recommendations.

**Completion criteria:** Users can complete onboarding and receive editable nutrition targets.

**Status:** Complete. The approved BMR, TDEE, calorie target, macro, validation, BMI warning, onboarding, Settings recalculation, manual fallback, storage compatibility, and localization behavior are implemented. At Phase 2 completion Supabase and cloud sync were out of scope; they are covered by sections 1.4.3-1.4.5, where the same approved calculation logic runs against either the demo provider or repository-backed cloud data.

---

## 6. Phase 3 — Food Database &amp; Food Catalog

### 3.1 Food Data Structure

- [x] Define built-in food schema.
- [x] Define nutrition source reference format.
- [x] Establish food category structure.
- [ ] Establish food subcategory structure.
- [x] Define food ID conventions.
- [x] Define gram-based nutrition values.
- [x] Establish food data validation (`validateFoodDataset` in `src/lib/food-data.ts`: unique IDs, required fields, valid categories, source references, plausibility advisories).

### 3.2 Food Database

- [x] Research reliable nutritional references.
- [x] Build initial Indonesian food dataset.
- [x] Build initial international food dataset.
- [x] Include cooking-method-specific food entries.
- [ ] DEFERRED after v1.0 — Validate nutritional values against cited source tables.
- [ ] DEFERRED after v1.0 — Verify source references for every entry.
- [ ] DEFERRED after v1.0 — Target 200–500 food entries.

**Status:** A 50-item initial curated dataset (`src/data/foods.ts`) covers Indonesian and international foods. Every record carries the sample-dataset provenance string, the catalog page displays a visible "values are illustrative and not verified nutrition data" notice, and `validateFoodDataset` blocks structural defects (one advisory is recorded and tolerated: `food-mango` fiber+sugar marginally exceeds total carbohydrates). Expanding to 200–500 verified entries requires licensed food-composition data; inventing entries to hit a count was explicitly rejected. This is a known launch limitation, not a blocker: the catalog remains usable, correctly labeled, and custom foods let users record verified values themselves.

### 3.3 Food Catalog UI

- [x] Build Food Catalog page.
- [x] Build Grid View.
- [x] Build List View.
- [x] Implement view preference persistence.
- [x] Implement food search.
- [x] Implement Indonesian and English synonyms.
- [x] Implement search relevance ranking.
- [ ] Implement usage-based popularity ranking.
- [x] Implement recent searches.
- [ ] Implement food recommendations.
- [x] Implement category navigation.
- [x] Build Food Detail page.
- [x] Implement decimal gram input.
- [x] Implement proportional nutrition calculations.
- [x] Implement Quick Add.

**Completion criteria:** Users can browse, search, inspect, and select built-in foods.

---

## 7. Phase 4 — Custom Foods &amp; Meal Cart

### 4.1 Custom Foods

- [x] Build custom food creation form.
- [x] Implement all required nutritional fields.
- [x] Implement category selection.
- [x] Implement numeric validation.
- [x] Implement 4-4-9 consistency checks.
- [x] Implement warning confirmation.
- [x] Implement edit.
- [ ] Implement delete and duplicate actions.
- [x] Persist custom foods locally.

**Status:** Custom foods can be created and edited from the third tab in My Collection. Demo mode persists them in `calo:custom-foods`; authenticated mode uses owner-scoped `custom_foods` rows. Deleting and duplicating custom foods are not implemented. Existing custom foods loaded from either source remain usable in the catalog, favorites, saved meals, and Meal Cart.

### 4.2 Meal Cart

- [x] Build Meal Cart side drawer.
- [x] Build mobile-adapted Meal Cart.
- [x] Implement add food.
- [x] Implement edit quantity.
- [x] Implement remove food.
- [x] Implement automatic draft persistence.
- [x] Implement draft recovery.
- [x] Implement Calculate action.
- [x] Implement nutrition summary.
- [x] Implement meal category suggestion.
- [x] Implement category selection.
- [x] Implement date handling.
- [x] Implement explicit save confirmation.
- [x] Implement multiple meal sessions.
- [x] Implement automatic session timestamps.

**Completion criteria:** Users can add foods, calculate nutrition, retain drafts, and explicitly save meals.

---

## 8. Phase 5 — Food Diary

### 5.1 Calendar

- [x] Build monthly calendar.
- [x] Implement month navigation.
- [x] Implement date selection.
- [x] Display dates containing food logs.
- [x] Display empty dates as Not Logged.
- [x] Implement historical date selection.

### 5.2 Meal Sessions

- [x] Display meal categories.
- [x] Display multiple sessions per category.
- [x] Display individual food entries.
- [x] Display nutritional totals.
- [x] Implement expandable nutrition details.
- [x] Implement edit food.
- [x] Implement delete food.
- [x] Implement duplicate food.
- [x] Implement edit session.
- [x] Implement delete session.
- [x] Implement duplicate session.
- [x] Implement copy meal from previous date.
- [x] Implement deletion confirmation.

**Completion criteria:** Users can navigate dates and fully manage historical food logs.

---

## 9. Phase 6 — Dashboard

- [x] Build Dashboard layout.
- [x] Display daily calorie summary.
- [ ] Implement circular calorie progress.
- [x] Display remaining calories.
- [x] Display Under Target status.
- [x] Display On Target status.
- [x] Display Over Target status.
- [x] Implement protein progress.
- [x] Implement carbohydrate progress.
- [x] Implement fat progress.
- [x] Implement grouped meal summary.
- [ ] Implement expandable food details.
- [x] Implement Add Food navigation.
- [x] Implement Quick Add modal.
- [x] Verify responsive dashboard layout.

**Note:** Calorie and macro progress use the accessible linear `Progress` component instead of a circular gauge.

**Completion criteria:** Dashboard accurately reflects current daily nutrition data.

---

## 10. Phase 7 — My Collection

### 7.1 Favorite Foods

- [x] Build Favorite Foods interface.
- [x] Implement add and remove favorite.
- [x] Implement edit custom food.
- [ ] Implement delete.
- [ ] Implement duplicate.
- [x] Implement direct add to Meal Cart.

### 7.2 Saved Meals

- [x] Build Saved Meals interface.
- [x] Implement save meal combination.
- [x] Store food quantities.
- [x] Implement search.
- [ ] Implement edit.
- [x] Implement delete.
- [x] Implement duplicate.
- [x] Implement load into Meal Cart.

**Completion criteria:** Users can manage individual favorite foods and reusable meal combinations.

---

## 11. Phase 8 — Analytics &amp; Weight Tracking

### 8.1 Nutrition Analytics

- [x] Build Analytics page.
- [x] Implement 7-day view.
- [x] Implement 30-day view.
- [x] Calculate average daily calories.
- [x] Calculate average macronutrients.
- [x] Implement calorie trend chart.
- [x] Implement macronutrient trend chart.
- [x] Exclude days without food logs from averages.
- [x] Implement empty states.

### 8.2 Weight Tracking

- [x] Implement weight input.
- [x] Implement decimal kilogram values.
- [x] Implement historical date selection.
- [x] Implement weight history.
- [x] Implement weight trend chart.
- [x] Implement edit weight entry.
- [x] Implement delete weight entry.

**Completion criteria:** Users can inspect nutrition trends and track historical body weight.

---

## 12. Phase 9 — Settings &amp; Data Management

### 9.1 Profile &amp; Goals

- [x] Build profile settings.
- [x] Implement profile editing.
- [x] Implement goal editing.
- [x] Implement nutrition target editing.
- [x] Preserve historical food logs after changes.

### 9.2 Appearance &amp; Language

- [x] Build appearance settings.
- [x] Implement Light Mode.
- [x] Implement Dark Mode.
- [x] Implement System Default.
- [x] Build language settings.
- [x] Implement language switching.

### 9.3 Data Management

- [x] Implement JSON export.
- [x] Implement JSON validation.
- [x] Implement import data summary.
- [x] Implement import confirmation.
- [x] Implement safe data replacement.
- [x] Implement Reset All Data.
- [x] Implement two-step reset confirmation.

**Completion criteria:** Users can manage preferences and safely back up, restore, or reset their data.

---

## 13. Phase 10 — Quality Assurance

### 10.1 Functional Testing

- [ ] Test onboarding.
- [ ] Test target calculations.
- [x] Test food search.
- [x] Test custom foods (validation, demo persistence, and owner-scoped repository writes; dialog interaction is not automated).
- [x] Manual browser QA for custom-food create/edit: 18/18 tests across demo mode, validation, authenticated cloud persistence, and responsive/localization — all pass; no application code changes required (retrospective summary in `QA-REPORT-3E2.md`; raw browser logs and screenshots were not retained).
- [ ] Test Meal Cart.
- [ ] Test draft persistence.
- [ ] Test Food Diary.
- [x] Test multiple meal sessions.
- [x] Test Dashboard calculations.
- [ ] Test My Collection.
- [x] Test Analytics.
- [ ] Test Weight Tracking.
- [x] Test JSON export and import.
- [ ] Test reset functionality.

**Status:** Automated unit and component tests cover onboarding target calculation, target recalculation and editing, nutrition calculations, legacy v1 profile and manual-target loading, historical diary snapshot preservation, search, session grouping, nutrition aggregation and averages, and backup import. Full manual end-to-end flow testing in a browser remains pending.

### 10.2 Technical Testing

- [x] Configure testing framework.
- [x] Run unit tests.
- [x] Run integration tests.
- [ ] Run end-to-end tests for critical flows.
- [x] Run lint.
- [x] Run TypeScript typecheck.
- [x] Run production build.
- [ ] Check browser compatibility.
- [x] Check responsive layouts. (320px, 390px, and 1280px desktop verified during Phase 3E2 custom-food browser QA)
- [ ] Check accessibility.

**Status:** `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run build` pass. Responsive and accessibility behavior was reviewed in code (320px upward, focus states, labels, reduced-motion handling), but no automated browser audit was executed.

### 10.3 Data Integrity

- [x] Test corrupted LocalStorage data.
- [x] Test missing LocalStorage values.
- [x] Test schema migration.
- [x] Test backup restoration.
- [x] Test decimal nutrition calculations.
- [x] Test date and timezone behavior.

**Completion criteria:** Critical application flows work reliably and quality checks pass.

---

## 14. Phase 11 — Deployment

Local preparation (no external account access required):

- [x] Verify Git repository and create recovery checkpoints.
- [x] Verify production build.
- [x] Configure production security headers and HSTS (`next.config.ts`, production-only).
- [x] Enforce HTTPS-only Supabase URL outside localhost (`src/lib/supabase/config.ts`).
- [x] Run the local pgTAP RLS suite against the applied schema (57 tests).
- [x] Confirm no secret or local-state file is tracked: only `.env.example` is committed, while `.env.local`, `supabase/.temp`, `supabase/.branches`, `.qoder/settings.local.json`, and vendored skill binaries are ignored.
- [x] Serve the production build locally and confirm the security headers on app and auth routes, a clean server log, and a 200 from every page.
- [x] Add the keyboard skip link to the main content and a global reduced-motion rule.
- [ ] Push the verified branch to the GitHub remote.

Requires explicit owner authorization or account access:

- [ ] Confirm the target hosted Supabase project identity before touching it.
- [ ] Inspect the hosted project, verify it is empty, and confirm backup/rollback posture.
- [ ] Apply the reviewed migration and RLS policies to the hosted project.
- [ ] Re-run the pgTAP suite against the hosted database.
- [ ] Configure the site URL, redirect URLs, and a production email sender for password recovery.
- [ ] Create the Vercel project and set `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and optional
      `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` for **build time** in Preview and Production, not
      runtime only. These variables are inlined into the client bundle: the `.next` output
      built locally contains `http://127.0.0.1:54321` and must never be promoted, only
      rebuilt on the hosting platform. There is no site-URL variable — the Site URL and the
      callback/recovery redirect allow-list are configured in the Supabase Auth dashboard.
- [ ] Deploy preview, then production, on the approved domain, and confirm the response
      headers on the deployed origin: the CSP `connect-src` must name the hosted Supabase
      origin rather than localhost.
- [ ] Verify deployed routes, signup/login, recovery, ownership isolation, and logs.

**Completion criteria:** CALO is accessible through a working Vercel deployment backed by the migrated production Supabase project.

---

## 15. Application Build Status

The MVP runs in two data modes selected by identity. Anonymous visitors use the local demo provider (LocalStorage). Authenticated users use Supabase PostgreSQL through the typed, owner-scoped repositories. Existing demo data is never uploaded automatically.

### Ready routes

| Route | Status | Highlights |
| --- | --- | --- |
| `/` | Ready | Greeting, daily calories, macro progress, meal summary, recent activity, weight summary, quick add |
| `/diary` | Ready | Month calendar, logged-day markers, meal sessions, edit/duplicate/delete entry, delete/duplicate session, copy previous day |
| `/catalog` | Ready | Search with synonyms, recent searches, categories, grid/list toggle, food detail, favorites, add to meal cart |
| `/collection` | Ready | Favorite foods (remove), saved meals (duplicate and delete), custom foods (create and edit only — no delete or duplicate), search, load into cart |
| `/analytics` | Ready | 7/30-day averages excluding unlogged days, calorie and macro charts, weight CRUD and trend |
| `/settings` | Ready | Profile, calculated and manual targets, profile-triggered recalculation, theme, language, JSON export/import with summary, two-step reset, storage status |
| `/onboarding` | Ready | Five-step wizard, profile validation, calculated target review, editable manual fallback |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/complete` | Ready (local) | Email/password signup, sign-in, recovery and reset through local Mailpit, PKCE callback, claims-based Proxy protection, localized forms |

### Data and localization

- Demo data is seeded from `src/data/mock.ts` and `src/data/foods.ts` and persisted through the centralized storage client.
- Authenticated data is loaded and saved through claims-verified, owner-scoped Supabase repositories; cloud content stays hidden until the load resolves, and failed writes retain the visible state instead of falling back to LocalStorage.
- JSON export/import and Reset All Data are demo-mode controls only; they remain unavailable to authenticated accounts.
- English and Bahasa Indonesia strings are complete for all implemented screens; Bahasa Indonesia is the default.
- Nutrition calculations use the approved formulas in `NUTRITION_CALCULATIONS.md`. Users can edit calculated targets or keep manual targets when automatic calculation is unavailable.

### Remaining limitations

- Nutrition values in the demo dataset are illustrative and not source-verified.
- Custom foods support create and edit only; delete, duplicate, and import/export of custom foods are not implemented.
- Usage-based popularity ranking and food recommendations are not implemented.
- Saved meal editing is limited to duplicate/delete/load.
- The validated PostgreSQL schema and RLS policies exist only in local Supabase; applying them to the hosted project requires separate approval.
- Google OAuth is implemented behind a disabled-by-default flag and is not configured or tested.
- The explicit, validated, conflict-aware LocalStorage-to-cloud migration flow is not implemented; no local data is moved today.
- No automated end-to-end or browser accessibility audit has been run.

### Deferred for the first production release

The following approved-scope items are deliberately deferred because they do not compromise the core logging, target, diary, or analytics workflows:

- Custom-food delete and duplicate, and favorite-food delete and duplicate.
- Saved-meal inline editing (duplicate, delete, and load into cart remain available).
- Usage-based popularity ranking and food recommendations.
- Circular calorie progress gauge (deliberately replaced by the accessible linear `Progress` component) and expandable food details on the Dashboard.
- Food subcategory structure and the 200–500 verified-entry catalog.
- LocalStorage-to-cloud migration: acceptable for launch because demo mode and authenticated mode are visually and architecturally separate, cloud data is loaded only after identity is verified, and no interface implies that local data moves automatically.
- Google OAuth: the UI is behind a disabled-by-default flag and already states that Google sign-in is not configured for this environment.

Known minor issue carried into launch: a partial write on diary entries reuses the "saved meal" wording (`cloud.partialSavedMeal`), so the toast can name the wrong object even though the rollback behaviour is correct.

---

## 16. Definition of Done

A task is complete only when:

1. Implementation follows the approved documentation.
2. No unrelated features are introduced.
3. TypeScript errors are resolved.
4. Relevant tests pass.
5. Responsive behavior is verified where applicable.
6. Accessibility is considered.
7. Existing functionality remains intact.
8. Documentation is updated when necessary.
9. Changes are reviewed before committing.

---

## 17. Agent Workflow

When working on CALO:

1. Read [AGENTS.md](http://AGENTS.md).
2. Read relevant sections of [PRD.md](http://PRD.md).
3. Read relevant sections of TECH\_[STACK.md](http://STACK.md).
4. Read relevant sections of [DESIGN.md](http://DESIGN.md).
5. Inspect the current implementation.
6. Select one logical task from [TASKS.md](http://TASKS.md).
7. Explain the implementation plan.
8. Implement only the approved task.
9. Run relevant checks.
10. Report modified files and test results.
11. Update [TASKS.md](http://TASKS.md) accurately.
12. Wait for approval before proceeding to a major new phase.

Do not silently skip tasks or change product scope.

**End of TASKS v1.2**