(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RecipeQuality = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  const VERSION = 2;
  const SOURCE_URL = "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures";
  const text = value => typeof value === "string" && value.trim().length > 0;
  const list = value => Array.isArray(value) ? value : [];
  const strings = value => Array.isArray(value) && value.every(text);
  const number = (value, min, max) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
  const quantity = /^\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[¼½¾])\s*(?:kg|g|grams?|kilograms?|ml|l|liters?|litres?|tbsp|tsp|tablespoons?|teaspoons?|cups?|cloves?|pieces?|units?|bunch(?:es)?|ק[״"']?ג|גרם|מ[״"']?ל|ליטר(?:ים)?|כפות|כף|כפיות|כפית|כוסות|כוס|שיני|שן|יחידות|יחידה|צרורות|צרור)(?:\s|$)/i;

  // Reference guidance, not a certification or a pasteurisation model.
  function safetyReference(recipe, context = {}) {
    const ingredients = [recipe?.main, ...list(recipe?.sauces), ...list(recipe?.sides)]
      .flatMap(part => list(part?.ingredients)).join(" ");
    const input = `${context.meatType || ""} ${context.userQuestion || ""} ${ingredients}`;
    if (/\b(chicken|turkey|poultry)\b|עוף|הודו/i.test(input)) return { minimumC: 74, restMinutes: 0, url: SOURCE_URL };
    if (/\b(ground|minced)\s+(beef|lamb|veal|pork|meat)\b|\b(burger|sausage)\b|(?:בשר|בקר|טלה|עגל)\s+טחו[ןנ]|המבורגר|קבב|נקניק/i.test(input)) return { minimumC: 71, restMinutes: 0, url: SOURCE_URL };
    return { minimumC: 63, restMinutes: 3, url: SOURCE_URL };
  }

  function cookingReference(context = {}) {
    const cut = `${context.cutId || ""} ${context.cut || ""}`;
    const method = `${context.methodId || ""} ${context.method || ""}`;
    if (!/oven|roast|smok|long|low|brais|תנור|מעשנ|עישון|ארוך|איטי/i.test(method)) return null;
    if (/brisket|בריסקט/i.test(cut)) return { minimumC: 90, maximumC: 99, name: "Weber — Brisket", url: "https://www.weber.com/IE/en/recipes/beef/beginner-brisket/weber-175674.html" };
    if (/asado|short.?ribs|אסאדו|שפונדרה/i.test(cut)) return { minimumC: 90, maximumC: 99, name: "ThermoWorks — Braised Short Ribs", url: "https://www.thermoworks.com/blogs/thermoblog/whole-braised-short-ribs" };
    return null;
  }

  function stepTotals(timing) {
    if (!Array.isArray(timing) || !timing.length || timing.some(t => !["prep", "cook", "rest"].includes(t?.phase) || !number(t.minutes, 0, 4320) || !Number.isInteger(t.minutes))) return null;
    const result = { prep_minutes: 0, cook_minutes: 0, rest_minutes: 0, total_minutes: 0 };
    for (const step of timing) { result[`${step.phase}_minutes`] += step.minutes; result.total_minutes += step.minutes; }
    return result;
  }

  function prepareDraft(recipe) {
    if (!recipe?.main) return recipe;
    const totals = stepTotals(recipe.main.step_timing);
    if (!totals) return recipe;
    // Totals come from the ordered steps, not a separately generated summary.
    return { ...recipe, main: { ...recipe.main, metadata: { ...recipe.main.metadata, ...totals } } };
  }

  function check(recipe, context = {}) {
    const issues = [];
    if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) return { passed: false, issues: ["recipe: missing object"] };
    function part(item, name, minSteps) {
      if (!item || !text(item.title || item.name)) issues.push(`${name}: missing title`);
      if (!strings(item?.ingredients) || item.ingredients.length < 2 || item.ingredients.length > 30) {
        issues.push(`${name}: ingredients must be a complete list`);
      } else {
        item.ingredients.forEach((line, i) => {
          const amount = line.match(/^\s*(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+))?/);
          const positive = amount ? Number(amount[1].replace(",", ".")) > 0 && (!amount[2] || Number(amount[2]) > 0) : /^\s*[¼½¾]/.test(line);
          if (!quantity.test(line) || !positive) issues.push(`${name}.ingredients[${i}]: positive numeric amount and explicit unit required`);
        });
      }
      if (!strings(item?.steps) || item.steps.length < minSteps || item.steps.length > 20) issues.push(`${name}: preparation steps are incomplete`);
    }
    part(recipe.main, "main", 3);
    for (const name of ["sauces", "sides"]) {
      if (!Array.isArray(recipe[name]) || recipe[name].length < 1 || recipe[name].length > 3) issues.push(`${name}: include 1-3 complete recipes`);
      else recipe[name].forEach((item, i) => part(item, `${name}[${i}]`, 2));
    }
    const m = recipe.main?.metadata || {};
    const totals = stepTotals(recipe.main?.step_timing);
    if (!totals || recipe.main.step_timing.length !== list(recipe.main?.steps).length) issues.push("main.step_timing: provide phase (prep/cook/rest) and nonnegative integer minutes for every step");
    else for (const key of Object.keys(totals)) if (m[key] !== totals[key]) issues.push(`main.metadata.${key}: must equal the sum of step_timing`);
    if (list(recipe.main?.steps).some(s => /\d[\d.,–—\-/\s]*\s*(?:minutes?|mins?\b|hours?|hrs?\b|seconds?|דקות|דקה|שעות|שעה|שניות|שנייה)/i.test(s))) issues.push("main.steps: put ALL durations only in step_timing, not in step text (the UI will render them)");
    const servings = Number(m.servings);
    if (!Number.isInteger(servings) || servings < 1 || servings > 20 || (context.servings !== undefined && servings !== Number(context.servings))) issues.push("main.metadata.servings: must match requested servings");
    for (const key of ["prep_minutes", "cook_minutes", "rest_minutes", "total_minutes"]) {
      if (!number(m[key], key === "cook_minutes" || key === "total_minutes" ? 1 : 0, 4320) || !Number.isInteger(m[key])) issues.push(`main.metadata.${key}: integer minutes required`);
    }
    if (m.total_minutes !== m.prep_minutes + m.cook_minutes + m.rest_minutes) issues.push("main.metadata: total must equal prep (including marinating) + cook + rest");
    if (!number(m.meat_weight_g, servings * 50, servings * 1000)) issues.push("main.metadata.meat_weight_g: specify a plausible total weight for the servings");
    if (!number(m.piece_thickness_cm, 0.5, 30)) issues.push("main.metadata.piece_thickness_cm: specify the assumed thickness");
    const first = recipe.main?.ingredients?.[0];
    const weight = typeof first === "string" ? first.match(/^\s*(\d+(?:[.,]\d+)?)\s*(kg|g|grams?|kilograms?|ק[״"']?ג|גרם)(?=\s)/i) : null;
    const grams = weight ? Number(weight[1].replace(",", ".")) * (/kg|kilograms?|ק/i.test(weight[2]) ? 1000 : 1) : NaN;
    if (!Number.isFinite(grams) || Math.abs(grams - m.meat_weight_g) > 0.01) issues.push("main.ingredients[0]: meat amount in g/kg must equal meat_weight_g");
    const safety = safetyReference(recipe, context);
    const cooking = cookingReference(context);
    if (cooking && (!number(m.target_internal_c, cooking.minimumC, cooking.maximumC) || !/probe|fork|שיפוד|מזלג|מדחום/i.test(m.doneness_cue || ""))) issues.push(`main.metadata: slow-cooked cut requires a ${cooking.minimumC}-${cooking.maximumC} C tenderness target AND a probe/fork tenderness cue; minimum food-safety temperature alone does not tenderize this cut`);
    if (!number(m.target_internal_c, safety.minimumC, 110)) issues.push(`main.metadata.target_internal_c: must be at least ${safety.minimumC} C`);
    if (m.rest_minutes < safety.restMinutes) issues.push(`main.metadata.rest_minutes: at least ${safety.restMinutes} minutes required`);
    if (!text(m.doneness_cue)) issues.push("main.metadata.doneness_cue: describe how to check readiness with a thermometer and texture");
    const stepsText = list(recipe.main?.steps).join(" ");
    if (number(m.target_internal_c, safety.minimumC, 110) && !new RegExp(`(?:^|[^\\d])${String(m.target_internal_c).replace(".", "\\.")}\\s*(?:°\\s*[cC]|מעלות)`).test(stepsText)) issues.push("main.steps: include the same internal temperature target as metadata, with degrees C");
    for (const match of stepsText.matchAll(/(?:internal|ליבה|פנימי[ת]?)[^.!?\n]{0,45}?(\d+(?:\.\d+)?)\s*(?:°\s*C|מעלות)/gi)) {
      if (Number(match[1]) < safety.minimumC) issues.push("main.steps: internal temperature contradicts minimum guidance");
    }
    if (!strings(recipe.main?.equipment) || !recipe.main.equipment.length) issues.push("main.equipment: list required equipment");
    if (context.dietaryPreference && recipe.dietaryPreference !== context.dietaryPreference) issues.push("dietaryPreference: must match the request");
    const allIngredients = [recipe.main, ...list(recipe.sauces), ...list(recipe.sides)].flatMap(p => list(p?.ingredients)).join(" ");
    if (context.dietaryPreference === "kosher" && /\b(butter|cream|yogurt|cheese|parmesan|milk)\b|חמאה|שמנת|יוגורט|גבינ|חלב(?! קוקוס| סויה| שקדים)/i.test(allIngredients)) issues.push("dietaryPreference: use a complete non-dairy formulation, not a word substitution");
    return { passed: issues.length === 0, issues, version: VERSION, safety, cooking };
  }

  function minutes(value, language) { return `${value} ${language === "he" ? "דקות" : "min"}`; }
  function normalize(recipe, language = "en") {
    // Call only after check() passes. Preserve instructions and quantities exactly.
    const m = recipe.main.metadata;
    const part = item => ({ name: item.name || item.title, title: item.title || item.name, description: item.description || "", ingredients: [...item.ingredients], steps: [...item.steps] });
    const metadata = { ...m, servings: String(m.servings), prep_time: minutes(m.prep_minutes, language), cook_time: minutes(m.cook_minutes, language), rest_time: minutes(m.rest_minutes, language), total_time: minutes(m.total_minutes, language) };
    return {
      recipeVersion: VERSION, dietaryPreference: recipe.dietaryPreference,
      main: { ...part(recipe.main), metadata, step_timing: recipe.main.step_timing.map(t => ({ phase: t.phase, minutes: t.minutes })), equipment: [...recipe.main.equipment], chefTips: strings(recipe.main.chefTips) ? [...recipe.main.chefTips] : [],
        prepTime: metadata.prep_time, cookTime: metadata.cook_time, totalTime: metadata.total_time, difficulty: m.difficulty || "" },
      sauces: recipe.sauces.map(part), sides: recipe.sides.map(part),
      drinkPairings: list(recipe.drinkPairings).filter(d => text(d?.name)).map(d => ({ name: d.name, description: d.description || "" }))
    };
  }
  return { VERSION, SOURCE_URL, check, normalize, safetyReference, cookingReference, prepareDraft };
});
