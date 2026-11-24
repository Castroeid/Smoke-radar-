const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const HotTopics = require('../public/app/hot-topics.js');
const v = (id, title) => ({ id, title, viewCount: 123 });
test('groups a cut once across the full feed, deduplicating videos', () => {
  const first = v('aaaaaaaaaaa', 'Picanha with garlic');
  const result = HotTopics.build([first, first, ...Array.from({ length: 9 }, (_, i) => v(`bbbbbbbbbb${i}`, 'Picanha'))]);
  const picanha = result.filter(t => t.id === 'cut-picanha');
  assert.equal(picanha.length, 1);
  assert.equal(picanha[0].count, 10);
  assert.equal(result.find(t => t.id === 'spice-garlic').count, 1);
});
test('generic beef is never labelled ribeye and substrings do not match', () => {
  assert.equal(HotTopics.build([v('aaaaaaaaaaa', 'Rustic Beef BBQ in the Jungle')]).some(t => t.category === 'cut'), false);
  assert.equal(HotTopics.mentions('smokehouse', 'smoked'), false);
  assert.equal(HotTopics.mentions('garlicky', 'garlic'), false);
});
test('matches Hebrew, Portuguese hashtags and cooking styles', () => {
  const result = HotTopics.build([v('aaaaaaaaaaa', '#picanha #churrasco שום פפריקה'), v('bbbbbbbbbbb', 'בריסקט מעושן')]);
  for (const id of ['cut-picanha', 'style-grilling', 'spice-garlic', 'spice-paprika', 'cut-brisket', 'style-smoking']) assert.ok(result.some(t => t.id === id), id);
});
test('only playable videos are counted and URLs are canonical YouTube URLs', () => {
  assert.equal(HotTopics.build([{ title: 'picanha', url: 'javascript:alert(1)' }]).length, 0);
  const topic = HotTopics.build([{ title: 'picanha', url: 'https://youtu.be/aaaaaaaaaaa' }])[0];
  assert.equal(topic.videos[0].url, 'https://www.youtube.com/watch?v=aaaaaaaaaaa');
  assert.equal(HotTopics.build([null, {}, {title: 42}]).length, 0);
});
test('seasoning and preparation topics recognize Hebrew and English spellings', () => {
  const examples = [
    ['rub', ['BBQ RUB for brisket', 'dry-rub for steak', '#dryrub', 'ראב לבשר', 'תערובת תיבול']],
    ['brine', ['How to brine beef', 'Brining brisket', 'Brined meat', 'בריין לבשר']],
    ['dry-brine', ['Dry-brining steak', '#drybrine', 'בריין יבש', 'המלחה יבשה']],
    ['wet-brine', ['Wet brined brisket', 'wet_brine beef', 'בריין רטוב']],
    ['marinade', ['Beef marinade', 'Marinating steak', 'נוזל השרייה לבשר', 'נוזל השריה', 'מרינדה']],
    ['vacuum-marinade', ['Vacuum marinating beef', 'Vacuum-marinated steak', 'Vacuum brining meat', 'השרייה בוואקום', 'השריה בואקום']],
    ['drying', ['Drying meat', 'Dehydrated meat', 'Beef jerky', 'Making jerky at home', 'ייבוש בשר']],
    ['dry-aging', ['Dry-aged beef', '#dryaging', 'יישון יבש']]
  ];
  for (const [topic, titles] of examples) for (const title of titles) {
    assert.ok(HotTopics.build([v('aaaaaaaaaaa', title)]).some(t => t.id === `spice-${topic}`), title);
  }
});
test('rub, dry brine, wet brine, drying and dry aging are distinct topics', () => {
  for (const [title, expected] of [
    ['Beef dry rub', 'rub'], ['Beef dry brine', 'dry-brine'], ['Beef wet brine', 'wet-brine'],
    ['ייבוש בשר', 'drying'], ['Dry aged beef', 'dry-aging'], ['השריה בוואקום', 'vacuum-marinade']
  ]) {
    assert.deepEqual(HotTopics.build([v('aaaaaaaaaaa', title)]).filter(t => t.category === 'spice').map(t => t.id), [`spice-${expected}`]);
  }
  for (const title of ['Scrubbing shrubs', 'Dry steak', 'Vacuum sealed steak', 'Sous vide beef', 'Vacuum cleaner']) {
    assert.equal(HotTopics.build([v('aaaaaaaaaaa', title)]).filter(t => t.category === 'spice').length, 0, title);
  }
  const comparison = HotTopics.build([v('aaaaaaaaaaa', 'Dry brine vs wet brine')]);
  assert.deepEqual(comparison.map(t => t.id).sort(), ['spice-dry-brine', 'spice-wet-brine']);
});
const source = fs.readFileSync('public/app/app.js', 'utf8');
function setup(response) {
  const nodes = new Map();
  const ctx = { state: { lang: 'he', hotList: [], selectedHot: null }, HotTopics,
    STEPS: ['landing', 'hot'], currentStep: 1, AbortController, setTimeout, clearTimeout,
    fetch: async () => response,
    el: { content: { innerHTML: '', querySelectorAll: () => [] } },
    document: { getElementById: id => { const node = { addEventListener: (event, fn) => nodes.set(id, fn) }; return node; } }
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function loadHotNow()'), source.indexOf('function renderPreferences()')), ctx);
  return ctx;
}
test('seed data does not produce trend claims; cached data is labelled', async () => {
  const c = setup({ ok: true, json: async () => ({source: 'seed', videos: [v('aaaaaaaaaaa', 'Picanha')]}) });
  await c.loadHotNow();
  assert.equal(c.state.hotList.length, 0);
  c.fetch = async () => ({ok: true, json: async () => ({source: 'cache', videos: [v('aaaaaaaaaaa', 'Picanha')]})});
  await c.loadHotNow();
  assert.match(c.el.content.innerHTML, /נתונים שמורים/);
  assert.match(c.el.content.innerHTML, /data-topic="cut-picanha"/);
});
test('API failures show retry and late responses do not replace other screens', async () => {
  const c = setup({ok: false}); await c.loadHotNow();
  assert.match(c.el.content.innerHTML, /id="retryHot"/);
  c.fetch = async () => { c.currentStep = 0; c.el.content.innerHTML = 'home'; return {ok: true, json: async () => ({ videos: [] })}; };
  await c.loadHotNow(); assert.equal(c.el.content.innerHTML, 'home');
});
test('topic detail contains only matching videos and escapes external titles', () => {
  const c = setup();
  c.state.hotList = HotTopics.build([v('aaaaaaaaaaa', 'Picanha <img onerror=alert(1)>'), v('bbbbbbbbbbb', 'Brisket')]);
  c.state.selectedHot = 'cut-picanha'; c.renderHotNow();
  assert.match(c.el.content.innerHTML, /watch\?v=aaaaaaaaaaa/);
  assert.doesNotMatch(c.el.content.innerHTML, /watch\?v=bbbbbbbbbbb/);
  assert.match(c.el.content.innerHTML, /&lt;img onerror=alert\(1\)&gt;/);
});
test('English seasoning titles appear under Hebrew topics with only matching videos', () => {
  const c = setup();
  c.state.hotList = HotTopics.build([v('aaaaaaaaaaa', 'Dry brine steak'), v('bbbbbbbbbbb', 'Wet brine beef')]);
  c.renderHotNow();
  assert.match(c.el.content.innerHTML, /תיבול, השריה וייבוש/);
  assert.match(c.el.content.innerHTML, /data-topic="spice-dry-brine"/);
  c.state.selectedHot = 'spice-dry-brine'; c.renderHotNow();
  assert.match(c.el.content.innerHTML, /בריין יבש/);
  assert.match(c.el.content.innerHTML, /watch\?v=aaaaaaaaaaa/);
  assert.doesNotMatch(c.el.content.innerHTML, /watch\?v=bbbbbbbbbbb/);
});
test('back goes from topic to overview, then home, without altering recipe preferences', () => {
  let back;
  const ctx = { state: {selectedHot: 'cut-picanha', preferences: {cutId: 'brisket'}}, STEPS: ['landing','saved','hot'], currentStep: 2, render() {}, el: {backBtn: {addEventListener: (_, fn) => {back = fn;} } } };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('el.backBtn.addEventListener'), source.indexOf('el.nextBtn.addEventListener')), ctx);
  back(); assert.equal(ctx.state.selectedHot, null); assert.equal(ctx.currentStep, 2);
  back(); assert.equal(ctx.currentStep, 0); assert.equal(ctx.state.preferences.cutId, 'brisket');
});
