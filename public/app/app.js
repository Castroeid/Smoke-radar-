const steps = ["home", "hot", "preferences", "cook", "recipe", "shopping", "butcher"];
let currentStep = 0;

const state = {
  homeChoice: null,
  hotList: [],
  selectedHot: null,
  preferences: { meatType: "beef", cut: "Ribeye", method: "גריל", flavor: "Smoky", dietaryPreference: "kosher" },
  mealIdeas: [],
  selectedMealIdea: null,
  recipe: null,
  shopping: [],
  butchers: [],
  location: null
};

const titleMap = {
  home: "מה בא לך להכין היום?",
  hot: "מה חם עכשיו",
  preferences: "בחר העדפות",
  cook: "מה לבשל",
  recipe: "איך לבשל",
  shopping: "מה לקנות",
  butcher: "איפה לקנות"
};

const screenTitle = document.getElementById("screenTitle");
const screenContent = document.getElementById("screenContent");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const appRoot = document.getElementById("app");

backBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep -= 1;
    render();
  }
});
nextBtn.addEventListener("click", async () => {
  await handleNext();
});

function setStep(stepIndex) {
  currentStep = stepIndex;
  render();
}

function render() {
  const step = steps[currentStep];
  appRoot.dataset.step = step;
  screenTitle.textContent = titleMap[step];
  backBtn.classList.toggle("hidden", currentStep === 0);
  nextBtn.textContent = currentStep === steps.length - 1 ? "סיום" : "המשך";

  if (step === "home") return renderHome();
  if (step === "hot") return renderHotNow();
  if (step === "preferences") return renderPreferences();
  if (step === "cook") return renderCookIdeas();
  if (step === "recipe") return renderRecipe();
  if (step === "shopping") return renderShopping();
  if (step === "butcher") return renderButchers();
}

function renderHome() {
  screenContent.innerHTML = `
    <button class="btn btn-choice ${state.homeChoice === "hot" ? "active" : ""}" data-choice="hot">🔥 מה חם עכשיו</button>
    <button class="btn btn-choice ${state.homeChoice === "feel" ? "active" : ""}" data-choice="feel">😋 אני יודע מה בא לי</button>
    <p class="small">כל מסך כולל החלטה אחת, בצורה מהירה ונוחה למובייל.</p>
  `;
  screenContent.querySelectorAll("[data-choice]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.homeChoice = btn.dataset.choice;
      if (state.homeChoice === "hot") {
        await loadHotNow();
        setStep(1);
      } else {
        setStep(2);
      }
    });
  });
}

async function loadHotNow() {
  if (state.hotList.length) return;
  const res = await fetch("/api/smoke-radar");
  const data = await res.json();
  state.hotList = (data.videos || []).slice(0, 6).map((v) => ({
    title: v.title,
    cut: inferCut(v.title),
    heat: v.smokeScore > 75 ? "🔥🔥🔥" : v.smokeScore > 45 ? "🔥🔥" : "🔥"
  }));
}

function inferCut(text = "") {
  const t = text.toLowerCase();
  if (t.includes("ribeye")) return "Ribeye";
  if (t.includes("brisket")) return "Brisket";
  if (t.includes("picanha")) return "Picanha";
  if (t.includes("short rib")) return "Short Ribs";
  return "Beef Cut";
}

function renderHotNow() {
  if (!state.hotList.length) {
    screenContent.innerHTML = `<div class="card">טוען מגמות...</div>`;
    return;
  }
  screenContent.innerHTML = state.hotList.map((item, idx) => `
      <button class="btn btn-choice ${state.selectedHot === idx ? "active" : ""}" data-hot="${idx}">
        <strong>${item.heat} ${item.cut}</strong><br>
        <span class="small">${item.title}</span>
      </button>
    `).join("");

  screenContent.querySelectorAll("[data-hot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedHot = Number(btn.dataset.hot);
      state.preferences.cut = state.hotList[state.selectedHot].cut;
      renderHotNow();
    });
  });
}

function renderPreferences() {
  screenContent.innerHTML = `
    <div class="card">
      <label>סוג בשר</label>
      <select id="meatType"><option value="beef">Beef</option><option value="lamb">Lamb</option></select>
      <label>נתח</label>
      <input id="cut" value="${state.preferences.cut}" />
      <label>שיטת בישול</label>
      <select id="method"><option>גריל</option><option>מעשנה</option><option>תנור</option></select>
    </div>
  `;
  ["meatType", "cut", "method"].forEach((id) => {
    document.getElementById(id).addEventListener("change", collectPreferences);
    document.getElementById(id).addEventListener("input", collectPreferences);
  });
}

function collectPreferences() {
  state.preferences.meatType = document.getElementById("meatType").value;
  state.preferences.cut = document.getElementById("cut").value;
  state.preferences.method = document.getElementById("method").value;
}

function renderCookIdeas() {
  if (!state.mealIdeas.length) {
    state.mealIdeas = buildIdeas();
  }
  screenContent.innerHTML = state.mealIdeas.map((idea, idx) => `
    <button class="btn btn-choice ${state.selectedMealIdea === idx ? "active" : ""}" data-idea="${idx}">
      <strong>${idea.title}</strong>
      <span class="small">${idea.note}</span>
    </button>
  `).join("");

  screenContent.querySelectorAll("[data-idea]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedMealIdea = Number(btn.dataset.idea);
      state.preferences.flavor = state.mealIdeas[state.selectedMealIdea].flavor;
      renderCookIdeas();
    });
  });
}

