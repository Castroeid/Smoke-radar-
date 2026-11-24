const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('server.js', 'utf8');
function setup({ main = ['aaaaaaaaaaa', 'bbbbbbbbbbb'], extra = ['bbbbbbbbbbb', 'ccccccccccc'], failMain = false, failExtra = false } = {}) {
  const calls = [];
  const ctx = {
    API_KEY: 'test-key', console: { warn() {} }, formatDuration: x => x, parseDurationSeconds: () => 60,
    fetch: async input => {
      const url = new URL(input); calls.push(url);
      const search = url.pathname.endsWith('/search');
      const supplemental = search && url.searchParams.get('q').includes('|');
      const failed = search && (supplemental ? failExtra : failMain);
      const ids = search ? (supplemental ? extra : main) : url.searchParams.get('id').split(',');
      return { ok: !failed, status: failed ? 403 : 200, json: async () => failed
        ? { error: { message: 'quotaExceeded' } }
        : { items: ids.map(id => search ? { id: { videoId: id } } : { id, snippet: { title: `Video ${id}` }, statistics: { viewCount: '123' } }) } };
    }
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function fetchJson(url)'), source.indexOf('// ---------------- response builder')), ctx);
  return { ctx, calls };
}
test('refresh adds one bilingual seasoning search, deduplicates IDs and fetches details once', async () => {
  const { ctx, calls } = setup();
  const result = await ctx.fetchLiveVideosFromYouTube();
  assert.equal(calls.length, 3);
  assert.equal(calls.filter(u => u.pathname.endsWith('/search')).length, 2);
  const query = calls[1].searchParams.get('q');
  for (const term of ['rub', 'dry brine', 'wet brine', 'marinade', 'drying', 'dry aging', 'vacuum marinating', 'בריין', 'השריה בוואקום']) assert.ok(query.includes(term), term);
  assert.ok(calls[1].href.includes('%7C'), 'OR must be URL encoded');
  assert.ok(query.split('|').every(phrase => /^"[^"]+"$/.test(phrase)), 'keep multiword alternatives together instead of ANDing their words');
  assert.ok(query.includes('"making jerky"'), 'search preparation rather than snack/product mentions');
  assert.ok(!query.includes('"beef jerky"'));
  assert.equal(calls[1].searchParams.get('order'), 'date');
  assert.equal(calls[1].searchParams.get('maxResults'), '20');
  assert.equal(calls[2].searchParams.get('id'), 'aaaaaaaaaaa,bbbbbbbbbbb,ccccccccccc');
  assert.deepEqual(Array.from(result, v => v.id), ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc']);
});
test('supplemental search failure preserves main results; primary failure stops further requests', async () => {
  const partial = setup({ failExtra: true });
  assert.equal((await partial.ctx.fetchLiveVideosFromYouTube()).length, 2);
  assert.equal(partial.calls.length, 3);
  const blocked = setup({ failMain: true });
  await assert.rejects(blocked.ctx.fetchLiveVideosFromYouTube(), /quotaExceeded/);
  assert.equal(blocked.calls.length, 1);
});
test('empty results avoid a details request, and seasoning results can fill an empty main search', async () => {
  const empty = setup({ main: [], extra: [] });
  assert.equal((await empty.ctx.fetchLiveVideosFromYouTube()).length, 0);
  assert.equal(empty.calls.length, 2);
  const supplemental = setup({ main: [], extra: ['ccccccccccc', 'bad-id', 'ccccccccccc'] });
  assert.deepEqual(Array.from(await supplemental.ctx.fetchLiveVideosFromYouTube(), v => v.id), ['ccccccccccc']);
});
