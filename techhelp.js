/* EcoTekk Tech Help: repair shop / service center tracker.
   Layout, location, filters and the "I went here" tally all live in tracker.js (shared with ewaste.js).
   This file only holds the shop data and the page-specific wording.

   id      lowercase letters, numbers, - or _ (max 54). Used (with the "shop-" prefix) as the Firestore document
           id, so don't rename an id after launch or its count will start again from zero.
   lat/lng APPROXIMATE coordinates used only to estimate distance. Map links and directions use the name + address.
   devices any of: phones, laptops, electronics
   kind    'authorized' (brand service center) or 'independent' (shop / kiosk)
   brand   optional — set on authorized centers; also used for filter matching
   tips    short, device-aware guidance shown on the card (dynamic per shop)
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
      brands: ['Samsung', 'Apple', 'ASUS', 'Acer', 'Lenovo', 'HP', 'Dell'],
      tips: 'Independent mall shop. Good first stop for laptop battery, screen and general phone repairs. Ask about diagnostic fee and turnaround before leaving the device.',
      src: 'ClickTheCity listing'
    },
    {
      id: 'ifix-kiosk-sm-calamba',
      name: 'Cellphone Laptop Repair (iFix kiosk)',
      addr: 'iFix kiosk, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '+63 963 311 3311', hours: 'Kiosk · call to confirm hours',
      devices: ['phones', 'laptops'], kind: 'independent',
      brands: ['Samsung', 'Apple', 'Xiaomi', 'OPPO', 'vivo', 'realme'],
      tips: 'Walk-up kiosk. Useful for quick phone screen / charging-port checks. Confirm whether they keep parts for your exact model before agreeing to a repair.',
      src: 'Facebook page'
    },
    {
      id: 'kg-cellphone-repair-sm-calamba',
      name: 'KG Cellphone Repair',
      addr: 'Store service section, SM City Calamba, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '+63 929 951 0005', hours: 'Kiosk · call to confirm hours',
      devices: ['phones', 'laptops'], kind: 'independent',
      brands: ['Samsung', 'Xiaomi', 'OPPO', 'vivo', 'realme', 'Huawei'],
      tips: 'Independent phone-focused kiosk. Ask whether they can source original or compatible parts for your brand and model, and get the quote in writing.',
      src: 'Facebook page'
    },
    {
      id: 'gsn-wireless-sm-calamba',
      name: 'GSN Wireless Cellphone Repair',
      addr: '2nd Floor Cyberzone, SM City Calamba, National Highway, Brgy. Real, Calamba City, Laguna',
      lat: 14.1905, lng: 121.1637,
      phone: '+63 992 381 1205', hours: 'Mall shop · call to confirm hours',
      devices: ['phones', 'laptops'], kind: 'independent',
      brands: ['Samsung', 'Apple', 'Xiaomi', 'OPPO', 'vivo'],
      tips: 'Cyberzone shop. Useful for phone and light laptop work. Confirm data backup policy and whether they open the device on-site.',
      src: 'Facebook page'
    },
    {
      id: 'oppo-service-citymall-calamba',
      name: 'OPPO Service Center (CityMall Calamba)',
      addr: 'GF, CityMall Laguna, National Highway, Lecheria, Calamba City, 4027 Laguna',
      lat: 14.2040, lng: 121.1580,
      phone: '+63 916 732 6776', hours: 'Call to confirm hours',
      devices: ['phones'], kind: 'authorized', brand: 'OPPO',
      brands: ['OPPO', 'realme'],
      tips: 'Authorized OPPO center. Prefer this for warranty claims, software issues under warranty, and official parts. Bring proof of purchase and the exact model name.',
      src: 'OPPO Philippines / Apple Maps'
    },
    {
      id: 'honor-citylight-telecom-calamba',
      name: 'Citylight Telecom Centre (HONOR service partner)',
      addr: 'Calamba CT Crossing Bldg., Purok 4, National Highway, Brgy. 1 Real Road, Calamba City, Laguna',
      lat: 14.2070, lng: 121.1650,
      phone: '+63 927 817 7779', hours: 'Mon–Sun, 10:00 AM–7:00 PM (as listed by HONOR)',
      devices: ['phones'], kind: 'authorized', brand: 'HONOR',
      brands: ['HONOR', 'Huawei'],
      tips: 'HONOR service partner. Best for HONOR/Huawei warranty and official diagnostics. Ask whether your exact model is still supported before traveling.',
      src: 'HONOR Philippines service center list'
    },
    {
      id: 'sy-electronics-parian-calamba',
      name: 'Sy Electronics Sales and Repair Shop',
      addr: 'National Highway, Brgy. Parian, Calamba City, 4027 Laguna',
      lat: 14.2120, lng: 121.1655,
      phone: '(049) 834 2218', hours: 'Mon–Sat, about 8:00 AM–5:30 PM (as listed on Waze)',
      devices: ['electronics'], kind: 'independent',
      brands: [],
      tips: 'Broader electronics shop. Suitable for non-phone gadgets, small appliances and mixed electronics. Call ahead with the exact device type.',
      src: 'Waze listing'
    }
  ];

  var DEVICE_LABEL = { phones: 'Phones & tablets', laptops: 'Laptops & computers', electronics: 'Other electronics' };
  var KIND_LABEL = { authorized: 'Brand service center', independent: 'Independent shop / kiosk' };
  var EXPLORE = { phones: 'phone tablet repair', laptops: 'laptop computer repair', electronics: 'electronics repair' };

  // Collect unique brands that appear on any shop (for the Brand filter)
  var ALL_BRANDS = [];
  SHOPS.forEach(function (s) {
    var list = s.brands && s.brands.length ? s.brands : (s.brand ? [s.brand] : []);
    list.forEach(function (b) {
      if (b && ALL_BRANDS.indexOf(b) === -1) ALL_BRANDS.push(b);
    });
  });
  ALL_BRANDS.sort();

  function hasBrand(s, brand) {
    if (!brand) return true;
    if (s.brand && s.brand.toLowerCase() === brand.toLowerCase()) return true;
    if (s.brands && s.brands.some(function (b) { return b.toLowerCase() === brand.toLowerCase(); })) return true;
    // Independent shops without explicit brands still match "any brand" only when no brand filter is set
    return false;
  }

  EcoTracker.init({
    sites: SHOPS,
    page: 'techhelp.html',
    activityKind: 'shop',
    tallyPrefix: 'shop-',
    noun: 'shop', nounPlural: 'shops',
    defaultHint: 'Showing shops near Calamba, Laguna (default area). Use your location for distances from where you are.',
    locatedHint: 'Open a shop in Maps or get directions.',
    metaTail: 'call ahead to confirm hours, prices and your exact device',
    exploreStatus: 'Searching Maps for repair shops nearby; results may differ from the listings below',
    exploreQuery: function (v) {
      if (v.brand && v.device) return v.brand + ' ' + (EXPLORE[v.device] || 'repair');
      if (v.brand) return v.brand + ' service center repair';
      return EXPLORE[v.device] || 'phone laptop repair';
    },
    matches: function (s, v) {
      var deviceOk = !v.device || (s.devices && s.devices.indexOf(v.device) !== -1);
      var kindOk = !v.kind || s.kind === v.kind;
      var brandOk = hasBrand(s, v.brand);
      // When a brand is selected and the shop is independent with no brands list, still show independents
      // only if the user did not force "authorized"
      if (v.brand && s.kind === 'independent' && (!s.brands || !s.brands.length) && !s.brand) {
        brandOk = true; // independents can often take any brand
      }
      return deviceOk && kindOk && brandOk;
    },
    describeFilters: function (v) {
      var p = [];
      if (v.device) p.push(DEVICE_LABEL[v.device] || v.device);
      if (v.kind) p.push(KIND_LABEL[v.kind] || v.kind);
      if (v.brand) p.push(v.brand + ' brand');
      return p.join(' · ') || 'All listed shops';
    },
    filterNote: function (v, count) {
      var parts = [];
      if (v.brand && v.kind === 'authorized') {
        parts.push('Showing authorized ' + v.brand + ' service options. These are usually the right choice for warranty work and official parts.');
      } else if (v.brand && v.kind === 'independent') {
        parts.push('Showing independent shops that can handle ' + v.brand + ' devices. Confirm they stock parts for your exact model.');
      } else if (v.brand) {
        parts.push('Filtering for ' + v.brand + '. Authorized centers for this brand appear first when available; independent shops may also accept it.');
      } else if (v.kind === 'authorized') {
        parts.push('Brand service centers usually handle only their own brand and are best for warranty claims.');
      } else if (v.kind === 'independent') {
        parts.push('Independent shops and kiosks take a wider range of brands. Always confirm the exact model and get a written quote.');
      } else if (v.device === 'phones') {
        parts.push('Phone & tablet repairs. Prefer an authorized center if the device is still under warranty.');
      } else if (v.device === 'laptops') {
        parts.push('Laptop & computer repairs. Ask about diagnostic fees, data backup, and whether the shop opens the chassis on-site.');
      } else if (v.device === 'electronics') {
        parts.push('Broader electronics. Call ahead with the exact device type (camera, speaker, console, etc.).');
      } else {
        parts.push('A brand service center usually only handles its own brand (and may be right for warranty work). Independent shops take a wider range. Confirm before you go.');
      }
      if (typeof count === 'number') {
        parts.push(count === 0 ? 'No matches for this combination.' : count + ' match' + (count === 1 ? '' : 'es') + ' for your filters.');
      }
      return parts.join(' ');
    },
    emptyMessage: function (v) {
      if (v.brand && v.kind === 'authorized') {
        return 'No authorized ' + v.brand + ' service center is listed in this area yet. Try “Independent shop” or clear the brand filter, or use Explore nearby.';
      }
      if (v.brand) {
        return 'No listed shop matches ' + v.brand + ' with these other filters. Loosen the device or type filter, or search Maps with Explore nearby.';
      }
      if (v.device && v.kind) {
        return 'No listed shop matches this device + type combination. Try “Any type” or “Any device”, or use Explore nearby.';
      }
      return 'No listed shop matches these filters. Try clearing one filter, or use Explore nearby to search Maps.';
    },
    tags: function (s) {
      var t = [];
      if (s.kind === 'authorized') {
        t.push('Brand service center' + (s.brand ? ' · ' + s.brand : ''));
      } else {
        t.push('Independent shop');
      }
      (s.devices || []).forEach(function (d) { t.push(DEVICE_LABEL[d] || d); });
      if (s.brands && s.brands.length && s.kind === 'independent') {
        t.push('Handles: ' + s.brands.slice(0, 4).join(', ') + (s.brands.length > 4 ? '…' : ''));
      }
      return t;
    },
    detail: function (s) {
      var lines = [];
      if (s.tips) lines.push(s.tips);
      if (s.brand) lines.push('Official brand focus: ' + s.brand);
      if (s.brands && s.brands.length && s.kind === 'independent') {
        lines.push('Commonly handles: ' + s.brands.join(', '));
      }
      return lines.join(' · ');
    }
  });

  // Populate Brand filter options dynamically from the shop data
  function fillBrandFilter() {
    var sel = document.getElementById('brandFilter');
    if (!sel) return;
    // Keep the first "Any brand" option
    while (sel.options.length > 1) sel.remove(1);
    ALL_BRANDS.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      sel.appendChild(opt);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fillBrandFilter);
  } else {
    fillBrandFilter();
  }
})();
