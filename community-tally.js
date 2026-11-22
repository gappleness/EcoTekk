/* EcoTekk community tally: the "I went here" counter shared by techhelp.html (repair shops)
   and ewaste.html (drop-offs). Both pages use this one file so they behave identically.

   How it works
   - Counts live in Firestore under the SAME collection the Community pulse on explore.html already uses
     (issueReports), with a prefix per page: "shop-<id>" for repair shops and "dropoff-<id>" for drop-offs.
     That collection's rules are already published and allow exactly what this needs, so no extra rules are
     required. (The earlier version wrote to a separate "shopVisits" collection; if its rules were never
     published in the Firebase console every read was denied, which is why the tally showed "unavailable".)
   - Anyone can read a count. A signed-in member OR a guest (Firebase anonymous session) can add 1, once per
     place. The count and the per-user marker are written together in one batch, as the rules require.
   - The tally is DISPLAY ONLY. It never changes the order or contents of a list.
   - If someone taps "I went here" while signed out, we remember which place they tapped, send them to
     login, and finish the count automatically when they come back, so they don't have to tap twice.

   Usage (see techhelp.js / ewaste.js):
     var tally = EcoTally.create({ prefix: 'shop-', root: listEl, ids: ['a', 'b'] });
     card.appendChild(tally.row('a'));   // after the card is in the DOM, call tally.paintAll() */
