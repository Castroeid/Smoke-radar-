const STEPS = ["landing", "saved", "hot", "preferences", "expert", "cook", "recipe", "shopping", "butcher"];
let currentStep = 0;
const SAVED_RECIPES_KEY = "smoke_radar_saved_recipes_v1";
const SHARE_TEXT = "Check out Smoke Radar — meat trends, recipes, and butcher discovery in one radar-style app.";
const INTRO_MIN_DURATION_MS = 3400;
const INTRO_FINAL_HOLD_MS = 850;

const assetCandidates = {
  appBg: ["/app/assets/app-bg-smoke.jpg", "/app/assets/app-bg-smoke.jpg.png"],
  hero: ["/app/assets/hero-steak.jpg", "/app/assets/hero-steak.jpg.png"],
  hot: ["/app/assets/hot-trends.jpg", "/app/assets/hot-trends-bg.jpg", "/app/assets/hot-trends.jpg.png", "/app/assets/hot-trends1.jpg.PNG"],
  recipe: ["/app/assets/recipe-card-bg.jpg", "/app/assets/recipe-bg.jpg", "/app/assets/recipe-card-bg.jpg.png", "/app/assets/recipe-bg.jpg.png"],
  butcher: ["/app/assets/butcher-map-bg.jpg", "/app/assets/butcher-map-bg.jpg.png"]
};

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
  { id: "striploin", labels: { he: "סטריפלוין / סינטה", en: "Striploin" }, aliases: ["striploin", "סטריפלוין", "סינטה"] },
  { id: "tenderloin", labels: { he: "פילה", en: "Tenderloin" }, aliases: ["tenderloin", "פילה"] }
];

const methods = [
  { id: "grill", labels: { he: "גריל", en: "Grill" } },
  { id: "cast_iron", labels: { he: "מחבת ברזל", en: "Cast Iron" } },
  { id: "oven", labels: { he: "תנור", en: "Oven" } },
  { id: "bbq", labels: { he: "ברביקיו", en: "BBQ" } },
  { id: "smoker", labels: { he: "מעשנה", en: "Smoker" } },
  { id: "smoking", labels: { he: "עישון", en: "Smoking" } },
  { id: "long_cook", labels: { he: "בישול ארוך", en: "Long Cook" } },
  { id: "oven_roast", labels: { he: "צלייה בתנור", en: "Oven Roast" } },
  { id: "low_slow", labels: { he: "נמוך ואיטי", en: "Low & Slow" } },
  { id: "pan_sear", labels: { he: "צריבה במחבת", en: "Pan Sear" } },
  { id: "reverse_sear", labels: { he: "ריברס סיר", en: "Reverse Sear" } }
];

const flavorProfiles = [
  { id: "classic", labels: { he: "קלאסי", en: "Classic" } },
  { id: "smoky", labels: { he: "מעושן", en: "Smoky" } },
  { id: "spicy", labels: { he: "חריף", en: "Spicy" } },
  { id: "garlic_herbs", labels: { he: "שום ועשבי תיבול", en: "Garlic & Herbs" } },
  { id: "mediterranean", labels: { he: "ים תיכוני", en: "Mediterranean" } },
  { id: "sweet_smoky", labels: { he: "מתוק-מעושן", en: "Sweet & Smoky" } },
  { id: "israeli_style", labels: { he: "ישראלי", en: "Israeli Style" } }
];

const cutHelperText = {
  ribeye: {
    he: "מתאים לצריבה במחבת, גריל, ריברס סיר.",
    en: "Best for pan sear, grill, and reverse sear."
  },
  brisket: {
    he: "מתאים לעישון ארוך / Low & Slow.",
    en: "Best for long smoking / low and slow."
  },
  asado: {
    he: "מתאים לקדירה, תנור ארוך, עישון.",
    en: "Best for braising, long oven roast, or smoking."
  },
  picanha: {
    he: "מתאים לגריל, רוטיסרי, צריבה הפוכה.",
    en: "Best for grill, rotisserie, and reverse sear."
  }
};



const cutMethodRules = {
  ribeye: ["grill", "bbq", "cast_iron", "pan_sear", "reverse_sear"],
  striploin: ["grill", "bbq", "cast_iron", "pan_sear", "reverse_sear"],
  entrecote: ["grill", "bbq", "cast_iron", "pan_sear", "reverse_sear"],
  brisket: ["smoker", "smoking", "low_slow", "oven", "long_cook", "oven_roast"],
  asado: ["long_cook", "smoker", "smoking", "low_slow", "oven", "oven_roast"],
  short_ribs: ["long_cook", "smoker", "smoking", "low_slow", "oven", "oven_roast"],
  picanha: ["grill", "bbq", "reverse_sear"],
  filet: ["grill", "cast_iron", "pan_sear", "reverse_sear"],
  tenderloin: ["grill", "cast_iron", "pan_sear", "reverse_sear"],
  sirloin: ["grill", "bbq", "cast_iron", "pan_sear", "reverse_sear"],
  chuck: ["long_cook", "smoker", "smoking", "low_slow", "oven", "oven_roast"],
  flank: ["grill", "bbq", "cast_iron", "pan_sear"]
};

const expertState = {
  question: "",
  loading: false,
  answer: null,
  suggestedCutId: null,
  suggestedMethodId: null,
  returnToStep: "preferences"
};
function defaultDietaryPreference(lang) {
  return lang === "he" ? "kosher" : "non_kosher";
}

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
    loadingMessages: [
      "מנתחים את הנתונים...",
      "מחפשים השראה חמה 🔥",
      "מרכיבים לך מתכון מושלם...",
      "בודקים מה הכי טרנדי עכשיו...",
      "כמעט שם..."
    ],
    recipeLoadingMessages: [
      "מחממים את הרדאר 🔥",
      "מוצאים את השילוב המושלם...",
      "בונים לך מתכון מדויק..."
    ],
    butcherLoadingMessage: "מחפש קצביות באזור שלך...",
    loadingSteps: [
      "🔥 מזהים טרנדים",
      "🥩 בוחרים נתח מושלם",
      "🍳 מתאימים שיטת בישול",
      "🧂 מוסיפים טעמים",
      "📋 בונים מתכון"
    ],
    titles: {
      landing: "מה בא לך להכין היום?",
      saved: "המתכונים שלי",
      hot: "Smoke Index™",
      preferences: "מה לבשל",
      cook: "Smart Cooking Mode™",
      expert: "שאל את המומחים",
      recipe: "מתכון מלא",
      shopping: "רשימת קניות",
      butcher: "Butcher Radar™"
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
    loadingMessages: [
      "Analyzing trends...",
      "Finding something hot 🔥",
      "Crafting your perfect recipe...",
      "Scanning what's trending...",
      "Almost ready..."
    ],
    recipeLoadingMessages: [
      "Warming up the radar 🔥",
      "Finding the perfect pairing...",
      "Building your precise recipe..."
    ],
    butcherLoadingMessage: "Searching butcher shops near you...",
    loadingSteps: [
      "🔥 מזהים טרנדים",
      "🥩 בוחרים נתח מושלם",
      "🍳 מתאימים שיטת בישול",
      "🧂 מוסיפים טעמים",
      "📋 בונים מתכון"
    ],
    titles: {
      landing: "What do you want to cook today?",
      saved: "My Recipes",
      hot: "Smoke Index™",
      preferences: "What to cook",
      cook: "Smart Cooking Mode™",
      expert: "Ask the Experts",
      recipe: "Cooking Guide",
      shopping: "Shopping List",
      butcher: "Butcher Radar™"
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
    dietaryPreference: defaultDietaryPreference(document.documentElement.lang === "en" ? "en" : "he"),
    servings: 4,
    userQuestion: ""
  },
  mealIdeas: [],
  selectedMealIdea: null,
  recipe: null,
  shopping: { meat: [], seasoning: [], sauceIngredients: [], sideIngredients: [], drinks: [] },
  shoppingChecks: {},
  butchers: [],
  location: null,
  variationCount: 0,
  savedRecipes: [],
  lastOpenedRecipeId: null,
  recipeLoading: false,
  butcherLoading: false,
  navigation: {
    generatorMode: true,
    askExpertMode: false
  }
};

