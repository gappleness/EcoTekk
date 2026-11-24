/* EcoTekk profile view, shared by profile.html (members) and admin.html ("My profile" tab for admins).
   EcoProfile.mount(rootElement, { embedded: true|false }) fills rootElement with the signed-in person's account,
   badges and activity. With embedded:true it skips the page heading (admin.html has its own) and never redirects.
   Needs: auth.js, activity.js, badges.js and the p-* styles from experience.css. */
(function () {
            function node(tag, cls, text) {const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el;}
            function row(parent, label, value) {const el = node('div', 'p-row'); el.append(node('span', '', label), node('strong', '', value)); parent.append(el); return el.lastChild;}
            function link(text, href, secondary) {const a = node('a', 'p-action' + (secondary ? ' secondary' : ''), text); a.href = href; return a;}

            const KIND = {issue: 'Problem', dropoff: 'Drop-off', shop: 'Repair shop'};
            function safeHref(h) {return /^[a-z-]+\.html(\?[^\s"'<>]*)?$/i.test(h || '') ? h : null;}
            // "My activity": every community count this user added on this device, re-checked against Firestore
            // (reports that were undone elsewhere drop off the list) with the live count beside each one.
            function activityPanel(uid) {
                const panel = node('section', 'p-panel p-wide'); panel.setAttribute('aria-label', 'My activity');
                panel.append(node('div', 'p-eyebrow', 'MY ACTIVITY'), node('h3', '', 'Where you added your voice'), node('p', 'p-muted', 'Problems you reported and places you visited. This list is kept on this device, and the counts are live.'));
                const stats = node('div', 'p-stats'); const sIssues = node('div', 'p-stat'); const nIssues = node('strong', '', '–'); sIssues.append(nIssues, node('span', '', 'problems I share'));
                const sPlaces = node('div', 'p-stat'); const nPlaces = node('strong', '', '–'); sPlaces.append(nPlaces, node('span', '', 'places I have been')); stats.append(sIssues, sPlaces);
                const list = node('div'); list.append(node('p', 'p-msg', 'Loading…')); panel.append(stats, list);
                let db = null; try {db = window.firebase && firebase.apps.length ? firebase.firestore() : null;} catch (e) {db = null;}
                function paint(rows) {
                    nIssues.textContent = rows.filter(r => r.e.kind === 'issue').length; nPlaces.textContent = rows.filter(r => r.e.kind !== 'issue').length;
                    list.replaceChildren();
                    if (!rows.length) {
                        list.append(node('p', 'p-muted', 'Nothing here yet. Tap “I have this issue too” on a topic in the device explorer, or “I went here” on a drop-off or repair shop, and it will show up here.'));
                        const acts = node('div', 'p-actions'); acts.append(link('Explore a device →', 'explore.html'), link('Find a drop-off', 'home.html', true), link('Tech help', 'techhelp.html', true)); list.append(acts); return;
                    }
                    rows.forEach(function (r) {
                        const item = node('div', 'p-act'); const left = node('div'); const href = safeHref(r.e.href);
                        const title = href ? link(r.e.label, href, true) : node('span', '', r.e.label); title.className = ''; if (href) title.style.cssText = 'font-weight:700;color:inherit';
                        const top = node('div'); top.append(node('span', 'p-tag', KIND[r.e.kind] || 'Activity'), title);
                        left.append(top, node('small', '', 'Added ' + new Date(r.e.ts).toLocaleDateString('en-PH', {dateStyle: 'medium'})));
                        const count = node('span', '', r.count === null ? '' : r.count.toLocaleString() + (r.count === 1 ? ' person' : ' people') + (r.e.kind === 'issue' ? (r.count === 1 ? ' shares this' : ' share this') : ' went here'));
                        item.append(left, count); list.append(item);
                    });
                }
                const entries = EcoActivity.list(uid);
                if (!db || !entries.length) {paint(entries.map(e => ({e, count: null}))); return panel;}
                Promise.all(entries.map(function (e) {
                    const ref = db.collection('issueReports').doc(e.id);
                    return ref.collection('reporters').doc(uid).get().then(function (mine) {
                        if (!mine.exists) {EcoActivity.remove(uid, e.id); return null;}
                        return ref.get().then(s => ({e, count: s.exists ? (Number(s.data().count) || 0) : 0})).catch(() => ({e, count: null}));
                    }).catch(() => ({e, count: null}));
                })).then(rows => paint(rows.filter(Boolean)));
                return panel;
            }
            // "My badges": the member's "helped n people" count (badges.js counts the credits the people they helped gave them).
            function badgePanel(uid) {
                const panel = node('section', 'p-panel p-wide'); panel.setAttribute('aria-label', 'My badges');
                panel.append(node('div', 'p-eyebrow', 'MY BADGES'));
                const head = node('h3', '', 'Helped … people'); const sub = node('p', 'p-muted', 'Answer questions in the community. When the person who asked marks your reply as helpful, it counts here.');
                const list = node('div'); list.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin:14px 0';
                const next = node('p', 'p-note'); const acts = node('div', 'p-actions'); acts.append(link('Open the community', 'forum.html', true));
                panel.append(head, sub, list, next, acts);
                if (!window.EcoBadges) return panel;
                EcoBadges.helpedCount(uid).then(function (n) {
                    head.textContent = n === 0 ? 'You haven’t helped anyone yet' : EcoBadges.label(n);
                    EcoBadges.TIERS.forEach(function (t) {
                        const got = n >= t.at; const chip = node('span', 'p-pill', (got ? '★ ' : '☆ ') + t.name + ' · ' + t.at + '+');
                        chip.style.opacity = got ? '1' : '.55'; list.append(chip);
                    });
                    const t = EcoBadges.tier(n); const nx = t && t.next ? t.next : (n === 0 ? EcoBadges.TIERS[0] : null);
                    next.textContent = nx ? (nx.at - n) + ' more helpful ' + ((nx.at - n) === 1 ? 'reply' : 'replies') + ' to earn “' + nx.name + '”.' : 'You’ve earned every badge. Thank you for helping.';
                });
                return panel;
            }

            function mount(root, opts) {
                opts = opts || {};
            EcotekkAuth.ready.then(function () {
                const u = EcotekkAuth.currentUser();
                // Admins use the combined admin space, so the standalone profile page sends them there.
                if (u && !u.isGuest && !opts.embedded) EcotekkAuth.isAdmin().then(function (yes) { if (yes) location.replace('admin.html#profile'); });
                if (!u) {root.replaceChildren(node('div', 'p-eyebrow', 'YOUR ECOTEKK ACCOUNT'), node('h1', 'p-heading', 'Your space for greener choices'), node('p', 'p-sub', 'Sign in to view your account and keep exploring drop-off locations.')); const a = link('Log in / Sign up', 'login.html'); a.style.marginTop = '24px'; root.append(a); return;}

                if (u.isGuest) {
                    // Limited, display-only view: no name/email, no cloud profile, nothing to edit.
                    const navLink = document.querySelector('nav a[aria-current]'); if (navLink) navLink.textContent = 'Guest';
                    const gHero = node('section', 'p-hero'); gHero.setAttribute('aria-label', 'Guest session');
                    const gId = node('div', 'p-identity'); const gAvatar = node('div', 'p-avatar', 'G'); gAvatar.setAttribute('aria-hidden', 'true');
                    const gWho = node('div'); gWho.append(node('h2', '', 'Guest'), node('p', '', 'Browsing without an account')); gId.append(gAvatar, gWho);
                    gHero.append(gId, node('span', 'p-pill', 'Guest mode'));
                    const gGrid = node('div', 'p-grid');
                    const gLeft = node('section', 'p-panel'); gLeft.append(node('div', 'p-eyebrow', 'START HERE'), node('h3', '', 'Look around freely.'), node('p', 'p-muted', 'Guests can read the device explorer, the drop-off finder, tech help, ratings and the community forum. A free account lets you count visits, rate places, post in the forum and use the AI helper.'));
                    const gActions = node('div', 'p-actions'); gActions.append(link('Explore a device →', 'explore.html'), link('Find a drop-off', 'home.html', true), link('Tech help', 'techhelp.html', true)); gLeft.append(gActions);
                    const gNote = node('p', 'p-note', 'Guest sessions are tied to this browser. Clearing site data or exiting guest mode ends the session.'); gNote.style.marginTop = '24px'; gLeft.append(gNote);
                    const gRight = node('section', 'p-panel'); gRight.append(node('div', 'p-eyebrow', 'SESSION'), node('h3', '', 'View-only access'));
                    row(gRight, 'Account type', 'Guest (view only)'); row(gRight, 'Saved profile', 'Not available'); row(gRight, 'Rate, post, AI helper', 'Members only');
                    const gActs = node('div', 'p-actions');
                    const gJoin = link('Log in / Sign up', 'login.html');
                    const gExit = node('button', 'p-action secondary', 'Exit guest mode'); gExit.type = 'button';
                    gExit.addEventListener('click', async function () { gExit.disabled = true; gExit.textContent = 'Exiting…'; try { await EcotekkAuth.logout(); location.href = 'index.html'; } catch (e) { gExit.disabled = false; gExit.textContent = 'Exit guest mode'; } });
                    gActs.append(gJoin, gExit); gRight.append(gActs);
                    gGrid.append(gLeft, gRight);
                    const gAct = activityPanel(u.uid);
                    root.replaceChildren(node('div', 'p-eyebrow', 'MY ECOTEKK / GUEST'), node('h1', 'p-heading', 'You are browsing as a guest.'), node('p', 'p-sub', 'A read-only view. Sign in any time to count visits, rate places, post and use the AI helper.'), gHero, gGrid, gAct);
                    return;
                }
                const title = node('div', 'p-eyebrow', 'MY ECOTEKK / DASHBOARD');
                const heading = node('h1', 'p-heading', 'Welcome back.');
                const intro = node('p', 'p-sub', 'Your account and practical technology options in one place.');
                const hero = node('section', 'p-hero'); hero.setAttribute('aria-label', 'Account overview');
                const identity = node('div', 'p-identity'); const avatar = node('div', 'p-avatar', (u.name || 'E').trim().slice(0, 1).toUpperCase()); avatar.setAttribute('aria-hidden', 'true');
                const who = node('div'); const name = node('h2', '', u.name || 'EcoTekk member'); const email = node('p', '', u.email || ''); who.append(name, email); identity.append(avatar, who);
                const badge = node('span', 'p-pill', u.emailVerified ? '✓ Email verified' : 'Email verification pending'); hero.append(identity, badge);
                const grid = node('div', 'p-grid');
                const left = node('section', 'p-panel'); left.append(node('div', 'p-eyebrow', 'START HERE'), node('h3', '', 'Find your next step.'), node('p', 'p-muted', 'Find options for a device, get relevant support, or access the existing drop-off finder.'));
                const actions = node('div', 'p-actions'); actions.append(link('Explore a device →', 'explore.html'), link('Find a drop-off', 'home.html', true), link('Tech help', 'techhelp.html', true)); left.append(actions);
                const note = node('p', 'p-note', 'Device recommendations are educational. Confirm availability and acceptance directly with a provider before visiting.'); note.style.marginTop = '24px'; left.append(note);
                const right = node('section', 'p-panel'); right.append(node('div', 'p-eyebrow', 'ACCOUNT DETAILS'), node('h3', '', 'Your information'));
                const nameValue = row(right, 'Display name', u.name || '—'); row(right, 'Email', u.email || '—'); row(right, 'Verification', u.emailVerified ? 'Verified' : 'Not verified'); const since = row(right, 'Member since', '—'); const cloud = row(right, 'Cloud profile', 'Loading…');
                const verifyMsg = node('p', 'p-msg'); verifyMsg.setAttribute('role', 'status');
                if (!u.emailVerified) {
                    const vActs = node('div', 'p-actions');
                    const resend = node('button', 'p-action', 'Resend verification email'); resend.type = 'button';
                    const refresh = node('button', 'p-action secondary', 'I verified it. Refresh'); refresh.type = 'button';
                    resend.addEventListener('click', async function () {resend.disabled = true; verifyMsg.textContent = 'Sending…'; try {await EcotekkAuth.resendVerification(); verifyMsg.textContent = 'Sent to ' + (u.email || 'your email') + '. Check your inbox and spam folder, open the link, then tap Refresh.';} catch (e) {verifyMsg.textContent = e && e.code === 'auth/too-many-requests' ? 'Too many requests. Please wait a few minutes and try again.' : 'Could not send the email right now. Please try again later.';} setTimeout(function () {resend.disabled = false;}, 30000);});
                    refresh.addEventListener('click', async function () {refresh.disabled = true; try {await EcotekkAuth.refreshUser(); location.reload();} catch (e) {refresh.disabled = false; verifyMsg.textContent = 'Could not refresh. Please reload the page.';}});
                    vActs.append(resend, refresh); right.append(vActs, verifyMsg);
                }
                const signout = node('button', 'p-action secondary', 'Log out'); signout.type = 'button'; signout.style.marginTop = '20px'; signout.addEventListener('click', async function () {signout.disabled = true; signout.textContent = 'Logging out…'; try {await EcotekkAuth.logout(); location.href = 'index.html';} catch (e) {signout.disabled = false; signout.textContent = 'Log out'; cloud.textContent = 'Logout failed: ' + (e.message || 'Please retry');} }); right.append(signout);
                grid.append(left, right);
                if (opts.embedded) root.replaceChildren(hero, grid, badgePanel(u.uid), activityPanel(u.uid)); else root.replaceChildren(title, heading, intro, hero, grid, badgePanel(u.uid), activityPanel(u.uid));
                EcotekkAuth.isAdmin().then(function (yes) { if (!yes) return; if (!opts.embedded) actions.append(link('Admin dashboard →', 'admin.html', true)); hero.append(node('span', 'p-pill', 'Admin')); });
                try {EcotekkAuth.watchProfile(function (p) {cloud.textContent = p ? 'Connected' : 'Profile not available yet'; if (p && typeof p.name === 'string' && p.name.trim()) {name.textContent = p.name; nameValue.textContent = p.name; avatar.textContent = p.name.trim().slice(0, 1).toUpperCase();} if (p && p.createdAt && typeof p.createdAt.toDate === 'function') since.textContent = p.createdAt.toDate().toLocaleDateString('en-PH', {dateStyle: 'long'}); });} catch (e) {cloud.textContent = 'Unable to load profile';}
            }).catch(function (e) {root.replaceChildren(node('p', 'p-muted', 'Unable to load account: ' + (e.message || 'Please refresh.')));});
            }
            window.EcoProfile = { mount: mount };
})();
