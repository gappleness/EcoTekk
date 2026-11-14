/* EcoTekk Tech Help: repair shop / service center tracker.
   - Same layout idea as ewaste.html: map, nearest / explore buttons, filters, distance-ranked cards.
   - Each card has an "I went here" tally (Firestore: shopVisits/{shopId}), modelled on the Community pulse
     counter on explore.html. The tally is DISPLAY ONLY: the list is always ordered by distance and filtered by
     device/shop type, never by the count.
   - Members and guests (Firebase anonymous sessions) can both add to the tally, once per shop. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     SHOP DATA: edit this list to add/remove shops.
     id      lowercase letters, numbers, - or _ (max 60). Used as the Firestore document id, so don't rename
             an id after launch or its count will start again from zero.
     lat/lng APPROXIMATE coordinates used only to estimate distance. Map links and directions use the
             name + address text, not these numbers.
     devices any of: phones, laptops, electronics
     kind    'authorized' (brand service center) or 'independent' (shop / kiosk)
     src     where the listing was compiled from, so it can be re-checked.
     Listings are compiled from public pages and are NOT verified by EcoTekk.
     ------------------------------------------------------------------ */
  var SHOPS = [
    {
      id: 'sst-laptop-gadget-sm-calamba',
      name: 'SST Laptop & Gadget Repair Center',
      addr: '2nd Level, SM City Calamba, National Road, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '', hours: 'Mall shop · call or visit to confirm hours',
      devices: ['laptops', 'phones'], kind: 'independent',
      src: 'ClickTheCity listing'
    },
    {
      id: 'ifix-kiosk-sm-calamba',
      name: 'Cellphone Laptop Repair (iFix kiosk)',
      addr: 'iFix kiosk, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '+63 963 311 3311', hours: 'Kiosk · call to confirm hours',
      devices: ['phones', 'laptops'], kind: 'independent',
      src: 'Facebook page'
    },
    {
      id: 'kg-cellphone-repair-sm-calamba',
      name: 'KG Cellphone Repair',
      addr: 'Store service section, SM City Calamba, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '+63 929 951 0005', hours: 'Kiosk · call to confirm hours',
      devices: ['phones', 'laptops'], kind: 'independent',
      src: 'Facebook page'
    },
    {
      id: 'gsn-wireless-sm-calamba',
      name: 'GSN Wireless Cellphone Repair',
      addr: '2nd Floor Cyberzone, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '+63 992 381 1205', hours: 'Mall shop · call to confirm hours',
      devices: ['phones', 'laptops'], kind: 'independent',
      src: 'Facebook page'
    },
    {
      id: 'oppo-service-citymall-calamba',
      name: 'OPPO Service Center (CityMall Calamba)',
      addr: 'GF, CityMall Laguna, National Highway, Lecheria, Calamba City, 4027 Laguna',
      lat: 14.2040, lng: 121.1580,
      phone: '+63 916 732 6776', hours: 'Call to confirm hours',
      devices: ['phones'], kind: 'authorized', brand: 'OPPO',
      src: 'OPPO Philippines / Apple Maps'
    },
    {
      id: 'honor-citylight-telecom-calamba',
      name: 'Citylight Telecom Centre (HONOR service partner)',
      addr: 'Calamba CT Crossing Bldg., Purok 4, National Highway, Brgy. 1 Real Road, Calamba City, Laguna',
      lat: 14.2070, lng: 121.1650,
      phone: '+63 927 817 7779', hours: 'Mon–Sun, 10:00 AM–7:00 PM (as listed by HONOR)',
      devices: ['phones'], kind: 'authorized', brand: 'HONOR',
      src: 'HONOR Philippines service center list'
    },
    {
      id: 'sy-electronics-parian-calamba',
      name: 'Sy Electronics Sales and Repair Shop',
      addr: 'National Highway, Brgy. Parian, Calamba City, 4027 Laguna',
      lat: 14.2120, lng: 121.1655,
      phone: '(049) 834 2218', hours: 'Mon–Sat, about 8:00 AM–5:30 PM (as listed on Waze)',
      devices: ['electronics'], kind: 'independent',
      src: 'Waze listing'
    }
  ];

  var DEVICE_LABEL = { phones: 'Phones & tablets', laptops: 'Laptops & computers', electronics: 'Other electronics' };
  var DEFAULT_ORIGIN = { lat: 14.2110, lng: 121.1650 }; // Calamba, Laguna

  /* ---------- tiny helpers ---------- */
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
  function placeQuery(s) { return s.name + ', ' + s.addr; }
  function plural(n) { return n === 1 ? '1 person went here' : n.toLocaleString() + ' people went here'; }

  /* ---------- location state ---------- */
  var located = false, origin = { lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng }, accuracy = NaN;

  (function readParams() {
    var p = new URLSearchParams(location.search);
    var lat = parseFloat(p.get('lat')), lng = parseFloat(p.get('lng'));
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      located = true; origin = { lat: lat, lng: lng };
    }
  })();

  var ranked = [];
  function rank() {
    ranked = SHOPS.map(function (s) {
      return Object.assign({}, s, { dist: haversineKm(origin.lat, origin.lng, s.lat, s.lng) });
    }).sort(function (a, b) { return a.dist - b.dist; }); // distance only. Never by tally.
  }

  /* ---------- DOM refs ---------- */
  var mapFrame = $('mapFrame'), statusEl = $('mapStatus'), list = $('sitesList'), meta = $('resultsMeta');
  var locLabel = $('locLabel'), actions = $('locationActions');

  function showSite(s) {
    mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(placeQuery(s)) + '&z=16&output=embed';
    statusEl.textContent = 'Showing: ' + s.name;
  }
  function directionsUrl(s) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(placeQuery(s)) +
      '&travelmode=driving' + (located ? '&origin=' + encodeURIComponent(origin.lat + ',' + origin.lng) : '');
  }
  function mapsUrl(s) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(placeQuery(s));
  }

  function paintLocation() {
    if (located) {
      locLabel.textContent = 'Based on your live location (' + origin.lat.toFixed(4) + ', ' + origin.lng.toFixed(4) + '). Open a shop in Maps or get directions.';
      actions.hidden = false;
      actions.replaceChildren();
      var dot = el('span', 'location-dot'); dot.setAttribute('aria-hidden', 'true');
      var acc = Number.isFinite(accuracy) && accuracy >= 0 ? ' · estimated accuracy ±' + Math.round(accuracy) + ' m' : ' · approximate browser location';
      var a = el('a', '', 'View my marker ↗');
      a.target = '_blank'; a.rel = 'noopener';
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(origin.lat + ',' + origin.lng);
      actions.append(dot, el('strong', '', 'You are here'), el('span', '', acc), a);
    } else {
      locLabel.textContent = 'Showing shops near Calamba, Laguna (default area). Use your location for distances from where you are.';
      actions.hidden = true;
    }
  }

  /* ------------------------------------------------------------------
     "I went here" tally (Firestore shopVisits/{id}), display only
     ------------------------------------------------------------------ */
  var db = null, auth = null, user = null;
  try {
    if (window.firebase && firebase.apps && firebase.apps.length) { db = firebase.firestore(); auth = firebase.auth(); }
  } catch (e) { db = null; auth = null; }

  var counts = {}, reported = {}, busy = {}, failed = {}, notes = {};

  function updateShop(id) {
    var rows = list.querySelectorAll('[data-shop-row="' + id + '"]');
    rows.forEach(function (row) {
      var num = row.querySelector('.went-num'), lbl = row.querySelector('.went-label');
      var btn = row.querySelector('.went-btn'), msg = row.querySelector('.went-msg');
      var c = counts[id];
      num.textContent = (c === undefined || c === null) ? '–' : c.toLocaleString();
      lbl.textContent = (c === 1) ? 'person went here' : 'people went here';
      btn.classList.remove('is-done');
      if (!db || failed[id]) { btn.disabled = true; btn.textContent = 'I went here'; msg.textContent = db ? 'The tally is unavailable right now.' : 'The tally is not connected on this page yet.'; return; }
      if (reported[id]) { btn.disabled = true; btn.classList.add('is-done'); btn.textContent = '✓ Counted. Thanks!'; msg.textContent = notes[id] || ''; return; }
      if (!user) { btn.disabled = false; btn.textContent = 'Sign in or use guest to count yours'; msg.textContent = notes[id] || ''; return; }
      btn.disabled = !!busy[id]; btn.textContent = 'I went here'; msg.textContent = notes[id] || '';
    });
  }
  function updateAll() { SHOPS.forEach(function (s) { updateShop(s.id); }); }

  function checkReported() {
    if (!db || !user) return;
    var uid = user.uid;
    SHOPS.forEach(function (s) {
      db.collection('shopVisits').doc(s.id).collection('reporters').doc(uid).get().then(function (snap) {
        if (!user || user.uid !== uid) return;
        if (snap.exists) { reported[s.id] = true; updateShop(s.id); }
      }).catch(function () { /* rules not published yet, or offline: ignore */ });
    });
  }

  function subscribeAll() {
    if (!db) return;
    SHOPS.forEach(function (s) {
      db.collection('shopVisits').doc(s.id).onSnapshot(function (snap) {
        failed[s.id] = false;
        counts[s.id] = snap.exists ? (Number(snap.data().count) || 0) : 0;
        updateShop(s.id);
      }, function () { failed[s.id] = true; counts[s.id] = null; updateShop(s.id); });
    });
  }

  function addVisit(id) {
    if (!db) return;
    if (!user) { location.href = 'login.html?next=' + encodeURIComponent('techhelp.html'); return; }
    if (reported[id] || busy[id]) return;
    busy[id] = true; notes[id] = 'Adding yours…'; updateShop(id);
    var ref = db.collection('shopVisits').doc(id), uid = user.uid;
    var batch = db.batch();
    batch.set(ref.collection('reporters').doc(uid), { createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    batch.set(ref, { count: firebase.firestore.FieldValue.increment(1) }, { merge: true });
    batch.commit().then(function () {
      busy[id] = false; reported[id] = true; notes[id] = 'Thanks. Your visit was added to the tally.'; updateShop(id);
    }).catch(function () {
      busy[id] = false;
      // A rejected batch usually means this account/guest session already counted this shop.
      ref.collection('reporters').doc(uid).get().then(function (s) {
        if (s.exists) { reported[id] = true; notes[id] = 'You already counted this one. Thanks!'; }
        else notes[id] = 'Could not add yours right now. Please try again later.';
        updateShop(id);
      }).catch(function () { notes[id] = 'Could not add yours right now. Please try again later.'; updateShop(id); });
    });
  }

  /* ---------- filtering + rendering ---------- */
  function filtered() {
    var dev = $('deviceFilter').value, kind = $('kindFilter').value;
    return ranked.filter(function (s) {
      return (!dev || s.devices.indexOf(dev) !== -1) && (!kind || s.kind === kind);
    });
  }

  function renderSites() {
    list.replaceChildren();
    var chosen = filtered();
    meta.textContent = chosen.length
      ? chosen.length + (chosen.length === 1 ? ' shop' : ' shops') + ' · sorted by estimated distance · call ahead to confirm hours, prices and your device'
      : 'No matching shops';
    if (!chosen.length) {
      list.appendChild(el('p', 'empty-note', 'No listed shop matches these filters. Try “Any device” or “Any type”, or use Explore nearby to search Maps.'));
      return;
    }
    chosen.forEach(function (s) {
      var card = el('div', 'site-card');

      var signal = el('div', 'site-signal'), bars = el('div', 'bars');
      for (var i = 0; i < 4; i++) bars.appendChild(el('span', i < barCount(s.dist) ? 'on' : ''));
      signal.append(bars, document.createTextNode(s.dist.toFixed(1) + ' km'));

      var body = el('div', 'site-body');
      var tags = el('div', 'shop-tags');
      tags.appendChild(el('span', 'shop-tag', s.kind === 'authorized' ? 'Brand service center' + (s.brand ? ' · ' + s.brand : '') : 'Independent shop'));
      s.devices.forEach(function (d) { tags.appendChild(el('span', 'shop-tag', DEVICE_LABEL[d])); });
      var metaRow = el('div', 'meta');
      metaRow.append(el('span', '', s.hours), el('span', '', s.phone || 'Phone not verified'));

      var links = el('div', 'site-links');
      var view = el('a', 'visit', 'View on Maps'); view.href = mapsUrl(s); view.target = '_blank'; view.rel = 'noopener';
      var show = el('button', 'visit map-site-btn', 'Show on map'); show.type = 'button'; show.setAttribute('data-shop', s.id);
      var dir = el('a', 'visit directions-link', 'Get directions ↗'); dir.href = directionsUrl(s); dir.target = '_blank'; dir.rel = 'noopener';
      links.append(view, show, dir);
      if (s.phone) { var call = el('a', 'visit', 'Call'); call.href = 'tel:' + s.phone.replace(/[^\d+]/g, ''); links.appendChild(call); }

      var went = el('div', 'went-row'); went.setAttribute('data-shop-row', s.id);
      var cnt = el('div', 'went-count'); cnt.setAttribute('aria-live', 'polite');
      cnt.append(el('span', 'went-num', '–'), el('span', 'went-label', 'people went here'));
      var btn = el('button', 'went-btn', 'I went here'); btn.type = 'button'; btn.setAttribute('data-went', s.id);
      went.append(cnt, btn, el('p', 'went-msg'));

      body.append(el('h2', '', s.name), tags, el('p', 'addr', s.addr), metaRow, el('p', 'shop-src', 'Listed via ' + s.src), links, went);
      card.append(signal, body);
      list.appendChild(card);
    });
    updateAll();
  }

  /* ---------- events ---------- */
  list.addEventListener('click', function (e) {
    var showBtn = e.target.closest('.map-site-btn');
    if (showBtn) {
      var s = SHOPS.filter(function (x) { return x.id === showBtn.getAttribute('data-shop'); })[0];
      if (s) { showSite(s); mapFrame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return;
    }
    var went = e.target.closest('.went-btn');
    if (went) addVisit(went.getAttribute('data-went'));
  });

  $('showNearest').onclick = function () { if (ranked[0]) showSite(ranked[0]); };
  $('showAll').onclick = function () {
    mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent('phone laptop repair near ' + (located ? origin.lat + ',' + origin.lng : 'Calamba Laguna')) + '&output=embed';
    statusEl.textContent = 'Searching Maps for repair shops nearby; results may differ from the listings below';
  };
  $('deviceFilter').addEventListener('change', renderSites);
  $('kindFilter').addEventListener('change', renderSites);

  $('useLocation').onclick = function () {
    var btn = this;
    if (!navigator.geolocation) { statusEl.textContent = 'Geolocation is not supported by this browser. Showing the Calamba default area.'; return; }
    btn.disabled = true; statusEl.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      located = true; origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }; accuracy = pos.coords.accuracy;
      btn.disabled = false; paintLocation(); rank(); renderSites(); if (ranked[0]) showSite(ranked[0]);
      statusEl.textContent = 'Distances updated from your location. Showing the nearest shop.';
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
  if (ranked[0]) showSite(ranked[0]);
  subscribeAll();
  if (auth) {
    auth.onAuthStateChanged(function (u) {
      user = u || null; reported = {}; notes = {};
      updateAll(); checkReported();
    });
  }
})();
