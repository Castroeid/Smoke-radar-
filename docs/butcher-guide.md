# Butcher buying guide

The app has a standalone “What should I ask the butcher?” flow, available from
home, the shopping list and every butcher-finder state, including denied location
and loading. It does not request location, call an LLM, alter a saved recipe or
send a message. Copying is explicit, with a selectable-text fallback. The finder
still requests location only when the visitor presses its search button.

Nine buying goals cover burgers, meatballs, kebab, steaks, skewers, stir-fry,
stew, sliced roast beef and pulled beef. Each provides a cut name, the usual
Israeli beef number, preparation instructions, alternatives and a copyable
request scaled to 1–20 servings. Portion weights are our planning estimates for
raw boneless meat, not mandatory serving sizes or cooking instructions. The UI
says to adjust to appetite, sides and any existing recipe.

Sources checked on 2026-11-24:

- [Israel Cattle Board cut map](https://meat.org.il/מפת-נתחים/): local numbers
  and broad uses. No international numbering equivalence is asserted.
- [HaTahana's untrib guide](https://meat-shop.co.il/מדריך-נתחים/אונטריב/): local
  untrib terminology, slow cooking and use in ground-meat blends. English chuck
  roll is an approximate shopping term; it does not identify one exact muscle.
- [Ohayon's shaitel listing](https://atliz-ohayon.co.il/product/שייטל-נתח-מספר-13/):
  number 13, steak and stir-fry preparations.
- [Weber's burger](https://amer.weber.com/en-us/blogs/recipes/classic-smash-burger):
  an example of an 80/20 blend, not a requirement for every burger. The request
  asks the butcher to adjust the final blend; it does not assume untrib always
  contains 20% fat, or ask for an additional 20% fat on top of the meat.
- [ThermoWorks' chuck guide](https://blog.thermoworks.com/smoked-chuck-roast-a-cheaper-cut-shines/):
  prolonged cooking and tenderness checks for pulled beef. Also used for the
  standard recipe generator's untrib tenderness guidance.

Sources and explanations are collapsed by default. The requests are original
editorial buying guidance, not quotations, endorsements or tested recipes.
There is no automatic jump from a burger buying request to a whole-cut recipe.

`rump` (שייטל) and `chuck_roll` (אונטריב) are distinct recipe IDs. The existing
`chuck` ID remains unchanged for saved-recipe compatibility. Both new cuts are
supported by the ordinary generator, deterministic basic-cookware recipes,
sous-vide schedules, fallback names and saved-recipe round trips. Untrib is
classified as a slow-cooking cut, not a generic quick-sear steak.
