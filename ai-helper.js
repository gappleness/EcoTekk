/* EcoTekk AI helper (Gemini through Firebase AI Logic). Loaded on ewaste.html and techhelp.html only.

   - No Gemini API key in this repo. Firebase AI Logic keeps it server-side; App Check verifies requests from this web app.
   - Uses the free Gemini Developer API tier, so it stays on the Firebase Spark plan. Models are listed in
     firebase-config.js (window.ECOTEKK_AI.models) and tried in order if one is unavailable or out of quota.
   - Members only (guests are view-only). A soft per-browser hourly limit protects the shared free quota.
   - The Firebase AI SDK is loaded lazily on the first question, so the page itself loads exactly as before. */
(function () {
  'use strict';
  var cfg = window.ECOTEKK_AI || {};
  if (cfg.enabled === false) return;

  var SDK = 'https://www.gstatic.com/firebasejs/12.5.0/';
  var isShop = document.body.classList.contains('page-techhelp');
  var PAGE = isShop ? 'Tech Help (repair shops and brand service centers)' : 'Drop-off Finder (e-waste collection points)';
  var CHIPS = isShop
    ? ['Repair or replace my laptop?', 'What should I ask a repair shop first?', 'How do I back up and wipe my phone before repair?']
    : ['What can I put in a mall e-waste bin?', 'How do I prepare an old phone for recycling?', 'My battery is swollen. Is it safe to carry?'];

  var SYSTEM = [
    'You are the EcoTekk helper, a friendly assistant inside the EcoTekk website. EcoTekk helps people in the Philippines (default area: Calamba, Laguna) check, repair, reuse and responsibly recycle electronics.',
    'You are on the ' + PAGE + ' page.',
    'Only help with: troubleshooting consumer electronics, choosing between repair / reuse / recycling, preparing devices (backup, sign-out, factory reset, removing SIM and memory cards), what kinds of e-waste public drop-offs usually accept, and how to use this page.',
    'If asked about anything else, politely say you can only help with electronics, repair and e-waste.',
    'Be concise: usually under 120 words, plain language, short lists when steps help. No tables. No headings.',
    'NEVER invent addresses, phone numbers, prices, opening hours, or whether a specific place accepts a specific item. The page lists real places: point people to those listings and tell them to call ahead to confirm.',
    'Safety first: for swollen, hot, leaking or damaged lithium batteries, tell them to stop using the device, not to charge, puncture or squeeze it, and to take it to a proper battery drop-off. Never walk anyone through opening sealed batteries or mains-powered devices; suggest a professional.',
    'Never ask for passwords, OTP codes, card numbers or other personal data, and tell users not to share them.',
    'You are an AI and can be wrong. When unsure, say so.'
  ].join('\n');

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }

  /* ---------------- UI ---------------- */
  var fab = el('button', 'ai-fab'); fab.type = 'button'; fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'ai-panel');
  fab.append(el('span', 'ai-fab-spark', '✦'), el('span', 'ai-fab-text', 'Ask EcoTekk AI'));

  var panel = el('section', 'ai-panel'); panel.id = 'ai-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'EcoTekk AI helper');
  var head = el('div', 'ai-head');
  var title = el('div'); title.append(el('strong', '', 'EcoTekk AI'), el('small', '', 'Powered by Gemini · free tier'));
  var close = el('button', 'ai-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close the AI helper');
  head.append(title, close);

  var log = el('div', 'ai-log'); log.setAttribute('aria-live', 'polite');
  var chipRow = el('div', 'ai-chips');
  var form = el('form', 'ai-form'); form.noValidate = true;
  var input = el('textarea', 'ai-input'); input.rows = 1; input.maxLength = 500; input.placeholder = 'Ask about repairs, reuse or recycling…'; input.setAttribute('aria-label', 'Your question');
  var send = el('button', 'ai-send', 'Send'); send.type = 'submit';
  form.append(input, send);
  var foot = el('p', 'ai-foot', 'AI can be wrong. Always call the place to confirm hours and what they accept. Don’t share passwords or personal details.');
  panel.append(head, log, chipRow, form, foot);
  document.body.append(fab, panel);

  function bubble(role) { var b = el('div', 'ai-msg ' + role); log.append(b); log.scrollTop = log.scrollHeight; return b; }
  // Tiny, safe formatter: paragraphs, "- " bullets and **bold**, all via textContent (never innerHTML).
  function renderText(target, text) {
    target.replaceChildren();
    var list = null;
    text.split('\n').forEach(function (line) {
      var m = line.match(/^\s*[-*•]\s+(.*)$/), t = m ? m[1] : line.trim();
      if (!t) { list = null; return; }
      var host;
      if (m) { if (!list) { list = el('ul'); target.append(list); } host = el('li'); list.append(host); }
      else { list = null; host = el('p'); target.append(host); }
      t.split('**').forEach(function (part, i) { host.append(i % 2 ? el('strong', '', part) : document.createTextNode(part)); });
    });
  }
  function say(role, text) { var b = bubble(role); if (role === 'bot') renderText(b, text); else b.textContent = text; return b; }

  function greet() {
    log.replaceChildren();
    var a = EcotekkAuth.currentUser();
    say('bot', a && !a.isGuest
      ? 'Hi' + (a.name ? ', ' + a.name.split(' ')[0] : '') + '! Ask me about fixing, reusing or recycling a device. I can’t see your device, so tell me the make and what’s happening.'
      : 'Hi! Ask me about fixing, reusing or recycling a device.');
    chipRow.replaceChildren();
    CHIPS.forEach(function (c) { var b = el('button', 'ai-chip', c); b.type = 'button'; b.onclick = function () { ask(c); }; chipRow.append(b); });
  }

  /* ---------------- gate + limits ---------------- */
  function member() { var u = window.EcotekkAuth && EcotekkAuth.currentUser(); return !!(u && !u.isGuest); }
  function gateMessage() {
    log.replaceChildren(); chipRow.replaceChildren(); form.hidden = true;
    var u = window.EcotekkAuth && EcotekkAuth.currentUser();
    var box = el('div', 'ai-gate');
    box.append(el('p', '', u && u.isGuest ? 'The AI helper is for members. Guests can browse everything else.' : 'Sign in to use the AI helper.'));
    var a = el('a', 'ai-gate-link', 'Log in / Sign up'); a.href = 'login.html?next=' + encodeURIComponent((location.pathname.split('/').pop() || 'index.html') + location.search);
    box.append(a); log.append(box);
  }
  var KEY = 'ecotekk.ai.calls.v1', last = 0;
  function withinLimit() {
    var now = Date.now(), cap = cfg.maxPerHour || 20, calls = [];
    try { calls = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (t) { return now - t < 36e5; }); } catch (e) { calls = []; }
    if (now - last < 2500) return 'Give me a moment before the next question.';
    if (calls.length >= cap) return 'That’s the hourly limit for this browser (' + cap + ' questions). It keeps the free quota fair for everyone. Try again a little later.';
    calls.push(now); last = now;
    try { localStorage.setItem(KEY, JSON.stringify(calls)); } catch (e) { /* storage blocked */ }
    return '';
  }

  /* ---------------- context from the page ---------------- */
  function pageContext() {
    var bits = [];
    document.querySelectorAll('select[data-filter]').forEach(function (s) {
      if (s.value) { var o = s.options[s.selectedIndex]; bits.push((s.previousElementSibling && s.previousElementSibling.textContent || s.getAttribute('data-filter')) + ': ' + (o ? o.text : s.value)); }
    });
    var names = []; document.querySelectorAll('.site-card h2').forEach(function (h, i) { if (i < 8) names.push(h.textContent); });
    return (bits.length ? 'Active filters: ' + bits.join('; ') + '. ' : 'No filters set. ') + (names.length ? 'Nearest listings shown: ' + names.join('; ') + '.' : '');
  }

  /* ---------------- Gemini via Firebase AI Logic ---------------- */
  var sdk = null, chat = null, modelIdx = 0;
  function loadSdk() {
    if (sdk) return sdk;
    sdk = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-ai.js'), cfg.appCheckSiteKey ? import(SDK + 'firebase-app-check.js') : Promise.resolve(null)])
      .then(function (m) {
        var app = m[0].initializeApp(window.ECOTEKK_FIREBASE_CONFIG, 'ecotekk-ai');
        if (cfg.appCheckSiteKey && m[2]) m[2].initializeAppCheck(app, { provider: new m[2].ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
        return { ai: m[1].getAI(app, { backend: new m[1].GoogleAIBackend() }), getModel: m[1].getGenerativeModel };
      });
    sdk.catch(function () { sdk = null; });
    return sdk;
  }
  function newChat(s) {
    var models = cfg.models && cfg.models.length ? cfg.models : ['gemini-2.5-flash-lite'];
    var model = s.getModel(s.ai, { model: models[Math.min(modelIdx, models.length - 1)], systemInstruction: SYSTEM, generationConfig: { maxOutputTokens: 600, temperature: 0.5 } });
    return model.startChat({ history: [] });
  }
  function explain(err) {
    var t = String((err && (err.code || '')) + ' ' + (err && err.message || '')).toLowerCase();
    if (t.indexOf('quota') !== -1 || t.indexOf('429') !== -1 || t.indexOf('resource') !== -1) return 'The free AI quota is used up for now. Please try again later.';
    if (t.indexOf('app-check') !== -1 || t.indexOf('appcheck') !== -1 || t.indexOf('403') !== -1 || t.indexOf('permission') !== -1) return 'The AI helper isn’t switched on for this site yet (it needs AI Logic and App Check set up in the Firebase console).';
    if (t.indexOf('network') !== -1 || t.indexOf('fetch') !== -1) return 'Couldn’t reach the AI service. Check your connection and try again.';
    if (t.indexOf('safety') !== -1 || t.indexOf('blocked') !== -1) return 'I can’t help with that one. Try rephrasing, or ask about repair, reuse or recycling.';
    return 'Something went wrong with the AI helper. Please try again in a moment.';
  }

  var busy = false;
  function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (!member()) { gateMessage(); return; }
    var limit = withinLimit(); if (limit) { say('bot', limit); return; }
    chipRow.replaceChildren();
    say('user', text); input.value = ''; autosize();
    busy = true; send.disabled = true;
    var pending = bubble('bot'); pending.classList.add('thinking'); pending.textContent = 'Thinking…';
    var models = cfg.models && cfg.models.length ? cfg.models : [''];
    function attempt() {
      return loadSdk().then(function (s) {
        if (!chat) chat = newChat(s);
        return chat.sendMessage('[Page context: ' + pageContext() + ']\n\nQuestion: ' + text);
      }).then(function (res) { return res.response.text(); }).catch(function (err) {
        chat = null;
        if (modelIdx < models.length - 1) { modelIdx++; return attempt(); }
        throw err;
      });
    }
    attempt().then(function (reply) {
      pending.classList.remove('thinking'); renderText(pending, reply || 'I don’t have an answer for that. Try rephrasing.');
    }).catch(function (err) {
      console.warn('EcoTekk AI error', err); modelIdx = 0;
      pending.classList.remove('thinking'); pending.classList.add('error'); pending.textContent = explain(err);
    }).then(function () { busy = false; send.disabled = false; log.scrollTop = log.scrollHeight; input.focus(); });
  }

  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });

  function open() {
    panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); fab.hidden = true;
    EcotekkAuth.ready.then(function () {
      if (!member()) { gateMessage(); return; }
      form.hidden = false; if (!log.children.length || log.querySelector('.ai-gate')) greet(); input.focus();
    });
  }
  function shut() { panel.hidden = true; fab.hidden = false; fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
  fab.addEventListener('click', open); close.addEventListener('click', shut);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) shut(); });
  window.EcoAI = { open: open };
})();
