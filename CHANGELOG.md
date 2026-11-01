# CALO — Changelog

All notable changes to CALO will be documented in this file.

The project follows a simplified version of Keep a Changelog.

## [Unreleased]

### Added

- Approved nutrition calculation formulas with pure BMR, TDEE, calorie target, and macronutrient functions.
- Calculated target review and profile-triggered recalculation in onboarding and Settings, with editable manual targets when automatic calculation is unavailable.
- Profile validation, BMI restrictions and warnings, formula metadata, backward-compatible storage validation, and English/Bahasa Indonesia messaging.
- Unit and component tests for formula examples, calorie guardrails, BMI restrictions, onboarding calculations, Settings recalculation, and legacy v1 storage preservation.
- Phase 3A Supabase foundation proposal covering data mapping, PostgreSQL schema, RLS, Next.js 16 authentication, safe local migration, Dashboard setup, and placeholder-only environment variables.
- Supabase browser and request-scoped server clients with environment validation, cookie refresh through the Next.js 16 Proxy, and client configuration/initialization tests.
- Drafted a versioned CALO PostgreSQL schema migration and pgTAP RLS suite for local validation; no database was started or changed.
- Local Supabase schema and RLS validation: 12 user-owned tables, 48 policies, and 57 passing pgTAP tests.
- Localized email/password signup, sign-in, email callback, sign-out, password recovery, and password reset routes and forms.
- PKCE callback exchange, safe return destinations, claims-based Proxy checks, and idempotent profile provisioning from verified Auth claims.
- Google OAuth integration behind a disabled-by-default flag, with an explicit unavailable state until provider credentials are configured.
- Authentication form, validation, callback, profile, Proxy, redirect, and English/Bahasa Indonesia parity tests.
- Generated local Supabase database types and typed repositories for profiles, targets, diary sessions/entries, custom foods, favorites, saved meals/items, weights, cart drafts, preferences, and search history.
- Claims-derived repository ownership, runtime input/record validation, historical nutrition snapshot preservation, and repository mapping/CRUD tests; existing demo provider and LocalStorage data remain unchanged.
- Added claims-verified demo/cloud provider selection and repository-backed authenticated profile, target, diary, favorite, saved-meal, weight, preference, search-history, and cart-draft flows. Demo-only backup/reset controls remain hidden in cloud mode; no LocalStorage migration or upload occurs.
- Added custom-food create and edit in My Collection, with all eight required per-100 g values, category selection, decimal-aware validation, 4-4-9 and plausibility warnings that require explicit confirmation, demo persistence in `calo:custom-foods`, and owner-scoped cloud repository writes. Delete and duplicate remain unimplemented.
- Initial product requirements documentation.
- Initial technical stack documentation.
- Initial design system and UI direction.
- Initial development roadmap.
- Initial product overview.
- Approved nutrition calculation research and implementation specification in `NUTRITION_CALCULATIONS.md`.

### Changed

