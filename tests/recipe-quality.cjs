const { test } = require("node:test");
const assert = require("node:assert/strict");
const Quality = require("../public/app/recipe-quality.js");
const Store = require("../public/app/recipe-store.js");
const { createRecipeHandler, requestContext } = require("../lib/recipe-generation.js");
const fixture = require("./fixtures/recipe.cjs");
const context = { language: "he", servings: 4, meatType: "beef", dietaryPreference: "kosher" };

test("complete recipe preserves instructions and numeric metadata through normalization and storage", () => {
  const raw = fixture();
  assert.deepEqual(Quality.check(raw, context).issues, []);
  const value = Quality.normalize(raw, "he");
  assert.deepEqual(value.main.steps, raw.main.steps);
  assert.equal(value.main.totalTime, "290 דקות");
  const saved = Store.normalize({ id: "checked", title: value.main.title, ...value, drinks: value.drinkPairings, preferences: context });
  assert.equal(saved.main.metadata.cook_minutes, 240);
  assert.deepEqual(saved.main.equipment, raw.main.equipment);
  assert.deepEqual(Quality.check(saved, context).issues, []);
});

test("missing lists, quantities, units, steps and equipment cannot receive a completeness result", () => {
  for (const mutate of [
    r => r.main.ingredients = [], r => r.main.steps = [], r => r.main.equipment = [],
    r => r.main.ingredients.push("מלח לפי הטעם"), r => r.main.ingredients.push("1 מלח"),
    r => r.main.ingredients.push("0 גרם מלח"), r => r.main.ingredients.push("1/0 כף שמן"),
    r => delete r.sides[0].ingredients, r => r.sauces[0].steps = [], r => r.sides = {}, r => r.sauces = null
  ]) { const r = fixture(); mutate(r); assert.equal(Quality.check(r, context).passed, false); }
});

test("serving mismatch, missing weight, conflicting weight and time arithmetic fail", () => {
  for (const mutate of [
    r => r.main.metadata.servings = 2,
    r => r.main.metadata.total_minutes = 260,
    r => delete r.main.metadata.piece_thickness_cm,
    r => r.main.metadata.meat_weight_g = 1500,
    r => r.main.metadata.cook_minutes = "240",
    r => r.main.metadata.rest_minutes = -3
  ]) { const r = fixture(); mutate(r); assert.equal(Quality.check(r, context).passed, false); }
});

test("solid vegetable measurements cannot masquerade as liquid units, while juices and purees remain valid", () => {
  for (const line of ['1 מ"ל מלפפון', '1 מל cucumber', '100 ml carrots', '2 ליטר תפוחי אדמה']) {
    const r = fixture(); r.sides[0].ingredients.push(line);
    assert.equal(Quality.check(r, context).passed, false, line);
  }
  for (const line of ['1 יחידה מלפפון', '200 גרם מלפפון', '1 כוס מלפפון קצוץ', '30 מ"ל מיץ מלפפון', '200 ml tomato puree']) {
    const r = fixture(); r.sides[0].ingredients.push(line);
    assert.equal(Quality.check(r, context).passed, true, line);
  }
});

test("total time comes from every step, including additional finishing and resting", () => {
  const r = fixture();
  r.main.steps.splice(3, 0, "מסירים את הכיסוי ומשחימים בתנור.");
  r.main.step_timing.splice(3, 0, { phase: "cook", minutes: 30 });
  assert.equal(Quality.check(r, context).passed, false);
  const calculated = Quality.prepareDraft(r);
  assert.equal(calculated.main.metadata.cook_minutes, 270);
  assert.equal(calculated.main.metadata.total_minutes, 320);
  assert.equal(Quality.check(calculated, context).passed, true);
  calculated.main.steps[3] += " במשך 30 דקות.";
  assert.equal(Quality.check(calculated, context).passed, true);
  calculated.main.steps[3] += " ועוד 30 דקות.";
  assert.equal(Quality.check(calculated, context).passed, false, "every finishing stage must be counted");
});