const el = {
  appRoot: document.getElementById("app"),
  openingSplash: document.getElementById("openingSplash"),
  header: document.getElementById("appHeader"),
  title: document.getElementById("screenTitle"),
  subtitle: document.getElementById("screenSubtitle"),
  progressWrap: document.querySelector(".progress-wrap"),
  content: document.getElementById("screenContent"),
  nextBtn: document.getElementById("nextBtn"),
  backBtn: document.getElementById("backBtn"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  openingMessage: document.getElementById("openingMessage"),
  openingSteps: document.getElementById("openingSteps"),
  openingProgressFill: document.getElementById("openingProgressFill"),
  toast: document.getElementById("appToast")
};

const openingExperience = {
  messageIndex: 0,
  stepIndex: 0,
  progress: 0,
  rafId: null,
  messageTimer: null,
  stepTimer: null,
  running: false,
  startTs: 0
};

let recipeLoadingInterval = null;
let toastTimer = null;

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
function getFlavorById(id) { return flavorProfiles.find((f) => f.id === id) || flavorProfiles[0]; }

async function findFirstExistingAsset(candidates = []) {
  for (const src of candidates) {
    try {
      const ok = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
      if (ok) return src;
    } catch {
      // Ignore and continue trying fallbacks.
    }
  }
  return "";
}

async function applyResolvedAssets() {
  const [appBg, hero, hot, recipe, butcher] = await Promise.all([
    findFirstExistingAsset(assetCandidates.appBg),
    findFirstExistingAsset(assetCandidates.hero),
    findFirstExistingAsset(assetCandidates.hot),
    findFirstExistingAsset(assetCandidates.recipe),
    findFirstExistingAsset(assetCandidates.butcher)
  ]);

  const root = document.documentElement;
  if (appBg) root.style.setProperty("--asset-app-bg", `url('${appBg}')`);
  if (hero) root.style.setProperty("--asset-hero", `url('${hero}')`);
  if (hot) root.style.setProperty("--asset-hot", `url('${hot}')`);
  if (recipe) root.style.setProperty("--asset-recipe", `url('${recipe}')`);
  if (butcher) root.style.setProperty("--asset-butcher", `url('${butcher}')`);
}

function render() {
  const step = STEPS[currentStep];
  const totalFlowSteps = STEPS.length - 1;
  const progress = step === "landing" ? 0 : Math.round((currentStep / totalFlowSteps) * 100);

  document.documentElement.lang = state.lang;
  document.documentElement.dir = t("dir");
  el.appRoot.dataset.step = step;
  el.title.textContent = step === "landing" ? "" : t(`titles.${step}`);
  el.subtitle.textContent = "";
  el.header.classList.toggle("landing-minimal", step === "landing" || step === "saved");
  el.progressWrap?.classList.toggle("hidden", step === "landing" || step === "saved");
  el.progressFill.style.width = `${progress}%`;
  el.progressText.textContent = `${t("stepLabel")} ${Math.max(currentStep, 1)}/${totalFlowSteps}`;
  el.backBtn.textContent = t("back");
  el.nextBtn.textContent = currentStep === STEPS.length - 1
    ? t("finish")
    : step === "preferences"
      ? (state.lang === "he" ? "צור מתכון" : "Generate Recipe")
      : t("next");
  el.backBtn.classList.toggle("hidden", currentStep === 0);
  el.nextBtn.classList.toggle("hidden", step === "landing" || step === "saved");

  el.content.classList.remove("fade-in");
  void el.content.offsetWidth;
  el.content.classList.add("fade-in");
  el.appRoot.classList.remove("screen-transition");
  void el.appRoot.offsetWidth;
  el.appRoot.classList.add("screen-transition");

  if (step === "landing") return renderLanding();
  if (step === "saved") return renderSavedRecipes();
  if (step === "hot") return renderHotNow();
  if (step === "preferences") return renderPreferences();
  if (step === "cook") return renderCookIdeas();
  if (step === "expert") return renderAskExpert();
  if (step === "recipe") return renderRecipe();
  if (step === "shopping") return renderShopping();
  if (step === "butcher") return renderButchers();
}

function renderOpeningStepList() {
  if (!el.openingSteps) return;
  const steps = t("loadingSteps") || [];
  el.openingSteps.innerHTML = steps.map((step, index) => {
    const isActive = index === openingExperience.stepIndex ? "active" : "";
    return `<li class="opening-step ${isActive}">${step}</li>`;
  }).join("");
}

function updateOpeningMessage() {
  if (!el.openingMessage) return;
  const messages = t("loadingMessages") || [];
  if (!messages.length) return;
  el.openingMessage.classList.add("is-swapping");
  window.setTimeout(() => {
    el.openingMessage.textContent = messages[openingExperience.messageIndex % messages.length];
    el.openingMessage.classList.remove("is-swapping");
  }, 140);
}

function updateOpeningProgress(value) {
  if (!el.openingProgressFill) return;
  el.openingProgressFill.style.width = `${Math.min(99, Math.max(0, value))}%`;
}

function tickOpeningProgress() {
  if (!openingExperience.running) return;
  const activeStep = openingExperience.stepIndex + 1;
  const stepsCount = Math.max((t("loadingSteps") || []).length, 1);
  const targetByStep = (activeStep / stepsCount) * 92 + 4;
  openingExperience.progress += (targetByStep - openingExperience.progress) * 0.08;
  updateOpeningProgress(openingExperience.progress);
  openingExperience.rafId = window.requestAnimationFrame(tickOpeningProgress);
}

function startOpeningExperience() {
  if (!el.openingSplash || openingExperience.running) return;
  openingExperience.running = true;
  openingExperience.messageIndex = 0;
  openingExperience.stepIndex = 0;
  openingExperience.progress = 1;
  openingExperience.startTs = performance.now();
  updateOpeningMessage();
  renderOpeningStepList();
  updateOpeningProgress(openingExperience.progress);

  openingExperience.messageTimer = window.setInterval(() => {
    const messages = t("loadingMessages") || [];
    if (!messages.length) return;
    openingExperience.messageIndex = (openingExperience.messageIndex + 1) % messages.length;
    updateOpeningMessage();
  }, 820);

  openingExperience.stepTimer = window.setInterval(() => {
    const steps = t("loadingSteps") || [];
    if (!steps.length) return;
    openingExperience.stepIndex = Math.min(steps.length - 1, openingExperience.stepIndex + 1);
    renderOpeningStepList();
  }, Math.max(500, Math.round(INTRO_MIN_DURATION_MS / 4)));

  openingExperience.rafId = window.requestAnimationFrame(tickOpeningProgress);
}

function stopOpeningExperience() {
  openingExperience.running = false;
  if (openingExperience.messageTimer) window.clearInterval(openingExperience.messageTimer);
  if (openingExperience.stepTimer) window.clearInterval(openingExperience.stepTimer);
  if (openingExperience.rafId) window.cancelAnimationFrame(openingExperience.rafId);
  openingExperience.messageTimer = null;
  openingExperience.stepTimer = null;
  openingExperience.rafId = null;
}

function renderLanding() {
  const latest = state.savedRecipes[0];
  el.content.innerHTML = `
    <div class="card recipe-hero hero-card" style="--recipe-image:var(--asset-hero)">
      <p class="small">${state.lang === "he" ? "Smoke Radar Premium" : "Smoke Radar Premium"}</p>
      <h2>${t("landingTitle")}</h2>
      <p class="small">${t("landingSubtitle")}</p>
    </div>
    <button class="btn btn-choice btn-choice-hot" data-choice="hot">${t("hotAction")}</button>
    <button class="btn btn-choice btn-choice-know" data-choice="feel">${t("knowAction")}</button>
    ${latest ? `
      <div class="card last-recipe-prompt">
        <p>${state.lang === "he" ? "להמשיך מהמתכון האחרון?" : "Continue your last recipe?"}</p>
        <button class="btn btn-ghost" id="openLastRecipeBtn">${state.lang === "he" ? "פתח מתכון אחרון" : "Open Last Recipe"}</button>
      </div>
    ` : ""}
    <button class="btn btn-choice btn-choice-saved" id="openSavedRecipesBtn">${state.lang === "he" ? "המתכונים שלי" : "My Recipes"}</button>
    <div class="footer-separator" aria-hidden="true"></div>
    <section class="card legal-menu">
      <h3>${state.lang === "he" ? "תפריט Smoke Radar" : "Smoke Radar Menu"}</h3>
      <button class="btn btn-ghost" id="aboutBtn">${state.lang === "he" ? "About Smoke Radar" : "About Smoke Radar"}</button>
      <button class="btn btn-ghost" id="termsBtn">${state.lang === "he" ? "Terms of Use" : "Terms of Use"}</button>
      <button class="btn btn-ghost" id="privacyBtn">${state.lang === "he" ? "Privacy Policy" : "Privacy Policy"}</button>
      <button class="btn btn-ghost" id="shareBtn">${state.lang === "he" ? "Share Smoke Radar" : "Share Smoke Radar"}</button>
      <p class="small footer-note">© 2026 Smoke Radar. All rights reserved.</p>
    </section>
    <div class="chips">${cutsCatalog.slice(0, 6).map((cut) => `<span class="chip">${cut.labels[state.lang]}</span>`).join("")}</div>
  `;

  el.content.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.homeChoice = btn.dataset.choice;
      if (state.homeChoice === "hot") {
        await loadHotNow();
        currentStep = STEPS.indexOf("hot");
      } else {
        currentStep = STEPS.indexOf("preferences");
      }
      render();
    });
  });

  document.getElementById("openSavedRecipesBtn")?.addEventListener("click", () => {
    currentStep = STEPS.indexOf("saved");
    render();
  });
  document.getElementById("openLastRecipeBtn")?.addEventListener("click", () => {
    if (!latest) return;
    openSavedRecipe(latest.id);
  });
  document.getElementById("aboutBtn")?.addEventListener("click", () => openLegalModal("about"));
  document.getElementById("termsBtn")?.addEventListener("click", () => openLegalModal("terms"));
  document.getElementById("privacyBtn")?.addEventListener("click", () => openLegalModal("privacy"));
  document.getElementById("shareBtn")?.addEventListener("click", () => shareSmokeRadar());
}

