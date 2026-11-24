# Recipe reliability: first release

The app must distinguish a complete AI-generated recipe from a recipe that has
actually been cooked. No recipe has a kitchen-tested/professional approval badge.
The new label is **עבר בדיקת שלמות אוטומטית** (automated completeness checks
passed), with an expandable description of the limited checks and an explicit
AI-generated / not kitchen-tested note. It is not a guarantee of safety or taste.

## What changed

- The request includes the actual serving count and custom cooking request.
- The backend never fills missing lines using unrelated fallback ingredients or
  methods. Invalid output gets one repair attempt, then a recoverable error.
- Every main/sauce/side requires ingredient amounts/units and instruction lists.
  Side ingredients are retained in both the mobile and desktop interfaces.
- Numeric metadata includes servings, assumed total meat weight, piece thickness,
  equipment, prep (including marination), cooking, rest and total minutes. The
  main meat weight and time totals must agree with their corresponding fields.
- The client preserves instructions: it no longer turns an oven brisket into a
  smoker recipe, replaces reverse searing with quick searing, or inserts an
  unlisted marinade. Missing metadata is shown as missing, not invented.
- All main ingredients reach the shopping list, including oil, liquids and onions.
- Saving/restoring retains these fields; old or altered recipes cannot inherit a
  passing label without the current version and a fresh mechanical check.

## Temperature reference and limitations

The reference is [FoodSafety.gov's minimum internal temperature chart](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures),
accessed 2026-11-24: whole beef/lamb/veal 63°C plus at least 3 minutes rest;
ground meat 71°C; poultry 74°C. It is linked as temperature guidance, never as
the origin of or endorsement of an AI recipe. Higher tenderness targets can be
used. An internal target below the applicable baseline, a missing matching
target in the steps, or a detected contradictory internal target fails the gate.

These checks do **not** establish that a cooking time is physically sufficient,
that every step uses every listed ingredient, that seasoning proportions taste
good, or that every possible text contradiction is caught. The displayed weight
and thickness are generated assumptions, not measurements from the user's meat.
The prompt requests coherent methods, quantities and readiness cues; a model's
compliance with that prompt is not independent culinary validation. Generic
whole-cut rules must not be presented as a validated curing, raw-meat, cold
smoking or sous-vide protocol. Those methods need separate reviewed protocols.

## Next step toward a kitchen-tested label

Build a small fixed collection with complete quantities, weight/thickness,
equipment, temperatures and observable readiness cues. Cook each exact version
and record the date, tester, actual timing and outcome. Attribute any source
recipe accurately and distinguish adaptations. Only that tested version may carry
a kitchen-tested label; generating or changing it creates a new untested version.
User reports such as “I cooked this” should be stored separately from editorial
testing and never fabricated. No stars, confidence percentages or endorsements
are displayed without actual supporting records.

## Verification

`tests/recipe-quality.cjs` checks completeness rejection, serving/weight/time
consistency, relevant temperature baselines, preservation through storage, bounded
model repair and fail-closed errors. `tests/recipe-quality-ui.cjs` exercises the
rendered app, step preservation, shopping list, labels, retry and saved reopening.
The test recipes are synthetic fixtures, not kitchen-tested recipes. Live model
samples and browser rendering are separate checks; neither replaces cooking.
