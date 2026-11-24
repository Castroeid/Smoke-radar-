// Synthetic test data, not a kitchen-tested or published recipe.
module.exports = () => ({
  dietaryPreference: "kosher",
  main: {
    title: "בריסקט בתנור", description: "מתכון לבדיקת התוכנה",
    metadata: { servings: 4, prep_minutes: 20, cook_minutes: 240, rest_minutes: 30, total_minutes: 290, meat_weight_g: 1000, piece_thickness_cm: 5, target_internal_c: 93, doneness_cue: "בדקו במדחום במרכז הנתח וברכות באמצעות שיפוד.", difficulty: "בינוני" },
    equipment: ["תנור", "סיר עם מכסה", "מדחום מזון"],
    ingredients: ["1000 גרם בריסקט", "10 גרם מלח", "30 מ״ל שמן זית", "200 גרם בצל", "250 מ״ל מים"],
    steps: ["מחממים תנור ל־170°C ומתבלים את הבשר במלח.", "מוסיפים לסיר שמן זית, בצל ומים, מכסים ומבשלים בתנור.", "מודדים טמפרטורת ליבה של 93°C ובודקים שהשיפוד מחליק בקלות.", "מניחים לבשר לנוח לפני הפריסה."],
    step_timing: [{ phase: "prep", minutes: 20 }, { phase: "cook", minutes: 240 }, { phase: "cook", minutes: 0 }, { phase: "rest", minutes: 30 }],
    chefTips: ["עקבו אחר הטמפרטורה והרכות, לא רק השעון."]
  },
  sauces: [{ name: "רוטב לימון", description: "לימון ושמן", ingredients: ["30 מ״ל שמן זית", "15 מ״ל מיץ לימון"], steps: ["מערבבים את שמן הזית עם מיץ הלימון.", "מגישים לצד הבשר."] }],
  sides: [{ name: "תפוחי אדמה", description: "צלויים", ingredients: ["800 גרם תפוחי אדמה", "15 מ״ל שמן זית"], steps: ["חותכים את תפוחי האדמה ומערבבים בשמן הזית.", "אופים ב־200°C כ־35 דקות עד רכות."] }],
  drinkPairings: [{ name: "מים", description: "קרים" }]
});
