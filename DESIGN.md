# CALO — Design System &amp; UI Guidelines

**Document Version:** 1.0  
**Status:** Approved v1.0

---

## 1. Design Vision

CALO uses a Minimalist &amp; Clean visual direction.

The interface should feel:

- Modern.
- Clean.
- Calm.
- Professional.
- Approachable.
- Data-focused.
- Easy to navigate.

The design should prioritize readability, usability, and nutritional information.

Avoid unnecessary decoration and visual complexity.

## 2. Brand Identity

**Brand Name:** CALO  
**Product:** Nutrition &amp; Food Tracking Web Application

### Logo

Logo composition:

- Abstract geometric symbol.
- CALO wordmark.
- Modern sans-serif typography.

The symbol should be distinctive and recognizable at small sizes.

Avoid literal food illustrations, forks, spoons, weighing scales, or generic health symbols.

### Brand Personality

CALO should communicate:

- Clarity.
- Consistency.
- Simplicity.
- Reliability.
- Progress.

## 3. Visual Direction

### Core Principles

1. Use generous whitespace.
2. Maintain clear visual hierarchy.
3. Prefer simple surfaces and subtle borders.
4. Use consistent spacing.
5. Keep information easy to scan.
6. Use typography to establish hierarchy.
7. Avoid unnecessary gradients and glow effects.
8. Avoid excessive rounded cards.
9. Avoid decorative elements that do not improve usability.

The interface should feel like a polished modern productivity application rather than a generic fitness dashboard template.

## 4. Color System

### Primary Color

Blue / Cyan.

Use the primary color for:

- Primary buttons.
- Active navigation.
- Links.
- Selected states.
- Important interactive elements.

### Neutral Colors

Use neutral colors for:

- Page backgrounds.
- Cards.
- Borders.
- Dividers.
- Secondary text.
- Disabled elements.

### Nutrition Status Colors

Define semantic colors for:

- Under Target.
- On Target.
- Over Target.

Status colors must be consistent across Dashboard, Food Diary, and Analytics.

Never communicate status through color alone. Include labels, numbers, or icons where appropriate.

### Theme Support

Support:

- Light Mode.
- Dark Mode.
- System Default.

Use centralized design tokens or CSS variables.

Avoid hardcoding colors inside individual components.

Ensure sufficient contrast in both themes.

## 5. Typography

Use a modern, highly readable sans-serif typeface.

Typography should have a clear hierarchy:

- Display: Major page headings and important numeric summaries.
- Heading: Section titles.
- Body: Main interface content.
- Label: Form labels and metadata.
- Caption: Supporting information.

### Typography Rules

- Use consistent font weights.
- Avoid excessive font size variations.
- Keep body text readable.
- Use tabular numbers for nutrition values where appropriate.
- Maintain consistent line heights.
- Avoid overly decorative typography.

## 6. Spacing &amp; Layout

Use a consistent spacing scale based on multiples of 4px.

Maintain:

- Consistent page padding.
- Clear separation between sections.
- Balanced card spacing.
- Predictable alignment.
- Responsive content widths.

Avoid overcrowded layouts.

## 7. Border Radius &amp; Elevation

Use moderate and consistent border radii.

Guidelines:

- Small radius for inputs and compact controls.
- Medium radius for cards and panels.
- Larger radius only when it improves the visual hierarchy.

Prefer subtle borders over heavy shadows.

Avoid excessive floating-card effects.

## 8. Navigation

### Desktop

Use a left sidebar.

Requirements:

- CALO branding.
- Navigation icons and labels.
- Clear active navigation state.
- Settings access.
- Consistent spacing.

### Tablet

Adapt sidebar width and content spacing to available screen space.

### Mobile

Use bottom navigation.

Requirements:

- Easy thumb access.
- Clear active states.
- Readable icons and labels.
- Avoid overcrowding.
- Ensure content is not obscured by navigation.

## 9. Dashboard Design

Dashboard is the main nutrition overview.

### Layout Priority

1. Page heading and date.
2. Daily calorie summary.
3. Circular calorie progress.
4. Macronutrient progress.
5. Meal summary.
6. Additional relevant statistics.

### Calorie Card

Display:

- Calories Consumed.
- Daily Target.
- Remaining Calories.
- Circular progress indicator.

Use prominent but readable numerical typography.

### Macronutrient Cards

Display:

- Protein.
- Carbohydrates.
- Fat.

Use horizontal progress bars.

Maintain consistent visual treatment across all macronutrients.

### Meal Summary

Group entries by:

- Breakfast.
- Lunch.
- Dinner.
- Snack.

Allow expandable food details.

Keep meal summaries compact and scannable.

## 10. Food Catalog Design

### Layout

Support:

- Grid View.
- List View.

Default: Grid View.

Remember the user's last selected view.

### Food Cards

Display relevant information:

- Food name.
- Calories.
- Category or supporting information.
- Quick Add action.

