# CALO — Product Requirements Document (PRD)

**Product:** CALO  
**Product Type:** Nutrition &amp; Food Tracking Web Application  
**Document Version:** 1.0  
**Status:** Approved v1.0

---

## 1. Product Overview

### 1.1 About CALO

CALO is a nutrition and food tracking web application designed to help users monitor their daily calorie intake, macronutrients, and overall nutritional consumption.

CALO provides a structured food logging experience with a built-in food database, custom food creation, daily nutrition tracking, and nutritional analytics.

The application focuses on simplicity, accuracy, and usability.

It supports local-first usage and authenticated multi-user accounts.

### 1.2 Product Vision

To provide a simple, accessible, and reliable platform that helps people understand and track their daily nutritional intake.

### 1.3 Target Audience

General Health &amp; Fitness.

CALO targets:

- Fitness beginners.
- People maintaining a healthy eating routine.
- Gym and fitness enthusiasts.
- People pursuing weight loss, maintenance, or muscle gain.
- General users interested in monitoring their nutrition.

### 1.4 Product Positioning

CALO is a nutrition tracking tool, not a nutrition education platform.

The primary focus is food logging, calorie calculation, nutritional monitoring, and progress tracking.

---

## 2. Product Principles

1. **Simplicity:** Keep the interface clean and easy to understand.
2. **Accuracy:** Maintain reliable nutritional calculations and food references.
3. **Transparency:** Display nutritional information and estimation methods clearly.
4. **Privacy:** Keep personal information under user control, whether stored locally in the browser or in the user's own authenticated account storage.
5. **Consistency:** Maintain consistent navigation, components, and interaction patterns.
6. **Accessibility:** Support keyboard navigation, readable contrast, and accessible controls.

---

## 3. Platform &amp; Scope

### 3.1 Platform

- Responsive web application.
- Desktop, tablet, and mobile support.
- Minimum supported viewport width: 320px.
- Modern Chrome, Edge, Firefox, and Safari.
- Online-only application.
- No native mobile application in MVP.

### 3.2 Account &amp; Authentication

CALO is a public, multi-user web application.

Approved architecture:

- Email/password authentication.
- Google OAuth authentication.
- Backend: Supabase.
- Database: PostgreSQL.
- Row Level Security (RLS).
- Deployment: Vercel.

Requirements:

- Authenticated user data is stored in the user's own Supabase account.
- Browser LocalStorage is a supporting store for local preferences, temporary drafts, caching, and pre-authentication data.
- LocalStorage is not the primary long-term store for authenticated user data.
- Local-first usage may be supported for users who do not authenticate; their data remains in browser LocalStorage.

Users must be informed that clearing browser data may permanently remove their CALO data unless they have exported a backup.

### 3.3 MVP Exclusions

The following features are outside the MVP scope:

- AI food image recognition.
- Barcode scanning.
- External nutrition API integration.
- Multi-device synchronization.
- Social features.
- Meal reminders.
- Water tracking.
- Nutrition learning center.
- Weekly calorie targets.
- Customizable dashboard layouts.

---

## 4. Application Navigation

CALO uses hybrid navigation.

**Desktop:** Left sidebar.

**Tablet:** Adaptive sidebar navigation.

**Mobile:** Bottom navigation.

### Main Navigation

1. Dashboard
2. Food Diary
3. Food Catalog
4. My Collection
5. Analytics
6. Settings

Weight Tracking is included within Analytics.

### Application Entry

Users enter the application directly.

- First-time users are redirected to onboarding.
- Returning users with an existing profile enter the Dashboard.
- No marketing landing page is required.

---

## 5. Onboarding &amp; User Profile

### 5.1 Onboarding Flow

First-time users must complete a multi-step onboarding wizard.

The wizard includes:

- Progress indicator.
- Back and Next navigation.
- Input validation.
- Review of calculated nutrition targets.

### 5.2 Required Profile Information

- Age.
- Biological sex.
- Height.
- Current weight.
- Activity level.
- Workout frequency.
- Fitness goal.
- Target weight.
- Desired rate of weight change.
- Macronutrient preferences.

### 5.3 Fitness Goals

Supported goals:

- Weight Loss.
- Maintenance.
- Muscle Gain.

### 5.4 Nutrition Target Calculation

CALO estimates daily nutrition targets based on the user's profile and fitness goal.

Requirements:

