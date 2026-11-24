const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch { /* Optional QA dependency. */ }
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup({ ua = 'Android Chrome', standalone = false } = {}) {
  const dom = new JSDOM(fs.readFileSync('public/app/install.html', 'utf8'), { url: 'https://smoke-radar.onrender.com/app/install.html', runScripts: 'outside-only' });
  const w = dom.window;
  Object.defineProperty(w.navigator, 'userAgent', { value: ua });
  w.matchMedia = () => ({ matches: standalone, addEventListener() {} });
  w.eval(fs.readFileSync('public/app/install.js', 'utf8'));
  return { dom, w, d: w.document };
}

test('installation fallback offers platform help without claiming the app is installed', { skip: !JSDOM }, () => {
  for (const [ua, section] of [['Android Chrome', 'androidHelp'], ['iPhone Safari', 'iosHelp'], ['Linux Firefox', 'desktopHelp'], ['Android FBAN FBAV', 'androidHelp']]) {
    const c = setup({ ua });
    try {
      c.d.getElementById('installBtn').click();
      assert.equal(c.d.getElementById(section).open, true);
      assert.equal(c.d.getElementById('installBtn').hidden, false);
      assert.doesNotMatch(c.d.getElementById('installStatus').textContent, /מותקנת/);
      assert.equal(c.d.getElementById('embeddedHelp').hidden, !ua.includes('FBAN'));
    } finally { c.dom.window.close(); }
  }
});

test('native prompt is consumed once, cancellation can be retried, completion is event-driven', { skip: !JSDOM }, async () => {
  const c = setup();
  try {
    let calls = 0;
    function promptEvent(outcome) {
      const event = new c.w.Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => { calls++; };
      event.userChoice = Promise.resolve({ outcome });
      c.w.dispatchEvent(event);
      assert.equal(event.defaultPrevented, true);
    }
    promptEvent('dismissed');
    c.d.getElementById('installBtn').click(); await settle();
    assert.equal(calls, 1);
    c.d.getElementById('installBtn').click(); await settle();
    assert.equal(calls, 1);
    promptEvent('accepted');
    c.d.getElementById('installBtn').click(); await settle();
    assert.equal(calls, 2);
    assert.equal(c.d.getElementById('installBtn').hidden, false);
    assert.doesNotMatch(c.d.getElementById('installStatus').textContent, /מותקנת/);
    c.w.dispatchEvent(new c.w.Event('appinstalled'));
    assert.equal(c.d.getElementById('installBtn').hidden, true);
    assert.match(c.d.getElementById('installStatus').textContent, /מותקנת/);
  } finally { c.dom.window.close(); }
});

test('standalone entry does not invite another install and sharing copies the install URL', { skip: !JSDOM }, async () => {
  const c = setup({ standalone: true });
  try {
    assert.equal(c.d.getElementById('installBtn').hidden, true);
    let copied;
    c.w.navigator.clipboard = { writeText: async value => { copied = value; } };
    c.d.getElementById('copyLink').click(); await settle();
    assert.equal(copied, 'https://smoke-radar.onrender.com/install');
    c.w.navigator.share = async () => { const e = new Error(); e.name = 'AbortError'; throw e; };
    copied = null;
    c.d.getElementById('shareLink').click(); await settle();
    assert.equal(copied, null);
  } finally { c.dom.window.close(); }
});

test('manifest icons match real raster sizes and both entry pages reference the manifest', { skip: !JSDOM }, () => {
  const manifest = JSON.parse(fs.readFileSync('public/app/manifest.json', 'utf8'));
  assert.equal(manifest.id, manifest.start_url);
  assert.equal(manifest.scope, '/app/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  for (const icon of manifest.icons) {
    const image = fs.readFileSync('public' + icon.src);
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`, icon.sizes);
  }
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'));
  for (const file of ['index.html', 'install.html']) {
    const dom = new JSDOM(fs.readFileSync('public/app/' + file, 'utf8'));
    assert.equal(dom.window.document.querySelector('link[rel=manifest]').getAttribute('href'), '/app/manifest.json');
    assert.ok(dom.window.document.querySelector('link[rel=apple-touch-icon]'));
    dom.window.close();
  }
});

test('offline worker never intercepts API/account data and preserves fresh online navigation', async () => {
  const handlers = {}, added = [], deleted = [];
  let fail = false;
  const offline = new Response('offline notice');
  const online = new Response('fresh app');
  const sandbox = {
    URL, Response,
    self: { location: { origin: 'https://smoke-radar.onrender.com' }, addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: { open: async () => ({ add: async url => added.push(url) }), keys: async () => ['smoke-radar-offline-old', 'unrelated-cache'], delete: async key => deleted.push(key), match: async url => url === '/app/offline.html' ? offline : undefined },
    fetch: async () => { if (fail) throw new Error('offline'); return online; }
  };
  vm.runInNewContext(fs.readFileSync('public/app/sw.js', 'utf8'), sandbox);
  let waiting;
  handlers.install({ waitUntil: p => { waiting = p; } }); await waiting;
  handlers.activate({ waitUntil: p => { waiting = p; } }); await waiting;
  assert.deepEqual(added, ['/app/offline.html']);
  assert.deepEqual(deleted, ['smoke-radar-offline-old']);
  for (const [url, mode, method] of [
    ['https://smoke-radar.onrender.com/api/recipe-account-config', 'cors', 'GET'],
    ['https://firestore.googleapis.com/private', 'cors', 'POST'],
    ['https://smoke-radar.onrender.com/app/app.js', 'cors', 'GET'],
    ['https://smoke-radar.onrender.com/api/recipe', 'cors', 'POST']
  ]) handlers.fetch({ request: { url, mode, method }, respondWith() { assert.fail('must not intercept data'); } });
  const nav = { request: { url: 'https://smoke-radar.onrender.com/app/', mode: 'navigate', method: 'GET' }, respondWith(p) { waiting = p; } };
  handlers.fetch(nav); assert.equal(await waiting, online);
  fail = true; handlers.fetch(nav); assert.equal(await waiting, offline);
});