function renderSavedRecipes() {
  const cards = state.savedRecipes.map((item) => {
    const cut = getCutById(item.preferences?.cutId || "ribeye").labels[state.lang];
    const method = getMethodById(item.preferences?.methodId || "grill").labels[state.lang];
    const date = formatSavedDate(item.createdAt);
    const thumbnail = item.thumbnail || recipeThumbnailForCut(item.preferences?.cutId || "ribeye");
    return `
      <article class="card saved-recipe-card">
        <img class="saved-thumb" src="${thumbnail}" alt="${item.title || "recipe"}" />
        <div class="saved-recipe-content">
        <h3>${item.title || (state.lang === "he" ? "מתכון שמור" : "Saved Recipe")}</h3>
        <p class="small">${state.lang === "he" ? "נתח" : "Cut"}: ${cut}</p>
        <p class="small">${state.lang === "he" ? "שיטת בישול" : "Cooking method"}: ${method}</p>
        <p class="small">${state.lang === "he" ? "נשמר בתאריך" : "Saved on"}: ${date}</p>
        <div class="saved-recipe-actions">
          <button class="btn btn-primary" data-open-recipe="${item.id}">${state.lang === "he" ? "פתח מתכון" : "Open Recipe"}</button>
          <button class="btn btn-ghost" data-delete-recipe="${item.id}">${state.lang === "he" ? "מחק" : "Delete"}</button>
        </div>
        </div>
      </article>
    `;
  }).join("");

  el.content.innerHTML = cards || `<div class="card"><p class="small">${state.lang === "he" ? "עדיין אין מתכונים שמורים." : "No saved recipes yet."}</p></div>`;

  el.content.querySelectorAll("[data-open-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => openSavedRecipe(btn.dataset.openRecipe));
  });
  el.content.querySelectorAll("[data-delete-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteSavedRecipe(btn.dataset.deleteRecipe);
      renderSavedRecipes();
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
      <h3>${state.lang === "he" ? "Smoke Index™" : "Smoke Index™"}</h3>
      <p class="small">${state.lang === "he" ? "מתכונים ורעיונות בהשראת סרטונים חמים עם הרבה צפיות" : "Recipes and ideas inspired by trending high-view meat videos"}</p>
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
        <p class="small cut-helper-text" id="cutHelperText"></p>
      </div>
      <div class="field"><label>${state.lang === "he" ? "שיטת בישול" : "Cooking method"}</label>
        <select id="methodId"></select>
        <p class="small method-helper-text" id="methodHelperText"></p>
      </div>
      <div class="field"><label>${state.lang === "he" ? "פרופיל טעמים" : "Flavor profile"}</label>
        <select id="flavorId">${flavorProfiles.map((f) => `<option value="${f.id}">${f.labels[state.lang]}</option>`).join("")}</select>
      </div>
      <div class="field"><label>${state.lang === "he" ? "העדפת כשרות" : "Dietary preference"}</label>
        <select id="dietaryPreference">
          <option value="kosher">${state.lang === "he" ? "כשר" : "Kosher"}</option>
          <option value="non_kosher">${state.lang === "he" ? "לא כשר" : "Non-kosher"}</option>
        </select>
      </div>
      <div class="field">
        <label>${state.lang === "he" ? "מנות" : "Servings"}</label>
        <div class="servings-inline">
          <button class="btn btn-ghost servings-btn" type="button" id="servingsMinus">−</button>
          <strong id="servingsValue">${state.preferences.servings}</strong>
          <button class="btn btn-ghost servings-btn" type="button" id="servingsPlus">+</button>
        </div>
      </div>
      <div class="field">
        <label>${state.lang === "he" ? "בקשה חופשית" : "Custom request"}</label>
        <input id="userQuestion" type="text" maxlength="220" placeholder="${state.lang === "he" ? "שאלה או בקשה מיוחדת? למשל: איזה בשר מתאים לבישול ארוך בקדירה?" : "Any question or special request? Example: what cut works best for long braising?"}" />
      </div>
      <button type="button" class="btn btn-ghost" id="toExpertBtn">${state.lang === "he" ? "שאל את המומחים" : "Ask the Experts"}</button>
      <button type="button" class="btn btn-primary" id="generateRecipeBtn">${state.lang === "he" ? "צור מתכון" : "Generate Recipe"}</button>
    </div>
  `;

  ["meatType", "cutId", "methodId", "flavorId", "dietaryPreference"].forEach((id) => {
    const input = document.getElementById(id);
    input.value = state.preferences[id];
    input.addEventListener("change", collectPreferences);
    input.addEventListener("input", collectPreferences);
  });
  const questionInput = document.getElementById("userQuestion");
  questionInput.value = state.preferences.userQuestion || "";
  questionInput.addEventListener("input", collectPreferences);
  setupMethodOptions();
  updateCutHelperText();
  updateMethodHelperText();
  document.getElementById("cutId")?.addEventListener("change", () => { updateCutHelperText(); setupMethodOptions(); updateMethodHelperText(); });
  document.getElementById("methodId")?.addEventListener("change", updateMethodHelperText);
  document.getElementById("toExpertBtn")?.addEventListener("click", () => {
    state.navigation.askExpertMode = true;
    state.navigation.generatorMode = false;
    expertState.returnToStep = "preferences";
    currentStep = STEPS.indexOf("expert");
    render();
  });
  document.getElementById("generateRecipeBtn")?.addEventListener("click", () => {
    collectPreferences();
    state.navigation.generatorMode = true;
    state.navigation.askExpertMode = false;
    state.recipe = null;
    currentStep = STEPS.indexOf("recipe");
    render();
  });
  document.getElementById("servingsMinus")?.addEventListener("click", () => updateServings(-1, false));
  document.getElementById("servingsPlus")?.addEventListener("click", () => updateServings(1, false));
}


function getAllowedMethodsForCut(cutId) {
  return cutMethodRules[cutId] || methods.map((m) => m.id);
}

function setupMethodOptions() {
  const methodSelect = document.getElementById("methodId");
  const cutId = document.getElementById("cutId")?.value || state.preferences.cutId;
  if (!methodSelect) return;
  const allowed = new Set(getAllowedMethodsForCut(cutId));
  const options = methods.filter((m) => allowed.has(m.id));
  methodSelect.innerHTML = options.map((m) => `<option value="${m.id}">${m.labels[state.lang]}</option>`).join("");
  if (!allowed.has(state.preferences.methodId)) {
    state.preferences.methodId = options[0]?.id || "grill";
  }
  methodSelect.value = state.preferences.methodId;
}

function updateMethodHelperText() {
  const helperEl = document.getElementById("methodHelperText");
  if (!helperEl) return;
  const cutId = document.getElementById("cutId")?.value || state.preferences.cutId;
  const allowed = getAllowedMethodsForCut(cutId).map((id) => getMethodById(id).labels[state.lang]);
  helperEl.textContent = state.lang === "he"
    ? `מתאים ל: ${allowed.join(" / ")}`
    : `Best methods: ${allowed.join(" / ")}`;
}

function collectPreferences() {
  state.preferences.meatType = document.getElementById("meatType").value;
  state.preferences.cutId = document.getElementById("cutId").value;
  state.preferences.methodId = document.getElementById("methodId").value;
  state.preferences.flavorId = document.getElementById("flavorId").value;
  state.preferences.dietaryPreference = document.getElementById("dietaryPreference").value === "kosher" ? "kosher" : "non_kosher";
  state.preferences.userQuestion = String(document.getElementById("userQuestion")?.value || "").trim();
  state.preferences.servings = Number(state.preferences.servings || 1);
}

function updateCutHelperText() {
  const helperEl = document.getElementById("cutHelperText");
  if (!helperEl) return;
  const cutId = document.getElementById("cutId")?.value || state.preferences.cutId;
  const helper = cutHelperText[cutId]?.[state.lang] || (state.lang === "he"
    ? "טיפ: בחר שיטת בישול שתואמת את מאפייני הנתח."
    : "Tip: choose a method that matches your selected cut.");
  helperEl.textContent = helper;
}


function renderAskExpert() {
  const placeholder = state.lang === "he" ? "למשל: איזה בשר מתאים לקדירה?" : "Example: which cut is best for stew?";
  const answerHtml = expertState.answer ? `
    <div class="card">
      <h3>${state.lang === "he" ? "תשובת מומחה" : "Expert Answer"}</h3>
      <p>${expertState.answer}</p>
      <div class="inline-actions">
        <button class="btn btn-primary" id="expertUseBtn">${state.lang === "he" ? "להכין מתכון על בסיס זה" : "Generate Recipe from This"}</button>
        <button class="btn btn-ghost" id="expertAnotherBtn">${state.lang === "he" ? "יש לי שאלה נוספת" : "Ask Another Question"}</button>
        <button class="btn btn-ghost" id="expertBackBtn">${state.lang === "he" ? "חזרה למחולל" : "Back to Generator"}</button>
      </div>
    </div>` : "";

  el.content.innerHTML = `
    <div class="card">
      <h3>${state.lang === "he" ? "שאל את המומחים" : "Ask the Experts"}</h3>
      <div class="field">
        <input id="expertQuestion" type="text" maxlength="220" placeholder="${placeholder}" value="${expertState.question || ""}" />
      </div>
      <button class="btn btn-primary" id="expertSubmitBtn">${state.lang === "he" ? "שלח" : "Send"}</button>
    </div>
    ${expertState.loading ? renderRecipeLoadingCard(state.lang === "he" ? "המומחים חושבים..." : "Experts are thinking...") : ""}
    ${answerHtml}
  `;

  document.getElementById("expertQuestion")?.addEventListener("input", (event) => {
    expertState.question = event.target.value;
  });
  document.getElementById("expertSubmitBtn")?.addEventListener("click", async () => {
    const q = String(document.getElementById("expertQuestion")?.value || "").trim();
    if (!q) return;
    expertState.question = q;
    expertState.loading = true;
    expertState.answer = null;
    renderAskExpert();
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const result = buildExpertAnswer(q);
    expertState.answer = result.answer;
    expertState.suggestedCutId = result.cutId;
    expertState.suggestedMethodId = result.methodId;
    expertState.loading = false;
    renderAskExpert();
  });

  document.getElementById("expertUseBtn")?.addEventListener("click", () => {
    if (expertState.suggestedCutId) state.preferences.cutId = expertState.suggestedCutId;
    if (expertState.suggestedMethodId) state.preferences.methodId = expertState.suggestedMethodId;
    state.preferences.userQuestion = expertState.question || state.preferences.userQuestion;
    state.navigation.askExpertMode = false;
    state.navigation.generatorMode = true;
    currentStep = STEPS.indexOf("preferences");
    render();
  });
  document.getElementById("expertAnotherBtn")?.addEventListener("click", () => {
    expertState.answer = null;
    expertState.question = "";
    expertState.suggestedCutId = null;
    expertState.suggestedMethodId = null;
    renderAskExpert();
  });
  document.getElementById("expertBackBtn")?.addEventListener("click", () => {
    state.navigation.askExpertMode = false;
    state.navigation.generatorMode = true;
    currentStep = STEPS.indexOf(expertState.returnToStep || "preferences");
    render();
  });
}

function buildExpertAnswer(question) {
  const q = question.toLowerCase();
  const isLongCook = /קדירה|בישול ארוך|נמוך|איטי|long|braise|slow/.test(q);
  const isSmoker = /מעשנה|עישון|smok/.test(q);
  const isQuick = /מהיר|סטייק|צריבה|grill|מחבת/.test(q);
  if (isLongCook || isSmoker) {
    return {
      cutId: isSmoker ? "brisket" : "asado",
      methodId: isSmoker ? "smoker" : "long_cook",
      answer: state.lang === "he"
        ? "לבישול ארוך בקדירה מתאימים נתחים עם הרבה קולגן כמו אסאדו, צוואר או כתף. אם יש מעשנה, בריסקט הוא בחירה מעולה לזמן ארוך."
        : "For long braising, collagen-rich cuts like short ribs or chuck are best. If you have a smoker, brisket is ideal for a long cook."
    };
  }
  if (isQuick) {
    return {
      cutId: "ribeye",
      methodId: "grill",
      answer: state.lang === "he"
        ? "למנה מהירה ומדויקת עדיף אנטריקוט או פילה על גריל/מחבת: צריבה קצרה ומנוחה קצרה יתנו תוצאה עסיסית."
        : "For a fast, accurate result, use ribeye or filet on grill/pan with a short sear and short rest."
    };
  }
  return {
    cutId: "picanha",
    methodId: "grill",
    answer: state.lang === "he"
      ? "אם אין מגבלה מיוחדת, פיקניה על גריל היא בחירה מצוינת: טעם עשיר, זמן הכנה קצר ותוצאה יציבה."
      : "If there are no constraints, picanha on the grill is a strong choice: rich flavor and reliable results."
  };
}

function buildIdeas() {
  const cut = getCutById(state.preferences.cutId).labels[state.lang];
  return [
    { title: `${cut} ${state.lang === "he" ? "עם צריבה חזקה" : "with high-heat crust"}`, note: state.lang === "he" ? "ביצוע מהיר ומדויק" : "Quick precision cook", flavorId: "classic" },
    { title: `${cut} ${state.lang === "he" ? "במעשנה ארוכה" : "smoked low and slow"}`, note: state.lang === "he" ? "עומק טעמים" : "Deep smoke profile", flavorId: "smoky" },
    { title: `${cut} ${state.lang === "he" ? "עם שום ועשבי תיבול" : "with garlic and herbs"}`, note: state.lang === "he" ? "מנה עשירה ומאוזנת" : "Savory herb-forward style", flavorId: "garlic_herbs" },
    { title: `${cut} ${state.lang === "he" ? "בסגנון ים תיכוני" : "Mediterranean style"}`, note: state.lang === "he" ? "עשבי תיבול והדר" : "Herbs and citrus", flavorId: "mediterranean" }
  ];
}

function renderCookIdeas() {
  state.mealIdeas = buildIdeas();
  el.content.innerHTML = `
    <div class="card cook-mode-header">
      <h3 class="cook-mode-title">${state.lang === "he" ? "Smart Cooking Mode™" : "Smart Cooking Mode™"}</h3>
      <p class="small">${state.lang === "he" ? "בחר סגנון בישול והמשך למתכון מותאם." : "Choose your cooking style and continue to a tailored recipe."}</p>
    </div>
    <button class="btn btn-ghost" id="cookExpertBtn">${state.lang === "he" ? "שאל את המומחים" : "Ask the Experts"}</button>
    ${state.mealIdeas.map((idea, idx) => `
      <button class="btn btn-choice ${state.selectedMealIdea === idx ? "active" : ""}" data-idea="${idx}">
        <strong>${idea.title}</strong>
        <p class="small">${idea.note}</p>
      </button>`).join("")}
  `;

  document.getElementById("cookExpertBtn")?.addEventListener("click", () => {
    state.navigation.askExpertMode = true;
    state.navigation.generatorMode = false;
    expertState.returnToStep = "cook";
    currentStep = STEPS.indexOf("expert");
    render();
  });

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
  const cut = getCutById(p.cutId).labels[state.lang];
  const method = getMethodById(p.methodId).labels[state.lang];
  const flavor = getFlavorById(p.flavorId).labels[state.lang];
  const query = new URLSearchParams({
    lang: state.lang,
    meatType: p.meatType,
    cut,
    method,
    flavor,
    dietaryPreference: p.dietaryPreference,
    servings: String(p.servings),
    userQuestion: p.userQuestion || "",
    mode: "all",
    variation: state.variationCount ? "1" : "0",
    r: String(Math.floor(Math.random() * 1000000))
  });

  const res = await fetch(`/api/ai-recipe?${query.toString()}`);
  const data = await res.json();
  state.recipe = enhanceRecipeQuality(data.structuredRecipe || null);
  state.shopping = buildShoppingList(state.recipe);
}

function recipeHeroForCut() {
  return "var(--asset-recipe)";
}

function renderRecipe() {
  if (!state.recipe) {
    startRecipeLoadingState();
    if (!state.recipeLoading) {
      state.recipeLoading = true;
      loadRecipe().then(() => {
        stopRecipeLoadingState();
        state.recipeLoading = false;
        renderRecipe();
      }).catch(() => {
        stopRecipeLoadingState();
        state.recipeLoading = false;
        el.content.innerHTML = `<div class="card">${state.lang === "he" ? "לא הצלחנו לטעון מתכון כרגע." : "Could not load recipe right now."}</div>`;
      });
    }
    return;
  }

  const r = state.recipe;
  const main = r.main || {};
  const selectedCut = getCutById(state.preferences.cutId).labels[state.lang];
  const selectedMethod = getMethodById(state.preferences.methodId).labels[state.lang];
  const selectedFlavor = getFlavorById(state.preferences.flavorId).labels[state.lang];
  const prep = main.prepTime || (state.lang === "he" ? "20 דקות" : "20 min");
  const cook = main.cookTime || (state.lang === "he" ? "45 דקות" : "45 min");
  const total = main.totalTime || (state.lang === "he" ? "65 דקות" : "65 min");
  const difficulty = main.difficulty || (state.lang === "he" ? "בינוני" : "Medium");
  const kosherLabel = state.preferences.dietaryPreference === "kosher" ? (state.lang === "he" ? "כשר" : "Kosher") : (state.lang === "he" ? "לא כשר" : "Non-kosher");
  const badges = [
    { label: state.lang === "he" ? "סה״כ זמן" : "Total Time", value: total },
    { label: state.lang === "he" ? "קושי" : "Difficulty", value: difficulty },
    { label: state.lang === "he" ? "מנות" : "Servings", value: state.preferences.servings },
    { label: state.lang === "he" ? "כשרות" : "Diet", value: kosherLabel }
  ];
  const chefTips = getChefTips(state.preferences.cutId, state.preferences.methodId);
  const sauces = normalizeSubRecipes(r.sauces, "sauce");
  const sides = normalizeSubRecipes(r.sides, "side");
  const glossaryTitle = state.lang === "he" ? "מקרא פעולות" : "Technique Glossary";
  const glossary = Array.isArray(main.techniqueGlossary) ? main.techniqueGlossary.filter(Boolean) : [];

  el.content.innerHTML = `
    <div class="card recipe-hero" style="--recipe-image:${recipeHeroForCut()}">
      <h2>${main.title || (state.lang === "he" ? "מתכון פרימיום" : "Premium Recipe")}</h2>
      <p class="small">${main.description || ""}</p>
    </div>

    <div class="badges-row">
      ${badges.map((badge) => `<span class="badge"><strong>${badge.label}</strong> ${badge.value}</span>`).join("")}
    </div>

    <div class="card meta-grid">
      <div class="meta-item"><strong>${state.lang === "he" ? "זמן הכנה" : "Prep Time"}</strong>${prep}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "זמן בישול" : "Cook Time"}</strong>${cook}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "סה״כ זמן" : "Total Time"}</strong>${total}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "קושי" : "Difficulty"}</strong>${difficulty}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "נתח" : "Cut"}</strong>${selectedCut}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "שיטת בישול" : "Cooking method"}</strong>${selectedMethod}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "פרופיל טעמים" : "Flavor profile"}</strong>${selectedFlavor}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "מנות" : "Servings"}</strong>${state.preferences.servings}</div>
      <div class="meta-item"><strong>${state.lang === "he" ? "העדפת כשרות" : "Dietary preference"}</strong>${kosherLabel}</div>
    </div>

    <div class="card"><h3>${state.lang === "he" ? "מרכיבים" : "Ingredients"}</h3><ul class="list">${(main.ingredients || []).map((i) => `<li>${i}</li>`).join("")}</ul></div>
    <div class="card"><h3>${state.lang === "he" ? "שלבי הכנה" : "Step-by-step"}</h3><ol class="list">${(main.steps || []).map((s) => `<li>${s}</li>`).join("")}</ol></div>
    ${glossary.length ? `<div class="card"><h3>${glossaryTitle}</h3><ul class="list">${glossary.map((item) => `<li>${item}</li>`).join("")}</ul></div>` : ""}
    <div class="card">
      <h3>${state.lang === "he" ? "רטבים" : "Sauces"}</h3>
      ${renderSubRecipeDetails(sauces)}
    </div>
    <div class="card">
      <h3>${state.lang === "he" ? "תוספות" : "Side Dishes"}</h3>
      ${renderSubRecipeDetails(sides)}
    </div>
    <div class="card"><h3>${state.lang === "he" ? "שתייה מתאימה" : "Drink Pairings"}</h3><ul class="list">${(r.drinkPairings || []).map((d) => `<li>${d.name}</li>`).join("")}</ul></div>
    <div class="card">
      <h3>${state.lang === "he" ? "טיפים מהשף" : "Chef Tips"}</h3>
      <ul class="list">${chefTips.map((tip) => `<li>${tip}</li>`).join("")}</ul>
    </div>

    <div class="inline-actions">
      <button class="btn btn-ghost" id="saveRecipeBtn">${state.lang === "he" ? "שמור מתכון" : "Save Recipe"}</button>
      <button class="btn btn-ghost" id="copyShoppingBtn">${state.lang === "he" ? "📋 העתק רשימת קניות" : "📋 Copy Shopping List"}</button>
      <button class="btn btn-ghost" id="variationBtn">${state.lang === "he" ? "🔄 נסה וריאציה" : "🔄 Try Variation"}</button>
      <button class="btn btn-ghost" id="regenBtn">${state.lang === "he" ? "צור מתכון מחדש" : "Regenerate Recipe"}</button>
      <div class="servings-inline recipe-servings-inline">
        <span class="small servings-label">${state.lang === "he" ? "מנות" : "Servings"}</span>
        <button class="btn btn-ghost servings-btn" type="button" id="recipeServingsMinus">−</button>
        <strong id="recipeServingsValue">${state.preferences.servings}</strong>
        <button class="btn btn-ghost servings-btn" type="button" id="recipeServingsPlus">+</button>
      </div>
      <button class="btn btn-primary" id="toShoppingBtn">${state.lang === "he" ? "המשך לרשימת קניות" : "Continue to Shopping List"}</button>
    </div>
  `;

  document.getElementById("saveRecipeBtn").addEventListener("click", () => {
    saveCurrentRecipe();
  });
  document.getElementById("copyShoppingBtn").addEventListener("click", () => copyShoppingListToClipboard());
  document.getElementById("variationBtn").addEventListener("click", async () => {
    state.variationCount += 1;
    state.recipe = null;
    renderRecipe();
  });
  document.getElementById("regenBtn").addEventListener("click", async () => {
    state.recipe = null;
    renderRecipe();
  });
  document.getElementById("recipeServingsMinus")?.addEventListener("click", () => updateServings(-1, true));
  document.getElementById("recipeServingsPlus")?.addEventListener("click", () => updateServings(1, true));
  document.getElementById("toShoppingBtn").addEventListener("click", () => {
    currentStep = STEPS.indexOf("shopping");
    render();
  });
}

function buildShoppingList(recipe) {
  const mainIng = recipe?.main?.ingredients || [];
  const sauces = normalizeSubRecipes(recipe?.sauces, "sauce").flatMap((s) => s.ingredients);
  const sides = normalizeSubRecipes(recipe?.sides, "side").flatMap((s) => s.ingredients);
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
            return `<label class="check-item"><input type="checkbox" data-check="${id}" ${state.shoppingChecks[id] ? "checked" : ""} /><span>${item}</span></label>`;
          }).join("") : `<p class="small">${state.lang === "he" ? "לא נוספו פריטים" : "No items added"}</p>`}
        </div>`;
    }).join("")}

    <button class="btn btn-ghost" id="copyList">${state.lang === "he" ? "📋 העתק רשימת קניות" : "📋 Copy Shopping List"}</button>
    <button class="btn btn-primary" id="toButchers">${state.lang === "he" ? "המשך לאיתור קצביות" : "Continue to butcher finder"}</button>
  `;

  el.content.querySelectorAll("[data-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      state.shoppingChecks[checkbox.dataset.check] = checkbox.checked;
    });
  });

  document.getElementById("copyList").addEventListener("click", async () => copyShoppingListToClipboard());
  document.getElementById("toButchers").addEventListener("click", () => {
    currentStep = STEPS.indexOf("butcher");
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
      <div class="card visual-map" aria-label="Butcher map"></div>
      <button id="findButchers" class="btn btn-primary">${state.lang === "he" ? "📍 מצא קצביות קרובות" : "📍 Find nearby butcher shops"}</button>
    `;
    document.getElementById("findButchers").addEventListener("click", async () => {
      state.butcherLoading = true;
      el.content.innerHTML = renderButcherLoading();
      try {
        await loadButchers();
        state.butcherLoading = false;
        renderButchers();
      } catch {
        state.butcherLoading = false;
        el.content.innerHTML = `<div class="card">${state.lang === "he" ? "נדרשת הרשאת מיקום כדי לאתר קצביות." : "Location permission is required to find butcher shops."}</div>`;
      }
    });
    return;
  }

  const distances = state.butchers.map((item) => getDistanceValue(item)).filter((v) => Number.isFinite(v));
  const closestDistance = distances.length ? Math.min(...distances) : NaN;
  const rankedButchers = [...state.butchers]
    .map((shop) => {
      const distanceKm = getDistanceValue(shop);
      return { ...shop, distanceKm, rankingScore: getButcherRankingScore(shop, distanceKm) };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);

  el.content.innerHTML = `
    <div class="card visual-map" aria-label="Butcher map"></div>
    ${rankedButchers.slice(0, 8).map((b, idx) => {
      const stars = "⭐".repeat(Math.max(1, Math.min(5, Math.round(b.rating || 4))));
      const distance = getDistanceValue(b);
      const isClosest = Number.isFinite(distance) && Number.isFinite(closestDistance) && distance === closestDistance;
      const badges = [
        idx === 0 ? (state.lang === "he" ? "מומלץ לידך" : "Recommended Near You") : "",
        isClosest ? (state.lang === "he" ? "הכי קרוב" : "Closest") : ""
      ].filter(Boolean);
      return `
        <article class="card butcher-card ${idx === 0 ? "featured" : ""}">
          ${badges.length ? `<div class="badges-row">${badges.map((badge) => `<span class="badge badge-emphasis">${badge}</span>`).join("")}</div>` : ""}
          <strong>📍 ${b.name}</strong>
          <p class="small">${b.address || ""}</p>
          ${Number.isFinite(distance) ? `<p class="small">${state.lang === "he" ? `מרחק ממך: ${formatDistance(distance)}` : `Distance: ${formatDistance(distance)}`}</p>` : ""}
          ${renderOpenNowStatus(b)}
          <div class="butcher-footer">
            <p class="small butcher-rating">${stars} ${b.rating || "-"} (${b.userRatingsTotal || 0})</p>
            <a class="btn btn-primary" href="${b.mapsUrl}" target="_blank" rel="noopener">${state.lang === "he" ? "פתח במפות" : "Open in Maps"}</a>
          </div>
        </article>`;
    }).join("")}
  `;
}

