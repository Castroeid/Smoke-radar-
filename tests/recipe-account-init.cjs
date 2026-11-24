const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
let JSDOM;
try { ({ JSDOM } = require("jsdom")); } catch { /* Optional DOM dependency. */ }
const settle = () => new Promise(resolve => setImmediate(resolve));

test("stalled SDK loading or authentication releases device recipes and ignores late completion", { skip: !JSDOM }, async () => {
  for (const phase of ["import", "connect"]) {
    const dom = new JSDOM(fs.readFileSync("public/app/index.html", "utf8"), {
      url: "https://smoke-radar.onrender.com/app/", runScripts: "outside-only", pretendToBeVisual: true
    });
    const { window } = dom, execute = code => vm.runInContext(code, dom.getInternalVMContext());
    try {
      window.fetch = async () => ({ ok: true, json: async () => ({ enabled: false }) });
      window.Image = class { set src(value) { queueMicrotask(() => this.onload?.()); } };
      window.localStorage.setItem("smoke_radar_saved_recipes_v1", JSON.stringify([
        { id: "guest", title: "Device recipe", main: { title: "Device recipe", ingredients: ["salt"], steps: ["Cook"] } }
      ]));
      for (const file of ["hot-topics.js", "recipe-quality.js", "recipe-store.js", "app.js"]) execute(fs.readFileSync(`public/app/${file}`, "utf8"));
      await settle();
      window.fetch = async () => ({ ok: true, json: async () => ({ enabled: true, providers: ["google"], config: {} }) });
      let expire, release, calls = 0, signal;
      const later = new Promise(resolve => { release = resolve; });
      const realTimer = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...args) => ms === 10000 ? (expire = fn, 98765) : realTimer(fn, ms, ...args);
      const connect = async options => { calls++; signal = options.signal; return phase === "connect" ? later : {}; };
      window.loadForTest = () => phase === "import" ? later : Promise.resolve({ connect });
      execute('state.account.initializing = true; currentStep = STEPS.indexOf("saved"); render();');
      const pending = execute("initRecipeAccounts(loadForTest)");
      await settle();
      expire();
      await pending;
      assert.equal(execute("state.account.initializing"), false);
      assert.equal(execute("state.account.ready"), false);
      assert.match(window.document.getElementById("screenContent").textContent, /Device recipe/);
      execute('state.recipe = { main: { title: "After timeout", ingredients: ["salt"], steps: ["Cook"] }, sauces: [], sides: [] };');
      await execute("saveCurrentRecipe()");
      assert.equal(JSON.parse(window.localStorage.getItem("smoke_radar_saved_recipes_v1")).length, 2);
      release(phase === "import" ? { connect } : { login() {} });
      await settle();
      assert.equal(execute("state.account.ready"), false);
      assert.equal(execute("recipeAccountClient"), null);
      assert.equal(calls, phase === "import" ? 0 : 1);
      if (signal) assert.equal(signal.aborted, true);
    } finally { dom.window.close(); }
  }
});

function accountModule({ persistence = Promise.resolve() } = {}) {
  const observed = { configured: 0, users: [], notices: [], unsubscribed: 0 };
  const code = fs.readFileSync("public/app/recipe-account.js", "utf8").split("export async function connect")[1];
  const sandbox = {
    initializeApp: () => ({}), getAuth: () => ({ currentUser: null }), getFirestore: () => ({}),
    browserLocalPersistence: {}, browserSessionPersistence: {}, setPersistence: () => persistence,
    onAuthStateChanged: (_auth, callback) => { observed.callback = callback; return () => { observed.unsubscribed++; }; }
  };
  vm.createContext(sandbox);
  vm.runInContext(`async function connect${code}`, sandbox);
  const controller = new AbortController();
  const connect = () => sandbox.connect({ config: {}, providers: ["google"], lang: "he", signal: controller.signal,
    store: { configure() { observed.configured++; }, setUser(user) { observed.users.push(user); } },
    onUser(user) { observed.notices.push(user); }
  });
  return { observed, controller, connect };
}

test("a late persistence result cannot configure an aborted account connection", async () => {
  let release;
  const c = accountModule({ persistence: new Promise(resolve => { release = resolve; }) });
  const pending = c.connect();
  const rejected = assert.rejects(pending, /initialization-cancelled/);
  c.controller.abort(); release(); await rejected;
  assert.equal(c.observed.configured, 0);
  assert.equal(c.observed.callback, undefined);
});

test("auth timeout unsubscribes and late user callbacks cannot replace device recipes", async () => {
  const c = accountModule(), pending = c.connect();
  const rejected = assert.rejects(pending, /initialization-cancelled/);
  await settle(); c.controller.abort(); await rejected;
  c.observed.callback({ uid: "late-user" });
  assert.equal(c.observed.unsubscribed, 1);
  assert.deepEqual(c.observed.users, []);
  assert.deepEqual(c.observed.notices, []);
});

test("successful initialization keeps observing subsequent sign-out", async () => {
  const c = accountModule(), pending = c.connect();
  await settle(); c.observed.callback({ uid: "owner" });
  const client = await pending;
  assert.equal(typeof client.login, "function");
  c.observed.callback(null);
  assert.deepEqual(c.observed.users, [{ uid: "owner" }, null]);
  assert.equal(c.observed.unsubscribed, 0);
});
