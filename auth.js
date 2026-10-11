(function (global) {
  var USERS_KEY = 'ecotekk-users';
  var SESSION_KEY = 'ecotekk-session';
  var POINTS_KEY = 'ecotekk-points';
  var HISTORY_KEY = 'ecotekk-history';

  var REWARDS = [
    { id: 'tote', name: 'Recycled tote bag', cost: 50, desc: 'Made from recovered PET bottles.' },
    { id: 'plant', name: 'Seedling kit', cost: 80, desc: 'Grow a small indoor plant at home.' },
    { id: 'voucher', name: '₱50 local cafe voucher', cost: 120, desc: 'Partner cafe near major drop-off hubs.' },
    { id: 'powerbank', name: 'Refurbished power bank', cost: 250, desc: 'Certified refurbished, 10,000 mAh.' }
  ];

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUsers() {
    return load(USERS_KEY, []);
  }

  function getSession() {
    return load(SESSION_KEY, null);
  }

  function setSession(user) {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    save(SESSION_KEY, { name: user.name, email: user.email || '' });
  }

  function getPoints(name) {
    var map = load(POINTS_KEY, {});
    return map[name] || 0;
  }

  function setPoints(name, pts) {
    var map = load(POINTS_KEY, {});
    map[name] = Math.max(0, pts);
    save(POINTS_KEY, map);
  }

  function addPoints(name, amount) {
    setPoints(name, getPoints(name) + amount);
    return getPoints(name);
  }

  function getHistory(name) {
    var all = load(HISTORY_KEY, {});
    return all[name] || [];
  }

  function pushHistory(name, entry) {
    var all = load(HISTORY_KEY, {});
    if (!all[name]) all[name] = [];
    all[name].unshift(entry);
    save(HISTORY_KEY, all);
  }

  function signup(name, password, email) {
    name = (name || '').trim();
    if (!name || !password) return { ok: false, error: 'Name and password are required.' };
    var users = getUsers();
    if (users.some(function (u) { return u.name.toLowerCase() === name.toLowerCase(); })) {
      return { ok: false, error: 'That name is already taken.' };
    }
    var user = { name: name, password: password, email: (email || '').trim() };
    users.push(user);
    save(USERS_KEY, users);
    setPoints(name, 0);
    setSession(user);
    return { ok: true, user: user };
  }

  function login(name, password) {
    name = (name || '').trim();
    var users = getUsers();
    // Seed default demo user if empty
    if (users.length === 0) {
      users.push({ name: 'Bernard', password: 'Bernardpassword', email: '' });
      save(USERS_KEY, users);
      setPoints('Bernard', 30);
    }
    var user = users.find(function (u) {
      return u.name.toLowerCase() === name.toLowerCase() && u.password === password;
    });
    if (!user) return { ok: false, error: 'Incorrect name or password.' };
    setSession(user);
    return { ok: true, user: user };
  }

  function logout() {
    setSession(null);
  }

  function currentUser() {
    return getSession();
  }

  function redeem(name, rewardId) {
    var reward = REWARDS.find(function (r) { return r.id === rewardId; });
    if (!reward) return { ok: false, error: 'Unknown reward.' };
    var pts = getPoints(name);
    if (pts < reward.cost) return { ok: false, error: 'Not enough points.' };
    setPoints(name, pts - reward.cost);
    pushHistory(name, {
      type: 'redeem',
      label: reward.name,
      points: -reward.cost,
      at: new Date().toISOString()
    });
    return { ok: true, remaining: getPoints(name), reward: reward };
  }

  function recordDisposal(name, siteName, pointsEarned) {
    pointsEarned = pointsEarned || 25;
    addPoints(name, pointsEarned);
    pushHistory(name, {
      type: 'disposal',
      label: siteName || 'E-waste drop-off',
      points: pointsEarned,
      at: new Date().toISOString()
    });
    return getPoints(name);
  }

  global.EcotekkAuth = {
    signup: signup,
    login: login,
    logout: logout,
    currentUser: currentUser,
    getPoints: getPoints,
    redeem: redeem,
    recordDisposal: recordDisposal,
    getHistory: getHistory,
    REWARDS: REWARDS
  };
})(window);
