# Direct web installation

Share https://smoke-radar.onrender.com/install. This redirect opens the public
`/app/install.html` page inside the app's manifest and service worker scope.
The home screen also links there. No Play Store listing, APK or testing group is
required. This is an installed web app, not a native APK distribution.

- Android Chromium: use `beforeinstallprompt` only after the browser supplies it,
  and call `prompt()` from a user click. Consume once, handle dismissal/errors,
  and wait for `appinstalled` before claiming completion. Browser engagement,
  settings, existing installs and in-app browsers may suppress the event.
- iOS/iPadOS: show Share → Add to Home Screen instructions, using Safari as the
  supported path. The browser controls installation, not application JavaScript.
- Facebook/Instagram/WhatsApp embedded browsers: offer external-browser/copy-link
  guidance. UA detection is a convenience; platform instructions also remain
  accessible. No third-party shortener or account is required.
- Icons are build-sized copies of the existing `og-preview.jpg` brand asset.
  Manifest ID/start URL remains `/app/`; standalone launch opens the normal app.
- The service worker caches **only** a public offline notice. It does not cache
  generated recipes, API responses, Firebase/auth traffic or application bundles.
  App navigation uses the network first, and fresh code is served online. An
  installed icon does not promise full offline functionality.
- Google sign-in and cloud recipe syncing retain the existing implementation.
  In a browser or install with separate storage, users must sign into the same
  Google account; guest recipes are not automatically moved between browsers.

Verification: `NODE_PATH=<QA dependencies containing jsdom> node --test tests/*.cjs`.
Install-flow tests cover unsupported browsers, iPhone/Android help, prompt
cancellation/retry, installed state, sharing, icon sizes and offline-worker scope.
Real OS installation should also be checked on physical Android and iPhone;
a desktop preview alone cannot verify home-screen behavior on those devices.

References reviewed 2026-11-24:
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- https://web.dev/articles/install-criteria
