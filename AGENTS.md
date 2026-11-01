# CALO — AI Agent Instructions

This file contains the mandatory instructions for AI coding agents working on CALO.

All agents must follow these rules before inspecting, planning, or modifying the codebase.

---

## 1. Project Context

CALO is a minimalist nutrition and calorie-tracking web application.

The application helps users:

- Track daily food intake.
- Monitor calories and macronutrients.
- Manage personalized nutrition targets.
- Review food history.
- Track body weight.
- Analyze nutrition trends.

CALO is a public, multi-user web application.

- Authenticated users are stored in Supabase (PostgreSQL) with Row Level Security (RLS).
- Authentication uses email/password and Google OAuth.
- LocalStorage is a supporting mechanism for local preferences, temporary drafts, caching, and pre-authentication data.
- There is no backend beyond Supabase and no external nutrition API in the MVP.

---

## 2. Mandatory Documentation

Before starting any development task, read:

1. [`PRODUCT.md`](http://PRODUCT.md)
2. [`PRD.md`](http://PRD.md)
3. `TECH_[STACK.md](http://STACK.md)`
4. [`DESIGN.md`](http://DESIGN.md)
5. [`TASKS.md`](http://TASKS.md)

Read [`CHANGELOG.md`](http://CHANGELOG.md) when updating or reviewing project history.

These documents are the primary source of truth.

If instructions conflict:

- Follow approved product requirements.
- Do not silently change technical or design decisions.
- Ask the user when a decision is unclear or requires approval.

---

## 3. Development Philosophy

Work incrementally and prioritize quality over speed.

Mandatory principles:

- Implement one logical task at a time.
- Prefer simple, maintainable solutions.
- Avoid unnecessary abstractions.
- Avoid premature optimization.
- Avoid unnecessary dependencies.
- Reuse existing components and utilities.
- Keep code readable and organized.
- Do not introduce features outside the approved MVP scope.
- Do not replace working implementations without a clear reason.

Do not attempt to generate the entire application in one operation.

---

## 4. Workflow Before Coding

For every new task:

1. Read the relevant documentation.
2. Inspect the existing project structure.
3. Identify related files and components.
4. Understand existing implementation before editing.
5. Identify dependencies and potential side effects.
6. Propose a short implementation plan.
7. Wait for user approval if the task is substantial or changes architecture.
8. Implement only the agreed scope.

Do not assume files, packages, components, or features exist without checking.

---

## 5. Coding Standards

### TypeScript

- Use TypeScript for application code.
- Prefer explicit and accurate types.
- Avoid `any` unless absolutely necessary.
- Keep domain types separate from UI components.
- Handle nullable and optional values safely.

### React and Next.js

- Follow Next.js App Router conventions.
- Use Server Components by default where appropriate.
- Use Client Components only when browser APIs or interactivity require them.
- Keep components focused on a clear responsibility.
- Avoid unnecessary client-side state.
- Use semantic HTML.

### Styling

- Use Tailwind CSS.
- Follow the approved design tokens.
- Use reusable components for repeated patterns.
- Avoid excessive arbitrary CSS values.
- Maintain consistent spacing, typography, and colors.
- Ensure responsive behavior.

### Components

- Build reusable components when there is a real reuse case.
- Keep business logic out of presentation components when practical.
- Use clear and descriptive component names.
- Avoid giant components containing unrelated functionality.

### Naming

- Components: PascalCase.
- Functions and variables: camelCase.
- Constants: descriptive names.
- Files: follow the existing project convention.
- Use meaningful names rather than unclear abbreviations.

---

## 6. Product Rules

The following rules are mandatory:

- Food logging must support Breakfast, Lunch, Dinner, and Snack.
- Multiple meal sessions can exist within one category per day.
- Meal Cart drafts must persist locally.
- Saving a meal requires explicit user confirmation.
- Historical logging dates must be selected through Food Diary.
- Food quantities and nutrition calculations must support decimal precision.
- Nutrition data must use reliable source references.
- Custom foods require all eight nutritional values.
- Days without food logs must not be treated as zero-calorie days.
- Historical food logs must remain unchanged when profile targets are edited.
- User data must remain under the user's control, whether stored locally in the browser or in the user's own authenticated account storage.
- Importing data must require validation and user confirmation.
- Resetting all data requires two confirmation steps.

Refer to [PRD.md](http://PRD.md) for complete requirements.

---

## 7. Nutrition Calculation Rules

Nutrition calculations are important and must be handled carefully.

- Keep calculation logic separate from UI components.
- Preserve calculation precision internally.
- Round only when displaying values.
- Use consistent gram-based nutrition calculations.
- Add unit tests for calculation functions.
- Document calculation assumptions.

Do not invent or silently select:

- BMR formulas.
- TDEE activity multipliers.
- Calorie adjustment rates.
- Macronutrient allocation formulas.

These decisions require research, documentation, and user approval before implementation.

Do not present calculated targets as medical advice.

---

## 8. Local Data Management

LocalStorage is a supporting persistence mechanism for the MVP, not the primary long-term store for authenticated users.

- LocalStorage holds local preferences, temporary drafts, caching, and pre-authentication data.
- For authenticated users, Supabase PostgreSQL is the source of truth for user-generated data.

Requirements:

- Centralize LocalStorage access.
- Validate stored data before using it.
- Include schema versioning.
- Handle missing or corrupted data safely.
- Support future schema migration.
- Avoid accessing browser-only APIs during server rendering.
- Do not store unnecessary personal information.
- Preserve existing user data when updating unrelated features.

Never clear or overwrite application data without an explicit user action.

---

## 9. UI and UX Rules

Follow [DESIGN.md](http://DESIGN.md).

The application must:

- Use a Minimalist &amp; Clean visual direction.
- Maintain consistent blue and cyan brand accents.
- Support Light, Dark, and System themes.
- Support English and Bahasa Indonesia.
- Be responsive from 320px upward.
- Use desktop sidebar navigation.
- Use adaptive tablet navigation.
- Use mobile bottom navigation.
- Include meaningful empty states.
- Include skeleton loading where appropriate.
- Provide clear error feedback.
- Use accessible labels and keyboard interactions.
- Never communicate important status using color alone.

Avoid generic AI-generated UI patterns, unnecessary decoration, excessive gradients, and inconsistent styling.

---

## 10. Dependency Management

Do not install, remove, or upgrade dependencies without user approval.

Before proposing a new dependency:

1. Explain why it is needed.
2. Check whether existing dependencies can solve the problem.
3. Explain the impact on project complexity.
4. Wait for approval.

Do not modify package configuration unnecessarily.

---

## 11. Testing and Validation

After implementation, run relevant checks.

Depending on the task, use:

- ESLint.
- TypeScript typecheck.
- Unit tests.
- Integration tests.
- Production build.

Do not claim a test passed unless it was actually executed successfully.

If a command fails:

- Report the actual error.
- Explain the likely cause.
- Do not hide or ignore the failure.
- Do not claim completion until the issue is resolved or explicitly accepted.

---

## 12. Git Standards

Use Git for version control.

Follow Conventional Commits:

- `feat:` New functionality.
- `fix:` Bug fixes.
- `docs:` Documentation changes.
- `style:` Formatting or styling changes.
- `refactor:` Code restructuring.
- `test:` Test additions or modifications.
- `chore:` Maintenance tasks.

Do not commit automatically without user approval.

Do not rewrite Git history or force-push without explicit permission.

---

## 13. Documentation Maintenance

When implementation changes affect project decisions:

- Update relevant documentation.
- Update [TASKS.md](http://TASKS.md) when a task is completed.
- Update [CHANGELOG.md](http://CHANGELOG.md) for notable changes.
- Keep technical documentation consistent with the actual implementation.

Never mark incomplete tasks as completed.

---

## 14. Communication Rules

When interacting with the user:

- Explain technical concepts in clear, beginner-friendly language.
- Keep responses concise and practical.
- State what will be changed before substantial modifications.
- Identify files that will be created or modified.
- Explain important trade-offs.
- Report test results honestly.
- Ask only necessary clarification questions.
- Do not overwhelm the user with multiple unrelated tasks.

The user prefers a guided, step-by-step development process.

---

## 15. Security and Privacy

- Do not expose secrets or credentials.
- Never hardcode API keys or passwords.
- Do not introduce unnecessary tracking.
- Do not send local application data to external services without explicit user action; authenticated user data is sent only to the user's own Supabase account.
- Validate imported JSON data.
- Treat all imported data as untrusted.
- Avoid unsafe HTML rendering.
- Protect user data from accidental deletion.

---

## 16. Final Rule

The goal is to build CALO according to the approved product vision, not to maximize the amount of generated code.

When uncertain, inspect first, explain the uncertainty, and ask before making consequential decisions.

**End of [AGENTS.md](http://AGENTS.md)**

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
