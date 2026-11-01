# CALO — Nutrition Calculation Specification

**Status:** Approved (all 15 decisions)  
**Document Version:** 1.1  
**Date:** 2026-11-01  
**Implementation status:** Implemented in `src/lib/calculations/nutrition-targets.ts`, connected to onboarding and Settings, and covered by unit, storage-compatibility, and component tests.

Version 1.1 records approval of all 15 decisions, the calorie-guardrail clarification, and the implementation status.

This document defines the approved nutrition calculation rules for CALO Phase 2 (Onboarding & Nutrition Calculations). The user approved all recommended decisions in Section 13.

Calculated targets are estimates, not medical advice. CALO must present them as estimates and must not claim they are personalized medical recommendations.

---

## 1. Purpose

CALO estimates daily calorie and macronutrient targets from the user's profile and fitness goal.

The specification must make every calculation:

- Traceable to a reputable source.
- Reproducible from documented inputs.
- Understandable to the user.
- Safe at its boundaries.
- Easy to test with deterministic unit tests.

---

## 2. Scope and Non-Goals

### In scope

- Basal metabolic rate (BMR) estimation.
- Total daily energy expenditure (TDEE) estimation.
- Daily calorie targets for weight loss, maintenance, and muscle gain.
- Daily protein, carbohydrate, and fat targets.
- Manual target editing after calculation.
- Recalculation when profile information changes.

### Out of scope for the MVP

- Weekly calorie targets (explicitly excluded in PRD Section 3.3).
- Body-fat percentage, lean body mass, or body-composition measurement.
- Clinical nutrition, medical diagnosis, or treatment.
- Pregnancy and lactation targets.
- Pediatric and adolescent targets.
- Eating-disorder treatment or screening.
- Automatic target adjustment from observed weight change.
- Dynamic weight-change simulation such as the NIH Body Weight Planner.
- Fiber, sugar, saturated fat, and sodium targets. Those eight values are required for food data, not for the MVP target calculation.
- Ketogenic, very-low-carbohydrate, and other therapeutic diet prescriptions.

---

## 3. Inputs and Units

All persisted values use metric base units. Display units may be converted later in Settings without changing stored values.

| Input | Type | Unit | Accepted range | Role |
|---|---|---|---|---|
| Age | Integer | years | 18–80 for automatic calculation | BMR |
| Biological sex | Enum | female / male | Required for automatic calculation | BMR |
| Height | Number | cm | 100–250 | BMR |
| Current weight | Number | kg | 30–300 | BMR and protein target |
| Activity level | Enum | five levels | Required | TDEE (PAL) |
| Workout frequency | Integer | days/week | 0–7 | Suggests activity level only |
| Fitness goal | Enum | weight-loss / maintenance / muscle-gain | Required | Calorie adjustment |
| Target weight | Number | kg | 30–300 | Validation and goal direction |
| Desired rate | Number | kg/week | 0.25 / 0.5 / 0.75 for loss; 0.25 / 0.5 for gain; 0 for maintenance | Weight-loss deficit; gain goal display |
| Macro preference | Enum | balanced / higher-protein / custom | Required | Macro allocation |
| Custom macro split | Object | percent | Protein 10–35, fat 20–35, carbs 45–65, sum 100 | Custom macros only |

### Precision rules

- Age is stored as an integer number of years.
- Height is stored in centimetres, normally as an integer.
- Weight and target weight are stored in kilograms with up to one decimal place.
- Rate is stored in kilograms per week in 0.25 increments.
- All internal calculations use JavaScript numbers without intermediate rounding.
- Targets are persisted as integers (see Section 7.6).
- Timestamps use the shared UTC ISO helper `nowIso()` from `src/lib/datetime.ts`.

---

## 4. Basal Metabolic Rate (BMR)

### 4.1 Selected formula: Mifflin-St Jeor

The Mifflin-St Jeor equation is the recommended BMR formula.

**Men:**

```text
BMR = 10 × weightKg + 6.25 × heightCm − 5 × ageYears + 5
```

**Women:**

```text
BMR = 10 × weightKg + 6.25 × heightCm − 5 × ageYears − 161
```

The original published equation is:

```text
REE = 9.99 × weightKg + 6.25 × heightCm − 4.92 × ageYears + 166 × sex − 161
```