function normalizeSubRecipes(items, type) {
  const list = Array.isArray(items) ? items : [];
  const normalized = list.map((item) => ({
    title: item?.name || defaultSubRecipe(type).title,
    description: item?.description || "",
    ingredients: (item?.ingredients || []).filter(Boolean),
    steps: (item?.steps || []).filter(Boolean)
  }));

  if (!normalized.length) return [defaultSubRecipe(type)];

  return normalized.map((item) => {
    const fallback = defaultSubRecipe(type, item.title);
    return {
      title: item.title || fallback.title,
      description: item.description || fallback.description,
      ingredients: item.ingredients.length ? item.ingredients : fallback.ingredients,
      steps: item.steps.length ? item.steps : fallback.steps
    };
  });
}

function defaultSubRecipe(type, explicitTitle) {
  if (state.lang === "he") {
    if (type === "sauce") {
      return {
        title: explicitTitle || "צ'ימיצ'ורי קלאסי",
        description: "רוטב עשבים טרי שמוסיף חומציות ורעננות.",
        ingredients: ["1/2 כוס פטרוזיליה קצוצה", "2 שיני שום כתושות", "3 כפות שמן זית", "1 כף חומץ יין אדום", "מלח ופלפל לפי הטעם"],
        steps: ["מערבבים בקערה את כל המרכיבים.", "טועמים ומאזנים מלח/חומץ.", "מגישים לצד הבשר או מעליו."]
      };
    }
    return {
      title: explicitTitle || "תפוחי אדמה מעושנים",
      description: "תוספת אדמתית עם קראסט עדין ועשן מאוזן.",
      ingredients: ["4 תפוחי אדמה בינוניים חתוכים", "2 כפות שמן זית", "1 כפית פפריקה מעושנת", "1/2 כפית מלח", "1/4 כפית פלפל שחור"],
      steps: ["מערבבים את תפוחי האדמה עם התיבול.", "צולים בתנור או על הגריל עד הזהבה.", "מגישים חם לצד המנה העיקרית."]
    };
  }

  if (type === "sauce") {
    return {
      title: explicitTitle || "Classic Chimichurri",
      description: "Fresh herb sauce with balanced acidity.",
      ingredients: ["1/2 cup chopped parsley", "2 minced garlic cloves", "3 tbsp olive oil", "1 tbsp red wine vinegar", "Salt and pepper to taste"],
      steps: ["Combine all ingredients in a bowl.", "Adjust seasoning and acidity.", "Serve over or beside the meat."]
    };
  }
  return {
    title: explicitTitle || "Smoky Roasted Potatoes",
    description: "Earthy potatoes with light smoke and crisp edges.",
    ingredients: ["4 medium potatoes, cubed", "2 tbsp olive oil", "1 tsp smoked paprika", "1/2 tsp salt", "1/4 tsp black pepper"],
    steps: ["Toss potatoes with oil and seasoning.", "Roast or grill until golden and tender.", "Serve hot next to the main dish."]
  };
}

