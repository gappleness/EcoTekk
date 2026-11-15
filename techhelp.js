/* EcoTekk Tech Help: repair shop / service center tracker.
   Layout, location, filters and the "I went here" tally all live in tracker.js (shared with ewaste.js).
   This file only holds the shop data and the page-specific wording.

   id      lowercase letters, numbers, - or _ (max 54). Used (with the "shop-" prefix) as the Firestore document
           id, so don't rename an id after launch or its count will start again from zero.
   lat/lng APPROXIMATE coordinates used only to estimate distance. Map links and directions use the name + address.
   devices any of: phones, laptops, electronics
   kind    'authorized' (brand service center) or 'independent' (shop / kiosk)
   src     where the listing was compiled from, so it can be re-checked.
   Listings are compiled from public pages and are NOT verified by EcoTekk. */
(function () {
  'use strict';

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
  var KIND_LABEL = { authorized: 'Brand service center', independent: 'Independent shop / kiosk' };
  var EXPLORE = { phones: 'phone tablet repair', laptops: 'laptop computer repair', electronics: 'electronics repair' };

  EcoTracker.init({
    sites: SHOPS,
    page: 'techhelp.html',
    tallyPrefix: 'shop-',
    noun: 'shop', nounPlural: 'shops',
    defaultHint: 'Showing shops near Calamba, Laguna (default area). Use your location for distances from where you are.',
    locatedHint: 'Open a shop in Maps or get directions.',
    metaTail: 'call ahead to confirm hours, prices and your device',
    exploreStatus: 'Searching Maps for repair shops nearby; results may differ from the listings below',
    exploreQuery: function (v) { return EXPLORE[v.device] || 'phone laptop repair'; },
    matches: function (s, v) {
      return (!v.device || s.devices.indexOf(v.device) !== -1) && (!v.kind || s.kind === v.kind);
    },
    describeFilters: function (v) {
      var p = [];
      if (v.device) p.push(DEVICE_LABEL[v.device]);
      if (v.kind) p.push(KIND_LABEL[v.kind]);
      return p.join(' · ');
    },
    filterNote: function () {
      return 'A brand service center usually only handles its own brand (and may be the right call for warranty work). Independent shops and kiosks take a wider range of devices. Confirm what they accept before you go.';
    },
    emptyMessage: function () {
      return 'No listed shop matches these filters. Try “Any device” or “Any type”, or use Explore nearby to search Maps.';
    },
    tags: function (s) {
      var t = [s.kind === 'authorized' ? 'Brand service center' + (s.brand ? ' · ' + s.brand : '') : 'Independent shop'];
      s.devices.forEach(function (d) { t.push(DEVICE_LABEL[d]); });
      return t;
    }
  });
})();