where `sex` is `1` for males and `0` for females. The simplified sex-specific equations above are published in the same paper and are equivalent for practical use.

**Source:** Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. *Am J Clin Nutr.* 1990;51(2):241–247. doi:10.1093/ajcn/51.2.241. PMID 2305711.

### 4.2 Why Mifflin-St Jeor

- It was derived from 498 healthy adults, including normal-weight and obese participants, aged 19–78.
- A systematic review of predictive equations found Mifflin-St Jeor the most reliable, predicting resting metabolic rate within 10% of measured values in more non-obese and obese adults than the other equations evaluated.
- The same review is a practical reason not to use the older Harris-Benedict equation; the original Mifflin paper also reports that Harris-Benedict overestimated measured resting expenditure by about 5%.

**Source:** Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. *J Am Diet Assoc.* 2005;105(5):775–789. doi:10.1016/j.jada.2005.02.005. PMID 15883556.

### 4.3 Alternatives considered and rejected for the MVP

| Formula | Why it is not the default |
|---|---|
| Harris-Benedict (1919, revised 1984) | Older equation; the Mifflin paper reports about 5% overestimation. Kept only as historical context. |
| Katch-McArdle | Requires body-fat percentage, which CALO does not collect in the MVP. |
| Cunningham | Requires lean body mass, which CALO does not collect in the MVP. |
| FAO/WHO/UNU Schofield equations | Designed for population-level estimates; Mifflin-St Jeor is better suited to individual adult estimates and is supported by the comparative review above. |

### 4.4 Sex and age limitations

- Mifflin-St Jeor has separate male and female constants. CALO will offer **Female** and **Male** for biological sex because the formula requires one of those inputs.
- If a user does not want to select either option, CALO must not guess. Automatic calculation is unavailable and the user must enter targets manually.
- The original validation was in adults aged 19–78. CALO may allow automatic calculation from 18 to 80 with a caution notice, but must require manual targets outside that range.
- The formula is not validated for pregnancy, lactation, children, adolescents, clinical populations, or athletes with extreme body composition. Those users must be directed to a qualified professional and offered manual targets.

---

## 5. Total Daily Energy Expenditure (TDEE)

### 5.1 Activity levels and PAL values

TDEE is estimated as:

```text
TDEE = BMR × PAL
```

`PAL` is the physical activity level, expressed as a multiple of BMR over 24 hours.

CALO uses five user-facing levels. Each PAL value sits inside a published FAO/WHO/UNU range; CALO does not invent a new PAL formula.

| CALO activity level | PAL | FAO/WHO/UNU category | User-facing description |
|---|---:|---|---|
| Sedentary | 1.40 | Sedentary or light activity (1.40–1.69) | Desk-based day, little intentional exercise, mostly sitting |
| Lightly active | 1.50 | Sedentary or light activity (1.40–1.69) | Some walking or light exercise 1–2 days per week |
| Moderately active | 1.70 | Active or moderately active (1.70–1.99) | Moderate exercise 3–4 days per week or an active job |
| Very active | 1.85 | Active or moderately active (1.70–1.99) | Hard exercise 5–6 days per week or a physically demanding job |
| Extra active | 2.00 | Vigorous or vigorously active (2.00–2.40) | Very hard training most days or heavy physical labour |

The FAO/WHO/UNU report states that PAL values sustainable over the long term range from about 1.40 to 2.40. It also notes that 1.21 is associated with short-term survival in totally inactive dependent people and is not a normal free-living level. CALO therefore does not use the common 1.2 "sedentary" multiplier.

**Source:** FAO/WHO/UNU. *Human Energy Requirements: Report of a Joint FAO/WHO/UNU Expert Consultation.* Rome, 2004. Chapter 5, Table 5.3. https://www.fao.org/4/y5686e/y5686e07.htm

### 5.2 Workout frequency

Workout frequency is collected because the PRD requires it, but it must **not** add invented "exercise calories" to TDEE. CALO does not collect exercise duration, intensity, or MET values, so an additive estimate would be fabricated.

Recommended behavior:

- Workout frequency suggests a default activity level during onboarding.
- The user can override the suggestion.
- TDEE uses the selected activity level only.
- The review screen explains that workout frequency helped choose the activity level and is not counted twice.

Suggested mapping:

| Workout days per week | Suggested activity level |
|---:|---|
| 0 | Sedentary |
| 1–2 | Lightly active |
| 3–4 | Moderately active |
| 5–6 | Very active |
| 7 | Extra active |

This mapping is a UX suggestion, not a scientific formula. It must be labelled as a suggestion.

---

## 6. Daily Calorie Target

### 6.1 Maintenance

```text
targetCalories = TDEE
```

### 6.2 Weight loss

```text
requestedDeficit = desiredRateKgPerWeek × 7700 ÷ 7
deficit = min(requestedDeficit, 750)
floor = female ? 1200 : 1500

if (TDEE <= floor) {
  targetCalories = TDEE
} else {
  targetCalories = max(TDEE − deficit, floor)
}
```

Rules:

- The 7700 kcal/kg value is a static approximation for adipose tissue. It is used only to translate a requested rate into a starting deficit.
- The deficit is capped at 750 kcal/day.
- The calorie floor is 1200 kcal/day for women and 1500 kcal/day for men.
- If TDEE is at or below the floor, CALO must not create a deficit. It must set the target to TDEE and explain that no deficit was applied.
- The actual deficit is `TDEE − targetCalories`. It may be smaller than requested because of the cap or floor.
- The selected rate options are 0.25, 0.5, and 0.75 kg/week. The CDC describes gradual, steady loss of about 1–2 pounds (roughly 0.45–0.9 kg) per week as more likely to be maintained.
- The 500–750 kcal/day deficit and the 1200–1500 / 1500–1800 kcal/day ranges come from the 2013 AHA/ACC/TOS obesity guideline. Those figures were written for weight-loss treatment in adults with overweight or obesity. CALO uses 750 kcal/day and the sex-specific calorie floors only as algorithmic guardrails, not as universal medically safe minimums or a clinical prescription. They do not guarantee safety.
- If the calorie floor reduces the requested deficit, the interface must state the actual, smaller deficit. If TDEE is at or below the floor, no deficit is created. The interface must not imply that either floor guarantees medical safety.

**Sources:**

- Jensen MD, Ryan DH, Apovian CM, et al. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. *Circulation.* 2014;129(25 Suppl 2):S102–S138. doi:10.1161/01.cir.0000437739.71477.ee. PMID 24222017.
- CDC. *Steps for Losing Weight.* 17 January 2025. https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html
- Thomas DM, Martin CK, Lettieri S, et al. Can a weight loss of one pound a week be achieved with a 3,500 kcal deficit? Commentary on a commonly accepted rule. *Int J Obes (Lond).* 2013;37(12):1611–1613. doi:10.1038/ijo.2013.51. PMID 23628852.

### 6.3 Muscle gain

```text
surplus = clamp(TDEE × 0.15, 250, 500)
targetCalories = TDEE + surplus
```

Rules:

- The surplus is 15% of TDEE, clamped to 250–500 kcal/day.
- The desired gain rate is stored and displayed as a goal, but it is **not** used to calculate the surplus. The energy cost of lean tissue is different from adipose tissue, and the evidence does not define a precise rate-based equation for muscle gain.
- For typical adult TDEE values, the clamp lands inside the conservative 1,500–2,000 kJ/day (about 360–480 kcal/day) surplus range recommended in the review below.
- CALO must explain that actual muscle gain depends on training, protein intake, training experience, genetics, and other factors, and that a surplus does not guarantee a specific rate.

**Source:** Slater GJ, Dieter BP, Marsh DJ, Helms ER, Shaw G, Iraki J. Is an energy surplus required to maximize skeletal muscle hypertrophy associated with resistance training? *Front Nutr.* 2019;6:131. doi:10.3389/fnut.2019.00131. PMID 31482093.

### 6.4 Calorie rounding

- Keep BMR and TDEE unrounded during calculation.
- Persist BMR and TDEE to one decimal place for transparency.
- Round the final calorie target to the nearest whole kcal using half-up rounding.
- Display the calorie target as an integer.

---

## 7. Macronutrient Targets

### 7.1 Energy factors

CALO uses the standard Atwater factors already required by the PRD:

```text
protein: 4 kcal/g
carbohydrate: 4 kcal/g
fat: 9 kcal/g
```

The 4-4-9 consistency check is:

```text
4 × proteinG + 4 × carbsG + 9 × fatG ≈ targetCalories
```

### 7.1.1 Custom food validation

Custom foods store all eight nutrition values per 100 g exactly as entered. CALO does not replace user values with calculated estimates. It shows a warning and requires explicit confirmation before saving when:

```text
abs(caloriesPer100g − (4 × protein + 4 × carbs + 9 × fat))
  > max(20 kcal, 10% × max(caloriesPer100g, macroEstimate))
```

The same confirmation covers implausible per-100 g values: calories above 900 kcal, any of protein, carbohydrate, or fat above 100 g, fiber plus sugar above carbohydrate by more than 0.1 g, saturated fat above total fat by more than 0.1 g, or sodium above 5,000 mg.

These are data-entry checks, not nutrition claims. The stored source label is `User-entered values`, and the app does not present custom-food values as verified or as medical advice.

### 7.2 Protein

Protein is based on body weight and goal:

| Goal | Protein factor |
|---|---:|
| Maintenance | 1.4 g/kg/day |
| Weight loss | 1.6 g/kg/day |
| Muscle gain | 1.6 g/kg/day |

The higher-protein preset is defined separately in Section 7.5 as 30% of calories.

The 1.4–2.0 g/kg/day range is recommended by the International Society of Sports Nutrition for most exercising individuals. CALO uses the lower-middle of that range for general users and does not prescribe the upper end to everyone.

Protein is clamped to the Institute of Medicine Acceptable Macronutrient Distribution Range (AMDR):

```text
minimumProteinG = 0.10 × targetCalories ÷ 4
maximumProteinG = 0.30 × targetCalories ÷ 4   // balanced preset
proteinG = clamp(goalFactor × weightKg, minimumProteinG, maximumProteinG)
```

The balanced preset uses a 30% ceiling, not the full 35% AMDR ceiling, so that carbohydrates can remain at or above 45% of calories when fat is 25%. The custom preset may use up to 35% protein if the user also keeps the other AMDR ranges.

**Sources:**

- Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition Position Stand: Protein and exercise. *J Int Soc Sports Nutr.* 2017;14:20. doi:10.1186/s12970-017-0177-8. PMID 28642676.
- Institute of Medicine. *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.* Washington, DC: National Academies Press; 2005. https://nap.nationalacademies.org/catalog/10490/

### 7.3 Fat

The default fat target is 25% of calories:

```text
fatG = targetCalories × 0.25 ÷ 9
```

The custom preset accepts 20–35% of calories, matching the IOM AMDR for fat. CALO does not set a fat target below 20% of calories in the MVP.

### 7.4 Carbohydrate

Carbohydrate is the remainder:

```text
carbsG = (targetCalories − 4 × proteinG − 9 × fatG) ÷ 4
```

The IOM AMDR for carbohydrate is 45–65% of calories. The balanced preset is designed to stay within that range. The higher-protein and custom presets may approach the lower bound; the review screen must show the resulting percentages and note when a macro falls outside the AMDR.

### 7.5 Macro presets

| Preset | Protein | Fat | Carbohydrate | Notes |
|---|---|---|---|---|
| Balanced (default) | Goal factor, clamped to 10–30% | 25% | Remainder, normally 45–65% | Recommended for most users |
| Higher protein | 30% | 25% | 45% | Stays within all three AMDR ranges |
| Custom | 10–35% | 20–35% | 45–65% | User-entered; must sum to 100% |

The higher-protein preset is percentage-based. For heavier users it may provide less protein per kilogram than the balanced goal factor, because the preset keeps carbohydrate at the 45% AMDR lower bound. The review screen must show grams per kilogram so the user can see the trade-off.

CALO does not offer a very-low-carbohydrate or ketogenic preset in the MVP. That is a therapeutic diet decision outside the approved product scope.

### 7.6 Rounding and reconciliation

Targets are persisted as integers:

1. Round the calorie target to the nearest whole kcal.
2. Round protein to the nearest whole gram.
3. Round fat to the nearest whole gram.
4. Compute carbohydrate from the rounded values:

```text
carbsG = round((roundedCalories − 4 × roundedProteinG − 9 × roundedFatG) ÷ 4)
```

This keeps the 4-4-9 sum within a few kcal of the calorie target. The review screen may show a small "rounding difference" note if the sum is not exact.