function renderSubRecipeDetails(items) {
  if (!items.length) return `<p class="small">${state.lang === "he" ? "לא נוספו פריטים" : "No items added"}</p>`;
  return items.map((item) => `
    <div class="sub-recipe-block">
      <h4>${item.title}</h4>
      <p class="small">${item.description || (state.lang === "he" ? "תוספת מומלצת למנה." : "Recommended side pairing.")}</p>
      <p class="small">${state.lang === "he" ? "מרכיבים" : "Ingredients"}</p>
      <ul class="list">${item.ingredients.map((ingredient) => `<li>${ingredient}</li>`).join("")}</ul>
      <p class="small">${state.lang === "he" ? "הכנה" : "Instructions"}</p>
      <ol class="list">${item.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
    </div>
  `).join("");
}

async function handleNext() {
  const step = STEPS[currentStep];
  if (step === "saved") return;
  if (step === "hot" && state.homeChoice === "hot" && state.selectedHot === null) return;
  if (step === "cook" && state.selectedMealIdea === null) return;
  if (step === "expert") {
    state.navigation.askExpertMode = false;
    state.navigation.generatorMode = true;
    currentStep = STEPS.indexOf(expertState.returnToStep || "preferences");
    render();
    return;
  }
  if (step === "preferences") {
    collectPreferences();
    state.navigation.generatorMode = true;
    state.navigation.askExpertMode = false;
    state.recipe = null;
    currentStep = STEPS.indexOf("recipe");
    render();
    return;
  }
  if (step === "recipe") {
    currentStep = STEPS.indexOf("shopping");
    render();
    return;
  }
  if (step === "shopping") {
    currentStep = STEPS.indexOf("butcher");
    render();
    return;
  }
  if (step === "butcher") {
    currentStep = 0;
    state.recipe = null;
    render();
    return;
  }

  if (currentStep < STEPS.length - 1) {
    currentStep += 1;
    render();
  } else {
    currentStep = 0;
    state.recipe = null;
    render();
  }
}