- Applied production security headers in `next.config.ts` (Content-Security-Policy with the Supabase origin in `connect-src`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS). The policy is production-only so `next dev` keeps its hot-reload transport.
- Required `https://` for `NEXT_PUBLIC_SUPABASE_URL` outside localhost, so a deployment cannot silently send session cookies over plaintext; added tests for both the remote rejection and the local exception.
- Recorded the four local recovery checkpoints (`chore: secure project ignore rules`, `feat: add CALO application and Supabase foundation`, `chore: migrate agent skills to .agents`, `docs: finalize Phase 3E2 documentation`) and stopped tracking the vendored Impeccable engine binary, which the skill launcher resolves from the per-user verified cache.
- Replaced the stale onboarding demo notice that claimed authentication and cloud sync were "not connected yet" with accurate English and Bahasa Indonesia copy; removed the now-unused `cloud.draftCleanupFailed` string.
- Added `validateFoodDataset` (`src/lib/food-data.ts`) as the food-catalog quality guard and documented the initial curated dataset as a deferred-verification launch limitation in `TASKS.md`, together with the deferred feature list for the first production release.
- Added a keyboard skip link to the app shell and a global `prefers-reduced-motion` rule, so the 16 components that carry Tailwind transitions stop animating for users who ask for less motion.
- Rewrote `README.md`, which was still the create-next-app boilerplate, with the real two-mode architecture, local Supabase setup, command list, and the pre-deployment boundary; reconciled stale statements in `SUPABASE_FOUNDATION.md` about cloud provider wiring, the custom-food UI, the environment template, and test counts.
- Aligned product and technical documentation with the approved public multi-user architecture: email/password and Google OAuth authentication, Supabase backend, PostgreSQL database, Row Level Security, and Vercel deployment.
- Clarified that the 1,200 kcal/day and 1,500 kcal/day calorie floors are algorithmic guardrails, not universal medically safe minimums or guarantees of safety.
- Linked the Phase 3A Supabase foundation proposal from the technical architecture and roadmap.
- Completed local browser verification for email/password signup, sign-in, Mailpit recovery, password reset, sign-out, localized navigation, and responsive auth controls.
- Bound cloud data-provider instances to verified account identities, kept authenticated content hidden until cloud data loads, and updated async onboarding, settings, diary, analytics, and cart saves to retain UI state on failed writes.
- Verified local cloud account isolation with two synthetic users across diary entries, weight records, and favorites. Refreshes and account switches preserved ownership boundaries. A forced expired session returned to demo mode without showing account data, an HTTP 503 cloud-write failure retained user-visible state without LocalStorage fallback, and demo-data fingerprints remained unchanged. TypeScript, lint, 200 automated tests, production build, and 57 local pgTAP tests passed.
- Completed Phase 3E2 final manual browser QA (18/18 PASS, no application code changes required): custom-food create/edit verified across demo mode (create, edit, refresh persistence, catalog search, cart scaling), all validation paths (required fields, decimals, negatives, 4-4-9 consistency warning, extreme-value confirmation), authenticated cloud mode (owner-scoped persistence, two-account RLS isolation), and responsive/localization layouts (320 px, 390 px, 1280 px desktop; English and Bahasa Indonesia). See the retrospective summary in `QA-REPORT-3E2.md`; raw browser logs and screenshots from that session were not retained. Remaining work: custom-food delete, duplicate, JSON backup integration, and local-to-cloud migration.
- Reconciled `TASKS.md` with the implemented Phase 3A-3E2 work: section 1.4 items for Supabase authentication, PostgreSQL persistence, and the LocalStorage supporting role are marked complete, section 5 no longer describes cloud sync as out of scope, and section 15 is retitled "Application Build Status" to describe the dual demo/cloud architecture, the auth routes, and the accurate remaining limitations (hosted migration, Google OAuth configuration, and local-to-cloud migration still pending).
- Reconstructed `QA-REPORT-3E2.md` as a retrospective summary of the reported 18/18 PASS run after the original artifact was found missing from the repository. It records only the previously reported results and states that raw browser traces and screenshots are unavailable; it is not new evidence.
- Committed the ignore baseline before application code: `.gitignore` and `supabase/.gitignore` now keep `.env*` (except `.env.example`), `node_modules/`, `.next/`, TypeScript build artifacts, local Supabase `.temp/` and `.branches/` state, and `.qoder/settings.local.json` out of version control, while workspace skills under `.agents/skills/` remain tracked.

### Fixed

- Clearing the cloud meal-cart draft now happens before the diary entries are inserted, and the draft is restored if the insert fails. Previously a failed cleanup write left the saved items in `meal_cart_drafts`, so a later reload could log the same meal a second time.
- A failed saved-meal item write removes the parent `saved_meals` row instead of leaving an empty ghost meal in My Collection; a failed diary entry write now rolls back the meal sessions it had just created rather than leaving orphan empty sessions.
- Read the persisted theme from the versioned settings envelope so Light, Dark, and System preferences survive full page loads.
- Activating the skip link now moves keyboard focus into the main content region. The link targeted `main#main-content`, but the element was not focusable, so focus stayed on `<body>` and keyboard users did not land inside the main landmark.
- The catalog quantity field accepts decimal grams. It carried `min="1" step="1"`, which marked a valid value such as 0.5 g as a failing HTML constraint while the cart editor already accepted decimals.

