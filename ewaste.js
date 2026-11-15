/* EcoTekk E-waste finder: drop-off tracker.
   Layout, location, filters and the "I went here" tally all live in tracker.js (shared with techhelp.js).
   This file only holds the drop-off data and the page-specific wording.

   id        lowercase letters, numbers, - or _ (max 52). Used (with the "dropoff-" prefix) as the Firestore
             document id, so don't rename an id after launch or its count will start again from zero.
   lat/lng   APPROXIMATE coordinates, only used to estimate distance. Map links use the name + address.
   types     what the public listing says it takes: small-electronics, computers, phones, batteries, cables, appliances
   scales    quantity it is realistically set up for: Individual, Household, Community, Industrial
   reach     how wide an area it serves: Barangay, City/Municipality, Province, Region
   kind      short label for the card
   src       where the listing was compiled from, so it can be re-checked.

   Types come from the programme/company pages named in `src`. Scales and reach are EcoTekk's ESTIMATES from
   the kind of site (a mall bin vs. an industrial recycler). None of this is verified by the facilities. */
(function () {
  'use strict';

  /* SM Supermalls' e-waste bins take phones, chargers, power cords, computer wiring, commercial batteries,
     printer ink/toner and small gadgets (keyboards, calculators, power banks, earphones). */
  var SM_TYPES = ['small-electronics', 'phones', 'batteries', 'cables'];
  var SM_HOURS = 'Mall hours · bin is in the Cyberzone / IT zone';
  var SM_SRC = 'SM Supermalls e-waste collection page';

  var SITES = [
    {
      id: 'sm-city-calamba', kind: 'Public e-waste bin',
      name: 'SM City Calamba e-waste bin',
      addr: 'Cyberzone, 2F (near the Information Booth), SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637, phone: '', hours: SM_HOURS, open: true,
      types: SM_TYPES, scales: ['Individual', 'Household'], reach: ['City/Municipality'], src: SM_SRC
    },
    {
      id: 'samsung-comworks-sm-calamba', kind: 'Brand drop box',
      name: 'Samsung e-waste drop box (Comworks)',
      addr: 'Comworks, Inc., 2F Cyberzone, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637, phone: '', hours: 'Mall hours · call or visit to confirm', open: false,
      types: ['phones', 'small-electronics'], scales: ['Individual'], reach: ['City/Municipality'],
      src: 'Samsung Philippines e-waste drop box list'
    },
    {
      id: 'sm-city-sto-tomas', kind: 'Public e-waste bin',
      name: 'SM City Sto. Tomas e-waste bin',
      addr: '2nd Floor, Cyberzone area, SM City Sto. Tomas, Brgy. San Antonio, Sto. Tomas, Batangas',
      lat: 14.1060, lng: 121.1420, phone: '', hours: SM_HOURS, open: true,
      types: SM_TYPES, scales: ['Individual', 'Household'], reach: ['City/Municipality'], src: SM_SRC
    },
    {
      id: 'sm-city-santa-rosa', kind: 'Public e-waste bin',
      name: 'SM City Santa Rosa e-waste bin',
      addr: '2nd Floor, Cyberzone entrance, SM City Santa Rosa, Santa Rosa City, Laguna',
      lat: 14.3109, lng: 121.1118, phone: '', hours: SM_HOURS, open: true,
      types: SM_TYPES, scales: ['Individual', 'Household'], reach: ['City/Municipality'], src: SM_SRC
    },
    {
      id: 'binan-city-hall-e-bins', kind: 'City-run e-bin',
      name: 'Biñan City Hall E-Recyclables Drop Boxes',
      addr: 'City Hall lobby, Biñan City, Laguna',
      lat: 14.3363, lng: 121.0807, phone: '', hours: 'City Hall hours · call to confirm', open: false,
      types: ['computers', 'phones', 'small-electronics', 'cables'], scales: ['Individual', 'Household'], reach: ['City/Municipality'],
      src: 'Opinyon Laguna news report (Jun 2025)'
    },
    {
      id: 'sm-center-san-pedro', kind: 'Public e-waste bin',
      name: 'SM Center San Pedro e-waste bin',
      addr: 'IT Zone, Lower Ground Floor, SM Center San Pedro, San Pedro City, Laguna',
      lat: 14.3570, lng: 121.0580, phone: '', hours: SM_HOURS, open: true,
      types: SM_TYPES, scales: ['Individual', 'Household'], reach: ['City/Municipality'], src: SM_SRC
    },
    {
      id: 'sm-city-san-pablo', kind: 'Public e-waste bin',
      name: 'SM City San Pablo e-waste bin',
      addr: '2nd Level, Cyberzone area, SM City San Pablo, San Pablo City, Laguna',
      lat: 14.0700, lng: 121.3270, phone: '', hours: SM_HOURS, open: true,
      types: SM_TYPES, scales: ['Individual', 'Household'], reach: ['City/Municipality'], src: SM_SRC
    },
    {
      id: 'maritrans-recycler',  kind: 'Recycler / scrap buyer',
      name: 'Maritrans Recycler, Inc.',
      addr: 'Unit 3 D M, 763 National Highway, Ragasa Warehouse, Parian, Calamba, 4027 Laguna',
      lat: 14.2115, lng: 121.1651, phone: '+63 49 545 9055', hours: 'Call to confirm hours', open: true,
      types: ['computers', 'cables'], scales: ['Community', 'Industrial'], reach: ['Province'],
      src: 'Philstar report on scrap electronics buying (older listing)',
      maps: 'https://www.google.com/maps/search/?api=1&query=Maritrans+Recycler+Inc&query_place_id=ChIJHexikUtivTMR1stm1Y_BK-s'
    },
    {
      id: 'integrated-recycling-industries', kind: 'Business recycler',
      name: 'Integrated Recycling Industries Philippines, Inc.',
      addr: 'C4-5b, Carmelray Industrial Park 2, Calamba, 4027 Laguna',
      lat: 14.1890, lng: 121.1480, phone: '+63 49 545 9572', hours: 'Hours vary — call ahead', open: false,
      types: [], scales: ['Industrial'], reach: ['Province'],
      src: 'Filbuild B2B profile (DENR-accredited; electronics-industry scrap)',
      maps: 'https://www.google.com/maps/search/?api=1&query=Integrated+Recycling+Industries+Philippines&query_place_id=ChIJAQAAUKJjvTMRlZyzhXOUPj4'
    },
    {
      id: 'hmr-envirocycle-silangan', kind: 'DENR-accredited recycler',
      name: 'Envirocycle Philippines Inc. (HMR Envirocycle)',
      addr: 'HMR Compound, C. A. Yulo Ave, Silangan Industrial Park, Canlubang, Calamba, 4028 Laguna',
      lat: 14.2050, lng: 121.1200, phone: '+63 917 834 9596', hours: 'Call to confirm hours', open: true,
      types: ['small-electronics', 'computers', 'phones', 'batteries', 'cables', 'appliances'],
      scales: ['Individual', 'Household', 'Community', 'Industrial'], reach: ['Province', 'Region'],
      src: 'HMR Envirocycle / Globe e-waste guide',
      maps: 'https://www.google.com/maps/search/?api=1&query=Envirocycle+Philippines+Inc&query_place_id=ChIJPapStp9jvTMRPxScDV1wg9w'
    }
  ];

  var TYPE_LABEL = {
    'small-electronics': 'Small electronics', computers: 'Computers & laptops', phones: 'Phones & tablets',
    batteries: 'Batteries', cables: 'Cables & accessories', appliances: 'Large appliances'
  };
  var TYPE_QUERY = {
    'small-electronics': 'small electronics e-waste', computers: 'computer laptop e-waste recycling',
    phones: 'phone e-waste drop-off', batteries: 'battery recycling drop-off',
    cables: 'cable e-waste recycling', appliances: 'appliance e-waste recycling'
  };

  function has(arr, v) { return Array.isArray(arr) && arr.indexOf(v) !== -1; }

  EcoTracker.init({
    sites: SITES,
    page: 'ewaste.html',
    activityKind: 'dropoff',
    tallyPrefix: 'dropoff-',
    noun: 'drop-off', nounPlural: 'drop-offs',
    defaultHint: 'Showing sites near Calamba, Laguna (default area). Use your location for distances from where you are.',
    locatedHint: 'Open a site in Maps or get directions.',
    metaTail: 'call ahead to confirm accepted materials',
    exploreStatus: 'Searching Maps for nearby e-waste facilities; results may differ from the listings below',
    exploreQuery: function (v) { return TYPE_QUERY[v.type] || 'e-waste recycling'; },
    matches: function (s, v) {
      return (!v.type || has(s.types, v.type)) && (!v.scale || has(s.scales, v.scale)) && (!v.reach || has(s.reach, v.reach));
    },
    describeFilters: function (v) {
      var p = [];
      if (v.type) p.push(TYPE_LABEL[v.type]);
      if (v.scale) p.push(v.scale + ' quantity');
      if (v.reach) p.push(v.reach + ' reach');
      return p.join(' · ');
    },
    filterNote: function (v) {
      if (v.type || v.scale || v.reach) {
        return 'These are approximate matches. Accepted items come from each programme’s public page; quantity and reach are EcoTekk’s estimates from the kind of site. None are confirmed by the facilities, so call ahead before bringing anything.';
      }
      return 'Pick a waste type, quantity, or location scale to see approximate matches. “Location scale” is how wide an area a drop-off serves, from a single barangay up to a whole region.';
    },
    emptyMessage: function (v) {
      if (v.reach === 'Barangay') {
        return 'No barangay-level drop-off is listed yet. Ask your barangay hall whether its Materials Recovery Facility (MRF) accepts e-waste, or try City/Municipality.';
      }
      return 'No listed drop-off matches this combination. Try loosening one filter, or use Explore nearby to search Maps. For business-scale loads, contact a recycler directly.';
    },
    tags: function (s) {
      var t = [s.kind];
      if (s.types.length) s.types.forEach(function (x) { t.push(TYPE_LABEL[x]); });
      else t.push('Business / industrial scrap');
      return t;
    },
    detail: function (s) {
      return 'Quantity: ' + s.scales.join(', ') + ' · Reach: ' + s.reach.join(', ') + ' (estimated)';
    }
  });
})();
