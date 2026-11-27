(() => {
  if (location.hostname !== 'smoke-radar.onrender.com') return;
  try {
    if (localStorage.getItem('smoke_radar_internal_tester') === 'true') return;
  } catch {
    // An unavailable storage API must never interfere with opening the app.
    return;
  }
  const analytics = window.initSmokeRadarPostHog?.({
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    capture_heatmaps: false,
    person_profiles: 'never'
  });
  if (!analytics) return;

  let screen = null;
  let view = null;
  let visibleSince = null;

  function resume() {
    if (!screen || document.visibilityState !== 'visible' || visibleSince !== null) return;
    visibleSince = performance.now();
    if (view) return;
    const path = screen === 'install' ? '/app/install.html' : '/app/' + screen;
    view = {
      screen: screen,
      screen_view_id: crypto.randomUUID(),
      $pathname: path,
      $current_url: location.origin + path
    };
    analytics.capture('$pageview', view);
  }

  function pause() {
    if (visibleSince === null) return;
    const visibleMs = Math.round(performance.now() - visibleSince);
    visibleSince = null;
    analytics.capture('app_screen_time', { ...view, visible_ms: visibleMs }, {
      send_instantly: true,
      transport: 'sendBeacon'
    });
  }

  window.trackSmokeRadarScreen = function (nextScreen) {
    if (screen === nextScreen) return;
    pause();
    screen = nextScreen;
    view = null;
    resume();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resume();
    else pause();
  });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', resume);

  const initialScreen = document.currentScript.dataset.screen;
  if (initialScreen) window.trackSmokeRadarScreen(initialScreen);
})();
