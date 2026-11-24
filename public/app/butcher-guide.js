(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ButcherGuide = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  // Editorial buying suggestions, checked against primary sources on 2026-11-24.
  // Israeli beef numbers are not an international numbering system or a SKU.
  const sources = {
    map: { name: "מועצת הבקר · Israel Cattle Board", url: "https://meat.org.il/מפת-נתחים/" },
    untrib: { name: "הטחנה — אונטריב", url: "https://meat-shop.co.il/מדריך-נתחים/אונטריב/" },
    rump: { name: "אטליז אוחיון — שייטל", url: "https://atliz-ohayon.co.il/product/שייטל-נתח-מספר-13/" },
    burger: { name: "Weber — 80/20 burger blend", url: "https://amer.weber.com/en-us/blogs/recipes/classic-smash-burger" },
    pulled: { name: "ThermoWorks — chuck for pulled beef", url: "https://blog.thermoworks.com/smoked-chuck-roast-a-cheaper-cut-shines/" }
  };
  const cuts = {
    chuck_roll: { name: ["אונטריב / צלעות", "Untrib / chuck roll"], number: 2 },
    rump: { name: ["שייטל / כנף העוקץ", "Shaitel / rump"], number: 13 },
    ribeye: { name: ["אנטריקוט", "Ribeye"], number: 1 },
    sirloin: { name: ["סינטה", "Sirloin / striploin"], number: 11 },
    brisket: { name: ["חזה / בריסקט", "Brisket"], number: 3 },
    shoulder: { name: ["צלי כתף", "Shoulder pot roast"], number: 5 },
    neck: { name: ["צוואר", "Neck"], number: 10 }
  };
  // Portion weights are adjustable planning estimates, not source-prescribed requirements.
  const goals = [
    { id: "burgers", label: ["המבורגר", "Burgers"], cut: "chuck_roll", alternatives: ["neck"], grams: 200,
      preparation: ["לטחון להמבורגר, בלי תיבול, עם כ־20% שומן בסך התערובת. המשקל כולל את השומן. בבקשה להתאים את השומן לפי הנתח בפועל.", "Grind for burgers, unseasoned, with about 20% fat in the final blend. The weight includes the fat; adjust the blend to the actual meat."],
      why: ["אונטריב יכול לשמש בסיס לתערובת. אחוז השומן הטבעי משתנה, לכן מבקשים מהקצב להתאים את התערובת ולא מניחים שכל אונטריב מכיל אותו אחוז.", "Untrib can form the base of a burger blend. Its natural fat varies, so ask the butcher to adjust the final blend."],
      check: ["לשאול מה נכנס לתערובת ומה רמת הטחינה המומלצת להמבורגר שאתם מכינים.", "Ask which cuts are in the blend and which grind suits your burger style."], sources: ["untrib", "burger", "map"] },
    { id: "meatballs", label: ["קציצות ברוטב", "Meatballs in sauce"], cut: "neck", alternatives: ["chuck_roll"], grams: 200,
      preparation: ["לטחון לקציצות ברוטב, בלי תבלינים ובלי בצל. לנקות גידים קשים ולהתאים את הטחינה לקציצות; את יתר המרכיבים אוסיף בבית.", "Grind for meatballs in sauce, without seasoning or onion. Remove tough sinew and choose a suitable grind; I will add the other ingredients at home."],
      why: ["צוואר מתאים לטחינה; כדאי להגדיר מראש שהבשר מיועד לקציצות ברוטב.", "Neck suits mincing; tell the butcher you are making meatballs in sauce."],
      check: ["אם קונים תערובת מוכנה, לברר אילו נתחים ותוספות היא מכילה.", "For a ready-made blend, ask about its cuts and added ingredients."], sources: ["map", "untrib"] },
    { id: "kebab", label: ["קבב / קציצות על האש", "Kebab / grilled meat patties"], cut: "chuck_roll", alternatives: ["neck"], grams: 250,
      preparation: ["לטחון לקבב על האש, בלי תיבול. להתאים את השומן לתערובת שמתאימה לצלייה, ולומר לי מה הוסף. בלי שומן כבש אלא אם אבקש.", "Grind for grilled kebab, unseasoned. Adjust the fat for grilling and tell me what was added. No lamb fat unless I ask for it."],
      why: ["מגדירים לקצב את סוג הקציצה ואת הצלייה המתוכננת, כדי שיתאים טחינה ותערובת.", "Specify the patty style and cooking method so the butcher can adapt the grind and blend."],
      check: ["לתאם אם מקבלים בשר טחון בלבד או קבבים מוכנים עם תוספות.", "Agree whether you want plain mince or shaped, seasoned kebabs."], sources: ["map", "untrib"] },
    { id: "steaks", label: ["סטייק במחבת / במנגל", "Pan / barbecue steaks"], cut: "rump", alternatives: ["ribeye", "sirloin"], grams: 250,
      preparation: ["לנקות גידים ולפרוס לסטייקים אחידים נגד הסיבים. להתאים את העובי למחבת או למנגל ולמתכון שאכין; לא לקוביות קדירה.", "Trim sinew and cut even steaks across the grain. Match the thickness to my pan or barbecue and recipe, rather than stew cubes."],
      why: ["שייטל מתאים לסטייקים. אפשר לבקש גם אנטריקוט או סינטה בהתאם לטעם ולתקציב.", "Shaitel suits steaks; ribeye and sirloin are alternatives depending on preference and budget."],
      check: ["לציין אם מבשלים בלי מדחום ולהתאים את העובי להוראות המתכון שנבחר.", "Mention if you cook without a thermometer, and match thickness to the chosen recipe."], sources: ["map", "rump"] },
    { id: "skewers", label: ["שיפודי בקר", "Beef skewers"], cut: "rump", alternatives: ["ribeye"], grams: 250,
      preparation: ["לנקות גידים ולחתוך לקוביות אחידות לשיפודים בצלייה קצרה. להתאים את הגודל למתכון; אבקש בשר בלבד, ללא שיפודים ותיבול.", "Trim sinew and cut even cubes for quick-grilled skewers, sized for my recipe. Meat only, without skewers or seasoning."],
      why: ["שייטל מתאים לשיפודים. חשוב לומר שמדובר בצלייה קצרה, כדי שלא לקבל קוביות של נתח המיועד לבישול ארוך.", "Shaitel suits skewers. Specify quick grilling so you do not receive a slow-cooking cut cubed for stew."],
      check: ["לבקש שהקוביות יהיו דומות בגודל, גם אם הקצב מחליף לנתח אחר.", "Ask for similarly sized cubes, including when substituting a different cut."], sources: ["map"] },
    { id: "stir_fry", label: ["מוקפץ / רצועות במחבת", "Stir-fry / pan strips"], cut: "rump", alternatives: ["sirloin"], grams: 200,
      preparation: ["לנקות גידים ולפרוס לרצועות דקות ואחידות נגד הסיבים, לצריבה קצרה במחבת. לא בשר שמצריך ריכוך ממושך.", "Trim sinew and slice into thin, even strips across the grain for quick pan cooking. Avoid a cut requiring lengthy tenderising."],
      why: ["שייטל נמכר גם כרצועות למוקפץ; הפריסה חשובה לא פחות משם הנתח.", "Shaitel is also sold as stir-fry strips; the preparation matters as well as the cut name."],
      check: ["להראות את עובי הרצועות שהמתכון מבקש לפני הפריסה.", "Show the recipe's requested strip thickness before slicing."], sources: ["rump", "map"] },
    { id: "stew", label: ["קדירה / גולאש", "Stew / goulash"], cut: "chuck_roll", alternatives: ["shoulder", "neck"], grams: 300,
      preparation: ["ללא עצם, בקוביות אחידות לבישול ממושך בסיר עם נוזלים. לנקות גידים עבים ושומן חיצוני עודף, ולהתאים את גודל הקוביות למתכון.", "Boneless, in even cubes for slow cooking with liquid. Trim thick sinew and excess external fat; match the cube size to my recipe."],
      why: ["אונטריב מתאים לבישול ממושך. כאן מבקשים קוביות לקדירה, לא סטייקים לצלייה מהירה.", "Untrib suits slow cooking. Ask for stew cubes rather than quick-cooking steaks."],
      check: ["אם אין אונטריב, לבקש חלופה לקדירה ולבדוק אם צריך לשנות את זמן הבישול.", "If substituting, ask for a stewing cut and allow for a different cooking time."], sources: ["untrib", "map"] },
    { id: "roast", label: ["רוסטביף לפריסה", "Roast beef for slicing"], cut: "sirloin", alternatives: ["rump", "ribeye"], grams: 300,
      preparation: ["נתח ללא עצם לצלייה בתנור ולפריסה, בצורה ובעובי אחידים ככל האפשר. להשאיר שלם ולנקות גידים חיצוניים; לא צלי קדירה מתפרק.", "A boneless, evenly shaped roast for oven cooking and slicing. Leave it whole and trim external sinew; this is not a fall-apart pot roast."],
      why: ["סינטה ושייטל מתאימים לרוסטביף; צלי שמתפרק ברוטב הוא בקשה אחרת.", "Sirloin and shaitel suit roast beef; a fall-apart pot roast is a different request."],
      check: ["לבחור קודם מתכון שמתאים לנתח שלם ולעובי שקונים.", "Choose a recipe for a whole roast matching the thickness you buy."], sources: ["map"] },
    { id: "pulled", label: ["בשר מפורק / בישול ארוך", "Pulled beef / slow cooking"], cut: "chuck_roll", alternatives: ["brisket"], grams: 300,
      preparation: ["אונטריב ללא עצם לבישול ארוך עד פירוק. להשאיר בנתח או לחלק לפי כלי הבישול והמתכון שאציג, ולנקות גידים עבים ושומן חיצוני עודף.", "Boneless untrib for slow cooking until shreddable. Leave whole or divide to fit the dish and recipe I show you, trimming thick sinew and excess external fat."],
      why: ["נתחים עתירי רקמות חיבור מתאימים לריכוך ממושך; בשר מפורק אינו מתקבל מצריבה קצרה בלבד.", "Connective-tissue-rich cuts suit prolonged tenderising; a quick sear alone does not produce pulled beef."],
      check: ["לציין אם מכינים בסיר, בתנור או במעשנה. אם מבקשים ״לב אונטריב״, לוודא עם הקצב איזה חלק הוא מפריד.", "Specify pot, oven or smoker. If asking for the 'heart of untrib', agree with the butcher which section will be separated."], sources: ["untrib", "pulled", "map"] }
  ];
  const text = (pair, lang) => pair[lang === "en" ? 1 : 0];
  const cutLabel = (id, lang = "he") => cuts[id] ? `${text(cuts[id].name, lang)} (${lang === "en" ? "Israeli no." : "מס׳"} ${cuts[id].number})` : "";
  function build(goalId = "burgers", servings = 4, lang = "he") {
    const goal = goals.find(g => g.id === goalId) || goals[0];
    const count = Math.max(1, Math.min(20, Math.floor(Number(servings) || 4)));
    const weight = count * goal.grams, he = lang !== "en", label = text(goal.label, lang);
    const request = he
      ? `אני רוצה להכין ${label} לכ־${count} מנות. אבקש כ־${weight} גרם ${cutLabel(goal.cut, lang)}, במשקל נקי ללא עצם. ${text(goal.preparation, lang)}`
      : `I want to make ${label.toLowerCase()} for about ${count} servings. Please prepare about ${weight} g of ${cutLabel(goal.cut, lang)}, as trimmed boneless weight. ${text(goal.preparation, lang)}`;
    return { id: goal.id, label, servings: count, weight, gramsPerServing: goal.grams, cut: cutLabel(goal.cut, lang), request,
      why: text(goal.why, lang), check: text(goal.check, lang), alternatives: goal.alternatives.map(id => cutLabel(id, lang)),
      sources: goal.sources.map(id => sources[id]) };
  }
  return { goals, build };
});