- Automatically calculate recommended calorie targets.
- Estimate macronutrient targets.
- Allow users to review and edit calculated targets.
- Allow manual target adjustments.
- Recalculate recommendations when relevant profile information changes.
- Preserve historical food logs when targets are updated.

Calculated targets are estimates, not medical advice.

The exact calculation formulas and macro allocation rules will be specified in the technical documentation.

---

## 6. Dashboard

### 6.1 Overview

Dashboard provides a detailed daily nutrition overview.

### 6.2 Nutrition Summary

Display:

- Calories Consumed.
- Daily Calorie Target.
- Remaining Calories.
- Protein.
- Carbohydrates.
- Fat.

### 6.3 Visualization

- Large circular calorie progress indicator.
- Horizontal progress bars for protein, carbohydrates, and fat.
- Status labels: Under Target, On Target, and Over Target.

### 6.4 Status Behavior

When users exceed their daily target:

- Progress visualization changes to a warning color.
- Display the exceeded amount.
- Show the Over Target status.
- Do not display judgmental messages.

Status must remain understandable without relying on color alone.

### 6.5 Nutrition Display Precision

Adaptive precision:

- Dashboard summaries use whole numbers.
- Food details may display one decimal place.
- Internal calculations retain sufficient precision to avoid repeated rounding errors.

### 6.6 Food Summary

Display foods grouped by:

- Breakfast.
- Lunch.
- Dinner.
- Snack.

Each group displays:

- Food entries.
- Logging time.
- Calories.
- Meal category total.

Multiple sessions under the same meal category must remain distinguishable.

Food entries support expandable nutritional details.

### 6.7 Food Logging Access

Dashboard provides:

- `Add Food` button to access Food Catalog.
- Quick Add functionality through a modal.

---

## 7. Food Catalog

### 7.1 Overview

Food Catalog is the primary built-in food database.

Initial target: 200–500 food entries.

The database contains Indonesian and international foods, with an emphasis on cooked or ready-to-eat foods.

Different cooking methods may be represented as separate food entries.

### 7.2 Food Categories

Hybrid category structure.

Main categories include:

- Rice &amp; Grains.
- Meat.
- Seafood.
- Vegetables.
- Fruits.
- Dairy.
- Beverages.
- Snacks.
- Others.

Relevant categories may contain subcategories.

### 7.3 Food Information

Each built-in food entry must include:

- Food name.
- Category.
- Calories.
- Protein.
- Fat.
- Carbohydrates.
- Fiber.
- Sugar.
- Saturated Fat.
- Sodium.
- Nutrition source reference.

Every built-in food entry must have a documented nutritional source.

### 7.4 Search

Smart Search supports:

- Food names.
- Synonyms.
- Alternative spellings.
- Indonesian and English search terms.

Search results are ranked using:

1. Name and synonym relevance.
2. Food relevance.
3. Usage popularity.

### 7.5 Search History

- Store recent searches.
- Display recent searches.
- Provide usage-based recommendations.

### 7.6 Catalog Layout

Two display modes:

- Grid View.
- List View.

Default view: Grid.

Remember the last selected view using LocalStorage.

### 7.7 Food Detail

Nutrition First layout.

Display:

- Food name.
- Calories.
- All nutritional values.
- Gram-based quantity input.
- Nutrition source reference.

### 7.8 Portion Input

- Gram input only in Food Detail.
- Decimal values supported.
- Nutritional values calculated proportionally.
- Quick Add uses the default gram quantity.
- Common food units can be converted into gram equivalents where supported.

### 7.9 Adding Foods

Two methods:

- Quick Add directly from a food card.
- Open Food Detail, customize quantity, and add to cart.

---

## 8. Meal Cart

### 8.1 Overview

Meal Cart temporarily holds food entries before they are saved to Food Diary.

### 8.2 Interface

- Side drawer on desktop.
- Adapted panel on mobile.

### 8.3 Features

Users can:

- Add foods.
- Edit quantities.
- Remove foods.
- Calculate nutritional totals.
- Review the result.
- Confirm saving to Food Diary.

### 8.4 Meal Categories

Supported categories:

- Breakfast.
- Lunch.
- Dinner.
- Snack.

CALO automatically suggests a category based on the device's local time.

Users can change the suggested category.

### 8.5 Date Handling

Default date: Today.

To log food for a previous date, users must first select that date through Food Diary.

### 8.6 Meal Sessions

- One meal category per day.
- Multiple sessions per meal category are allowed.
- Each session contains its own food entries.
- Session timestamps are automatically generated using device local time.
- Manual time editing is not supported in MVP.