Avoid excessive information on cards.

### Search

Search should be easy to find and accessible.

Support:

- Search input.
- Recent searches.
- Relevant recommendations.
- Clear search state.

### Food Detail

Use a Nutrition First layout.

Prioritize:

1. Food name.
2. Calories.
3. Macronutrients.
4. Extended nutritional information.
5. Gram quantity input.
6. Add to Cart action.
7. Nutrition source reference.

## 11. Meal Cart Design

Use a side drawer on desktop.

Adapt the interface for mobile.

Display:

- Selected food items.
- Gram quantities.
- Individual calorie values.
- Edit and remove actions.
- Total nutrition summary.
- Calculate action.
- Confirm Save action.

Make the distinction between draft and saved food entries clear.

Avoid accidental saving.

## 12. Food Diary Design

Use a monthly calendar.

Calendar requirements:

- Clear month navigation.
- Selected date state.
- Indicators for dates containing food logs.
- Clear distinction between logged and unlogged dates.

Meal entries should be grouped by meal category.

Multiple sessions must be visually distinguishable.

Provide clear actions for editing, duplicating, and deleting entries.

## 13. My Collection Design

Separate the page into:

- Favorite Foods.
- Saved Meals.

Use tabs or another simple, intuitive layout.

Keep search accessible.

Each item should provide relevant management actions without visual clutter.

## 14. Analytics Design

Analytics should prioritize clear data visualization.

Use Recharts for:

- Calorie trends.
- Macronutrient trends.
- Weight history.

Requirements:

- Clear chart titles.
- Visible units.
- Readable axis labels.
- Consistent chart spacing.
- Responsive containers.
- Empty states when insufficient data exists.

Avoid excessive chart decoration.

Charts must communicate useful information rather than merely fill space.

## 15. Settings Design

Organize settings into four sections:

1. Profile &amp; Goals.
2. Appearance.
3. Language.
4. Data Management.

Use clear section headings and descriptive labels.

Destructive actions must be visually distinguished and require confirmation.

## 16. Interaction Patterns

Use consistent interaction behavior throughout CALO.

### Buttons

Define clear visual styles for:

- Primary.
- Secondary.
- Destructive.
- Ghost or tertiary actions.

### Forms

Requirements:

- Visible labels.
- Helpful placeholders.
- Clear validation messages.
- Visible focus states.
- Consistent input heights.

### Dialogs &amp; Drawers

Use for:

- Confirmation.
- Quick Add.
- Meal Cart.
- Important editing flows.

Ensure keyboard and mobile usability.

### Toast Notifications

Use concise messages for:

- Successful saves.
- Updates.
- Deletions.
- Export completion.
- Errors.

Do not rely exclusively on temporary toast messages for critical information.

## 17. Loading, Empty &amp; Error States

### Loading

Use skeleton loading where appropriate.

### Empty

Display:

- Simple visual illustration or icon.
- Short explanation.
- Relevant call to action.

### Error

Display clear and actionable messages.

Avoid exposing raw technical errors.

## 18. Responsive Design

Support viewport widths starting at 320px.

### Desktop

- Sidebar navigation.
- Multi-column dashboard layouts where appropriate.
- Comfortable content width.

### Tablet

- Adaptive navigation.
- Flexible grids.
- Balanced spacing.

### Mobile

- Bottom navigation.
- Single-column content where appropriate.
- Touch-friendly controls.
- Readable nutrition information.
- Responsive drawers and dialogs.

Never solve mobile layout issues by simply shrinking desktop components.

## 19. Accessibility

Follow accessible interface practices.

Requirements:

- Keyboard navigation.
- Visible focus indicators.
- Proper semantic HTML.
- Accessible form labels.
- Sufficient color contrast.
- Screen reader-friendly controls.
- Accessible chart summaries.
- Do not rely on color alone to convey information.
- Respect reduced-motion preferences.

## 20. Design Consistency Rules

All new components must:

1. Follow this design system.
2. Reuse existing design tokens.
3. Reuse existing components where appropriate.
4. Maintain consistent spacing and typography.
5. Support light and dark themes.
6. Remain responsive.
7. Meet accessibility requirements.

Do not create a new visual style for individual pages without a clear reason.

## 21. Anti-Generic UI Rules

Avoid:

- Excessive gradients.
- Neon glow effects.
- Unnecessary glassmorphism.
- Random decorative circles.
- Excessive pill-shaped containers.
- Repeated identical cards without hierarchy.
- Oversized empty hero sections.
- Generic AI-generated dashboard layouts.
- Unnecessary animations.
- Decorative charts without meaningful data.

Prefer purposeful layouts with strong hierarchy and thoughtful details.

## 22. Design Decision Rule

This document is the visual source of truth for CALO.

If a proposed design conflicts with these guidelines, prioritize this document unless a design change is explicitly approved.

**End of DESIGN v1.0**