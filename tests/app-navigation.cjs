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
  const execute = code => vm.runInContext(code, dom.getInternalVMContext());
  const recipe = Quality.normalize(fixture(), 'he');
  w.scrollTo = () => {};
  w.fetch = async url => ({ ok: true, json: async () => url.includes('recipe-account-config') ? { enabled: false } : { structuredRecipe: recipe } });
  w.Image = class { set src(value) { queueMicrotask(() => this.onload?.()); } };
  for (const file of ['hot-topics.js', 'recipe-quality.js', 'recipe-guidance.js', 'recipe-fallback.js', 'recipe-store.js', 'app.js']) execute(fs.readFileSync(`public/app/${file}`, 'utf8'));
  await settle();
  const screen = () => d.getElementById('app').dataset.step;
  const click = id => { const e = d.getElementById(id); assert.ok(e, id); e.click(); };
  return { dom, w, d, execute, recipe, screen, click };
}

test('both generate buttons return to the generator with its choices intact, then home', { skip: !JSDOM }, async () => {
  const c = await setup();
  try {
    for (const button of ['generateRecipeBtn', 'nextBtn']) {
      c.d.querySelector('[data-choice="feel"]').click();
      const cut = c.d.getElementById('cutId'); cut.value = 'brisket'; cut.dispatchEvent(new c.w.Event('change'));
      const question = c.d.getElementById('userQuestion'); question.value = 'עם מעט חריפות'; question.dispatchEvent(new c.w.Event('input'));
      c.click(button); await settle(); await settle();
      assert.equal(c.screen(), 'recipe');
      c.click('backBtn');
      assert.equal(c.screen(), 'preferences');
      assert.equal(c.d.getElementById('cutId').value, 'brisket');
      assert.equal(c.d.getElementById('userQuestion').value, 'עם מעט חריפות');
      assert.ok(c.d.getElementById('generateRecipeBtn'));
      assert.equal(c.d.getElementById('cookExpertBtn'), null);
      c.click('backBtn'); assert.equal(c.screen(), 'landing');
    }
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
