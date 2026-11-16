# EcoTekk PWA — GitHub Pages setup

## What was added
- `manifest.webmanifest` — app identity, install mode, shortcuts and relative GitHub Pages paths.
- `sw.js` — app-shell caching, network-first page navigation, offline fallback and update lifecycle.
- `pwa.js` / `pwa.css` — install control, iOS Add to Home Screen instructions, offline status, update notice and standalone mobile bottom navigation.
- `offline.html` — self-contained offline fallback.
- `pwa-icon-192.png`, `pwa-icon-512.png`, `pwa-icon-maskable-512.png`, `apple-touch-icon.png` — install icons matching EcoTekk's green brand, including an iOS-sized touch icon.

## Publish
1. Extract this archive. Open the inner `EcoTekk-main` folder.
2. Copy **everything inside** `EcoTekk-main` into the root of `https://github.com/gappleness/EcoTekk` and allow replacement of the existing matching files. Do not create a nested `EcoTekk-main/EcoTekk-main` directory.
3. Commit and push to the branch selected in GitHub Pages. If using the default setup, Settings → Pages should use `main` and `/(root)`.
4. Wait for GitHub Pages deployment to finish, then open `https://gappleness.github.io/EcoTekk/` over HTTPS and refresh.

## Install
- Android/Chrome: use the **Install app** control in the top navigation or Chrome menu → Install app / Add to Home screen.
- Desktop Chrome/Edge: use **Install app** or the browser's install control.
- iPhone/iPad: open the site in Safari → Share → Add to Home Screen. iOS does not expose the same automatic install prompt as Chromium browsers.

## Important deployment checks
- Keep GitHub Pages on HTTPS; service workers require a secure context (localhost is also secure for local tests).
- In Firebase Console → Authentication → Settings → Authorized domains, make sure `gappleness.github.io` is authorized. It is usually already present when Firebase sign-in has been used on this site.
- Keep existing Firebase Authentication providers enabled. Google sign-in, email/password and anonymous guest sign-in are still controlled by Firebase settings.
- No Maps API key or Firebase secret needs to be added for this PWA package; the current map embeds and Firebase web config remain as they were.

## Offline limitations (intentional)
The app shell, local scripts, styling, illustrations and previously visited local pages are cached. Firebase login/account actions, Firestore/community tally actions, Google Maps and live location/network lookup need an internet connection. Map tiles and personal/cloud data are deliberately not stored in the service-worker cache.

## Test checklist
- Visit the site while online, then open it once on each major page so current HTML is cached.
- Install it and confirm the installed app opens without browser chrome.
- Turn on airplane mode and relaunch: cached pages should open and the offline notice should explain which live services need internet.
- Turn internet back on: refresh and confirm maps, sign-in and live counters resume.
- Push a small subsequent change and reopen the PWA online to confirm the update notice.
