/* EcoTekk "Did this fix it?" (explore.html).
   After someone tries the steps for a topic, members can say whether it fixed the problem. The answers feed the
   resolved statistics on admin.html. Guests can see the card but not answer.

   Data: resolutions/{uid}__{caseId} = { uid, caseId, category, device, resolved, createdAt, updatedAt }
   One answer per member per topic; they can change it later. */
(function () {
  'use strict';
  var card = document.getElementById('et-resolve');
  var caseSel = document.getElementById('case');
  if (!card || !caseSel) return;

  var topicEl = document.getElementById('et-resolve-topic');
  var yes = document.getElementById('et-resolve-yes'), no = document.getElementById('et-resolve-no');
  var ask = document.getElementById('et-resolve-ask'), statusEl = document.getElementById('et-resolve-status');

  var db = null, auth = null, user = null;
  try { if (window.firebase && firebase.apps && firebase.apps.length) { db = firebase.firestore(); auth = firebase.auth(); } } catch (e) { db = null; }

  var currentId = '', answer = null, busy = false;
  function safeId(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60); }
  function val(id) { var n = document.getElementById(id); return n ? String(n.value || '').slice(0, 40) : ''; }
  function member() { return !!(user && !user.isAnonymous); }

  function paint() {
    yes.setAttribute('aria-pressed', answer === true ? 'true' : 'false');
    no.setAttribute('aria-pressed', answer === false ? 'true' : 'false');
    yes.classList.toggle('on', answer === true); no.classList.toggle('on', answer === false);
    yes.disabled = no.disabled = busy || !db;
    var opt = caseSel.options[caseSel.selectedIndex];
    topicEl.textContent = opt && opt.value ? opt.text : '';
    var q = new URLSearchParams(); q.set('new', '1');
    if (val('device')) q.set('device', val('device'));
    if (val('category')) q.set('category', val('category'));
    if (opt && opt.value) q.set('topic', opt.text.slice(0, 80));
    ask.href = 'forum.html?' + q.toString();
  }

  function load() {
    answer = null;
    if (!db || !member() || !currentId) { paint(); return; }
    var uid = user.uid, id = currentId;
    db.collection('resolutions').doc(uid + '__' + id).get().then(function (s) {
      if (id !== currentId || !user || user.uid !== uid) return;
      answer = s.exists ? !!s.data().resolved : null;
      if (s.exists) statusEl.textContent = answer ? 'You marked this as fixed. Tap “Not yet” if that changes.' : 'You marked this as not fixed yet. Tap “Yes” once it is.';
      paint();
    }).catch(function () { paint(); });
  }

  function sync() {
    var id = safeId(caseSel.value);
    if (id === currentId) { paint(); return; }
    currentId = id; statusEl.textContent = '';
    card.hidden = !id;
    if (!id) return;
    statusEl.textContent = member() ? '' : (user ? 'Guests can view but not answer. Sign in to tell us how it went.' : 'Sign in to tell us how it went.');
    load();
  }

  function save(value) {
    if (!db || !currentId || busy) return;
    if (!member()) { location.href = 'login.html?next=' + encodeURIComponent('explore.html' + location.search); return; }
    var uid = user.uid, id = currentId, FV = firebase.firestore.FieldValue;
    var ref = db.collection('resolutions').doc(uid + '__' + id);
    busy = true; paint(); statusEl.textContent = 'Saving…';
    var op = answer === null
      ? ref.set({ uid: uid, caseId: id, category: val('category'), device: val('device'), resolved: value, createdAt: FV.serverTimestamp(), updatedAt: FV.serverTimestamp() })
      : ref.update({ resolved: value, updatedAt: FV.serverTimestamp() });
    op.then(function () {
      busy = false; answer = value; paint();
      statusEl.textContent = value ? 'Great, glad it’s sorted. Thanks for telling us.' : 'Thanks. If you’re stuck, the community or a repair shop may help.';
    }).catch(function (err) {
      busy = false; paint();
      statusEl.textContent = err && err.code === 'permission-denied' ? 'Could not save. This needs the updated Firestore rules and an account in good standing.' : 'Could not save right now. Please try again later.';
    });
  }

  yes.addEventListener('click', function () { save(true); });
  no.addEventListener('click', function () { save(false); });
  caseSel.addEventListener('change', sync);
  new MutationObserver(function () { setTimeout(sync, 0); }).observe(caseSel, { childList: true });
  window.addEventListener('load', function () { setTimeout(sync, 0); });
  if (auth) auth.onAuthStateChanged(function (u) { user = u || null; currentId = ''; sync(); });
  paint();
})();
