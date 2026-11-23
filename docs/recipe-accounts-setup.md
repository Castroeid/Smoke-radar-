# Recipe accounts: Google + Facebook

Account support is disabled until Firebase, its security rules, and both OAuth
providers have been configured. The existing device-only recipe library continues
to work. No service-account private key or provider secret belongs in this repo.

## 1. Firebase project

Open https://console.firebase.google.com/ using the Google account that owns
Smoke Radar. If it is absent, use **Add Firebase to Google Cloud project** and
select the existing project ID `smoke-radar`; creating a second Cloud project is
unnecessary. Register a **Web app** in Firebase's project settings and retain its
web configuration. Firebase Hosting is not needed: Render still hosts this app.

Create a Cloud Firestore **Standard / Native mode** database. Select an appropriate
location and use production/locked rules initially. Publish the contents of
[`../firestore.rules`](../firestore.rules) in Firestore → Rules before enabling
accounts. These rules apply only to `/users/{uid}/recipes/{recipeId}` and reject
anonymous and other-user access. If this Firebase project already has other
applications, merge these scoped rules with their rules instead of replacing
unrelated rules.

Firebase inherits the existing project's billing settings. Review current
Firebase/Firestore pricing and quotas; this feature does not guarantee free usage.

## 2. Authentication providers

Under Firebase Authentication, enable Google and select the project's support
email. Add `smoke-radar.onrender.com` to Authentication's authorized domains.
If a custom site domain is introduced later, authorize it too.

For Facebook, create/configure a Meta developer app for Facebook Login. In
Firebase Authentication's Facebook provider settings, enter the Meta **App ID**
and **App Secret**, and copy the callback URL Firebase shows. Add that exact URL
to Facebook Login's Valid OAuth Redirect URIs. It normally has this form:

```
https://<your-firebase-auth-domain>/__/auth/handler
```

Use the live homepage `https://smoke-radar.onrender.com/app/` and the public privacy
and deletion-instructions URL `https://smoke-radar.onrender.com/app/privacy.html`.
Complete Meta's current public-release requirements so people outside app roles
can sign in. Do not present development-mode-only login as publicly available.
Keep each provider's secret only in its appropriate console.

Firebase's one-account-per-email setting should remain enabled. If an email was
already registered through another provider, the UI directs the user to their
original method; this implementation does not silently merge separate identities.

## 3. Render configuration

Add these environment variables to the existing Smoke Radar service:

| Variable | Value |
| --- | --- |
| `FIREBASE_WEB_CONFIG` | A JSON object with the Web app's `apiKey`, `authDomain`, `projectId`, `appId`. Copy from Firebase's Web app configuration. |
| `RECIPE_AUTH_PROVIDERS` | `google,facebook` |
| `RECIPE_ACCOUNTS_ENABLED` | `true`, after rules and both providers are configured |

The Firebase web key identifies this app and is intentionally exposed through
`/api/recipe-account-config`. It is **not** the server-only Google Places API key.
Do not reuse the Places key or put an Admin SDK service-account JSON in this
variable. The endpoint allowlists only the four public web fields.

Redeploy Render after updating the environment. Until the enable flag is set, the
endpoint responds with `{"enabled":false}` and no login buttons are displayed.

## Behavior and verification

- Guests retain recipes under the original `smoke_radar_saved_recipes_v1`
  browser storage key. Clearing that browser's storage can remove guest recipes.
- Signed-in recipes are stored in the user's own Firestore path. The app does not
  keep a second cloud recipe cache in shared localStorage. Firebase manages the
  sign-in session, using local persistence with a session-only fallback.
- Signing in does not upload guest recipes automatically. **Move device recipes
  into this account** explicitly imports them; local copies are removed only
  after successful writes. Failures retain the local recipes for retry.
- Sign-out/account switching clears the previous account's recipe list and any
  opened recipe. Stale asynchronous reads cannot restore another user's data.
- Firestore Lite requires a connection for cloud operations. The UI acknowledges
  a save only after it succeeds. Use **Refresh recipes** to load changes made on
  another device.
- Google/Facebook use a popup. In-app Facebook/WhatsApp browsers may block OAuth;
  open the site in Chrome or Safari. Provider errors are handled without deleting
  recipes. A cancelled login keeps the guest experience.
- Users can delete individual recipes, or **Account settings → Delete account
  and all its recipes**. Deletion reauthenticates first, deletes Firestore recipes,
  then deletes the Firebase user. If it fails partway, the account remains so the
  user can retry; do not claim atomic deletion.

Before opening sign-in to users, test Google and Facebook with actual non-admin
accounts, including mobile Chrome/Safari. Save a recipe in browser A, sign into
the same account in browser B and confirm it loads. Test sign-out, a second
account, failed network operations, explicit guest import, and account deletion.
These external-provider checks require the owner's console configuration and
cannot be replaced by local unit tests.

## Automated checks

```
node --check server.js
node --check public/app/app.js
node --test tests/*.cjs
```

Install `jsdom` as an optional development dependency (or include it in the QA
directory's `NODE_PATH`) to run `tests/recipe-ui.cjs`. This exercises the complete
app DOM, local saving, account-library switching, and escaped recipe rendering;
it is not a live Google/Facebook OAuth or visual browser test.

The Firestore ownership test skips unless `FIRESTORE_EMULATOR_HOST` is set. To run
it against the local demo project, install `firebase`, `firebase-tools`, and
`@firebase/rules-unit-testing` as development dependencies (or in an isolated QA
directory and set `NODE_PATH` to its node_modules), then run:

```
firebase emulators:exec --project demo-smoke-radar --only firestore "node --test tests/firestore-rules.cjs"
```

The emulator tests owner read/write/delete, other-user denial, anonymous denial,
collection queries, and invalid/oversized payloads. They never access production.

References: [Firebase with an existing Cloud project](https://firebase.google.com/docs/projects/use-firebase-with-existing-cloud-project),
[Google](https://firebase.google.com/docs/auth/web/google-signin),
[Facebook](https://firebase.google.com/docs/auth/web/facebook-login),
[Firestore rules](https://firebase.google.com/docs/firestore/security/rules-conditions).