function getDistanceValue(shop) {
  const candidates = [shop.distanceKm, shop.distance_km, shop.distance, shop.distanceMeters ? shop.distanceMeters / 1000 : null];
  const first = candidates.find((v) => typeof v === "number" && Number.isFinite(v) && v >= 0);
  if (Number.isFinite(first)) return first;
  if (typeof shop.distanceText === "string") {
    const parsed = Number(shop.distanceText.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed)) {
      if (/mi|miles?/i.test(shop.distanceText)) return parsed * 1.60934;
      return parsed;
    }
  }
  const lat = Number(shop?.lat ?? shop?.latitude ?? shop?.location?.lat ?? shop?.geometry?.location?.lat);
  const lng = Number(shop?.lng ?? shop?.longitude ?? shop?.location?.lng ?? shop?.geometry?.location?.lng);
  if (state.location && Number.isFinite(lat) && Number.isFinite(lng)) {
    return haversineDistanceKm(state.location.lat, state.location.lng, lat, lng);
  }
  return NaN;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getChefTips(cutId, methodId) {
  const tipBank = {
    he: {
      grill: ["חמם את הרשת היטב לפני שהבשר עולה עליה.", "הפוך את הנתח פעם אחת בלבד לקבלת צריבה טובה.", "תן לבשר לנוח 5–7 דקות לפני פריסה."],
      smoker: ["שמור על טמפרטורה יציבה לאורך כל העישון.", "רסס מעט נוזלים כל שעה לשמירה על לחות.", "עטוף את הנתח כשהקליפה מתייצבת."],
      cast_iron: ["ייבש את הנתח לפני הצריבה לקבלת קרסט מושלם.", "אל תעמיס מחבת — נתח אחד בכל פעם.", "סיים עם חמאה ועשבי תיבול בארבעים השניות האחרונות."],
      default: ["תבל מראש ותן לבשר 20 דקות בטמפרטורת חדר.", "השתמש במדחום פנימי כדי לדייק בדרגת עשייה.", "מנוחה קצרה לפני חיתוך תשמור על עסיסיות."]
    },
    en: {
      grill: ["Preheat the grates fully before adding the meat.", "Flip once for a stronger crust.", "Rest the meat 5–7 minutes before slicing."],
      smoker: ["Keep smoker temperature steady throughout the cook.", "Spritz lightly every hour to maintain moisture.", "Wrap once bark sets to push through the stall."],
      cast_iron: ["Pat the cut dry before searing for better crust.", "Avoid crowding the pan—one cut at a time.", "Finish with butter and herbs in the final 40 seconds."],
      default: ["Season early and rest the meat 20 minutes at room temp.", "Use an internal thermometer for accurate doneness.", "A short rest before slicing keeps juices inside."]
    }
  };

  const methodTips = tipBank[state.lang][methodId] || tipBank[state.lang].default;
  if (cutId === "brisket" || cutId === "short_ribs") {
    return state.lang === "he"
      ? ["לנתחים קשים יותר תן זמן בישול ארוך ועדין.", "המתן עד לרכות לפני פריסה.", "פרוס נגד הסיבים להגשה רכה יותר."]
      : ["For tougher cuts, give them low, steady time.", "Wait for tenderness before slicing.", "Slice against the grain for a softer bite."];
  }
  return methodTips.slice(0, 3);
}

function enhanceRecipeQuality(recipe) {
  if (!recipe || typeof recipe !== "object") return recipe;
  const methodId = state.preferences.methodId;
  const cutId = state.preferences.cutId;
  const lang = state.lang;
  const kosherMode = state.preferences.dietaryPreference === "kosher";
  const main = recipe.main || {};
  const ingredients = Array.isArray(main.ingredients) ? [...main.ingredients] : [];
  const steps = Array.isArray(main.steps) ? [...main.steps] : [];

  const enrichedMain = { ...main, ingredients, steps };
  applyCutMethodRecipeRules(enrichedMain, methodId, cutId, lang);
  ensureDefinitionsInSteps(enrichedMain, lang);
  ensureMarinadeSupport(enrichedMain, methodId, cutId, lang);
  if (kosherMode) applyKosherAdjustments(enrichedMain, lang);
  if (lang === "he") enforceHebrewOnlyRecipe(enrichedMain);

  const recipeCopy = {
    ...recipe,
    main: enrichedMain,
    sauces: normalizeSubRecipes(recipe.sauces, "sauce"),
    sides: normalizeSubRecipes(recipe.sides, "side"),
    drinkPairings: Array.isArray(recipe.drinkPairings) ? recipe.drinkPairings.map((d) => ({ ...d })) : []
  };

  recipeCopy.sauces = recipeCopy.sauces.map((item) => enhanceSubRecipe(item, "sauce", { kosherMode, lang }));
  recipeCopy.sides = dedupeSubRecipesByTitle(recipeCopy.sides.map((item) => enhanceSubRecipe(item, "side", { kosherMode, lang })));
  recipeCopy.drinkPairings = recipeCopy.drinkPairings.map((d) => {
    const value = d?.name || "";
    return { name: lang === "he" ? normalizeHebrewCookingText(value) : value };
  });

  if (lang === "he") {
    recipeCopy.main.title = normalizeHebrewCookingText(recipeCopy.main.title || "");
    recipeCopy.main.description = normalizeHebrewCookingText(recipeCopy.main.description || "");
  }
  sanitizeLocalizedRecipe(recipeCopy, lang);

  return recipeCopy;
}

function enhanceSubRecipe(item, type, { kosherMode, lang }) {
  const sub = {
    title: item?.title || defaultSubRecipe(type).title,
    description: item?.description || "",
    ingredients: Array.isArray(item?.ingredients) ? [...item.ingredients] : [],
    steps: Array.isArray(item?.steps) ? [...item.steps] : []
  };

  if (kosherMode && type === "sauce") {
    sub.ingredients = sub.ingredients.map((line) => line.replace(/butter|cream/ig, lang === "he" ? "שמן זית" : "olive oil"));
    sub.steps = sub.steps.map((line) => line.replace(/butter|cream/ig, lang === "he" ? "שמן זית" : "olive oil"));
  }
  if (lang === "he") {
    sub.title = normalizeHebrewCookingText(sub.title);
    sub.description = normalizeHebrewCookingText(sub.description);
    sub.ingredients = sub.ingredients.map(normalizeHebrewCookingText);
    sub.steps = sub.steps.map(normalizeHebrewCookingText);
  }
  if (!sub.description) {
    sub.description = lang === "he" ? "תוספת קצרה שמתאימה למנה העיקרית." : "A quick side that matches the main dish.";
  }
  sub.ingredients = ensureRelevantSideIngredients(sub, type);
  sub.steps = sub.steps.filter(Boolean);
  if (!sub.steps.length) sub.steps = defaultSubRecipe(type, sub.title).steps;
  return sub;
}

function ensureDefinitionsInSteps(main, lang) {
  const explanations = lang === "he"
    ? [
      "לייבש = לטפוח על הנתח עם נייר סופג עד שהחלק החיצוני יבש כדי לקבל צריבה טובה יותר.",
      "מנוחה = להניח לבשר אחרי הבישול בלי לחתוך, כדי שהמיצים יתפזרו מחדש בבשר.",
      "עיטוף = לעטוף בנייר קצבים או בנייר כסף כשהבארק יציב כדי להתגבר על הסטול.",
      "ריסוס = התזה עדינה של מים/מיץ תפוחים על פני הבשר לשמירה על לחות.",
      "טמפ פנימית = טמפרטורה במרכז הנתח לפי מדחום מזון."
    ]
    : [
      "Dry = pat the cut with paper towels until the surface is dry for better sear.",
      "Rest = let the meat sit after cooking before slicing so juices redistribute.",
      "Wrap = wrap with butcher paper or foil once bark is set to push through the stall.",
      "Spritz = lightly mist the meat surface with water or apple juice to retain moisture.",
      "Probe tender = the probe should slide in with very little resistance."
    ];
  main.techniqueGlossary = explanations;
}

