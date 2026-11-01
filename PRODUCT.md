# CALO — Product Overview

**Product Name:** CALO  
**Document Version:** 1.0  
**Product Type:** Web Application  
**Status:** MVP Development Preparation

## 1. Product Vision

CALO is a simple, modern, and practical nutrition tracking application that helps users understand and manage their daily food intake.

The product focuses on making food logging, calorie tracking, and nutritional monitoring straightforward without unnecessary complexity.

CALO is designed to be a personal tracking tool, not a nutrition education platform.

## 2. Target Audience

CALO is intended for people interested in managing their nutrition and fitness goals, including:

- Beginners who want to start tracking calories.
- People who want to monitor daily food intake.
- Fitness enthusiasts who track macronutrients.
- People pursuing weight loss, weight maintenance, or muscle gain.

## 3. Core Value Proposition

CALO provides:

- Simple food logging.
- Indonesian and international food database.
- Calorie and macronutrient tracking.
- Personalized daily nutrition targets.
- Food diary and historical tracking.
- Nutrition and weight trend analytics.
- User data ownership through browser storage and personal account storage.

## 4. Product Principles

### Simplicity

Keep common actions easy to understand and complete.

### Accuracy

Use reliable nutritional references and consistent calculation methods.

### Transparency

Clearly communicate nutrition values, calculation results, and data limitations.

### User Control

Allow users to edit their profile, targets, food entries, and personal data.

### Privacy

Keep personal application data under the user's control, whether stored locally in the browser or in the user's own authenticated account storage.

### Consistency

Maintain consistent design patterns, terminology, and interactions.

## 5. MVP Scope

The first version focuses on:

1. Onboarding and profile management.
2. Nutrition target calculation.
3. Food catalog and search.
4. Custom food management.
5. Meal Cart and food logging.
6. Food Diary.
7. Nutrition Dashboard.
8. Favorite Foods and Saved Meals.
9. Analytics and Weight Tracking.
10. Settings and local data management.

Authenticated user accounts and personal data storage are part of the approved architecture. See [PRD.md](http://PRD.md) Section 3.2 and [TECH\_[STACK.md](http://STACK.md).

Refer to [PRD.md](http://PRD.md) for complete functional requirements.

## 6. Product Limitations

The MVP intentionally does not include:

- External nutrition API.
- AI food recognition.
- Barcode scanning.
- Water tracking.
- Meal reminders.
- Social features.
- Nutrition learning center.
- Weekly calorie targets.
- Customizable dashboard layouts.

User accounts and authenticated data storage are part of the approved architecture (Supabase). See [PRD.md](http://PRD.md) Section 3.2.

For local or unauthenticated usage, application data is stored in the browser. Clearing browser data may cause data loss if the user has not exported a backup.

## 7. Technology Direction

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Recharts
- Supabase (backend, PostgreSQL database, authentication, Row Level Security)
- LocalStorage (local preferences, temporary drafts, caching, pre-authentication data)
- Git and GitHub
- Vercel

Refer to TECH\_[STACK.md](http://STACK.md) for the technical architecture.

## 8. Brand Direction

CALO uses a Minimalist &amp; Clean visual direction.

Brand characteristics:

- Modern
- Minimal
- Clear
- Approachable
- Practical
- Fitness-oriented without looking overly technical

The visual identity uses an abstract geometric icon paired with a modern sans-serif wordmark.

Primary brand colors are blue and cyan, supported by neutral surfaces.

Refer to [DESIGN.md](http://DESIGN.md) for the complete visual direction.

## 9. Product Success Criteria

The MVP should allow users to:

- Complete onboarding.
- Set and manage nutrition targets.
- Find foods in the catalog.
- Create custom foods.
- Log meals with accurate nutritional calculations.
- Review historical food intake.
- Understand daily nutrition progress.
- Track weight changes.
- Export and restore application data.

## 10. Source of Truth

When making product decisions, follow this documentation hierarchy:

1. [PRD.md](http://PRD.md) — approved product requirements.
2. TECH\_[STACK.md](http://STACK.md) — approved technical direction.
3. [DESIGN.md](http://DESIGN.md) — approved design direction.
4. [TASKS.md](http://TASKS.md) — development roadmap.
5. [PRODUCT.md](http://PRODUCT.md) — product overview.

If implementation conflicts with approved requirements, stop and request clarification rather than silently changing the product.

**End of PRODUCT v1.0**