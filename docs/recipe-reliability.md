# Recipe reliability — caveats and sourced step tips (version 3)

A completeness failure should not strand the user without a recipe. It must also
not turn an unsafe or unusable draft into a “verified” recipe by adding a badge.
The UI says **מתכון עם הערות הכנה** or **מתכון בסיסי חלופי**, and explicitly says
that the recipe has not been kitchen-tested. The source links support individual
tips, not the generated recipe, its quantities, or its overall safety.

## Response policy

1. Generate structured instructions and perform the existing checks. One bounded
   repair attempt is retained. Preserve an earlier usable draft if repair fails.
2. An explicit allowlist of optional omissions becomes explained caveats:
   missing thickness/equipment/texture cues, missing entire sauces or sides, and
   missing or conflicting timing. Suppress time summaries when timings disagree.
   Do not invent absent metadata or splice generic steps into an AI recipe.
3. Missing main instructions/amounts, malformed provided accompaniments,
   serving/weight contradictions, dietary mismatches, detected unsafe targets,
   missing required rest, and specialised curing/pasteurisation instructions
   remain blocking. Unknown future check failures default to blocking.
4. When no usable draft exists, or the model is unavailable, return a complete
   fixed-template alternative with the reason for replacement. The mobile app
   also has these templates for a failed network request after the app has loaded.
   This does not promise that a site that has never loaded works offline.
5. Alternatives adapt portions and broad meat family. Tough cuts use a covered
   oven braise with an explicit change to cubes; other cuts use a pan/grill
   template. The actual method, ingredients and preparation are visible. Flavour
   requests and custom instructions are explicitly not applied to this alternative.
   These are original house templates, not published or kitchen-tested recipes.

Main/sauce/side ingredients and instructions, numeric metadata, and replacement
provenance survive local/cloud serialization. Old saved versions do not inherit
new review labels or retroactive source attribution. Every displayed current
main/sauce/side step has either a relevant sourced tip or a clearly named general
preparation reminder. Raw AI chef tips are no longer presented as sourced advice.

## Source collection

`public/app/recipe-guidance.js` contains concise editorial paraphrases and an
allowlist of source URLs, reviewed 2026-11-24. Matching is deterministic from the
step action/phase and cut, not a model-generated citation. Tip text is derived
again from this catalog on reopening; a recipe cannot supply arbitrary links.
This is a maintained collection, not a claim of a fresh web search per request.

| Source | Supported tips |
| --- | --- |
| [FoodSafety.gov: 4 Steps](https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety) | Clean utensils, separate produce boards, thermometer placement, cold storage and leftovers |
| [FDA: outdoor food handling](https://www.fda.gov/food/buy-store-serve-safe-food/handling-food-safely-while-eating-outdoors) | Refrigerated marinating, reserve clean marinade, clean serving dishes |
| [Weber manual, page 11](https://digital-assets.weber.com/documents/48990_121219.pdf?fm=pdf#page=11) | Crowding increases grilling time |
| [Institute of Culinary Education](https://www.ice.edu/blog/how-find-grain-and-slice-steak-chef) | Slice across the grain after resting |
| [RICARDO / Christina Blais](https://www.ricardocuisine.com/en/articles/food-chemistry/643-how-to-perfect-the-art-of-braising) | Brown in batches, gentle simmer under a lid, rest braised meat in liquid |
| [King Arthur Baking](https://www.kingarthurbaking.com/recipes/resources/recipe-success-guide) | Independent thermometer during oven preheating |
| [Good Food BBQ sauce](https://www.bbcgoodfood.com/recipes/barbecue-sauce) / [vinaigrette](https://www.bbcgoodfood.com/recipes/classic-vinaigrette) | Simmer BBQ sauce to thicken; shake oil/vinegar dressings |
| Weber brisket / ThermoWorks short ribs (below) | Temperature alone does not establish tenderness |

## Temperature reference and limitations

The reference is [FoodSafety.gov's minimum internal temperature chart](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures),
accessed 2026-11-24: whole beef/lamb/veal 63°C plus at least 3 minutes rest;
ground meat 71°C; poultry 74°C. It is linked as temperature guidance, never as
the origin of or endorsement of an AI recipe. Higher tenderness targets can be
used. An internal target below the applicable baseline, a missing matching
target in the steps, or a detected contradictory internal target fails the gate.

A live preview sample exposed a separate culinary error: oven brisket described
as fall-apart tender at 63°C. The temperature check applies a conservative 90–99°C house range
and a probe/fork tenderness cue to brisket and thick short ribs/asado with slow
methods. The sources for the thermal principle are
[Weber's brisket guide](https://www.weber.com/IE/en/recipes/beef/beginner-brisket/weber-175674.html)
(90–95°C, with tenderness more important) and
[ThermoWorks' braised short ribs](https://www.thermoworks.com/blogs/thermoblog/whole-braised-short-ribs)
(around 95°C plus a tenderness check), accessed 2026-11-24. Applying that range
to generated recipes is our guardrail, not proof that a source tested or approved
the resulting recipe. This does not apply to thin quick-grilled short ribs.

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

The tests cover strict failures versus advisories, bounded repair, preserving an
initial usable draft, provider/network fallback, all baseline families across
languages/portion counts/methods, reviewed tip selection, safe links, both desktop
and mobile renderers, shopping and save/reopen preservation. Fixtures and browser
samples test software, not taste or cooking performance. Firestore security rules
are unchanged; account/storage regression tests remain part of the suite.

Desktop partial regeneration also keeps section-level replacement provenance, so a fallback sauce/side cannot be silently presented as customised AI output. A live preview sample also prompted a guard requiring the internal target before the first rest step, not only after resting.
