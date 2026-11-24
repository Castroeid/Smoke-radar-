const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const fixture = require('./fixtures/recipe.cjs');
const Quality = require('../public/app/recipe-quality.js');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch { /* Optional UI QA dependency. */ }
const settle = () => new Promise(resolve => setImmediate(resolve));
async function setup() {
  const dom = new JSDOM(fs.readFileSync('public/app/index.html', 'utf8'), {
    url: 'https://smoke-radar.onrender.com/app/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window, d = w.document;
  const style = d.createElement("style"); style.textContent = fs.readFileSync("public/app/app.css", "utf8"); d.head.append(style);
  const execute = code => vm.runInContext(code, dom.getInternalVMContext());
  const recipe = Quality.normalize(fixture(), 'he');
  w.scrollTo = () => {};
  w.fetch = async url => ({ ok: true, json: async () => url.includes('recipe-account-config') ? { enabled: false } : { structuredRecipe: recipe } });
  w.Image = class { set src(value) { queueMicrotask(() => this.onload?.()); } };
  for (const file of ['hot-topics.js', 'recipe-protocols.js', 'recipe-quality.js', 'recipe-guidance.js', 'recipe-fallback.js', 'recipe-store.js', 'app.js']) execute(fs.readFileSync(`public/app/${file}`, 'utf8'));
  await settle();
  const screen = () => d.getElementById('app').dataset.step;
  const click = id => { const e = d.getElementById(id); assert.ok(e, id); e.click(); };
  return { dom, w, d, execute, recipe, screen, click };
}

test('the single generate button returns to the generator with its choices intact, then home', { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    for (const button of ['nextBtn']) {
      c.d.querySelector('[data-choice="feel"]').click();
      const cut = c.d.getElementById('cutId'); cut.value = 'brisket'; cut.dispatchEvent(new c.w.Event('change'));
      const question = c.d.getElementById('userQuestion'); question.value = 'עם מעט חריפות'; question.dispatchEvent(new c.w.Event('input'));
      c.click(button); await settle(); await settle();
      assert.equal(c.screen(), 'recipe');
      c.click('backBtn');
      assert.equal(c.screen(), 'preferences');
      assert.equal(c.d.getElementById('cutId').value, 'brisket');
      assert.equal(c.d.getElementById('userQuestion').value, 'עם מעט חריפות');
      assert.equal(c.d.getElementById('generateRecipeBtn'), null);
      assert.equal(c.d.getElementById('nextBtn').textContent, 'צור מתכון');
      assert.equal(c.d.getElementById('cookExpertBtn'), null);
      c.click('backBtn'); assert.equal(c.screen(), 'landing');
    }
  } finally { c.dom.window.close(); }
});

test('basic cookware and sous vide change the request, recipe, tips and saved choices', { skip: !JSDOM }, async () => {
  const c = await setup();
  const { requestContext } = require('../lib/recipe-generation.js');
  const Fallback = require('../public/app/recipe-fallback.js');
  try {
    let request;
    c.w.fetch = async url => {
      request = requestContext(Object.fromEntries(new URL(url, c.w.location.href).searchParams));
      return { ok: true, json: async () => ({ structuredRecipe: Fallback.create(request) }) };
    };
    const select = (id, value) => { const input = c.d.getElementById(id); input.value = value; input.dispatchEvent(new c.w.Event('change')); };
    c.d.querySelector('[data-choice="feel"]').click();
    select('cutId', 'picanha'); select('equipmentMode', 'basic');
    assert.equal(c.d.getElementById('methodId').value, 'grill', 'retain a still-compatible selected method');
    select('methodId', 'pan_sear');
    assert.equal(c.d.getElementById('methodId').value, 'pan_sear');
    assert.equal(c.d.querySelector('#methodId option[value="sous_vide"]'), null);
    assert.equal(c.d.getElementById('thicknessField').hidden, true);
    assert.equal(c.w.getComputedStyle(c.d.getElementById('thicknessField')).display, 'none');
    assert.equal(c.d.getElementById('userQuestion').disabled, true);
    assert.equal([...c.d.querySelectorAll('button')].filter(b => b.textContent === 'צור מתכון' && !b.hidden).length, 1);
    c.click('nextBtn'); await settle(); await settle();
    assert.equal(request.equipmentMode, 'basic');
    assert.equal(c.execute('state.recipe.main.metadata.cooking_protocol'), 'basic_v1');
    assert.match(c.d.querySelector('.recipe-cooking-facts').textContent, /רצועות דקות/);
    assert.doesNotMatch(c.d.querySelector('.recipe-cooking-facts').textContent, /מדחום|undefined/);
    assert.equal(c.d.getElementById('variationBtn').hidden, true);
    assert.equal(c.d.querySelector('details.recipe-quality').open, false);
    c.click('regenBtn'); assert.equal(c.screen(), 'preferences');
    select('equipmentMode', 'standard'); select('methodId', 'sous_vide'); select('thicknessCm', '4');
    assert.equal(c.d.getElementById('thicknessField').hidden, false);
    assert.notEqual(c.w.getComputedStyle(c.d.getElementById('thicknessField')).display, 'none');
    c.click('nextBtn'); await settle(); await settle();
    assert.equal(request.methodId, 'sous_vide'); assert.equal(request.thicknessCm, 4);
    assert.match(c.d.querySelector('.recipe-cooking-facts').textContent, /טמפרטורת האמבט/);
    assert.match(c.d.getElementById('screenContent').textContent, /אין לקצר/);
    await c.execute('saveCurrentRecipe()');
    c.click('homeBtn'); c.click('openSavedRecipesBtn'); c.d.querySelector('[data-open-recipe]').click();
    assert.equal(c.execute('state.preferences.thicknessCm'), 4);
    assert.equal(c.execute('state.recipe.main.metadata.bath_minutes'), 120);
    assert.equal(c.execute('state.recipe.generation.kind'), 'guided');
    assert.equal(c.execute('RecipeQuality.review(state.recipe, state.preferences).passed'), true);
  } finally { c.dom.window.close(); }
});

test('home is hidden on landing and available elsewhere without deleting recipe or preferences; no numbered progress remains', { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    c.execute(`state.recipe = ${JSON.stringify(c.recipe)}; state.shopping = buildShoppingList(state.recipe); state.butcherLoaded = true;`);
    for (const screen of ['landing', 'saved', 'hot', 'preferences', 'expert', 'cook', 'recipe', 'shopping', 'butcher']) {
      c.execute(`currentStep = STEPS.indexOf('${screen}'); render();`);
      assert.equal(c.d.getElementById('homeBtn').getAttribute('aria-label'), 'חזרה למסך הבית');
      assert.equal(c.d.getElementById('homeBtn').hidden, screen === 'landing');
      assert.equal(c.d.getElementById('progressText'), null);
      assert.equal(c.d.querySelector('.progress-wrap'), null);
      assert.doesNotMatch(c.d.getElementById('appHeader').textContent, /\d+\s*\/\s*\d+/);
      if (screen !== 'landing') c.click('homeBtn');
      assert.equal(c.screen(), 'landing');
      assert.equal(c.d.getElementById('homeBtn').hidden, true);
      assert.equal(c.execute('state.recipe.main.title'), c.recipe.main.title);
      assert.equal(c.execute('state.preferences.cutId'), 'ribeye');
    }
    c.execute('state.lang = "en"; render();');
    assert.equal(c.d.getElementById('homeBtn').textContent, 'Home');
  } finally { c.dom.window.close(); }
});

