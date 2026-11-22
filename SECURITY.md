# Keeping EcoTekk safe

## What is and isn't secret here
| Item | Secret? | Where it lives |
|---|---|---|
| Firebase web config in `firebase-config.js` (apiKey, projectId, appId) | **No.** Public by design; every visitor's browser loads it. | In the repo (must be, for GitHub Pages) |
| Gemini API key | **Yes**, but you never hold it. | Firebase AI Logic (server-side) |
| Service-account / Admin SDK JSON, `.env`, private keys | **Yes** | Never in the repo (`.gitignore` blocks them) |
| Admin status | Not a file | A document at `admins/{uid}` in Firestore |

## What actually protects the site (do these)
1. **Firestore rules** (`firestore.rules`) are the real lock. Publish them.
2. **Restrict the web API key**: Google Cloud console → APIs & Services → Credentials → the "Browser key" → *Application restrictions: Websites* → add your site (e.g. `https://gappleness.github.io/*` and `http://localhost:*` while testing).
3. **App Check** is configured here for Firebase AI Logic. Do not enforce App Check for Firestore or Authentication until App Check is also initialized for the default Firebase app (see `SETUP.md`).
4. Set a **budget alert** in Google Cloud so a surprise never becomes a bill.
5. Keep **Anonymous sign-in** enabled only because guest mode needs it; the rules already make guests read-only.

## If a real secret was ever committed
`.gitignore` only stops *future* commits. If a service-account file, `.env` or private key was already pushed:
1. **Revoke/rotate it immediately** (Google Cloud → IAM → Service accounts → delete the key). Treat it as leaked even after removal.
2. Stop tracking it: `git rm --cached <file>` then commit.
3. Remove it from history (`git filter-repo` or BFG) and force-push, then rotate again if in doubt.
