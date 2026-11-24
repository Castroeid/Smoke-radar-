const { test } = require('node:test');
const assert = require('node:assert/strict');
const Guide = require('../public/app/butcher-guide.js');
const Fallback = require('../public/app/recipe-fallback.js');
const Quality = require('../public/app/recipe-quality.js');
const Store = require('../public/app/recipe-store.js');

test('butcher requests distinguish ground meat, quick cuts and slow cuts, and scale the buying weight', () => {
  const burger = Guide.build('burgers', 6);
  assert.equal(burger.weight, 1200);
  assert.match(burger.request, /1200.*אונטריב.*מס׳ 2/);
  assert.match(burger.request, /20%.*בסך התערובת/);
  assert.match(burger.request, /המשקל כולל את השומן/);
  assert.match(Guide.build('stir_fry').request, /שייטל.*13.*רצועות/);
  assert.match(Guide.build('roast').request, /סינטה.*11.*להשאיר שלם/);
  assert.match(Guide.build('stew').request, /קוביות.*בישול ממושך/);
  assert.doesNotMatch(Guide.build('skewers').request, /אונטריב/);
  for (const goal of Guide.goals) for (const lang of ['he', 'en']) {
    const r = Guide.build(goal.id, 3, lang);
    assert.equal(r.weight, r.gramsPerServing * 3);
    assert.doesNotMatch(r.request, /undefined|NaN/);
    assert.ok(r.sources.length && r.sources.every(s => new URL(s.url).protocol === 'https:'));
  }
  assert.equal(Guide.build('unknown', -10).servings, 1);
  assert.equal(Guide.build('burgers', 1000).servings, 20);
});

test('new cuts retain their identity through standard fallback, quality checks and saved recipes', () => {
  for (const [cutId, name, methodId] of [['rump', 'שייטל', 'grill'], ['chuck_roll', 'אונטריב', 'long_cook']]) {
    const context = { cutId, cut: name, methodId, language: 'he', meatType: 'beef', equipmentMode: 'standard', servings: 4 };
    const recipe = Fallback.create(context);
    assert.match(recipe.main.title, new RegExp(name));
    assert.match(recipe.main.ingredients[0], new RegExp(name));
    assert.deepEqual(Quality.check(recipe, context).issues, []);
    const stored = Store.normalize({ ...recipe, id: 'new-cut', title: recipe.main.title, preferences: context });
    assert.equal(stored.preferences.cutId, cutId);
    if (cutId === 'chuck_roll') {
      assert.equal(recipe.generation.profile, 'braise');
      const incomplete = structuredClone(recipe);
      incomplete.main.metadata.target_internal_c = 63;
      assert.equal(Quality.check(incomplete, context).passed, false);
    }
  }
});
