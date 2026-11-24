const STEPS = ["landing", "saved", "hot", "preferences", "expert", "cook", "recipe", "shopping", "butcher", "butcherGuide"];
let currentStep = 0;
const SAVED_RECIPES_KEY = "smoke_radar_saved_recipes_v1";
const SHARE_TEXT = "Check out Smoke Radar — meat trends, recipes, and butcher discovery in one radar-style app.";
const INTRO_MIN_DURATION_MS = 3400;
const INTRO_FINAL_HOLD_MS = 850;

const assetCandidates = {
  appBg: ["/app/assets/app-bg-smoke.jpg.png"],
  hero: ["/app/assets/hero-steak.jpg.png"],
  hot: ["/app/assets/hot-trends.jpg.png"],
  recipe: ["/app/assets/recipe-bg.jpg.png"],
  butcher: ["/app/assets/butcher-map-bg.jpg.png"]
};

const cutsCatalog = [
  { id: "ribeye", labels: { he: "אנטריקוט", en: "Ribeye" }, aliases: ["ribeye", "אנטריקוט"] },
  { id: "rump", labels: { he: "שייטל", en: "Shaitel / Rump" }, aliases: ["rump", "שייטל", "כנף העוקץ"] },
  { id: "chuck_roll", labels: { he: "אונטריב", en: "Untrib / Chuck roll" }, aliases: ["chuck roll", "אונטריב", "אונטרייב"] },
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
  { id: "bbq", labels: { he: "מנגל / ברביקיו", en: "BBQ" } },
  { id: "bbq_finish", labels: { he: "ריכוך בתנור וסיום במנגל", en: "Oven braise and barbecue finish" } },
  { id: "smoker", labels: { he: "מעשנה", en: "Smoker" } },
  { id: "smoking", labels: { he: "עישון", en: "Smoking" } },
  { id: "long_cook", labels: { he: "בישול ארוך", en: "Long Cook" } },
  { id: "oven_roast", labels: { he: "צלייה בתנור", en: "Oven Roast" } },
  { id: "low_slow", labels: { he: "נמוך ואיטי", en: "Low & Slow" } },
  { id: "pan_sear", labels: { he: "צריבה במחבת", en: "Pan Sear" } },
  { id: "reverse_sear", labels: { he: "ריברס סיר", en: "Reverse Sear" } },
  { id: "sous_vide", labels: { he: "סו־ויד", en: "Sous vide" } }
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
  rump: { he: "שייטל (מס׳ 13 בבקר): מתאים לסטייקים, שיפודים, רצועות ורוסטביף.", en: "Shaitel / rump: Israeli beef cut 13, for steaks, skewers, strips and roast beef." },
  chuck_roll: { he: "אונטריב / צלעות (מס׳ 2 בבקר): מתאים לקדירה ולבישול ארוך; בטחינה גם להמבורגר. החלק המדויק חשוב.", en: "Untrib / chuck roll: commonly Israeli beef cut 2, for slow cooking or grinding. Confirm the exact section." },
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
  rump: ["grill", "bbq", "cast_iron", "pan_sear", "oven_roast", "reverse_sear"],
  chuck_roll: ["long_cook", "smoker", "smoking", "low_slow", "oven", "oven_roast"],
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
    knowAction: "😋 יש לי נתח, צור לי מתכון מתאים",
    next: "המשך",
    finish: "סיום",
    back: "חזרה",
    loadingMessages: [
      "מנתחים את הנתונים...",
      "מחפשים השראה חמה 🔥",
      "מרכיבים את המתכון שלך...",
      "בודקים מה הכי טרנדי עכשיו...",
      "כמעט שם..."
    ],
    recipeLoadingMessages: [
      "מחממים את הרדאר 🔥",
      "מוצאים את השילוב המושלם...",
      "בודקים כמויות ופרטי הכנה..."
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
      hot: "מה חם היום",
      preferences: "מה לבשל",
      cook: "Smart Cooking Mode™",
      expert: "שאל את המומחים",
      recipe: "מתכון מלא",
      shopping: "רשימת קניות",
      butcher: "Butcher Radar™",
      butcherGuide: "מה לבקש מהקצב?"
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
    loadingMessages: [
      "Analyzing trends...",
      "Finding something hot 🔥",
      "Creating your recipe...",
      "Scanning what's trending...",
      "Almost ready..."
    ],
    recipeLoadingMessages: [
      "Warming up the radar 🔥",
      "Finding the perfect pairing...",
      "Checking quantities and preparation details..."
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
      hot: "What’s hot today",
      preferences: "What to cook",
      cook: "Smart Cooking Mode™",
      expert: "Ask the Experts",
      recipe: "Cooking Guide",
      shopping: "Shopping List",
      butcher: "Butcher Radar™",
      butcherGuide: "What should I ask the butcher?"
    }
  }
};

