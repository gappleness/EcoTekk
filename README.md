# EcoTekk ♻️

EcoTekk helps people understand what to do with the technology they already own: troubleshoot a device, find repair support, explore reuse options, and locate e-waste collection points.

## What's included

- **Device Explorer** — choose a device, issue, brand and model to build practical first checks and next steps.
- **Tech Help** — find nearby repair shops and service centers, filter by device type and shop type, view the map, and use the community visit tally.
- **E-waste Finder** — locate drop-off options, filter by accepted waste type, quantity scale and service-area scale, view the map, and use the community visit tally.
- **Guest mode** — use the tools without creating a saved profile.
- **Account and profile** — Firebase email/password and Google sign-in, guest sessions, profile details and activity view.
- **Preparation checklist** — browser-saved checklist for a device handover.
- **Theme preference** — light and dark themes.

## Visual overhaul

The project now uses a unified, responsive interface across the entire site:
- EcoTekk's original bright-green top navigation is preserved (`#20B64F`).
- The landing page has a new editorial hero, animated device panel, feature cards and workflow section.
- Workspace pages, map results, sign-in, profile and checklist use a shared design system.
- Motion includes scroll reveals, a reading-progress line, hover highlights, gentle ambient animation and a responsive navigation menu.
- Reduced-motion preferences are respected.

## Run locally

Open `index.html` through a local web server, or deploy the complete folder to GitHub Pages. The site uses plain HTML, CSS and JavaScript; no build step or package installation is required.

## Firebase setup

`firebase-config.js` contains the public Firebase web-app configuration. Keep the matching Firebase Authentication providers and Firestore rules enabled in the Firebase project. The Firebase web config is not a service-account key.

`firestore.rules` must be published in Firebase Console → Firestore → Rules for the community tally undo workflow. The code includes safeguards for unverified provider data and does not treat public directory listings as confirmed facility acceptance.

## Live website

https://gappleness.github.io/EcoTekk/

---

Made with 💚 for a greener future.


## Installable PWA

EcoTekk can be installed as a Progressive Web App (PWA) on supported browsers. The PWA uses a relative manifest and service-worker scope so it works when hosted as a GitHub Pages project site at `https://gappleness.github.io/EcoTekk/`. The original bright-green navigation (`#20B64F`) is retained.

### Deploy to GitHub Pages

1. Extract the ZIP and open the inner `EcoTekk-main` folder.
2. Upload the **contents** of that folder to the root of the existing `gappleness/EcoTekk` repository (do not upload the outer folder as a nested directory).
3. Commit and push to the branch/folder configured in Settings → Pages. The usual setup is `main` and `/(root)`.
4. Open the HTTPS site and reload once after deployment. The service worker installs and caches the local app shell.

### Install on Android / desktop

Open the website in a supported browser (Chrome or Edge is recommended), choose **Install app** in EcoTekk's navigation, or use the browser menu → **Install EcoTekk** / **Add to Home screen**. On iPhone/iPad, open the site in Safari, tap Share, then **Add to Home Screen**.

### Offline behavior

The service worker caches the site's local pages, styles, scripts, images and app icons. This allows the app shell and previously cached pages to open offline. Live Google Maps embeds, GPS location acquisition, Firebase authentication, Firestore/community updates and other cloud requests still require internet. Firebase and map responses are intentionally not cached as private/offline data. The checklist and theme preference continue to use browser-local storage.

### Firebase and privacy check

In Firebase Console → Authentication → Settings → Authorized domains, confirm `gappleness.github.io` is listed. Do not add private service-account credentials to this repository. The existing public Firebase web configuration remains unchanged.

### Updating the PWA

After pushing a new project version, the service worker checks for an update when the app is opened or returns to the foreground while online. A refresh notice appears when a new version takes control. If an old version appears stuck, close all EcoTekk tabs/windows and reopen the app online.
