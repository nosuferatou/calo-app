# CALO — Phase 3E2 Manual Browser QA Report (Retrospective)

**Report type:** Retrospective reconstruction
**Scope:** Custom-food create/edit and Phase 3E2 authenticated cloud integration
**Overall result:** 18 / 18 PASS, 4 suites, no application code changes required

> **Evidence limitation — read first.**
> This file was recreated after the original `QA-REPORT-3E2.md` was found to be missing from the
> repository. It restates only the results that were previously reported to the project log
> (`CHANGELOG.md` and `TASKS.md` section 1.4.5). **Raw browser logs, console output, network traces,
> and screenshots from that session are not available and were not retained.** Per-test identifiers,
> exact timings, and the tester's environment fingerprints cannot be reproduced here. No new test
> results, counts, or observations have been invented in this document.

## 1. What was verified

The reported run covered four suites, all passing:

| # | Suite | Reported coverage | Result |
| --- | --- | --- | --- |
| 1 | Demo mode | Custom-food create, edit, persistence across a page refresh, appearance in catalog search, and quantity scaling in the Meal Cart | PASS |
| 2 | Validation | Required fields, decimal input, negative values, the 4-4-9 consistency warning, and the extreme-value confirmation step | PASS |
| 3 | Authenticated cloud mode | Owner-scoped persistence of custom foods and Row Level Security isolation between two local accounts | PASS |
| 4 | Responsive and localization | Layouts at 320 px, 390 px, and 1280 px desktop, in both English and Bahasa Indonesia | PASS |

Test count per suite was not retained; only the reported total of 18 tests across these four suites is recorded.

## 2. Session context that was reported

- Local development only, against the local Supabase instance with two synthetic accounts.
- No hosted Supabase project was linked, migrated, or accessed during the run.
- No CALO LocalStorage data was uploaded or migrated to cloud storage.
- The run required no application code changes; existing behavior was accepted as-is.

## 3. Related automated verification recorded for the same phase

Reported alongside the manual run in `CHANGELOG.md`: TypeScript typecheck, ESLint, the Vitest suite,
the production build, and the local pgTAP RLS suite all passed. The recorded test counts differ
between entries (200 automated tests at the isolation check, 215 at Phase 3E2 closeout), reflecting
tests added during the phase. Exact counts at the moment of the manual run were not retained.

## 4. Open items carried forward from this QA cycle

- Custom-food delete and duplicate remain unimplemented.
- Custom foods are not part of JSON backup export/import.
- The explicit, validated, conflict-aware LocalStorage-to-cloud migration flow is not implemented.
- Google OAuth is implemented behind a disabled-by-default flag and has not been configured or tested.
- Reviewed migrations have not been applied to the hosted Supabase project; that requires separate approval.

## 5. Reproducibility note

This summary is **not** reproducible evidence. To restore real evidence for Phase 3E2, re-run the
manual scenarios in a browser and capture artifacts (screenshots, console and network logs, and the
Supabase local session identifiers) at the time of execution. A future QA cycle should store its
report in this repository together with its raw artifacts.

**End of QA-REPORT-3E2 (retrospective)**
