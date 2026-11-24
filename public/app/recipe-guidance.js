(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./recipe-quality.js"));
  else root.RecipeGuidance = factory(root.RecipeQuality);
})(typeof window !== "undefined" ? window : this, function (Quality) {
  "use strict";
  // Editorial paraphrases, checked against these pages on 2026-11-24.
  // The model never supplies a citation, URL, tip text, or an endorsement.
  const SOURCES = Object.freeze({
    hygiene: { name: "FoodSafety.gov", title: "4 Steps to Food Safety", url: "https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety" },
    temperature: { name: "FoodSafety.gov", title: "Safe Minimum Internal Temperatures", url: Quality.SOURCE_URL },
    marinade: { name: "FDA", title: "Handling Food Safely While Eating Outdoors", url: "https://www.fda.gov/food/buy-store-serve-safe-food/handling-food-safely-while-eating-outdoors" },
    grill: { name: "Weber", title: "Grill Owner’s Guide — Tips & Hints, p. 11", url: "https://digital-assets.weber.com/documents/48990_121219.pdf?fm=pdf#page=11" },
    slicing: { name: "Institute of Culinary Education", title: "How to Find the Grain and Slice Steak Like a Chef", url: "https://www.ice.edu/blog/how-find-grain-and-slice-steak-chef" },
    brisket: { name: "Weber", title: "Beginner Brisket — tenderness guidance", url: "https://www.weber.com/IE/en/recipes/beef/beginner-brisket/weber-175674.html" },
    ribs: { name: "ThermoWorks", title: "Whole Braised Short Ribs: Temperatures for Tenderness", url: "https://www.thermoworks.com/blogs/thermoblog/whole-braised-short-ribs" },
    braising: { name: "RICARDO — Christina Blais", title: "How to Perfect the Art of Braising", url: "https://www.ricardocuisine.com/en/articles/food-chemistry/643-how-to-perfect-the-art-of-braising" },
    oven: { name: "King Arthur Baking", title: "Recipe Success Guide — preheating", url: "https://www.kingarthurbaking.com/recipes/resources/recipe-success-guide" },
    bbq: { name: "Good Food", title: "Barbecue sauce — simmering technique", url: "https://www.bbcgoodfood.com/recipes/barbecue-sauce" },
    vinaigrette: { name: "Good Food", title: "Classic vinaigrette — mixing technique", url: "https://www.bbcgoodfood.com/recipes/classic-vinaigrette" }
  });
  const TIPS = Object.freeze({
    clean: { source: "hygiene", he: "אחרי מגע בבשר נא, שטפו ידיים וכלים לפני המשך העבודה עם אוכל מוכן.", en: "After handling raw meat, wash hands and utensils before handling ready-to-eat food." },
    produce: { source: "hygiene", he: "שטפו ירקות במים זורמים לפני החיתוך, והשתמשו בקרש נפרד מזה של הבשר הנא.", en: "Rinse produce under running water before cutting; use a separate board from raw meat." },
    thermometer: { source: "hygiene", he: "מדדו בחלק העבה ביותר, בלי לגעת בעצם או בשומן. זמן וצבע לבדם אינם בדיקת מוכנות בטוחה.", en: "Measure in the thickest part, away from bone and fat. Time and colour alone cannot establish safe doneness." },
    chill: { source: "hygiene", he: "שאריות יש להעביר לכלים רדודים ולמקרר בתוך שעתיים, או שעה כשחם מ־32°C.", en: "Refrigerate leftovers in shallow containers within two hours, or one hour above 32°C." },
    keepCold: { source: "hygiene", he: "עד ההגשה, שמרו מזון מתכלה במקרר שמכוון ל־4°C או פחות.", en: "Until serving, keep perishable food in a refrigerator set to 4°C or below." },
    marinate: { source: "marinade", he: "משרים במקרר. אם רוצים להשתמש במרינדה גם כרוטב, שומרים מנה נקייה בנפרד לפני הכנסת הבשר הנא.", en: "Marinate in the refrigerator. Reserve a clean portion for sauce before adding raw meat." },
    serve: { source: "marinade", he: "להגשה השתמשו בצלחת ובמלקחיים נקיים, שלא נגעו בבשר הנא מאז שנשטפו.", en: "Serve with a clean plate and tongs that have not touched raw meat since washing." },
    space: { source: "grill", he: "בגריל, צפיפות על הרשת מאריכה את הצלייה. השאירו מרווחים ועבדו בכמה סבבים לפי הצורך.", en: "On a grill, crowding the grate increases cooking time. Leave space and cook in batches if needed." },
    rest: { source: "temperature", he: "בנתחים שלמים של בקר, טלה ועגל נדרשות לפחות 3 דקות מנוחה אחרי ההגעה לטמפרטורת הליבה הדרושה; גם כשהמדחום מראה שהבשר מוכן, אין לדלג על המנוחה.", en: "Whole beef, lamb and veal cuts need at least three minutes rest after reaching the required internal temperature; do not skip resting just because the thermometer says the meat is ready." },
    slice: { source: "slicing", he: "לאחר המנוחה, זהו את כיוון הסיבים ופרסו בניצב להם. קיצור הסיבים מקל על הלעיסה.", en: "After resting, identify the grain and slice across it. Shorter muscle fibres make the meat easier to chew." },
    brisket: { source: "brisket", he: "בבריסקט בבישול ארוך, בודקים גם רכות: הגעה לטמפרטורה לבדה אינה מבטיחה שהנתח התרכך.", en: "For slow-cooked brisket, also test tenderness: reaching a temperature alone does not guarantee a tender cut." },
    ribs: { source: "ribs", he: "בצלעות בבישול ארוך, בדקו בכמה נקודות שהמדחום נכנס בקלות; סביב 95°C הוא נקודת בדיקה לרכות, לא הבטחה.", en: "For slow-braised short ribs, check that a probe enters easily in several places. Around 95°C is a tenderness checkpoint, not a guarantee." },
    brown: { source: "braising", he: "בהשחמה לפני בישול ארוך, עבדו בסבבים עם מרווח בין הקוביות. צפיפות גורמת לבשר להתבשל בנוזלים במקום להשחים.", en: "When browning before braising, work in batches with space between cubes. Crowding makes the meat simmer in liquid instead of brown." },
    simmer: { source: "braising", he: "בבישול מכוסה בנוזלים, שמרו על בעבוע עדין ומכסה שסוגר היטב. רתיחה חזקה עלולה לייבש את הבשר.", en: "For covered braising, maintain a gentle simmer and a close-fitting lid. Vigorous boiling can dry the meat." },
    braiseRest: { source: "braising", he: "בשר שעבר בישול ארוך נוטה להתייבש כשהוא חשוף לאוויר; השאירו אותו בנוזלי הבישול בזמן המנוחה.", en: "Braised meat tends to dry when exposed to air; leave it in its cooking liquid while resting." },
    preheat: { source: "oven", he: "אפשר לבדוק במדחום תנור נפרד שהחום בפועל הגיע לטמפרטורה שבמתכון; התצוגה המובנית לא תמיד מדויקת בזמן החימום המקדים.", en: "An independent oven thermometer can confirm the recipe temperature has been reached; the built-in display may be unreliable during preheating." },
    rub: { source: "brisket", he: "ערבבו את התבלינים היבשים לפני מריחתם, ופזרו את התערובת באופן אחיד על שני צדי הבשר.", en: "Mix dry seasonings before applying them, then distribute the mixture evenly over both sides of the meat." },
    bbqReduce: { source: "bbq", he: "ברוטב ברביקיו מבושל, מסמיכים בבעבוע עדין אחרי הרתיחה. המרקם הוא סימן חשוב לצד משך הבישול המשוער.", en: "For cooked barbecue sauce, reduce to a gentle simmer after boiling and cook until thickened. Watch consistency as well as the estimated time." },
    dressing: { source: "vinaigrette", he: "ברוטב על בסיס שמן וחומץ, אפשר לנער את המרכיבים בצנצנת סגורה עד שהם מתערבבים היטב.", en: "For an oil-and-vinegar dressing, shake the ingredients in a closed jar until well combined." }
  });
  const WARNINGS = {
    thickness: ["עובי הנתח חסר", "בלי עובי אי אפשר להתאים היטב את משך הבישול. התחילו למדוד מוקדם והסתמכו על טמפרטורת הליבה וסימני המוכנות.", "Piece thickness is missing", "Without thickness, timing is less reliable. Start checking early and use the internal target and readiness cues."],
    equipment: ["רשימת הציוד חסרה", "המחולל לא השלים את רשימת הציוד. עברו על כל השלבים מראש וודאו שיש כלי בישול מתאים ומדחום מזון.", "Equipment list is missing", "The equipment list was not completed. Read all steps first and have the specified cookware and a food thermometer ready."],
    readiness: ["תיאור המרקם חסר", "לא הושלם הסבר על המרקם הרצוי. טמפרטורת הליבה היא הנחיית בישול, אך אינה מבטיחה מרקם מוצלח.", "Texture cue is missing", "The desired texture was not described. The internal target is cooking guidance, not a guarantee of texture."],
    timing: ["פירוט הזמנים אינו מלא או אינו עקבי", "יש חוסר או סתירה בין זמני השלבים לסיכום. לכן הסיכום אינו מוצג כזמן כולל; בדקו מוכנות במדחום ובסימנים שבמתכון.", "Timing is incomplete or inconsistent", "Step timings and the summary are missing or disagree. The total is withheld; use the thermometer and the recipe’s readiness cues."],
    sauces: ["לא התקבל מתכון לרוטב", "המנה העיקרית מוצגת, אך המחולל לא השלים רוטב. אין צורך ברוטב כדי להכין את המנה.", "No sauce recipe was returned", "The main dish is shown, but the sauce was not completed. A sauce is not required to make the main dish."],
    sides: ["לא התקבל מתכון לתוספת", "המנה העיקרית מוצגת, אך המחולל לא השלים תוספת. היא אינה כלולה בכמויות ובשלבים שמופיעים כאן.", "No side recipe was returned", "The main dish is shown, but a side was not completed. No side is included in these quantities or steps."]
  };
  const REASONS = {
    service_unavailable: ["שירות היצירה לא החזיר מתכון כרגע. כדי שאפשר יהיה להמשיך, מוצג מתכון בסיסי מהתבניות שלנו.", "The generator did not return a recipe. A basic recipe from our templates is shown so you can continue."],
    incomplete: ["גם אחרי ניסיון תיקון נשארו חוסרים מהותיים או סתירות במתכון. במקומו מוצג מתכון בסיסי שלם.", "Essential omissions or contradictions remained after a repair attempt. A complete basic recipe is shown instead."],
    safety: ["המתכון שנוצר לא עמד בבדיקות הטמפרטורה או ההכנה שהוגדרו. ההוראות הבעייתיות הוחלפו במתכון בסיסי אחר.", "The generated recipe did not meet the configured temperature or preparation checks. Those instructions were replaced with a different basic recipe."],
    network: ["לא התקבלה תשובה מהשרת. מוצג מתכון בסיסי ששמור באתר, ואפשר לנסות שוב כדי לקבל מתכון מותאם.", "The server did not respond. A basic recipe included with the site is shown; retry for a customised recipe."]
  };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function generation(value) {
    if (!value || value.kind !== "baseline" || !Object.hasOwn(REASONS, value.reason)) return { kind: "ai" };
    return { kind: "baseline", reason: value.reason,
      profile: ["braise", "steak", "poultry", "ground"].includes(value.profile) ? value.profile : "steak",
      method: ["oven", "pan", "grill"].includes(value.method) ? value.method : "pan" };
  }
  function tipFor(step, { phase, recipe, context = {}, section = "main", part } = {}, language = "en") {
    const s = String(step || ""), safety = Quality.safetyReference(recipe, context), cooking = Quality.cookingReference(context);
    const partText = `${part?.title || part?.name || ""} ${(part?.ingredients || []).join(" ")}`;
    let id = "clean", general = true;
    if (/שארי|leftovers/i.test(s)) { id = "chill"; general = false; }
    else if (/השר|משר|מרינדה|marinat/i.test(s)) { id = "marinate"; general = false; }
    else if (/מקרר|refrigerat/i.test(s) && /אחס|שמר|שומרים|store|keep/i.test(s)) { id = "keepCold"; general = false; }
    else if (/מחממים.*תנור|preheat.*oven/i.test(s)) { id = "preheat"; general = false; }
    else if (section === "main" && /תבלינים|תערובת תיבול|תערובת התיבול|dry rub|seasoning mixture/i.test(s) && /מערבבים|מעסים|מורחים|mix|rub|coat/i.test(s)) { id = "rub"; general = false; }
    else if (section === "main" && phase === "rest" && /נוזלי הבישול|cooking liquid/i.test(s)) { id = "braiseRest"; general = false; }
    else if (section === "main" && /מנוחה|לנוח|מניחים.*לנוח|\brest\b/i.test(s) && safety.restMinutes) { id = "rest"; general = false; }
    else if (section === "main" && /פורסים|פרסו|פריסה|\bslic(?:e|ing)\b/i.test(s) && safety.minimumC === 63) { id = "slice"; general = false; }
    else if (/מדחום|ליבה|thermometer|internal|probe/i.test(s)) { id = "thermometer"; general = false; }
    else if (section === "main" && phase === "cook" && /משחימ|השחמ|brown/i.test(s) && /קוביות|סבבים|cubes|batches/i.test(s)) { id = "brown"; general = false; }
    else if (section === "main" && phase === "cook" && /בעבוע|רתיחה|simmer|boil/i.test(s) && /מכס|מכוס|cover/i.test(s)) { id = "simmer"; general = false; }
    else if (section === "main" && cooking && phase === "cook" && /תנור|מבשלים|רכות|oven|tender|cook/i.test(s)) { id = cooking.name.startsWith("Weber") ? "brisket" : "ribs"; general = false; }
    else if (/ירקות|מלפפו|עגבני|תפוחי (?:ה)?אדמה|בצל|גזר|vegetable|cucumber|tomato|potato|onion|carrot/i.test(s) && /חותכ|שטפ|שוטפ|קוצצ|cut|chop|rinse|wash/i.test(s)) { id = "produce"; general = false; }
    else if (section !== "main" && /ברביקיו|barbecue|bbq/i.test(partText) && /מבשלים|מרתיח|מסמיך|סמיך|cook|boil|simmer|thick/i.test(s)) { id = "bbqReduce"; general = false; }
    else if (section !== "main" && /חומץ|vinegar/i.test(partText) && /שמן|oil/i.test(partText) && !/קטשופ|barbecue|bbq|ketchup/i.test(partText) && /מערבבים|טורפים|mix|whisk|shake/i.test(s)) { id = "dressing"; general = false; }
    else if (/הגש|מגיש|serve|serving/i.test(s)) { id = "serve"; general = false; }
    else if (section === "main" && phase === "cook" && /grill|bbq|גריל|ברביקיו/i.test(`${context.methodId || ""} ${context.method || ""}`)) { id = "space"; general = false; }
    else if (section === "main" && phase === "cook") { id = "thermometer"; general = false; }
    const tip = TIPS[id], source = SOURCES[tip.source];
    return { id, text: tip[language === "he" ? "he" : "en"], source, general };
  }
  function stepHTML(step, options, language = "en") {
    const tip = tipFor(step, options, language), he = language === "he";
    return `<aside class="recipe-step-tip"><strong>${he ? (tip.general ? "תזכורת להכנה" : "טיפ לשלב") : (tip.general ? "Preparation reminder" : "Step tip")}</strong><p>${escape(tip.text)}</p><a href="${escape(tip.source.url)}" target="_blank" rel="noopener noreferrer">${he ? "מקור: " : "Source: "}${escape(tip.source.name)}<span class="sr-only"> — ${escape(tip.source.title)}</span></a></aside>`;
  }
  function effectiveContext(recipe, context = {}) {
    const g = generation(recipe?.generation);
    // A substituted method must be assessed and labelled as the actual recipe.
    if (g.kind !== "baseline") return context;
    const title = recipe?.main?.title || "";
    const cutId = /brisket|בריסקט/i.test(title) ? "brisket" : /short ribs|אסאדו|שפונדרה/i.test(title) ? "short_ribs" : g.profile === "braise" ? "chuck" : "";
    return { ...context, userQuestion: "", cutId, cut: title, methodId: g.method, method: g.method };
  }
  function notes(recipe, context = {}, language = "en") {
    const he = language === "he", report = Quality.review(recipe, effectiveContext(recipe, context)), g = generation(recipe?.generation);
    const result = report.warnings.map(code => ({ code, title: WARNINGS[code][he ? 0 : 2], text: WARNINGS[code][he ? 1 : 3] }));
    if (g.kind === "baseline") {
      result.unshift({ code: "replacement", title: he ? "למה מוצג מתכון חלופי?" : "Why a replacement recipe?", text: REASONS[g.reason][he ? 0 : 1] });
      result.push({ code: "preferences", title: he ? "מה השתנה?" : "What changed?", text: he ? "זו גרסה בסיסית בתיבול מלח ופלפל. השיטה והחיתוך המחייבים הם אלה שמופיעים במתכון; סגנון הטעמים והבקשה האישית לא יושמו. בדקו התאמה למגבלות תזונה לפני ההכנה." : "This is a basic salt-and-pepper recipe. Follow its stated method and cut preparation; the requested flavour and custom instructions were not applied. Check dietary suitability before cooking." });
    }
    for (const section of ["sauces", "sides"]) {
      const replacement = generation(recipe?.sectionGenerations?.[section]);
      if (replacement.kind !== "baseline") continue;
      result.push({ code: `replacement_${section}`, title: he ? (section === "sauces" ? "הרוטב הוחלף בגרסה בסיסית" : "התוספת הוחלפה בגרסה בסיסית") : (section === "sauces" ? "The sauce was replaced with a basic version" : "The side was replaced with a basic version"), text: he ? "הניסיון ליצור מחדש את החלק הזה לא החזיר מתכון מתאים. מוצגת חלופה מתבנית קבועה, שאינה מיישמת את בקשת הטעמים או הבקשה האישית. המנה העיקרית נשארה כפי שהייתה." : "Regenerating this section did not return a suitable recipe. A fixed-template alternative is shown; requested flavours and custom instructions are not applied to it. The main dish was kept unchanged." });
    }
    return result;
  }
  function reviewHTML(recipe, context = {}, language = "en") {
    const he = language === "he", g = generation(recipe?.generation);
    if (recipe?.recipeVersion !== Quality.VERSION) return `<section class="recipe-quality"><p>${he ? "למתכון השמור הזה אין בדיקת שלמות עדכנית. יצירה מחדש תפעיל את הבדיקות החדשות." : "This saved recipe has no current completeness check. Regenerate to apply the new checks."}</p></section>`;
    const report = Quality.review(recipe, effectiveContext(recipe, context)), m = recipe.main?.metadata || {};
    const details = notes(recipe, context, language);
    return `<section class="recipe-quality" aria-label="${he ? "הערות לפני ההכנה" : "Before you cook"}">
      <strong class="recipe-caveat-label">${he ? (g.kind === "baseline" ? "מתכון בסיסי חלופי" : "מתכון עם הערות הכנה") : (g.kind === "baseline" ? "Basic alternative recipe" : "Recipe with preparation notes")}</strong>
      <p>${he ? (g.kind === "baseline" ? "מתכון מתבנית קבועה. המתכון טרם נוסה במטבח." : "נוצר בעזרת AI. המתכון טרם נוסה במטבח.") : (g.kind === "baseline" ? "A fixed-template recipe. Not kitchen-tested." : "AI-generated. Not kitchen-tested.")}</p>
      <p>${he ? "הזמנים משוערים: עובי הנתח והציוד שלכם עשויים לשנות את משך הבישול. הסתמכו גם על מדחום ועל סימני המוכנות." : "Times are estimates: your cut’s thickness and equipment can change cooking time. Use a thermometer and readiness cues too."}</p>
      ${details.length ? `<ul class="recipe-caveats">${details.map(n => `<li><strong>${escape(n.title)}</strong><p>${escape(n.text)}</p></li>`).join("")}</ul>` : ""}
      <details><summary>${he ? "למה יש הסתייגויות ומה נבדק?" : "Why the caveats, and what was checked?"}</summary>
        <p>${he ? "המשקל, עובי הנתח והציוד בפועל עשויים להיות שונים מההנחות במתכון. לכן הזמנים הם הערכה למנה העיקרית בלבד, וצריך לבדוק טמפרטורה ומוכנות בזמן הבישול." : "Actual weight, thickness and equipment may differ from this recipe’s assumptions. Times estimate the main dish only; check temperature and readiness during cooking."}</p>
        <p>${he ? (report.passed ? "הבדיקה האוטומטית לא זיהתה חוסרים בכמויות, במספר המנות, בסכום הזמנים וברשימות המרכיבים והשלבים. " : "הבדיקה האוטומטית מצאה את החוסרים שמפורטים למעלה. ") : (report.passed ? "Automated checks found no omissions in quantities, servings, time totals or ingredient and step lists. " : "Automated checks found the omissions listed above. ")}${he ? "זו אינה בדיקת טעם, בדיקת כל הקשרים בין המרכיבים לשלבים או אישור מקצועי." : "This is not a taste test, a check of every ingredient-to-step relationship, or professional approval."}</p>
        <p>${he ? "הטיפים ליד השלבים נבחרים מאוסף מקורות שנבדקו. הקישור תומך בטיפ בלבד, לא במתכון כולו; אין כאן טענה שהמתכון נוסה או אושר בידי המקור." : "Step tips are selected from a checked source collection. Each link supports that tip only, not the whole recipe; no source is claimed to have tested or approved this recipe."}</p>
      </details>
      <p><strong>${he ? "הנחות המתכון:" : "Recipe assumptions:"}</strong> ${Number.isFinite(m.meat_weight_g) ? `${m.meat_weight_g} ${he ? "גרם בסך הכול" : "g total"}` : "—"} · ${Number.isFinite(m.piece_thickness_cm) ? `${m.piece_thickness_cm} ${he ? "ס״מ עובי" : "cm thick"}` : (he ? "עובי לא צוין" : "thickness unspecified")}</p>
      <p><strong>${he ? "ציוד:" : "Equipment:"}</strong> ${(recipe.main?.equipment || []).map(escape).join(" · ") || "—"}</p>
      <p><strong>${he ? "טמפרטורת ליבה במתכון:" : "Internal target:"}</strong> ${escape(m.target_internal_c)}°C. ${escape(m.doneness_cue)}</p>
      <a href="${Quality.SOURCE_URL}" target="_blank" rel="noopener noreferrer">${he ? "טבלת טמפרטורות לבישול — FoodSafety.gov" : "Cooking temperature chart — FoodSafety.gov"}</a>
    </section>`;
  }
  return { SOURCES, TIPS, generation, effectiveContext, notes, tipFor, stepHTML, reviewHTML };
});
