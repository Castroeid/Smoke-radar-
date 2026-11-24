(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RecipeStore = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";
  const validId = (id) => typeof id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
  const text = (value) => typeof value === "string" ? value : "";
  const strings = (items) => Array.isArray(items) ? items.filter(item => typeof item === "string") : [];
  const metadata = value => Object.fromEntries(Object.entries(value || {}).filter(([key, item]) =>
    ["servings", "prep_minutes", "cook_minutes", "rest_minutes", "total_minutes", "meat_weight_g", "piece_thickness_cm", "target_internal_c", "doneness_cue", "difficulty", "prep_time", "cook_time", "rest_time", "total_time"].includes(key)
    && (typeof item === "string" || (typeof item === "number" && Number.isFinite(item)))));
  const part = (item = {}) => ({
    name: text(item?.name), title: text(item?.title), description: text(item?.description),
    ingredients: strings(item?.ingredients), steps: strings(item?.steps)
  });
  function normalize(value) {
    if (!value || !validId(value.id) || typeof value.title !== "string") throw new Error("invalid-recipe");
    const p = value.preferences || {};
    const m = value.main || {};
    const recipe = {
      id: value.id, title: value.title,
      recipeVersion: value.recipeVersion === 1 ? 1 : undefined,
      dietaryPreference: text(value.dietaryPreference),
      createdAt: Number.isFinite(Date.parse(value.createdAt)) ? new Date(value.createdAt).toISOString() : new Date(0).toISOString(),
      preferences: {
        meatType: text(p.meatType), cutId: text(p.cutId), methodId: text(p.methodId), flavorId: text(p.flavorId),
        dietaryPreference: text(p.dietaryPreference), servings: Math.max(1, Math.min(20, Number(p.servings) || 4)), userQuestion: text(p.userQuestion)
      },
      main: { ...part(m), prepTime: text(m.prepTime), cookTime: text(m.cookTime), totalTime: text(m.totalTime),
        difficulty: text(m.difficulty), techniqueGlossary: strings(m.techniqueGlossary),
        metadata: metadata(m.metadata), equipment: strings(m.equipment), chefTips: strings(m.chefTips) },
      sauces: Array.isArray(value.sauces) ? value.sauces.map(part) : [],
      sides: Array.isArray(value.sides) ? value.sides.map(part) : [],
      drinks: Array.isArray(value.drinks) ? value.drinks.map(item => ({ name: text(item?.name) })) : [],
      shopping: Object.fromEntries(["meat", "seasoning", "sauceIngredients", "sideIngredients", "drinks"].map(key => [key, strings(value.shopping?.[key])]))
    };
    if (JSON.stringify(recipe).length > 200000) throw new Error("recipe-too-large");
    return recipe;
  }
  const sort = (items) => [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  function create({ storage, key, onChange = () => {} }) {
    let cloud = null;
    let epoch = 0;
    let revision = 0;
    const state = { user: null, recipes: [], loading: false, busy: false, error: null, guestCount: 0 };
    function guests() {
      try {
        const parsed = JSON.parse(storage.getItem(key) || "[]");
        return Array.isArray(parsed) ? parsed.flatMap(item => { try { return [normalize(item)]; } catch { return []; } }) : [];
      } catch { return []; }
    }
    function emit() { state.guestCount = guests().length; onChange({ ...state, recipes: [...state.recipes] }); }
    function same(owner, version) { return epoch === version && (state.user?.uid || null) === owner; }
    function requireIdle() {
      if (state.busy || state.loading) throw new Error("recipe-busy");
      if (state.user && !cloud) throw new Error("account-unavailable");
    }
    async function refresh() {
      if (state.busy) return false;
      const version = epoch, read = ++revision, owner = state.user?.uid || null;
      state.loading = true; state.error = null; emit();
      try {
        const recipes = owner ? await cloud.list(owner) : guests();
        if (!same(owner, version) || read !== revision) return false;
        state.recipes = sort(recipes.map(normalize));
        return true;
      } catch (error) {
        if (same(owner, version) && read === revision) state.error = "load";
        return false;
      } finally {
        if (same(owner, version) && read === revision) { state.loading = false; emit(); }
      }
    }
    async function setUser(user) {
      epoch++; revision++;
      state.user = user ? { uid: user.uid, displayName: user.displayName || "", email: user.email || "" } : null;
      state.recipes = []; state.loading = false; state.busy = false; state.error = null;
      emit(); // Remove the previous account's recipes before any asynchronous read.
      return refresh();
    }
    async function mutate(operation, nextRecipes) {
      requireIdle();
      const owner = state.user?.uid || null, version = epoch;
      revision++;
      state.busy = true; state.error = null; emit();
      try {
        if (owner) await operation(owner);
        else storage.setItem(key, JSON.stringify(nextRecipes));
        if (!same(owner, version)) return false;
        state.recipes = sort(nextRecipes);
        return true;
      } catch (error) {
        if (same(owner, version)) state.error = "save";
        throw error;
      } finally {
        if (same(owner, version)) { state.busy = false; emit(); }
      }
    }
    state.recipes = sort(guests());
    state.guestCount = state.recipes.length;
    return {
      snapshot: () => ({ ...state, recipes: [...state.recipes] }),
      configure: (adapter) => { cloud = adapter; },
      setUser, refresh,
      save(value) {
        const recipe = normalize(value);
        return mutate(uid => cloud.put(uid, recipe), [recipe, ...state.recipes.filter(item => item.id !== recipe.id)]);
      },
      remove(id) {
        if (!validId(id)) return Promise.reject(new Error("invalid-recipe"));
        return mutate(uid => cloud.remove(uid, id), state.recipes.filter(item => item.id !== id));
      },
      async importGuests() {
        requireIdle();
        if (!state.user) throw new Error("sign-in-required");
        const owner = state.user.uid, version = epoch, imported = guests();
        // Do not overwrite a recipe already modified in this account.
        const existing = new Set(state.recipes.map(item => item.id));
        state.busy = true; state.error = null; revision++; emit();
        try {
          for (const recipe of imported) {
            if (!same(owner, version)) return false;
            if (!existing.has(recipe.id)) await cloud.put(owner, recipe);
          }
          if (!same(owner, version)) return false;
          state.recipes = sort([...state.recipes, ...imported.filter(item => !existing.has(item.id))]);
          // Remove local copies only after every write succeeded, preserving any
          // recipes concurrently added/changed in another tab. Retrying is idempotent.
          const migrated = new Map(imported.map(item => [item.id, JSON.stringify(item)]));
          storage.setItem(key, JSON.stringify(guests().filter(item => migrated.get(item.id) !== JSON.stringify(item))));
          return true;
        } catch (error) {
          if (same(owner, version)) state.error = "import";
          throw error;
        } finally {
          if (same(owner, version)) { state.busy = false; emit(); }
        }
      }
    };
  }
  return { create, normalize, validId };
});
