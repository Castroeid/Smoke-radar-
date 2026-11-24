(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./recipe-quality.js"), require("./recipe-protocols.js"));
  else root.RecipeFallback = factory(root.RecipeQuality, root.RecipeProtocols);
})(typeof window !== "undefined" ? window : this, function (Quality, Protocols) {
  "use strict";
  // Coherent alternatives, never filler spliced into an incomplete AI recipe.
  // Original templates, not represented as published or kitchen-tested recipes.
  function create(context = {}, reason = "incomplete") {
    const he = context.language === "he", n = Math.max(1, Math.min(20, Math.floor(Number(context.servings) || 4)));
    const t = (hebrew, english) => he ? hebrew : english;
    const input = `${context.meatType || ""} ${context.cut || ""} ${context.cutId || ""}`;
    const safety = Quality.safetyReference(null, { meatType: input });
    const tough = /brisket|asado|short.?ribs|chuck|אונטריב|אונטרייב|בריסקט|אסאדו|שפונדרה|כתף|צוואר/i.test(input);
    const profile = safety.minimumC === 74 ? "poultry" : safety.minimumC === 71 ? "ground" : tough || /lamb|veal|טלה|עגל/i.test(input) ? "braise" : "steak";
    const method = profile === "braise" ? "oven" : /^(grill|bbq)$/.test(context.methodId || "") || /^(grill|bbq|גריל|ברביקיו)$/i.test(context.method || "") ? "grill" : "pan";
    const weight = n * (profile === "braise" ? 300 : 250), target = profile === "braise" ? 95 : safety.minimumC;
    const names = { rump: ["שייטל", "shaitel / rump"], chuck_roll: ["אונטריב", "untrib / chuck roll"], ribeye: ["אנטריקוט", "ribeye"], picanha: ["פיקניה", "picanha"], sirloin: ["סינטה", "sirloin"], striploin: ["סינטה", "striploin"], filet: ["פילה", "fillet"], tenderloin: ["פילה", "tenderloin"], flank: ["פלנק", "flank"], brisket: ["בריסקט", "brisket"], asado: ["אסאדו ללא עצם", "boneless short ribs"], short_ribs: ["שפונדרה ללא עצם", "boneless short ribs"], chuck: ["כתף בקר", "beef chuck"] };
    const named = names[context.cutId];
    const meat = profile === "poultry" ? t("חזה עוף ללא עצם", "boneless chicken breast") : profile === "ground" ? t("בשר בקר טחון", "ground beef") : /lamb|טלה/i.test(input) ? t("כתף טלה ללא עצם", "boneless lamb shoulder") : /veal|עגל/i.test(input) ? t("כתף עגל ללא עצם", "boneless veal shoulder") : named ? named[he ? 0 : 1] : profile === "braise" ? t("כתף בקר", "beef chuck") : t("אנטריקוט", "ribeye");
    const g = t("גרם", "g"), ml = t("מ״ל", "ml"), cookMinutes = Math.ceil(n / 4) * (profile === "poultry" ? 20 : 12);
    const ingredients = [`${weight} ${g} ${meat}`, `${n * 2} ${g} ${t("מלח", "salt")}`, `${n * .25} ${g} ${t("פלפל שחור", "black pepper")}`, `${n * 5} ${ml} ${t("שמן זית", "olive oil")}`];
    const steps = [], timing = [];
    const step = (a, b, phase, minutes) => { steps.push(t(a, b)); timing.push({ phase, minutes }); };
    let equipment;
    if (profile === "braise") {
      ingredients.push(`${n * 50} ${g} ${t("בצל", "onion")}`, `${n * 200} ${ml} ${t("מים", "water")}`);
      equipment = t("תנור|סיר שמתאים לתנור עם מכסה|כיריים|מדחום מזון|קרש וסכין", "Oven|Ovenproof pot with lid|Hob|Food thermometer|Board and knife").split("|");
      step("מחממים תנור ל־165°C. חותכים את הבשר לקוביות של כ־4 ס״מ ואת הבצל לפרוסות. מתבלים את הבשר בכל המלח והפלפל.", "Preheat the oven to 165°C. Cut the meat into roughly 4 cm cubes and slice the onion. Season the meat with all the salt and pepper.", "prep", 20);
      step("מחממים בסיר על הכיריים את שמן הזית בחום בינוני־גבוה. משחימים את הבשר בסבבים בלי לצופף ומוציאים לצלחת זמנית; זה עדיין בשר לא מבושל לגמרי.", "Heat the olive oil in the pot on a medium-high hob. Brown the meat in uncrowded batches and transfer to a temporary plate; it is still partly raw.", "cook", Math.ceil(n / 4) * 12);
      step("מרככים את הבצל באותו סיר, מוסיפים את המים ומחזירים את הבשר עם הנוזלים מהצלחת. מביאים לרתיחה עדינה ומכסים. בחרו סיר שבו הנוזל מגיע בערך עד חצי גובה הבשר; לכמות גדולה השתמשו בכמה סירים וחלקו את כל המרכיבים ביניהם.", "Soften the onion in the same pot. Add the water and return the meat and juices from the temporary plate. Bring to a gentle simmer and cover. Use a pot where the liquid reaches roughly halfway up the meat; for a large quantity divide all ingredients among multiple pots.", "cook", 10);
      step("מעבירים את הסיר המכוסה לתנור ב־165°C. בודקים מדי פעם שהנוזלים לא התייבשו ושיש בעבוע עדין; אם הרתיחה חזקה, מפחיתים מעט את חום התנור. זמן הבישול תלוי בנתח וברכותו.", "Transfer the covered pot to the 165°C oven. Check occasionally that the liquid has not dried out and is gently simmering; reduce oven heat slightly if boiling vigorously. Cooking time depends on the cut and its tenderness.", "cook", 210);
      step("בודקים במדחום בכמה קוביות גדולות: טמפרטורת ליבה סביב 95°C ושיפוד שנכנס בקלות. אם הבשר עדיין קשה, ממשיכים בבישול מכוסה ובודקים שוב; אין להוציא רק כי הזמן המשוער הסתיים.", "Check several large cubes with a thermometer: an internal temperature around 95°C and a probe entering easily. If still firm, continue cooking covered and check again; the estimated time alone is not the endpoint.", "cook", 0);
      step("מוציאים מהתנור ומניחים לבשר לנוח בנוזלי הבישול לפני ההגשה.", "Remove from the oven and let the meat rest in its cooking liquid before serving.", "rest", 10);
    } else {
      const grill = method === "grill";
      equipment = [grill ? t("גריל", "Grill") : t("מחבת רחבה וכיריים", "Large frying pan and hob"), t("מלקחיים", "Tongs"), t("מדחום מזון", "Food thermometer"), t("קרש וסכין", "Board and knife")];
      const prep = profile === "poultry" ? t("חותכים את חזה העוף לרצועות בעובי כ־2 ס״מ.", "Cut the chicken breast into strips about 2 cm thick.") : profile === "ground" ? t("יוצרים מהבשר קציצות שטוחות בעובי כ־2 ס״מ.", "Shape the ground beef into flat patties about 2 cm thick.") : t("פורסים את הנתח לסטייקים בעובי כ־2.5 ס״מ. בפלנק משתמשים בעובי הטבעי ומתחילים לבדוק מוקדם יותר.", "Cut the meat into steaks about 2.5 cm thick. Keep flank at its natural thickness and start checking earlier.");
      step(`${prep} מורחים את שמן הזית על הבשר ומתבלים בכל המלח והפלפל. מכינים צלחת הגשה נקייה נפרדת.`, `${prep} Coat the meat with the olive oil and season with all the salt and pepper. Set aside a separate clean serving plate.`, "prep", 10);
      step(grill ? "מחממים את הגריל לפי הוראות היצרן, ומכינים גם אזור חלש יותר להמשך הבישול." : "מחממים מחבת רחבה על חום בינוני־גבוה; אין צורך להוסיף שמן מעבר לשמן שעל הבשר.", grill ? "Preheat the grill according to its manual, with a cooler area available to finish cooking." : "Preheat a large frying pan over medium-high heat; no extra oil is needed beyond the coating on the meat.", "prep", grill ? 15 : 5);
      step(`מניחים את הבשר ב${grill ? "גריל" : "מחבת"} בשכבה אחת עם מרווחים. הופכים במהלך הבישול להשחמה בשני הצדדים. אם החוץ משחים לפני שהמרכז מוכן, מפחיתים חום${grill ? " או מעבירים לאזור החלש" : ""}. עובדים בסבבים בכמות גדולה; הזמן הוא הערכה לכל הסבבים.`, `Place the meat on the ${grill ? "grill" : "pan"} in an uncrowded single layer. Turn during cooking to brown both sides. Reduce heat${grill ? " or move to the cooler area" : ""} if the outside browns before the centre is ready. Cook large quantities in batches; the time estimates all batches.`, "cook", cookMinutes);
      step(`מודדים בחלק העבה של כל יחידה ומוציאים מהחום רק לאחר שטמפרטורת הליבה הגיעה לפחות ל־${target}°C. אם טרם הגיעה, ממשיכים לבשל ולמדוד; אין להסתמך על צבע או על הזמן בלבד.`, `Measure the thickest part of each piece and remove from the heat only once its internal temperature reaches at least ${target}°C. Otherwise continue cooking and measuring; do not rely on colour or elapsed time alone.`, "cook", 0);
      step("מניחים לבשר לנוח על צלחת ההגשה הנקייה לפני ההגשה.", "Let the meat rest on the clean serving plate before serving.", "rest", 5);
      if (profile === "steak") step("פורסים את הסטייקים בניצב לכיוון הסיבים ומגישים.", "Slice the steaks across the grain and serve.", "rest", 0);
    }
    const recipe = {
      dietaryPreference: context.dietaryPreference === "non_kosher" ? "non_kosher" : "kosher",
      main: { title: `${meat} — ${profile === "braise" ? t("בישול מכוסה בתנור", "covered oven braise") : method === "grill" ? t("בגריל", "on the grill") : t("במחבת", "in a pan")}`,
        description: t("גרסה בסיסית בתיבול מלח ופלפל. פעלו לפי החיתוך והציוד שמפורטים כאן, גם אם הם שונים מהבקשה המקורית.", "A basic salt-and-pepper recipe. Follow the cut preparation and equipment below, even if different from the original request."),
        ingredients, steps, step_timing: timing, equipment, chefTips: [],
        metadata: { servings: n, meat_weight_g: weight, piece_thickness_cm: profile === "braise" ? 4 : profile === "steak" ? 2.5 : 2, target_internal_c: target,
          doneness_cue: profile === "braise" ? t("מדחום ושיפוד שנכנס בקלות למספר קוביות.", "Use a thermometer and check that a probe enters several cubes easily.") : t("מודדים במדחום בחלק העבה של כל יחידה.", "Measure the thickest part of each piece with a thermometer."), difficulty: t("בסיסי", "Basic") } },
      sauces: [{ name: t("רוטב לימון ושמן זית", "Lemon and olive oil dressing"), description: t("מערבבים בנפרד מהבשר הנא.", "Mix separately from raw meat."), ingredients: [`${n * 10} ${ml} ${t("שמן זית", "olive oil")}`, `${n * 5} ${ml} ${t("מיץ לימון", "lemon juice")}`], steps: [t("טורפים בקערה נקייה את שמן הזית ומיץ הלימון עד איחוד, כדקה.", "Whisk the olive oil and lemon juice in a clean bowl until combined, about one minute."), t("שומרים מכוסה במקרר עד ההגשה, מערבבים ומגישים בכלי נקי לצד הבשר.", "Keep covered in the refrigerator until serving, stir and serve in a clean dish alongside the meat.")] }],
      sides: [{ name: t("סלט מלפפון ועגבנייה", "Cucumber and tomato salad"), description: t("מכינים בקרש נפרד מהבשר.", "Use a separate board from the meat."), ingredients: [`${n * 100} ${g} ${t("מלפפון", "cucumber")}`, `${n * 100} ${g} ${t("עגבנייה", "tomato")}`, `${n * 5} ${ml} ${t("שמן זית", "olive oil")}`, `${n * 5} ${ml} ${t("מיץ לימון", "lemon juice")}`], steps: [t("שוטפים את המלפפון והעגבנייה וחותכים לקוביות על קרש נקי, כ־5 דקות.", "Rinse the cucumber and tomato and dice on a clean board, about five minutes."), t("מערבבים עם כל שמן הזית ומיץ הלימון. שומרים במקרר עד ההגשה.", "Mix with all the olive oil and lemon juice. Refrigerate until serving.")] }],
      drinkPairings: [{ name: t("מים", "Water"), description: "" }]
    };
    const controlled = Protocols.createMain(context);
    if (controlled) {
      recipe.main = controlled;
      return { ...Quality.normalize(Quality.prepareDraft(recipe), he ? "he" : "en"), generation: { kind: "guided", mode: context.methodId === "sous_vide" ? "sous_vide" : "basic" } };
    }
    return { ...Quality.normalize(Quality.prepareDraft(recipe), he ? "he" : "en"), generation: { kind: "baseline", reason, profile, method } };
  }
  return { create };
});
