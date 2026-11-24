const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const fixture = require("./fixtures/recipe.cjs");
const Quality = require("../public/app/recipe-quality.js");
let JSDOM;
try { ({ JSDOM } = require("jsdom")); } catch { /* Optional QA dependency. */ }
const settle = () => new Promise(resolve => setImmediate(resolve));

async function setup() {
  const dom = new JSDOM(fs.readFileSync("public/app/index.html", "utf8"), {
    url: "https://smoke-radar.onrender.com/app/", runScripts: "outside-only", pretendToBeVisual: true
  });
  const { window } = dom;
  window.fetch = async () => ({ ok: true, json: async () => ({ enabled: false }) });
  window.Image = class { set src(value) { queueMicrotask(() => this.onload?.()); } };
  const execute = code => vm.runInContext(code, dom.getInternalVMContext());
  for (const file of ["hot-topics.js", "recipe-quality.js", "recipe-guidance.js", "recipe-fallback.js", "recipe-store.js", "app.js"]) execute(fs.readFileSync(`public/app/${file}`, "utf8"));
  await settle();
  execute('state.lang = "he"; state.preferences.cutId = "brisket"; state.preferences.methodId = "oven"; state.preferences.dietaryPreference = "kosher";');
  return { dom, window, execute, document: window.document };
}

test("oven steps, quantities and names survive rendering, shopping, saving and reopening", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    const r = Quality.normalize(fixture(), "he");
    c.execute(`state.recipe = enhanceRecipeQuality(${JSON.stringify(r)}); state.shopping = buildShoppingList(state.recipe); currentStep = STEPS.indexOf("recipe"); renderRecipe();`);
    const text = c.document.getElementById("screenContent").textContent;
    assert.match(text, /מתכון עם הערות הכנה/);
    assert.match(text, /טרם נוסה במטבח/);
    assert.match(text, /1000.*גרם/);
    assert.doesNotMatch(text, /מעשנה|מרינדה:/);
    assert.match(text, /רוטב לימון/);
    assert.match(text, /800 גרם תפוחי אדמה/);
    assert.deepEqual(JSON.parse(c.execute("JSON.stringify(state.recipe.main.steps)")), r.main.steps);
    const shopping = JSON.parse(c.execute("JSON.stringify(state.shopping)"));
    for (const line of r.main.ingredients) assert.ok(Object.values(shopping).flat().includes(line), line);
    await c.execute("saveCurrentRecipe()");
    c.execute('state.recipe = null; openSavedRecipe(state.savedRecipes[0].id);');
    assert.match(c.document.getElementById("screenContent").textContent, /מתכון עם הערות הכנה/);
    assert.deepEqual(JSON.parse(c.execute("JSON.stringify(state.recipe.main.steps)")), r.main.steps);
    c.execute("state.recipe.main.metadata.total_minutes = 1; renderRecipe();");
    assert.match(c.document.getElementById("screenContent").textContent, /פירוט הזמנים אינו מלא או אינו עקבי/);
  } finally { c.dom.window.close(); }
});

test("old recipes have neither a passing label nor invented times, sauces or sides", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    c.execute('state.recipe = { main: { title: "ישן", ingredients: ["בשר"], steps: ["לבשל"] }, sauces: [], sides: [] }; renderRecipe();');
    assert.equal(c.document.querySelector(".recipe-check-label"), null);
    const text = c.document.getElementById("screenContent").textContent;
    assert.doesNotMatch(text, /20 דקות|45 דקות|65 דקות|צ׳ימיצ׳ורי/);
    assert.match(text, /אין בדיקת שלמות עדכנית/);
  } finally { c.dom.window.close(); }
});

test("server errors show a complete baseline without a retry loop; regenerate can succeed", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    let calls = 0;
    c.window.fetch = async () => { calls++; return { ok: false, json: async () => ({ error: "recipe_incomplete" }) }; };
    c.execute('state.recipe = null; currentStep = STEPS.indexOf("recipe"); renderRecipe();');
    await settle(); await settle();
    assert.equal(calls, 1);
    assert.match(c.document.getElementById("screenContent").textContent, /מתכון בסיסי חלופי/);
    assert.equal(c.execute("state.recipeLoading"), false);
    assert.ok(c.document.getElementById("saveRecipeBtn"));
    const r = Quality.normalize(fixture(), "he");
    c.window.fetch = async () => { calls++; return { ok: true, json: async () => ({ structuredRecipe: r }) }; };
    c.execute('state.recipe = null; renderRecipe();');
    await settle(); await settle();
    assert.equal(calls, 2);
    assert.ok(c.document.querySelector(".recipe-caveat-label"));
  } finally { c.dom.window.close(); }
});

