/* Firebase compat SDK is loaded by the HTML before this file. */
(function(global) {
  const cfg = global.ECOTEKK_FIREBASE_CONFIG;
  const configured = cfg && cfg.apiKey !== 'REPLACE_ME' && cfg.projectId !== 'REPLACE_ME';
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
  if (configured) {
    firebase.initializeApp(cfg);
    auth = firebase.auth(); db = firebase.firestore();
    auth.onAuthStateChanged(u => {user=u; readyResolve(u);}, e=>{console.error(e);readyResolve(null);});
  } else {readyResolve(null);}
  function requireConfig(){if(!configured)throw new Error('Configure firebase-config.js first.');}
  function profileRef(){if(!user)throw new Error('Please sign in.');return db.collection('profiles').doc(user.uid);}
  async function ensureProfile(u, displayName) {
    const ref=db.collection('profiles').doc(u.uid);
    const snap=await ref.get();
    if(!snap.exists) await ref.set({name:displayName || u.displayName || u.email.split('@')[0], email:u.email || '', createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  }
  async function signup(name,password,email){requireConfig();if(!name.trim())throw new Error('Enter your name.');const c=await auth.createUserWithEmailAndPassword(email.trim(),password);await c.user.updateProfile({displayName:name.trim()});await ensureProfile(c.user,name.trim());await c.user.sendEmailVerification();return c.user;}
  async function login(email,password){requireConfig();const c=await auth.signInWithEmailAndPassword(email.trim(),password);await ensureProfile(c.user);return c.user;}
  async function googleLogin(){requireConfig();const provider=new firebase.auth.GoogleAuthProvider();const c=await auth.signInWithPopup(provider);await ensureProfile(c.user);return c.user;}
  async function resetPassword(email){requireConfig();await auth.sendPasswordResetEmail(email.trim());}
  async function logout(){requireConfig();await auth.signOut();}
  function currentUser(){return user ? {uid:user.uid,name:user.displayName || (user.email||'').split('@')[0],email:user.email,emailVerified:user.emailVerified} : null;}
  // No client-controlled cloud points: a verified server-side award/redemption workflow is required.
  global.EcotekkAuth={ready,currentUser,signup,login,googleLogin,resetPassword,logout,REWARDS:rewards,
    watchProfile(callback){requireConfig();return profileRef().onSnapshot(s=>callback(s.exists?s.data():null));},
    getPoints(){return 0;},getHistory(){return [];},
    async recordDisposal(){throw new Error('Point awards are disabled until a verified server-side disposal workflow is installed.');},
    async redeem(){throw new Error('Reward redemption is disabled until a secure server-side workflow is installed.');}
  };
})(window);
