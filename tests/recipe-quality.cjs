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

test("malformed output gets one bounded repair and is never filled with a generic recipe", async () => {
  const result = await run(["{broken", fixture()]);
  assert.equal(result.response.statusCode, 200);
  assert.equal(result.calls.length, 2);
  assert.deepEqual(result.response.body.structuredRecipe.main.steps, fixture().main.steps);
  assert.match(result.calls[1].messages.at(-1).content, /missing object/);
  const failed = await run([{ main: {} }, "{}"]);
  assert.equal(failed.response.statusCode, 422);
  assert.deepEqual(failed.response.body, { error: "recipe_incomplete" });
  assert.equal(failed.calls.length, 2);
});

test("API failures are recoverable errors and invalid servings make no model calls", async () => {
  assert.equal((await run([new Error("provider failed")])).response.statusCode, 503);
  for (const value of ["0", "21", "NaN", "2.5", ""]) {
    const result = await run([], { servings: value });
    assert.equal(result.response.statusCode, 400); assert.equal(result.calls.length, 0);
  }
  assert.equal(requestContext({}).servings, 4);
});
