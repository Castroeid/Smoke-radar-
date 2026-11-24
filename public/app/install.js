(() => {
  const button = document.getElementById('installBtn');
  const status = document.getElementById('installStatus');
  const help = document.getElementById('installHelp');
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const embedded = /FBAN|FBAV|Instagram|WhatsApp|; wv\)/i.test(ua);
  const displayMode = window.matchMedia('(display-mode: standalone)');
  let installed = displayMode.matches || navigator.standalone === true;
  let deferredPrompt = null;
  const shareUrl = new URL('/install', window.location.origin).href;
  document.getElementById('installLink').href = shareUrl;
  document.getElementById('installLink').textContent = shareUrl.replace(/^https?:\/\//, '');
  document.getElementById('embeddedHelp').hidden = !embedded;
  const platformHelp = document.getElementById(ios ? 'iosHelp' : /Android/i.test(ua) ? 'androidHelp' : 'desktopHelp');
  function update() {
    button.hidden = installed;
    help.hidden = installed;
    button.disabled = false;
    button.textContent = deferredPrompt ? 'התקנת האפליקציה' : 'איך מתקינים בטלפון?';
    if (installed) status.textContent = 'Smoke Radar מותקנת. אפשר לפתוח אותה ממסך הבית.';
  }
  function showHelp() {
    help.hidden = false;
    platformHelp.open = true;
    help.focus();
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    update();
  });
  window.addEventListener('appinstalled', () => { installed = true; deferredPrompt = null; update(); });
  displayMode.addEventListener?.('change', event => { installed = event.matches || navigator.standalone === true; update(); });
  button.addEventListener('click', async () => {
    if (!deferredPrompt) { showHelp(); return; }
    const prompt = deferredPrompt;
    deferredPrompt = null;
    button.disabled = true;
    try {
      // Call synchronously from the user gesture; each browser prompt is single-use.
      await prompt.prompt();
      const choice = await prompt.userChoice;
      update();
      if (!installed) status.textContent = choice.outcome === 'accepted'
        ? 'בקשת ההתקנה נשלחה לדפדפן. השלימו אותה בחלון שנפתח.'
        : 'אפשר להתקין בהמשך, או להמשיך להשתמש באתר.';
    } catch {
      update();
      status.textContent = 'אפשר להתקין דרך תפריט הדפדפן.';
      showHelp();
    }
  });
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      status.textContent = 'הקישור הועתק. אפשר לשלוח אותו בוואטסאפ או בפייסבוק.';
    } catch {
      status.textContent = 'להעתקה ידנית: לחצו לחיצה ארוכה על הקישור שמופיע כאן.';
    }
  }
  document.getElementById('copyLink').addEventListener('click', copyLink);
  document.getElementById('shareLink').addEventListener('click', async () => {
    if (!navigator.share) { await copyLink(); return; }
    try { await navigator.share({ title: 'Smoke Radar', text: 'Smoke Radar — מתכוני בשר, השראה וקצביות קרובות. להתקנה בטלפון:', url: shareUrl }); }
    catch (error) { if (error.name !== 'AbortError') await copyLink(); }
  });
  update();
})();
