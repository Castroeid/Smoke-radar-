// Loaded only when recipe accounts have been configured and explicitly enabled.
// Firebase web configuration is public; authorization is enforced by Firestore rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence,
  onAuthStateChanged, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut, reauthenticateWithPopup, deleteUser }
  from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore-lite.js";

export async function connect({ config, providers, store, onUser, lang, signal }) {
  const ensureActive = () => { if (signal?.aborted) throw new Error("account-initialization-cancelled"); };
  ensureActive();
  const app = initializeApp(config, "smoke-radar-recipes");
  const auth = getAuth(app);
  auth.languageCode = lang;
  try { await setPersistence(auth, browserLocalPersistence); }
  catch { ensureActive(); await setPersistence(auth, browserSessionPersistence); }
  ensureActive();
  const db = getFirestore(app);
  function owned(uid) {
    if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error("account-changed");
    return collection(db, "users", uid, "recipes");
  }
  store.configure({
    async list(uid) {
      const response = await getDocs(owned(uid));
      return response.docs.map(item => ({ ...JSON.parse(item.data().payload), id: item.id }));
    },
    async put(uid, recipe) {
      await setDoc(doc(owned(uid), recipe.id), { payload: JSON.stringify(recipe), updatedAt: serverTimestamp(), schemaVersion: 1 });
    },
    async remove(uid, id) { await deleteDoc(doc(owned(uid), id)); }
  });
  let first = true;
  await new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    const cancel = () => { unsubscribe(); reject(new Error("account-initialization-cancelled")); };
    signal?.addEventListener("abort", cancel, { once: true });
    unsubscribe = onAuthStateChanged(auth, user => {
      if (signal?.aborted) return;
      onUser(user);
      // Keep the listener after successful initialization for account changes.
      // A timed-out initialization must never replace the device recipe library.
      store.setUser(user);
      if (first) { first = false; signal?.removeEventListener("abort", cancel); resolve(); }
    }, error => {
      unsubscribe(); signal?.removeEventListener("abort", cancel); reject(error);
    });
    if (signal?.aborted) cancel();
  });
  ensureActive();
  return {
    login(provider) {
      if (!providers.includes(provider)) throw new Error("provider-disabled");
      const selected = provider === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();
      if (provider === "google") selected.setCustomParameters({ prompt: "select_account" });
      return signInWithPopup(auth, selected);
    },
    logout() { return signOut(auth); },
    async deleteAccount() {
      const user = auth.currentUser;
      if (!user) throw new Error("sign-in-required");
      const provider = user.providerData.some(item => item.providerId === "google.com")
        ? new GoogleAuthProvider() : new FacebookAuthProvider();
      // Reauthenticate before deleting any data. A cancelled popup leaves it intact.
      await reauthenticateWithPopup(user, provider);
      const recipes = await getDocs(owned(user.uid));
      for (const recipe of recipes.docs) {
        owned(user.uid);
        await deleteDoc(recipe.ref);
      }
      owned(user.uid);
      await deleteUser(user);
    }
  };
}