(function (global) {
  'use strict';

  var COLLECTION = 'issueReports';
  var PENDING_KEY = 'ecotekk:pendingTally';
  var PENDING_MAX_AGE = 10 * 60 * 1000;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function safeDocId(v) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60);
  }

  function create(opts) {
    var prefix = opts.prefix || '';
    var root = opts.root;
    var ids = (opts.ids || []).slice();
    var page = opts.page || (location.pathname.split('/').pop() || 'index.html');

    function docId(id) { return safeDocId(prefix + id); }

    // Where to come back to after login. login.html only accepts simple same-site paths.
    var returnTo = page + location.search;
    if (!/^[a-z0-9_-]+\.html(\?[a-z0-9_=&%.-]*)?$/i.test(returnTo)) returnTo = page;

    var db = null, auth = null;
    try {
      if (global.firebase && firebase.apps && firebase.apps.length) { db = firebase.firestore(); auth = firebase.auth(); }
    } catch (e) { db = null; auth = null; }

    var user = null, authKnown = !auth; // with no auth there is nothing to wait for
    var counts = {}, reported = {}, busy = {}, failed = {}, notes = {};
    var warned = false;

    /* ---------- DOM ---------- */
    function row(id) {
      var wrap = el('div', 'went-row');
      wrap.setAttribute('data-tally-id', id);
      var cnt = el('div', 'went-count');
      cnt.setAttribute('aria-live', 'polite');
      cnt.append(el('span', 'went-num', '–'), el('span', 'went-label', 'people went here'));
      var btn = el('button', 'went-btn', 'I went here');
      btn.type = 'button';
      wrap.append(cnt, btn, el('p', 'went-msg'));
      return wrap;
    }

    function paint(id) {
      var rows = root.querySelectorAll('[data-tally-id="' + id + '"]');
      rows.forEach(function (r) {
        var num = r.querySelector('.went-num'), lbl = r.querySelector('.went-label');
        var btn = r.querySelector('.went-btn'), msg = r.querySelector('.went-msg');
        var c = counts[id];
        num.textContent = (c === undefined || c === null) ? '–' : c.toLocaleString();
        lbl.textContent = (c === 1) ? 'person went here' : 'people went here';
        btn.classList.remove('is-done');
        btn.textContent = 'I went here';
        r.removeAttribute('data-error');

        if (!db) {
          btn.disabled = true; msg.textContent = 'The tally is not connected on this page yet.'; return;
        }
        if (failed[id]) {
          btn.disabled = true; r.setAttribute('data-error', failed[id]);
          msg.textContent = 'The tally is unavailable right now.'; return;
        }
        if (reported[id]) {
          btn.disabled = true; btn.classList.add('is-done'); btn.textContent = '✓ Counted. Thanks!';
          msg.textContent = notes[id] || ''; return;
        }
        btn.disabled = !!busy[id];
        if (notes[id]) msg.textContent = notes[id];
        else if (authKnown && !user) msg.textContent = 'Sign in or continue as a guest to add yours.';
        else msg.textContent = '';
      });
    }
    function paintAll() { ids.forEach(paint); }

    /* ---------- Firestore ---------- */
    function subscribe() {
      if (!db) return;
      ids.forEach(function (id) {
        db.collection(COLLECTION).doc(docId(id)).onSnapshot(function (snap) {
          failed[id] = null;
          counts[id] = snap.exists ? (Number(snap.data().count) || 0) : 0;
          paint(id);
        }, function (err) {
          failed[id] = (err && err.code) || 'error';
          counts[id] = null;
          if (!warned) {
            warned = true;
            console.error('[EcoTekk tally] Could not read ' + COLLECTION + '/' + docId(id) + ' (' + failed[id] + '). ' +
              (failed[id] === 'permission-denied'
                ? 'Firestore refused the read: publish firestore.rules from this project in Firebase Console > Firestore > Rules.'
                : 'Check the connection and the Firebase config.'), err);
          }
          paint(id);
        });
      });
    }

    // Which places has this user already counted? Resolves when every check has finished.
    function checkReported() {
      if (!db || !user) return Promise.resolve();
      var uid = user.uid;
      return Promise.all(ids.map(function (id) {
        return db.collection(COLLECTION).doc(docId(id)).collection('reporters').doc(uid).get().then(function (snap) {
          if (!user || user.uid !== uid) return;
          if (snap.exists) { reported[id] = true; paint(id); }
        }).catch(function () { /* offline or rules not published: the button will still try on click */ });
      }));
    }

    function add(id) {
      if (!db || !user || reported[id] || busy[id] || failed[id]) return;
      busy[id] = true; notes[id] = 'Adding yours…'; paint(id);
      var ref = db.collection(COLLECTION).doc(docId(id)), uid = user.uid;
      var batch = db.batch();
      batch.set(ref.collection('reporters').doc(uid), { createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      batch.set(ref, { count: firebase.firestore.FieldValue.increment(1) }, { merge: true });
      batch.commit().then(function () {
        busy[id] = false; reported[id] = true; notes[id] = 'Thanks. Your visit was added to the tally.'; paint(id);
      }).catch(function (err) {
        busy[id] = false;
        // A rejected batch usually means this account or guest session already counted this place.
        ref.collection('reporters').doc(uid).get().then(function (s) {
          if (s.exists) { reported[id] = true; notes[id] = 'You already counted this one. Thanks!'; }
          else { notes[id] = 'Could not add yours right now. Please try again later.'; console.error('[EcoTekk tally] write failed', err); }
          paint(id);
        }).catch(function () { notes[id] = 'Could not add yours right now. Please try again later.'; paint(id); });
      });
    }

    /* ---------- "tapped while signed out": remember it, finish after login ---------- */
    function rememberPending(id) {
      try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ page: page, id: id, t: Date.now() })); } catch (e) { /* private mode */ }
    }
    function resumePending() {
      var raw = null, p = null;
      try { raw = sessionStorage.getItem(PENDING_KEY); } catch (e) { return; }
      if (!raw) return;
      try { p = JSON.parse(raw); } catch (e) { p = null; }
      if (!p || p.page !== page) return;           // belongs to another page: leave it alone
      try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* ignore */ }
      if (Date.now() - p.t > PENDING_MAX_AGE || ids.indexOf(p.id) === -1) return;
      if (!user || reported[p.id]) return;
      add(p.id);
    }

    /* ---------- events ---------- */
    root.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.went-btn') : null;
      if (!btn || btn.disabled) return;
      var r = btn.closest('[data-tally-id]');
      if (!r) return;
      var id = r.getAttribute('data-tally-id');
      if (!db || failed[id] || reported[id] || busy[id]) return;
      if (!authKnown) { notes[id] = 'Checking your session… tap again in a moment.'; paint(id); return; }
      if (!user) {
        rememberPending(id);
        location.href = 'login.html?next=' + encodeURIComponent(returnTo);
        return;
      }
      add(id);
    });

    subscribe();
    if (auth) {
      auth.onAuthStateChanged(function (u) {
        user = u || null; authKnown = true; reported = {}; notes = {};
        paintAll();
        checkReported().then(resumePending);
      });
    }

    return { row: row, paintAll: paintAll, connected: !!db };
  }

  global.EcoTally = { create: create };
})(window);
