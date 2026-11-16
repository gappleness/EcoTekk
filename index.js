/* Landing page behaviour: themed animated pickers, quick-start routing, and loop animation pausing. */
(function () {
  'use strict';
  var pickers = [];
  function closeAll(except) { pickers.forEach(function (p) { if (p !== except) p.close(); }); }

  /* ---------- Custom picker: replaces a native <select> but keeps it in sync (and as a no-JS fallback) ---------- */
  function enhance(select, opts) {
    var options = Array.prototype.slice.call(select.options).filter(function (o) { return o.value !== ''; });
    var placeholder = select.options[0] ? select.options[0].textContent : 'Choose';
    var cols = opts.cols || 1;
    var uid = 'pick-' + select.id;

    var wrap = document.createElement('div'); wrap.className = 'pick'; wrap.setAttribute('data-cols', cols);
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pick-btn is-placeholder';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', uid);
    var label = document.createElement('span'); label.className = 'pick-label'; label.textContent = placeholder;
    btn.appendChild(label);
    btn.insertAdjacentHTML('beforeend', '<svg class="pick-chev" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>');

    var panel = document.createElement('div'); panel.className = 'pick-panel'; panel.id = uid;
    var cap = document.createElement('p'); cap.className = 'pick-cap'; cap.textContent = opts.caption; panel.appendChild(cap);
    var list = document.createElement('ul'); list.className = 'pick-list'; list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', opts.caption);
    var glide = document.createElement('span'); glide.className = 'pick-glide'; glide.setAttribute('aria-hidden', 'true'); list.appendChild(glide);
    var items = options.map(function (o, i) {
      var li = document.createElement('li'); li.className = 'pick-opt'; li.setAttribute('role', 'option'); li.tabIndex = -1;
      li.setAttribute('data-value', o.value); li.style.setProperty('--i', i); li.setAttribute('aria-selected', 'false');
      li.innerHTML = '<span></span><svg viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5.4 4.4 8.6 11 1.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      li.firstChild.textContent = o.textContent;
      list.appendChild(li); return li;
    });
    panel.appendChild(list);
    wrap.append(btn, panel);
    select.parentNode.insertBefore(wrap, select);
    select.classList.add('pick-native'); select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');

    var api = { el: wrap, btn: btn, isOpen: false };
    function moveGlide(li) {
      if (!li) { glide.style.opacity = '0'; return; }
      glide.style.opacity = '1';
      glide.style.width = li.offsetWidth + 'px'; glide.style.height = li.offsetHeight + 'px';
      glide.style.transform = 'translate(' + li.offsetLeft + 'px,' + li.offsetTop + 'px)';
    }
    function current() { return items.filter(function (li) { return li.getAttribute('data-value') === select.value; })[0] || null; }
    function paint() {
      var cur = current();
      label.textContent = cur ? cur.firstChild.textContent : placeholder;
      btn.classList.toggle('is-placeholder', !cur);
      items.forEach(function (li) { li.setAttribute('aria-selected', String(li === cur)); });
      wrap.classList.remove('is-invalid');
    }
    api.open = function () {
      closeAll(api); api.isOpen = true;
      wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      var cur = current() || items[0];
      requestAnimationFrame(function () { moveGlide(cur); });
      setTimeout(function () { if (cur) cur.focus({ preventScroll: true }); }, 30);
    };
    api.close = function (returnFocus) {
      if (!api.isOpen) return; api.isOpen = false;
      wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    };
    api.invalid = function () { wrap.classList.remove('is-invalid'); void wrap.offsetWidth; wrap.classList.add('is-invalid'); };
    function choose(li) {
      select.value = li.getAttribute('data-value');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      paint(); api.close(true);
    }
    btn.addEventListener('click', function () { api.isOpen ? api.close(true) : api.open(); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); api.open(); } });
    items.forEach(function (li) {
      li.addEventListener('click', function () { choose(li); });
      li.addEventListener('pointerenter', function () { moveGlide(li); });
      li.addEventListener('focus', function () { moveGlide(li); });
    });
    list.addEventListener('pointerleave', function () { moveGlide(document.activeElement && items.indexOf(document.activeElement) !== -1 ? document.activeElement : current()); });
    panel.addEventListener('keydown', function (e) {
      var i = items.indexOf(document.activeElement); if (i < 0) return;
      var k = e.key, n = items.length, next = null;
      if (k === 'ArrowDown') next = Math.min(n - 1, i + cols);
      else if (k === 'ArrowUp') next = Math.max(0, i - cols);
      else if (k === 'ArrowRight') next = Math.min(n - 1, i + 1);
      else if (k === 'ArrowLeft') next = Math.max(0, i - 1);
      else if (k === 'Home') next = 0; else if (k === 'End') next = n - 1;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(items[i]); return; }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(true); return; }
      else if (k === 'Tab') { api.close(false); return; }
      if (next !== null) { e.preventDefault(); items[next].focus({ preventScroll: true }); }
    });
    select.addEventListener('change', paint);
    paint();
    pickers.push(api);
    return api;
  }

  var device = document.getElementById('qs-device'), problem = document.getElementById('qs-category');
  var pDevice = device ? enhance(device, { cols: 2, caption: 'Pick your device' }) : null;
  var pProblem = problem ? enhance(problem, { cols: 1, caption: 'What is going on?' }) : null;
  document.addEventListener('click', function (e) { if (!e.target.closest('.pick')) closeAll(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

  /* ---------- Quick start: send device + problem to the explorer (it reads both from the URL) ---------- */
  var form = document.getElementById('quickstart'), msg = document.getElementById('qs-msg');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = device.value, c = problem.value;
    if (!d || !c) {
      if (!d && pDevice) pDevice.invalid(); if (!c && pProblem) pProblem.invalid();
      msg.textContent = !d && !c ? 'Pick your device and the problem first.' : !d ? 'Pick your device first.' : 'Pick the problem first.';
      return;
    }
    location.href = 'explore.html?' + new URLSearchParams({ category: c, device: d }).toString();
  });

  /* ---------- Loop animation: only run while the hero is on screen ---------- */
  var loop = document.querySelector('.loop');
  if (loop && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      loop.classList.toggle('is-paused', !entries[0].isIntersecting);
    }, { threshold: 0.05 }).observe(loop);
  }
})();
