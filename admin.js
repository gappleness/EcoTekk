/* EcoTekk admin dashboard (admin.html).
   Only people with a document at admins/{uid} can read what this page loads. The page checks that first, but the real
   protection is firestore.rules: a non-admin who opens this page just gets "permission denied" from every query.

   Tabs: Overview (statistics) · Members (restrict / admin role) · Reviews (moderate) · Community (moderate) · Resolved
   All lists are capped (LIMIT) to keep reads small on the free plan; a "+" after a number means "at least this many". */
(function () {
  'use strict';
  var LIMIT = 500;
  var root = document.getElementById('adminRoot'), lead = document.getElementById('adminLead');
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function num(n, capped) { return n.toLocaleString() + (capped ? '+' : ''); }
  function day(ts) { return ts && ts.toDate ? ts.toDate().toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '–'; }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '–'; }

  var db = null, me = null;
  try { if (window.firebase && firebase.apps && firebase.apps.length) db = firebase.firestore(); } catch (e) { db = null; }
  var data = {};   // profiles, admins, bans, posts, reports, resolutions, reviews

  function load(name, query) {
    return query.get().then(function (s) { var rows = []; s.forEach(function (d) { rows.push({ id: d.id, ref: d.ref, data: d.data() }); }); data[name] = rows; })
      .catch(function (e) { console.warn('admin load failed:', name, e && e.code); data[name] = []; data[name + 'Failed'] = true; });
  }
  function loadAll() {
    return Promise.all([
      load('profiles', db.collection('profiles').limit(LIMIT)),
      load('admins', db.collection('admins').limit(100)),
      load('bans', db.collection('bans').limit(LIMIT)),
      load('posts', db.collection('posts').orderBy('createdAt', 'desc').limit(LIMIT)),
      load('reports', db.collection('issueReports').limit(LIMIT)),
      load('resolutions', db.collection('resolutions').limit(1000)),
      load('reviews', db.collectionGroup('reviews').limit(LIMIT))
    ]);
  }

  function statCard(value, label, sub) {
    var c = el('div', 'admin-stat'); c.append(el('strong', '', value), el('span', '', label)); if (sub) c.append(el('small', '', sub)); return c;
  }
  function bars(rows, fmt) {
    var wrap = el('div', 'admin-bars'), max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    rows.forEach(function (r) {
      var line = el('div', 'admin-bar'); line.append(el('span', 'admin-bar-label', r.label));
      var track = el('div', 'admin-bar-track'), fill = el('div', 'admin-bar-fill'); fill.style.width = Math.max(2, r.value / max * 100) + '%'; track.append(fill);
      line.append(track, el('span', 'admin-bar-val', fmt ? fmt(r) : String(r.value))); wrap.append(line);
    });
    if (!rows.length) wrap.append(el('p', 'admin-empty', 'Nothing to show yet.'));
    return wrap;
  }
  function panel(title, sub) { var p = el('section', 'et-card admin-panel'); p.append(el('h2', '', title)); if (sub) p.append(el('p', 'et-small', sub)); return p; }
  function failedNote(names) {
    var bad = names.filter(function (n) { return data[n + 'Failed']; });
    return bad.length ? el('p', 'admin-warn', 'Could not read: ' + bad.join(', ') + '. Publish the updated firestore.rules and make sure this account has an admins/{uid} document.') : null;
  }

  /* ----------------------------- Overview ----------------------------- */
  function overview() {
    var box = el('div'), w = failedNote(['profiles', 'reports', 'posts', 'resolutions', 'reviews']); if (w) box.append(w);
    var profiles = data.profiles, posts = data.posts, resolutions = data.resolutions;
    var visits = 0, issues = 0, places = [], topics = [];
    data.reports.forEach(function (r) {
      var c = Number(r.data.count) || 0;
      if (/^(dropoff|shop)-/.test(r.id)) { visits += c; places.push({ label: r.id.replace(/^(dropoff|shop)-/, '').replace(/-/g, ' '), kind: r.id.split('-')[0], value: c }); }
      else { issues += c; topics.push({ label: r.id.replace(/-/g, ' '), value: c }); }
    });
    var fixed = resolutions.filter(function (r) { return r.data.resolved === true; }).length;
    var grid = el('div', 'admin-stats');
    grid.append(
      statCard(num(profiles.length, profiles.length >= LIMIT), 'Members', num(data.admins.length) + ' admin' + (data.admins.length === 1 ? '' : 's') + ' · ' + num(data.bans.length) + ' restricted'),
      statCard(num(visits), '“I went here” counts', 'across drop-offs and repair shops'),
      statCard(num(issues), '“I have this issue” counts', 'across device topics'),
      statCard(num(data.reviews.length, data.reviews.length >= LIMIT), 'Ratings', num(data.reviews.filter(function (r) { return r.data.comment; }).length) + ' with a comment'),
      statCard(num(posts.length, posts.length >= LIMIT), 'Forum topics', num(posts.filter(function (p) { return p.data.solved; }).length) + ' solved'),
      statCard(pct(fixed, resolutions.length), 'Reported as fixed', num(resolutions.length) + ' answers to “Did this fix it?”')
    );
    box.append(grid);

    var weeks = [], now = Date.now(), WEEK = 7 * 864e5;
    for (var i = 7; i >= 0; i--) weeks.push({ start: now - (i + 1) * WEEK, end: now - i * WEEK, label: i === 0 ? 'This week' : i + 'w ago', value: 0 });
    profiles.forEach(function (p) { var t = p.data.createdAt && p.data.createdAt.toDate ? p.data.createdAt.toDate().getTime() : 0; weeks.forEach(function (wk) { if (t > wk.start && t <= wk.end) wk.value++; }); });
    var p1 = panel('New members per week', 'Last 8 weeks, from profile creation dates.'); p1.append(bars(weeks));
    var p2 = panel('Most-visited places', 'By “I went here” count.'); p2.append(bars(places.sort(function (a, b) { return b.value - a.value; }).slice(0, 6), function (r) { return r.value + (r.kind === 'shop' ? ' · shop' : ' · drop-off'); }));
    var p3 = panel('Most-shared problems', 'By “I have this issue too” count.'); p3.append(bars(topics.sort(function (a, b) { return b.value - a.value; }).slice(0, 6)));
    var two = el('div', 'admin-two'); two.append(p2, p3);
    box.append(p1, two);
    return box;
  }

  /* ------------------------------ Members ------------------------------ */
  function members() {
    var box = el('div'), w = failedNote(['profiles', 'admins', 'bans']); if (w) box.append(w);
    var adminSet = {}, banSet = {};
    data.admins.forEach(function (a) { adminSet[a.id] = true; }); data.bans.forEach(function (b) { banSet[b.id] = b.data; });
    var p = panel('Members', 'Restricting a member stops them from rating, posting, replying and counting visits. They can still read everything. Guests are anonymous sessions and are not listed here.');
    var search = el('input', 'et-input'); search.type = 'search'; search.placeholder = 'Search by name or email'; search.setAttribute('aria-label', 'Search members');
    var tableWrap = el('div', 'admin-table-wrap'); p.append(search, tableWrap);
    function paint() {
      var q = search.value.trim().toLowerCase();
      var t = el('table', 'admin-table'), thead = el('thead'), hr = el('tr');
      ['Name', 'Email', 'Joined', 'Status', ''].forEach(function (h) { hr.append(el('th', '', h)); }); thead.append(hr); t.append(thead);
      var tb = el('tbody');
      data.profiles.filter(function (r) { return !q || (String(r.data.name).toLowerCase() + ' ' + String(r.data.email).toLowerCase()).indexOf(q) !== -1; })
        .sort(function (a, b) { return (b.data.createdAt && b.data.createdAt.seconds || 0) - (a.data.createdAt && a.data.createdAt.seconds || 0); })
        .forEach(function (r) {
          var tr = el('tr'), isMe = r.id === me.uid, isAdm = !!adminSet[r.id], ban = banSet[r.id];
          tr.append(el('td', '', r.data.name || '–'), el('td', '', r.data.email || '–'), el('td', '', day(r.data.createdAt)));
          var st = el('td'); st.append(el('span', 'admin-pill ' + (isAdm ? 'admin' : ban ? 'banned' : ''), isAdm ? 'Admin' : ban ? 'Restricted' : 'Member')); tr.append(st);
          var act = el('td', 'admin-actions');
          if (!isMe) {
            if (!isAdm) {
              var rb = el('button', 'admin-btn', ban ? 'Lift restriction' : 'Restrict'); rb.type = 'button';
              rb.onclick = function () {
                rb.disabled = true;
                var op = ban ? db.collection('bans').doc(r.id).delete()
                  : db.collection('bans').doc(r.id).set({ createdAt: firebase.firestore.FieldValue.serverTimestamp(), by: me.uid, reason: (prompt('Reason (optional, shown only to admins):') || '').slice(0, 200) });
                op.then(function () { return refresh('members'); }).catch(function () { rb.disabled = false; rb.textContent = 'Failed'; });
              };
              act.append(rb);
            }
            if (!ban) {
              var ab = el('button', 'admin-btn', isAdm ? 'Remove admin' : 'Make admin'); ab.type = 'button';
              ab.onclick = function () {
                if (!confirm(isAdm ? 'Remove admin access for ' + r.data.name + '?' : 'Give ' + r.data.name + ' full admin access?')) return;
                ab.disabled = true;
                var op = isAdm ? db.collection('admins').doc(r.id).delete() : db.collection('admins').doc(r.id).set({ createdAt: firebase.firestore.FieldValue.serverTimestamp(), by: me.uid });
                op.then(function () { return refresh('members'); }).catch(function () { ab.disabled = false; ab.textContent = 'Failed'; });
              };
              act.append(ab);
            }
          } else act.append(el('small', '', 'You'));
          tr.append(act); tb.append(tr);
        });
      t.append(tb); tableWrap.replaceChildren(t);
      if (!tb.children.length) tableWrap.append(el('p', 'admin-empty', 'No members match.'));
    }
    search.addEventListener('input', paint); paint();
    box.append(p); return box;
  }

  /* ------------------------------ Reviews ------------------------------ */
  function reviews() {
    var box = el('div'), w = failedNote(['reviews']); if (w) box.append(w);
    var p = panel('Ratings and comments', 'Newest first. Deleting a review also corrects that place’s average.');
    var rows = data.reviews.slice().sort(function (a, b) { return (b.data.updatedAt && b.data.updatedAt.seconds || 0) - (a.data.updatedAt && a.data.updatedAt.seconds || 0); }).slice(0, 100);
    if (!rows.length) p.append(el('p', 'admin-empty', 'No ratings yet.'));
    rows.forEach(function (r) {
      var d = r.data, placeRef = r.ref.parent.parent, placeId = placeRef ? placeRef.id : '?';
      var item = el('div', 'admin-item'), top = el('div', 'admin-item-top');
      top.append(el('strong', '', placeId.replace(/^(dropoff|shop)-/, '').replace(/-/g, ' ')), el('span', 'admin-stars', '★'.repeat(d.rating) + '☆'.repeat(5 - d.rating)), el('span', 'admin-meta', (d.name || 'Member') + ' · ' + day(d.updatedAt)));
      item.append(top); if (d.comment) item.append(el('p', '', d.comment));
      var del = el('button', 'admin-btn danger', 'Delete review'); del.type = 'button';
      del.onclick = function () {
        if (!confirm('Delete this review?')) return; del.disabled = true;
        var b = db.batch(), FV = firebase.firestore.FieldValue;
        b.delete(r.ref); b.update(placeRef, { sum: FV.increment(-d.rating), count: FV.increment(-1) });
        b.commit().then(function () { return refresh('reviews'); }).catch(function () { del.disabled = false; del.textContent = 'Failed'; });
      };
      item.append(del); p.append(item);
    });
    box.append(p); return box;
  }

  /* ------------------------------ Community ------------------------------ */
  function community() {
    var box = el('div'), w = failedNote(['posts']); if (w) box.append(w);
    var p = panel('Forum topics', 'Open a topic to moderate individual replies. Deleting a topic here removes its replies too.');
    if (!data.posts.length) p.append(el('p', 'admin-empty', 'No topics yet.'));
    data.posts.slice(0, 100).forEach(function (r) {
      var d = r.data, item = el('div', 'admin-item'), top = el('div', 'admin-item-top');
      var a = el('a', '', d.title); a.href = 'forum.html?post=' + encodeURIComponent(r.id);
      top.append(a, el('span', 'admin-pill ' + (d.solved ? 'admin' : ''), d.solved ? 'Solved' : 'Open'), el('span', 'admin-meta', (d.authorName || 'Member') + ' · ' + day(d.createdAt)));
      item.append(top, el('p', '', (d.body || '').slice(0, 200)));
      var del = el('button', 'admin-btn danger', 'Delete topic'); del.type = 'button';
      del.onclick = function () {
        if (!confirm('Delete this topic and its replies?')) return; del.disabled = true;
        r.ref.collection('replies').get().then(function (rs) {
          var b = db.batch(); rs.forEach(function (x) { b.delete(x.ref); }); b.delete(r.ref); return b.commit();
        }).then(function () { return refresh('community'); }).catch(function () { del.disabled = false; del.textContent = 'Failed'; });
      };
      item.append(del); p.append(item);
    });
    box.append(p); return box;
  }

  /* ------------------------------ Resolved ------------------------------ */
  function resolved() {
    var box = el('div'), w = failedNote(['resolutions']); if (w) box.append(w);
    var all = data.resolutions, yes = all.filter(function (r) { return r.data.resolved === true; }).length;
    var grid = el('div', 'admin-stats');
    grid.append(statCard(pct(yes, all.length), 'Fixed after trying the steps', num(yes) + ' of ' + num(all.length) + ' answers'), statCard(num(all.length - yes), 'Still not fixed', 'candidates for forum help or repair'));
    box.append(grid);
    function group(key, label) {
      var m = {}; all.forEach(function (r) { var k = r.data[key] || 'Unspecified'; (m[k] = m[k] || { y: 0, n: 0 })[r.data.resolved ? 'y' : 'n']++; });
      var rows = Object.keys(m).map(function (k) { var t = m[k].y + m[k].n; return { label: k, value: Math.round(m[k].y / t * 100), y: m[k].y, t: t }; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 8);
      var p = panel('Fix rate by ' + label, 'Share of answers that said it was fixed (answers in brackets).');
      p.append(bars(rows, function (r) { return r.value + '% (' + r.t + ')'; })); return p;
    }
    var stuck = {}; all.forEach(function (r) { if (!r.data.resolved) stuck[r.data.caseId] = (stuck[r.data.caseId] || 0) + 1; });
    var sp = panel('Topics people are still stuck on', 'Most “Not yet” answers. Good candidates for better guidance.');
    sp.append(bars(Object.keys(stuck).map(function (k) { return { label: k.replace(/-/g, ' '), value: stuck[k] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8)));
    var two = el('div', 'admin-two'); two.append(group('category', 'problem type'), group('device', 'device'));
    box.append(two, sp); return box;
  }

  /* -------------------------------- shell -------------------------------- */
  /* ------------------------------ My profile ------------------------------ */
  // Admins land here instead of profile.html: the same account, badges and activity view, shared from profile.js.
  function myProfile() {
    var box = el('div', 'admin-profile');
    if (window.EcoProfile) window.EcoProfile.mount(box, { embedded: true });
    else box.append(el('p', 'admin-empty', 'The profile view could not load. Please refresh.'));
    return box;
  }

  var TABS = [['profile', 'My profile', myProfile], ['overview', 'Overview', overview], ['members', 'Members', members], ['reviews', 'Reviews', reviews], ['community', 'Community', community], ['resolved', 'Resolved', resolved]];
  var current = 'overview', body = el('div', 'admin-body');
  function show(id) {
    current = id; location.hash = id;
    Array.prototype.forEach.call(tabs.children, function (b) { var on = b.getAttribute('data-tab') === id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.classList.toggle('on', on); });
    var t = TABS.filter(function (x) { return x[0] === id; })[0]; body.replaceChildren(t[2]());
  }
  function refresh(id) { body.replaceChildren(el('p', 'admin-empty', 'Refreshing…')); return loadAll().then(function () { show(id || current); }); }
  window.addEventListener('hashchange', function () {
    var h = location.hash.replace('#', '');
    if (h !== current && body.parentNode && TABS.some(function (t) { return t[0] === h; })) show(h);
  });
  var tabs = el('div', 'admin-tabs'); tabs.setAttribute('role', 'tablist');
  TABS.forEach(function (t) { var b = el('button', 'admin-tab', t[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-tab', t[0]); b.onclick = function () { show(t[0]); }; tabs.append(b); });
  var reload = el('button', 'admin-btn', 'Refresh data'); reload.type = 'button'; reload.onclick = function () { refresh(); };
  var bar = el('div', 'admin-bar-row'); bar.append(tabs, reload);

  if (!window.EcotekkAuth || !db) { lead.textContent = 'Firebase is not connected on this page.'; return; }
  EcotekkAuth.ready.then(function () {
    me = EcotekkAuth.currentUser();
    if (!me || me.isGuest) { lead.textContent = 'Sign in with an admin account to see this page.'; var a = el('a', 'et-btn', 'Log in'); a.href = 'login.html?next=admin.html'; root.append(a); return; }
    return EcotekkAuth.isAdmin().then(function (yes) {
      if (!yes) {
        lead.textContent = 'This page is for EcoTekk admins. Your account does not have admin access.';
        // Work out WHY, so setup problems are easy to fix. (isAdmin() hides the reason on purpose.)
        var why = el('div', 'et-card admin-panel'); why.append(el('h2', '', 'Why am I seeing this?'));
        var line = el('p', 'et-small', 'Checking…'); why.append(line);
        var info = el('p', 'et-small', 'Signed in as ' + (me.email || me.name) + ' · UID: ' + me.uid); why.append(info);
        root.append(why);
        db.collection('admins').doc(me.uid).get().then(function (snap) {
          line.textContent = snap.exists
            ? 'The admins document exists, but the rules did not accept it. Re-publish firestore.rules (the whole file) in Firebase console > Firestore > Rules, then hard refresh.'
            : 'No document at admins/' + me.uid + '. In Firebase console > Firestore, the admins collection needs a document whose ID is exactly the UID above (copy it from Authentication > Users). Also check you are signed in with the right account.';
        }).catch(function (e) {
          line.textContent = e && e.code === 'permission-denied'
            ? 'Firestore refused the lookup (permission-denied). The new firestore.rules are not published yet: paste the whole file into Firebase console > Firestore > Rules and click Publish.'
            : 'Could not check (' + (e && e.code || 'error') + '). Try again in a moment.';
        });
        return;
      }
      lead.textContent = 'Signed in as ' + me.name + '. Your profile, statistics, member management and moderation in one place.';
      root.append(bar, body); body.append(el('p', 'admin-empty', 'Loading…'));
      return loadAll().then(function () { var h = location.hash.replace('#', ''); show(TABS.some(function (t) { return t[0] === h; }) ? h : 'profile'); });
    });
  }).catch(function () { lead.textContent = 'Could not load the dashboard. Please refresh.'; });
})();