### Planned

- Configure and manually test Google OAuth through Supabase provider settings.
- Custom-food delete, duplicate, and backup import/export.
- Local-to-cloud migration after explicit user approval.

## [0.10.0] - Frontend Demo Build Completion

### Added

- Local demo data provider with CRUD for food entries, favorites, saved meals, meal cart drafts, and weight records, persisted through the centralized storage client.
- Demo food catalog with search, synonyms, categories, grid/list views, favorites, and add-to-cart flows.
- Dashboard with greeting, calorie and macro progress, meal summary, recent activity, and weight summary.
- Food Diary with month calendar, logged-day markers, meal sessions, edit/duplicate/delete, copy previous day.
- Analytics with 7/30-day averages excluding unlogged days, calorie/macro trend charts, and weight tracking.
- Settings with profile, manual nutrition targets, theme, language, JSON backup export/import, two-step reset, and storage status.
- Onboarding wizard with five steps, validation, manual targets, and formula-pending notice.
- Error boundaries localized in English and Bahasa Indonesia.

### Changed

- Bumped the package version to `0.10.0`.

### Remaining

- Nutrition values in the demo dataset remain illustrative; no source verification is applied.
- At version 0.10.0, automatic nutrition target calculation was pending formula approval; implementation is recorded under Unreleased.
- Supabase authentication, PostgreSQL persistence, and cloud sync are not implemented.

## [0.9.0] - Phase 1 Design System Completion

### Added

- Semantic color tokens for surface, elevated surface, border, muted foreground, success, warning, error, and info.
- `Badge` component with neutral, success, warning, error, and info variants.
- `Progress` component with neutral, success, warning, error, and info tones and accessible progressbar semantics.
- `Skeleton` component for loading placeholders.

### Changed

- Bumped the package version to `0.9.0`.
- Aligned card and dialog radii with the approved bimodal radius scale (tight 4–8 for controls, soft 16–24 for panels).

## [0.8.0] - Phase 1 Language Preference

### Added

- Language preference storage read through the centralized storage client.
- `useLanguage` hook with persisted language preference and document language application.
- `LanguageToggle` component with English and Bahasa Indonesia options.
- Settings language section with language preference control.
- Unit tests for language helpers.

### Changed

- Bumped the package version to `0.8.0`.

## [0.7.0] - Phase 1 Navigation Accessibility

### Added

- Keyboard-accessible focus states for desktop and mobile navigation links.

### Changed

- Bumped the package version to `0.7.0`.

## [0.6.0] - Phase 1 Base UI Components

### Added