function ensureMarinadeSupport(main, methodId, cutId, lang) {
  const userRequest = String(state.preferences.userQuestion || "");
  const wantsNoMarinade = /בלי השריה|ללא השריה|no marinade/i.test(userRequest);
  const explicitlyWantsMarinade = /השריה|מרינדה|marinad/i.test(userRequest);
  const marinadeCuts = ["flank", "chuck"];
  const needsMarinade = !wantsNoMarinade && (explicitlyWantsMarinade || marinadeCuts.includes(cutId));
  if (!needsMarinade) return;
  prependStep(main.steps, lang === "he"
    ? "מרינדה: מערבבים 3 כפות שמן זית, 2 שיני שום כתושות, כפית פפריקה, חצי כפית פלפל שחור וכף חומץ. מצפים את הנתח, מכסים ומקררים 2–8 שעות במקרר."
    : "Marinade: mix olive oil, crushed garlic, paprika, black pepper and vinegar. Coat the meat, cover, and refrigerate for 2–8 hours.");
}

function applyCutMethodRecipeRules(main, methodId, cutId, lang) {
  const allowed = getAllowedMethodsForCut(cutId);
  if (!allowed.includes(methodId)) {
    state.preferences.methodId = allowed[0] || "grill";
    methodId = state.preferences.methodId;
  }

  if (["ribeye", "striploin", "filet", "tenderloin", "picanha"].includes(cutId)) {
    main.prepTime = lang === "he" ? "10–15 דקות" : "10–15 min";
    main.cookTime = lang === "he" ? "8–14 דקות" : "8–14 min";
    main.totalTime = lang === "he" ? "20–30 דקות" : "20–30 min";
    main.steps = [
      lang === "he" ? "ייבוש: מייבשים היטב את הנתח עם נייר סופג ומתבלים במלח ופלפל." : "Pat the cut dry and season with salt and pepper.",
      lang === "he" ? "מחממים גריל/מחבת ברזל לחום גבוה וצורבים 3–5 דקות מכל צד לפי עובי." : "Heat grill or cast iron to high and sear 3–5 minutes per side depending on thickness.",
      lang === "he" ? "טמפ פנימית: מודדים במרכז הנתח — מדיום רייר 54–57°C, מדיום 60–63°C." : "Check internal temperature: medium rare 54–57°C, medium 60–63°C.",
      lang === "he" ? "מנוחה: מניחים 5–7 דקות לפני פריסה." : "Rest 5–7 minutes before slicing."
    ];
    return;
  }

  if (cutId === "brisket") {
    main.prepTime = lang === "he" ? "30–40 דקות" : "30–40 min";
    main.cookTime = lang === "he" ? "8–12 שעות במעשנה" : "8–12 hours in smoker";
    main.totalTime = lang === "he" ? "10–14 שעות כולל מנוחה" : "10–14 hours including rest";
    main.steps = [
      lang === "he" ? "מייבשים ומתבלים, מחממים מעשנה ל-107–120°C." : "Season and preheat smoker to 107–120°C.",
      lang === "he" ? "מעשנים 8–12 שעות. ריסוס קל כל 45–60 דקות אחרי יצירת מעטפת." : "Smoke 8–12 hours and spritz every 45–60 minutes once bark forms.",
      lang === "he" ? "עיטוף: בטמפ פנימית 74–78°C עוטפים בנייר קצבים וממשיכים." : "Wrap at 74–78°C internal temperature and continue.",
      lang === "he" ? "טמפ פנימית סופית 92–96°C, ואז מנוחה עטופה 60–90 דקות." : "Finish at 92–96°C internal, then rest wrapped 60–90 minutes."
    ];
    return;
  }

  if (["asado", "short_ribs", "chuck"].includes(cutId)) {
    main.prepTime = lang === "he" ? "20–30 דקות" : "20–30 min";
    main.cookTime = lang === "he" ? "4–8 שעות" : "4–8 hours";
    main.totalTime = lang === "he" ? "5–9 שעות כולל מנוחה" : "5–9 hours including rest";
    main.steps = [
      lang === "he" ? "צורבים קצרות מכל צד ואז מעבירים לבישול ארוך (קדירה/תנור/מעשנה)." : "Sear briefly, then move to long cook (braise/oven/smoker).",
      lang === "he" ? "מבשלים ב-140–160°C בתנור או 107–120°C במעשנה למשך 4–8 שעות." : "Cook at 140–160°C in oven or 107–120°C in smoker for 4–8 hours.",
      lang === "he" ? "טמפ פנימית יעד 90–96°C עד רכות מלאה." : "Target internal temperature 90–96°C until fully tender.",
      lang === "he" ? "מנוחה 20–30 דקות לפני הגשה." : "Rest 20–30 minutes before serving."
    ];
  }
}

function applyKosherAdjustments(main, lang) {
  main.ingredients = main.ingredients.map((line) => line.replace(/butter|cream|yogurt|parmesan/ig, lang === "he" ? "שמן זית" : "olive oil"));
  main.steps = main.steps.map((line) => line.replace(/butter|cream|yogurt|parmesan/ig, lang === "he" ? "שמן זית" : "olive oil"));
}

function enforceHebrewOnlyRecipe(main) {
  main.ingredients = main.ingredients.map(normalizeHebrewCookingText);
  main.steps = main.steps.map(normalizeHebrewCookingText);
  main.title = normalizeHebrewCookingText(main.title || "");
  main.description = normalizeHebrewCookingText(main.description || "");
}

function normalizeHebrewCookingText(text) {
  if (!text) return text;
  const replacements = [
    [/tablespoons?/ig, "כפות"],
    [/teaspoons?/ig, "כפיות"],
    [/\bgrams?\b/ig, "גרם"],
    [/\bml\b/ig, "מ״ל"],
    [/cloves?/ig, "שיני"],
    [/finely chopped/ig, "קצוץ דק"],
    [/smoker/ig, "מעשנה"],
    [/smoking/ig, "עישון"],
    [/grill/ig, "גריל"],
    [/oven/ig, "תנור"],
    [/rest/ig, "מנוחה"],
    [/spritz/ig, "ריסוס"],
    [/wrap/ig, "עיטוף"],
    [/dry/ig, "לייבש"],
    [/\bmin\b/ig, "דקות"],
    [/\bhours?\b/ig, "שעות"]
  ];
  return replacements.reduce((acc, [pattern, value]) => acc.replace(pattern, value), text)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function setFallbackTimes(main, times) {
  const hasCook = typeof main.cookTime === "string" && main.cookTime.trim();
  const hasTotal = typeof main.totalTime === "string" && main.totalTime.trim();
  const hasPrep = typeof main.prepTime === "string" && main.prepTime.trim();
  if (!hasPrep) main.prepTime = times.prep;
  if (!hasCook || /(\d{1,3}\s*(min|דקות))$/i.test(main.cookTime)) main.cookTime = times.cook;
  if (!hasTotal || /(\d{1,3}\s*(min|דקות))$/i.test(main.totalTime)) main.totalTime = times.total;
}

function appendStep(steps, text) {
  if (!Array.isArray(steps) || !text) return;
  const exists = steps.some((line) => String(line).includes(text.slice(0, 20)));
  if (!exists) steps.push(text);
}

function prependStep(steps, text) {
  if (!Array.isArray(steps) || !text) return;
  const exists = steps.some((line) => String(line).includes(text.slice(0, 20)));
  if (!exists) steps.unshift(text);
}

function dedupeSubRecipesByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.title || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ensureRelevantSideIngredients(sub, type) {
  if (type !== "side") return sub.ingredients.filter(Boolean);
  const lowTitle = String(sub.title || "").toLowerCase();
  if (/potato|תפוחי אדמה/.test(lowTitle) && !/tomato|עגבנ/.test(lowTitle)) {
    return sub.ingredients.filter((line) => !/tomato|עגבנ/i.test(String(line)));
  }
  return sub.ingredients.filter(Boolean);
}

function sanitizeLocalizedRecipe(recipe, lang) {
  const clean = (txt) => sanitizeUnexpectedScripts(String(txt || ""), lang);
  recipe.main.title = clean(recipe.main.title);
  recipe.main.description = clean(recipe.main.description);
  recipe.main.ingredients = (recipe.main.ingredients || []).map(clean);
  recipe.main.steps = (recipe.main.steps || []).map(clean);
  recipe.main.techniqueGlossary = (recipe.main.techniqueGlossary || []).map(clean);
  recipe.sauces = (recipe.sauces || []).map((item) => ({
    ...item,
    title: clean(item.title),
    description: clean(item.description),
    ingredients: (item.ingredients || []).map(clean),
    steps: (item.steps || []).map(clean)
  }));
  recipe.sides = (recipe.sides || []).map((item) => ({
    ...item,
    title: clean(item.title),
    description: clean(item.description),
    ingredients: (item.ingredients || []).map(clean),
    steps: (item.steps || []).map(clean)
  }));
}

function sanitizeUnexpectedScripts(text, lang) {
  const removedCjk = text.replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g, "");
  if (lang === "he") return removedCjk.replace(/[A-Za-z]+/g, "").replace(/\s{2,}/g, " ").trim();
  return removedCjk.replace(/[\u0590-\u05ff]+/g, "").replace(/\s{2,}/g, " ").trim();
}


function renderOpenNowStatus(shop) {
  const status = getOpenNow(shop);
  if (status === null) return "";
  return `<p class="small">${status ? (state.lang === "he" ? "פתוח עכשיו" : "Open now") : (state.lang === "he" ? "סגור עכשיו" : "Closed now")}</p>`;
}

