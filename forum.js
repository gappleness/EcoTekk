/* EcoTekk community forum (forum.html).
   Data (see firestore.rules):
     posts/{id}                { title, body, device, category, authorUid, authorName, createdAt, solved }
     posts/{id}/replies/{rid}  { body, authorUid, authorName, createdAt, helpful }
     userStats/{uid}/credits/{postId_replyId}   written by the ASKER when they mark a reply helpful -> badges.js
   Who can do what: everyone reads. Members post and reply. The asker can mark replies helpful and flip "solved".
   Authors and admins can delete. Guests are view-only. Banned members can read only.
   Views: forum.html (list, filters, composer) and forum.html?post=<id> (thread). All user text goes in via textContent. */
(function () {
  'use strict';
  var view = document.getElementById('forumView');
  var params = new URLSearchParams(location.search);

  var DEVICES = ['Phone', 'Laptop / computer', 'Tablet', 'Smartwatch', 'TV / monitor', 'Printer', 'Router', 'Game console', 'Camera', 'Audio device', 'Cables / chargers', 'Batteries', 'Other'];
  var CATEGORIES = [['power', 'Power / won’t turn on'], ['screen', 'Screen / display'], ['software', 'Software / system'], ['performance', 'Slow device'], ['connectivity', 'Connectivity'], ['charging', 'Charging / battery'], ['reuse', 'Reuse / end of life'], ['accessories', 'Cables / accessories'], ['other', 'Something else']];
  var CAT_LABEL = {}; CATEGORIES.forEach(function (c) { CAT_LABEL[c[0]] = c[1]; });

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function when(ts) { return ts && ts.toDate ? ts.toDate().toLocaleDateString('en-PH', { dateStyle: 'medium' }) : 'just now'; }
  function field(label, control, id) { var w = el('div', 'forum-field'); var l = el('label', '', label); l.setAttribute('for', id); control.id = id; w.append(l, control); return w; }
  function select(options, blank) {
    var s = el('select', 'et-input'); s.append(new Option(blank, ''));
    options.forEach(function (o) { s.append(Array.isArray(o) ? new Option(o[1], o[0]) : new Option(o, o)); });
    return s;
  }

  var db = null, me = null, admin = false, restricted = false;
  try { if (window.firebase && firebase.apps && firebase.apps.length) db = firebase.firestore(); } catch (e) { db = null; }

  function canPost() { return !!(me && !me.isGuest && !restricted); }
  function whyNot() {
    if (!me) return 'Sign in to post or reply. You can read everything without an account.';
    if (me.isGuest) return 'Guests can read the community but not post. Sign in or sign up to join in.';
    if (restricted) return 'Your account has been restricted by a moderator, so posting is turned off. You can still read.';
    return '';
  }
  function gate() {
    var box = el('div', 'forum-gate'); box.append(el('p', '', whyNot()));
    if (!me || me.isGuest) { var a = el('a', 'et-btn', 'Log in / Sign up'); a.href = 'login.html?next=' + encodeURIComponent('forum.html' + location.search); box.append(a); }
    return box;
  }

  /* ------------------------------ list view ------------------------------ */
  function listView() {
    view.replaceChildren();
    var bar = el('div', 'forum-bar');
    var fDev = select(DEVICES, 'Any device'); fDev.setAttribute('aria-label', 'Filter by device');
    var fCat = select(CATEGORIES, 'Any problem'); fCat.setAttribute('aria-label', 'Filter by problem');
    var unsolvedWrap = el('label', 'forum-check'); var unsolved = el('input'); unsolved.type = 'checkbox'; unsolvedWrap.append(unsolved, document.createTextNode(' Unsolved only'));
    var newBtn = el('button', 'et-btn', 'Start a topic'); newBtn.type = 'button';
    bar.append(fDev, fCat, unsolvedWrap, newBtn);

    var composerHost = el('div', 'forum-composer-host');
    var listEl = el('div', 'forum-list'); listEl.append(el('p', 'forum-msg', 'Loading topics…'));
    view.append(bar, composerHost, listEl);

    var posts = [];
    function paint() {
      listEl.replaceChildren();
      var shown = posts.filter(function (p) {
        return (!fDev.value || p.data.device === fDev.value) && (!fCat.value || p.data.category === fCat.value) && (!unsolved.checked || !p.data.solved);
      });
      if (!shown.length) { listEl.append(el('p', 'forum-msg', posts.length ? 'No topics match those filters.' : 'No topics yet. Start the first one.')); return; }
      shown.forEach(function (p) {
        var d = p.data, a = el('a', 'forum-post'); a.href = 'forum.html?post=' + encodeURIComponent(p.id);
        var top = el('div', 'forum-post-top');
        top.append(el('h2', '', d.title));
        if (d.solved) top.append(el('span', 'forum-pill solved', '✓ Solved'));
        var tags = el('div', 'forum-tags');
        if (d.device) tags.append(el('span', 'forum-tag', d.device));
        if (d.category) tags.append(el('span', 'forum-tag', CAT_LABEL[d.category] || d.category));
        var by = el('div', 'forum-by'); by.append(el('span', '', d.authorName || 'Member'), el('span', 'forum-dot', '·'), el('span', '', when(d.createdAt)));
        by.append(window.EcoBadges ? EcoBadges.chip(d.authorUid) : document.createTextNode(''));
        a.append(top, el('p', 'forum-snippet', (d.body || '').slice(0, 160) + ((d.body || '').length > 160 ? '…' : '')), tags, by);
        listEl.append(a);
      });
    }
    [fDev, fCat, unsolved].forEach(function (c) { c.addEventListener('change', paint); });

    function load() {
      if (!db) { listEl.replaceChildren(el('p', 'forum-msg', 'The community is not connected on this page yet.')); return; }
      db.collection('posts').orderBy('createdAt', 'desc').limit(50).get().then(function (snap) {
        posts = []; snap.forEach(function (d) { posts.push({ id: d.id, data: d.data() }); }); paint();
      }).catch(function () { listEl.replaceChildren(el('p', 'forum-msg', 'Could not load topics right now. If this is a new setup, publish the updated Firestore rules.')); });
    }

    function openComposer(pre) {
      composerHost.replaceChildren();
      if (!canPost()) { composerHost.append(gate()); return; }
      var form = el('div', 'et-card forum-composer');
      form.append(el('h2', '', 'Start a topic'));
      var title = el('input', 'et-input'); title.maxLength = 120; title.placeholder = 'One line: what is going on?';
      var dev = select(DEVICES, 'Choose a device'), cat = select(CATEGORIES, 'Choose the problem');
      var body = el('textarea', 'et-input'); body.rows = 6; body.maxLength = 2000; body.placeholder = 'What happened, what you already tried, and the model if you know it. Please leave out passwords and personal details.';
      if (pre) { title.value = pre.title || ''; dev.value = pre.device || ''; cat.value = pre.category || ''; }
      var row = el('div', 'forum-row'); row.append(field('Device', dev, 'fp-dev'), field('Problem', cat, 'fp-cat'));
      var acts = el('div', 'forum-actions'); var post = el('button', 'et-btn', 'Post topic'); post.type = 'button';
      var cancel = el('button', 'et-btn ghost', 'Cancel'); cancel.type = 'button'; acts.append(post, cancel);
      var msg = el('p', 'et-small'); msg.setAttribute('role', 'status');
      form.append(field('Title', title, 'fp-title'), row, field('Details', body, 'fp-body'), acts, msg);
      composerHost.append(form); title.focus();
      cancel.onclick = function () { composerHost.replaceChildren(); };
      post.onclick = function () {
        var t = title.value.trim(), b = body.value.trim();
        if (t.length < 5) { msg.textContent = 'Give the topic a title (at least 5 characters).'; return; }
        if (!b) { msg.textContent = 'Add some details so people can help.'; return; }
        post.disabled = true; msg.textContent = 'Posting…';
        db.collection('posts').add({ title: t, body: b, device: dev.value, category: cat.value, authorUid: me.uid, authorName: me.name.slice(0, 80), createdAt: firebase.firestore.FieldValue.serverTimestamp(), solved: false })
          .then(function (ref) { location.href = 'forum.html?post=' + encodeURIComponent(ref.id); })
          .catch(function () { post.disabled = false; msg.textContent = 'Could not post right now. This needs the updated Firestore rules and an account in good standing.'; });
      };
    }
    newBtn.onclick = function () { openComposer(); };
    if (params.get('new') === '1') {
      openComposer({ title: params.get('topic') || '', device: params.get('device') || '', category: params.get('category') || '' });
    }
    load();
  }

  /* ----------------------------- thread view ----------------------------- */
  function threadView(id) {
    view.replaceChildren();
    var back = el('a', 'forum-back', '← All topics'); back.href = 'forum.html';
    var box = el('div', 'forum-thread'); box.append(el('p', 'forum-msg', 'Loading…'));
    view.append(back, box);
    if (!db) { box.replaceChildren(el('p', 'forum-msg', 'The community is not connected on this page yet.')); return; }
    var postRef = db.collection('posts').doc(id);

    function render(post, replies) {
      box.replaceChildren();
      var isAsker = !!(me && !me.isGuest && post.authorUid === me.uid);
      var card = el('article', 'et-card forum-op');
      var top = el('div', 'forum-post-top'); top.append(el('h2', '', post.title));
      if (post.solved) top.append(el('span', 'forum-pill solved', '✓ Solved'));
      var tags = el('div', 'forum-tags');
      if (post.device) tags.append(el('span', 'forum-tag', post.device));
      if (post.category) tags.append(el('span', 'forum-tag', CAT_LABEL[post.category] || post.category));
      var by = el('div', 'forum-by'); by.append(el('span', '', post.authorName || 'Member'), el('span', 'forum-dot', '·'), el('span', '', when(post.createdAt)));
      by.append(EcoBadges.chip(post.authorUid));
      card.append(top, tags, by, el('p', 'forum-body', post.body));
      var tools = el('div', 'forum-actions');
      if (isAsker || admin) {
        var solve = el('button', 'et-btn ghost', post.solved ? 'Mark as not solved' : 'Mark as solved'); solve.type = 'button';
        solve.onclick = function () { solve.disabled = true; postRef.update({ solved: !post.solved }).then(load).catch(function () { solve.disabled = false; solve.textContent = 'Could not update'; }); };
        tools.append(solve);
      }
      if ((me && !me.isGuest && post.authorUid === me.uid) || admin) {
        var del = el('button', 'et-btn ghost danger', 'Delete topic'); del.type = 'button';
        del.onclick = function () {
          if (!confirm('Delete this topic?')) return;
          del.disabled = true;
          var b = db.batch();
          if (admin) replies.forEach(function (r) { b.delete(postRef.collection('replies').doc(r.id)); });
          b.delete(postRef);
          b.commit().then(function () { location.href = 'forum.html'; }).catch(function () { del.disabled = false; del.textContent = 'Could not delete'; });
        };
        tools.append(del);
      }
      if (tools.children.length) card.append(tools);
      box.append(card);

      box.append(el('h3', 'forum-replies-title', replies.length + (replies.length === 1 ? ' reply' : ' replies')));
      replies.forEach(function (r) {
        var d = r.data, item = el('div', 'forum-reply' + (d.helpful ? ' is-helpful' : ''));
        var rb = el('div', 'forum-by'); rb.append(el('strong', '', d.authorName || 'Member'), el('span', 'forum-dot', '·'), el('span', '', when(d.createdAt)), EcoBadges.chip(d.authorUid));
        if (d.helpful) rb.append(el('span', 'forum-pill solved', '✓ Marked helpful'));
        item.append(rb, el('p', 'forum-body', d.body));
        var ra = el('div', 'forum-actions');
        if (isAsker && !d.helpful && d.authorUid !== me.uid && !restricted) {
          var help = el('button', 'et-btn ghost', 'This helped'); help.type = 'button';
          help.onclick = function () {
            help.disabled = true; help.textContent = 'Saving…';
            var b = db.batch(), rref = postRef.collection('replies').doc(r.id);
            b.update(rref, { helpful: true });
            b.set(db.collection('userStats').doc(d.authorUid).collection('credits').doc(id + '_' + r.id), { postId: id, replyId: r.id, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            b.commit().then(function () { EcoBadges.forget(d.authorUid); load(); }).catch(function () { help.disabled = false; help.textContent = 'Could not save. Try again.'; });
          };
          ra.append(help);
        }
        if ((me && !me.isGuest && d.authorUid === me.uid) || admin) {
          var rd = el('button', 'et-btn ghost danger', 'Delete'); rd.type = 'button';
          rd.onclick = function () { if (!confirm('Delete this reply?')) return; rd.disabled = true; postRef.collection('replies').doc(r.id).delete().then(load).catch(function () { rd.disabled = false; rd.textContent = 'Could not delete'; }); };
          ra.append(rd);
        }
        if (ra.children.length) item.append(ra);
        box.append(item);
      });

      if (!canPost()) { box.append(gate()); return; }
      var form = el('div', 'et-card forum-composer');
      var ta = el('textarea', 'et-input'); ta.rows = 4; ta.maxLength = 1500; ta.placeholder = 'Share what worked, or ask a follow-up question.';
      var send = el('button', 'et-btn', 'Post reply'); send.type = 'button';
      var msg = el('p', 'et-small'); msg.setAttribute('role', 'status');
      form.append(field('Your reply', ta, 'fr-body'), send, msg);
      box.append(form);
      send.onclick = function () {
        var t = ta.value.trim(); if (!t) { msg.textContent = 'Write something first.'; return; }
        send.disabled = true; msg.textContent = 'Posting…';
        postRef.collection('replies').add({ body: t, authorUid: me.uid, authorName: me.name.slice(0, 80), createdAt: firebase.firestore.FieldValue.serverTimestamp(), helpful: false })
          .then(load).catch(function () { send.disabled = false; msg.textContent = 'Could not post right now. This needs the updated Firestore rules and an account in good standing.'; });
      };
    }

    function load() {
      postRef.get().then(function (s) {
        if (!s.exists) { box.replaceChildren(el('p', 'forum-msg', 'That topic no longer exists.')); return; }
        var post = s.data(); document.title = 'EcoTekk | ' + post.title.slice(0, 60);
        return postRef.collection('replies').orderBy('createdAt', 'asc').limit(100).get().then(function (rs) {
          var replies = []; rs.forEach(function (d) { replies.push({ id: d.id, data: d.data() }); }); render(post, replies);
        });
      }).catch(function () { box.replaceChildren(el('p', 'forum-msg', 'Could not load this topic right now.')); });
    }
    load();
  }

  /* -------------------------------- boot -------------------------------- */
  if (!window.EcotekkAuth) { view.replaceChildren(el('p', 'forum-msg', 'Sign-in is not available on this page.')); return; }
  EcotekkAuth.ready.then(function () {
    me = EcotekkAuth.currentUser();
    return Promise.all([EcotekkAuth.isAdmin(), EcotekkAuth.isRestricted()]);
  }).then(function (r) {
    admin = !!r[0]; restricted = !!r[1];
    var id = params.get('post');
    if (id && /^[A-Za-z0-9]{1,40}$/.test(id)) threadView(id); else listView();
  }).catch(function () { view.replaceChildren(el('p', 'forum-msg', 'Could not start the community page. Please refresh.')); });
})();
