/* EcoTekk badges. A member "helps someone" when the person who asked a forum question marks their reply as
   helpful. Each of those is a credit document at userStats/{uid}/credits/{postId_replyId} (see firestore.rules, which
   makes credits impossible to self-award: the asker writes them, never for their own reply). The badge is just a
   count of those documents, so it cannot be inflated from the browser.

   EcoBadges.helpedCount(uid) -> Promise<number>      EcoBadges.tier(n) -> { name, next } | null
   EcoBadges.chip(uid)        -> <span> that fills itself in (empty when the member has helped nobody yet) */
(function (global) {
  'use strict';
  var TIERS = [
    { at: 1,  name: 'Helping hand' },
    { at: 5,  name: 'Fix-it friend' },
    { at: 15, name: 'Tech guide' },
    { at: 40, name: 'Community hero' }
  ];
  var CAP = 200, cache = {};

  function db() { try { return global.firebase && firebase.apps.length ? firebase.firestore() : null; } catch (e) { return null; } }

  function helpedCount(uid) {
    if (!uid) return Promise.resolve(0);
    if (cache[uid]) return cache[uid];
    var d = db();
    if (!d) return Promise.resolve(0);
    cache[uid] = d.collection('userStats').doc(uid).collection('credits').limit(CAP).get()
      .then(function (s) { return s.size; })
      .catch(function () { delete cache[uid]; return 0; });
    return cache[uid];
  }
  function forget(uid) { delete cache[uid]; }

  function tier(n) {
    var cur = null, next = null;
    TIERS.forEach(function (t) { if (n >= t.at) cur = t; });
    for (var i = 0; i < TIERS.length; i++) if (n < TIERS[i].at) { next = TIERS[i]; break; }
    return cur ? { name: cur.name, next: next } : (next ? { name: '', next: next } : null);
  }
  function label(n) { return 'Helped ' + (n >= CAP ? CAP + '+' : n) + (n === 1 ? ' person' : ' people'); }

  function chip(uid) {
    var s = document.createElement('span'); s.className = 'badge-chip'; s.hidden = true;
    helpedCount(uid).then(function (n) {
      if (!n) return;
      var t = tier(n);
      s.textContent = '★ ' + (t && t.name ? t.name + ' · ' : '') + label(n);
      s.title = label(n) + ' (the person who asked marked their replies as helpful)';
      s.hidden = false;
    });
    return s;
  }

  global.EcoBadges = { TIERS: TIERS, helpedCount: helpedCount, forget: forget, tier: tier, label: label, chip: chip };
})(window);
