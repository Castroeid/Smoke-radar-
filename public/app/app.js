const STEPS = ["landing", "hot", "preferences", "cook", "recipe", "shopping", "butcher"];
let currentStep = 0;

const cutsCatalog = [
  { id: "ribeye", labels: { he: "אנטריקוט", en: "Ribeye" }, aliases: ["ribeye", "אנטריקוט"] },
  { id: "brisket", labels: { he: "בריסקט", en: "Brisket" }, aliases: ["brisket", "בריסקט"] },
  { id: "asado", labels: { he: "אסאדו", en: "Asado" }, aliases: ["asado", "אסאדו"] },
  { id: "picanha", labels: { he: "פיקניה", en: "Picanha" }, aliases: ["picanha", "פיקניה"] },
  { id: "sirloin", labels: { he: "סינטה", en: "Sirloin" }, aliases: ["sirloin", "סינטה"] },
  { id: "filet", labels: { he: "פילה", en: "Filet" }, aliases: ["filet", "fillet", "פילה"] },
  { id: "short_ribs", labels: { he: "אסאדו / שפונדרה", en: "Short Ribs" }, aliases: ["short ribs", "שפונדרה"] },
  { id: "chuck", labels: { he: "צוואר / כתף", en: "Chuck" }, aliases: ["chuck", "צוואר", "כתף"] },
  { id: "flank", labels: { he: "פלנק", en: "Flank" }, aliases: ["flank", "פלנק"] },
  { id: "striploin", labels: { he: "סינטה / סטריפלוין", en: "Striploin" }, aliases: ["striploin", "סטריפלוין"] },
  { id: "tenderloin", labels: { he: "פילה מובחר", en: "Tenderloin" }, aliases: ["tenderloin"] }
];

const methods = [
  { id: "grill", labels: { he: "גריל", en: "Grill" } },
  { id: "cast_iron", labels: { he: "מחבת ברזל", en: "Cast Iron" } },
  { id: "oven", labels: { he: "תנור", en: "Oven" } },
  { id: "smoker", labels: { he: "מעשנה", en: "Smoker" } },
  { id: "low_slow", labels: { he: "נמוך ואיטי", en: "Low & Slow" } },
  { id: "pan_sear", labels: { he: "צריבה במחבת", en: "Pan Sear" } },
  { id: "reverse_sear", labels: { he: "ריברס סיר", en: "Reverse Sear" } }
];

const flavorProfiles = [
  { id: "classic", labels: { he: "קלאסי", en: "Classic" } },
  { id: "smoky", labels: { he: "מעושן", en: "Smoky" } },
  { id: "bold", labels: { he: "עז", en: "Bold" } },
  { id: "mediterranean", labels: { he: "ים תיכוני", en: "Mediterranean" } },
  { id: "spicy", labels: { he: "חריף", en: "Spicy" } }
];

const copy = {
  he: {
    dir: "rtl",
    brand: "🔥 Smoke Radar",
    landingTitle: "מה בא לך להכין היום?",
    landingSubtitle: "האפליקציה שבוחרת עבורך מה חם, מה לבשל, ואיפה לקנות.",
    hotAction: "🔥 מה חם עכשיו",
    knowAction: "😋 אני יודע מה בא לי",
    next: "המשך",
    finish: "סיום",
    back: "חזרה",
    stepLabel: "שלב",
    titles: {
      landing: "מה בא לך להכין היום?",
      hot: "מה חם עכשיו",
      preferences: "מה לבשל",
      cook: "איך לבשל",
      recipe: "מתכון מלא",
      shopping: "רשימת קניות",
      butcher: "איפה לקנות"
    }
  },
  en: {
    dir: "ltr",
    brand: "🔥 Smoke Radar",
    landingTitle: "What do you want to cook today?",
    landingSubtitle: "A premium flow from trends to recipe to butcher map.",
    hotAction: "🔥 What’s Hot Now",
    knowAction: "😋 I Know What I Want",
    next: "Next",
    finish: "Finish",
    back: "Back",
    stepLabel: "Step",
    titles: {
      landing: "What do you want to cook today?",
      hot: "What’s Hot Now",
      preferences: "What to cook",
      cook: "How to cook",
      recipe: "Cooking Guide",
      shopping: "Shopping List",
      butcher: "Where to buy"
    }
  }
};

