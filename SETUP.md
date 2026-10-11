# Ecotekk Firebase setup

1. Create a Firebase project at https://console.firebase.google.com/ and add a Web app.
2. Copy the Firebase **web config** fields into `firebase-config.js`. Never paste a service account private key.
3. Authentication > Sign-in method: enable **Email/Password** and **Google**; select the Google support email.
4. Authentication > Settings > Authorized domains: add YOUR-USERNAME.github.io (and localhost for local testing if needed). Do not include https:// or /Ecotekk/. New projects may not include localhost automatically.
5. Firestore Database > Create database > production mode. Firestore > Rules: paste the exact contents of `firestore.rules`, then Publish.
6. Upload all site files, including firebase-config.js, to the root of your GitHub Pages repository. `firestore.rules` and this guide are setup references, not deployed security controls by themselves.
7. Test email registration, verification email, login, Google popup, logout, password reset, and login from a second browser/device. For Google sign-in, allow popups; check the authorized domain if you see auth/unauthorized-domain.
8. Old localStorage demo users are NOT migrated. They must register again; never reuse or upload their plaintext passwords. Optionally remove old ecotekk-users data from your own browser.

## Security scope
This package implements Firebase Authentication and owner-only cloud profile reads. It deliberately disables client-controlled points, disposal awards and reward redemption. Those require a trusted server-side workflow (e.g. Cloud Functions with verified disposal events and Firestore transactions) and separate rules. Do NOT make client-writable points fields or deploy test-mode open rules. This package is not a complete production rewards service.
