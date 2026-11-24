const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch { /* Optional DOM test dependency. */ }

test('full app keeps guest recipes, renders saved content safely and switches account libraries', { skip: !JSDOM }, async () => {
  const dom = new JSDOM(fs.readFileSync('public/app/index.html', 'utf8'), {
    url: 'https://smoke-radar.onrender.com/app/', runScripts: 'outside-only', pretendToBeVisual: true
  });
  const { window } = dom;
  const execute = code => vm.runInContext(code, dom.getInternalVMContext());
  try {
    window.fetch = async () => ({ ok: true, json: async () => ({ enabled: false }) });
    window.Image = class { set src(value) { queueMicrotask(() => this.onload?.()); } };
    const guest = { id: 'old-local', title: 'Old recipe', createdAt: '2026-11-22T00:00:00Z', main: { title: 'Old recipe', ingredients: ['salt'], steps: ['Cook'] } };
    window.localStorage.setItem('smoke_radar_saved_recipes_v1', JSON.stringify([guest]));
    for (const file of ['hot-topics.js', 'recipe-protocols.js', 'recipe-quality.js', 'recipe-guidance.js', 'recipe-fallback.js', 'recipe-store.js', 'app.js']) execute(fs.readFileSync(`public/app/${file}`, 'utf8'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(window.document.querySelector('[data-recipe-login]'), null);
    window.document.getElementById('openSavedRecipesBtn').click();
    assert.match(window.document.getElementById('screenContent').textContent, /Old recipe/);
    assert.match(window.document.getElementById('screenContent').textContent, /בדפדפן הזה בלבד/);
    await execute(`(async () => {
      state.recipe = { main: { title: '<img src=x onerror=alert(1)>', description: '<script>bad()</script>', ingredients: ['<img src=y>'], steps: ['Cook'], prepTime: '<script>time()</script>' }, sauces: [], sides: [], drinkPairings: [] };
      await saveCurrentRecipe();
    })()`);
    const saved = JSON.parse(window.localStorage.getItem('smoke_radar_saved_recipes_v1'));
    assert.equal(saved.length, 2);
    assert.equal(window.document.querySelector('img[src="x"]'), null);
    const id = saved.find(item => item.id !== 'old-local').id;
    execute(`openSavedRecipe(${JSON.stringify(id)})`);
    assert.equal(window.document.querySelector('#screenContent script'), null);
    assert.equal(window.document.querySelector('#screenContent img[src="y"]'), null);
    assert.match(window.document.getElementById('screenContent').textContent, /<script>bad\(\)<\/script>/);
    await execute(`(async () => {
      recipeStore.configure({ list: async uid => [{ id: uid, title: uid + ' private', main: {}, createdAt: new Date().toISOString() }], put: async () => {}, remove: async () => {} });
      state.account.enabled = true; state.account.ready = true; state.account.providers = ['google', 'facebook'];
      currentStep = STEPS.indexOf('saved');
      await recipeStore.setUser({ uid: 'alice' });
    })()`);
    assert.match(window.document.getElementById('screenContent').textContent, /alice private/);
    assert.doesNotMatch(window.document.getElementById('screenContent').textContent, /Old recipe/);
    await execute(`recipeStore.setUser({ uid: 'bob' })`);
    assert.match(window.document.getElementById('screenContent').textContent, /bob private/);
    assert.doesNotMatch(window.document.getElementById('screenContent').textContent, /alice private/);
    await execute('recipeStore.setUser(null)');
    assert.match(window.document.getElementById('screenContent').textContent, /Old recipe/);
    assert.ok(window.document.querySelector('[data-recipe-login="google"]'));
    assert.ok(window.document.querySelector('[data-recipe-login="facebook"]'));
  } finally { dom.window.close(); }
});