Example:

```text
roundedCalories = 2214
roundedProteinG = 144
roundedFatG = 62
carbsG = round((2214 − 576 − 558) ÷ 4) = round(270) = 270

4 × 144 + 4 × 270 + 9 × 62 = 2214 kcal
```

A small difference can still occur after rounding; it is acceptable and must not be hidden by changing the calorie target.

---

## 8. Validation and Edge Cases

| Case | Required behavior |
|---|---|
| Age below 18 or above 80 | Do not auto-calculate. Explain the validated adult range and offer manual targets. |
| Biological sex not selected | Do not guess. Offer manual targets. |
| Height outside 100–250 cm | Validation error. |
| Weight outside 30–300 kg | Validation error. |
| Target weight outside 30–300 kg | Validation error. |
| Weight-loss goal but target weight ≥ current weight | Validation error; ask the user to correct the direction. |
| Muscle-gain goal but target weight ≤ current weight | Validation error; ask the user to correct the direction. |
| Maintenance goal but target weight differs from current weight by more than 1 kg | Warning; maintenance targets are based on current weight. |
| Rate selected but goal is maintenance | Rate is stored as 0. |
| Weight-loss rate above 0.75 kg/week | Not offered. If entered through a future custom field, cap the deficit at 750 kcal/day. |
| Muscle-gain rate above 0.5 kg/week | Not offered. The surplus remains capped at 500 kcal/day. |
| Calculated weight-loss target below the sex-specific floor | Raise to the floor and explain the adjustment. |
| TDEE at or below the floor | Do not create a deficit. Set target to TDEE and explain. |
| Target weight implies BMI below 18.5 | Show a caution and recommend professional guidance. Do not present the target as a health recommendation. |
| Current BMI below 18.5 with a weight-loss goal | Do not auto-calculate a weight-loss target. Require manual targets or professional guidance. |
| Custom macro percentages outside AMDR | Validation error with the allowed ranges. |
| Custom macro percentages do not sum to 100 | Validation error. |
| Protein target below 10% or above 35% after calculation | Clamp to the AMDR and show a note. |
| Carbohydrate target below 45% | Show an AMDR note; do not silently change the user's custom split. |
| Stored profile contains a value outside the accepted range | Treat the profile as invalid, keep the data, and ask the user to review it. Do not delete it. |
| Historical targets exist | Recalculation creates a new target state or updates the current target; historical food logs remain unchanged because food entries store their own nutrition values. |

### Safety disclaimers

The onboarding review and Settings target screen must include, in both supported languages:

- "These targets are estimates based on a predictive equation. They are not medical advice."
- "Consult a qualified health professional if you are pregnant or breastfeeding, under 18, have a medical condition, have a history of disordered eating, or are an athlete with very high muscle mass."
- "You can edit or replace the calculated targets at any time."

The disclaimer must not be hidden in a tooltip or only in the footer.

---

## 9. Proposed Data Model

The existing storage schemas are skeletons. Phase 2 will extend them. Proposed fields:

```ts
type BiologicalSex = "female" | "male";

type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very-active"
  | "extra-active";

type FitnessGoal = "weight-loss" | "maintenance" | "muscle-gain";

type MacroPreference = "balanced" | "higher-protein" | "custom";

interface CustomMacroSplit {
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
}

interface UserProfile {
  // existing EntityMeta fields: id, createdAt, updatedAt
  ageYears: number;
  biologicalSex: BiologicalSex;
  heightCm: number;
  currentWeightKg: number;
  activityLevel: ActivityLevel;
  workoutDaysPerWeek: number;
  fitnessGoal: FitnessGoal;
  targetWeightKg: number;
  desiredRateKgPerWeek: number;
  macroPreference: MacroPreference;
  customMacroSplit?: CustomMacroSplit;
}

interface NutritionTargets {
  // existing EntityMeta fields: id, createdAt, updatedAt
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bmr: number;
  tdee: number;
  activityPal: number;
  source: "calculated" | "manual";
  formulaVersion: 1;
  calculatedAt: string; // UTC ISO
}
```

Rules:

