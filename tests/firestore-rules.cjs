// Run with Firebase's local emulator (see docs/recipe-accounts-setup.md).
// Ordinary node tests skip this suite when no emulator was explicitly selected.
const { test } = require('node:test');
const fs = require('node:fs');

test('Firestore enforces recipe ownership, field validation, and anonymous denial', { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async () => {
  const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
  const { doc, collection, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } = require('firebase/firestore');
  const env = await initializeTestEnvironment({ projectId: 'demo-smoke-radar', firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') } });
  try {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    const anonymous = env.unauthenticatedContext().firestore();
    const payload = () => ({ payload: JSON.stringify({ id: 'recipe-1', title: 'Dinner' }), schemaVersion: 1, updatedAt: serverTimestamp() });
    const path = 'users/alice/recipes/recipe-1';
    await assertSucceeds(setDoc(doc(alice, path), payload()));
    await assertSucceeds(getDoc(doc(alice, path)));
    await assertSucceeds(getDocs(collection(alice, 'users/alice/recipes')));
    await assertFails(getDoc(doc(bob, path)));
    await assertFails(getDocs(collection(bob, 'users/alice/recipes')));
    await assertFails(setDoc(doc(bob, path), payload()));
    await assertFails(deleteDoc(doc(bob, path)));
    await assertFails(getDoc(doc(anonymous, path)));
    await assertFails(setDoc(doc(anonymous, path), payload()));
    await assertFails(setDoc(doc(alice, 'users/alice/recipes/bad'), { ...payload(), admin: true }));
    await assertFails(setDoc(doc(alice, 'users/alice/recipes/large'), { ...payload(), payload: 'x'.repeat(200001) }));
    await assertFails(setDoc(doc(alice, 'users/alice'), { admin: true }));
    await assertSucceeds(deleteDoc(doc(alice, path)));
  } finally { await env.cleanup(); }
});
