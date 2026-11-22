/* EcoTekk ratings + optional comments for drop-offs (ewaste.html) and repair shops (techhelp.html).
   Mounted by tracker.js on every card:  EcoReviews.mount(hostEl, placeId, placeName, hasVisitedFn)

   Data (see firestore.rules)
   - placeRatings/{placeId}                 { sum, count }   running total, only changed together with a review
   - placeRatings/{placeId}/reviews/{uid}   { rating 1-5, comment (optional, 300 max), name, createdAt, updatedAt }
   placeId is the same id the "I went here" tally uses (dropoff-... / shop-...).

   Who can do what
   - Everyone, including guests: read the average and the comments.
   - Members who tapped "I went here" on that place: rate it, add or edit one optional comment.
   - Admins: remove a review from admin.html.
   Ratings are display only. They never change the order of the list (it stays sorted by distance). */
(function (global) {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function stars(n) { n = Math.max(0, Math.min(5, Math.round(n))); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  var db = null, auth = null, user = null;
  try {
    if (global.firebase && firebase.apps && firebase.apps.length) { db = firebase.firestore(); auth = firebase.auth(); }
  } catch (e) { db = null; auth = null; }

  var places = {};       // id -> { name, hosts: [ui], agg, failed, mine, mineLoaded, wentFn }
  function member() { return !!(user && !user.isAnonymous); }
  function displayName() {
    var u = global.EcotekkAuth && EcotekkAuth.currentUser();
    return ((u && u.name) || 'Member').slice(0, 80);
  }

  /* ---------------- one card's widget ---------------- */
  function build(id) {
    var P = places[id];
    var root = el('div', 'rate-box');
    var head = el('div', 'rate-head');
    var avg = el('span', 'rate-avg', '–');
    var starsEl = el('span', 'rate-stars'); starsEl.setAttribute('aria-hidden', 'true');
    var meta = el('span', 'rate-meta', 'Loading ratings…');
    head.append(starsEl, avg, meta);

    var actions = el('div', 'rate-actions');
    var rateBtn = el('button', 'rate-btn', 'Rate this place'); rateBtn.type = 'button';
    var readBtn = el('button', 'rate-btn ghost', 'Read comments'); readBtn.type = 'button';
    actions.append(rateBtn, readBtn);
    var note = el('p', 'rate-note'); note.setAttribute('role', 'status');

    var form = el('div', 'rate-form'); form.hidden = true;
    var pick = el('div', 'rate-pick'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Your rating out of 5');
    var chosen = 0, starBtns = [];
    for (var i = 1; i <= 5; i++) (function (v) {
      var b = el('button', 'rate-star', '★'); b.type = 'button';
      b.setAttribute('aria-label', v + (v === 1 ? ' star' : ' stars')); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { chosen = v; paintPick(); });
      starBtns.push(b); pick.appendChild(b);
    })(i);
    function paintPick() {
      starBtns.forEach(function (b, idx) { b.classList.toggle('on', idx < chosen); b.setAttribute('aria-pressed', idx + 1 === chosen ? 'true' : 'false'); });
    }
    var cLabel = el('label', 'rate-label', 'Comment (optional)');
    var ta = el('textarea', 'et-input rate-ta'); ta.maxLength = 300; ta.rows = 3;
    ta.placeholder = 'What was it like? Opening hours, what they accepted, how long it took…';
    var taId = 'rate-ta-' + id; ta.id = taId; cLabel.setAttribute('for', taId);
    var counter = el('span', 'rate-count', '0 / 300');
    ta.addEventListener('input', function () { counter.textContent = ta.value.length + ' / 300'; });
    var formActs = el('div', 'rate-actions');
    var save = el('button', 'rate-btn solid', 'Save rating'); save.type = 'button';
    var cancel = el('button', 'rate-btn ghost', 'Cancel'); cancel.type = 'button';
    formActs.append(save, cancel);
    var fmsg = el('p', 'rate-note'); fmsg.setAttribute('role', 'status');
    form.append(pick, cLabel, ta, counter, formActs, fmsg);

    var comments = el('div', 'rate-comments'); comments.hidden = true;

    root.append(head, actions, note, form, comments);

    var ui = { root: root, starsEl: starsEl, avg: avg, meta: meta, note: note, rateBtn: rateBtn,
               form: form, fmsg: fmsg, ta: ta, counter: counter, paintPick: paintPick,
               setChosen: function (n) { chosen = n; paintPick(); } };

    rateBtn.addEventListener('click', function () {
      if (!db) return;
      if (!member()) { location.href = 'login.html?next=' + encodeURIComponent((location.pathname.split('/').pop() || 'index.html') + location.search); return; }
      if (!P.wentFn()) { note.textContent = 'Tap “I went here” on this place first. Only people who went can rate it.'; return; }
      note.textContent = '';
      form.hidden = !form.hidden;
      if (!form.hidden) {
        if (P.mine) { ui.setChosen(P.mine.rating); ta.value = P.mine.comment || ''; save.textContent = 'Update rating'; }
        else { ui.setChosen(0); ta.value = ''; save.textContent = 'Save rating'; }
        counter.textContent = ta.value.length + ' / 300';
        fmsg.textContent = '';
      }
    });
    cancel.addEventListener('click', function () { form.hidden = true; });

    save.addEventListener('click', function () {
      if (!chosen) { fmsg.textContent = 'Pick 1 to 5 stars first.'; return; }
      if (!member() || !P.wentFn()) { fmsg.textContent = 'Tap “I went here” first.'; return; }
      var comment = ta.value.trim().slice(0, 300), uid = user.uid;
      var FV = firebase.firestore.FieldValue;
      var aggRef = db.collection('placeRatings').doc(id), revRef = aggRef.collection('reviews').doc(uid);
      var batch = db.batch(), isEdit = !!P.mine;
      if (isEdit) {
        batch.update(revRef, { rating: chosen, comment: comment, name: displayName(), updatedAt: FV.serverTimestamp() });
        batch.set(aggRef, { sum: FV.increment(chosen - P.mine.rating), count: FV.increment(0) }, { merge: true });
      } else {
        batch.set(revRef, { rating: chosen, comment: comment, name: displayName(), createdAt: FV.serverTimestamp(), updatedAt: FV.serverTimestamp() });
        batch.set(aggRef, { sum: FV.increment(chosen), count: FV.increment(1) }, { merge: true });
      }
      save.disabled = true; fmsg.textContent = 'Saving…';
      batch.commit().then(function () {
        P.mine = { rating: chosen, comment: comment };
        save.disabled = false; form.hidden = true;
        note.textContent = isEdit ? 'Updated. Thanks for keeping it current.' : 'Thanks! Your rating was added.';
        if (!comments.hidden) loadComments(id, comments);
      }).catch(function (err) {
        save.disabled = false;
        console.warn('EcoTekk rating failed', err && err.code);
        loadMine(id).then(function () {
          fmsg.textContent = err && err.code === 'permission-denied'
            ? 'Could not save. Ratings need the updated Firestore rules, an account in good standing, and a counted visit.'
            : 'Could not save right now. Please try again later.';
        });
      });
    });

    readBtn.addEventListener('click', function () {
      comments.hidden = !comments.hidden;
      readBtn.textContent = comments.hidden ? 'Read comments' : 'Hide comments';
      if (!comments.hidden) loadComments(id, comments);
    });

    return ui;
  }

  function loadComments(id, box) {
    box.replaceChildren(el('p', 'rate-note', 'Loading comments…'));
    db.collection('placeRatings').doc(id).collection('reviews').orderBy('createdAt', 'desc').limit(25).get().then(function (snap) {
      box.replaceChildren();
      var shown = 0;
      snap.forEach(function (d) {
        var r = d.data();
        if (!r.comment) return;
        shown++;
        var item = el('div', 'rate-comment');
        var top = el('div', 'rate-comment-top');
        top.append(el('span', 'rate-comment-stars', stars(r.rating)), el('strong', '', r.name || 'Member'));
        if (r.createdAt && r.createdAt.toDate) top.append(el('span', 'rate-comment-date', r.createdAt.toDate().toLocaleDateString('en-PH', { dateStyle: 'medium' })));
        item.append(top, el('p', '', r.comment));
        box.appendChild(item);
      });
      if (!shown) box.appendChild(el('p', 'rate-note', 'No written comments yet. Ratings can be left without one.'));
    }).catch(function () { box.replaceChildren(el('p', 'rate-note', 'Comments are unavailable right now.')); });
  }

  /* ---------------- state -> screen ---------------- */
  function paint(id) {
    var P = places[id]; if (!P) return;
    P.hosts.forEach(function (ui) {
      if (!db) { ui.meta.textContent = 'Ratings are not connected on this page yet.'; ui.rateBtn.disabled = true; return; }
      if (P.failed) { ui.meta.textContent = 'Ratings are unavailable right now.'; ui.rateBtn.disabled = true; return; }
      ui.rateBtn.disabled = false;
      var a = P.agg;
      if (!a || !a.count) { ui.starsEl.textContent = '☆☆☆☆☆'; ui.avg.textContent = ''; ui.meta.textContent = 'No ratings yet'; }
      else {
        var mean = a.sum / a.count;
        ui.starsEl.textContent = stars(mean); ui.avg.textContent = mean.toFixed(1);
        ui.meta.textContent = a.count.toLocaleString() + (a.count === 1 ? ' rating' : ' ratings');
      }
      if (!member()) ui.rateBtn.textContent = 'Sign in to rate';
      else ui.rateBtn.textContent = P.mine ? 'Edit my rating' : 'Rate this place';
    });
  }

  function loadMine(id) {
    var P = places[id];
    if (!db || !member() || !P) return Promise.resolve();
    var uid = user.uid;
    return db.collection('placeRatings').doc(id).collection('reviews').doc(uid).get().then(function (s) {
      if (!user || user.uid !== uid) return;
      P.mine = s.exists ? { rating: s.data().rating, comment: s.data().comment || '' } : null;
      paint(id);
    }).catch(function () { /* offline or rules not published */ });
  }

  function mount(host, id, name, wentFn) {
    host.replaceChildren();
    var P = places[id];
    if (!P) {
      P = places[id] = { name: name, hosts: [], agg: null, failed: false, mine: null, wentFn: wentFn };
      if (db) {
        db.collection('placeRatings').doc(id).onSnapshot(function (snap) {
          P.failed = false; P.agg = snap.exists ? { sum: Number(snap.data().sum) || 0, count: Number(snap.data().count) || 0 } : null; paint(id);
        }, function (err) { console.warn('EcoTekk ratings read failed', id, err && err.code); P.failed = true; paint(id); });
      }
    }
    P.wentFn = wentFn;
    P.hosts = P.hosts.filter(function (u) { return document.body.contains(u.root); });
    var ui = build(id);
    P.hosts.push(ui);
    host.appendChild(ui.root);
    paint(id);
    loadMine(id);
  }

  global.EcoReviews = {
    mount: mount,
    // tracker.js calls this whenever "I went here" state changes, so a stale "tap I went here first" message clears.
    visitChanged: function (id) { var P = places[id]; if (P) P.hosts.forEach(function (u) { if (u.note.textContent.indexOf('I went here') !== -1 && P.wentFn()) u.note.textContent = ''; }); },
    refreshAuth: function () { Object.keys(places).forEach(function (id) { places[id].mine = null; paint(id); loadMine(id); }); }
  };

  if (auth) auth.onAuthStateChanged(function (u) { user = u || null; global.EcoReviews.refreshAuth(); });
})(window);
