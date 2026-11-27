const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const source = readFileSync('public/app/screen-analytics.js', 'utf8');
function start({ hostname = 'smoke-radar.onrender.com', tester = null, initialScreen, hidden = false } = {}) {
  let now = 0;
  const events = [];
  const document = new EventTarget();
  document.visibilityState = hidden ? 'hidden' : 'visible';
  document.currentScript = { dataset: { screen: initialScreen } };
  const window = new EventTarget();
  window.initSmokeRadarPostHog = () => ({ capture: (name, props) => events.push({ name, ...props }) });
  vm.runInNewContext(source, {
    window, document, location: { hostname, origin: 'https://' + hostname }, crypto: require('node:crypto'),
    localStorage: { getItem: () => tester }, performance: { now: () => now }
  });
  return {
    events, window, advance: ms => { now += ms; },
    visibility(state) {
      document.visibilityState = state;
      document.dispatchEvent(new Event('visibilitychange'));
    }
  };
}

test('screen revisits, rerenders, and foreground intervals are counted independently', () => {
  const ctx = start();
  const track = ctx.window.trackSmokeRadarScreen;
  track('landing');
  ctx.advance(1000);
  track('landing');
  track('butcher');
  ctx.advance(500);
  ctx.visibility('hidden');
  ctx.window.dispatchEvent(new Event('pagehide'));
  ctx.advance(120000);
  ctx.visibility('visible');
  ctx.advance(200);
  track('landing');
  const views = ctx.events.filter(e => e.name === '$pageview');
  assert.deepEqual(views.map(e => e.$pathname), ['/app/landing', '/app/butcher', '/app/landing']);
  assert.equal(new Set(views.map(e => e.screen_view_id)).size, 3);
  const times = ctx.events.filter(e => e.name === 'app_screen_time');
  assert.deepEqual(times.map(e => e.visible_ms), [1000, 500, 200]);
  assert.deepEqual(times.map(e => e.screen_view_id), [views[0].screen_view_id, views[1].screen_view_id, views[1].screen_view_id]);
});

test('counts the installation page when it becomes visible and skips flagged testers and previews', () => {
  const ctx = start({ initialScreen: 'install', hidden: true });
  assert.equal(ctx.events.length, 0);
  ctx.visibility('visible');
  assert.equal(ctx.events[0].$pathname, '/app/install.html');
  for (const opts of [{ tester: 'true' }, { hostname: 'pr-42.onrender.com' }]) {
    const skipped = start({ ...opts, initialScreen: 'install' });
    assert.equal(skipped.events.length, 0);
    assert.equal(skipped.window.trackSmokeRadarScreen, undefined);
  }
});
