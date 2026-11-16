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
  function closeMenu() {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menu.classList.remove('is-open');
  }
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.classList.toggle('is-open', open);
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(); });
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });
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

  // Pointer-following highlights on desktop cards and the hero illustration.
  if (!reduceMotion && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', function (event) {
      var card = event.target.closest && event.target.closest('.et-linkcard, .et-card, .site-card, .p-panel');
      if (card) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--pointer-y', (event.clientY - rect.top) + 'px');
      }
      var visual = event.target.closest && event.target.closest('.hero-visual');
      if (visual) {
        var vr = visual.getBoundingClientRect();
        var px = (event.clientX - vr.left) / Math.max(1, vr.width) - .5;
        var py = (event.clientY - vr.top) / Math.max(1, vr.height) - .5;
        visual.style.setProperty('--tilt-x', (py * -4).toFixed(2) + 'deg');
        visual.style.setProperty('--tilt-y', (px * 5).toFixed(2) + 'deg');
      }
    }, { passive: true });
    document.addEventListener('pointerleave', function (event) {
      if (event.target && event.target.classList && event.target.classList.contains('hero-visual')) {
        event.target.style.removeProperty('--tilt-x');
        event.target.style.removeProperty('--tilt-y');
      }
    }, true);
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
