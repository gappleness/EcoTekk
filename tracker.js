/* EcoTekk shared tracker engine, used by ewaste.js (drop-offs) and techhelp.js (repair shops).
   Both pages get the same: embedded map, nearest / explore / use-my-location buttons, filters,
   distance-ranked cards, and an "I went here" community tally.

   "I went here" tally storage
   ---------------------------
   Counts are stored in the Firestore collection that explore.html's "Community pulse" already uses
   (issueReports), under prefixed ids such as  shop-<id>  and  dropoff-<id>.
   Those security rules are already published (explore.html works), so no extra rules deployment is needed.
   (The earlier version wrote to a separate shopVisits collection; if its rules were never published in the
   Firebase console every read failed, which showed as "The tally is unavailable right now.")
   The tally is DISPLAY ONLY: lists are ordered by distance, never by count. */
(function (global) {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function haversineKm(aLat, aLng, bLat, bLng) {
    var R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function barCount(km) { return km < 4 ? 4 : km < 8 ? 3 : km < 15 ? 2 : 1; }

  function init(cfg) {
    var SITES = cfg.sites;
    var DEFAULT_ORIGIN = cfg.defaultOrigin || { lat: 14.2110, lng: 121.1650 };
    var located = false, origin = { lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng }, accuracy = NaN;

    /* ---------- location from URL (home.html sends ?lat=&lng=) ---------- */
    (function readParams() {
      var p = new URLSearchParams(location.search);
      if (p.get('fallback') === '1') return;
      var lat = parseFloat(p.get('lat')), lng = parseFloat(p.get('lng')), acc = parseFloat(p.get('accuracy'));
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        located = true; origin = { lat: lat, lng: lng }; accuracy = acc;
      }
    })();

    var ranked = [];
    function rank() {
      ranked = SITES.map(function (s) {
        return Object.assign({}, s, { dist: haversineKm(origin.lat, origin.lng, s.lat, s.lng) });
      }).sort(function (a, b) { return a.dist - b.dist; }); // distance only. Never by tally.
    }

    var mapFrame = $('mapFrame'), statusEl = $('mapStatus'), list = $('sitesList'), meta = $('resultsMeta');
    var locLabel = $('locLabel'), actions = $('locationActions'), notice = $('filterNotice');
    var selects = Array.prototype.slice.call(document.querySelectorAll('select[data-filter]'));

    function placeQuery(s) { return s.name + ', ' + s.addr; }
    function tallyId(s) { return (cfg.tallyPrefix + s.id).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 60); }
    function values() {
      var v = {};
      selects.forEach(function (s) { v[s.getAttribute('data-filter')] = s.value; });
      return v;
    }
    function showSite(s) {
      mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(placeQuery(s)) + '&z=16&output=embed';
      statusEl.textContent = 'Showing: ' + s.name;
    }
    function directionsUrl(s) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(placeQuery(s)) +
        '&travelmode=driving' + (located ? '&origin=' + encodeURIComponent(origin.lat + ',' + origin.lng) : '');
    }
    function mapsUrl(s) {
      return s.maps || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(placeQuery(s)));
    }

    function paintLocation() {
      if (located) {
        locLabel.textContent = 'Based on your live location (' + origin.lat.toFixed(4) + ', ' + origin.lng.toFixed(4) + '). ' + cfg.locatedHint;
        actions.hidden = false;
        actions.replaceChildren();
        var dot = el('span', 'location-dot'); dot.setAttribute('aria-hidden', 'true');
        var acc = Number.isFinite(accuracy) && accuracy >= 0 ? ' · estimated accuracy ±' + Math.round(accuracy) + ' m' : ' · approximate browser location';
        var a = el('a', '', 'View my marker ↗');
        a.target = '_blank'; a.rel = 'noopener';
        a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(origin.lat + ',' + origin.lng);
        actions.append(dot, el('strong', '', 'You are here'), el('span', '', acc), a);
      } else {
        locLabel.textContent = cfg.defaultHint;
        actions.hidden = true;
      }
    }

    /* ------------------------------------------------------------------
       "I went here" tally
       ------------------------------------------------------------------ */
    var db = null, auth = null, user = null;
    try {
      if (global.firebase && firebase.apps && firebase.apps.length) { db = firebase.firestore(); auth = firebase.auth(); }
    } catch (e) { db = null; auth = null; }

    var COLL = 'issueReports';
    var counts = {}, reported = {}, busy = {}, failed = {}, notes = {};

    function updateRow(id) {
      var rows = list.querySelectorAll('[data-tally-row="' + id + '"]');
      rows.forEach(function (row) {
        var num = row.querySelector('.went-num'), lbl = row.querySelector('.went-label');
        var btn = row.querySelector('.went-btn'), msg = row.querySelector('.went-msg');
        var c = counts[id];
        num.textContent = (c === undefined || c === null) ? '–' : c.toLocaleString();
        lbl.textContent = (c === 1) ? 'person went here' : 'people went here';
        btn.classList.remove('is-done');
        if (!db || failed[id]) {
          btn.disabled = true; btn.textContent = 'I went here';
          msg.textContent = db ? 'The tally is unavailable right now.' : 'The tally is not connected on this page yet.';
          return;
        }
        if (reported[id]) { btn.disabled = true; btn.classList.add('is-done'); btn.textContent = '✓ Counted. Thanks!'; msg.textContent = notes[id] || ''; return; }
        if (!user) { btn.disabled = false; btn.textContent = 'Sign in or use guest to count yours'; msg.textContent = notes[id] || ''; return; }
        btn.disabled = !!busy[id]; btn.textContent = 'I went here'; msg.textContent = notes[id] || '';
      });
    }
    function updateAll() { SITES.forEach(function (s) { updateRow(tallyId(s)); }); }

    function checkReported() {
      if (!db || !user) return;
      var uid = user.uid;
      SITES.forEach(function (s) {
        var id = tallyId(s);
        db.collection(COLL).doc(id).collection('reporters').doc(uid).get().then(function (snap) {
          if (!user || user.uid !== uid) return;
          if (snap.exists) { reported[id] = true; updateRow(id); }
        }).catch(function () { /* offline: ignore */ });
      });
    }

    function subscribeAll() {
      if (!db) return;
      SITES.forEach(function (s) {
        var id = tallyId(s);
        db.collection(COLL).doc(id).onSnapshot(function (snap) {
          failed[id] = false;
          counts[id] = snap.exists ? (Number(snap.data().count) || 0) : 0;
          updateRow(id);
        }, function (err) {
          console.warn('EcoTekk tally read failed for', id, err && err.code);
          failed[id] = true; counts[id] = null; updateRow(id);
        });
      });
    }

    function addVisit(id) {
      if (!db) return;
      if (!user) { location.href = 'login.html?next=' + encodeURIComponent(cfg.page + location.search); return; }
      if (reported[id] || busy[id]) return;
      busy[id] = true; notes[id] = 'Adding yours…'; updateRow(id);
      var ref = db.collection(COLL).doc(id), uid = user.uid;
      var batch = db.batch();
      batch.set(ref.collection('reporters').doc(uid), { createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      batch.set(ref, { count: firebase.firestore.FieldValue.increment(1) }, { merge: true });
      batch.commit().then(function () {
        busy[id] = false; reported[id] = true; notes[id] = 'Thanks. Your visit was added to the tally.'; updateRow(id);
      }).catch(function (err) {
        console.warn('EcoTekk tally write failed for', id, err && err.code);
        busy[id] = false;
        // A rejected batch usually means this account/guest session already counted this place.
        ref.collection('reporters').doc(uid).get().then(function (s) {
          if (s.exists) { reported[id] = true; notes[id] = 'You already counted this one. Thanks!'; }
          else notes[id] = 'Could not add yours right now. Please try again later.';
          updateRow(id);
        }).catch(function () { notes[id] = 'Could not add yours right now. Please try again later.'; updateRow(id); });
      });
    }

    /* ---------- filtering + rendering ---------- */
    function filtered() {
      var v = values();
      return ranked.filter(function (s) { return cfg.matches(s, v); });
    }

    function renderSites() {
      list.replaceChildren();
      var v = values(), chosen = filtered();
      var active = cfg.describeFilters(v);
      meta.textContent = chosen.length
        ? chosen.length + ' ' + (chosen.length === 1 ? cfg.noun : cfg.nounPlural) + (active ? ' for ' + active : '') + ' · sorted by estimated distance · ' + cfg.metaTail
        : 'No matching ' + cfg.nounPlural;
      if (notice) notice.textContent = cfg.filterNote(v, chosen.length);
      if (!chosen.length) {
        list.appendChild(el('p', 'empty-note', cfg.emptyMessage(v)));
        return;
      }
      chosen.forEach(function (s) {
        var id = tallyId(s);
        var card = el('div', 'site-card');

        var signal = el('div', 'site-signal'), bars = el('div', 'bars');
        for (var i = 0; i < 4; i++) bars.appendChild(el('span', i < barCount(s.dist) ? 'on' : ''));
        signal.append(bars, document.createTextNode('~' + s.dist.toFixed(1) + ' km'));

        var body = el('div', 'site-body');
        var tags = el('div', 'shop-tags');
        cfg.tags(s).forEach(function (t) { tags.appendChild(el('span', 'shop-tag', t)); });
        var metaRow = el('div', 'meta');
        metaRow.append(el('span', s.open ? 'open' : '', s.hours), el('span', '', s.phone || 'Phone not verified'));

        var links = el('div', 'site-links');
        var view = el('a', 'visit', 'View on Maps'); view.href = mapsUrl(s); view.target = '_blank'; view.rel = 'noopener';
        var show = el('button', 'visit map-site-btn', 'Show on map'); show.type = 'button'; show.setAttribute('data-site', s.id);
        var dir = el('a', 'visit directions-link', 'Get directions ↗'); dir.href = directionsUrl(s); dir.target = '_blank'; dir.rel = 'noopener';
        links.append(view, show, dir);
        if (s.phone) { var call = el('a', 'visit', 'Call'); call.href = 'tel:' + s.phone.replace(/[^\d+]/g, ''); links.appendChild(call); }

        var went = el('div', 'went-row'); went.setAttribute('data-tally-row', id);
        var cnt = el('div', 'went-count'); cnt.setAttribute('aria-live', 'polite');
        cnt.append(el('span', 'went-num', '–'), el('span', 'went-label', 'people went here'));
        var btn = el('button', 'went-btn', 'I went here'); btn.type = 'button'; btn.setAttribute('data-went', id);
        went.append(cnt, btn, el('p', 'went-msg'));

        body.append(el('h2', '', s.name), tags, el('p', 'addr', s.addr), metaRow);
        var detail = cfg.detail ? cfg.detail(s) : '';
        if (detail) body.appendChild(el('p', 'shop-detail', detail));
        body.append(el('p', 'shop-src', 'Listed via ' + s.src), links, went);
        card.append(signal, body);
        list.appendChild(card);
      });
      updateAll();
    }

    /* After a filter change, point the map at the nearest match. */
    function focusFirstMatch() {
      var c = filtered();
      if (c[0]) showSite(c[0]);
    }

    /* ---------- events ---------- */
    list.addEventListener('click', function (e) {
      var showBtn = e.target.closest('.map-site-btn');
      if (showBtn) {
        var s = SITES.filter(function (x) { return x.id === showBtn.getAttribute('data-site'); })[0];
        if (s) { showSite(s); mapFrame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
      var went = e.target.closest('.went-btn');
      if (went) addVisit(went.getAttribute('data-went'));
    });

    $('showNearest').onclick = function () { var c = filtered(); if (c[0]) showSite(c[0]); else statusEl.textContent = 'No listed match for these filters.'; };
    $('showAll').onclick = function () {
      mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(cfg.exploreQuery(values()) + ' near ' + (located ? origin.lat + ',' + origin.lng : 'Calamba Laguna')) + '&output=embed';
      statusEl.textContent = cfg.exploreStatus;
    };
    selects.forEach(function (s) {
      s.addEventListener('change', function () { renderSites(); focusFirstMatch(); });
    });

    $('useLocation').onclick = function () {
      var btn = this;
      if (!navigator.geolocation) { statusEl.textContent = 'Geolocation is not supported by this browser. Showing the Calamba default area.'; return; }
      btn.disabled = true; statusEl.textContent = 'Finding your location…';
      navigator.geolocation.getCurrentPosition(function (pos) {
        located = true; origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }; accuracy = pos.coords.accuracy;
        btn.disabled = false; paintLocation(); rank(); renderSites(); focusFirstMatch();
        statusEl.textContent = 'Distances updated from your location. Showing the nearest match.';
      }, function (err) {
        btn.disabled = false;
        statusEl.textContent = err && err.code === 1
          ? 'Location permission was denied. Showing the Calamba default area.'
          : 'Could not get your location. Showing the Calamba default area.';
      }, { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 });
    };

    /* ---------- boot ---------- */
    paintLocation();
    rank();
    renderSites();
    focusFirstMatch();
    subscribeAll();
    if (auth) {
      auth.onAuthStateChanged(function (u) {
        user = u || null; reported = {}; notes = {};
        updateAll(); checkReported();
      });
    }
  }

  global.EcoTracker = { init: init };
})(window);
