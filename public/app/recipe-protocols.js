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
  const names = { rump: ["שייטל", "shaitel / rump"], chuck_roll: ["אונטריב", "untrib / chuck roll"], ribeye: ["אנטריקוט", "ribeye"], brisket: ["בריסקט", "brisket"], asado: ["אסאדו", "short ribs"], picanha: ["פיקניה", "picanha"], sirloin: ["סינטה", "sirloin"], filet: ["פילה", "fillet"], short_ribs: ["שפונדרה", "short ribs"], chuck: ["כתף / צוואר", "chuck"], flank: ["פלנק", "flank"], striploin: ["סינטה", "striploin"], tenderloin: ["פילה", "tenderloin"] };
  const tough = cut => ["brisket", "asado", "short_ribs", "chuck", "chuck_roll"].includes(cut);
  const basicMethods = cut => tough(cut) ? ["long_cook", "oven", "grill", "bbq", "bbq_finish"] : ["pan_sear", "grill", "bbq", "oven"];
  function basicMethodLabel(method, cut, language = "he") {
    const slow = tough(cut), labels = {
      pan_sear: ["מחבת רגילה", "Ordinary pan"], long_cook: ["סיר — בישול ארוך", "Pot — slow cooking"],
      oven: ["תנור", "Oven"], grill: slow ? ["גריל גז — בישול עקיף עם מכסה", "Gas grill — covered indirect cooking"] : ["גריל גז", "Gas grill"],
      bbq: slow ? ["מנגל פחמים עם מכסה — בישול עקיף", "Charcoal barbecue — covered indirect cooking"] : ["מנגל פחמים", "Charcoal barbecue"],
      bbq_finish: ["מנגל פתוח — ריכוך בתנור וסיום על הגחלים", "Open barbecue — oven braise, then charcoal finish"]
    };
    return labels[method]?.[language === "he" ? 0 : 1] || method;
  }
  function basicMethodHelp(method, cut, language = "he") {
    const slow = tough(cut), he = language === "he";
    if (method === "bbq_finish") return he ? "מרככים בתנור בתבנית מכוסה ומסיימים על מנגל פתוח. נדרשים תנור ומנגל; לא צריך מכסה למנגל." : "Tenderise in a covered oven dish, then finish on an open charcoal barbecue. Requires both an oven and barbecue; no barbecue lid needed.";
    if (slow && ["grill", "bbq"].includes(method)) return he ? "הנתח יתבשל בתבנית מכוסה בנוזלים, בחום עקיף ובמכשיר עם מכסה. למנגל ללא מכסה בחרו באפשרות של ריכוך בתנור וסיום על הגחלים." : "Cook in a covered dish with liquid over indirect heat, in a barbecue with a lid. Without a lid, choose the oven-braise and charcoal-finish option.";
    if (slow && method === "oven") return he ? "בישול ממושך בתבנית מכוסה בתנור, עם נוזלים ובדיקת רכות במזלג." : "Slow oven cooking in a covered dish with liquid and a fork-tenderness check.";
    if (slow) return he ? "קדירה בסיר רגיל, עם בדיקות רכות וחום במרכז." : "An ordinary pot stew with tenderness and central heat checks.";
    if (method === "pan_sear") return he ? "רצועות דקות במחבת רגילה, עם בדיקות מוכנות. ללא מדחום, המסלול מיועד לבישול מלא." : "Thin strips in an ordinary pan with readiness checks. The no-thermometer path aims for cooking throughout.";
    return he ? "סטייקים בעובי עד 1.5 ס״מ, עם הוראות לחום, הפיכה ובדיקת מוכנות לפי השיטה שבחרת. ללא מדחום, המסלול מיועד לבישול מלא." : "Steaks up to 1.5 cm thick, with method-specific heat, turning and readiness checks. The no-thermometer path aims for cooking throughout.";
  }
  const requested = c => c.equipmentMode === "basic" || c.methodId === "sous_vide";
  function createMain(context = {}) {
    if (!requested(context)) return null;
    const he = context.language === "he", t = (a, b) => he ? a : b;
    const sv = context.methodId === "sous_vide", slow = tough(context.cutId);
    if (!Object.hasOwn(names, context.cutId) || !["beef", "lamb", "veal"].includes(context.meatType || "beef")) throw new Error("unsupported_cooking_selection");
    if (sv && context.equipmentMode === "basic") throw new Error("sous_vide_requires_equipment");
    const method = context.methodId || (slow ? "long_cook" : "pan_sear");
    if (!sv && !basicMethods(context.cutId).includes(method)) throw new Error("unsupported_basic_method");
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
    if (!sv && ["grill", "bbq", "oven", "bbq_finish"].includes(method)) {
      return expandedBasicMain({ context, method, slow, n, weight, meat, ingredients, t, g, ml });
    }
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
  function expandedBasicMain({ context, method, slow, n, weight, meat, ingredients, t, g, ml }) {
    const charcoal = method === "bbq" || method === "bbq_finish";
    const finish = method === "bbq_finish", oven = method === "oven" || finish;
    const portions = Math.ceil(weight / 600), steps = [], step_timing = [];
    const add = (a, b, phase, minutes) => { steps.push(t(a, b)); step_timing.push({ phase, minutes }); };
    const grillSetup = (indirect = false) => {
      if (charcoal) add(
        `מדליקים את המנגל בחוץ לפי הוראות היצרן. ממתינים לגחלים זוהרות עם שכבת אפר אפורה ולדעיכת הלהבות, ומסדרים אותן בצד אחד כדי להשאיר גם אזור ללא גחלים מתחתיו.${indirect ? " נדרש מנגל עם מכסה; מחממים עם המכסה סגור ומשאירים זרימת אוויר לפי הוראות היצרן." : " מנקים את הרשת וממתינים שתתחמם; אין להניח בשר מעל להבות."}`,
        `Light the charcoal barbecue outdoors following its manual. Wait for glowing coals with grey ash and for flames to die down; bank coals on one side, leaving an area with no coals beneath it.${indirect ? " A barbecue lid is required; preheat with it closed and maintain airflow as the manufacturer directs." : " Clean and preheat the grate; do not put meat over flames."}`, "prep", 25);
      else add(
        `מדליקים את גריל הגז בחוץ ומחממים לפי הוראות היצרן. מכוונים אזור אחד לחום בינוני ומשאירים מבער אחר כבוי, כדי שיהיה גם אזור ללא אש ישירה.${indirect ? " נדרש גריל עם מכסה, שסוגרים בזמן הבישול העקיף." : " מנקים את הרשת; אם הבשר משחים מהר, אפשר להעביר לאזור החלש."}`,
        `Light and preheat the gas grill outdoors following its manual. Set one zone to medium heat and leave another burner off for an area without direct heat.${indirect ? " A grill lid is required and stays closed during indirect cooking." : " Clean the grate; move meat to the gentler zone if it browns too quickly."}`, "prep", 15);
    };
    let equipment, cue;
    if (slow) {
      ingredients.push(`${n * 50} ${g} ${t("בצל", "onion")}`, `${n * 150} ${ml} ${t("מים רותחים, ועוד לפי הצורך עד שני שלישים מגובה הבשר", "boiling water, plus more as needed to reach two-thirds up the meat")}`);
      equipment = [t(oven ? "תנור" : charcoal ? "מנגל פחמים עם מכסה" : "גריל גז עם מכסה", oven ? "Oven" : charcoal ? "Charcoal barbecue with lid" : "Gas grill with lid"),
        t("תבנית מתכת עמוקה ורדיד אלומיניום לכיסוי הדוק", "Deep metal roasting dish and foil for a tight cover"), t("קומקום או סיר להרתחת מים", "Kettle or pot for boiling water"),
        t("קרש וסכין", "Board and knife"), t("מזלג ומלקחיים", "Fork and tongs"), t("כפפות חום", "Heat-resistant gloves")];
      if (finish) equipment.push(t("מנגל פחמים, גם ללא מכסה", "Charcoal barbecue; a lid is not needed"));
      add("משתמשים בבשר מופשר וללא עצם. חותכים לחלקים שטוחים בעובי עד 3 ס״מ, מסירים גידים עבים ושומן עודף ופורסים את הבצל. מערבבים את כל המלח, הפלפל ושאר התבלינים. מצפים את הבשר בשמן הזית ובתערובת התיבול.", "Use thawed, boneless meat. Cut into flat pieces no thicker than 3 cm, trim thick sinew and excess fat, and slice the onion. Mix all the salt, pepper and other seasonings. Coat the meat with the olive oil and seasoning mixture.", "prep", 15);
      if (oven) add("מחממים תנור ל־170°C בחום עליון ותחתון. בוחרים תבנית מתכת עמוקה שתכיל את הבשר בשכבה אחת; לכמות גדולה משתמשים בכמה תבניות או מבשלים בסבבים.", "Preheat the oven to 170°C using conventional top and bottom heat. Choose a deep metal dish that holds the meat in one layer; use more dishes or cook separate batches for a large quantity.", "prep", 15);
      else grillSetup(true);
      add("מפזרים את הבצל בתבנית ומניחים מעליו את הבשר בשכבה אחת. יוצקים את המים הרותחים עד כשני שלישים מגובה הבשר ומכסים היטב ברדיד אלומיניום. משאירים מרווח משפת התבנית למניעת גלישה.", "Spread the onion in the dish and arrange the meat on top in one layer. Add boiling water to about two-thirds of the meat's height and seal tightly with foil. Leave room below the rim to prevent spills.", "prep", 5);
      add(oven
        ? "מכניסים למדף האמצעי בתנור. מבשלים מכוסה בבעבוע עדין של הנוזלים. פותחים בזהירות לבדיקה כל 45 דקות, הופכים את הבשר ומוסיפים מים רותחים אם חסר. מחזירים את הכיסוי; אם הנוזל רותח בחוזקה מפחיתים מעט את חום התנור."
        : "מניחים את התבנית על הרשת באזור ללא מבער דולק או גחלים מתחתיה, וסוגרים את מכסה הגריל או המנגל. שומרים על בעבוע עדין של הנוזלים. בודקים בזהירות כל 45 דקות, הופכים את הבשר, מוסיפים מים רותחים אם חסר ומחזירים את שני הכיסויים. מווסתים חום ומחדשים גחלים לפי הוראות היצרן; אם אין בעבוע, מחזקים את החום בלי להעביר לאש ישירה.",
        oven
          ? "Place on the middle oven shelf. Cook covered with the liquid gently bubbling. Carefully check every 45 minutes, turn the meat and top up with boiling water if needed, then reseal. Lower the oven heat slightly if the liquid boils vigorously."
          : "Place the dish on the grate with no lit burner or coals underneath and close the barbecue lid. Maintain gentle bubbling in the liquid. Carefully check every 45 minutes, turn the meat, top up with boiling water as needed and replace both covers. Adjust heat and replenish coals as the manufacturer directs; if there is no bubbling, increase heat without moving the dish over direct heat.", "cook", 180);
      add("בודקים כמה מהחלקים העבים: מזלג צריך להיכנס בקלות והבשר צריך להיפרד בלחיצה. פותחים בסכין נקייה ובודקים אדים גם מהמרכז ובישול לכל העובי. אם הבשר עדיין קשה או לא חם במרכז, ממשיכים מכוסה באותה שיטה ובודקים שוב כל 20 דקות. זמן וצבע בלבד אינם סימן מוכנות.", "Check several of the thickest pieces: a fork should enter easily and the meat should pull apart under pressure. Cut open with a clean knife and check for steam from the centre and cooking throughout. If still tough or not hot in the middle, continue covered with the same method and recheck every 20 minutes. Time and colour alone do not establish readiness.", "cook", 0);
      if (finish) {
        add("משאירים את הבשר המוכן בתנור בתוך נוזליו כשהוא מכוסה וחם, ומכינים את המנגל. עוברים לצריבה מיד כשהגחלים מוכנות; אין לקרר את הבשר חלקית בין שלבי ההכנה.", "Keep the cooked meat covered and hot in its liquid in the oven while preparing the barbecue. Proceed to searing as soon as the coals are ready; do not partially cool the meat between stages.", "prep", 0);
        grillSetup(false);
        add("מוציאים בעדינות את הבשר המוכן מהנוזלים ומניחים על הרשת מעל הגחלים המתונות. צורבים בקצרה מכל צד עד השחמה, עם מלקחיים רחבים כדי שהבשר לא יתפרק. אם עולות להבות מזיזים לאזור ללא גחלים. זהו שלב השחמה בלבד אחרי שהבשר כבר רך ומבושל; שומרים את נוזלי הבישול להגשה.", "Gently lift the fully cooked meat from the liquid and put it on the grate over moderate coals. Briefly brown each side, using broad tongs to keep the tender meat together. Move to the coal-free area if flames rise. This is a browning finish after cooking and tenderising are complete; reserve the cooking liquid for serving.", "cook", portions * 4);
      }
      add(finish ? "מעבירים לצלחת נקייה ומגישים עם הבצל ומעט נוזלי הבישול. פורסים נגד הסיבים לפי הצורך." : "מוציאים מהחום ומשאירים מכוסה בנוזלי הבישול למנוחה. מגישים עם הבצל והנוזלים, ופורסים נגד הסיבים לפי הצורך.", finish ? "Transfer to a clean plate and serve with the onion and some cooking liquid. Slice across the grain if needed." : "Remove from the heat and rest covered in the cooking liquid. Serve with the onion and liquid, slicing across the grain if needed.", "rest", finish ? 0 : 10);
      cue = t("בשר רך למזלג, שמתפרק בלחיצה ומעלה אדים גם מהמרכז; ממשיכים לבשל אם עדיין קשה.", "Fork-tender meat that pulls apart under pressure and steams at the centre; continue cooking if still tough.");
    } else {
      equipment = [t(oven ? "תנור ותבנית מתכת שטוחה" : charcoal ? "מנגל פחמים" : "גריל גז", oven ? "Oven and shallow metal tray" : charcoal ? "Charcoal barbecue" : "Gas grill"),
        t("קרש וסכין", "Board and knife"), t("מלקחיים וצלחת נקייה", "Tongs and a clean plate"), t("כפפות חום", "Heat-resistant gloves")];
      add("משתמשים בבשר מופשר וללא עצם. חותכים לסטייקים בעובי אחיד של עד 1.5 ס״מ, מסירים גידים ושומן חיצוני עודף; בפיקניה משאירים שכבת שומן דקה של עד חצי ס״מ. מערבבים את כל המלח, הפלפל ושאר התבלינים ומורחים על הבשר יחד עם שמן הזית.", "Use thawed, boneless meat. Cut into even steaks no thicker than 1.5 cm and trim sinew and excess external fat; leave no more than a 0.5 cm fat cap on picanha. Mix all the salt, pepper and other seasonings and coat the meat with them and the olive oil.", "prep", 15);
      if (oven) add("מחממים תנור ל־220°C בחום עליון ותחתון ומניחים את הבשר בתבנית מתכת בשכבה אחת, עם מרווחים. לכמות גדולה משתמשים בכמה תבניות או בסבבים.", "Preheat the oven to 220°C using conventional top and bottom heat. Arrange the meat in a metal tray in a single layer with space between pieces. Use additional trays or batches for large quantities.", "prep", 15);
      else grillSetup();
      add(oven
        ? "צולים במדף האמצעי. הופכים באמצע ההכנה כדי להשחים משני הצדדים; אם התיבול משחים מהר מדי, מפחיתים ל־190°C. מתחילים לבדוק מוכנות לפני סוף הזמן המשוער, במיוחד בסטייקים דקים יותר."
        : "מניחים על הרשת בחום בינוני, עם מרווחים. הופכים במהלך הצלייה להשחמה משני הצדדים. מתחילים לבדוק מוקדם; אם החוץ משחים מהר מדי או השומן מתלקח, מעבירים לאזור החלש וממשיכים עד שהמרכז מוכן. הזמן כולל הערכה לסבבים בכמות גדולה.",
        oven
          ? "Roast on the middle shelf, turning halfway to brown both sides. Reduce to 190°C if the seasoning darkens too quickly. Begin checking before the estimated time ends, especially for thinner steaks."
          : "Place on the grate over medium heat with space between steaks. Turn during cooking to brown both sides. Start checking early; if the outside darkens too quickly or fat flares up, move to the gentler zone and continue until the centre is cooked. The time estimates batches for a larger quantity.", "cook", oven ? 18 * portions : 12 * portions);
      add(`פותחים את החלק העבה בכל סטייק בסכין נקייה ובודקים שהוא מעלה אדים גם מהמרכז ומבושל לכל עוביו, ללא מרקם נא. אם לא, ממשיכים ${oven ? "בתנור" : "על הרשת בחום מתון"} ובודקים שוב כל 2 דקות. משלבים חום במרכז ומרקם; צבע והשחמה מבחוץ לבדם אינם מספיקים.`, `Cut into the thickest part of each steak with a clean knife and check that it steams at the centre and is cooked throughout with no raw texture. Otherwise continue ${oven ? "in the oven" : "on the grate over moderate heat"} and recheck every 2 minutes. Combine central heat and texture checks; colour and exterior browning alone are insufficient.`, "cook", 0);
      add("מעבירים לצלחת נקייה למנוחה קצרה ומגישים חם. פורסים נגד כיוון הסיבים.", "Transfer to a clean plate for a short rest, then serve hot. Slice across the grain.", "rest", 3);
      cue = t("סטייקים בעובי עד 1.5 ס״מ, מבושלים לכל העובי ומעלים אדים מהמרכז. אין יעד מדויק של מדיום ללא מדידה.", "Steaks no thicker than 1.5 cm, cooked throughout and steaming at the centre. Precise medium doneness is not targeted without measurement.");
    }
    return {
      title: `${meat} — ${basicMethodLabel(method, context.cutId, context.language)}`,
      description: basicMethodHelp(method, context.cutId, context.language), ingredients, steps, step_timing, equipment, chefTips: [],
      metadata: { servings: n, meat_weight_g: weight, piece_thickness_cm: slow ? 3 : 1.5, doneness_cue: cue, difficulty: t("קל לעקוב", "Easy to follow"),
        cooking_language: context.language === "he" ? "he" : "en", cooking_protocol: "basic_v2", cooking_method: method }
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
  return { SOURCES, THICKNESSES, BATH_MINUTES, tough, basicMethods, basicMethodLabel, basicMethodHelp, requested, createMain, matches };
});
