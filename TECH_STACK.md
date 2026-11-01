# CALO — Technical Stack &amp; Architecture

**Document Version:** 1.0  
**Status:** Approved v1.0

## 1. Technology Stack


| Layer           | Technology           |
| --------------- | -------------------- |
| Framework       | Next.js App Router   |
| Language        | TypeScript           |
| Styling         | Tailwind CSS         |
| UI Components   | shadcn/ui            |
| Icons           | Lucide               |
| Charts          | Recharts             |
| Package Manager | npm                  |
| Auth            | Supabase Auth (email/password, Google OAuth) |
| Database        | PostgreSQL via Supabase |
| Storage         | Browser LocalStorage (local preferences, drafts, caching) / Supabase PostgreSQL (authenticated user data) |
| Version Control | Git + GitHub         |
| Deployment      | Vercel               |


Use stable, mutually compatible package versions during initial setup. Do not upgrade dependencies unnecessarily.

## 2. Application Architecture

CALO uses a client-focused architecture for its MVP.

- Next.js App Router provides routing and application structure.
- React components handle the interface.
- TypeScript provides type safety.
- Built-in food data is maintained as version-controlled static data.
- Supabase provides the backend, PostgreSQL database, and authentication (email/password and Google OAuth) with Row Level Security.
- LocalStorage stores local preferences, temporary drafts, caching, and pre-authentication data; authenticated user data is stored in Supabase PostgreSQL.
- No external nutrition API is required.

The application may use Next.js Server Components for static or non-interactive content, but components that access LocalStorage must run on the client.

## 3. Proposed Project Structure

```
calo-app/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── food-diary/
│   │   ├── food-catalog/
│   │   ├── my-collection/
│   │   ├── analytics/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── food/
│   │   ├── diary/
│   │   ├── analytics/
│   │   └── shared/
│   ├── features/
│   │   ├── onboarding/
│   │   ├── food-catalog/
│   │   ├── food-diary/
│   │   ├── meal-cart/
│   │   ├── collection/
│   │   ├── analytics/
│   │   └── settings/
│   ├── hooks/
│   ├── lib/
│   │   ├── calculations/
│   │   ├── storage/
│   │   ├── validation/
│   │   ├── i18n/
│   │   └── utils/
│   ├── data/
│   │   └── foods/
│   └── types/
├── docs/
├── tests/
├── AGENTS.md
├── DESIGN.md
├── PRODUCT.md
├── CHANGELOG.md
├── PRD.md
├── TECH_STACK.md
├── TASKS.md
├── package.json
└── README.md
```

This is a proposed structure. Create folders when their corresponding features are implemented. Avoid generating empty folders without a purpose.

## 4. Routing Strategy

Use Next.js App Router.

Proposed routes:


| Route            | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `/`              | Application entry and user redirection      |
| `/onboarding`    | First-time profile setup                    |
| `/dashboard`     | Daily nutrition overview                    |
| `/food-diary`    | Food logging history                        |
| `/food-catalog`  | Built-in and custom food catalog            |
| `/my-collection` | Favorites and saved meals                   |
| `/analytics`     | Nutrition analytics and weight tracking     |
| `/settings`      | Application preferences and data management |


Use a shared application layout for navigation and common interface elements.

## 5. Data Architecture

### 5.1 Storage Strategy

Use browser LocalStorage as a supporting store for local preferences, temporary drafts, caching, and pre-authentication data.

For authenticated users, Supabase PostgreSQL is the source of truth for user-generated data.

Requirements:

- Centralize storage access.
- Use typed data models.
- Validate stored data before use.
- Handle missing, invalid, and corrupted values.
- Implement schema versioning.
- Implement safe data migration.
- Avoid direct LocalStorage access during server-side rendering.

### 5.2 Data Categories

Store:

- User profile.
- Nutrition targets.
- Food diary entries.
- Meal sessions.
- Custom foods.
- Favorite foods.
- Saved meals.
- Weight records.
- Meal cart drafts.
- Recent searches.
- User settings.

### 5.3 Storage Key Convention

Use a consistent prefix:

```
calo:app
calo:profile
calo:targets
calo:food-diary
calo:custom-foods
calo:collections
calo:weight-records
calo:meal-cart-draft
calo:settings
calo:search-history
```

Each key stores a versioned envelope:

```json
{
  "version": 1,
  "data": {}
}
```

Each key owns its schema and its own schema version (`SCHEMA_VERSIONS`). A domain only needs a migration when its own version advances, so untouched domains never require migration work.

Older versions are migrated in memory when read; writes always use the current version. Data from a newer version is read-only and must never be overwritten or deleted.

Validation schemas are bound to keys through `StoredDataMap`, so callers cannot supply a mismatched schema and overwrite valid data.

Invalid values are copied to `calo:corrupt:<key>:<timestamp>` and left in their original key. Repeated reads reuse the existing quarantine copy instead of creating duplicates. Quarantine records can be listed, and corrupted data can be recovered only with explicit confirmation.

Destructive operations (`removeStorage`, `recoverStorage`, `resetAllStorage`) require `{ confirmed: true }`. `resetAllStorage` removes only CALO-owned keys and quarantine records; unrelated browser storage is left untouched.

### 5.4 Local-to-Cloud Migration Strategy

- Browser LocalStorage is the source for local preferences, temporary drafts, caching, and pre-authentication data.
- When a user authenticates, their user-generated data may be migrated into the user's own Supabase PostgreSQL records.
- Migration must be explicit, validated, and require user action; it must not overwrite newer server-side data.
- JSON export and import remain the supported backup and restore path.

