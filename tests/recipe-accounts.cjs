const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Store = require('../public/app/recipe-store.js');
const key = 'recipes';
const recipe = (id, title = id) => ({ id, title, main: { title, ingredients: ['salt'], steps: ['Cook'] }, createdAt: '2026-11-22T12:00:00Z' });
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function setup(initial = []) {
  const data = new Map([[key, JSON.stringify(initial)]]);
  const cloud = new Map();
  const calls = [];
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const adapter = {
    list: async uid => [...(cloud.get(uid)?.values() || [])],
    put: async (uid, value) => { calls.push(['put', uid, value.id]); if (!cloud.has(uid)) cloud.set(uid, new Map()); cloud.get(uid).set(value.id, value); },
    remove: async (uid, id) => { calls.push(['remove', uid, id]); cloud.get(uid)?.delete(id); }
  };
  const snapshots = [];
  const store = Store.create({ storage, key, onChange: state => snapshots.push(state) });
  store.configure(adapter);
  return { store, storage, data, cloud, adapter, calls, snapshots };
}

test('guest saves survive reload; storage failure never reports a successful save', async () => {
  const c = setup([recipe('old')]);
  await c.store.save(recipe('new'));
  const next = Store.create({ storage: c.storage, key });
  assert.deepEqual(next.snapshot().recipes.map(r => r.id).sort(), ['new', 'old']);
  c.storage.setItem = () => { throw new Error('Quota exceeded'); };
  await assert.rejects(c.store.save(recipe('failed')), /Quota/);
  assert.equal(c.store.snapshot().recipes.some(r => r.id === 'failed'), false);
  assert.equal(c.store.snapshot().error, 'save');
});

test('sign-in separates guest data; cloud saves are scoped to the authenticated account', async () => {
  const c = setup([recipe('guest')]);
  await c.store.setUser({ uid: 'alice' });
  assert.equal(c.store.snapshot().recipes.length, 0);
  assert.equal(c.calls.length, 0); // Login must not automatically upload device recipes.
  await c.store.save(recipe('private'));
  assert.deepEqual(c.calls, [['put', 'alice', 'private']]);
  assert.equal(JSON.parse(c.data.get(key))[0].id, 'guest');
  await c.store.setUser({ uid: 'bob' });
  assert.equal(c.store.snapshot().recipes.length, 0);
  await c.store.setUser(null);
  assert.equal(c.store.snapshot().recipes[0].id, 'guest');
});

test('delayed old-account reads cannot overwrite a new account', async () => {
  const c = setup(), pending = deferred();
  c.adapter.list = uid => uid === 'alice' ? pending.promise : Promise.resolve([recipe('bob-recipe')]);
  const oldRead = c.store.setUser({ uid: 'alice' });
  await c.store.setUser({ uid: 'bob' });
  pending.resolve([recipe('alice-private')]);
  await oldRead;
  assert.equal(c.store.snapshot().user.uid, 'bob');
  assert.deepEqual(c.store.snapshot().recipes.map(r => r.id), ['bob-recipe']);
});

test('delayed saves after logout do not expose private recipes as guest data', async () => {
  const c = setup(), pending = deferred();
  await c.store.setUser({ uid: 'alice' });
  c.adapter.put = () => pending.promise;
  const save = c.store.save(recipe('private'));
  await c.store.setUser(null);
  pending.resolve();
  assert.equal(await save, false);
  assert.equal(c.store.snapshot().recipes.length, 0);
  assert.deepEqual(JSON.parse(c.data.get(key)), []);
});

test('failed cloud writes/deletes retain the previous list and permit retry', async () => {
  const c = setup();
  await c.store.setUser({ uid: 'alice' });
  await c.store.save(recipe('keep'));
  c.adapter.remove = async () => { throw new Error('offline'); };
  await assert.rejects(c.store.remove('keep'), /offline/);
  assert.equal(c.store.snapshot().recipes[0].id, 'keep');
  assert.equal(c.store.snapshot().busy, false);
  c.adapter.put = async () => { throw new Error('permission denied'); };
  await assert.rejects(c.store.save(recipe('nope')), /permission/);
  assert.equal(c.store.snapshot().recipes.length, 1);
});

