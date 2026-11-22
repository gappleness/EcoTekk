# EcoTekk: what to switch on after this update

Nothing below needs a paid plan or a server. Do these in the Firebase console for project `ecotekk-d0694`.

## 1. Publish the new Firestore rules (required)
Firestore Database → Rules → paste the whole of `firestore.rules` → Publish.
Until you do, ratings, the forum, "Did this fix it?", badges and the admin page will show "unavailable" or "permission denied".
Note: the rules were written carefully but were not run against the Firebase emulator, so test each feature once after publishing.

## 2. Make yourself the first admin
Admins are people with a document at `admins/{uid}`. Nobody can create that from the website the first time.
1. Sign up on the site with a real account (not guest).
2. Firebase console → Authentication → Users → copy your **User UID**.
3. Firestore Database → Start collection `admins` → Document ID = your UID → add one field, e.g. `by` (string) = `console`.
4. Reload the site. An **Admin** link appears in the nav. From admin.html → Members you can make other admins and restrict members.

## 3. Turn on the AI helper (Gemini, free tier)
1. Firebase console → Build → **AI Logic** → Get started → choose **Gemini Developer API**. Stay on the Spark (free) plan.
2. Strongly recommended: Firebase console → **App Check** → register the web app with reCAPTCHA v3, enforce it for AI Logic, then paste the *site key* into `appCheckSiteKey` in `firebase-config.js`. Without App Check, anyone who copies your public Firebase config could spend your free quota.
3. Models are listed in `firebase-config.js` (`ECOTEKK_AI.models`) and tried in order. Gemini model names change; if the helper says it is unavailable, check https://ai.google.dev/gemini-api/docs/deprecations and update the list.
4. Add your site's domain (e.g. `gappleness.github.io`) under Authentication → Settings → Authorized domains if it isn't there.

## 4. Guests
Keep Anonymous sign-in enabled (Authentication → Sign-in method). Guests are now view-only: the rules reject writes from anonymous sessions.

## 5. Protect your keys (5 minutes)
A `.gitignore` now blocks service-account files, `.env`, private keys and tooling junk. `firebase-config.js` is deliberately *not* ignored: it's the public web config and GitHub Pages must serve it. Read `SECURITY.md` and restrict the browser API key to your site's domain.

## What changed, by file
- Rename: "E-waste finder" is now **Drop-off finder** (nav, footer, titles, README). Change it back or rename it in one pass with a find-and-replace.
- `reviews.js` (+ styles in `tracker.css`): ratings + optional comments on `ewaste.html` and `techhelp.html`. Only members who tapped "I went here" can rate.
- `ai-helper.js`, `ai-helper.css`: AI helper on `ewaste.html` and `techhelp.html`; teaser section on `index.html`.
- `tracker.js`, `explore.html`: "I went here" / "I have this issue too" are members-only.
- `auth.js`: `isMember()`, `isAdmin()`, `isRestricted()`, automatic Admin nav link.
- `admin.html`, `admin.js`, `admin.css`: Overview stats, Members (restrict / admin role), Reviews, Community, Resolved.
- `resolve.js`: "Did this fix it?" card on `explore.html`, feeding the admin resolved statistics.
- `forum.html`, `forum.js`, `forum.css`: community forum.
- `badges.js`, `profile.html`: "Helped n people" badges.
- `community-tally.js` is an old unused file (tracker.js has its own tally). It still describes the old guest behaviour; safe to delete.

## Known limits
- Restricting a member blocks writes only. Truly disabling an account in Firebase Auth needs the Admin SDK (Cloud Functions), which would need the Blaze plan.
- Statistics read up to 500 documents per list (a "+" shows when capped). Fine for a prototype; use aggregated counters if it grows.
- Reviews show the member's display name publicly.
