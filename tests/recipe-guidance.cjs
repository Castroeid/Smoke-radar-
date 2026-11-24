const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Quality = require("../public/app/recipe-quality.js");
const Guidance = require("../public/app/recipe-guidance.js");
const Fallback = require("../public/app/recipe-fallback.js");
const fixture = require("./fixtures/recipe.cjs");

test("baseline families remain complete across serving counts, languages and requested methods", () => {
  for (const meatType of ["beef", "lamb", "veal", "chicken", "ground beef"]) {
    for (const cutId of ["ribeye", "brisket", "asado", "chuck", "picanha"]) {
      for (const methodId of ["grill", "smoker", "oven", "cast_iron"]) {
        for (const servings of [1, 4, 20]) for (const language of ["he", "en"]) {
          const context = { meatType, cutId, methodId, servings, language, dietaryPreference: "kosher" };
          const recipe = Fallback.create(context, "incomplete");
          const review = Quality.review(recipe, Guidance.effectiveContext(recipe, context));
          assert.deepEqual(review.issues, [], JSON.stringify(context));
          assert.equal(Number(recipe.main.metadata.servings), servings);
          assert.equal(recipe.generation.kind, "baseline");
          assert.match(Guidance.reviewHTML(recipe, context, "en"), /not applied/);
        }
      }
    }
  }
});

test("only reviewed catalog links can appear beside steps; action matching is contextual", () => {
  const recipe = fixture(), context = { cutId: "brisket", methodId: "oven" };
  for (const [step, phase, section, expected] of [
    ["משרים במרינדה במקרר", "prep", "main", "marinate"],
    ["משחימים את הבשר בסבבים", "cook", "main", "brown"],
    ["מחממים תנור ומכינים כלים", "prep", "main", "preheat"],
    ["מודדים טמפרטורת ליבה במדחום", "cook", "main", "thermometer"],
    ["מניחים לנוח בנוזלי הבישול", "rest", "main", "braiseRest"],
    ["פורסים בניצב לסיבים", "rest", "main", "slice"],
    ["שוטפים מלפפון וחותכים", undefined, "side", "produce"],
    ["שומרים במקרר עד ההגשה", undefined, "side", "keepCold"]
  ]) {
    const tip = Guidance.tipFor(step, { phase, section, recipe, context }, "he");
    assert.equal(tip.id, expected);
    assert.ok(Object.values(Guidance.SOURCES).includes(tip.source));
    assert.equal(new URL(tip.source.url).protocol, "https:");
  }
  const html = Guidance.stepHTML('Read <script>alert(1)</script> https://evil.example', { recipe, context }, "en");
  assert.doesNotMatch(html, /evil|<script>/);
  const old = Guidance.reviewHTML(fixture(), context, "en");
  assert.match(old, /no current completeness check/);
});

test("optional omissions are advisories, while malformed ingredient or step lists remain blocking", () => {
  for (const mutate of [r => r.main.ingredients = [], r => r.main.steps = [], r => r.sauces = [{ name: "broken" }], r => r.sauces = [{}, {}, {}, {}]]) {
    const r = fixture(); mutate(r);
    assert.equal(Quality.review(r).usable, false);
  }
  const r = fixture(); r.sauces = null; delete r.main.metadata.piece_thickness_cm;
  assert.equal(Quality.review(r).usable, true);
  const html = Guidance.reviewHTML(Quality.normalize(r, "he"), {}, "he");
  assert.match(html, /עובי הנתח חסר/);
  assert.match(html, /לא התקבל מתכון לרוטב/);
  assert.doesNotMatch(html, /עבר בדיקת שלמות אוטומטית|לא זיהתה חוסרים/);
});

test("desktop normalization preserves caveats, real tips and actual fallback method", () => {
  const html = fs.readFileSync("public/index.html", "utf8");
  const extract = name => {
    const start = html.indexOf(`    function ${name}(`);
    const end = html.indexOf("\n    function ", start + 15);
    return html.slice(start, end);
  };
  const sandbox = { RecipeQuality: Quality, RecipeGuidance: Guidance, currentLanguage: "he", getRecipeCutLabel: () => "בריסקט", t: x => x,
    escapeHtml: x => String(x ?? "").replaceAll("<", "&lt;").replaceAll(">", "&gt;") };
  vm.createContext(sandbox);
  vm.runInContext(extract("normalizeStructuredRecipe") + extract("mergeStructuredRecipe") + extract("renderSmartRecipe"), sandbox);
  const raw = fixture(); delete raw.main.metadata.piece_thickness_cm;
  const recipe = sandbox.normalizeStructuredRecipe(Quality.normalize(raw, "he"));
  const rendered = sandbox.renderSmartRecipe(recipe, { cut: "בריסקט", method: "תנור" });
  assert.match(rendered, /עובי הנתח חסר/);
  assert.equal((rendered.match(/class="recipe-step-tip"/g) || []).length, 8);
  assert.doesNotMatch(rendered, /משך הזמנים אינו|NaN|undefined/);
  const alternate = sandbox.normalizeStructuredRecipe(Fallback.create({ language: "he", cutId: "brisket", methodId: "smoker" }, "service_unavailable"));
  assert.match(sandbox.renderSmartRecipe(alternate, { cut: "בריסקט", method: "מעשנה" }), /מתכון בסיסי חלופי/);
  const mixed = sandbox.mergeStructuredRecipe(recipe, alternate, "sauces");
  assert.equal(mixed.generation.kind, "ai");
  assert.equal(mixed.sectionGenerations.sauces.kind, "baseline");
  assert.match(sandbox.renderSmartRecipe(mixed, { cut: "בריסקט", method: "תנור" }), /הרוטב הוחלף בגרסה בסיסית/);
});
