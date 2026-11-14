/* EcoTekk E-waste finder: drop-off tracker.
   - Same layout as techhelp.html: map, nearest / explore / use-my-location buttons, filters, distance-ranked cards.
   - Every filter returns approximate locations. Accepted materials come from each program's published list
     where one exists. Quantity and coverage are APPROXIMATE: estimated from the kind of facility (a mall bin
     is for a few items, a licensed recycler can take bulk loads), so a filter match means "likely", not
     "guaranteed". If nothing matches every filter, the closest matches are shown and labelled as such.
   - Each fixed place has an "I went here" tally (shared module: community-tally.js). The tally is DISPLAY ONLY:
     the list is always ordered by distance, never by the count. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     SITE DATA: edit this list to add/remove sites.
     id       lowercase letters, numbers, - or _ (max 50). Used for the community tally, so don't rename an id
              after launch or its count will start again from zero.
     lat/lng  APPROXIMATE coordinates, used only to estimate distance. Map links and directions use the
              name + address text, not these numbers. Omit both for a "search near you" entry (see below).
     kind     'retail' (mall / store bin) | 'brand' (maker take-back) | 'government' (LGU) | 'recycler' (licensed recycler / TSD)
     types    accepted material categories from the program's own list:
              small-electronics, computers, phones, batteries, cables, appliances
     scales   waste quantity this kind of site typically handles (approximate): Individual, Household, Community, Industrial
     reach    area the site realistically serves (approximate): Barangay, City/Municipality, Province, Region
     what     plain-language summary of what the source says it accepts
     src      where the listing was compiled from, so it can be re-checked
     search   (optional) makes this a "search near you" entry: not a confirmed address. These are shown after
              the fixed places, flagged "Ask first", and have no tally.
     Listings are compiled from public pages and are NOT verified by EcoTekk.
     ------------------------------------------------------------------ */
  var SM_WHAT = 'Mobile phones, chargers, power cords, computer wiring, commercial batteries, ink/toner cartridges and small gadgets (keyboards, calculators, power banks, earphones). Larger items: coordinate with mall admin.';

  var SITES = [
    {
      id: 'sm-city-calamba-ewaste',
      name: 'SM City Calamba · e-waste bin',
      addr: 'Cyberzone, 2nd Floor, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '', hours: 'During mall hours',
      kind: 'retail',
      types: ['phones', 'small-electronics', 'batteries', 'cables'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: SM_WHAT, src: 'SM Supermalls e-waste program page'
    },
    {
      id: 'samsung-ewd-comworks-sm-calamba',
      name: 'Samsung e-waste drop box · Comworks (SM City Calamba)',
      addr: '2F Cyberzone Area, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '', hours: 'During mall hours',
      kind: 'brand', brand: 'Samsung',
      types: ['phones', 'small-electronics'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: 'Samsung Authorized Service Center with a free drop box for old or broken electronic devices.',
      src: 'Samsung PH e-waste program (list dated Mar 2022: confirm the box is still there)'
    },
    {
      id: 'maritrans-recycler-parian-calamba',
      name: 'Maritrans Recycler, Inc.',
      addr: 'Unit 3 D M, 763 National Highway, Ragasa Warehouse, Parian, Calamba, 4027 Laguna',
      lat: 14.2115, lng: 121.1651,
      phone: '+63 49 545 9055', hours: 'Call to confirm hours',
      kind: 'recycler',
      types: ['computers', 'phones', 'small-electronics', 'cables'],
      scales: ['Community', 'Industrial'], reach: ['Province', 'Region'],
      what: 'Recycler listed on Google Maps and named as a treatment/storage/disposal partner in e-waste collection programs. Bulk or business drop-offs are more likely than single items; call first.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Maritrans+Recycler+Inc&query_place_id=ChIJHexikUtivTMR1stm1Y_BK-s',
      src: 'Google Maps listing · Globe / Philstar program reports'
    },
    {
      id: 'integrated-recycling-carmelray-calamba',
      name: 'Integrated Recycling Industries Philippines, Inc.',
      addr: 'C4-5b, Carmelray Industrial Park 2, Calamba, 4027 Laguna',
      lat: 14.1890, lng: 121.1480,
      phone: '+63 49 545 9572', hours: 'Hours vary · call ahead',
      kind: 'recycler',
      types: ['computers', 'small-electronics', 'appliances', 'cables'],
      scales: ['Community', 'Industrial'], reach: ['Province', 'Region'],
      what: 'DENR-accredited recycler that receives bulk e-waste from barangay and EcoWaste Coalition collection drives, including TVs. Call before bringing individual items.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Integrated+Recycling+Industries+Philippines&query_place_id=ChIJAQAAUKJjvTMRlZyzhXOUPj4',
      src: 'EcoWaste Coalition / Good News Pilipinas / Google Maps'
    },
    {
      id: 'hmr-envirocycle-silangan-calamba',
      name: 'HMR Envirocycle Philippines Inc.',
      addr: 'HMR Compound, C. A. Yulo Ave, Silangan Industrial Park, Canlubang, Calamba, 4028 Laguna',
      lat: 14.2050, lng: 121.1200,
      phone: '+63 917 834 9596', hours: 'Call to confirm hours',
      kind: 'recycler',
      types: ['computers', 'phones', 'small-electronics', 'cables', 'appliances'],
      scales: ['Individual', 'Household', 'Community', 'Industrial'], reach: ['City/Municipality', 'Province', 'Region'],
      what: 'DENR-accredited full-service e-waste recycler (treatment, storage and disposal). Also takes paper, bottles, glass and plastic. Works with Calamba CENRO and nearby LGUs.',
      maps: 'https://www.google.com/maps/search/?api=1&query=Envirocycle+Philippines+Inc&query_place_id=ChIJPapStp9jvTMRPxScDV1wg9w',
      src: 'Globe e-waste guide · 8List · The Beat'
    },
    {
      id: 'sm-city-santa-rosa-ewaste',
      name: 'SM City Santa Rosa · e-waste bin',
      addr: 'Cyberzone entrance, 2nd Floor, SM City Santa Rosa, Brgy. Tagapo, Santa Rosa City, 4026 Laguna',
      lat: 14.3112, lng: 121.1116,
      phone: '', hours: 'During mall hours',
      kind: 'retail',
      types: ['phones', 'small-electronics', 'batteries', 'cables'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: SM_WHAT, src: 'SM Supermalls e-waste program page'
    },
    {
      id: 'samsung-ewd-jazzy-santa-rosa',
      name: 'Samsung e-waste drop box · Jazzy Technical Services (Santa Rosa)',
      addr: 'GF Progressive Bldg., #1839 Purok 1, Old National Highway, Brgy. Dita, Santa Rosa City, Laguna',
      lat: 14.2900, lng: 121.1000,
      phone: '', hours: 'Call to confirm hours',
      kind: 'brand', brand: 'Samsung',
      types: ['phones', 'small-electronics'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: 'Samsung Authorized Service Center with a free drop box for old or broken electronic devices.',
      src: 'Samsung PH e-waste program (list dated Mar 2022: confirm the box is still there)'
    },
    {
      id: 'binan-city-hall-ebins',
      name: 'Biñan City Hall · E-Recyclables drop boxes',
      addr: 'Lobby, Biñan City Hall, Biñan City, Laguna',
      lat: 14.3373, lng: 121.0827,
      phone: '', hours: 'City Hall hours · call to confirm',
      kind: 'government',
      types: ['computers', 'phones', 'small-electronics', 'cables'],
      scales: ['Individual', 'Household'], reach: ['City/Municipality'],
      what: 'Two city-run drop boxes for old computers, mobile phones, tablets, cables and wiring, launched June 2025 with HMR Envirocycle. Run by Biñan; residents of other cities may be asked to use their own.',
      src: 'OpinYon News (Jun 2025)'
    },
    {
      id: 'sm-city-san-pablo-ewaste',
      name: 'SM City San Pablo · e-waste bin',
      addr: 'Cyberzone, 2nd Level (along the railing), SM City San Pablo, Maharlika Highway, Brgy. San Rafael, San Pablo City, Laguna',
      lat: 14.0715, lng: 121.3018,
      phone: '', hours: 'During mall hours',
      kind: 'retail',
      types: ['phones', 'small-electronics', 'batteries', 'cables'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: SM_WHAT, src: 'SM Supermalls e-waste program page'
    },

    /* ---- "Search near you" entries: not confirmed addresses. Shown last, flagged "Ask first". ---- */
    {
      id: 'barangay-hall-mrf',
      name: 'Your barangay hall / materials recovery facility',
      search: 'barangay hall materials recovery facility',
      kind: 'government',
      types: [],
      scales: ['Individual', 'Household', 'Community'], reach: ['Barangay'],
      what: 'Every barangay is required to run a Materials Recovery Facility (RA 9003) and many host e-waste drives. Ask whether they take e-waste, or when the next collection drive is. Not a confirmed drop-off.',
      src: 'Republic Act 9003 (Ecological Solid Waste Management Act)'
    },
    {
      id: 'city-enro-office',
      name: 'City / municipal environment office (CENRO / ENRO)',
      search: 'City Environment and Natural Resources Office',
      kind: 'government',
      types: [],
      scales: ['Household', 'Community'], reach: ['City/Municipality'],
      what: 'The city or municipal environment office knows about local e-waste collection drives and accredited haulers. Ask before you go. Not a confirmed drop-off.',
      src: 'Local government function under RA 9003'
    },
    {
      id: 'globe-ewaste-zero-bin',
      name: 'Globe Store · E-Waste Zero Bin',
      search: 'Globe Store',
      kind: 'brand', brand: 'Globe',
      types: ['phones', 'small-electronics', 'batteries'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: 'Globe runs e-waste bins in 100+ participating stores nationwide. Not every store has one, so ask the store first.',
      src: 'Globe E-Waste Zero program'
    },
    {
      id: 'smart-pldt-ewaste-bins',
      name: 'Smart / PLDT store e-waste bins',
      search: 'Smart Store',
      kind: 'brand', brand: 'Smart',
      types: ['phones', 'small-electronics'],
      scales: ['Individual', 'Household'], reach: ['Barangay', 'City/Municipality'],
      what: 'PLDT and Smart placed e-waste collection bins at selected stores. Ask the store whether it has one.',
      src: 'PLDT / Smart "Be kind. Recycle." program'
    }
  ];

  var TYPE_LABEL = {
    'small-electronics': 'Small electronics', computers: 'Computers & laptops', phones: 'Phones & tablets',
    batteries: 'Batteries', cables: 'Cables & accessories', appliances: 'Large appliances'
  };
  var KIND_LABEL = {
    retail: 'Mall / store bin', brand: 'Brand take-back', government: 'Local government', recycler: 'Licensed recycler'
  };
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
  function isSearch(s) { return !!s.search; }
  function placeQuery(s) { return s.name + ', ' + s.addr; }

  /* ---------- location state ---------- */
  var located = false, origin = { lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng }, accuracy = NaN;

  (function readParams() {
    var p = new URLSearchParams(location.search);
    var lat = parseFloat(p.get('lat')), lng = parseFloat(p.get('lng'));
    var acc = parseFloat(p.get('accuracy'));
    if (p.get('fallback') !== '1' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      located = true; origin = { lat: lat, lng: lng }; accuracy = acc;
    }
  })();

  function originText() { return located ? origin.lat + ',' + origin.lng : 'Calamba Laguna'; }

  var ranked = [];
  function rank() {
    var fixed = SITES.filter(function (s) { return !isSearch(s); }).map(function (s) {
      return Object.assign({}, s, { dist: haversineKm(origin.lat, origin.lng, s.lat, s.lng) });
    }).sort(function (a, b) { return a.dist - b.dist; }); // distance only. Never by tally.
    var near = SITES.filter(isSearch).map(function (s) { return Object.assign({}, s, { dist: null }); });
    ranked = fixed.concat(near);
  }

  /* ---------- DOM refs ---------- */
  var mapFrame = $('mapFrame'), statusEl = $('mapStatus'), list = $('sitesList'), meta = $('resultsMeta');
  var locLabel = $('locLabel'), actions = $('locationActions');
  var FILTERS = [
    { id: 'wasteTypeFilter', test: function (s, v) { return s.types.indexOf(v) !== -1; }, label: 'waste type' },
    { id: 'kindFilter', test: function (s, v) { return s.kind === v; }, label: 'site type' },
    { id: 'wasteScaleFilter', test: function (s, v) { return s.scales.indexOf(v) !== -1; }, label: 'quantity' },
    { id: 'locationScaleFilter', test: function (s, v) { return s.reach.indexOf(v) !== -1; }, label: 'coverage' }
  ];

  function nearQuery(s) { return s.search + ' near ' + originText(); }
  function showSite(s) {
    var q = isSearch(s) ? nearQuery(s) : placeQuery(s);
    mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + (isSearch(s) ? '' : '&z=16') + '&output=embed';
    statusEl.textContent = isSearch(s) ? 'Searching Maps for: ' + s.name : 'Showing: ' + s.name;
  }
  function directionsUrl(s) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(placeQuery(s)) +
      '&travelmode=driving' + (located ? '&origin=' + encodeURIComponent(origin.lat + ',' + origin.lng) : '');
  }
  function mapsUrl(s) {
    if (isSearch(s)) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(nearQuery(s));
    return s.maps || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(placeQuery(s));
  }

  function paintLocation() {
    if (located) {
      locLabel.textContent = 'Based on your live location (' + origin.lat.toFixed(4) + ', ' + origin.lng.toFixed(4) + '). Open a site in Maps or get directions.';
      actions.hidden = false;
      actions.replaceChildren();
      var dot = el('span', 'location-dot'); dot.setAttribute('aria-hidden', 'true');
      var acc = Number.isFinite(accuracy) && accuracy >= 0 ? ' · estimated accuracy ±' + Math.round(accuracy) + ' m' : ' · approximate browser location';
      var a = el('a', '', 'View my marker ↗');
      a.target = '_blank'; a.rel = 'noopener';
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(origin.lat + ',' + origin.lng);
      actions.append(dot, el('strong', '', 'You are here'), el('span', '', acc), a);
    } else {
      locLabel.textContent = 'Showing sites near Calamba, Laguna (default area). Use your location for distances from where you are.';
      actions.hidden = true;
    }
  }

  /* "I went here" tally: shared module, see community-tally.js. Search-near-you entries have no tally. */
  var tally = window.EcoTally
    ? EcoTally.create({
        prefix: 'dropoff-', root: list, page: 'ewaste.html',
        ids: SITES.filter(function (s) { return !isSearch(s); }).map(function (s) { return s.id; })
      })
    : null;

  /* ---------- filtering ---------- */
  function activeFilters() {
    return FILTERS.map(function (f) { return { f: f, value: $(f.id).value }; })
      .filter(function (x) { return x.value; });
  }
  // Score = how many of the active filters a site satisfies.
  function scored(active) {
    return ranked.map(function (s) {
      var hits = active.filter(function (a) { return a.f.test(s, a.value); }).map(function (a) { return a.f.label; });
      return { site: s, hits: hits };
    });
  }

  function renderSites() {
    list.replaceChildren();
    var active = activeFilters();
    var rows = scored(active);
    var partial = false, chosen;

    if (!active.length) {
      chosen = rows;
    } else {
      chosen = rows.filter(function (r) { return r.hits.length === active.length; });
      if (!chosen.length) {
        // Nothing fits every filter: show the closest matches instead of an empty page.
        var best = Math.max.apply(null, rows.map(function (r) { return r.hits.length; }));
        if (best > 0) { chosen = rows.filter(function (r) { return r.hits.length === best; }); partial = true; }
      }
    }

    if (!chosen.length) {
      meta.textContent = 'No matching sites';
      list.appendChild(el('p', 'empty-note', 'No listed site matches these filters. Try “Any type” or a wider option, or use Explore nearby to search Maps.'));
      return;
    }

    if (partial) {
      list.appendChild(el('p', 'results-note',
        'No listed site matches every filter you picked, so these are the closest matches (they fit ' +
        chosen[0].hits.length + ' of ' + active.length + '). Call ahead to confirm they can take your items.'));
    }

    var fixedCount = chosen.filter(function (r) { return !isSearch(r.site); }).length;
    var nearCount = chosen.length - fixedCount;
    meta.textContent = (active.length ? (partial ? 'Closest matches' : 'Approximate matches') + ' · ' : '') +
      fixedCount + (fixedCount === 1 ? ' site' : ' sites') +
      (nearCount ? ' + ' + nearCount + ' to ask about' : '') +
      ' · sorted by estimated distance · call ahead to confirm accepted materials';

    chosen.forEach(function (r) {
      var s = r.site, search = isSearch(s);
      var card = el('div', 'site-card');

      var signal = el('div', 'site-signal'), bars = el('div', 'bars');
      for (var i = 0; i < 4; i++) bars.appendChild(el('span', search || i < barCount(s.dist) ? 'on' : ''));
      signal.append(bars, document.createTextNode(search ? 'near you' : s.dist.toFixed(1) + ' km'));

      var body = el('div', 'site-body');

      var tags = el('div', 'site-tags');
      tags.appendChild(el('span', 'site-tag', KIND_LABEL[s.kind] + (s.brand ? ' · ' + s.brand : '')));
      if (search) tags.appendChild(el('span', 'site-tag is-ask', 'Ask first'));
      s.types.forEach(function (t) { tags.appendChild(el('span', 'site-tag', TYPE_LABEL[t])); });

      var scope = el('p', 'site-scope');
      var q = el('span'); q.append(document.createTextNode('Typical quantity (approx.): '), el('b', '', s.scales.join(' · ')));
      var c = el('span'); c.append(document.createTextNode('Serves (approx.): '), el('b', '', s.reach.join(' · ')));
      scope.append(q, c);

      body.append(el('h2', '', s.name), tags);
      if (search) {
        body.append(el('p', 'addr', 'Not a fixed address. “View on Maps” searches near ' + (located ? 'your location' : 'Calamba, Laguna') + '.'));
      } else {
        body.append(el('p', 'addr', s.addr));
        var metaRow = el('div', 'meta');
        metaRow.append(el('span', '', s.hours), el('span', '', s.phone || 'Phone not verified'));
        body.append(metaRow);
      }
      body.append(el('p', 'site-what', s.what), scope);

      if (active.length) {
        var m = el('p', 'site-match' + (r.hits.length === active.length ? '' : ' is-partial'),
          r.hits.length === active.length
            ? '✓ Likely fits: ' + r.hits.join(', ')
            : 'Fits ' + r.hits.length + ' of ' + active.length + ': ' + r.hits.join(', '));
        body.append(m);
      }
      body.append(el('p', 'site-src', 'Listed via ' + s.src));

      var links = el('div', 'site-links');
      var view = el('a', 'visit', 'View on Maps'); view.href = mapsUrl(s); view.target = '_blank'; view.rel = 'noopener';
      var show = el('button', 'visit map-site-btn', 'Show on map'); show.type = 'button'; show.setAttribute('data-site', s.id);
      links.append(view, show);
      if (!search) {
        var dir = el('a', 'visit directions-link', 'Get directions ↗'); dir.href = directionsUrl(s); dir.target = '_blank'; dir.rel = 'noopener';
        links.appendChild(dir);
      }
      if (s.phone) { var call = el('a', 'visit', 'Call'); call.href = 'tel:' + s.phone.replace(/[^\d+]/g, ''); links.appendChild(call); }
      body.appendChild(links);

      if (tally && !search) body.appendChild(tally.row(s.id));

      card.append(signal, body);
      list.appendChild(card);
    });
    if (tally) tally.paintAll();
  }

  /* ---------- events ---------- */
  list.addEventListener('click', function (e) {
    var showBtn = e.target.closest('.map-site-btn');
    if (!showBtn) return;
    var s = ranked.filter(function (x) { return x.id === showBtn.getAttribute('data-site'); })[0];
    if (s) { showSite(s); mapFrame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });

  $('showNearest').onclick = function () {
    var first = ranked.filter(function (s) { return !isSearch(s); })[0];
    if (first) showSite(first);
  };
  $('showAll').onclick = function () {
    mapFrame.src = 'https://www.google.com/maps?q=' + encodeURIComponent('e-waste recycling near ' + originText()) + '&output=embed';
    statusEl.textContent = 'Searching Maps for nearby e-waste facilities; results may differ from the listings below';
  };
  FILTERS.forEach(function (f) { $(f.id).addEventListener('change', renderSites); });

  $('useLocation').onclick = function () {
    var btn = this;
    if (!navigator.geolocation) { statusEl.textContent = 'Geolocation is not supported by this browser. Showing the Calamba default area.'; return; }
    btn.disabled = true; statusEl.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      located = true; origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }; accuracy = pos.coords.accuracy;
      btn.disabled = false; paintLocation(); rank(); renderSites(); $('showNearest').onclick();
      statusEl.textContent = 'Distances updated from your location. Showing the nearest drop-off.';
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
  $('showNearest').onclick();
})();