- `formulaVersion` prevents a future formula change from silently reinterpreting old targets.
- `bmr`, `tdee`, and `activityPal` are stored so the review screen can explain the result.
- `source` distinguishes calculated targets from manually edited targets.
- `calculatedAt` uses the shared UTC ISO helper.
- The profile must be validated with Zod before it is used or persisted.
- Existing user data must be preserved during the schema extension. A migration is required only if the profile or targets key advances its own schema version.

---

## 10. Worked Examples

### Example 1 — Maintenance

Profile: female, 30 years, 165 cm, 65 kg, moderately active (PAL 1.70), maintenance, balanced.

```text
BMR = 10(65) + 6.25(165) − 5(30) − 161 = 1370.25 kcal
TDEE = 1370.25 × 1.70 = 2329.425 kcal
targetCalories = 2329 kcal (rounded)

protein = 1.4 × 65 = 91 g
fat = 2329 × 0.25 ÷ 9 = 64.7 → 65 g
carbs = (2329 − 4(91) − 9(65)) ÷ 4 = 345 g

Check: 4(91) + 4(345) + 9(65) = 2329 kcal
```

Result: **2329 kcal, 91 g protein, 345 g carbohydrate, 65 g fat**.

### Example 2 — Weight loss

Profile: male, 35 years, 178 cm, 90 kg, lightly active (PAL 1.50), weight loss, 0.5 kg/week, balanced.

```text
BMR = 10(90) + 6.25(178) − 5(35) + 5 = 1842.5 kcal
TDEE = 1842.5 × 1.50 = 2763.75 kcal
deficit = 0.5 × 7700 ÷ 7 = 550 kcal
targetCalories = 2763.75 − 550 = 2213.75 → 2214 kcal
floor = 1500 kcal; target is above the floor

protein = 1.6 × 90 = 144 g
fat = 2214 × 0.25 ÷ 9 = 61.5 → 62 g
carbs = (2214 − 4(144) − 9(62)) ÷ 4 = 270 g

Check: 4(144) + 4(270) + 9(62) = 2214 kcal
```

Result: **2214 kcal, 144 g protein, 270 g carbohydrate, 62 g fat**.

### Example 3 — Muscle gain

Profile: male, 25 years, 175 cm, 70 kg, very active (PAL 1.85), muscle gain, balanced.

```text
BMR = 10(70) + 6.25(175) − 5(25) + 5 = 1673.75 kcal
TDEE = 1673.75 × 1.85 = 3096.44 kcal
surplus = clamp(3096.44 × 0.15, 250, 500) = 464.47 kcal
targetCalories = 3096.44 + 464.47 = 3560.91 → 3561 kcal

protein = 1.6 × 70 = 112 g
fat = 3561 × 0.25 ÷ 9 = 98.9 → 99 g
carbs = (3561 − 4(112) − 9(99)) ÷ 4 = 555.75 → 556 g

Check: 4(112) + 4(556) + 9(99) = 3563 kcal (2 kcal rounding difference)
```

Result: **3561 kcal, 112 g protein, 556 g carbohydrate, 99 g fat**.

---

## 11. Limitations

- Predictive equations estimate a population average. Individual BMR can differ by roughly 10% or more.
- Activity level is self-reported and the PAL bands are broad. Two users with the same selection may have different true expenditure.
- The 7700 kcal/kg value is a static approximation. It overestimates long-term weight loss because energy expenditure falls as body mass falls. Dynamic models such as the NIH Body Weight Planner are more accurate but outside the MVP.
- The muscle-gain surplus evidence is uncertain. The 1,500–2,000 kJ/day range is a conservative review recommendation, not a guaranteed rate of muscle gain.
- CALO does not collect body-fat percentage or lean body mass, so it cannot use Katch-McArdle or Cunningham.
- The formula uses binary biological sex. There is no validated sex-neutral version. Users who do not select female or male must use manual targets.
- The formula is not validated for pregnancy, lactation, children, adolescents, clinical populations, or athletes with extreme body composition.
- BMI warnings are screening aids, not diagnoses.
- Targets do not update automatically from observed weight change in the MVP. The user can recalculate after updating their profile.
- Calculated targets are estimates, not medical advice.

---

## 12. Sources

1. Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. *Am J Clin Nutr.* 1990;51(2):241–247. doi:10.1093/ajcn/51.2.241. PMID 2305711. https://pubmed.ncbi.nlm.nih.gov/2305711/
2. Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. *J Am Diet Assoc.* 2005;105(5):775–789. doi:10.1016/j.jada.2005.02.005. PMID 15883556. https://pubmed.ncbi.nlm.nih.gov/15883556/
3. FAO/WHO/UNU. *Human Energy Requirements: Report of a Joint FAO/WHO/UNU Expert Consultation.* Rome, 2004. Chapter 5, Table 5.3. https://www.fao.org/4/y5686e/y5686e07.htm
4. Jensen MD, Ryan DH, Apovian CM, et al. 2013 AHA/ACC/TOS Guideline for the Management of Overweight and Obesity in Adults. *Circulation.* 2014;129(25 Suppl 2):S102–S138. doi:10.1161/01.cir.0000437739.71477.ee. PMID 24222017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5819889/
5. Institute of Medicine. *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.* Washington, DC: National Academies Press; 2005. https://nap.nationalacademies.org/catalog/10490/
6. Jäger R, Kerksick CM, Campbell BI, et al. International Society of Sports Nutrition Position Stand: Protein and exercise. *J Int Soc Sports Nutr.* 2017;14:20. doi:10.1186/s12970-017-0177-8. PMID 28642676. https://pubmed.ncbi.nlm.nih.gov/28642676/
7. Slater GJ, Dieter BP, Marsh DJ, Helms ER, Shaw G, Iraki J. Is an energy surplus required to maximize skeletal muscle hypertrophy associated with resistance training? *Front Nutr.* 2019;6:131. doi:10.3389/fnut.2019.00131. PMID 31482093. https://pmc.ncbi.nlm.nih.gov/articles/PMC6710320/
8. CDC. *Steps for Losing Weight.* 17 January 2025. https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html
9. Thomas DM, Martin CK, Lettieri S, et al. Can a weight loss of one pound a week be achieved with a 3,500 kcal deficit? Commentary on a commonly accepted rule. *Int J Obes (Lond).* 2013;37(12):1611–1613. doi:10.1038/ijo.2013.51. PMID 23628852. https://pmc.ncbi.nlm.nih.gov/articles/PMC4024447/
10. NIDDK. *Body Weight Planner.* https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner
11. U.S. Food and Drug Administration. 21 CFR 101.9(c)(1) — nutrition labeling; 4-4-9 calorie factors. https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9

---

## 13. Approved Decisions

The user approved all fifteen recommended choices below.

| # | Decision | Approved choice |
|---:|---|---|
| 1 | BMR formula | Mifflin-St Jeor, sex-specific |
| 2 | TDEE activity values | FAO/WHO/UNU-based PAL: 1.40, 1.50, 1.70, 1.85, 2.00 |
| 3 | Workout frequency role | Advisory only; suggests activity level, never adds calories |
| 4 | Weight-loss rate options | 0.25, 0.5, 0.75 kg/week |
| 5 | Weight-loss deficit cap and floors | Cap 750 kcal/day; female 1200 kcal/day and male 1500 kcal/day are algorithmic guardrails, not universal medically safe minimums and not guarantees of safety. Never set a weight-loss target below the applicable guardrail; if TDEE is at or below it, do not create a deficit. If it reduces the requested deficit, explain the smaller actual deficit. |
| 6 | Muscle-gain surplus | 15% of TDEE, clamped to 250–500 kcal/day; gain rate not used in the formula |
| 7 | Protein model | Goal factors 1.4 / 1.6 / 1.6 g/kg, clamped to AMDR |
| 8 | Fat model | 25% of calories by default; custom 20–35% |
| 9 | Carbohydrate model | Remainder after protein and fat; AMDR note when outside 45–65% |
| 10 | Macro presets | Balanced, Higher protein (30/25/45), Custom (within AMDR) |
| 11 | Automatic-calculation age range | 18–80, with a caution outside the original 19–78 validation |
| 12 | Biological-sex handling | Female or male required for automatic calculation; manual targets otherwise |
| 13 | Target rounding | Integer kcal and grams; 4-4-9 reconciliation by adjusting carbohydrate |
| 14 | Data model | Add `formulaVersion`, `source`, `bmr`, `tdee`, and `activityPal` to targets |
| 15 | Dynamic weight-change model | Out of scope for the MVP; document the static 7700 kcal/kg limitation |

If any decision changes, update this document before implementation and record the change in `CHANGELOG.md`.