const state = {
  lang: document.documentElement.lang === "en" ? "en" : "he",
  homeChoice: null,
  hotList: [],
  selectedHot: null,
  preferences: {
    meatType: "beef",
    cutId: "ribeye",
    methodId: "grill",
    flavorId: "smoky",
    dietaryPreference: "kosher",
    servings: 4
  },
  mealIdeas: [],
  selectedMealIdea: null,
  recipe: null,
  shopping: { meat: [], seasoning: [], sauceIngredients: [], sideIngredients: [], drinks: [] },
  shoppingChecks: {},
  butchers: [],
  location: null
};

const el = {
  appRoot: document.getElementById("app"),
  header: document.getElementById("appHeader"),
  title: document.getElementById("screenTitle"),
  subtitle: document.getElementById("screenSubtitle"),
  content: document.getElementById("screenContent"),
  nextBtn: document.getElementById("nextBtn"),
  backBtn: document.getElementById("backBtn"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText")
};

el.backBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    render();
  }
});
el.nextBtn.addEventListener("click", handleNext);

function t(path) {
  return path.split(".").reduce((acc, key) => acc?.[key], copy[state.lang]);
}

function getCutById(id) { return cutsCatalog.find((c) => c.id === id) || cutsCatalog[0]; }
function getMethodById(id) { return methods.find((m) => m.id === id) || methods[0]; }

function render() {
  const step = STEPS[currentStep];
  const totalFlowSteps = STEPS.length - 1;
  const progress = step === "landing" ? 0 : Math.round((currentStep / totalFlowSteps) * 100);

  document.documentElement.lang = state.lang;
  document.documentElement.dir = t("dir");
  el.appRoot.dataset.step = step;
  el.title.textContent = t(`titles.${step}`);
  el.subtitle.textContent = step === "landing" ? t("landingSubtitle") : "";
  el.progressFill.style.width = `${progress}%`;
  el.progressText.textContent = `${t("stepLabel")} ${Math.max(currentStep, 1)}/${totalFlowSteps}`;
  el.backBtn.textContent = t("back");
  el.nextBtn.textContent = currentStep === STEPS.length - 1 ? t("finish") : t("next");
  el.backBtn.classList.toggle("hidden", currentStep === 0);
  el.nextBtn.classList.toggle("hidden", step === "landing");

  el.content.classList.remove("fade-in");
  void el.content.offsetWidth;
  el.content.classList.add("fade-in");

  if (step === "landing") return renderLanding();
  if (step === "hot") return renderHotNow();
  if (step === "preferences") return renderPreferences();
  if (step === "cook") return renderCookIdeas();
  if (step === "recipe") return renderRecipe();
  if (step === "shopping") return renderShopping();
  if (step === "butcher") return renderButchers();
}

function renderLanding() {
  el.content.innerHTML = `
    <div class="card recipe-hero" style="--recipe-image:url('/app/assets/hero-steak.jpg')">
      <p class="small">${state.lang === "he" ? "Smoke Radar Premium" : "Smoke Radar Premium"}</p>
      <h2>${t("landingTitle")}</h2>
      <p class="small">${t("landingSubtitle")}</p>
    </div>
    <button class="btn btn-choice" data-choice="hot">${t("hotAction")}</button>
    <button class="btn btn-choice" data-choice="feel">${t("knowAction")}</button>
    <div class="chips">${cutsCatalog.slice(0, 6).map((cut) => `<span class="chip">${cut.labels[state.lang]}</span>`).join("")}</div>
  `;

  el.content.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.homeChoice = btn.dataset.choice;
      if (state.homeChoice === "hot") {
        await loadHotNow();
        currentStep = 1;
      } else {
        currentStep = 2;
      }
      render();
    });
  });
}

async function loadHotNow() {
  if (state.hotList.length) return;
  const res = await fetch("/api/smoke-radar");
  const data = await res.json();
  state.hotList = (data.videos || []).slice(0, 8).map((v) => {
    const cutId = inferCutId(v.title || "");
    return {
      title: v.title,
      cutId,
      heat: v.smokeScore > 75 ? "🔥🔥🔥" : v.smokeScore > 45 ? "🔥🔥" : "🔥"
    };
  });
}