test("generated step objects retain each action and its duration without parallel-array drift", () => {
  const r = fixture();
  const originalSteps = [...r.main.steps], originalTiming = structuredClone(r.main.step_timing);
  r.main.steps = r.main.steps.map((text, i) => ({ text, ...r.main.step_timing[i] }));
  delete r.main.step_timing;
  delete r.main.metadata.total_minutes;
  const prepared = Quality.prepareDraft(r);
  assert.deepEqual(prepared.main.steps, originalSteps);
  assert.deepEqual(prepared.main.step_timing, originalTiming);
  assert.equal(prepared.main.metadata.total_minutes, 290);
  assert.equal(Quality.check(prepared, context).passed, true);
  delete r.main.steps[1].minutes;
  assert.equal(Quality.check(Quality.prepareDraft(r), context).passed, false, "missing timing is not invented");
});

test("slow brisket and short ribs cannot use the safety minimum as their tenderness target", () => {
  for (const cutId of ["brisket", "short_ribs", "asado"]) {
    const r = fixture();
    const c = { ...context, cutId, methodId: "oven" };
    assert.equal(Quality.check(r, c).passed, true);
    r.main.metadata.target_internal_c = 63;
    r.main.steps[2] = "מודדים טמפרטורת ליבה של 63°C ובודקים רכות.";
    assert.equal(Quality.check(r, c).passed, false);
    assert.equal(Quality.check(r, { ...context, cutId: "ribeye", methodId: "grill" }).passed, true);
  }
});

test("temperature guidance distinguishes whole cuts, ground meat, poultry and ground pepper", () => {
  const r = fixture();
  r.main.ingredients.push("1 tsp ground black pepper");
  assert.equal(Quality.safetyReference(r).minimumC, 63);
  for (const [meat, expected] of [["1000 g ground beef", 71], ["1000 גרם בשר טחון", 71], ["1000 g chicken", 74]]) {
    r.main.ingredients[0] = meat;
    assert.equal(Quality.safetyReference(r).minimumC, expected);
  }
  r.main.metadata.target_internal_c = 63;
  assert.equal(Quality.check(r, context).passed, false);
});

test("contradictory internal temperatures and a missing temperature in the steps fail", () => {
  const r = fixture(); r.main.metadata.target_internal_c = 63;
  assert.equal(Quality.check(r, context).passed, false);
  r.main.steps[2] = "מודדים טמפרטורת ליבה של 63°C.";
  assert.equal(Quality.check(r, context).passed, true);
  r.main.steps.push("טמפרטורת ליבה של 54°C מספיקה.");
  assert.equal(Quality.check(r, context).passed, false);
});

test("kosher requests reject dairy rather than swapping words in a recipe", () => {
  const r = fixture(); r.sauces[0].ingredients.push("50 גרם חמאה");
  assert.equal(Quality.check(r, context).passed, false);
  assert.equal(Quality.check(r, { ...context, dietaryPreference: "non_kosher" }).passed, false);
  r.dietaryPreference = "non_kosher";
  assert.equal(Quality.check(r, { ...context, dietaryPreference: "non_kosher" }).passed, true);
});