See [SUPABASE_FOUNDATION.md](./SUPABASE_FOUNDATION.md) for the Phase 3A schema proposal, local-data mapping, RLS design, Next.js 16 Auth conventions, and migration plan.

## 6. Data Models

Use TypeScript interfaces or types for all major entities.

Initial entities:

- UserProfile
- NutritionTargets
- Food
- CustomFood
- MealSession
- FoodEntry
- MealCategory
- FavoriteFood
- SavedMeal
- WeightRecord
- MealCartDraft
- AppSettings

Requirements:

- Use stable IDs for user-created entities.
- Store timestamps in a consistent ISO 8601 format.
- Store food quantities in grams.
- Store weight in kilograms.
- Preserve decimal precision internally.
- Use explicit types for dates and nutritional values.

The exact schemas must be finalized before implementing the related features.

## 7. Nutrition Calculation Architecture

Place calculation logic in dedicated modules under:

`src/lib/calculations/`

Separate:

- Calorie calculations.
- Macronutrient calculations.
- Portion scaling.
- Daily nutrition summaries.
- BMR and TDEE estimation.
- Weight-related calculations.

Calculation functions should be pure wherever possible.

Do not mix calculation logic with UI components.

Implement automated unit tests for all critical formulas.

The exact formulas and assumptions must be documented and approved before implementation.

## 8. Food Database Architecture

Built-in food data must be maintained as static, version-controlled application data.

Requirements:

- Initial target of 200–500 entries.
- Indonesian and international foods.
- Focus on cooked and ready-to-eat foods.
- Support cooking-method-specific entries.
- Include all eight nutritional fields.
- Include a source reference for every built-in food.
- Use consistent gram-based nutritional values.
- Validate nutritional consistency.

Do not invent nutritional references or claim unsupported accuracy.

## 9. State Management

Use React state and custom hooks for application state.

Requirements:

- Keep state close to the components that need it.
- Use shared state only where necessary.
- Centralize persistent data operations.
- Avoid unnecessary global state libraries in MVP.
- Ensure UI updates correctly after storage changes.

Introduce a dedicated state-management library only if actual complexity justifies it.

## 10. Internationalization

Support:

- English.
- Bahasa Indonesia.

Requirements:

- Centralize translation dictionaries.
- Avoid hardcoding user-facing strings throughout components.
- Persist the selected language.
- Support consistent date, number, and unit formatting.
- Keep nutrition field names consistent across languages.

## 11. Theme Management

Support:

- Light Mode.
- Dark Mode.
- System Default.

Requirements:

- Use design tokens and theme variables.
- Persist user preference.
- Avoid hardcoded colors in reusable components.
- Prevent unnecessary theme flashing during initial load where practical.

## 12. UI Component Strategy

Use shadcn/ui as the foundation for reusable interface components.

Use Lucide for icons.

Create reusable components for:

- Buttons.
- Inputs.
- Dialogs.
- Drawers.
- Cards.
- Tabs.
- Dropdowns.
- Toast notifications.
- Progress indicators.
- Calendar.
- Data tables.

Customize components to follow CALO's [DESIGN.md](http://DESIGN.md).

Do not install additional UI libraries without a clear requirement.

## 13. Charts

Use Recharts for:

- Calorie trends.
- Macronutrient trends.
- Weight history.

Requirements:

- Responsive chart containers.
- Clear labels and units.
- Accessible information.
- Empty-state handling.
- Exclude days without food logs from nutritional averages.

## 14. Form Validation

Use centralized validation logic.

Requirements:

- Validate required fields.
- Validate numeric values.
- Reject negative nutritional values.
- Support decimal quantities.
- Provide clear error messages.
- Apply 4-4-9 calorie consistency warnings to food entries.

A validation library may be introduced if it materially simplifies complex forms. Do not add dependencies unnecessarily.

## 15. Testing Strategy

Use:

- Unit tests for calculation functions.
- Integration tests for food logging and storage workflows.
- Component tests where useful.
- End-to-end tests for critical user journeys.

Prioritize:

- Nutrition calculations.
- Target calculations.
- Meal Cart persistence.
- Food Diary operations.
- JSON import/export.
- LocalStorage migrations.

The testing framework must be selected and configured before implementing the corresponding test suite.

## 16. Performance &amp; Quality

Requirements:

- Keep components modular.
- Avoid unnecessary client-side rendering.
- Minimize unnecessary dependencies.
- Use optimized images and fonts.
- Avoid unnecessary recalculations.
- Maintain TypeScript type safety.
- Follow consistent naming conventions.

## 17. Security &amp; Privacy

- Never store secrets in client-side code.
- Do not collect unnecessary personal information.
- Validate imported JSON files.
- Handle LocalStorage errors safely.
- Avoid transmitting user profile data externally beyond the user's own Supabase account.
- Keep personal data under user control; authenticated data lives in the user's own Supabase account with Row Level Security.

## 18. Development Standards

- Use TypeScript strict mode.
- Use reusable components.
- Separate business logic from presentation.
- Keep functions focused and maintainable.
- Avoid `any` unless justified.
- Avoid duplicated logic.
- Follow accessible HTML semantics.
- Run lint, typecheck, tests, and production build before merging.

## 19. Technical Decision Rule

This document defines the approved technical direction for CALO MVP.

Do not introduce:

- Backend services beyond the approved Supabase backend.
- Cloud databases beyond the approved Supabase PostgreSQL.
- Authentication beyond the approved email/password and Google OAuth.
- External nutrition APIs.
- Unapproved frameworks.
- Unnecessary dependencies.

Any major architecture change must be proposed and approved before implementation.

**End of TECH_STACK v1.0**