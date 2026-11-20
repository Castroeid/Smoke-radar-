const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/app/app.js', 'utf8');
function setup({ geoError, response, fetchError } = {}) {
  const ctx = {
    state: { lang: 'he', butchers: [], location: null, butcherLoaded: false, butcherLoading: false },
    navigator: { geolocation: { getCurrentPosition(resolve, reject) { geoError ? reject({ code: geoError }) : resolve({ coords: { latitude: 32.83, longitude: 35.08 } }); } } },
    fetch: async () => { if (fetchError) throw new Error('network'); return response || { ok: true, json: async () => [] }; },
    AbortController, setTimeout, clearTimeout,
    STEPS: ['landing', 'butcher'], currentStep: 1,
    el: { content: { innerHTML: '' } },
    document: { getElementById: () => ({ addEventListener() {} }) },
    renderButcherLoading: () => 'loading'
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function loadButchers()'), source.indexOf('function normalizeSubRecipes(')), ctx);
  return ctx;
}
test('HTTP failure never corrupts butcher array; retry succeeds', async () => {
  const c = setup({ response: { ok: false, json: async () => ({ error: 'permission denied' }) } });
  await assert.rejects(c.loadButchers(), /service_unavailable/);
  assert.equal(Array.isArray(c.state.butchers), true);
  assert.equal(c.state.butcherLoaded, false);
  c.fetch = async () => ({ ok: true, json: async () => [{ name: 'Butcher' }] });
  await c.loadButchers();
  assert.equal(c.state.butchers[0].name, 'Butcher');
  assert.equal(c.state.butcherLoaded, true);
});
test('permission denial, timeout and unavailable location remain distinct', async () => {
  for (const [code, expected] of [[1, 'location_denied'], [2, 'location_unavailable'], [3, 'location_timeout']]) {
    await assert.rejects(setup({ geoError: code }).loadButchers(), new RegExp(expected));
  }
});
test('network, malformed JSON, and non-array results are service failures', async () => {
  for (const c of [setup({ fetchError: true }), setup({ response: { ok: true, json: async () => { throw new Error('JSON'); } } }), setup({ response: { ok: true, json: async () => ({ error: 'bad' }) } })]) {
    await assert.rejects(c.loadButchers(), /service_unavailable/);
    assert.equal(Array.isArray(c.state.butchers), true);
  }
});
test('server error gives retry and maps fallback, not permission instructions', async () => {
  const c = setup({ response: { ok: false } });
  await c.searchButchers();
  assert.match(c.el.content.innerHTML, /המיקום התקבל/);
  assert.match(c.el.content.innerHTML, /id="findButchers"/);
  assert.match(c.el.content.innerHTML, /google.com\/maps\/search/);
  assert.equal(c.state.butcherLoading, false);
});
test('empty result displays a clear message and retry', async () => {
  const c = setup();
  await c.searchButchers();
  assert.match(c.el.content.innerHTML, /לא נמצאו קצביות/);
  assert.match(c.el.content.innerHTML, /id="findButchers"/);
});
test('request completion does not overwrite another screen', async () => {
  const c = setup();
  c.fetch = async () => { c.currentStep = 0; c.el.content.innerHTML = 'home'; return { ok: true, json: async () => [] }; };
  await c.searchButchers();
  assert.equal(c.el.content.innerHTML, 'home');
});
test('all configured images exist', () => {
  const section = source.slice(source.indexOf('const assetCandidates'), source.indexOf('const cutsCatalog'));
  for (const [, path] of section.matchAll(/"(\/app\/assets\/[^"\n]+)"/g)) assert.ok(fs.existsSync(`public${path}`), path);
});