function inferCutId(text) {
  const low = String(text).toLowerCase();
  const found = cutsCatalog.find((cut) => cut.aliases.some((a) => low.includes(a.toLowerCase())));
  return found?.id || "ribeye";
}

function renderHotNow() {
  if (!state.hotList.length) {
    el.content.innerHTML = `<div class="card">${state.lang === "he" ? "טוען מגמות חמות..." : "Loading hot trends..."}</div>`;
    return;
  }

  el.content.innerHTML = `
    <div class="card visual-card">
      <h3>${state.lang === "he" ? "טרנדים מעושנים מהקהילה" : "Smoky Community Trends"}</h3>
      <p class="small">${state.lang === "he" ? "בחר טרנד כדי להתחיל את המתכון." : "Pick a trend to start your recipe."}</p>
    </div>
    ${state.hotList.map((item, idx) => {
      const cut = getCutById(item.cutId);
      return `<button class="btn btn-choice ${state.selectedHot === idx ? "active" : ""}" data-hot="${idx}">
        <strong>${item.heat} ${cut.labels[state.lang]}</strong>
        <p class="small">${item.title}</p>
      </button>`;
    }).join("")}
  `;

  el.content.querySelectorAll("[data-hot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedHot = Number(btn.dataset.hot);
      state.preferences.cutId = state.hotList[state.selectedHot].cutId;
      renderHotNow();
    });
  });
}

