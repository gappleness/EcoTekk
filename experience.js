/* EcoTekk motion + navigation layer. Presentation only: application workflows remain in their original modules. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll progress indicator.
  var progress = document.createElement('div');
  progress.className = 'et-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  body.appendChild(progress);
  var progressBar = progress.firstElementChild;
  var scrollPending = false;
  function updateScroll() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var amount = Math.min(1, Math.max(0, window.scrollY / max));
    progressBar.style.transform = 'scaleX(' + amount + ')';
    progress.classList.toggle('is-scrolled', window.scrollY > 80);
    scrollPending = false;
  }
  window.addEventListener('scroll', function () {
    if (!scrollPending) {
      scrollPending = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  // Active route and responsive navigation.
  var currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.et-nav-links a[href]').forEach(function (link) {
    var target = link.getAttribute('href').split('?')[0].toLowerCase();
    var isActive = target === currentFile || (currentFile === 'ewaste.html' && target === 'home.html');
    if (isActive) link.setAttribute('aria-current', 'page');
    else if (link.getAttribute('aria-current') === 'page') link.removeAttribute('aria-current');
  });

  var menuButton = document.getElementById('nav-menu-toggle');
  var menu = document.getElementById('et-nav-links');
  var backdrop = null;
  function setMenu(open) {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    root.classList.toggle('nav-open', open);
  }
  function closeMenu(returnFocus) {
    var wasOpen = menu && menu.classList.contains('is-open');
    setMenu(false);
    if (wasOpen && returnFocus && menuButton) menuButton.focus();
  }
  if (menuButton && menu) {
    // Dimmed backdrop lives inside the nav so it stacks under the drawer but over the page.
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    menuButton.parentNode.parentNode.insertBefore(backdrop, menuButton.parentNode);
    backdrop.addEventListener('click', function () { closeMenu(true); });

    menuButton.addEventListener('click', function () {
      var open = menuButton.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open) { var first = menu.querySelector('a, button'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60); }
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(true); });
  }

  // Reveal elements on entry and stagger cards. The observer also watches content inserted by the tracker.
  var revealSelector = '[data-reveal], .et-section .section-header, .et-linkcard, .workflow-step, .site-card, .p-panel, .p-hero, .map-frame, .tracker-action, .tracker-hero, .login-box, .et-article > .et-card';
  function prepareReveal(scope) {
    if (!scope || !scope.querySelectorAll) return;
    var nodes = [];
    if (scope.matches && scope.matches(revealSelector)) nodes.push(scope);
    nodes = nodes.concat(Array.prototype.slice.call(scope.querySelectorAll(revealSelector)));
    nodes.forEach(function (node, index) {
      if (reduceMotion) { node.classList.add('is-visible'); return; }
      if (!node.hasAttribute('data-reveal')) node.setAttribute('data-reveal', '');
      if (!node.style.getPropertyValue('--reveal-delay') && (node.classList.contains('et-linkcard') || node.classList.contains('workflow-step'))) {
        node.style.setProperty('--reveal-delay', (index % 3) * 90 + 'ms');
      }
      if (node.dataset.revealReady) return;
      node.dataset.revealReady = '1';
      observer.observe(node);
    });
  }
  var observer = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' }) : null;
  if (observer) {
    prepareReveal(body);
    var mutationObserver = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) prepareReveal(node);
        });
      });
    });
    mutationObserver.observe(body, { childList: true, subtree: true });
  } else {
    document.querySelectorAll(revealSelector).forEach(function (node) { node.classList.add('is-visible'); });
  }

  // Pointer-following highlight on desktop cards. Throttled to one update per frame.
  if (!reduceMotion && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pending = null, ticking = false;
    document.addEventListener('pointermove', function (event) {
      var card = event.target.closest && event.target.closest('.et-linkcard, .et-card, .site-card, .p-panel');
      if (!card) return;
      pending = { card: card, x: event.clientX, y: event.clientY };
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        if (!pending) return;
        var rect = pending.card.getBoundingClientRect();
        pending.card.style.setProperty('--pointer-x', (pending.x - rect.left) + 'px');
        pending.card.style.setProperty('--pointer-y', (pending.y - rect.top) + 'px');
        pending = null;
      });
    }, { passive: true });
  }

  // Small scroll-to-top control on longer pages.
  var topButton = document.createElement('button');
  topButton.type = 'button';
  topButton.className = 'et-top-button';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.innerHTML = '<span aria-hidden="true">↑</span>';
  body.appendChild(topButton);
  topButton.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  function syncTopButton() { topButton.classList.toggle('is-visible', window.scrollY > 480); }
  window.addEventListener('scroll', syncTopButton, { passive: true });
  syncTopButton();

  // Loading overlay remains controlled by the geolocation workflow. Add a no-JS safety timeout only to the visuals.
  root.classList.add('ecotekk-ready');
})();