function buildIdeas() {
  const cut = state.preferences.cut || "Beef Cut";
  return [
    { title: `${cut} על גריל עם צריבה מהירה`, note: "עשיר וקלאסי", flavor: "Classic" },
    { title: `${cut} בעישון איטי`, note: "טעם עמוק", flavor: "Smoky" },
    { title: `${cut} בתנור עם רוטב פלפל`, note: "ארוחה אלגנטית", flavor: "Bold" },
    { title: `${cut} בסגנון ים-תיכוני`, note: "רענן ומתובל", flavor: "Mediterranean" }
  ].slice(0, 4);
}

async function loadRecipe() {
  const p = state.preferences;
  const query = new URLSearchParams({
    lang: "he",
    meatType: p.meatType,
    cut: p.cut,
    method: p.method,
    flavor: p.flavor,
    dietaryPreference: p.dietaryPreference,
    mode: "all",
    r: String(Math.floor(Math.random() * 1000000))
  });
  const res = await fetch(`/api/ai-recipe?${query.toString()}`);
  const data = await res.json();
  state.recipe = data.structuredRecipe || null;
  state.shopping = buildShoppingList(state.recipe);
}

function renderRecipe() {
  if (!state.recipe) {
    screenContent.innerHTML = `<div class="card">מכין מתכון חכם...</div>`;
    loadRecipe().then(renderRecipe).catch(() => {
      screenContent.innerHTML = `<div class="card">לא ניתן לטעון מתכון כרגע.</div>`;
    });
    return;
  }
  const main = state.recipe.main || {};
  const sauces = (state.recipe.sauces || []).slice(0, 2).map((s) => s.name).join(" • ");
  const sides = (state.recipe.sides || []).slice(0, 3).map((s) => s.name).join(" • ");
  const drinks = (state.recipe.drinkPairings || []).slice(0, 2).map((d) => d.name).join(" • ");

  screenContent.innerHTML = `
    <div class="card"><strong>${main.title || "מנה מומלצת"}</strong><p class="small">${main.description || ""}</p></div>
    <div class="card"><strong>מרכיבים</strong><ul class="list">${(main.ingredients || []).slice(0, 8).map((i) => `<li>${i}</li>`).join("")}</ul></div>
    <div class="card"><strong>שלבי הכנה</strong><ol class="list">${(main.steps || []).slice(0, 6).map((s) => `<li>${s}</li>`).join("")}</ol></div>
    <div class="card"><strong>רטבים</strong><p>${sauces || "לפי המתכון"}</p></div>
    <div class="card"><strong>תוספות</strong><p>${sides || "לפי המתכון"}</p></div>
    <div class="card"><strong>שתייה מתאימה</strong><p>${drinks || "לפי המתכון"}</p></div>
    <div class="card"><strong>כשרות</strong><p>${state.recipe.dietaryPreference === "kosher" ? "כשר" : "לא כשר"}</p></div>
  `;
}

function buildShoppingList(recipe) {
  if (!recipe?.main) return [];
  const items = [
    ...recipe.main.ingredients || [],
    ...(recipe.sauces || []).flatMap((s) => s.ingredients || []),
    ...(recipe.sides || []).map((s) => s.name),
    ...(recipe.drinkPairings || []).map((d) => d.name)
  ];
  return [...new Set(items)].slice(0, 24);
}

function renderShopping() {
  screenContent.innerHTML = `
    <div class="card">
      <strong>רשימת קניות</strong>
      <ul class="list">${state.shopping.map((item) => `<li>${item}</li>`).join("")}</ul>
    </div>
  `;
}

async function loadButchers() {
  if (!navigator.geolocation) throw new Error("Location unavailable");
  const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000 }));
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  state.location = { lat, lng };
  const res = await fetch(`/api/butchers-nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
  state.butchers = await res.json();
}

function renderButchers() {
  if (!state.butchers.length && !state.location) {
    screenContent.innerHTML = `<button id="findButchers" class="btn btn-primary">מצא קצביות קרובות</button>`;
    document.getElementById("findButchers").addEventListener("click", async () => {
      screenContent.innerHTML = `<div class="card">מחפש קצביות בסביבה...</div>`;
      try {
        await loadButchers();
        renderButchers();
      } catch {
        screenContent.innerHTML = `<div class="card">לא הצלחנו למשוך מיקום. אפשר לאשר הרשאת מיקום ולנסות שוב.</div>`;
      }
    });
    return;
  }

  screenContent.innerHTML = state.butchers.slice(0, 8).map((b) => `
    <div class="card">
      <strong>${b.name}</strong>
      <p class="small">${b.address || ""}</p>
      <p class="small">⭐ ${b.rating || "-"} (${b.userRatingsTotal || 0})</p>
      <a class="btn btn-primary" href="${b.mapsUrl}" target="_blank" rel="noopener">פתח ב-Google Maps</a>
    </div>
  `).join("");
}

async function handleNext() {
  const step = steps[currentStep];

  if (step === "home" && !state.homeChoice) return;
  if (step === "hot" && state.homeChoice === "hot" && state.selectedHot === null) return;
  if (step === "cook" && state.selectedMealIdea === null) return;

  if (currentStep < steps.length - 1) {
    currentStep += 1;
    render();
  } else {
    setStep(0);
  }
}

render();
