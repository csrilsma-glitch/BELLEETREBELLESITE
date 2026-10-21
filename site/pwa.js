(() => {
  // Installation de B&R APP (manifeste /app/). Sur Android Chrome, le clic déclenche directement la fenêtre native.
  let deferred = null;
  const button = document.getElementById('install-app');
  const status = document.getElementById('install-status');
  const dialog = document.getElementById('install-dialog');
  const instructions = document.getElementById('install-instructions');
  // Dans la coque B&R APP (iframe /app/), aucune proposition d'installation n'est affichée.
  const embedded = window.self !== window.top || /[?&]source=pwa(&|$)/.test(location.search);
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  if (embedded) {
    const section = document.querySelector('.installation');
    if (section) section.hidden = true;
    if (dialog) dialog.hidden = true;
  }

  function refresh() {
    if (!button) return;
    button.textContent = installed() ? 'Application déjà installée' : 'Installer B&R APP';
  }

  // Chrome envoie l'événement une fois l'installation possible ; on le garde pour prompt() au clic.
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferred = event;
    refresh();
    if (waiting) { waiting = false; launch(); }
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    if (status) status.textContent = 'B&R APP est installée sur votre appareil ♡';
    refresh();
  });

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      // Le service worker racine reste inchangé ; celui de /app/ couvre la PWA B&R APP.
      navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
        .then(registration => registration.update())
        .catch(() => { if (status) status.textContent = 'L’installation n’est pas disponible dans ce navigateur.'; });
      navigator.serviceWorker.register('app/sw.js', { scope: 'app/', updateViaCache: 'none' }).catch(() => {});
    });
  }

  if (!button || !dialog || embedded) { refresh(); return; }

  let waiting = false;
  let waitTimer = null;

  // prompt() doit être appelé pendant le geste de l'utilisateur (quelques secondes après le clic).
  function launch() {
    const event = deferred;
    deferred = null;
    if (!event) return showFallback();
    try {
      event.prompt();
      if (status) status.textContent = 'Confirmez l’installation de B&R APP dans la fenêtre de Chrome.';
      event.userChoice.then(choice => {
        if (status) status.textContent = choice.outcome === 'accepted'
          ? 'B&R APP s’installe sur votre appareil ♡'
          : 'Vous pourrez installer B&R APP plus tard.';
        refresh();
      }).catch(() => {});
    } catch (error) {
      showFallback();
    }
  }

  function deviceInstructions() {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) return 'Sur iPhone ou iPad, ouvrez cette page dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».';
    if (/Android/i.test(ua)) return 'Chrome ne propose pas encore l’installation directe sur cet appareil. Patientez quelques secondes puis touchez à nouveau le bouton.';
    return 'Sur ordinateur, ouvrez cette page dans Chrome ou Edge, puis cliquez sur l’icône d’installation de la barre d’adresse.';
  }

  function showFallback() {
    if (status) status.textContent = '';
    if (instructions) instructions.textContent = deviceInstructions();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  button.addEventListener('click', () => {
    if (installed()) {
      if (status) status.textContent = 'Retrouvez B&R APP depuis l’icône de votre écran d’accueil.';
      return;
    }
    if (deferred) { launch(); return; }
    // Chrome peut envoyer l'événement juste après le clic : on attend brièvement, dans le délai du geste.
    waiting = true;
    if (status) status.textContent = 'Préparation de l’installation…';
    clearTimeout(waitTimer);
    waitTimer = setTimeout(() => {
      if (waiting) { waiting = false; showFallback(); }
    }, 3000);
  });

  document.getElementById('install-close').addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    button.focus();
  });

  refresh();
})();
