/* EcoTekk PWA controller: install experience, standalone navigation and connection status. */
(function () {
  'use strict';
  var root = document.documentElement;
  var body = document.body;
  var deferredInstall = null;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isStandalone) {
    body.classList.add('pwa-installed');
    root.classList.add('pwa-installed-root');
  }

  function node(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function showNotice(message, actionLabel, action) {
    var old = document.querySelector('.pwa-notice');
    if (old) old.remove();
    var notice = node('div', 'pwa-notice');
    notice.setAttribute('role', 'status');
    var copy = node('p', '', message);
    var close = node('button', 'pwa-notice-close', '×');
    close.type = 'button'; close.setAttribute('aria-label', 'Dismiss notice');
    close.addEventListener('click', function () { notice.remove(); });
    notice.append(copy);
    if (actionLabel && action) {
      var act = node('button', 'pwa-notice-action', actionLabel);
      act.type = 'button'; act.addEventListener('click', function () { action(); notice.remove(); });
      notice.append(act);
    }
    notice.append(close);
    body.appendChild(notice);
    window.setTimeout(function () { if (notice.isConnected) notice.classList.add('is-visible'); }, 30);
    window.setTimeout(function () { if (notice.isConnected) notice.remove(); }, 9000);
  }

  function showIOSInstructions() {
    var existing = document.querySelector('.pwa-help-backdrop');
    if (existing) existing.remove();
    var backdrop = node('div', 'pwa-help-backdrop');
    backdrop.setAttribute('role', 'presentation');
    var dialog = node('section', 'pwa-help-dialog');
    dialog.setAttribute('role', 'dialog'); dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'pwa-help-title');
    var close = node('button', 'pwa-help-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close');
    var eyebrow = node('span', 'pwa-help-eyebrow', 'Add to your home screen');
    var title = node('h2', '', 'Install EcoTekk'); title.id = 'pwa-help-title';
    var steps = node('ol', 'pwa-help-steps');
    ['Open the Share menu in Safari.','Scroll down and choose “Add to Home Screen”.','Tap “Add” to place EcoTekk on your home screen.'].forEach(function (step) { steps.appendChild(node('li', '', step)); });
    var note = node('p', 'pwa-help-note', 'This manual installation flow is provided by iOS Safari.');
    close.addEventListener('click', function () { backdrop.remove(); });
    backdrop.addEventListener('click', function (event) { if (event.target === backdrop) backdrop.remove(); });
    dialog.append(close, eyebrow, title, steps, note); backdrop.appendChild(dialog); body.appendChild(backdrop);
    close.focus();
  }

  function createInstallControl() {
    if (isStandalone) return;
    var links = document.getElementById('et-nav-links');
    if (!links || document.getElementById('pwa-install-item')) return;
    var li = node('li'); li.id = 'pwa-install-item';
    var button = node('button', 'pwa-install-button', 'Install app');
    button.type = 'button'; button.id = 'pwa-install-button';
    button.setAttribute('aria-label', 'Install EcoTekk as an app');
    button.addEventListener('click', async function () {
      if (deferredInstall) {
        deferredInstall.prompt();
        try {
          var choice = await deferredInstall.userChoice;
          if (choice && choice.outcome === 'accepted') showNotice('EcoTekk is being added to your device.');
        } catch (_) {}
        deferredInstall = null;
        updateInstallControl();
      } else if (isIOS) {
        showIOSInstructions();
      } else {
        showNotice('Use your browser menu and choose “Install EcoTekk” or “Add to Home screen” when available.');
      }
    });
    li.appendChild(button);
    var themeItem = links.querySelector('#theme-toggle') && links.querySelector('#theme-toggle').closest('li');
    if (themeItem) links.insertBefore(li, themeItem); else links.appendChild(li);
  }

  function updateInstallControl() {
    var li = document.getElementById('pwa-install-item');
    if (!li) return;
    li.hidden = isStandalone;
    var btn = li.querySelector('button');
    if (btn) btn.textContent = deferredInstall ? 'Install EcoTekk' : (isIOS ? 'Add to Home Screen' : 'Install app');
  }

  function createOfflineStatus() {
    var banner = node('div', 'pwa-offline-status');
    banner.setAttribute('role', 'status');
    banner.textContent = 'You are offline. Saved pages and on-device tools may still work; maps, sign-in and cloud updates need internet.';
    banner.hidden = navigator.onLine;
    body.appendChild(banner);
    window.addEventListener('offline', function () { banner.hidden = false; });
    window.addEventListener('online', function () { banner.hidden = true; showNotice('You are back online. EcoTekk can refresh live information.'); });
  }

  function createBottomNav() {
    if (!isStandalone || window.innerWidth > 760 || document.querySelector('.pwa-bottom-nav')) return;
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var links = [
      { href: 'index.html', label: 'Home', icon: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7M5.5 9v12h13V9M9.5 21v-7h5v7"/></svg>', active: path === 'index.html' || path === '' },
      { href: 'explore.html', label: 'Explore', icon: '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 5 5M8 13.5l2-5 4.5 2-2 4.5z"/></svg>', active: path === 'explore.html' },
      { href: 'techhelp.html', label: 'Repair', icon: '<svg viewBox="0 0 24 24"><path d="M14.5 6.2a5 5 0 0 0-6.4 6.4l-5 5a2.1 2.1 0 0 0 3 3l5-5a5 5 0 0 0 6.4-6.4L14 12.7l-3.2-3.2z"/></svg>', active: path === 'techhelp.html' },
      { href: 'home.html', label: 'Recycle', icon: '<svg viewBox="0 0 24 24"><path d="m8 4 3-2 3 2M11 2v6M19 8l3 2-1 4M22 10l-5 3M8 20l-3 2-3-2M5 22v-6M3 8 1 5l2-3M1 5l6 1"/><path d="m8 4 3-2 3 2M16 15l-2 5-5-1"/></svg>', active: path === 'home.html' || path === 'ewaste.html' },
      { href: 'profile.html', label: 'My space', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>', active: path === 'profile.html' || path === 'login.html' }
    ];
    var nav = node('nav', 'pwa-bottom-nav'); nav.setAttribute('aria-label', 'App navigation');
    links.forEach(function (item) {
      var a = node('a', item.active ? 'is-active' : ''); a.href = item.href;
      if (item.active) a.setAttribute('aria-current', 'page');
      var ico = node('span', 'pwa-bottom-icon'); ico.setAttribute('aria-hidden', 'true'); ico.innerHTML = item.icon;
      var label = node('span', 'pwa-bottom-label', item.label);
      a.append(ico, label); nav.appendChild(a);
    });
    body.appendChild(nav);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      showNotice('This browser can use EcoTekk, but does not support offline app installation.');
      return;
    }
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (hadController) showNotice('EcoTekk has been updated.', 'Refresh', function () { location.reload(); });
      hadController = true;
    });
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (registration) {
      // Check for updates when the app returns to the foreground.
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && navigator.onLine) registration.update().catch(function () {});
      });
    }).catch(function () {
      showNotice('Offline support could not be enabled yet. Open EcoTekk over HTTPS and reload.');
    });
  }

  createInstallControl();
  updateInstallControl();
  createOfflineStatus();
  createBottomNav();
  window.addEventListener('resize', function () {
    if (isStandalone) {
      var old = document.querySelector('.pwa-bottom-nav'); if (old) old.remove();
      createBottomNav();
    }
  });

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault(); deferredInstall = event; updateInstallControl();
  });
  window.addEventListener('appinstalled', function () {
    isStandalone = true; body.classList.add('pwa-installed'); root.classList.add('pwa-installed-root');
    updateInstallControl(); createBottomNav(); showNotice('EcoTekk has been installed successfully.');
  });

  if (document.readyState === 'complete') registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker, { once: true });
})();
