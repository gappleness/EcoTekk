// Paste the WEB APP config from Firebase Console > Project settings > Your apps.
// This is a public web configuration, NOT a service-account/private key.
window.ECOTEKK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAokvwUbPY7Me0Js2sQxefMzwa0POKOgwI",
  authDomain: "ecotekk-d0694.firebaseapp.com",
  projectId: "ecotekk-d0694",
  appId: "1:213247108153:web:fba5c93d24c460b7bdd9e8"
};

// ---- AI helper (Gemini through Firebase AI Logic) -------------------------------------------------------
// No API key lives in this repo: Firebase AI Logic holds it server-side. To switch it on:
//   1. Firebase console > Build > AI Logic > Get started > choose "Gemini Developer API" (stay on the Spark plan).
//   2. (Strongly recommended) Firebase console > App Check > register this web app with reCAPTCHA v3 / Enterprise,
//      paste the SITE key below, then enforce App Check for AI Logic so only your site can call it.
// Models are tried in order; if one is unavailable or out of free quota, the next one is used.
window.ECOTEKK_AI = {
  enabled: true,
  models: ['gemini-3.5-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'],
  appCheckSiteKey: '6LdVAi0uAAAAADRr7V-lKiY_W5R7AMm-Qh43Jo8-',      // reCAPTCHA SITE key (public, not the secret key). Must be set if App Check is enforced.
  appCheckProvider: 'enterprise',   // 'v3' for reCAPTCHA v3, 'enterprise' if you registered reCAPTCHA Enterprise
  maxPerHour: 20            // soft per-browser limit so one person cannot burn the shared free quota
};
