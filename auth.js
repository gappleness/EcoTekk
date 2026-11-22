/* Firebase compat SDK is loaded by the HTML before this file. */
(function(global) {
  const cfg = global.ECOTEKK_FIREBASE_CONFIG;
  const configured = cfg && cfg.apiKey && cfg.projectId && cfg.appId && !Object.values(cfg).some(v => typeof v === 'string' && (v.includes('REPLACE_ME') || v.includes('YOUR_')));
  let user = null;
  let readyResolve;
  const ready = new Promise(resolve => readyResolve = resolve);
  const rewards = [
    {id:'tote',name:'Recycled tote bag',cost:50,desc:'Made from recovered PET bottles.'},
    {id:'plant',name:'Seedling kit',cost:80,desc:'Grow a small indoor plant at home.'},
    {id:'voucher',name:'₱50 local cafe voucher',cost:120,desc:'Partner cafe near major drop-off hubs.'},
    {id:'powerbank',name:'Refurbished power bank',cost:250,desc:'Certified refurbished, 10,000 mAh.'}
  ];
  let auth, db;
  let persistenceReady = Promise.resolve();
  if (configured) {
    firebase.initializeApp(cfg);
    auth = firebase.auth(); db = firebase.firestore();
    // Keep the account signed in across reloads and browser restarts.
    persistenceReady = auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    auth.onAuthStateChanged(u => {user=u; readyResolve(u);}, e=>{console.error(e);readyResolve(null);});
  } else {readyResolve(null);}
  async function ensurePersistence(){requireConfig(); await persistenceReady;}
  function requireConfig(){if(!configured)throw new Error('Configure firebase-config.js first.');}
  function profileRef(){const active=auth && auth.currentUser;if(!active)throw new Error('Please sign in.');return db.collection('profiles').doc(active.uid);}
  async function ensureProfile(u, displayName) {
    const ref=db.collection('profiles').doc(u.uid);
    const snap=await ref.get();
    if(!snap.exists) await ref.set({name:displayName || u.displayName || u.email.split('@')[0], email:u.email || '', createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  }
  async function signup(name,password,email){await ensurePersistence();if(!name.trim())throw new Error('Enter your name.');const c=await auth.createUserWithEmailAndPassword(email.trim(),password);await c.user.updateProfile({displayName:name.trim()});await ensureProfile(c.user,name.trim());await c.user.sendEmailVerification();return c.user;}
  async function login(email,password){await ensurePersistence();const c=await auth.signInWithEmailAndPassword(email.trim(),password);await ensureProfile(c.user);return c.user;}
  async function googleLogin(){await ensurePersistence();const provider=new firebase.auth.GoogleAuthProvider();const c=await auth.signInWithPopup(provider);await ensureProfile(c.user);return c.user;}
  async function resetPassword(email){requireConfig();await auth.sendPasswordResetEmail(email.trim());}
  // Guest access uses Firebase Anonymous Auth: a real, device-bound session with no email or profile document.
  // Guests are VIEW-ONLY: they can read every page and counter, but cannot count visits, report issues, rate,
  // post, or use the AI helper. firestore.rules enforces this (sign_in_provider != 'anonymous'), the UI just
  // explains it.
  async function guestLogin(){await ensurePersistence();if(auth.currentUser)return auth.currentUser;const c=await auth.signInAnonymously();return c.user;}
  async function logout(){requireConfig();await auth.signOut();}
  function currentUser(){const active = auth ? auth.currentUser : user; if(!active)return null; const guest=!!active.isAnonymous; return {uid:active.uid,isGuest:guest,name:guest?'Guest':(active.displayName || (active.email||'').split('@')[0]),email:guest?'':active.email,emailVerified:guest?false:active.emailVerified};}
  // Email verification helpers for the profile page (real accounts only).
  async function resendVerification(){requireConfig();const u=auth.currentUser;if(!u||u.isAnonymous)throw new Error('Sign in with an email account first.');await u.sendEmailVerification();}
  async function refreshUser(){requireConfig();if(auth.currentUser)await auth.currentUser.reload();}
  function isGuest(){const u=currentUser();return !!(u&&u.isGuest);}
  function isMember(){const u=currentUser();return !!(u&&!u.isGuest);}
  // Roles. An admin is a person with a document at admins/{uid}. Only the Firebase console (or another admin)
  // can create it; the rules never let a user write their own. The UI check below only decides what to SHOW,
  // firestore.rules is what actually protects admin data.
  let adminCache=null;
  function isAdmin(){
    if(!configured)return Promise.resolve(false);
    if(adminCache)return adminCache;
    adminCache=ready.then(function(){const u=auth&&auth.currentUser;if(!u||u.isAnonymous)return false;return db.collection('admins').doc(u.uid).get().then(function(s){return s.exists;}).catch(function(){return false;});});
    return adminCache;
  }
  // Is this account restricted by an admin (bans/{uid})? Used to explain why posting is blocked.
  function isRestricted(){
    return ready.then(function(){const u=auth&&auth.currentUser;if(!u||u.isAnonymous)return false;return db.collection('bans').doc(u.uid).get().then(function(s){return s.exists;}).catch(function(){return false;});});
  }
  // Fills the #nav-auth item on every page: Profile for members, Guest for guests, Login otherwise.
  // Admins also get an Admin link.
  function renderNav(){ready.then(function(){
    const el=document.getElementById('nav-auth'),u=currentUser();
    if(el&&u)el.innerHTML='<a href="profile.html">'+(u.isGuest?'Guest':'Profile')+'</a>';
    if(u&&!u.isGuest)isAdmin().then(function(yes){
      if(!yes||document.getElementById('nav-admin'))return;
      const ul=document.getElementById('et-nav-links');if(!ul)return;
      const li=document.createElement('li');li.id='nav-admin';
      const a=document.createElement('a');a.href='admin.html';a.textContent='Admin';
      if(/admin\.html$/.test(location.pathname))a.setAttribute('aria-current','page');
      li.appendChild(a);
      const theme=document.getElementById('theme-toggle');
      const themeLi=theme&&theme.closest?theme.closest('li'):null;
      if(themeLi&&themeLi.parentNode===ul)ul.insertBefore(li,themeLi);else ul.appendChild(li);
    });
  }).catch(function(){});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderNav);else renderNav();
  // No client-controlled cloud points: a verified server-side award/redemption workflow is required.
  global.EcotekkAuth={ready,currentUser,isGuest,isMember,isAdmin,isRestricted,resendVerification,refreshUser,signup,login,googleLogin,guestLogin,resetPassword,logout,REWARDS:rewards,
    watchProfile(callback){requireConfig();if(isGuest()){callback(null);return function(){};}return profileRef().onSnapshot(s=>callback(s.exists?s.data():null));},
    getPoints(){return 0;},getHistory(){return [];},
    async recordDisposal(){throw new Error('Point awards are disabled until a verified server-side disposal workflow is installed.');},
    async redeem(){throw new Error('Reward redemption is disabled until a secure server-side workflow is installed.');}
  };
})(window);
