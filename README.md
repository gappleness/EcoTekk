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