test("recipe loading cannot overwrite a saved recipe opened while a request is pending", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    let resolve;
    c.window.fetch = () => new Promise(r => { resolve = r; });
    const pending = c.execute("loadRecipe()");
    c.execute('state.recipe = { main: { title: "המתכון שפתחתי" } };');
    resolve({ ok: true, json: async () => ({ structuredRecipe: Quality.normalize(fixture(), "he") }) });
    await pending;
    assert.equal(c.execute("state.recipe.main.title"), "המתכון שפתחתי");
  } finally { c.dom.window.close(); }
});


test("caveats and sourced tips survive guest storage; incomplete timing never claims a total", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    const raw = fixture(); delete raw.main.metadata.piece_thickness_cm; raw.main.steps[1] += " במשך 30 דקות.";
    const r = Quality.normalize(raw, "he");
    c.window.fetch = async () => ({ ok: true, json: async () => ({ structuredRecipe: r }) });
    await c.execute("loadRecipe()"); c.execute('currentStep = STEPS.indexOf("recipe"); renderRecipe();');
    let text = c.document.getElementById("screenContent").textContent;
    assert.match(text, /עובי הנתח חסר/); assert.match(text, /פירוט הזמנים אינו מלא/);
    assert.doesNotMatch(text, /290 דקות|עבר בדיקת שלמות/);
    const expectedTips = r.main.steps.length + r.sauces[0].steps.length + r.sides[0].steps.length;
    assert.equal(c.document.querySelectorAll(".recipe-step-tip a").length, expectedTips);
    await c.execute("saveCurrentRecipe()"); c.execute('state.recipe = null; openSavedRecipe(state.savedRecipes[0].id);');
    text = c.document.getElementById("screenContent").textContent;
    assert.match(text, /עובי הנתח חסר/);
    assert.equal(c.document.querySelectorAll(".recipe-step-tip a").length, expectedTips);
    for (const link of c.document.querySelectorAll(".recipe-step-tip a")) assert.equal(new URL(link.href).protocol, "https:");
  } finally { c.dom.window.close(); }
});

test("a network fallback retains its reason and actual method when saved and reopened", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    c.window.fetch = async () => { throw new TypeError("offline"); };
    c.execute('state.preferences.methodId = "smoker";');
    await c.execute("loadRecipe()"); c.execute('currentStep = STEPS.indexOf("recipe"); renderRecipe();');
    await c.execute("saveCurrentRecipe()"); c.execute('state.recipe = null; openSavedRecipe(state.savedRecipes[0].id);');
    assert.equal(c.execute("state.recipe.generation.reason"), "network");
    assert.equal(c.execute("state.recipe.generation.method"), "oven");
    assert.match(c.document.getElementById("screenContent").textContent, /לא התקבלה תשובה מהשרת/);
  } finally { c.dom.window.close(); }
});

test("recipe notes and sourced tips start collapsed while cooking targets stay visible", { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    const r = Quality.normalize(fixture(), "he");
    c.execute(`state.recipe = ${JSON.stringify(r)}; renderRecipe();`);
    const review = c.document.querySelector('details.recipe-quality');
    assert.equal(review.open, false);
    assert.equal(review.querySelector('summary').textContent, 'פרטים והערות למתכון');
    assert.match(c.document.querySelector('.recipe-cooking-facts').textContent, /טמפרטורת ליבה/);
    assert.equal(c.document.querySelector('.recipe-cooking-facts').closest('details'), null);
    const tips = [...c.document.querySelectorAll('details.recipe-step-tip')];
    assert.ok(tips.length > 0);
    assert.ok(tips.every(tip => !tip.open && tip.querySelector('a[href^="https:"]')));
    tips[0].querySelector('summary').click();
    assert.equal(tips[0].open, true);
    assert.ok(tips.slice(1).every(tip => !tip.open));
    tips[0].querySelector('summary').click();
    assert.equal(tips[0].open, false);
    review.querySelector('summary').click();
    assert.equal(review.open, true);
    assert.match(review.textContent, /טרם נוסה במטבח/);
  } finally { c.dom.window.close(); }
});