function renderPreferences() {
  el.content.innerHTML = `
    <div class="card">
      <div class="field"><label>${state.lang === "he" ? "סוג בשר" : "Meat type"}</label>
        <select id="meatType">
          <option value="beef">${state.lang === "he" ? "בקר" : "Beef"}</option>
          <option value="lamb">${state.lang === "he" ? "טלה" : "Lamb"}</option>
          <option value="veal">${state.lang === "he" ? "עגל" : "Veal"}</option>
        </select>
      </div>
      <div class="field"><label>${state.lang === "he" ? "נתח" : "Cut"}</label>
        <select id="cutId">${cutsCatalog.map((cut) => `<option value="${cut.id}">${cut.labels[state.lang]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>${state.lang === "he" ? "שיטת בישול" : "Cooking method"}</label>
        <select id="methodId">${methods.map((m) => `<option value="${m.id}">${m.labels[state.lang]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>${state.lang === "he" ? "פרופיל טעמים" : "Flavor profile"}</label>
        <select id="flavorId">${flavorProfiles.map((f) => `<option value="${f.id}">${f.labels[state.lang]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>${state.lang === "he" ? "כשרות" : "Kosher preference"}</label>
        <select id="dietaryPreference">
          <option value="kosher">${state.lang === "he" ? "כשר" : "Kosher"}</option>
          <option value="non-kosher">${state.lang === "he" ? "לא כשר" : "Non-kosher"}</option>
        </select>
      </div>
      <div class="field"><label>${state.lang === "he" ? "מספר מנות" : "Servings"}</label><input type="number" min="1" max="20" id="servings" value="${state.preferences.servings}" /></div>
    </div>
  `;

  ["meatType", "cutId", "methodId", "flavorId", "dietaryPreference", "servings"].forEach((id) => {
    const input = document.getElementById(id);
    input.value = state.preferences[id];
    input.addEventListener("change", collectPreferences);
    input.addEventListener("input", collectPreferences);
  });
}

function collectPreferences() {
  state.preferences.meatType = document.getElementById("meatType").value;
  state.preferences.cutId = document.getElementById("cutId").value;
  state.preferences.methodId = document.getElementById("methodId").value;
  state.preferences.flavorId = document.getElementById("flavorId").value;
  state.preferences.dietaryPreference = document.getElementById("dietaryPreference").value;
  state.preferences.servings = Number(document.getElementById("servings").value || 1);
}

function buildIdeas() {
  const cut = getCutById(state.preferences.cutId).labels[state.lang];
  return [
    { title: `${cut} ${state.lang === "he" ? "עם צריבה חזקה" : "with high-heat crust"}`, note: state.lang === "he" ? "ביצוע מהיר ומדויק" : "Quick precision cook", flavorId: "classic" },
    { title: `${cut} ${state.lang === "he" ? "במעשנה ארוכה" : "smoked low and slow"}`, note: state.lang === "he" ? "עומק טעמים" : "Deep smoke profile", flavorId: "smoky" },
    { title: `${cut} ${state.lang === "he" ? "עם רוטב פלפל" : "with pepper sauce"}`, note: state.lang === "he" ? "מנה עשירה" : "Bold steakhouse style", flavorId: "bold" },
    { title: `${cut} ${state.lang === "he" ? "בסגנון ים תיכוני" : "Mediterranean style"}`, note: state.lang === "he" ? "עשבי תיבול והדר" : "Herbs and citrus", flavorId: "mediterranean" }
  ];
}

function renderCookIdeas() {
  state.mealIdeas = buildIdeas();
  el.content.innerHTML = `
    ${state.mealIdeas.map((idea, idx) => `
      <button class="btn btn-choice ${state.selectedMealIdea === idx ? "active" : ""}" data-idea="${idx}">
        <strong>${idea.title}</strong>
        <p class="small">${idea.note}</p>
      </button>`).join("")}
  `;

  el.content.querySelectorAll("[data-idea]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedMealIdea = Number(btn.dataset.idea);
      state.preferences.flavorId = state.mealIdeas[state.selectedMealIdea].flavorId;
      renderCookIdeas();
    });
  });
}

async function loadRecipe() {
  const p = state.preferences;
  const cut = getCutById(p.cutId).labels.en;
  const method = getMethodById(p.methodId).labels.he;
  const flavor = flavorProfiles.find((f) => f.id === p.flavorId)?.labels.en || "Smoky";
  const query = new URLSearchParams({
    lang: state.lang,
    meatType: p.meatType,
    cut,
    method,
    flavor,
    dietaryPreference: p.dietaryPreference,
    servings: String(p.servings),
    mode: "all",
    r: String(Math.floor(Math.random() * 1000000))
  });

  const res = await fetch(`/api/ai-recipe?${query.toString()}`);
  const data = await res.json();
  state.recipe = data.structuredRecipe || null;
  state.shopping = buildShoppingList(state.recipe);
}

function recipeHeroForCut() {
  const cutId = state.preferences.cutId;
  if (cutId === "brisket") return "url('/app/assets/recipe-brisket.jpg')";
  if (cutId === "picanha") return "url('/app/assets/recipe-picanha.jpg')";
  return "url('/app/assets/recipe-steak.jpg')";
}

function renderRecipe() {
  if (!state.recipe) {
    el.content.innerHTML = `<div class="card">${state.lang === "he" ? "בונה מדריך בישול מלא..." : "Building your complete cooking guide..."}</div>`;
    loadRecipe().then(renderRecipe).catch(() => {
      el.content.innerHTML = `<div class="card">${state.lang === "he" ? "לא הצלחנו לטעון מתכון כרגע." : "Could not load recipe right now."}</div>`;
    });
    return;
  }

  const r = state.recipe;
  const main = r.main || {};
  const prep = main.prepTime || (state.lang === "he" ? "20 דקות" : "20 min");
  const cook = main.cookTime || (state.lang === "he" ? "45 דקות" : "45 min");
  const total = main.totalTime || (state.lang === "he" ? "65 דקות" : "65 min");
  const difficulty = main.difficulty || (state.lang === "he" ? "בינוני" : "Medium");

  el.content.innerHTML = `
    <div class="card recipe-hero" style="--recipe-image:${recipeHeroForCut()}">
      <h2>${main.title || (state.lang === "he" ? "מתכון פרימיום" : "Premium Recipe")}</h2>
      <p class="small">${main.description || ""}</p>
    </div>

    <div class="card meta-grid">
      <div class="meta-item"><strong>${state.lang === "he" ? "זמן הכנה" : "Prep Time"}</strong>${prep}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "זמן בישול" : "Cook Time"}</strong>${cook}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "סה״כ זמן" : "Total Time"}</strong>${total}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "קושי" : "Difficulty"}</strong>${difficulty}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "מנות" : "Servings"}</strong>${state.preferences.servings}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "כשרות" : "Kosher"}</strong>${state.preferences.dietaryPreference === "kosher" ? (state.lang === "he" ? "כשר" : "Kosher") : (state.lang === "he" ? "לא כשר" : "Non-kosher")}</div>
    </div>

    <div class="card"><h3>${state.lang === "he" ? "מרכיבים" : "Ingredients"}</h3><ul class="list">${(main.ingredients || []).map((i) => `<li>${i}</li>`).join("")}</ul></div>
    <div class="card"><h3>${state.lang === "he" ? "שלבי הכנה" : "Step-by-step"}</h3><ol class="list">${(main.steps || []).map((s) => `<li>${s}</li>`).join("")}</ol></div>
    <div class="card"><h3>${state.lang === "he" ? "רטבים" : "Sauces"}</h3><ul class="list">${(r.sauces || []).map((s) => `<li>${s.name}</li>`).join("")}</ul></div>
    <div class="card"><h3>${state.lang === "he" ? "תוספות" : "Side Dishes"}</h3><ul class="list">${(r.sides || []).map((s) => `<li>${s.name}</li>`).join("")}</ul></div>
    <div class="card"><h3>${state.lang === "he" ? "שתייה מתאימה" : "Drink Pairings"}</h3><ul class="list">${(r.drinkPairings || []).map((d) => `<li>${d.name}</li>`).join("")}</ul></div>

    <div class="inline-actions">
      <button class="btn btn-ghost" id="regenBtn">${state.lang === "he" ? "צור מתכון מחדש" : "Regenerate Recipe"}</button>
      <button class="btn btn-ghost" id="servingBtn">${state.lang === "he" ? "שנה מספר מנות" : "Change Servings"}</button>
      <button class="btn btn-primary" id="toShoppingBtn">${state.lang === "he" ? "המשך לרשימת קניות" : "Continue to Shopping List"}</button>
    </div>
  `;

  document.getElementById("regenBtn").addEventListener("click", async () => {
    state.recipe = null;
    renderRecipe();
  });
  document.getElementById("servingBtn").addEventListener("click", () => {
    const v = window.prompt(state.lang === "he" ? "כמה מנות?" : "How many servings?", String(state.preferences.servings));
    const servings = Number(v);
    if (Number.isFinite(servings) && servings > 0 && servings <= 20) {
      state.preferences.servings = servings;
      state.recipe = null;
      renderRecipe();
    }
  });
  document.getElementById("toShoppingBtn").addEventListener("click", () => {
    currentStep = 5;
    render();
  });
}

function buildShoppingList(recipe) {
  const mainIng = recipe?.main?.ingredients || [];
  const sauces = (recipe?.sauces || []).flatMap((s) => s.ingredients || [s.name]).filter(Boolean);
  const sides = (recipe?.sides || []).flatMap((s) => s.ingredients || [s.name]).filter(Boolean);
  const drinks = (recipe?.drinkPairings || []).map((d) => d.name).filter(Boolean);

  return {
    meat: mainIng.filter((i) => /beef|meat|rib|steak|brisket|פיקניה|בשר|נתח|אנטריקוט|פילה/i.test(i)),
    seasoning: mainIng.filter((i) => /salt|pepper|paprika|garlic|spice|מלח|פלפל|תבלין|שום/i.test(i)),
    sauceIngredients: [...new Set(sauces)],
    sideIngredients: [...new Set(sides)],
    drinks: [...new Set(drinks)]
  };
}

function renderShopping() {
  const groups = [
    { key: "meat", he: "בשר", en: "Meat" },
    { key: "seasoning", he: "תיבול", en: "Seasoning" },
    { key: "sauceIngredients", he: "מרכיבי רוטב", en: "Sauce ingredients" },
    { key: "sideIngredients", he: "מרכיבי תוספות", en: "Side dish ingredients" },
    { key: "drinks", he: "שתייה", en: "Drinks" }
  ];

  el.content.innerHTML = `
    ${groups.map((group) => {
      const items = state.shopping[group.key] || [];
      return `
        <div class="card">
          <h3 class="group-title">${group[state.lang]}</h3>
          ${items.length ? items.map((item, idx) => {
            const id = `${group.key}-${idx}`;
            return `<label class="check-item"><input type="checkbox" data-check="${id}" ${state.shoppingChecks[id] ? "checked" : ""} /> <span>${item}</span></label>`;
          }).join("") : `<p class="small">${state.lang === "he" ? "לא נוספו פריטים" : "No items added"}</p>`}
        </div>`;
    }).join("")}

    <button class="btn btn-ghost" id="copyList">${state.lang === "he" ? "העתק רשימה" : "Copy list"}</button>
    <button class="btn btn-primary" id="toButchers">${state.lang === "he" ? "המשך לאיתור קצביות" : "Continue to butcher finder"}</button>
  `;

  el.content.querySelectorAll("[data-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.shoppingChecks[checkbox.dataset.check] = checkbox.checked;
    });
  });

  document.getElementById("copyList").addEventListener("click", async () => {
    const list = Object.values(state.shopping).flat().join("\n");
    try {
      await navigator.clipboard.writeText(list);
      alert(state.lang === "he" ? "הרשימה הועתקה" : "List copied");
    } catch {
      alert(state.lang === "he" ? "לא הצלחנו להעתיק" : "Copy failed");
    }
  });
  document.getElementById("toButchers").addEventListener("click", () => {
    currentStep = 6;
    render();
  });
}

async function loadButchers() {
  if (!navigator.geolocation) throw new Error("Location unavailable");
  const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000 }));
  state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  const res = await fetch(`/api/butchers-nearby?lat=${encodeURIComponent(state.location.lat)}&lng=${encodeURIComponent(state.location.lng)}`);
  state.butchers = await res.json();
}

function renderButchers() {
  if (!state.butchers.length && !state.location) {
    el.content.innerHTML = `
      <div class="card visual-map">
        <h3>${state.lang === "he" ? "איתור קצביה קרובה" : "Find nearby butcher"}</h3>
        <p class="small">${state.lang === "he" ? "ויזואל מפה עם נקודות חמות סביבך." : "Map-like discovery with orange location pins."}</p>
      </div>
      <button id="findButchers" class="btn btn-primary">${state.lang === "he" ? "📍 מצא קצביות קרובות" : "📍 Find nearby butcher shops"}</button>
    `;
    document.getElementById("findButchers").addEventListener("click", async () => {
      el.content.innerHTML = `<div class="card">${state.lang === "he" ? "מאתר מיקום וקצביות..." : "Fetching your location and butcher shops..."}</div>`;
      try {
        await loadButchers();
        renderButchers();
      } catch {
        el.content.innerHTML = `<div class="card">${state.lang === "he" ? "נדרשת הרשאת מיקום כדי לאתר קצביות." : "Location permission is required to find butcher shops."}</div>`;
      }
    });
    return;
  }

  el.content.innerHTML = `
    <div class="card visual-map"><h3>${state.lang === "he" ? "קצביות מומלצות באזור שלך" : "Top butcher shops near you"}</h3></div>
    ${state.butchers.slice(0, 8).map((b) => {
      const stars = "⭐".repeat(Math.max(1, Math.min(5, Math.round(b.rating || 4))));
      return `
        <article class="card">
          <strong>📍 ${b.name}</strong>
          <p class="small">${b.address || ""}</p>
          <p class="small">${stars} ${b.rating || "-"} (${b.userRatingsTotal || 0})</p>
          <a class="btn btn-primary" href="${b.mapsUrl}" target="_blank" rel="noopener">${state.lang === "he" ? "פתח במפות" : "Open in Maps"}</a>
        </article>`;
    }).join("")}
  `;
}

async function handleNext() {
  const step = STEPS[currentStep];
  if (step === "hot" && state.homeChoice === "hot" && state.selectedHot === null) return;
  if (step === "cook" && state.selectedMealIdea === null) return;

  if (currentStep < STEPS.length - 1) {
    currentStep += 1;
    render();
  } else {
    currentStep = 0;
    state.recipe = null;
    render();
  }
}

render();