### 8.7 Draft Persistence

Meal Cart automatically saves drafts to LocalStorage.

Unconfirmed entries must not be treated as saved Food Diary records.

Users must explicitly confirm saving after calculation.

---

## 9. Food Diary

### 9.1 Overview

Food Diary displays historical food consumption.

### 9.2 Navigation

Use a monthly calendar.

Requirements:

- Navigate between months.
- Select a specific date.
- Visually indicate dates with recorded data.
- Clearly distinguish dates without entries.

### 9.3 Empty Dates

Dates without records must display:

`No Data` / `Not Logged`

Never interpret missing records as zero calorie consumption.

### 9.4 Meal Organization

Display:

- Breakfast.
- Lunch.
- Dinner.
- Snack.

Each category supports multiple sessions.

### 9.5 Editing

Users can:

- Edit individual foods.
- Delete individual foods.
- Duplicate foods.
- Edit sessions.
- Delete sessions.
- Duplicate sessions.
- Copy meals from previous dates.

### 9.6 Confirmation

Deleting food entries or sessions requires confirmation.

---

## 10. My Collection

### 10.1 Overview

My Collection combines:

- Favorite Foods.
- Saved Meals.

### 10.2 Favorite Foods

Users can:

- Add and remove favorites.
- Edit custom food entries.
- Delete entries.
- Duplicate entries.
- Add favorite foods directly to Meal Cart.

### 10.3 Saved Meals

Saved Meals store combinations of food entries and their respective gram quantities.

Users can:

- Save a meal combination.
- Search saved meals.
- Edit saved meals.
- Delete saved meals.
- Duplicate saved meals.
- Load saved meals into Meal Cart.

Saved Meals use one ungrouped list with search.

---

## 11. Custom Foods

### 11.1 Overview

Users can create their own food entries.

### 11.2 Required Information

All eight nutritional fields are mandatory:

1. Calories.
2. Protein.
3. Fat.
4. Carbohydrates.
5. Fiber.
6. Sugar.
7. Saturated Fat.
8. Sodium.

Additional information:

- Food name.
- Category.

### 11.3 Validation

CALO must implement:

- Required field validation.
- Numeric validation.
- Non-negative value validation.
- Calorie consistency checks using the 4-4-9 principle.
- Warnings for implausible nutritional values.

Users may override warnings after confirmation.

Users can edit, delete, and duplicate custom foods.

---

## 12. Analytics

### 12.1 Overview

Analytics provides historical nutrition insights and weight tracking.

### 12.2 Default Period

Default: Last 7 days.

Alternative: Last 30 days.

### 12.3 Nutrition Analytics

Display:

- Average daily calories.
- Average macronutrients.
- Calorie consumption charts.
- Macronutrient trends.
- Summary trends.

Days without food logs must be excluded from averages, not treated as zero.

### 12.4 Weight Tracking

Users can:

- Enter body weight in kilograms.
- Use decimal values.
- Select a historical date.
- View weight history.
- View weight trend graphs.
- Edit or delete weight entries.

Weight Tracking is a section within Analytics, not a separate navigation item.

---

## 13. Settings

Settings contains four main sections.

### 13.1 Profile &amp; Goals

- View and edit profile.
- Update fitness goals.
- Update target weight.
- Update nutrition targets.

### 13.2 Appearance

Supported modes:

- Light.
- Dark.
- System Default.

Save preference in LocalStorage.

### 13.3 Language

Supported languages:

- English.
- Bahasa Indonesia.

All interface labels must support translation.

Save language preference in LocalStorage.

### 13.4 Data Management

Provide:

- Export JSON.
- Import JSON.
- Reset All Data.

#### Export

Export all relevant application data in one JSON file.

#### Import

- Validate the imported file.
- Display a data summary.
- Require confirmation before replacing existing local data.

#### Reset

Reset All Data must require two confirmation steps.

---

## 14. Data Storage &amp; Privacy

### 14.1 Storage

Use browser LocalStorage as a supporting store for:

- Local preferences, including theme and language preferences.
- Temporary drafts.
- Caching.
- Pre-authentication data.

For authenticated users, Supabase PostgreSQL is the source of truth for user-generated data:

- User profile.
- Nutrition targets.
- Food Diary.
- Built-in and custom food references as needed.
- Favorite Foods.
- Saved Meals.
- Weight records.
- Meal Cart drafts.
- Recent searches.
- User settings.

### 14.2 Data Integrity

Implement:

- Data validation.
- Schema versioning.
- Safe data migrations.
- Defensive parsing.
- Error handling for corrupted or unavailable storage.

### 14.3 Privacy

- No external nutrition API.
- No automatic transmission of personal profile information to external services beyond the user's own Supabase account.
- Authenticated user data is stored in the user's own account storage.
- Local data is stored in the browser and remains under user control.

Users control their data through export, import, and reset functionality.

---

## 15. UI/UX &amp; Design Requirements

### 15.1 Visual Direction

Minimalist &amp; Clean.

Characteristics:

- Generous whitespace.
- Modern readable typography.
- Neutral backgrounds.
- Clear information hierarchy.
- Simple nutritional cards.
- Minimal decorative effects.
- Avoid excessive gradients and glow effects.

### 15.2 Brand Identity

Brand name: CALO.

Logo:

- Icon + Wordmark.
- Abstract geometric symbol.
- Modern sans-serif wordmark.

CALO is an independent brand name, not an acronym.

### 15.3 Color Direction

Primary color: Blue / Cyan.

Status colors must communicate:

- Under Target.
- On Target.
- Over Target.

### 15.4 Responsive Design

Support:

- Desktop sidebar.
- Adaptive tablet navigation.
- Mobile bottom navigation.

All major features must remain usable at 320px viewport width.

### 15.5 Loading &amp; Empty States

Use:

- Skeleton loading.
- Clear empty-state messages.
- Relevant calls to action.

### 15.6 Error Handling

Display clear, human-readable error messages.

Avoid exposing raw technical errors to users.

### 15.7 Accessibility

Requirements:

- Keyboard navigation.
- Sufficient color contrast.
- Proper input labels.
- Visible focus states.
- Screen reader support.
- Accessible status indicators.

### 15.8 Interaction Feedback

Important actions must provide toast notifications, including:

- Save.
- Update.
- Delete.
- Export.

---

## 16. Technical Quality Requirements

### 16.1 Technology Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide Icons.
- Recharts.
- npm.
- Supabase (PostgreSQL database and authentication).
- LocalStorage for local preferences and temporary data.
- Git and GitHub.
- Vercel.

### 16.2 Testing

Implement:

- Unit tests for nutrition calculations.
- Unit tests for target calculations.
- Integration tests for food logging.
- Tests for LocalStorage persistence and migration.
- Responsive and accessibility checks.

### 16.3 Browser Support

Support modern versions of:

- Chrome.
- Microsoft Edge.
- Firefox.
- Safari.

### 16.4 Development Workflow

- Use feature branches.
- Follow Conventional Commits.
- Run lint.
- Run typecheck.
- Run tests.
- Run production build before merging to main.

---

## 17. MVP Acceptance Criteria

CALO MVP is considered ready when:

1. First-time users can complete onboarding.
2. Nutrition targets can be calculated and edited.
3. Users can search the built-in food database.
4. Users can create custom foods.
5. Users can add food to Meal Cart.
6. Meal Cart supports draft persistence.
7. Users can calculate and confirm food entries.
8. Food Diary supports multiple sessions per meal category.
9. Users can edit, duplicate, and delete food entries.
10. Users can navigate historical dates.
11. Users can manage Favorite Foods and Saved Meals.
12. Dashboard displays daily calorie and macro progress.
13. Analytics displays 7-day and 30-day trends.
14. Weight Tracking works within Analytics.
15. Settings support profile, appearance, language, and data management.
16. JSON export and import work correctly.
17. Reset All Data works with confirmation.
18. Application is responsive across supported screen sizes.
19. LocalStorage data survives page refreshes.
20. Critical calculations and user flows pass automated tests.
21. Production build succeeds.
22. Application can be deployed to Vercel.

---

## 18. Future Considerations

Features that may be considered after MVP:

- Cross-device synchronization.
- Barcode scanning.
- AI-assisted food recognition.
- Nutrition API integration.
- Meal planning.
- Water tracking.
- Nutrition recommendations.

User authentication and personal account data storage are part of the approved architecture and are not future work. Authenticated user data is stored through the user's own Supabase account.

These features must not be implemented without explicit scope approval.

---

## 19. Product Development Rule

This PRD is the primary source of truth for CALO's product requirements.

Any implementation decision must:

1. Follow this document.
2. Respect the defined MVP scope.
3. Avoid adding unapproved features.
4. Preserve data integrity.
5. Prioritize maintainability and usability.

Changes to product requirements must be documented before implementation.

**End of PRD v1.0**