const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cutPhotoHandler } = require("../lib/cut-photo.js");
const fakeJpeg = Buffer.from([0xff, 0xd8, 0x01, 0xff, 0xd9]);
const suggestion = { presentation: "whole_cut", labelText: "", status: "suggested", cutName: "אונטריב", species: "beef", cutId: "chuck_roll", observation: "שם הנתח מופיע על האריזה.", ideas: ["קדירת אונטריב עם בצל"] };

async function run({ body = fakeJpeg, stage = "raw", type = "image/jpeg", value = suggestion, configured = true } = {}) {
  const calls = [];
  const client = { chat: { completions: { create: async request => {
    calls.push(request);
    return { choices: [{ message: { content: JSON.stringify(value) } }] };
  } } } };
  const req = { body, query: { stage, lang: "he" }, is: mime => type === mime };
  const res = { code: 200, set() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await cutPhotoHandler({ client, isConfigured: () => configured })(req, res);
  return { calls, res };
}

test("sends an image and the supplied preparation stage, and maps a supported cut", async () => {
  const { calls, res } = await run();
  assert.equal(calls.length, 1);
  const parts = calls[0].messages[1].content;
  assert.equal(parts[1].image_url.url, "data:image/jpeg;base64," + fakeJpeg.toString("base64"));
  assert.match(parts[0].text, /לפני בישול/);
  assert.equal(calls[0].store, false);
  const { presentation, labelText, ...expected } = suggestion;
  assert.deepEqual(res.data, expected);
});

test("uncertain, unsupported species and unrelated images do not preselect a recipe", async () => {
  const cooked = await run({ stage: "cooked", value: { ...suggestion, status: "uncertain" } });
  assert.match(cooked.calls[0].messages[1].content[0].text, /כבר מבושל/);
  assert.equal(cooked.res.data.cutId, null);
  assert.equal(cooked.res.data.cutName, "");
  const other = await run({ value: { ...suggestion, species: "other" } });
  assert.equal(other.res.data.cutId, null);
  const unrelated = await run({ value: { ...suggestion, status: "not_meat" } });
  assert.deepEqual(unrelated.res.data.ideas, []);
});

test("invalid inputs and unavailable analysis never produce a guessed answer", async () => {
  for (const [args, expected] of [[{ body: Buffer.from("bad") }, 400], [{ type: "application/json" }, 415],
    [{ stage: "anything" }, 400], [{ configured: false }, 503]]) {
    const { calls, res } = await run(args);
    assert.equal(calls.length, 0);
    assert.equal(res.code, expected);
  }
  assert.equal((await run({ value: { ...suggestion, ideas: [] } })).res.code, 503);
});

test("English model prose never replaces the requested Hebrew experience", async () => {
  const foreign = { ...suggestion, cutName: "Chuck roll", observation: "The label suggests chuck roll.", ideas: ["Try a sandwich."] };
  const raw = await run({ value: foreign });
  assert.equal(raw.res.data.cutName, "אונטריב");
  assert.equal(raw.res.data.cutId, "chuck_roll");
  assert(raw.res.data.ideas.every(idea => /[א-ת]/.test(idea)));
  const cooked = await run({ value: { ...foreign, status: "uncertain" }, stage: "cooked" });
  assert.equal(cooked.res.data.cutId, null);
  assert.match(cooked.res.data.ideas[0], /כריך/);
});

test("an unsupported whole-cut guess from a cooked or processed image is downgraded even if the model is confident", async () => {
  const cooked = await run({ stage: "cooked", value: { ...suggestion, labelText: "בשר בקר" } });
  assert.equal(cooked.res.data.status, "uncertain");
  assert.equal(cooked.res.data.cutId, null);
  assert.match(cooked.res.data.ideas[0], /כריך/);
  const unknown = await run({ stage: "unknown", value: { ...suggestion, presentation: "processed_or_cooked" } });
  assert.equal(unknown.res.data.status, "uncertain");
  const labelled = await run({ stage: "cooked", value: { ...suggestion, labelText: "נתח אונטריב" } });
  assert.equal(labelled.res.data.status, "suggested");
  assert.match(labelled.res.data.observation, /נתח אונטריב/);
});
