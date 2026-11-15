/* EcoTekk activity memory: remembers, on THIS device, which community counts the signed-in user (or guest)
   has added, so profile.html can list them. It is only a convenience index. The real "have I counted this?"
   answer always lives in Firestore, and profile.html re-checks every entry against it. */
(function (g) {
  'use strict';
  var PREFIX = 'ecotekk.activity.v1:';
  function read(uid) {
    try {
      var a = JSON.parse(localStorage.getItem(PREFIX + uid) || '[]');
      return Array.isArray(a) ? a.filter(function (e) { return e && typeof e.id === 'string'; }) : [];
    } catch (e) { return []; }
  }
  function write(uid, list) { try { localStorage.setItem(PREFIX + uid, JSON.stringify(list.slice(0, 200))); } catch (e) { /* storage full or blocked */ } }
  g.EcoActivity = {
    list: function (uid) { return uid ? read(uid) : []; },
    add: function (uid, entry) {
      if (!uid || !entry || !entry.id) return;
      var list = read(uid), old = list.filter(function (e) { return e.id === entry.id; })[0];
      list = list.filter(function (e) { return e.id !== entry.id; });
      list.unshift({
        id: String(entry.id), kind: entry.kind === 'issue' || entry.kind === 'shop' ? entry.kind : 'dropoff',
        label: String(entry.label || entry.id).slice(0, 120), href: String(entry.href || '').slice(0, 300),
        ts: (old && old.ts) || entry.ts || Date.now()
      });
      write(uid, list);
    },
    remove: function (uid, id) { if (uid) write(uid, read(uid).filter(function (e) { return e.id !== id; })); }
  };
})(window);
