(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RecipeProtocols = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  // Authored cooking paths, not model-generated safety schedules. These references
  // support the technique, not a claim that the complete recipe was kitchen-tested.
  const SOURCES = Object.freeze({
    basic: "https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food",
    sousVide: "https://douglasbaldwin.com/sous-vide.html"
  });
  const THICKNESSES = Object.freeze([2, 2.5, 3, 4, 5]);
  // Baldwin Table 5.1, 65 C, thawed meat initially at 5 C, slab geometry.
  // Rounded upwards with an additional margin; this is total bath time, not
  // a hold time to start before the centre has heated. Never scale by servings.
  const BATH_MINUTES = Object.freeze({ 2: 75, 2.5: 90, 3: 105, 4: 120, 5: 150 });
  const names = { ribeye: ["אנטריקוט", "ribeye"], brisket: ["בריסקט", "brisket"], asado: ["אסאדו", "short ribs"], picanha: ["פיקניה", "picanha"], sirloin: ["סינטה", "sirloin"], filet: ["פילה", "fillet"], short_ribs: ["שפונדרה", "short ribs"], chuck: ["כתף / צוואר", "chuck"], flank: ["פלנק", "flank"], striploin: ["סינטה", "striploin"], tenderloin: ["פילה", "tenderloin"] };
  const tough = cut => ["brisket", "asado", "short_ribs", "chuck"].includes(cut);
  const requested = c => c.equipmentMode === "basic" || c.methodId === "sous_vide";
  function createMain(context = {}) {
    if (!requested(context)) return null;
    const he = context.language === "he", t = (a, b) => he ? a : b;
    const sv = context.methodId === "sous_vide", slow = tough(context.cutId);
    if (!Object.hasOwn(names, context.cutId) || !["beef", "lamb", "veal"].includes(context.meatType || "beef")) throw new Error("unsupported_cooking_selection");
    if (sv && context.equipmentMode === "basic") throw new Error("sous_vide_requires_equipment");
    const thickness = sv ? Number(context.thicknessCm || 2.5) : slow ? 3 : 0.5;
    if (sv && !THICKNESSES.includes(thickness)) throw new Error("invalid_thickness");
    const n = Math.max(1, Math.min(20, Math.floor(Number(context.servings) || 4)));
    const weight = n * (slow ? 300 : 250), batches = Math.ceil(weight / 300);
    const meatType = { beef: ["בקר", "beef"], lamb: ["טלה", "lamb"], veal: ["עגל", "veal"] }[context.meatType || "beef"];
    const meat = `${names[context.cutId][he ? 0 : 1]} (${meatType[he ? 0 : 1]})`;
    const g = t("גרם", "g"), ml = t("מ״ל", "ml"), tsp = t("כפית", "tsp");
    const ingredients = [`${weight} ${g} ${meat} ${t("ללא עצם", "boneless")}`, `${n * .25} ${tsp} ${t("מלח שולחן", "table salt")}`, `${n * .125} ${tsp} ${t("פלפל שחור", "black pepper")}`, `${n * 5} ${ml} ${t("שמן זית", "olive oil")}`];
    const flavor = context.flavorId || "classic";
    const seasonings = {
      smoky: ["פפריקה מעושנת", "smoked paprika"], spicy: ["פפריקה חריפה", "hot paprika"],
      garlic_herbs: ["אבקת שום ואורגנו יבש בחלקים שווים", "equal parts garlic powder and dried oregano"],
      mediterranean: ["אורגנו יבש", "dried oregano"], sweet_smoky: ["פפריקה מעושנת וסוכר חום בחלקים שווים", "equal parts smoked paprika and brown sugar"],
      israeli_style: ["פפריקה מתוקה וכמון בחלקים שווים", "equal parts sweet paprika and cumin"]
    };
    if (Object.hasOwn(seasonings, flavor)) ingredients.push(`${n * .25} ${tsp} ${seasonings[flavor][he ? 0 : 1]}`);
    const steps = [], step_timing = [];
    const add = (a, b, phase, minutes) => { steps.push(t(a, b)); step_timing.push({ phase, minutes }); };
    let equipment, cue, bath, hold, bathStep;
    if (sv) {
      // Baldwin: tender cuts use Table 5.1; tough cuts use the 80 C braise
      // discussion, with brisket's explicit 24–36 h guidance. Cook-and-serve only.
      bath = slow ? 80 : 65;
      hold = slow ? (context.cutId === "brisket" ? 2160 : 1440) : BATH_MINUTES[thickness];
      equipment = t("מכשיר סו־ויד עם בקרת טמפרטורה|מכל מתאים ומכסה|שקיות מזון מאושרות לסו־ויד לפי היצרן|אמצעי איטום לפי הוראות השקיות|מחבת וכיריים|קרש וסכין|סרגל", "Temperature-controlled sous-vide circulator|Suitable container and lid|Food bags manufacturer-rated for sous vide|Sealing equipment specified for the bags|Pan and hob|Board and knife|Ruler").split("|");
      add(`משתמשים בבשר מופשר לחלוטין, שמור במקרר ב־4°C או פחות. חותכים ליחידות שטוחות בעובי מרבי של ${thickness} ס״מ, מודדים בחלק העבה ומסירים עצמות ושכבת שומן עבה. הכמויות הן למשקל הבשר לאחר הניקוי.`, `Use fully thawed meat refrigerated at 4°C or below. Cut into flat pieces no thicker than ${thickness} cm, measuring the thickest point; remove bones and thick fat. Quantities refer to trimmed meat.`, "prep", 10);
      add("מערבבים את כל המלח, הפלפל ושאר התבלינים ומפזרים על הבשר. אורזים בשקיות מתאימות בשכבה אחת, ללא חפיפה, מוציאים אוויר ואוטמים לפי הוראות היצרן. שומרים במקרר עד שהאמבט מוכן. את שמן הזית שומרים לצריבה בסוף.", "Mix all the salt, pepper and other seasonings and distribute over the meat. Bag in a single layer without overlapping, remove air and seal following the bag manufacturer's instructions. Refrigerate until the bath is ready. Reserve the olive oil for finishing.", "prep", 10);
      add(`מחממים את אמבט הסו־ויד ל־${bath}°C לפי תצוגת המכשיר. מכניסים את השקיות כשהאמבט הגיע ליעד, כשהבשר שקוע כולו ויש זרימת מים סביב כל שקית. זמן החימום המקדים הוא הערכה; ממתינים לטמפרטורה בפועל.`, `Preheat the sous-vide bath to ${bath}°C on the circulator display. Add the bags once the bath reaches the target, with all meat submerged and water circulating around every bag. Preheating time is an estimate; wait for the actual setpoint.`, "prep", 20);
      bathStep = steps.length;
      add(`מתחילים לספור רק כשהאמבט חזר ל־${bath}°C לאחר הכנסת השקיות. שומרים ברציפות על ${bath}°C במשך כל הזמן שמופיע בשלב הזה, ללא קיצור. מכסים ובודקים מפלס מים ושקיעה מלאה לפי הוראות המכשיר. הכמות אינה מקצרת את הזמן; אם המכל צפוף, מבשלים בסבבים נפרדים באותו משך. אם הייתה הפסקת חימום ולא ידוע כמה זמן נמשכה, אין להמשיך לפי לוח הזמנים הזה.`, `Start the timer only after the bath returns to ${bath}°C after loading. Maintain ${bath}°C continuously for the full time listed for this step; do not shorten it. Cover and check water level and full submersion as instructed by the circulator manufacturer. More servings do not shorten the time; use separate full-length batches if the bath is crowded. If heating was interrupted for an unknown period, do not continue using this schedule.`, "cook", hold);
      add("בסיום פותחים בזהירות את השקיות, מוציאים את הבשר ומייבשים היטב בנייר סופג. משליכים את נוזלי השקית. מחממים מחבת על חום בינוני־גבוה עם שמן הזית ששמרנו, וצורבים בקצרה בכל הצדדים עד השחמה. עובדים בסבבים בלי לצופף; מפחיתים חום אם התבלינים משחירים.", "At the end, open the bags carefully, remove the meat and pat thoroughly dry with paper towels. Discard the bag liquid. Heat a pan over medium-high heat with the reserved olive oil and briefly sear all sides until browned. Work in uncrowded batches; reduce heat if the seasoning blackens.", "cook", batches * 3);
      add("פורסים נגד כיוון הסיבים בכלים נקיים ומגישים מיד. המתכון מיועד לבישול ולהגשה ברצף, ואינו מסלול לאחסון ממושך בשקית אטומה.", "Slice across the grain with clean utensils and serve immediately. This is a cook-and-serve recipe, not a protocol for extended sealed-bag storage.", "rest", 0);
      cue = t(`אמבט ${bath}°C ברציפות, עובי עד ${thickness} ס״מ והזמן המלא. טמפרטורת האמבט אינה מדידת ליבה.`, `Continuous ${bath}°C bath, pieces no thicker than ${thickness} cm and the full time. Bath temperature is not a core measurement.`);
    } else if (slow) {
      ingredients.push(`${n * 50} ${g} ${t("בצל", "onion")}`, `${n * 200} ${ml} ${t("מים, ועוד לפי הצורך לכיסוי הבשר", "water, plus more as needed to cover the meat")}`);
      equipment = t("סיר רגיל עם מכסה|כיריים|קרש וסכין|מזלג וכף|כפיות מדידה או כפיות מטבח", "Ordinary pot with lid|Hob|Board and knife|Fork and spoon|Measuring or kitchen teaspoons").split("|");
      add("חותכים את הבשר לקוביות אחידות של 3 ס״מ ואת הבצל לפרוסות. מערבבים את כל המלח, הפלפל ושאר התבלינים ומצפים בהם את הבשר. משתמשים בבשר מופשר, ומכינים כלי נקי להגשה.", "Cut thawed meat into even 3 cm cubes and slice the onion. Mix all the salt, pepper and other seasonings and coat the meat. Prepare a clean serving dish.", "prep", 15);
      add("מחממים את שמן הזית בסיר על חום בינוני־גבוה. משחימים את קוביות הבשר בסבבים ומוציאים לקערה. מוסיפים לסיר את הבצל ומערבבים עד ריכוך; מפחיתים חום אם התבלינים משחירים.", "Heat the olive oil in the pot over medium-high heat. Brown the meat cubes in batches and transfer to a bowl. Add the onion to the pot and stir until softened; reduce heat if the seasoning blackens.", "cook", batches * 5 + 5);
      add("מחזירים לסיר את הבשר ואת המיצים שבקערה, מוסיפים את המים עד לכיסוי ומביאים לרתיחה. מנמיכים לבעבוע עדין ומכסים. בוחרים סיר שמכיל את הבשר והנוזל בלי למלא עד השפה.", "Return the meat and its bowl juices to the pot, add the water to cover and bring to a boil. Reduce to a gentle simmer and cover. Use a pot with room above the meat and liquid.", "cook", 10);
      add("מבשלים בבעבוע עדין תחת מכסה. בודקים מדי פעם שיש נוזלים ומוסיפים מים חמים אם חסר. הזמן הוא נקודת התחלה לבדיקה, לא סוף אוטומטי: מזלג צריך להיכנס בקלות לכמה קוביות והבשר צריך להתפרק בלחיצה.", "Cook covered at a gentle simmer. Check occasionally that liquid remains and add hot water as needed. The time is a starting point for checking, not an automatic endpoint: a fork should enter several cubes easily and the meat should pull apart under pressure.", "cook", 180);
      add("פותחים כמה מהקוביות הגדולות בסכין נקייה: הן צריכות להעלות אדים גם מהמרכז, להיות מבושלות לכל העובי וללא מרקם נא. אם הבשר עדיין קשה או לא חם במרכז, ממשיכים בבעבוע ובודקים שוב כל 15 דקות. משלבים חום במרכז, מרקם ורכות; צבע לבדו אינו מספיק.", "Cut open several of the largest cubes with a clean knife: they should steam from the centre, be cooked throughout and have no raw texture. If still tough or not hot through, continue simmering and recheck every 15 minutes. Combine central heat, texture and tenderness checks; colour alone is insufficient.", "cook", 0);
      add("מכבים את האש ומשאירים מכוסה בנוזלי הבישול לפני ההגשה בכלים נקיים.", "Turn off the heat and leave covered in the cooking liquid before serving with clean utensils.", "rest", 10);
      cue = t("מזלג נכנס בקלות; כמה קוביות גדולות מעלות אדים מהמרכז ומבושלות לכל העובי.", "Fork-tender; several large cubes steam from the centre and are cooked throughout.");
    } else {
      equipment = t("מחבת רגילה|כיריים|קרש וסכין|מלקחיים או כף|כפיות מדידה או כפיות מטבח", "Ordinary frying pan|Hob|Board and knife|Tongs or spoon|Measuring or kitchen teaspoons").split("|");
      add("משתמשים בבשר מופשר. מסירים עצמות, גידים ושכבת שומן עבה וחותכים נגד הסיבים לרצועות בעובי אחיד של עד חצי ס״מ. מערבבים את כל המלח, הפלפל ושאר התבלינים ומצפים את הרצועות. מכינים צלחת נקייה להגשה.", "Use thawed meat. Remove bones, sinew and thick fat; cut across the grain into even strips no thicker than 0.5 cm. Mix all the salt, pepper and other seasonings and coat the strips. Prepare a clean serving plate.", "prep", 15);
      add("מחממים מחבת רגילה על חום בינוני־גבוה עם חלק משמן הזית. שומרים את יתרת השמן לסבבים הבאים; אין צורך במחבת ברזל או באביזר מיוחד.", "Heat an ordinary frying pan over medium-high heat with some of the olive oil. Reserve the remaining oil for subsequent batches; no cast-iron pan or special accessory is required.", "prep", 3);
      add("מבשלים בשכבה אחת עם מרווחים, עד כ־300 גרם בכל סבב. הופכים ומערבבים כדי להשחים מכל הצדדים. אם החוץ משחים מהר, מנמיכים לחום בינוני. הזמן המוצג הוא הערכה לכל הסבבים, ולא סימן מוכנות בפני עצמו.", "Cook in an uncrowded single layer, up to about 300 g per batch. Turn and stir to brown all sides. Reduce to medium heat if the outside browns quickly. The listed time estimates all batches; it does not establish doneness by itself.", "cook", batches * 6);
      add("בכל סבב פותחים את הרצועות העבות בסכין נקייה: גם המרכז צריך להעלות אדים, להיות מבושל לכל העובי וללא מרקם נא. אם לא, ממשיכים על חום בינוני ובודקים שוב כל דקה. משלבים את הבדיקות ולא מסתמכים רק על הצבע. מעבירים את המוכנות לצלחת נקייה ומגישים חם.", "In each batch, cut open the thickest strips with a clean knife: the centre should steam, be cooked throughout and have no raw texture. Otherwise continue over medium heat and recheck every minute. Combine these checks rather than relying on colour alone. Transfer cooked strips to a clean plate and serve hot.", "cook", 0);
      cue = t("רצועות דקות מבושלות לכל העובי, שמעלות אדים גם מהמרכז; אין כאן יעד של מדיום או מדיום־רייר.", "Thin strips cooked throughout and steaming at the centre; this recipe does not target medium or medium-rare.");
    }
    return {
      title: `${meat} — ${sv ? t("סו־ויד", "sous vide") : slow ? t("קדירה בסיר רגיל", "simple pot stew") : t("רצועות במחבת", "pan-cooked strips")}`,
      description: sv ? t("בישול מבוקר באמבט מים וצריבה קצרה לסיום.", "Controlled water-bath cooking followed by a quick sear.") : t("מתכון עם כלי מטבח רגילים, חיתוך מוגדר ובדיקות מוכנות לאורך הדרך.", "Ordinary cookware, a specified cut size and readiness checks along the way."),
      ingredients, steps, step_timing, equipment, chefTips: [],
      metadata: { servings: n, meat_weight_g: weight, piece_thickness_cm: thickness, doneness_cue: cue, difficulty: t("קל לעקוב", "Easy to follow"),
        cooking_language: he ? "he" : "en", cooking_protocol: sv ? "sous_vide_v1" : "basic_v1", ...(sv ? { bath_temperature_c: bath, bath_minutes: hold, bath_step_index: bathStep } : {}) }
    };
  }
  function matches(main, context) {
    let expected;
    try { expected = createMain({ ...context, language: context.language || main?.metadata?.cooking_language }); } catch { return false; }
    if (!expected || !main) return false;
    // An equipment flag alone cannot disable temperature checks. Only the exact
    // authored instructions, schedule and assumptions qualify for these paths.
    for (const key of ["ingredients", "steps", "step_timing", "equipment"]) if (JSON.stringify(main[key]) !== JSON.stringify(expected[key])) return false;
    for (const [key, value] of Object.entries(expected.metadata)) if (String(main.metadata?.[key]) !== String(value)) return false;
    return main.metadata?.target_internal_c == null;
  }
  return { SOURCES, THICKNESSES, BATH_MINUTES, tough, requested, createMain, matches };
});
