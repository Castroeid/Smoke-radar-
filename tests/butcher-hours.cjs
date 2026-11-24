const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const server = fs.readFileSync('server.js', 'utf8');
function serverContext(fetch) {
  const ctx = { fetch, process: { env: { GOOGLE_PLACES_API_KEY: 'test-only' } } };
  vm.createContext(ctx);
  vm.runInContext(server.slice(server.indexOf('function getSaturdayOpeningStatus('), server.indexOf('// ---------------- endpoints')), ctx);
  return ctx;
}
const point = (day, hour = 0, minute = 0) => ({ day, hour, minute });
const period = (day, start, endDay, end) => ({ open: point(day, start), close: point(endDay, end) });

test('Saturday uses actual day numbers, handles split shifts, midnight and week wrap', () => {
  const { getSaturdayOpeningStatus: check } = serverContext();
  for (const [periods, expected] of [
    [[period(1, 8, 1, 18)], false],
    [[period(6, 8, 6, 13), period(6, 16, 6, 20)], true],
    [[period(5, 22, 6, 2)], true],
    [[period(5, 8, 6, 0)], false],
    [[period(6, 22, 0, 2)], true],
    [[period(0, 0, 0, 2)], false],
    [[period(6, 20, 6, 23)], true], // Includes Saturday evening, as labelled.
    [[period(4, 8, 0, 0)], true],
    [[period(1, 8, 1, 18), period(6, 8, 6, 18)], true]
  ]) assert.equal(check({ periods }), expected, JSON.stringify(periods));
});

test('24/7, missing hours, explicitly never open, and malformed periods stay distinct', () => {
  const { getSaturdayOpeningStatus: check } = serverContext();
  assert.equal(check({ periods: [{ open: point(0) }] }), true);
  assert.equal(check({ periods: [{ open: {} }] }), true); // Proto scalar defaults are zero.
  assert.equal(check(undefined), null);
  assert.equal(check({}), null);
  assert.equal(check({ periods: [] }), false); // Documented never-open representation.
  assert.equal(check({ periods: [{ open: point(6, 8) }] }), null);
  assert.equal(check({ periods: [null] }), null);
  assert.equal(check({ periods: [period(8, 8, 8, 16)] }), null);
});

test('current status respects exceptions and business closures; unknown is not closed', () => {
  const { buildNearbyPlaceResult: build } = serverContext();
  const regular = { openNow: true, periods: [period(6, 9, 6, 18)], weekdayDescriptions: ['יום שבת: 9:00–18:00'] };
  const closedToday = build({ currentOpeningHours: { openNow: false }, regularOpeningHours: regular });
  assert.equal(closedToday.openNow, false);
  assert.equal(closedToday.openOnSaturday, true);
  assert.equal(closedToday.openingHours[0], 'יום שבת: 9:00–18:00');
  assert.equal(closedToday.openingHoursType, 'regular');
  assert.equal(build({ regularOpeningHours: regular }).openNow, null);
  assert.equal(build({}).openOnSaturday, null);
  for (const businessStatus of ['CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY']) {
    const shop = build({ businessStatus, currentOpeningHours: { openNow: true }, regularOpeningHours: regular });
    assert.equal(shop.openNow, false);
    assert.equal(shop.openOnSaturday, false);
  }
  const currentOnly = build({ currentOpeningHours: { openNow: true, weekdayDescriptions: ['Saturday: Closed'] } });
  assert.equal(currentOnly.openNow, true);
  assert.equal(currentOnly.openingHoursType, 'current');
  assert.equal(currentOnly.openOnSaturday, null); // Never infer regular Saturday hours from prose.
});

test('hours are fetched in the same four requests, preserving the default result limit', async () => {
  let calls = [];
  const ctx = serverContext(async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body, mask: options.headers['X-Goog-FieldMask'] });
    return { ok: true, json: async () => ({ places: Array.from({ length: 8 }, (_, i) => ({
      displayName: { text: `${body.textQuery}-${i}` }, rating: 4,
      currentOpeningHours: { openNow: true }, regularOpeningHours: { periods: [period(6, 9, 6, 18)] }
    })) }) };
  });
  const pool = await ctx.fetchButchersNearby({ lat: 32.83, lng: 35.08, languageCode: 'he', includeAll: true });
  assert.equal(pool.length, 32);
  assert.equal(calls.length, 4);
  assert.equal(pool.every(p => p.openNow && p.openOnSaturday), true);
  for (const call of calls) {
    assert.equal(call.body.languageCode, 'he');
    assert.equal(call.body.maxResultCount, 8);
    assert.match(call.mask, /places.currentOpeningHours/);
    assert.match(call.mask, /places.regularOpeningHours/);
  }
  calls = [];
  const legacy = await ctx.fetchButchersNearby({ lat: 32.83, lng: 35.08 });
  assert.equal(legacy.length, 8);
  assert.equal(calls[0].body.languageCode, 'en');
});