test('basic mode exposes grill, charcoal and oven choices with cut-specific help and retains the chosen method', { skip: !JSDOM }, async () => {
  const c = await setup();
  const Fallback = require('../public/app/recipe-fallback.js');
  const { requestContext } = require('../lib/recipe-generation.js');
  try {
    let request;
    c.w.fetch = async url => {
      request = requestContext(Object.fromEntries(new URL(url, c.w.location.href).searchParams));
      return { ok: true, json: async () => ({ structuredRecipe: Fallback.create(request) }) };
    };
    const select = (id, value) => { const input = c.d.getElementById(id); input.value = value; input.dispatchEvent(new c.w.Event('change')); };
    const options = () => [...c.d.querySelectorAll('#methodId option')].map(x => x.value);
    c.d.querySelector('[data-choice="feel"]').click(); select('equipmentMode', 'basic');
    assert.deepEqual(options(), ['pan_sear', 'grill', 'bbq', 'oven']);
    select('methodId', 'bbq'); select('cutId', 'picanha');
    assert.equal(c.d.getElementById('methodId').value, 'bbq');
    assert.match(c.d.getElementById('methodId').selectedOptions[0].textContent, /מנגל פחמים/);
    select('cutId', 'brisket');
    assert.deepEqual(options(), ['long_cook', 'oven', 'grill', 'bbq', 'bbq_finish']);
    assert.equal(c.d.getElementById('methodId').value, 'bbq');
    assert.match(c.d.getElementById('methodHelperText').textContent, /חום עקיף.*מכסה/);
    c.click('nextBtn'); await settle(); await settle();
    assert.equal(request.methodId, 'bbq');
    assert.match(c.d.querySelector('.recipe-cooking-facts').textContent, /מנגל פחמים עם מכסה/);
    assert.equal(c.execute('state.recipe.main.metadata.cooking_method'), 'bbq');
    await c.execute('saveCurrentRecipe()');
    c.click('homeBtn'); c.click('openSavedRecipesBtn'); c.d.querySelector('[data-open-recipe]').click();
    assert.equal(c.execute('state.preferences.methodId'), 'bbq');
    assert.equal(c.execute('RecipeQuality.review(state.recipe, state.preferences).passed'), true);
    c.click('regenBtn'); select('methodId', 'bbq_finish');
    assert.match(c.d.getElementById('methodHelperText').textContent, /לא צריך מכסה/);
    select('cutId', 'ribeye');
    assert.equal(c.d.getElementById('methodId').value, 'pan_sear', 'reset only an incompatible choice');
  } finally { c.dom.window.close(); }
});