- `Button` component with default and outline variants.
- `Input` component.
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent` components.
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, and `DialogFooter` components.
- `DropdownMenu` and `DropdownMenuItem` components.
- Unit tests for Button, Input, Dialog, and DropdownMenu.

### Changed

- Bumped the package version to `0.6.0`.

## [0.5.0] - Phase 1 Theme Foundation

### Added

- Class-based dark mode tokens and `@custom-variant dark` configuration in `src/app/globals.css`.
- Blocking theme initialization script that reads the stored theme preference and applies the resolved theme before paint.
- `useTheme` hook with persisted theme preference and system-preference listening.
- `ThemeToggle` component with Light, Dark, and System options.
- Settings appearance section with theme preference control.
- Unit tests for theme helpers.

### Changed

- Body background and text now use design tokens (`bg-background`, `text-foreground`).

### Notes

- Theme preference persists through the existing settings storage and follows the system preference when set to `system`.

## [0.4.0] - Phase A Foundation Remediation

### Added

- Key-bound storage schemas through `StoredDataMap` and `StorageSchemaMap`.
- Per-key schema versions with `SCHEMA_VERSIONS` and `getSchemaVersion`.
- `DestructiveStorageOptions`, `QuarantineRecord`, and the `confirmation-required` and `recovery-not-required` error codes.
- Quarantine enumeration, deduplication, safe domain recovery, and full data reset.
- Shared UTC ISO datetime helpers in `src/lib/datetime.ts`.
- Refreshable storage status store and `useStorageStatus` hook.
- Storage, migration, status, datetime, and toast tests.

### Changed

- `readStorage` and `writeStorage` now derive their schema from the storage key instead of accepting a caller-supplied schema.
- `removeStorage`, `recoverStorage`, and `resetAllStorage` require explicit confirmation.
- Corrupted data is quarantined before recovery removes the original; newer-version data is never deleted.
- Error toasts persist until dismissed, while info and success toasts auto-dismiss after five seconds.
- Toasts pause on hover or focus and announce through persistent polite and assertive live regions.
- `StorageStatusBanner` uses an external store to avoid hydration mismatches and stale snapshots.
- Added `brand-700` and `brand-400` tokens, fixed verified contrast issues, and added pointer cursors for enabled controls.
- Renamed `vitest.config.ts` to `vitest.config.mts` to remove the module-format warning.
- Bumped the package version to `0.4.0`.

### Notes

- The migration registry remains empty until a domain advances to schema version `2`.

## [0.3.0] - Phase 1.2 Core Infrastructure

### Added

- Core domain type skeletons and typed persisted-data structures.
- Per-domain LocalStorage keys with versioned `{ version, data }` envelopes.
- Zod validation schemas for storage envelopes and persisted structures.
- Centralized storage client with SSR guards, availability detection, and typed results.
- Corrupted-data quarantine under `calo:corrupt:<key>:<timestamp>` without deleting the original value.
- Schema version `1` with an in-memory migration foundation and read-only protection for newer versions.
- Read-only degraded mode banner when LocalStorage is unavailable.
- Lightweight custom toast provider and hook.
- App Router error boundary and global error fallback with user-safe messages.
- Vitest and jsdom configuration with storage, migration, and schema tests.

### Changed

- Added `test` and `test:watch` scripts.
- Bumped the package version to `0.3.0`.

### Notes

- The migration registry is intentionally empty until a second schema version exists.
- Feature-specific entity fields remain deferred to their implementation phases.

## [0.2.0] - Foundation & Navigation Setup

### Added

- `src/` application structure with `components/ui`, `components/common`, `lib`, `types`, `data`, and `hooks`.
- shadcn/ui configuration through `components.json`.
- `cn()` class-name helper in `src/lib/utils.ts`.
- Shared `AppShell`, `Navigation`, and `PagePlaceholder` components.
- Placeholder routes for onboarding, diary, catalog, collection, analytics, and settings.
- Responsive navigation: desktop sidebar, mobile bottom bar with 44px+ touch targets, and active route highlighting via `usePathname()`.
- Typography and brand design tokens: Plus Jakarta Sans, `--color-brand-600`, `--color-brand-500`, and `--color-accent-500`.
- Production dependencies: `lucide-react`, `recharts`, `clsx`, `tailwind-merge`, `class-variance-authority`, and `zod`.
- Development dependencies for testing: `vitest@4`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, and `jsdom`.

### Changed

- Moved the App Router directory from `app/` to `src/app/`.
- Updated the `@/*` path alias to `./src/*`.
- Renamed the package from `calo-temp` to `calo`.
- Updated root metadata, `lang="id"`, and base background/text classes.
- Updated the README path reference to `src/app/page.tsx`.
- Expanded ESLint ignores to exclude installed agent skill directories.

### Notes

- Vitest and DOM testing dependencies are installed but not configured yet. No test script or setup file exists.
- Light/dark theme switching, tablet-specific navigation, and base UI primitives remain open tasks.

---

## Versioning

CALO uses Semantic Versioning:

- MAJOR: Incompatible or major product changes.
- MINOR: New features or significant improvements.
- PATCH: Bug fixes and small improvements.

**End of Changelog**