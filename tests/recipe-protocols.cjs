const { test } = require('node:test');
const assert = require('node:assert/strict');
const Protocols = require('../public/app/recipe-protocols.js');
const Quality = require('../public/app/recipe-quality.js');
const Fallback = require('../public/app/recipe-fallback.js');
const Guidance = require('../public/app/recipe-guidance.js');
const Store = require('../public/app/recipe-store.js');
const { createRecipeHandler } = require('../lib/recipe-generation.js');
const base = { language: 'he', meatType: 'beef', cutId: 'ribeye', servings: 4, dietaryPreference: 'kosher', flavorId: 'smoky', equipmentMode: 'basic', methodId: 'pan_sear', thicknessCm: 2.5 };

test('equipment recipes stay complete across cuts, meats, quantities, languages and flavour choices', () => {
  for (const language of ['he', 'en']) for (const meatType of ['beef', 'lamb', 'veal']) {
    for (const cutId of ['ribeye', 'brisket', 'asado', 'picanha', 'sirloin', 'filet', 'short_ribs', 'chuck', 'flank', 'striploin', 'tenderloin', 'rump', 'chuck_roll']) {
      for (const servings of [1, 4, 20]) for (const flavorId of ['classic', 'garlic_herbs', 'sweet_smoky']) {
        for (const mode of ['basic', 'sous_vide']) {
          const c = { ...base, language, meatType, cutId, servings, flavorId, equipmentMode: mode === 'basic' ? 'basic' : 'standard', methodId: mode === 'basic' ? (Protocols.tough(cutId) ? 'long_cook' : 'pan_sear') : 'sous_vide' };
          const r = Fallback.create(c, 'network');
          assert.deepEqual(Quality.check(r, c).issues, [], JSON.stringify(c));
          assert.equal(r.generation.kind, 'guided');
          if (mode === 'basic') {
            assert.doesNotMatch(r.main.equipment.join(' '), /מדחום|thermometer|sous.vide|circulator|vacuum/i);
            assert.equal(r.main.metadata.target_internal_c, undefined);
            assert.match(r.main.steps.join(' '), /אדים|steam/);
            assert.match(r.main.steps.join(' '), /בודקים שוב|recheck/);
            assert.match(r.main.steps.join(' '), /3 ס״מ|3 cm|חצי ס״מ|0.5 cm/);
          }
          const saved = Store.normalize({ ...r, id: 'saved-path', title: r.main.title, preferences: c });
          const { language: ignored, ...reopened } = saved.preferences;
          assert.deepEqual(Quality.check(saved, reopened).issues, [], 'saved recipe retains its language, equipment and schedule');
          assert.equal(saved.preferences.equipmentMode, c.equipmentMode);
          assert.equal(saved.generation.kind, 'guided');
          for (const [i, step] of saved.main.steps.entries()) {
            const tip = Guidance.tipFor(step, { recipe: saved, context: reopened, phase: saved.main.step_timing[i].phase }, language);
            assert.ok(tip.source.url.startsWith('https://'));
            if (mode === 'basic') assert.notEqual(tip.id, 'thermometer');
          }
        }
      }
    }
  }
});

test('sous-vide bath duration follows thickness, not number of portions', () => {
  // Minimum Table 5.1 times at 65 C for 5 C starting temperature, slab geometry.
  const reference = { 2: 45, 2.5: 55, 3: 75, 4: 90, 5: 120 };
  for (const thicknessCm of Protocols.THICKNESSES) {
    const c = { ...base, equipmentMode: 'standard', methodId: 'sous_vide', thicknessCm };
    const small = Fallback.create({ ...c, servings: 1 }), large = Fallback.create({ ...c, servings: 20 });
    assert.equal(small.main.metadata.bath_temperature_c, 65);
    assert.ok(small.main.metadata.bath_minutes >= reference[thicknessCm]);
    assert.equal(large.main.metadata.bath_minutes, small.main.metadata.bath_minutes);
    assert.match(small.main.steps.join(' '), /מופשר לחלוטין/);
    assert.match(small.main.steps.join(' '), /חזר ל־65°C/);
  }
});