test('saved recipes return to their entry screen through shopping and butcher routes', { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    c.execute(`state.recipe = ${JSON.stringify(c.recipe)}; state.shopping = buildShoppingList(state.recipe); state.butcherLoaded = true;`);
    await c.execute('saveCurrentRecipe()');
    c.click('openButchersBtn'); assert.equal(c.screen(), 'butcher');
    c.click('backBtn'); assert.equal(c.screen(), 'landing');
    c.click('openSavedRecipesBtn');
    c.d.querySelector('[data-open-recipe]').click();
    assert.equal(c.screen(), 'recipe');
    c.click('nextBtn'); assert.equal(c.screen(), 'shopping');
    c.click('nextBtn'); assert.equal(c.screen(), 'butcher');
    c.click('backBtn'); assert.equal(c.screen(), 'shopping');
    c.click('backBtn'); assert.equal(c.screen(), 'recipe');
    c.click('backBtn'); assert.equal(c.screen(), 'saved');
    c.click('homeBtn');
    c.click('openLastRecipeBtn');
    c.click('backBtn'); assert.equal(c.screen(), 'landing');
  } finally { c.dom.window.close(); }
});

test('expert back respects its entry screen and a late expert answer cannot replace home', { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    c.d.querySelector('[data-choice="feel"]').click();
    c.click('toExpertBtn'); assert.equal(c.screen(), 'expert');
    c.click('backBtn'); assert.equal(c.screen(), 'preferences');
    c.execute('currentStep = STEPS.indexOf("cook"); render();');
    c.click('cookExpertBtn');
    c.click('backBtn'); assert.equal(c.screen(), 'cook');
    c.click('homeBtn');
    c.d.querySelector('[data-choice="feel"]').click(); c.click('toExpertBtn');
    let finishAnswer;
    const setTimer = c.w.setTimeout.bind(c.w);
    c.w.setTimeout = (fn, ms, ...args) => { if (ms === 900) { finishAnswer = fn; return 0; } return setTimer(fn, ms, ...args); };
    c.d.getElementById('expertQuestion').value = 'איזה בשר מתאים לקדירה?';
    c.click('expertSubmitBtn');
    assert.ok(finishAnswer);
    c.click('homeBtn'); finishAnswer(); await settle();
    assert.equal(c.screen(), 'landing');
    assert.ok(c.d.querySelector('[data-choice="feel"]'));
    assert.equal(c.d.getElementById('expertQuestion'), null);
  } finally { c.dom.window.close(); }
});