async function run(outputs, query = {}) {
  const calls = [];
  const client = { chat: { completions: { create: async args => {
    calls.push(structuredClone(args));
    const value = outputs[calls.length - 1];
    if (value instanceof Error) throw value;
    return { choices: [{ message: { content: typeof value === "string" ? value : JSON.stringify(value) } }] };
  } } } };
  const response = { statusCode: 200, headers: {}, set(k,v) { this.headers[k] = v; return this; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await createRecipeHandler({ client, isConfigured: () => true })({ query: { lang: "he", servings: "4", ...query } }, response);
  return { calls, response };
}

test("request sends actual servings and custom instructions to the model", async () => {
  const r = fixture(); r.main.metadata.servings = 6;
  const { response, calls } = await run([r], { servings: "6", method: "תנור", userQuestion: "בלי השריה" });
  assert.equal(response.statusCode, 200);
  const sent = JSON.parse(calls[0].messages[1].content);
  assert.equal(sent.servings, 6); assert.equal(sent.userQuestion, "בלי השריה"); assert.equal(sent.method, "תנור");
  assert.equal(response.headers["Cache-Control"], "no-store");
});

test("structured model output is validated and returned in the existing client recipe format", async () => {
  const r = fixture();
  r.main.steps = r.main.steps.map((text, i) => ({ text, ...r.main.step_timing[i] }));
  delete r.main.step_timing;
  const { response, calls } = await run([r]);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.structuredRecipe.main.steps, fixture().main.steps);
  assert.deepEqual(response.body.structuredRecipe.main.step_timing, fixture().main.step_timing);
  assert.equal(calls[0].response_format.type, "json_schema");
  assert.equal(calls[0].response_format.json_schema.strict, true);
});

test("malformed output gets one bounded repair, then a clearly identified complete alternative", async () => {
  const result = await run(["{broken", fixture()]);
  assert.equal(result.response.statusCode, 200);
  assert.equal(result.calls.length, 2);
  assert.deepEqual(result.response.body.structuredRecipe.main.steps, fixture().main.steps);
  assert.match(result.calls[1].messages.at(-1).content, /missing object/);
  const failed = await run([{ main: {} }, "{}"]);
  assert.equal(failed.response.statusCode, 200);
  assert.equal(failed.response.body.source, "baseline");
  assert.equal(failed.response.body.structuredRecipe.generation.kind, "baseline");
  assert.equal(Quality.check(failed.response.body.structuredRecipe, context).passed, true);
  assert.equal(failed.calls.length, 2);
});

test("API failures return an honest baseline and invalid servings make no model calls", async () => {
  const failed = await run([new Error("provider failed")]);
  assert.equal(failed.response.statusCode, 200);
  assert.equal(failed.response.body.structuredRecipe.generation.reason, "service_unavailable");
  for (const value of ["0", "21", "NaN", "2.5", ""]) {
    const result = await run([], { servings: value });
    assert.equal(result.response.statusCode, 400); assert.equal(result.calls.length, 0);
  }
  assert.equal(requestContext({}).servings, 4);
});


test("nonessential gaps return the actual AI recipe with specific caveats after bounded repair", async () => {
  const r = fixture(); delete r.main.metadata.piece_thickness_cm; delete r.main.equipment; r.sides = [];
  const { response, calls } = await run([r, r]);
  assert.equal(response.statusCode, 200); assert.equal(calls.length, 2);
  const recipe = response.body.structuredRecipe;
  assert.equal(recipe.generation.kind, "ai");
  assert.deepEqual(recipe.main.steps, r.main.steps);
  assert.equal(recipe.main.metadata.piece_thickness_cm, undefined);
  assert.deepEqual(Quality.review(recipe, context).warnings.sort(), ["equipment", "sides", "thickness"]);
});

test("usable first draft survives a failed repair call", async () => {
  const r = fixture(); delete r.main.metadata.piece_thickness_cm;
  const { response } = await run([r, new Error("unavailable")]);
  assert.equal(response.body.source, "ai");
  assert.deepEqual(response.body.structuredRecipe.main.steps, r.main.steps);
});

test("unsafe targets and preservation protocols cannot be displayed by downgrading to caveats", async () => {
  for (const mutate of [
    r => { r.main.metadata.target_internal_c = 54; r.main.steps[2] = "טמפרטורת ליבה של 54°C"; },
    r => { r.main.step_timing[3].minutes = 0; },
    r => { r.main.steps[0] += " מוסיפים מלח כבישה."; }
  ]) {
    const r = fixture(); mutate(r);
    const { response } = await run([r, r]);
    const recipe = response.body.structuredRecipe;
    assert.equal(recipe.generation.kind, "baseline");
    assert.equal(recipe.generation.reason, "safety");
    assert.doesNotMatch(recipe.main.steps.join(" "), /54°C|מלח כבישה/);
    assert.equal(Quality.review(recipe, context).usable, true);
  }
});