const state = {
  lang: document.documentElement.lang === "en" ? "en" : "he",
  homeChoice: null,
  hotList: [],
  selectedHot: null,
  hotLoading: false,
  hotError: false,
  hotSource: null,
  hotUpdated: null,
  preferences: {
    meatType: "beef",
    cutId: "ribeye",
    methodId: "grill",
    equipmentMode: "standard",
    thicknessCm: 2.5,
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
  account: { enabled: false, initializing: true, ready: false, user: null, providers: [], loading: false, busy: false, error: null, guestCount: 0 },
  lastOpenedRecipeId: null,
  recipeLoading: false,
  butcherLoading: false,
  butcherLoaded: false,
  butcherError: null,
  butcherFromHome: false,
  butcherReturnTo: null,
  butcherGuide: { goal: "burgers", servings: 4, returnTo: "landing" },
  butcherFilters: { openNow: false, saturday: false },
  butcherCheckedAt: null,
  navigation: {
    generatorMode: true,
    askExpertMode: false,
    recipeReturnTo: "preferences"
  }
};

const el = {
  appRoot: document.getElementById("app"),
  openingSplash: document.getElementById("openingSplash"),
  header: document.getElementById("appHeader"),
  title: document.getElementById("screenTitle"),
  subtitle: document.getElementById("screenSubtitle"),
  content: document.getElementById("screenContent"),
  nextBtn: document.getElementById("nextBtn"),
  backBtn: document.getElementById("backBtn"),
  homeBtn: document.getElementById("homeBtn"),
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
let recipeStore = null;
let recipeAccountClient = null;

el.backBtn.addEventListener("click", () => {
  if (STEPS[currentStep] === "hot") {
    if (state.selectedHot !== null) state.selectedHot = null;
    else currentStep = STEPS.indexOf("landing");
    render();
    return;
  }
  const step = STEPS[currentStep];
  // Back follows the entry route, never the screen's position in STEPS.
  const target = {
    landing: "landing", saved: "landing", preferences: "landing", cook: "preferences",
    expert: expertState.returnToStep || "preferences",
    recipe: state.navigation.recipeReturnTo || "preferences",
    shopping: "recipe", butcher: state.butcherReturnTo || (state.butcherFromHome ? "landing" : "shopping"),
    butcherGuide: state.butcherGuide.returnTo
  }[step] || "landing";
  if (step === "expert") {
    state.navigation.askExpertMode = false;
    state.navigation.generatorMode = true;
  }
  currentStep = STEPS.indexOf(target);
  render();
});
el.nextBtn.addEventListener("click", handleNext);
el.homeBtn.addEventListener("click", goHome);

function goHome() {
  currentStep = STEPS.indexOf("landing");
  state.navigation.askExpertMode = false;
  state.navigation.generatorMode = true;
  state.selectedHot = null;
  state.butcherFromHome = false;
  state.butcherReturnTo = null;
  // Navigating home does not delete a recipe or reset the user's preferences.
  stopRecipeLoadingState();
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

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

  document.documentElement.lang = state.lang;
  document.documentElement.dir = t("dir");
  el.appRoot.dataset.step = step;
  el.title.textContent = step === "landing" ? "" : t(`titles.${step}`);
  el.subtitle.textContent = "";
  el.header.classList.toggle("landing-minimal", step === "landing" || step === "saved" || step === "hot");
  el.homeBtn.textContent = state.lang === "he" ? "בית" : "Home";
  el.homeBtn.setAttribute("aria-label", state.lang === "he" ? "חזרה למסך הבית" : "Back to home");
  el.homeBtn.hidden = step === "landing";
  el.backBtn.textContent = t("back");
  el.nextBtn.textContent = step === "butcher"
    ? t("finish")
    : step === "preferences"
      ? (state.lang === "he" ? "צור מתכון" : "Generate Recipe")
      : t("next");
  el.backBtn.classList.toggle("hidden", currentStep === 0);
  el.nextBtn.classList.toggle("hidden", step === "landing" || step === "saved" || step === "hot" || step === "butcherGuide");

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
  if (step === "butcherGuide") return renderButcherGuide();
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
    <button class="btn btn-choice" id="openButchersBtn">${state.lang === "he" ? "📍 מצא קצבייה לידי" : "📍 Find a butcher near me"}</button>
    ${butcherGuideEntry(true)}
    ${latest ? `
      <div class="card last-recipe-prompt">
        <p>${state.lang === "he" ? "להמשיך מהמתכון האחרון?" : "Continue your last recipe?"}</p>
        <button class="btn btn-ghost" id="openLastRecipeBtn">${state.lang === "he" ? "פתח מתכון אחרון" : "Open Last Recipe"}</button>
      </div>
    ` : ""}
    <button class="btn btn-choice btn-choice-saved" id="openSavedRecipesBtn">${state.lang === "he" ? "המתכונים שלי" : "My Recipes"}</button>
    <a class="app-install-link" href="/app/install.html">${state.lang === "he" ? "התקנת האפליקציה בטלפון" : "Install the app"}</a>
    ${renderRecipeAccount()}
    <details class="app-info">
      <summary>${state.lang === "he" ? "מידע על האפליקציה" : "App information"}</summary>
      <div class="legal-menu">
        <button class="btn btn-ghost" id="aboutBtn">${state.lang === "he" ? "אודות Smoke Radar" : "About Smoke Radar"}</button>
        <button class="btn btn-ghost" id="termsBtn">${state.lang === "he" ? "תנאי שימוש" : "Terms of Use"}</button>
        <button class="btn btn-ghost" id="privacyBtn">${state.lang === "he" ? "מדיניות פרטיות" : "Privacy Policy"}</button>
        <a class="btn btn-ghost" href="/app/privacy.html">${state.lang === "he" ? "פרטיות ומחיקת נתונים" : "Privacy and data deletion"}</a>
        <button class="btn btn-ghost" id="shareBtn">${state.lang === "he" ? "שיתוף Smoke Radar" : "Share Smoke Radar"}</button>
        <p class="small footer-note">© 2026 Smoke Radar. All rights reserved.</p>
      </div>
    </details>
    <div class="chips">${cutsCatalog.slice(0, 6).map((cut) => `<span class="chip">${cut.labels[state.lang]}</span>`).join("")}</div>
  `;

  el.content.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.homeChoice = btn.dataset.choice;
      if (state.homeChoice === "hot") {
        state.selectedHot = null;
        currentStep = STEPS.indexOf("hot");
        render();
        await loadHotNow();
        return;
      } else {
        currentStep = STEPS.indexOf("preferences");
      }
      render();
    });
  });

  document.getElementById("openButchersBtn")?.addEventListener("click", () => {
    state.butcherFromHome = true;
    state.butcherReturnTo = null;
    currentStep = STEPS.indexOf("butcher");
    render();
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
  bindRecipeAccount();
  bindButcherGuideEntry();
}

function renderSavedRecipes() {
  const cards = (state.account.loading || state.account.initializing ? [] : state.savedRecipes).map((item) => {
    const cut = getCutById(item.preferences?.cutId || "ribeye").labels[state.lang];
    const method = item.preferences?.equipmentMode === "basic" ? RecipeProtocols.basicMethodLabel(item.preferences.methodId, item.preferences.cutId, state.lang) : getMethodById(item.preferences?.methodId || "grill").labels[state.lang];
    const date = formatSavedDate(item.createdAt);
    const thumbnail = recipeThumbnailForCut(item.preferences?.cutId || "ribeye");
    return `
      <article class="card saved-recipe-card">
        <img class="saved-thumb" src="${thumbnail}" alt="${escapeHotText(item.title || "recipe")}" />
        <div class="saved-recipe-content">
        <h3>${escapeHotText(item.title || (state.lang === "he" ? "מתכון שמור" : "Saved Recipe"))}</h3>
        <p class="small">${state.lang === "he" ? "נתח" : "Cut"}: ${cut}</p>
        <p class="small">${state.lang === "he" ? "שיטת בישול" : "Cooking method"}: ${method}</p>
        <p class="small">${state.lang === "he" ? "נשמר בתאריך" : "Saved on"}: ${date}</p>
        <div class="saved-recipe-actions">
          <button class="btn btn-primary" data-open-recipe="${escapeHotText(item.id)}">${state.lang === "he" ? "פתח מתכון" : "Open Recipe"}</button>
          <button class="btn btn-ghost" data-delete-recipe="${escapeHotText(item.id)}" ${state.account.busy ? "disabled" : ""}>${state.lang === "he" ? "מחק" : "Delete"}</button>
        </div>
        </div>
      </article>
    `;
  }).join("");

  const pending = state.account.loading || state.account.initializing;
  el.content.innerHTML = `${renderRecipeAccount(true)}${pending ? `<div class="card" role="status">${state.lang === "he" ? "טוען את המתכונים שלך..." : "Loading your recipes..."}</div>` : cards || (state.account.error ? "" : `<div class="card"><p class="small">${state.lang === "he" ? "עדיין אין מתכונים שמורים." : "No saved recipes yet."}</p></div>`)}`;
  bindRecipeAccount();

  el.content.querySelectorAll("[data-open-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => openSavedRecipe(btn.dataset.openRecipe));
  });
  el.content.querySelectorAll("[data-delete-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => deleteSavedRecipe(btn.dataset.deleteRecipe));
  });
}

async function loadHotNow() {
  if (state.hotLoading) return;
  state.hotLoading = true;
  state.hotError = false;
  renderHotNow();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("/api/smoke-radar", { signal: controller.signal });
    if (!res.ok) throw new Error("radar_unavailable");
    const data = await res.json();
    if (!Array.isArray(data.videos)) throw new Error("invalid_radar");
    // Seed snapshots are examples, not evidence of current popularity.
    state.hotList = data.source === "seed" ? [] : HotTopics.build(data.videos);
    state.hotSource = data.source;
    state.hotUpdated = data.lastUpdated;
  } catch {
    state.hotError = true;
  } finally {
    clearTimeout(timeout);
    state.hotLoading = false;
    if (STEPS[currentStep] === "hot") renderHotNow();
  }
}

function escapeHotText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function renderHotNow() {
  const he = state.lang === "he";
  if (state.hotLoading) {
    el.content.innerHTML = `<div class="card" role="status">${he ? "טוען נושאים מהרדאר..." : "Loading radar topics..."}</div>`;
    return;
  }
  if (state.hotError) {
    el.content.innerHTML = `<div class="card" role="alert">${he ? "לא הצלחנו לטעון את הרדאר כרגע." : "Could not load the radar right now."}</div><button class="btn btn-primary" id="retryHot">${he ? "נסה שוב" : "Try again"}</button>`;
    document.getElementById("retryHot").addEventListener("click", loadHotNow);
    return;
  }
  const topic = state.hotList.find(item => item.id === state.selectedHot);
  if (topic) {
    el.content.innerHTML = `
      <div class="card"><h2>${escapeHotText(topic.labels[state.lang])}</h2><p class="small">${he ? "סרטונים מהרדאר שמזכירים את הנושא. לחיצה תפתח את הסרטון ביוטיוב." : "Radar videos mentioning this topic. Open a video to watch on YouTube."}</p></div>
      ${topic.videos.map(video => {
        const views = Number(video.viewCount);
        return `<article class="card hot-video">
          <a href="${escapeHotText(video.url)}" target="_blank" rel="noopener noreferrer">
            <img class="hot-video-image" src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" alt="" loading="lazy" />
            <h3 dir="auto">${escapeHotText(video.title)}</h3>
          </a>
          <p class="small" dir="auto">${escapeHotText(video.channelTitle || "")}</p>
          ${Number.isFinite(views) && views >= 0 ? `<p class="small">${new Intl.NumberFormat(he ? "he-IL" : "en-US").format(views)} ${he ? "צפיות" : "views"}</p>` : ""}
          <a class="btn btn-ghost" href="${escapeHotText(video.url)}" target="_blank" rel="noopener noreferrer">${he ? "צפה ביוטיוב ↗" : "Watch on YouTube ↗"}</a>
        </article>`;
      }).join("")}`;
    return;
  }
  const updated = new Date(state.hotUpdated);
  const dateLabel = state.hotUpdated && !Number.isNaN(updated.getTime())
    ? updated.toLocaleString(he ? "he-IL" : "en-US") : "";
  const groups = [
    { id: "cut", title: he ? "🥩 נתחים" : "🥩 Cuts" },
    { id: "style", title: he ? "🔥 סגנונות הכנה" : "🔥 Cooking styles" },
    { id: "spice", title: he ? "🧂 תבלינים ותיבול" : "🧂 Spices and seasoning" }
  ];
  el.content.innerHTML = `
    <div class="card"><p>${he ? "מה חוזר בסרטונים שהרדאר אסף? בחר נושא כדי לראות את הסרטונים שלו." : "What appears in the videos collected by the radar? Choose a topic to see its videos."}</p>
    <p class="small">${he ? "הדירוג לפי מספר הסרטונים שמזכירים את הנושא בכותרת, במדגם הנוכחי — לא מדד לעלייה יומית." : "Ranked by title mentions in the current sample, not a measure of daily growth."}</p>
    ${dateLabel ? `<p class="small">${he ? "עדכון הנתונים:" : "Data updated:"} ${escapeHotText(dateLabel)}</p>` : ""}
    ${state.hotSource && state.hotSource !== "live" ? `<p class="small">${he ? "מוצגים נתונים שמורים; ייתכן שאינם מהיום." : "Saved data; it may not be from today."}</p>` : ""}</div>
    ${groups.map(group => {
      const topics = state.hotList.filter(item => item.category === group.id);
      return `<section class="hot-topic-group"><h2>${group.title}</h2>
        ${topics.length ? topics.map(item => `<button class="btn btn-choice" data-topic="${item.id}"><strong>${escapeHotText(item.labels[state.lang])}</strong><span class="small">${item.count} ${he ? "סרטונים ברדאר · לצפייה ←" : "radar videos · Watch →"}</span></button>`).join("") : `<div class="card small">${he ? "אין כרגע מספיק מידע מזוהה בקטגוריה הזו." : "No identified topics in this category yet."}</div>`}
      </section>`;
    }).join("")}`;
  el.content.querySelectorAll("[data-topic]").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedHot = button.dataset.topic;
      renderHotNow();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div class="field"><label for="equipmentMode">${state.lang === "he" ? "עם איזה ציוד מבשלים?" : "Your cooking equipment"}</label>
        <select id="equipmentMode">
          <option value="standard">${state.lang === "he" ? "רגיל — עם מדחום / ציוד לשיטה שנבחרה" : "Standard — thermometer / equipment for the chosen method"}</option>
          <option value="basic">${state.lang === "he" ? "ציוד בסיסי — בלי מדחום" : "Basic cookware — no thermometer"}</option>
        </select>
      </div>
      <div class="field"><label for="methodId">${state.lang === "he" ? "שיטת בישול" : "Cooking method"}</label>
        <select id="methodId"></select>
        <p class="small method-helper-text" id="methodHelperText"></p>
      </div>
      <div class="field" id="thicknessField" hidden><label for="thicknessCm">${state.lang === "he" ? "עובי מרבי לכל יחידת בשר" : "Maximum thickness of each piece"}</label>
        <select id="thicknessCm">${RecipeProtocols.THICKNESSES.map(value => `<option value="${value}">${value} ${state.lang === "he" ? "ס״מ" : "cm"}</option>`).join("")}</select>
        <p class="small">${state.lang === "he" ? "לסו־ויד: בשר מופשר, ללא עצם, בשכבה אחת. אם העובי בין שתי אפשרויות, בוחרים בגבוהה; מעל 5 ס״מ חותכים ליחידות דקות יותר." : "Sous vide: thawed, boneless meat in one layer. Round thickness up to the next option; cut pieces thicker than 5 cm into thinner portions."}</p>
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
        <label for="userQuestion">${state.lang === "he" ? "בקשה חופשית" : "Custom request"}</label>
        <input id="userQuestion" type="text" maxlength="220" placeholder="${state.lang === "he" ? "שאלה או בקשה מיוחדת? למשל: איזה בשר מתאים לבישול ארוך בקדירה?" : "Any question or special request? Example: what cut works best for long braising?"}" />
      </div>
      <button type="button" class="btn btn-ghost" id="toExpertBtn">${state.lang === "he" ? "שאל את המומחים" : "Ask the Experts"}</button>

    </div>
  `;

  ["meatType", "cutId", "methodId", "equipmentMode", "thicknessCm", "flavorId", "dietaryPreference"].forEach((id) => {
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
  document.getElementById("equipmentMode")?.addEventListener("change", () => { setupMethodOptions(); updateCutHelperText(); updateMethodHelperText(); });
  document.getElementById("toExpertBtn")?.addEventListener("click", () => {
    state.navigation.askExpertMode = true;
    state.navigation.generatorMode = false;
    expertState.returnToStep = "preferences";
    currentStep = STEPS.indexOf("expert");
    render();
  });
  document.getElementById("servingsMinus")?.addEventListener("click", () => updateServings(-1, false));
  document.getElementById("servingsPlus")?.addEventListener("click", () => updateServings(1, false));
}


function getAllowedMethodsForCut(cutId) {
  if (state.preferences.equipmentMode === "basic") return RecipeProtocols.basicMethods(cutId);
  return [...(cutMethodRules[cutId] || methods.map((m) => m.id)), "sous_vide"];
}

function setupMethodOptions() {
  const methodSelect = document.getElementById("methodId");
  const cutId = document.getElementById("cutId")?.value || state.preferences.cutId;
  if (!methodSelect) return;
  const allowed = new Set(getAllowedMethodsForCut(cutId));
  const options = [...allowed].map(getMethodById);
  methodSelect.innerHTML = options.map((m) => `<option value="${m.id}">${state.preferences.equipmentMode === "basic" ? RecipeProtocols.basicMethodLabel(m.id, cutId, state.lang) : m.labels[state.lang]}</option>`).join("");
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
  const sv = state.preferences.methodId === "sous_vide", basic = state.preferences.equipmentMode === "basic";
  document.getElementById("thicknessField").hidden = !sv;
  const question = document.getElementById("userQuestion");
  question.disabled = sv || basic;
  question.title = sv || basic ? (state.lang === "he" ? "במסלול הזה בוחרים נתח ותיבול; בקשה חופשית זמינה במסלול הרגיל." : "Choose a cut and seasoning in this path; custom requests are available in the standard path.") : "";
  let note = document.getElementById("customRequestNote");
  if (!note) { note = document.createElement("p"); note.id = "customRequestNote"; note.className = "small"; question.after(note); }
  note.textContent = question.title;
  note.hidden = !question.disabled;
  if (sv) { helperEl.textContent = state.lang === "he" ? "נדרשים מכשיר סו־ויד ושקיות מתאימות. הזמן נקבע לפי הנתח והעובי; טמפרטורת האמבט תופיע במתכון." : "Requires a sous-vide circulator and suitable bags. Time follows the cut and thickness; the recipe specifies the bath temperature."; return; }
  if (basic) { helperEl.textContent = RecipeProtocols.basicMethodHelp(state.preferences.methodId, cutId, state.lang); return; }
  helperEl.textContent = state.lang === "he"
    ? `מתאים ל: ${allowed.join(" / ")}`
    : `Best methods: ${allowed.join(" / ")}`;
}

function collectPreferences() {
  state.preferences.meatType = document.getElementById("meatType").value;
  state.preferences.cutId = document.getElementById("cutId").value;
  state.preferences.methodId = document.getElementById("methodId").value;
  state.preferences.equipmentMode = document.getElementById("equipmentMode").value;
  state.preferences.thicknessCm = Number(document.getElementById("thicknessCm").value);
  state.preferences.flavorId = document.getElementById("flavorId").value;
  state.preferences.dietaryPreference = document.getElementById("dietaryPreference").value === "kosher" ? "kosher" : "non_kosher";
  state.preferences.userQuestion = String(document.getElementById("userQuestion")?.value || "").trim();
  state.preferences.servings = Number(state.preferences.servings || 1);
}

function updateCutHelperText() {
  const helperEl = document.getElementById("cutHelperText");
  if (!helperEl) return;
  const cutId = document.getElementById("cutId")?.value || state.preferences.cutId;
  if (state.preferences.equipmentMode === "basic") { helperEl.textContent = ""; return; }
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
    if (STEPS[currentStep] === "expert") renderAskExpert();
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
  const p = { ...state.preferences };
  const requestLanguage = state.lang;
  const cut = getCutById(p.cutId).labels[state.lang];
  const method = p.equipmentMode === "basic" ? RecipeProtocols.basicMethodLabel(p.methodId, p.cutId, state.lang) : getMethodById(p.methodId).labels[state.lang];
  const flavor = getFlavorById(p.flavorId).labels[state.lang];
  const query = new URLSearchParams({
    lang: state.lang,
    meatType: p.meatType,
    cutId: p.cutId,
    methodId: p.methodId,
    equipmentMode: p.equipmentMode || "standard",
    thicknessCm: String(p.thicknessCm || 2.5),
    flavorId: p.flavorId,
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

  let recipe;
  const context = { ...p, language: requestLanguage, cut, method, flavor };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 125000);
  try {
    const res = await fetch(`/api/ai-recipe?${query.toString()}`, { signal: controller.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "recipe_service_unavailable");
    recipe = data.structuredRecipe;
    const report = RecipeQuality.review(recipe, RecipeGuidance.effectiveContext(recipe, context));
    if (!report.usable) recipe = RecipeFallback.create(context, "incomplete");
  } catch {
    recipe = RecipeFallback.create(context, "network");
  } finally { clearTimeout(timeout); }
  if (requestLanguage !== state.lang || JSON.stringify(p) !== JSON.stringify(state.preferences) || state.recipe) return false;
  state.recipe = enhanceRecipeQuality(recipe);
  state.shopping = buildShoppingList(state.recipe);
}

function recipeHeroForCut() {
  return "var(--asset-recipe)";
}

function renderRecipeQuality(recipe) {
  return RecipeGuidance.reviewHTML(recipe, state.preferences, state.lang);
}

function renderStepTip(step, phase, section = "main", part) {
  // Historical drafts retain their text, but receive no retroactive source claims.
  if (state.recipe?.recipeVersion !== RecipeQuality.VERSION) return "";
  return RecipeGuidance.stepHTML(step, { recipe: state.recipe, phase, section, part,
    context: RecipeGuidance.effectiveContext(state.recipe, state.preferences) }, state.lang);
}

function renderRecipe() {
  if (!state.recipe) {
    startRecipeLoadingState();
    if (!state.recipeLoading) {
      state.recipeLoading = true;
      loadRecipe().then(() => {
        stopRecipeLoadingState();
        state.recipeLoading = false;
        if (STEPS[currentStep] === "recipe") renderRecipe();
      }).catch((error) => {
        stopRecipeLoadingState();
        state.recipeLoading = false;
        if (STEPS[currentStep] !== "recipe") return;
        const incomplete = error.message === "recipe_incomplete";
        el.content.innerHTML = `<div class="card" role="status"><p>${state.lang === "he"
          ? (incomplete ? "המתכון שנוצר לא עבר את בדיקת השלמות. אפשר לנסות שוב או לשנות את הבקשה." : "לא הצלחנו ליצור מתכון כרגע. אפשר לנסות שוב.")
          : (incomplete ? "This recipe did not pass the completeness checks. Try again or adjust your request." : "Could not create a recipe right now. Please retry.")}</p><button class="btn btn-primary" id="retryRecipeBtn">${state.lang === "he" ? "נסה שוב" : "Try again"}</button></div>`;
        document.getElementById("retryRecipeBtn")?.addEventListener("click", renderRecipe);
      });
    }
    return;
  }

  const r = state.recipe;
  const main = r.main || {};
  const selectedMethod = getMethodById(state.preferences.methodId).labels[state.lang];
  const timingUncertain = RecipeQuality.review(r, RecipeGuidance.effectiveContext(r, state.preferences)).warnings.includes("timing");
  const prep = timingUncertain ? "—" : main.prepTime || main.metadata?.prep_time || "—";
  const cook = timingUncertain ? "—" : main.cookTime || main.metadata?.cook_time || "—";
  const total = timingUncertain ? "—" : main.totalTime || main.metadata?.total_time || "—";
  const difficulty = main.difficulty || main.metadata?.difficulty || "—";
  const kosherLabel = state.preferences.dietaryPreference === "kosher" ? (state.lang === "he" ? "כשר" : "Kosher") : (state.lang === "he" ? "לא כשר" : "Non-kosher");
  const badges = [
    { label: state.lang === "he" ? "סה״כ זמן" : "Total Time", value: total },
    { label: state.lang === "he" ? "קושי" : "Difficulty", value: difficulty },
    { label: state.lang === "he" ? "מנות" : "Servings", value: state.preferences.servings },
    { label: state.lang === "he" ? "כשרות" : "Diet", value: kosherLabel }
  ];
  const sauces = normalizeSubRecipes(r.sauces, "sauce");
  const sides = normalizeSubRecipes(r.sides, "side");
  const glossaryTitle = state.lang === "he" ? "מקרא פעולות" : "Technique Glossary";
  const glossary = Array.isArray(main.techniqueGlossary) ? main.techniqueGlossary.filter(Boolean) : [];

  el.content.innerHTML = `
    <div class="card recipe-hero" style="--recipe-image:${recipeHeroForCut()}">
      <h2>${escapeHotText(main.title || (state.lang === "he" ? "מתכון פרימיום" : "Premium Recipe"))}</h2>
      <p class="small">${escapeHotText(main.description || "")}</p>
    </div>

    <div class="badges-row">
      ${badges.map((badge) => `<span class="badge"><strong>${badge.label}</strong> ${escapeHotText(badge.value)}</span>`).join("")}
    </div>

    <div class="recipe-cooking-facts">
      <p>${state.lang === "he" ? "זמנים משוערים" : "Estimated times"} · ${state.lang === "he" ? "הכנה" : "Prep"}: ${escapeHotText(prep)} · ${state.lang === "he" ? "בישול" : "Cook"}: ${escapeHotText(cook)}${Number.isFinite(main.metadata?.rest_minutes) ? ` · ${state.lang === "he" ? "מנוחה" : "Rest"}: ${main.metadata.rest_minutes} ${state.lang === "he" ? "דק׳" : "min"}` : ""}</p>
      <p>${Number.isFinite(main.metadata?.meat_weight_g) ? `${main.metadata.meat_weight_g} ${state.lang === "he" ? "גרם בשר" : "g meat"} · ` : ""}${Number.isFinite(main.metadata?.piece_thickness_cm) ? `${main.metadata.piece_thickness_cm} ${state.lang === "he" ? "ס״מ עובי" : "cm thick"} · ` : ""}${escapeHotText((main.equipment || []).join(" · ") || selectedMethod)}</p>
      ${Number.isFinite(main.metadata?.target_internal_c) ? `<p><strong>${state.lang === "he" ? "טמפרטורת ליבה" : "Internal target"}: ${main.metadata.target_internal_c}°C</strong> · ${escapeHotText(main.metadata.doneness_cue || "")}</p>` : `<p>${Number.isFinite(main.metadata?.bath_temperature_c) ? `<strong>${state.lang === "he" ? "טמפרטורת האמבט" : "Bath temperature"}: ${main.metadata.bath_temperature_c}°C</strong> · ` : ""}${escapeHotText(main.metadata?.doneness_cue || "")}</p>`}
    </div>
    ${renderRecipeQuality(r)}

    <div class="card"><h3>${state.lang === "he" ? "מרכיבים" : "Ingredients"}</h3><ul class="list">${(main.ingredients || []).map((i) => `<li>${escapeHotText(i)}</li>`).join("")}</ul></div>
    <div class="card"><h3>${state.lang === "he" ? "שלבי הכנה" : "Step-by-step"}</h3><ol class="list">${(main.steps || []).map((s, i) => `<li>${escapeHotText(s)}${!timingUncertain && main.step_timing?.[i]?.minutes ? `<p class="small">${i === main.metadata?.bath_step_index ? (state.lang === "he" ? "משך מלא באמבט — אין לקצר:" : "Full bath time — do not shorten:") : (state.lang === "he" ? "זמן משוער לשלב:" : "Estimated step time:")} ${i === main.metadata?.bath_step_index && main.step_timing[i].minutes % 60 === 0 ? `${main.step_timing[i].minutes / 60} ${state.lang === "he" ? "שעות" : "hours"}` : `${Number(main.step_timing[i].minutes)} ${state.lang === "he" ? "דקות" : "min"}`}</p>` : ""}${renderStepTip(s, main.step_timing?.[i]?.phase)}</li>`).join("")}</ol></div>
    ${glossary.length ? `<div class="card"><h3>${glossaryTitle}</h3><ul class="list">${glossary.map((item) => `<li>${escapeHotText(item)}</li>`).join("")}</ul></div>` : ""}
    <div class="card">
      <h3>${state.lang === "he" ? "רטבים" : "Sauces"}</h3>
      ${renderSubRecipeDetails(sauces)}
    </div>
    <div class="card">
      <h3>${state.lang === "he" ? "תוספות" : "Side Dishes"}</h3>
      ${renderSubRecipeDetails(sides)}
    </div>
    <div class="card"><h3>${state.lang === "he" ? "שתייה מתאימה" : "Drink Pairings"}</h3><ul class="list">${(r.drinkPairings || []).map((d) => `<li>${escapeHotText(d.name)}</li>`).join("")}</ul></div>


    <div class="inline-actions">
      <button class="btn btn-ghost" id="saveRecipeBtn">${state.lang === "he" ? "שמור מתכון" : "Save Recipe"}</button>
      <button class="btn btn-ghost" id="copyShoppingBtn">${state.lang === "he" ? "📋 העתק רשימת קניות" : "📋 Copy Shopping List"}</button>
      <button class="btn btn-ghost" id="variationBtn" ${r.generation?.kind === "guided" ? "hidden" : ""}>${state.lang === "he" ? "🔄 נסה וריאציה" : "🔄 Try Variation"}</button>
      <button class="btn btn-ghost" id="regenBtn">${r.generation?.kind === "guided" ? (state.lang === "he" ? "שנה נתח או תיבול" : "Change cut or seasoning") : (state.lang === "he" ? "צור מתכון מחדש" : "Regenerate Recipe")}</button>
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
    if (state.recipe?.generation?.kind === "guided") { currentStep = STEPS.indexOf("preferences"); render(); return; }
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
    meat: mainIng.filter((i) => /beef|lamb|veal|בקר|טלה|עגל|meat|rib|steak|brisket|rump|chuck|פיקניה|בשר|נתח|אנטריקוט|שייטל|אונטריב|אונטרייב|פילה/i.test(i)),
    seasoning: mainIng.filter((i) => !/beef|lamb|veal|בקר|טלה|עגל|meat|rib|steak|brisket|rump|chuck|פיקניה|בשר|נתח|אנטריקוט|שייטל|אונטריב|אונטרייב|פילה/i.test(i)),
    sauceIngredients: [...new Set(sauces)],
    sideIngredients: [...new Set(sides)],
    drinks: [...new Set(drinks)]
  };
}

function renderShopping() {
  const groups = [
    { key: "meat", he: "בשר", en: "Meat" },
    { key: "seasoning", he: "יתר מרכיבי המנה", en: "Other main-dish ingredients" },
    { key: "sauceIngredients", he: "מרכיבי רוטב", en: "Sauce ingredients" },
    { key: "sideIngredients", he: "מרכיבי תוספות", en: "Side dish ingredients" },
    { key: "drinks", he: "שתייה", en: "Drinks" }
  ];

  el.content.innerHTML = `
    ${butcherGuideEntry()}
    ${groups.map((group) => {
      const items = state.shopping[group.key] || [];
      return `
        <div class="card">
          <h3 class="group-title">${group[state.lang]}</h3>
          ${items.length ? items.map((item, idx) => {
            const id = `${group.key}-${idx}`;
            return `<label class="check-item"><input type="checkbox" data-check="${id}" ${state.shoppingChecks[id] ? "checked" : ""} /><span>${escapeHotText(item)}</span></label>`;
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

  bindButcherGuideEntry();
  document.getElementById("copyList").addEventListener("click", async () => copyShoppingListToClipboard());
  document.getElementById("toButchers").addEventListener("click", () => {
    state.butcherFromHome = false;
    state.butcherReturnTo = null;
    currentStep = STEPS.indexOf("butcher");
    render();
  });
}

function butcherGuideEntry(compact = false) {
  const label = state.lang === "he" ? "מה לבקש מהקצב?" : "What should I ask the butcher?";
  if (compact) return `<button type="button" class="butcher-guide-link" id="openButcherGuide">${label}</button>`;
  return `<div class="card butcher-guide-entry"><button type="button" class="btn btn-ghost" id="openButcherGuide">${label}</button><p class="small">${state.lang === "he" ? "בוחרים מה להכין ומקבלים בקשה מוכנה לקצב." : "Choose a dish and get a ready-to-use butcher request."}</p></div>`;
}

function bindButcherGuideEntry() {
  document.getElementById("openButcherGuide")?.addEventListener("click", () => {
    const origin = STEPS[currentStep];
    // Reopening the guide from its own finder must not create a Back loop.
    if (origin !== "butcher" || state.butcherReturnTo !== "butcherGuide") state.butcherGuide.returnTo = origin;
    currentStep = STEPS.indexOf("butcherGuide");
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

function renderButcherGuide() {
  const he = state.lang === "he", guide = state.butcherGuide;
  el.content.innerHTML = `
    <div class="card">
      <p class="small">${he ? "מדריך לקניית בשר בקר. בוחרים מנה ומראים לקצב את הבקשה." : "A beef buying guide. Choose a dish and show the request to your butcher."}</p>
      <div class="field"><label for="butcherGoal">${he ? "אני רוצה להכין…" : "I want to make…"}</label>
        <select id="butcherGoal">${ButcherGuide.goals.map(g => `<option value="${g.id}" ${g.id === guide.goal ? "selected" : ""}>${escapeHotText(g.label[he ? 0 : 1])}</option>`).join("")}</select>
      </div>
      <div class="field"><label for="butcherServings">${he ? "כמה מנות?" : "How many servings?"}</label>
        <input id="butcherServings" type="number" min="1" max="20" step="1" inputmode="numeric" value="${guide.servings}" />
      </div>
    </div>
    <div id="butcherGuideResult" aria-live="polite"></div>
    <button class="btn btn-primary" id="guideFindButchers">${he ? "מצא קצבייה לידי" : "Find a butcher near me"}</button>
  `;
  document.getElementById("butcherGoal").addEventListener("change", event => {
    guide.goal = event.target.value;
    renderButcherGuideResult();
  });
  const servingsInput = document.getElementById("butcherServings");
  // Keep the request (and its copy action) current while a phone keyboard is still open.
  servingsInput.addEventListener("input", event => {
    if (!event.target.value.trim()) return;
    guide.servings = ButcherGuide.build(guide.goal, event.target.value).servings;
    renderButcherGuideResult();
  });
  servingsInput.addEventListener("change", event => {
    guide.servings = ButcherGuide.build(guide.goal, event.target.value).servings;
    event.target.value = guide.servings;
    renderButcherGuideResult();
  });
  document.getElementById("guideFindButchers").addEventListener("click", () => {
    if (guide.returnTo !== "butcher") state.butcherReturnTo = "butcherGuide";
    currentStep = STEPS.indexOf("butcher");
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  renderButcherGuideResult();
}

function renderButcherGuideResult() {
  const he = state.lang === "he";
  const result = ButcherGuide.build(state.butcherGuide.goal, state.butcherGuide.servings, state.lang);
  document.getElementById("butcherGuideResult").innerHTML = `
    <div class="card butcher-request-card">
      <h2>${he ? "זה מה להגיד לקצב" : "Your butcher request"}</h2>
      <p id="butcherRequestText" class="butcher-request-text">${escapeHotText(result.request)}</p>
      <button type="button" class="btn btn-ghost" id="copyButcherRequest">${he ? "העתק בקשה לקצב" : "Copy butcher request"}</button>
      <p class="small" id="butcherCopyStatus" role="status"></p>
      <textarea id="butcherManualCopy" aria-label="${he ? "בקשה לקצב להעתקה ידנית" : "Butcher request for manual copying"}" readonly hidden>${escapeHotText(result.request)}</textarea>
      <p class="small">${he ? `הערכת קנייה: ${result.gramsPerServing} גרם בשר נא ללא עצם למנה. התאימו לתיאבון ולתוספות; הכמות אינה מחליפה את כמויות המתכון.` : `Buying estimate: ${result.gramsPerServing} g raw boneless meat per serving. Adjust for appetite and sides; follow your recipe's quantities when available.`}</p>
      <details class="butcher-guide-notes">
        <summary>${he ? "למה הנתח הזה? חלופות ומקורות" : "Why this cut? Alternatives and sources"}</summary>
        <p>${escapeHotText(result.why)}</p>
        <p><strong>${he ? "אם אין: " : "Alternatives: "}</strong>${result.alternatives.map(escapeHotText).join(" / ")}</p>
        <p>${escapeHotText(result.check)}</p>
        <p class="small">${he ? "המספרים מתייחסים לחלוקה המקובלת של בקר בישראל. שמות וחלקים עשויים להשתנות בין קצביות; מציינים גם את המנה ואת החיתוך הרצוי." : "Numbers refer to the usual Israeli beef-cut system. Names and subdivisions can vary; describe the dish and preparation as well."}</p>
        <p class="small">${he ? "המקורות מסבירים התאמת נתחים ותערובות. ניסוח הבקשה והערכת הכמות הם של Smoke Radar." : "Sources explain cut and blend choices. The request wording and quantity estimate are by Smoke Radar."}</p>
        <ul class="butcher-guide-sources">${result.sources.map(source => `<li><a href="${escapeHotText(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHotText(source.name)}</a></li>`).join("")}</ul>
      </details>
    </div>
  `;
  document.getElementById("copyButcherRequest").addEventListener("click", async () => {
    const status = document.getElementById("butcherCopyStatus");
    try {
      await navigator.clipboard.writeText(result.request);
      status.textContent = he ? "הבקשה הועתקה — אפשר להדביק בוואטסאפ או להראות לקצב." : "Copied — paste it in a message or show your butcher.";
    } catch {
      const field = document.getElementById("butcherManualCopy");
      if (!field) return;
      field.hidden = false; field.focus(); field.select();
      status.textContent = he ? "אפשר להעתיק ידנית את הטקסט המסומן." : "Copy the selected text manually.";
    }
  });
}

async function loadButchers() {
  if (!navigator.geolocation) throw new Error("location_unavailable");
  let pos;
  try {
    pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000 }));
  } catch (error) {
    throw new Error(error.code === 1 ? "location_denied" : error.code === 3 ? "location_timeout" : "location_unavailable");
  }
  state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`/api/butchers-nearby?lat=${encodeURIComponent(state.location.lat)}&lng=${encodeURIComponent(state.location.lng)}&lang=${state.lang === "he" ? "he" : "en"}&includeAll=true`, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error("service_unavailable");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("service_unavailable");
    state.butchers = data;
    state.butcherLoaded = true;
    state.butcherCheckedAt = Date.now();
  } catch {
    throw new Error("service_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

function butcherErrorMessage(code) {
  const messages = {
    location_denied: ["הרשאת המיקום חסומה. אפשר גישה למיקום בהגדרות הדפדפן ונסה שוב.", "Location access is blocked. Allow it in browser settings and try again."],
    location_timeout: ["קבלת המיקום ארכה זמן רב מדי. נסה שוב.", "Getting your location timed out. Please try again."],
    location_unavailable: ["לא הצלחנו לקבל את המיקום. בדוק ששירותי המיקום פעילים ונסה שוב.", "Could not get your location. Check location services and try again."],
    service_unavailable: ["המיקום התקבל, אך שירות איתור הקצביות אינו זמין כרגע. אפשר לנסות שוב או לחפש במפות.", "Your location was received, but butcher search is currently unavailable. Retry or search in Maps."]
  };
  return (messages[code] || messages.service_unavailable)[state.lang === "he" ? 0 : 1];
}

async function searchButchers() {
  if (state.butcherLoading) return;
  state.butcherLoading = true;
  state.butcherError = null;
  renderButchers();
  try {
    await loadButchers();
  } catch (error) {
    state.butcherError = error.message;
  } finally {
    state.butcherLoading = false;
    // A completed request must not replace another screen after navigation.
    if (STEPS[currentStep] === "butcher") renderButchers();
  }
}

function renderButchers() {
  if (state.butcherLoading) {
    el.content.innerHTML = butcherGuideEntry() + renderButcherLoading();
    bindButcherGuideEntry();
    return;
  }
  if (state.butcherError || !state.butcherLoaded || !state.butchers.length) {
    const mapsQuery = state.location
      ? `butcher shops near ${state.location.lat},${state.location.lng}` : "butcher shops near me";
    el.content.innerHTML = `
      ${butcherGuideEntry()}
      <div class="card visual-map" aria-label="Butcher map"></div>
      ${state.butcherError ? `<div class="card" role="alert">${butcherErrorMessage(state.butcherError)}</div>` : ""}
      ${!state.butcherError && state.butcherLoaded ? `<div class="card">${state.lang === "he" ? "לא נמצאו קצביות באזור שלך. אפשר לחפש שוב או לפתוח מפות." : "No butcher shops found nearby. Try again or open Maps."}</div>` : ""}
      <button id="findButchers" class="btn btn-primary">${state.lang === "he" ? (state.butcherError || state.butcherLoaded ? "נסה שוב" : "📍 מצא קצביות קרובות") : (state.butcherError || state.butcherLoaded ? "Try again" : "📍 Find nearby butcher shops")}</button>
      ${state.butcherError || state.butcherLoaded ? `<a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}" target="_blank" rel="noopener">${state.lang === "he" ? "חפש קצביות ב־Google Maps" : "Search butcher shops in Google Maps"}</a>` : ""}
    `;
    bindButcherGuideEntry();
    document.getElementById("findButchers").addEventListener("click", searchButchers);
    return;
  }

  const he = state.lang === "he";
  const filters = state.butcherFilters;
  const filteredButchers = state.butchers.filter((shop) =>
    (!filters.openNow || getOpenNow(shop) === true) &&
    (!filters.saturday || shop.openOnSaturday === true)
  );
  const distances = filteredButchers.map((item) => getDistanceValue(item)).filter((v) => Number.isFinite(v));
  const closestDistance = distances.length ? Math.min(...distances) : NaN;
  const rankedButchers = [...filteredButchers]
    .map((shop) => {
      const distanceKm = getDistanceValue(shop);
      return { ...shop, distanceKm, rankingScore: getButcherRankingScore(shop, distanceKm) };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);

  el.content.innerHTML = `
    ${butcherGuideEntry()}
    <div class="card visual-map" aria-label="Butcher map"></div>
    <div class="card butcher-filter-panel">
      <div class="butcher-filters" role="group" aria-label="${he ? "סינון קצביות" : "Filter butcher shops"}">
        <button type="button" class="btn btn-choice ${filters.openNow ? "active" : ""}" id="filterOpenNow" aria-pressed="${filters.openNow}">${he ? "פתוח עכשיו" : "Open now"}</button>
        <button type="button" class="btn btn-choice ${filters.saturday ? "active" : ""}" id="filterSaturday" aria-pressed="${filters.saturday}">${he ? "פתוח בשבת" : "Open on Saturday"}</button>
      </div>
      <p class="small">${he ? "סינון מתוך הקצביות שנמצאו. פתוח בשבת = שעות יום שבת, כולל מוצ״ש, לפי Google Maps." : "Filters apply to the shops found. Saturday includes Saturday evening, according to Google Maps."}</p>
      <p class="small">${he ? "שעות פתיחה עשויות להשתנות בחגים; מומלץ לוודא לפני הגעה." : "Holiday hours may differ; confirm before visiting."}</p>
      <div class="butcher-filter-footer">
        <span class="small" role="status">${he ? `${Math.min(rankedButchers.length, 8)} מוצגות מתוך ${rankedButchers.length} מתאימות` : `Showing ${Math.min(rankedButchers.length, 8)} of ${rankedButchers.length} matches`}</span>
        <button type="button" class="btn btn-ghost" id="refreshButchers">${he ? "רענון תוצאות" : "Refresh results"}</button>
      </div>
      ${state.butcherCheckedAt ? `<p class="small">${he ? "מצב הפתיחה נבדק ב־" : "Opening status checked at "}<bdi>${new Date(state.butcherCheckedAt).toLocaleTimeString(he ? "he-IL" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</bdi></p>` : ""}
    </div>
    ${!rankedButchers.length ? `<div class="card" role="status"><p>${he ? "אין בתוצאות קצביות עם מידע שמאשר את הסינון שבחרת. עסק ללא מידע על שעות פתיחה לא נכלל במסנן." : "No results have confirmed hours matching these filters. Shops with unknown hours are excluded."}</p><button type="button" class="btn btn-ghost" id="clearButcherFilters">${he ? "הצג את כל התוצאות" : "Show all results"}</button></div>` : ""}
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
          <strong>📍 ${escapeHotText(b.name)}</strong>
          <p class="small">${escapeHotText(b.address || "")}</p>
          ${Number.isFinite(distance) ? `<p class="small">${state.lang === "he" ? `מרחק ממך: ${formatDistance(distance)}` : `Distance: ${formatDistance(distance)}`}</p>` : ""}
          ${renderOpenNowStatus(b)}
          ${renderButcherOpeningHours(b)}
          <div class="butcher-footer">
            <p class="small butcher-rating">${stars} ${b.rating || "-"} (${b.userRatingsTotal || 0})</p>
            <a class="btn btn-primary" href="${escapeHotText(safeButcherMapsUrl(b.mapsUrl))}" target="_blank" rel="noopener">${state.lang === "he" ? "פתח במפות" : "Open in Maps"}</a>
          </div>
        </article>`;
    }).join("")}
  `;
  bindButcherGuideEntry();
  for (const [id, key] of [["filterOpenNow", "openNow"], ["filterSaturday", "saturday"]]) {
    document.getElementById(id).addEventListener("click", () => {
      state.butcherFilters[key] = !state.butcherFilters[key];
      renderButchers();
      document.getElementById(id)?.focus();
    });
  }
  document.getElementById("refreshButchers").addEventListener("click", searchButchers);
  document.getElementById("clearButcherFilters")?.addEventListener("click", () => {
    state.butcherFilters = { openNow: false, saturday: false };
    renderButchers();
    document.getElementById("filterOpenNow")?.focus();
  });
}

function normalizeSubRecipes(items) {
  return (Array.isArray(items) ? items : []).filter(item => item && typeof item === "object").map(item => ({
    name: item.name || item.title || "", title: item.title || item.name || "",
    description: item.description || "",
    ingredients: Array.isArray(item.ingredients) ? item.ingredients.filter(i => typeof i === "string") : [],
    steps: Array.isArray(item.steps) ? item.steps.filter(i => typeof i === "string") : []
  }));
}

const sideRecipeTemplates = {
  he: [
    {
      id: "smoked_rosemary_potatoes",
      mainIngredient: "תפוחי אדמה",
      twist: "מעושנים עם רוזמרין",
      method: "smoked",
      texture: "קראנצ'י",
      flavorProfile: "מעושן-עשבי תיבול",
      description: "קראנצ'י מבחוץ ורך מבפנים, מתאים במיוחד לצד בשר על האש.",
      ingredients: ["6 תפוחי אדמה קטנים חצויים", "3 כפות שמן זית", "2 ענפי רוזמרין קצוצים", "1 כפית פפריקה מעושנת", "מלח גס ופלפל שחור"],
      steps: ["לערבב את תפוחי האדמה עם שמן זית, רוזמרין ותבלינים.", "לעשן או לצלות על אש עקיפה עד הזהבה עמוקה.", "לסיים בצריבה קצרה לחיזוק הקראנץ׳ ולהגיש חם."]
    },
    {
      id: "oven_garlic_lemon_vegetables",
      mainIngredient: "ירקות שורש",
      twist: "צלויים בתנור עם שום ולימון",
      method: "oven",
      texture: "רך-צלוי",
      flavorProfile: "חמצמץ-שומי",
      description: "קראנצ'י מבחוץ ורך מבפנים, מתאים במיוחד לצד בשר על האש.",
      ingredients: ["2 גזרים חתוכים למקלות", "2 בצלים סגולים לפלחים", "1 בטטה לקוביות", "4 שיני שום פרוסות", "גרידה ומיץ מחצי לימון", "2 כפות שמן זית", "מלח ופלפל שחור"],
      steps: ["לערבב את הירקות עם שמן זית, שום, לימון ותיבול.", "לצלות בתנור חם עד שהקצוות מקורמלים.", "להגיש עם עוד מעט מיץ לימון טרי מעל."]
    },
    {
      id: "fresh_herb_salad",
      mainIngredient: "סלט ירוקים",
      twist: "רענן עם עשבי תיבול וסומאק",
      method: "fresh",
      texture: "פריך",
      flavorProfile: "רענן-חמצמץ",
      description: "קראנצ'י מבחוץ ורך מבפנים, מתאים במיוחד לצד בשר על האש.",
      ingredients: ["2 מלפפונים פרוסים דק", "3 עגבניות בשלות חתוכות", "חופן פטרוזיליה קצוצה", "חופן נענע קצוצה", "1 כף סומאק", "2 כפות שמן זית", "1 כף מיץ לימון", "מלח"],
      steps: ["לקצוץ את כל הירקות והעשבים לקערה גדולה.", "לתבל בשמן זית, לימון, סומאק ומלח.", "לערבב בעדינות ולהגיש מיד לקבלת מרקם פריך."]
    }
  ],
  en: [
    {
      id: "smoked_rosemary_potatoes",
      mainIngredient: "Potatoes",
      twist: "smoked with rosemary",
      method: "smoked",
      texture: "crispy",
      flavorProfile: "smoky-herb",
      description: "Crispy outside and fluffy inside, perfect next to grilled meat.",
      ingredients: ["6 baby potatoes, halved", "3 tbsp olive oil", "2 rosemary sprigs, chopped", "1 tsp smoked paprika", "Coarse salt and black pepper"],
      steps: ["Coat potatoes with oil, rosemary, and spices.", "Smoke or roast over indirect heat until deeply golden.", "Finish with a quick sear for extra crisp texture."]
    },
    {
      id: "oven_garlic_lemon_vegetables",
      mainIngredient: "Root vegetables",
      twist: "oven-roasted with garlic and lemon",
      method: "oven",
      texture: "tender-roasted",
      flavorProfile: "garlic-citrus",
      description: "Crispy outside and fluffy inside, perfect next to grilled meat.",
      ingredients: ["2 carrots, batons", "2 red onions, wedges", "1 sweet potato, cubed", "4 garlic cloves, sliced", "Zest and juice of 1/2 lemon", "2 tbsp olive oil", "Salt and pepper"],
      steps: ["Toss vegetables with oil, garlic, lemon, and seasoning.", "Roast in a hot oven until edges caramelize.", "Serve with a final squeeze of fresh lemon."]
    },
    {
      id: "fresh_herb_salad",
      mainIngredient: "Green salad",
      twist: "fresh with herbs and sumac",
      method: "fresh",
      texture: "crunchy",
      flavorProfile: "bright-tangy",
      description: "Crispy outside and fluffy inside, perfect next to grilled meat.",
      ingredients: ["2 cucumbers, thinly sliced", "3 ripe tomatoes, chopped", "A handful chopped parsley", "A handful chopped mint", "1 tbsp sumac", "2 tbsp olive oil", "1 tbsp lemon juice", "Salt"],
      steps: ["Chop all vegetables and herbs into a large bowl.", "Season with olive oil, lemon juice, sumac, and salt.", "Toss gently and serve immediately for crisp texture."]
    }
  ]
};

const sauceRecipeTemplates = {
  he: [
    {
      id: "chimichurri_classic",
      styleName: "צ'ימיצ'ורי",
      descriptor: "קלאסי",
      base: "herb",
      originStyle: "דרום אמריקאי",
      description: "רענן, חמצמץ ומרים כל ביס.",
      ingredients: ["1 כוס פטרוזיליה קצוצה", "2 שיני שום קצוצות דק", "3 כפות שמן זית", "1 כף חומץ יין אדום", "1/2 כפית צ׳ילי גרוס", "מלח ופלפל שחור"],
      steps: ["לערבב בקערה את כל המרכיבים עד לקבלת רוטב אחיד.", "לטעום ולכוון חומציות ומליחות.", "להניח לנוח 10 דקות לפני ההגשה."]
    },
    {
      id: "smoked_garlic_butter",
      styleName: "חמאת שום",
      descriptor: "מעושנת",
      base: "dairy",
      originStyle: "אירופי חם",
      description: "רענן, חמצמץ ומרים כל ביס.",
      ingredients: ["80 גרם חמאה רכה", "3 שיני שום כתושות", "1 כפית פפריקה מעושנת", "1 כפית מיץ לימון", "1 כף פטרוזיליה קצוצה", "קורט מלח"],
      steps: ["להמיס בעדינות את החמאה בסיר קטן.", "להוסיף שום, פפריקה ולימון ולבשל דקה קצרה.", "לכבות אש, להוסיף פטרוזיליה ולהגיש חמים."]
    },
    {
      id: "spicy_pepper_sauce",
      styleName: "רוטב פלפלים",
      descriptor: "חריף",
      base: "spice",
      originStyle: "מזרח תיכוני",
      description: "רענן, חמצמץ ומרים כל ביס.",
      ingredients: ["1 פלפל אדום קלוי", "1 פלפל צ׳ילי טרי", "2 כפות שמן זית", "1 כף רסק עגבניות", "1 כפית כמון", "1 כפית סילאן", "מלח"],
      steps: ["לטחון פלפלים עם שמן זית ורסק עגבניות למרקם חלק.", "להוסיף כמון, סילאן ומלח ולערבב היטב.", "להגיש בטמפרטורת החדר לצד הבשר."]
    }
  ],
  en: [
    {
      id: "chimichurri_classic",
      styleName: "Chimichurri",
      descriptor: "Classic",
      base: "herb",
      originStyle: "South American",
      description: "Fresh, tangy, and lifts every bite.",
      ingredients: ["1 cup chopped parsley", "2 garlic cloves, finely chopped", "3 tbsp olive oil", "1 tbsp red wine vinegar", "1/2 tsp chili flakes", "Salt and black pepper"],
      steps: ["Mix all ingredients in a bowl until combined.", "Taste and balance acidity and seasoning.", "Rest for 10 minutes before serving."]
    },
    {
      id: "smoked_garlic_butter",
      styleName: "Garlic Butter",
      descriptor: "Smoked",
      base: "dairy",
      originStyle: "Warm European",
      description: "Fresh, tangy, and lifts every bite.",
      ingredients: ["80 g soft butter", "3 crushed garlic cloves", "1 tsp smoked paprika", "1 tsp lemon juice", "1 tbsp chopped parsley", "Pinch of salt"],
      steps: ["Melt butter gently in a small pan.", "Add garlic, paprika, and lemon and cook briefly.", "Turn off heat, stir in parsley, and serve warm."]
    },
    {
      id: "spicy_pepper_sauce",
      styleName: "Pepper Sauce",
      descriptor: "Spicy",
      base: "spice",
      originStyle: "Middle Eastern",
      description: "Fresh, tangy, and lifts every bite.",
      ingredients: ["1 roasted red pepper", "1 fresh chili pepper", "2 tbsp olive oil", "1 tbsp tomato paste", "1 tsp cumin", "1 tsp date syrup", "Salt"],
      steps: ["Blend peppers with olive oil and tomato paste until smooth.", "Mix in cumin, date syrup, and salt.", "Serve at room temperature alongside meat."]
    }
  ]
};

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
      <h4>${escapeHotText(item.title)}</h4>
      <p class="small">${escapeHotText(item.description || (state.lang === "he" ? "תוספת מומלצת למנה." : "Recommended side pairing."))}</p>
      <p class="small">${state.lang === "he" ? "מרכיבים" : "Ingredients"}</p>
      <ul class="list">${item.ingredients.map((ingredient) => `<li>${escapeHotText(ingredient)}</li>`).join("")}</ul>
      <p class="small">${state.lang === "he" ? "הכנה" : "Instructions"}</p>
      <ol class="list">${item.steps.map((step) => `<li>${escapeHotText(step)}${renderStepTip(step, undefined, "side", item)}</li>`).join("")}</ol>
    </div>
  `).join("");
}

async function handleNext() {
  const step = STEPS[currentStep];
  if (["landing", "saved", "hot", "butcherGuide"].includes(step)) return;
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
    state.navigation.recipeReturnTo = "preferences";
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
    state.butcherFromHome = false;
    state.butcherReturnTo = null;
    currentStep = STEPS.indexOf("butcher");
    render();
    return;
  }
  if (step === "butcher") {
    goHome();
    return;
  }
  if (step === "cook") {
    state.navigation.recipeReturnTo = "cook";
    state.recipe = null;
    currentStep = STEPS.indexOf("recipe");
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
  // Preserve the generated cooking instructions, amounts and full side recipes.
  if (!recipe || typeof recipe !== "object") return null;
  const main = recipe.main || {};
  const metadata = main.metadata || {};
  return {
    ...recipe,
    main: { ...main, prepTime: main.prepTime || metadata.prep_time || "",
      cookTime: main.cookTime || metadata.cook_time || "", totalTime: main.totalTime || metadata.total_time || "",
      difficulty: main.difficulty || metadata.difficulty || "" },
    sauces: normalizeSubRecipes(recipe.sauces), sides: normalizeSubRecipes(recipe.sides)
  };
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
    sub.description = type === "side"
      ? (lang === "he" ? "קראנצ'י מבחוץ ורך מבפנים, מתאים במיוחד לצד בשר על האש." : "Crispy outside and fluffy inside, perfect next to grilled meat.")
      : (lang === "he" ? "רענן, חמצמץ ומרים כל ביס." : "Fresh, tangy, and lifts every bite.");
  }
  sub.ingredients = ensureRelevantSideIngredients(sub, type);
  sub.steps = sub.steps.filter(Boolean);
  if (!sub.steps.length) sub.steps = defaultSubRecipe(type, sub.title).steps;
  return sub;
}

function enforceSubRecipeDiversity(items, type, { kosherMode, lang }) {
  const targetCount = 2;
  const templates = getSubRecipeTemplates(type, lang, kosherMode);
  const titleSet = new Set();
  const selected = [];

  const candidates = dedupeSubRecipesByTitle(items);
  candidates.forEach((item) => {
    const normalized = finalizeSubRecipe(item, type, lang);
    if (canAddSubRecipe(selected, normalized, type, titleSet)) {
      selected.push(normalized);
      titleSet.add(normalizeTitleKey(normalized.title));
    }
  });

  for (const template of templates) {
    if (selected.length >= targetCount) break;
    const built = buildSubRecipeFromTemplate(template, type, lang);
    if (canAddSubRecipe(selected, built, type, titleSet)) {
      selected.push(finalizeSubRecipe(built, type, lang));
      titleSet.add(normalizeTitleKey(built.title));
    }
  }

  return selected.slice(0, targetCount);
}

function getSubRecipeTemplates(type, lang, kosherMode) {
  const templatePool = type === "side" ? sideRecipeTemplates[lang] : sauceRecipeTemplates[lang];
  if (!Array.isArray(templatePool)) return [];
  if (type !== "sauce" || !kosherMode) return templatePool;
  return templatePool.filter((tpl) => tpl.base !== "dairy");
}

function buildSubRecipeFromTemplate(template, type, lang) {
  if (type === "side") {
    return {
      title: lang === "he"
        ? `${template.mainIngredient} ${template.twist}`
        : `${template.mainIngredient} ${template.twist}`,
      description: template.description,
      ingredients: [...template.ingredients],
      steps: [...template.steps],
      method: template.method,
      texture: template.texture,
      flavorProfile: template.flavorProfile,
      templateId: template.id
    };
  }
  return {
    title: `${template.styleName} ${template.descriptor}`,
    description: template.description,
    ingredients: [...template.ingredients],
    steps: [...template.steps],
    base: template.base,
    originStyle: template.originStyle,
    templateId: template.id
  };
}

function finalizeSubRecipe(item, type, lang) {
  const result = {
    ...item,
    description: item.description || (type === "side"
      ? (lang === "he" ? "קראנצ'י מבחוץ ורך מבפנים, מתאים במיוחד לצד בשר על האש." : "Crispy outside and fluffy inside, perfect next to grilled meat.")
      : (lang === "he" ? "רענן, חמצמץ ומרים כל ביס." : "Fresh, tangy, and lifts every bite."))
  };
  if (lang === "he") {
    result.title = normalizeHebrewCookingText(result.title || "");
    result.description = normalizeHebrewCookingText(result.description || "");
    result.ingredients = (result.ingredients || []).map(normalizeHebrewCookingText);
    result.steps = (result.steps || []).map(normalizeHebrewCookingText);
  }
  return result;
}

function canAddSubRecipe(selected, candidate, type, titleSet) {
  const titleKey = normalizeTitleKey(candidate?.title || "");
  if (!titleKey || titleSet.has(titleKey)) return false;
  if (!candidate?.ingredients?.length || !candidate?.steps?.length) return false;
  return selected.every((existing) => isSubRecipePairDiverse(existing, candidate, type));
}

function isSubRecipePairDiverse(first, second, type) {
  if (ingredientSimilarity(first.ingredients, second.ingredients) > 0.7) return false;
  if (stepStructureSimilarity(first.steps, second.steps) > 0.75) return false;

  if (type === "side") {
    const methodA = classifySideMethod(first);
    const methodB = classifySideMethod(second);
    const textureA = classifySideTexture(first);
    const textureB = classifySideTexture(second);
    const flavorA = classifySideFlavor(first);
    const flavorB = classifySideFlavor(second);
    return methodA !== methodB && textureA !== textureB && flavorA !== flavorB;
  }

  const baseA = classifySauceBase(first);
  const baseB = classifySauceBase(second);
  const originA = classifySauceOrigin(first);
  const originB = classifySauceOrigin(second);
  return baseA !== baseB && originA !== originB;
}

function ingredientSimilarity(a, b) {
  const setA = new Set((a || []).map(normalizeIngredientKey).filter(Boolean));
  const setB = new Set((b || []).map(normalizeIngredientKey).filter(Boolean));
  const union = new Set([...setA, ...setB]);
  if (!union.size) return 0;
  let intersection = 0;
  union.forEach((entry) => {
    if (setA.has(entry) && setB.has(entry)) intersection += 1;
  });
  return intersection / union.size;
}

function stepStructureSimilarity(a, b) {
  const structureA = (a || []).map((step, idx) => `${idx}:${normalizeStepKey(step)}`).join("|");
  const structureB = (b || []).map((step, idx) => `${idx}:${normalizeStepKey(step)}`).join("|");
  if (!structureA || !structureB) return 0;
  if (structureA === structureB) return 1;
  const minLen = Math.min((a || []).length, (b || []).length);
  const matches = Array.from({ length: minLen }).filter((_, i) => normalizeStepKey(a[i]) === normalizeStepKey(b[i])).length;
  return matches / Math.max((a || []).length, (b || []).length);
}

function classifySideMethod(item) {
  const source = `${item?.method || ""} ${item?.title || ""} ${(item?.steps || []).join(" ")}`.toLowerCase();
  if (/fresh|סלט|טרי/.test(source)) return "fresh";
  if (/oven|תנור|צלו|אפייה/.test(source)) return "oven";
  if (/smoked|מעוש|גריל|צלייה/.test(source)) return "smoked_grilled";
  return "other";
}

function classifySideTexture(item) {
  const source = `${item?.texture || ""} ${item?.description || ""} ${(item?.steps || []).join(" ")}`.toLowerCase();
  if (/קראנצ|crispy|crunchy/.test(source)) return "crispy";
  if (/רך|tender|fluffy|creamy/.test(source)) return "soft";
  if (/פריך|fresh|עסיס/.test(source)) return "fresh";
  return "other";
}

function classifySideFlavor(item) {
  const source = `${item?.flavorProfile || ""} ${item?.title || ""} ${(item?.ingredients || []).join(" ")}`.toLowerCase();
  if (/מעוש|smok/.test(source)) return "smoky";
  if (/לימון|חומץ|sumac|סומאק|חמצ/.test(source)) return "acidic";
  if (/שום|garlic|עשבי|herb/.test(source)) return "herby_garlic";
  return "other";
}

function classifySauceBase(item) {
  const source = `${item?.base || ""} ${item?.title || ""} ${(item?.ingredients || []).join(" ")}`.toLowerCase();
  if (/butter|cream|יוגורט|חמאה|שמנת/.test(source)) return "dairy";
  if (/שמן|olive oil|oil/.test(source)) return "oil";
  if (/parsley|cilantro|פטרוזיליה|עשבי|mint|נענע/.test(source)) return "herb";
  if (/pepper|chili|צ׳ילי|פלפל|כמון|paprika/.test(source)) return "spice";
  return "other";
}

function classifySauceOrigin(item) {
  const source = `${item?.originStyle || ""} ${item?.title || ""} ${item?.description || ""}`.toLowerCase();
  if (/chimichurri|דרום אמריק|south american|ארגנטינ/.test(source)) return "south_american";
  if (/middle eastern|מזרח תיכונ|סומאק|סילאן/.test(source)) return "middle_eastern";
  if (/אירופ|european|butter/.test(source)) return "european";
  return "other";
}

function normalizeIngredientKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^\p{L}\s]+/gu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeStepKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\s]+/gu, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}

function normalizeTitleKey(title) {
  return String(title || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
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
    [/\bparsley\b/ig, "פטרוזיליה"],
    [/\bgarlic cloves?\b/ig, "שיני שום"],
    [/tablespoons?/ig, "כפות"],
    [/teaspoons?/ig, "כפיות"],
    [/\bgrams?\b/ig, "גרם"],
    [/\bml\b/ig, "מ״ל"],
    [/\bmix\b/ig, "לערבב"],
    [/\badd\b/ig, "להוסיף"],
    [/\blet rest\b/ig, "להניח לנוח"],
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
    const key = normalizeTitleKey(item?.title || "");
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
  const he = state.lang === "he";
  let text = status === null ? (he ? "מצב הפתיחה לא ידוע" : "Opening status unknown")
    : status ? (he ? "פתוח עכשיו" : "Open now") : (he ? "סגור עכשיו" : "Closed now");
  if (shop.businessStatus === "CLOSED_PERMANENTLY") text = he ? "סגור לצמיתות" : "Permanently closed";
  if (shop.businessStatus === "CLOSED_TEMPORARILY") text = he ? "סגור זמנית" : "Temporarily closed";
  return `<p class="butcher-status ${status === null ? "is-unknown" : status ? "is-open" : "is-closed"}">${text}</p>`;
}

function renderButcherOpeningHours(shop) {
  const he = state.lang === "he";
  const saturday = shop.openOnSaturday;
  const saturdayText = saturday === true ? (he ? "פתוח בשבת לפי השעות הרשומות" : "Open on Saturday according to listed hours")
    : saturday === false ? (he ? "סגור בשבת" : "Closed on Saturday")
    : (he ? "אין מידע על פתיחה בשבת" : "Saturday hours unknown");
  const hours = Array.isArray(shop.openingHours) ? shop.openingHours.filter((line) => typeof line === "string") : [];
  const title = shop.openingHoursType === "regular" ? (he ? "שעות פתיחה רגילות" : "Regular opening hours")
    : (he ? "שעות פתיחה לשבוע הקרוב" : "Opening hours for the next seven days");
  return `<p class="small butcher-saturday">${saturdayText}</p>${hours.length
    ? `<details class="butcher-hours"><summary>${title}</summary><ul>${hours.map((line) => `<li dir="auto">${escapeHotText(line)}</li>`).join("")}</ul></details>`
    : `<p class="small butcher-hours-missing">${he ? "שעות הפתיחה לא נמסרו" : "Opening hours unavailable"}</p>`}`;
}

function safeButcherMapsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "https://www.google.com/maps";
  } catch { return "https://www.google.com/maps"; }
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
  initRecipeAccounts();
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

async function saveCurrentRecipe() {
  if (!state.recipe) return;
  if (state.account.initializing || state.account.loading || state.account.busy) {
    showToast(state.lang === "he" ? "ממתין לסיום טעינת החשבון. נסה שוב בעוד רגע." : "Please wait for your account to finish loading.");
    return;
  }
  const main = state.recipe.main || {};
  const savedRecipe = {
    id: crypto.randomUUID(),
    title: main.title || (state.lang === "he" ? "מתכון ללא שם" : "Untitled Recipe"),
    preferences: { ...state.preferences },
    recipeVersion: state.recipe.recipeVersion,
    generation: RecipeGuidance.generation(state.recipe.generation),
    dietaryPreference: state.recipe.dietaryPreference,
    main: state.recipe.main || {},
    sauces: state.recipe.sauces || [],
    sides: state.recipe.sides || [],
    drinks: state.recipe.drinkPairings || [],
    shopping: state.shopping || {},
    createdAt: new Date().toISOString(),
    thumbnail: recipeThumbnailForCut(state.preferences.cutId)
  };
  const button = document.getElementById("saveRecipeBtn");
  if (button) button.disabled = true;
  try {
    if (await recipeStore.save(savedRecipe)) showToast(state.lang === "he"
      ? (state.account.user ? "המתכון נשמר בחשבון שלך" : "המתכון נשמר במכשיר הזה")
      : (state.account.user ? "Recipe saved to your account" : "Recipe saved on this device"));
  } catch {
    showToast(state.lang === "he" ? "המתכון לא נשמר. בדוק את החיבור ונסה שוב." : "Recipe was not saved. Check your connection and retry.");
  } finally { if (button) button.disabled = false; }
}

function openSavedRecipe(id) {
  const saved = state.savedRecipes.find((item) => item.id === id);
  if (!saved) return;
  state.navigation.recipeReturnTo = STEPS[currentStep] === "landing" ? "landing" : "saved";
  state.preferences = { ...state.preferences, equipmentMode: "standard", thicknessCm: 2.5, ...(saved.preferences || {}) };
  state.recipe = {
    recipeVersion: saved.recipeVersion,
    generation: RecipeGuidance.generation(saved.generation),
    dietaryPreference: saved.dietaryPreference || saved.preferences?.dietaryPreference,
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

async function deleteSavedRecipe(id) {
  try { await recipeStore.remove(id); }
  catch { showToast(state.lang === "he" ? "המחיקה לא הושלמה. נסה שוב." : "Deletion failed. Please retry."); }
}

function loadSavedRecipes() {
  recipeStore = RecipeStore.create({
    storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    key: SAVED_RECIPES_KEY,
    onChange(snapshot) {
      state.savedRecipes = snapshot.recipes;
      Object.assign(state.account, { user: snapshot.user, loading: snapshot.loading, busy: snapshot.busy, error: snapshot.error, guestCount: snapshot.guestCount });
      renderRecipeAccountScreen();
    }
  });
  state.savedRecipes = recipeStore.snapshot().recipes;
}

function renderRecipeAccountScreen() {
  if (["landing", "saved"].includes(STEPS[currentStep])) render();
}

async function initRecipeAccounts(loadModule = () => import("/app/recipe-account.js")) {
  const controller = new AbortController();
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("account-initialization-timeout"));
    }, 10000);
  });
  const initialize = async () => {
    const response = await fetch("/api/recipe-account-config", { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("account-config-unavailable");
    const settings = await response.json();
    if (controller.signal.aborted) return;
    if (!settings.enabled) return;
    state.account.enabled = true;
    state.account.providers = settings.providers;
    const { connect } = await loadModule();
    if (controller.signal.aborted) return;
    const client = await connect({
      ...settings, store: recipeStore, lang: state.lang, signal: controller.signal,
      onUser(user) {
        if (controller.signal.aborted) return;
        if (state.account.user && state.account.user.uid !== user?.uid) {
          // Never leave the previous account's opened recipe visible after logout.
          state.recipe = null; state.shopping = {}; state.shoppingChecks = {}; state.lastOpenedRecipeId = null;
          if (["recipe", "shopping"].includes(STEPS[currentStep])) currentStep = STEPS.indexOf("saved");
        }
      }
    });
    if (controller.signal.aborted) return;
    recipeAccountClient = client;
    state.account.ready = true;
  };
  try { await Promise.race([initialize(), deadline]); }
  catch { controller.abort(); state.account.connectionError = true; }
  finally {
    clearTimeout(timeout);
    state.account.initializing = false;
    renderRecipeAccountScreen();
  }
}

function renderRecipeAccount(always = false) {
  const account = state.account, he = state.lang === "he";
  if (!account.enabled && !always) return "";
  if (account.initializing) return `<div class="card small" role="status">${he ? "בודק את החשבון..." : "Checking your account..."}</div>`;
  const disabled = account.busy || account.loading ? "disabled" : "";
  if (!account.user) return `<section class="card recipe-account">
    <h3>${he ? "המתכונים שלך" : "Your recipes"}</h3>
    <p class="small">${he ? "ללא התחברות, המתכונים נשמרים בדפדפן הזה בלבד." : "Without sign-in, recipes are saved only in this browser."}</p>
    ${account.ready ? `<p class="small">${he ? "התחבר כדי לשמור מתכונים בחשבון ולפתוח אותם גם ממכשיר אחר." : "Sign in to save recipes to your account and access them on other devices."}</p><div class="account-actions">${account.providers.map(provider => `<button type="button" class="btn btn-ghost account-signin" data-recipe-login="${provider}">${he ? "המשך עם" : "Continue with"} ${provider === "google" ? "Google" : "Facebook"}</button>`).join("")}</div><p class="small">${he ? "אם נכנסת מתוך פייסבוק או וואטסאפ, פתח את הקישור ב־Chrome או Safari כדי להתחבר." : "If opened inside Facebook or WhatsApp, open this link in Chrome or Safari to sign in."}</p>` : ""}
    ${account.connectionError ? `<p class="small" role="alert">${he ? "ההתחברות אינה זמינה כרגע. אפשר לרענן ולנסות שוב; השמירה במכשיר עדיין זמינה." : "Sign-in is unavailable. Refresh to retry; device-only saving still works."}</p>` : ""}
  </section>`;
  return `<section class="card recipe-account">
    <h3>${he ? "המתכונים בחשבון שלך" : "Your account recipes"}</h3>
    <p class="small account-identity" dir="auto">${escapeHotText(account.user.displayName || account.user.email || (he ? "מחובר" : "Signed in"))}</p>
    <p class="small">${he ? "המתכונים נשמרים בחשבון וזמינים במכשירים שבהם תתחבר אליו." : "Recipes are saved to your account and available on devices signed into it."}</p>
    ${account.error ? `<p role="alert" class="small">${he ? "הסנכרון לא הושלם. בדוק את החיבור ונסה שוב." : "Sync did not complete. Check your connection and retry."}</p>` : ""}
    <div class="account-actions"><button type="button" class="btn btn-ghost" id="refreshRecipes" ${disabled}>${he ? "רענון מתכונים" : "Refresh recipes"}</button><button type="button" class="btn btn-ghost" id="recipeSignOut" ${account.busy ? "disabled" : ""}>${he ? "התנתק" : "Sign out"}</button></div>
    ${account.guestCount ? `<p class="small">${he ? `${account.guestCount} מתכונים שמורים גם במכשיר הזה. אפשר להעביר אותם לחשבון הנוכחי.` : `${account.guestCount} recipes are saved on this device. You can move them into this account.`}</p><button type="button" class="btn btn-ghost" id="importDeviceRecipes" ${disabled}>${he ? "העבר את מתכוני המכשיר לחשבון" : "Move device recipes into this account"}</button>` : ""}
    ${account.busy ? `<p class="small" role="status">${he ? "שומר שינויים..." : "Saving changes..."}</p>` : ""}
    <details><summary>${he ? "ניהול חשבון" : "Account settings"}</summary><button type="button" class="btn btn-ghost" id="deleteRecipeAccount" ${disabled}>${he ? "מחק חשבון ואת כל המתכונים שבו" : "Delete account and all its recipes"}</button></details>
  </section>`;
}

function recipeLoginError(error) {
  const he = state.lang === "he";
  if (["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(error?.code)) return he ? "ההתחברות בוטלה." : "Sign-in cancelled.";
  if (error?.code === "auth/account-exists-with-different-credential") return he ? "כבר קיים חשבון עם האימייל הזה. התחבר באותה שיטה שבה נרשמת." : "This email already has an account. Use your original sign-in method.";
  return he ? "לא ניתן להתחבר כרגע. פתח ב־Chrome או Safari, אפשר חלונות קופצים ונסה שוב." : "Could not sign in. Open in Chrome or Safari, allow popups, and retry.";
}

function bindRecipeAccount() {
  el.content.querySelectorAll("[data-recipe-login]").forEach(button => button.addEventListener("click", async () => {
    if (!recipeAccountClient) return;
    button.disabled = true;
    try { await recipeAccountClient.login(button.dataset.recipeLogin); }
    catch (error) { showToast(recipeLoginError(error)); }
    finally { button.disabled = false; }
  }));
  document.getElementById("recipeSignOut")?.addEventListener("click", async () => {
    try { await recipeAccountClient.logout(); }
    catch { showToast(state.lang === "he" ? "ההתנתקות לא הושלמה. נסה שוב." : "Sign-out failed. Please retry."); }
  });
  document.getElementById("refreshRecipes")?.addEventListener("click", () => recipeStore.refresh());
  document.getElementById("deleteRecipeAccount")?.addEventListener("click", async () => {
    if (!window.confirm(state.lang === "he" ? "למחוק את החשבון ואת כל המתכונים שנשמרו בו? הפעולה בלתי הפיכה. תתבקש לאמת את ההתחברות." : "Delete your account and all its saved recipes? This cannot be undone. You will be asked to sign in again.")) return;
    state.account.busy = true;
    try {
      const deletion = recipeAccountClient.deleteAccount();
      renderRecipeAccountScreen();
      await deletion;
      showToast(state.lang === "he" ? "החשבון נמחק" : "Account deleted");
    } catch { showToast(state.lang === "he" ? "המחיקה לא הושלמה. אפשר לנסות שוב." : "Deletion did not complete. Please retry."); }
    finally { state.account.busy = false; renderRecipeAccountScreen(); }
  });
  document.getElementById("importDeviceRecipes")?.addEventListener("click", async () => {
    try {
      if (await recipeStore.importGuests()) showToast(state.lang === "he" ? "המתכונים הועברו לחשבון" : "Recipes moved to your account");
    } catch { showToast(state.lang === "he" ? "ההעברה לא הושלמה. מתכוני המכשיר נשמרו; אפשר לנסות שוב." : "Import incomplete. Your device recipes were retained; you can retry."); }
  });
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
        "Without sign-in, saved recipes are stored in this browser. Clearing browser data can remove them.",
        "When account sign-in is enabled and you choose Google or Facebook, Firebase manages authentication and stores your user identifier and profile information such as name and email. Smoke Radar does not receive your Google or Facebook password.",
        "Recipes saved while signed in are stored in your private account in Cloud Firestore. Device recipes move to your account only when you choose to import them.",
        "You can delete individual recipes in My Recipes, or delete your account and its recipes under Account settings. Full details and data deletion instructions: /app/privacy.html.",
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
  const shareData = { title: "Smoke Radar", text: SHARE_TEXT, url: new URL("/install", window.location.origin).href };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${shareData.url}`);
      alert(state.lang === "he" ? "הקישור הועתק" : "Link copied");
      return;
    }
    alert(SHARE_TEXT);
  } catch {
    alert(state.lang === "he" ? "לא הצלחנו לשתף כרגע" : "Could not share right now");
  }
}

function recipeThumbnailForCut(cutId) {
  if (["brisket", "short_ribs", "chuck", "chuck_roll"].includes(cutId)) return "/app/assets/recipe-bg.jpg.png";
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