const app = fs.readFileSync('public/app/app.js', 'utf8');
function ui(shops, lang = 'he') {
  const listeners = new Map();
  const ctx = {
    state: { lang, butchers: shops, butcherLoaded: true, butcherFilters: { openNow: false, saturday: false }, butcherCheckedAt: Date.now() },
    el: { content: { innerHTML: '' } },
    URL, Date, AbortController, setTimeout, clearTimeout,
    document: { getElementById: id => ({ addEventListener: (_, fn) => listeners.set(id, fn), focus() {} }) },
    getDistanceValue: () => 1, formatDistance: () => '1 km',
    butcherGuideEntry: () => '<button id="openButcherGuide">Guide</button>', bindButcherGuideEntry: () => {},
    fetch: () => { throw new Error('Filters must not fetch'); }
  };
  vm.createContext(ctx);
  for (const [start, end] of [
    ['function escapeHotText(', 'function renderHotNow('],
    ['async function loadButchers()', 'function normalizeSubRecipes('],
    ['function renderOpenNowStatus(', 'async function copyShoppingListToClipboard(']
  ]) vm.runInContext(app.slice(app.indexOf(start), app.indexOf(end)), ctx);
  ctx.click = id => listeners.get(id)();
  ctx.renderButchers();
  return ctx;
}
const shop = (name, openNow, openOnSaturday) => ({ name, openNow, openOnSaturday, mapsUrl: 'https://maps.google.com/', rating: 4, userRatingsTotal: 20 });

test('filter controls combine, exclude unknowns and find matches beyond the first eight', () => {
  const shops = [...Array.from({ length: 8 }, (_, i) => shop(`Closed-${i}`, false, false)),
    shop('Both', true, true), shop('NowOnly', true, false), shop('SaturdayOnly', false, true), shop('Unknown', null, null)];
  const c = ui(shops);
  c.click('filterOpenNow');
  assert.match(c.el.content.innerHTML, /📍 Both/);
  assert.match(c.el.content.innerHTML, /📍 NowOnly/);
  assert.doesNotMatch(c.el.content.innerHTML, /📍 (Closed|Unknown|SaturdayOnly)/);
  c.click('filterSaturday');
  assert.match(c.el.content.innerHTML, /📍 Both/);
  assert.doesNotMatch(c.el.content.innerHTML, /📍 NowOnly/);
  assert.match(c.el.content.innerHTML, /id="filterSaturday" aria-pressed="true"/);
  c.click('filterOpenNow');
  assert.match(c.el.content.innerHTML, /📍 SaturdayOnly/);
});

test('empty filtered state allows clearing filters and retains unknown shops in all-results view', () => {
  const c = ui([shop('Unknown', null, null)]);
  assert.match(c.el.content.innerHTML, /מצב הפתיחה לא ידוע/);
  assert.match(c.el.content.innerHTML, /שעות הפתיחה לא נמסרו/);
  c.click('filterOpenNow');
  assert.match(c.el.content.innerHTML, /אין בתוצאות קצביות/);
  assert.doesNotMatch(c.el.content.innerHTML, /📍 Unknown/);
  c.click('clearButcherFilters');
  assert.match(c.el.content.innerHTML, /📍 Unknown/);
  assert.equal(c.state.butcherFilters.openNow, false);
  assert.equal(c.state.butcherFilters.saturday, false);
});

test('cards display expandable hours and English labels and escape external text', () => {
  const c = ui([{ ...shop('<img src=x>', true, true), mapsUrl: 'javascript:alert(1)',
    openingHoursType: 'regular', openingHours: ['Saturday: 08:00–18:00', '<script>bad()</script>'] }], 'en');
  assert.match(c.el.content.innerHTML, /Open now/);
  assert.match(c.el.content.innerHTML, /<summary>Regular opening hours<\/summary>/);
  assert.match(c.el.content.innerHTML, /Saturday: 08:00–18:00/);
  assert.match(c.el.content.innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(c.el.content.innerHTML, /<img src=x>|javascript:|<script>/);
});