test('every basic cooking method generates its own equipment and instructions and survives saving', () => {
  for (const language of ['he', 'en']) for (const meatType of ['beef', 'lamb', 'veal']) {
    for (const cutId of ['ribeye', 'brisket', 'asado', 'picanha', 'sirloin', 'filet', 'short_ribs', 'chuck', 'flank', 'striploin', 'tenderloin', 'rump', 'chuck_roll']) {
      for (const methodId of Protocols.basicMethods(cutId)) for (const servings of [1, 4, 20]) {
        const c = { ...base, language, meatType, cutId, methodId, servings };
        const r = Fallback.create(c, 'network');
        assert.deepEqual(Quality.check(r, c).issues, [], JSON.stringify(c));
        assert.doesNotMatch(r.main.equipment.join(' '), /מדחום|thermometer|sous.vide|circulator|vacuum/i);
        const saved = Store.normalize({ ...r, id: 'basic-method', title: r.main.title, preferences: c });
        assert.equal(saved.preferences.methodId, methodId);
        assert.equal(Quality.review(saved, saved.preferences).passed, true);
        const instructions = r.main.steps.join(' '), equipment = r.main.equipment.join(' ');
        if (['grill', 'bbq', 'oven', 'bbq_finish'].includes(methodId)) {
          assert.equal(saved.main.metadata.cooking_method, methodId);
          assert.equal(saved.main.metadata.cooking_protocol, 'basic_v2');
          assert.match(instructions, /אדים|steam/);
          assert.match(instructions, /בודקים שוב|recheck/);
          if (methodId === 'oven' || methodId === 'bbq_finish') assert.match(equipment, /תנור|Oven/);
          else assert.doesNotMatch(equipment, /תנור|Oven|כיריים|Hob|מחבת|frying pan/);
          if (methodId === 'bbq_finish') {
            assert.match(instructions, /אחרי שהבשר כבר רך ומבושל|after cooking and tenderising are complete/);
            assert.match(equipment, /ללא מכסה|lid is not needed/);
          } else if (Protocols.tough(cutId) && ['grill', 'bbq'].includes(methodId)) {
            assert.match(equipment, /עם מכסה|with lid/);
            assert.match(instructions, /ללא מבער דולק או גחלים מתחתיה|no lit burner or coals underneath/);
          } else if (!Protocols.tough(cutId)) assert.equal(r.main.metadata.piece_thickness_cm, 1.5);
        }
        for (const [i, step] of r.main.steps.entries()) {
          const tip = Guidance.tipFor(step, { recipe: r, context: c, phase: r.main.step_timing[i].phase }, language);
          assert.notEqual(tip.id, 'thermometer');
          assert.notEqual(tip.id, 'preheat', 'do not suggest an oven thermometer in the basic path');
        }
      }
    }
  }
});

test('grill and barbecue selection is enforced by the API and recipe validator', async () => {
  for (const cutId of ['ribeye', 'picanha', 'brisket']) for (const methodId of Protocols.basicMethods(cutId)) {
    const query = { ...base, cutId, methodId, lang: 'he' };
    const { status, result } = await call(query, false);
    assert.equal(status, 200);
    assert.equal(Quality.review(result.structuredRecipe, query).passed, true);
    if (methodId === 'grill') assert.equal(Quality.review(result.structuredRecipe, { ...query, methodId: 'bbq' }).usable, false, 'gas instructions cannot masquerade as a charcoal recipe');
  }
  for (const query of [
    { ...base, cutId: 'brisket', methodId: 'pan_sear' },
    { ...base, methodId: 'bbq_finish' },
    { ...base, methodId: 'smoker' },
    { ...base, methodId: 'unknown' }
  ]) assert.equal((await call(query)).status, 400, 'unsupported basic combinations fail rather than silently changing method');
});

test('equipment flags cannot exempt arbitrary instructions or altered schedules from safety checks', () => {
  const c = { ...base, equipmentMode: 'standard', methodId: 'sous_vide' };
  for (const change of [
    r => r.main.step_timing[r.main.metadata.bath_step_index].minutes = 5,
    r => r.main.metadata.bath_temperature_c = 45,
    r => r.main.metadata.piece_thickness_cm = 12,
    r => r.main.steps[0] = 'הכניסו בשר קפוא',
    r => r.main.steps[3] = 'מוציאים אחרי 5 דקות',
    r => r.main.equipment = [],
    r => r.main.metadata.target_internal_c = 45
  ]) {
    const r = Fallback.create(c); change(r);
    assert.equal(Quality.review(Quality.prepareDraft(r), c).usable, false);
  }
  const basic = Fallback.create(base);
  basic.main.steps[2] = 'הגישו נא';
  assert.equal(Quality.review(basic, base).usable, false);
  assert.equal(Quality.review(Fallback.create(c), { ...c, methodId: 'grill' }).usable, false);
});

async function call(query, configured = true) {
  let result, status = 200;
  const handler = createRecipeHandler({ isConfigured: () => configured, client: { chat: { completions: { create() { throw new Error('model must not invent a protocol'); } } } } });
  await handler({ query }, { set() {}, status(code) { status = code; return this; }, json(body) { result = body; } });
  return { status, result };
}
test('API validates unsupported choices and serves selected paths even without an AI key', async () => {
  for (const configured of [true, false]) for (const mode of ['basic', 'sous_vide']) {
    const c = { ...base, lang: 'he', equipmentMode: mode === 'basic' ? 'basic' : 'standard', methodId: mode === 'basic' ? 'pan_sear' : 'sous_vide' };
    const { status, result } = await call(c, configured);
    assert.equal(status, 200);
    assert.equal(result.source, 'guided');
    assert.deepEqual(Quality.check(result.structuredRecipe, c).issues, []);
    assert.match(result.structuredRecipe.main.ingredients.join(' '), /פפריקה מעושנת/);
    if (mode === 'sous_vide') assert.match(result.recipe, /ללא קיצור/);
  }
  for (const query of [
    { ...base, lang: 'he', methodId: 'sous_vide' },
    { ...base, equipmentMode: 'standard', methodId: 'sous_vide', thicknessCm: 8 },
    { ...base, meatType: 'poultry' },
    { ...base, cutId: 'unknown' }
  ]) assert.equal((await call(query)).status, 400);
});