function getOpenNow(shop) {
  if (typeof shop.openNow === "boolean") return shop.openNow;
  if (typeof shop.isOpenNow === "boolean") return shop.isOpenNow;
  if (typeof shop?.opening_hours?.open_now === "boolean") return shop.opening_hours.open_now;
  if (typeof shop?.googleOpeningHours?.open_now === "boolean") return shop.googleOpeningHours.open_now;
  return null;
}

function getButcherRankingScore(shop, distanceKm) {
  const rating = Number(shop.rating) || 0;
  const reviewCount = Math.max(0, Number(shop.userRatingsTotal ?? shop.reviewCount) || 0);
  const base = rating * Math.log10(reviewCount + 10);
  const lowReviewPenalty = reviewCount < 10 ? 0.78 : 1;
  const distancePenalty = Number.isFinite(distanceKm) ? Math.max(0.82, 1 - (distanceKm * 0.018)) : 1;
  return base * lowReviewPenalty * distancePenalty;
}

async function copyShoppingListToClipboard() {
  const list = Object.values(state.shopping).flat().join("\n");
  try {
    await navigator.clipboard.writeText(list);
    alert(state.lang === "he" ? "הרשימה הועתקה" : "List copied");
  } catch {
    alert(state.lang === "he" ? "לא הצלחנו להעתיק" : "Copy failed");
  }
}

function initOpeningAnimation() {
  applyResolvedAssets();
  loadSavedRecipes();
  startOpeningExperience();
  render();
  if (!el.openingSplash) return;
  window.setTimeout(() => {
    updateOpeningProgress(100);
    window.setTimeout(() => {
      el.openingSplash.classList.add("is-hidden");
      window.setTimeout(() => stopOpeningExperience(), 380);
    }, INTRO_FINAL_HOLD_MS);
  }, INTRO_MIN_DURATION_MS);
}

function saveCurrentRecipe() {
  if (!state.recipe) return;
  const main = state.recipe.main || {};
  const savedRecipe = {
    id: String(Date.now()),
    title: main.title || (state.lang === "he" ? "מתכון ללא שם" : "Untitled Recipe"),
    preferences: { ...state.preferences },
    main: state.recipe.main || {},
    sauces: state.recipe.sauces || [],
    sides: state.recipe.sides || [],
    drinks: state.recipe.drinkPairings || [],
    shopping: state.shopping || {},
    createdAt: new Date().toISOString(),
    thumbnail: recipeThumbnailForCut(state.preferences.cutId)
  };
  const withoutDupes = state.savedRecipes.filter((item) => item.id !== savedRecipe.id);
  state.savedRecipes = [savedRecipe, ...withoutDupes];
  persistSavedRecipes();
  showToast(state.lang === "he" ? "המתכון נשמר" : "Recipe saved");
}

function openSavedRecipe(id) {
  const saved = state.savedRecipes.find((item) => item.id === id);
  if (!saved) return;
  state.preferences = { ...state.preferences, ...(saved.preferences || {}) };
  state.recipe = {
    main: saved.main || {},
    sauces: saved.sauces || [],
    sides: saved.sides || [],
    drinkPairings: saved.drinks || []
  };
  state.shopping = saved.shopping || buildShoppingList(state.recipe);
  state.lastOpenedRecipeId = saved.id;
  currentStep = STEPS.indexOf("recipe");
  render();
}

function deleteSavedRecipe(id) {
  state.savedRecipes = state.savedRecipes.filter((item) => item.id !== id);
  persistSavedRecipes();
}

function persistSavedRecipes() {
  localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(state.savedRecipes));
}

function loadSavedRecipes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || "[]");
    state.savedRecipes = Array.isArray(parsed) ? parsed.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)) : [];
  } catch {
    state.savedRecipes = [];
  }
}

function formatSavedDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(state.lang === "he" ? "he-IL" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getLegalContent(type) {
  const legalBody = {
    about: {
      title: "About Smoke Radar",
      paragraphs: [
        "Smoke Radar is an independent meat intelligence product that helps users discover meat trends, recipes, butcher options, and cooking inspiration through a fast radar-style experience.",
        "All content, design, feature logic, product names, UI flow, and product experience are owned by Smoke Radar. Unauthorized copying, cloning, or redistribution is prohibited.",
        "© 2026 Smoke Radar. All rights reserved."
      ]
    },
    terms: {
      title: "Terms of Use",
      paragraphs: [
        "Smoke Radar owns the app concept, interface, feature logic, content structure, and branded product names.",
        "Users may not copy, clone, redistribute, reverse engineer, or commercially reuse the app experience without permission.",
        "The app is provided as an experimental and independent tool.",
        "External content and links may come from third-party sources."
      ]
    },
    privacy: {
      title: "Privacy Policy",
      paragraphs: [
        "The app may collect anonymous usage analytics.",
        "Location, if used, is only for nearby butcher and search results.",
        "No sensitive personal data should be collected intentionally.",
        "Analytics are used to improve the app experience."
      ]
    }
  };
  return legalBody[type] || legalBody.about;
}

function ensureLegalModal() {
  let modal = document.getElementById("legalModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "legalModal";
  modal.className = "legal-modal hidden";
  modal.innerHTML = `
    <div class="legal-modal-backdrop" data-close-legal="true"></div>
    <article class="legal-sheet" role="dialog" aria-modal="true" aria-labelledby="legalTitle">
      <header class="legal-sheet-header">
        <h3 id="legalTitle"></h3>
        <button class="btn btn-ghost legal-close" id="legalCloseBtn" type="button">✕</button>
      </header>
      <div id="legalBody" class="legal-sheet-body"></div>
    </article>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target?.dataset?.closeLegal === "true") closeLegalModal();
  });
  modal.querySelector("#legalCloseBtn")?.addEventListener("click", closeLegalModal);
  return modal;
}

function openLegalModal(type) {
  const modal = ensureLegalModal();
  const content = getLegalContent(type);
  const titleEl = modal.querySelector("#legalTitle");
  const bodyEl = modal.querySelector("#legalBody");
  if (!titleEl || !bodyEl) return;
  titleEl.textContent = content.title;
  bodyEl.innerHTML = content.paragraphs.map((text) => `<p class="small">${text}</p>`).join("");
  modal.classList.remove("hidden");
}

function closeLegalModal() {
  document.getElementById("legalModal")?.classList.add("hidden");
}

async function shareSmokeRadar() {
  const shareData = { title: "Smoke Radar", text: SHARE_TEXT, url: window.location.href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${window.location.href}`);
      alert(state.lang === "he" ? "הקישור הועתק" : "Link copied");
      return;
    }
    alert(SHARE_TEXT);
  } catch {
    alert(state.lang === "he" ? "לא הצלחנו לשתף כרגע" : "Could not share right now");
  }
}

function recipeThumbnailForCut(cutId) {
  if (["brisket", "short_ribs", "chuck"].includes(cutId)) return "/app/assets/recipe-bg.jpg.png";
  return "/app/assets/hero-steak.jpg.png";
}

function updateServings(delta, rerenderRecipe) {
  const next = Math.max(1, Math.min(20, Number(state.preferences.servings || 1) + delta));
  if (next === state.preferences.servings) return;
  state.preferences.servings = next;
  const prefValue = document.getElementById("servingsValue");
  if (prefValue) prefValue.textContent = String(next);
  const recipeValue = document.getElementById("recipeServingsValue");
  if (recipeValue) recipeValue.textContent = String(next);
  if (rerenderRecipe) {
    state.recipe = null;
    renderRecipe();
  }
}

function renderRecipeLoadingCard(message) {
  return `
    <div class="card branded-loader">
      <div class="opening-radar-loader loading-radar" aria-hidden="true"><span></span></div>
      <strong class="loading-message">${message}</strong>
      <p class="small loading-dots"><span>.</span><span>.</span><span>.</span></p>
      <div class="loading-progress-pulse" aria-hidden="true"><span></span></div>
    </div>
  `;
}

function startRecipeLoadingState() {
  const messages = t("recipeLoadingMessages") || [];
  let i = 0;
  const print = () => {
    const msg = messages[i % messages.length] || (state.lang === "he" ? "בונה מתכון..." : "Building recipe...");
    const messageEl = el.content.querySelector(".loading-message");
    if (messageEl) {
      messageEl.classList.add("is-swapping");
      window.setTimeout(() => {
        messageEl.textContent = msg;
        messageEl.classList.remove("is-swapping");
      }, 120);
    } else {
      el.content.innerHTML = renderRecipeLoadingCard(msg);
    }
    i += 1;
  };
  el.content.innerHTML = renderRecipeLoadingCard(messages[0] || (state.lang === "he" ? "בונה מתכון..." : "Building recipe..."));
  i = 1;
  if (recipeLoadingInterval) window.clearInterval(recipeLoadingInterval);
  recipeLoadingInterval = window.setInterval(print, 900);
}

function stopRecipeLoadingState() {
  if (recipeLoadingInterval) window.clearInterval(recipeLoadingInterval);
  recipeLoadingInterval = null;
}

function renderButcherLoading() {
  return `
    <div class="card branded-loader">
      <div class="opening-radar-loader loading-radar loading-radar-small" aria-hidden="true"><span></span></div>
      <strong>${t("butcherLoadingMessage")}</strong>
      <p class="small loading-dots"><span>.</span><span>.</span><span>.</span></p>
    </div>
  `;
}

function formatDistance(distanceKm) {
  const formatted = distanceKm.toFixed(1);
  return state.lang === "he" ? `${formatted} ק״מ` : `${formatted} km`;
}

function showToast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.toast.classList.remove("is-visible");
  }, 1800);
}

initOpeningAnimation();