test('explicit import retains device recipes on partial failure and is safe to retry', async () => {
  const c = setup([recipe('one'), recipe('two')]);
  await c.store.setUser({ uid: 'alice' });
  const original = c.adapter.put;
  c.adapter.put = async (uid, r) => { if (r.id === 'two') throw new Error('offline'); await original(uid, r); };
  await assert.rejects(c.store.importGuests(), /offline/);
  assert.equal(JSON.parse(c.data.get(key)).length, 2);
  c.adapter.put = original;
  await c.store.refresh();
  await c.store.importGuests();
  assert.equal(c.cloud.get('alice').size, 2);
  assert.equal(c.store.snapshot().recipes.length, 2);
  assert.deepEqual(JSON.parse(c.data.get(key)), []);
  assert.equal(c.calls.filter(call => call[2] === 'one').length, 1);
});

test('an import stops when the active account changes and leaves guests recoverable', async () => {
  const c = setup([recipe('one'), recipe('two')]), pending = deferred();
  await c.store.setUser({ uid: 'alice' });
  c.adapter.put = (uid, r) => { c.calls.push([uid, r.id]); return pending.promise; };
  const importing = c.store.importGuests();
  await c.store.setUser({ uid: 'bob' });
  pending.resolve();
  assert.equal(await importing, false);
  assert.deepEqual(c.calls, [['alice', 'one']]);
  assert.equal(c.store.snapshot().recipes.length, 0);
  assert.equal(JSON.parse(c.data.get(key)).length, 2);
});

test('normalization rejects invalid IDs and oversized payloads and ignores profile/URL fields', () => {
  assert.throws(() => Store.normalize(recipe('../alice/private')), /invalid/);
  assert.throws(() => Store.normalize(recipe('big', 'a'.repeat(200001))), /large/);
  const result = Store.normalize({ ...recipe('safe', '<script>bad()</script>'), thumbnail: 'javascript:bad()', userId: 'alice', preferences: { servings: '1000', cutId: 'ribeye' } });
  assert.equal(result.thumbnail, undefined);
  assert.equal(result.userId, undefined);
  assert.equal(result.preferences.servings, 20);
  assert.equal(result.title, '<script>bad()</script>'); // Renderers escape, storage preserves text.
});

test('public config is opt-in, validates required fields, and never exposes secret extras', () => {
  const source = fs.readFileSync('server.js', 'utf8');
  const c = {}; vm.createContext(c);
  vm.runInContext(source.slice(source.indexOf('function getRecipeAccountConfig('), source.indexOf('app.get("/api/recipe-account-config"')), c);
  assert.equal(c.getRecipeAccountConfig({}).enabled, false);
  assert.equal(c.getRecipeAccountConfig({ RECIPE_ACCOUNTS_ENABLED: 'true', FIREBASE_WEB_CONFIG: 'not JSON' }).enabled, false);
  const config = { apiKey: 'public-web-key', authDomain: 'demo.firebaseapp.com', projectId: 'demo', appId: 'web:demo', private_key: 'must-never-be-exposed' };
  const response = c.getRecipeAccountConfig({ RECIPE_ACCOUNTS_ENABLED: 'true', FIREBASE_WEB_CONFIG: JSON.stringify(config), RECIPE_AUTH_PROVIDERS: 'google,facebook,unknown' });
  assert.equal(response.enabled, true);
  assert.equal(response.config.private_key, undefined);
  assert.equal(response.providers.join(','), 'google,facebook');
});

test('account panel exposes both configured providers and escapes profile text', () => {
  const source = fs.readFileSync('public/app/app.js', 'utf8');
  const c = { state: { lang: 'he', account: { enabled: true, ready: true, providers: ['google', 'facebook'] } } };
  vm.createContext(c);
  vm.runInContext(source.slice(source.indexOf('function escapeHotText('), source.indexOf('function renderHotNow(')), c);
  vm.runInContext(source.slice(source.indexOf('function renderRecipeAccount(always'), source.indexOf('function recipeLoginError(')), c);
  assert.match(c.renderRecipeAccount(), /data-recipe-login="google"/);
  assert.match(c.renderRecipeAccount(), /data-recipe-login="facebook"/);
  c.state.account.user = { uid: 'alice', displayName: '<script>bad()</script>' };
  assert.match(c.renderRecipeAccount(), /&lt;script&gt;/);
  assert.doesNotMatch(c.renderRecipeAccount(), /<script>/);
  c.state.account = { enabled: false };
  assert.equal(c.renderRecipeAccount(), '');
});
