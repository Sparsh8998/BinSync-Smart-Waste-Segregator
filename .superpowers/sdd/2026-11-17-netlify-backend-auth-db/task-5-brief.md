# Task 5 Brief: Frontend Client-Side Dynamic Hydration

## Plan Reference
Plan: `docs/superpowers/plans/2026-11-17-netlify-backend-auth-db.md`
Spec: `docs/superpowers/specs/2026-11-17-netlify-backend-auth-db-design.md`

## What to Do
1. `templates/login.html`:
   - Intercept `<form>` submit via JavaScript.
   - Prevent default form submission.
   - Read `username` and `community_hub`.
   - Send `POST /api/auth/login` with `{ username, community_hub }`.
   - If response `ok` and `user` returned:
     - Save `localStorage.setItem('binsync_user', JSON.stringify(data.user))`.
     - Save `localStorage.setItem('binsync_token', data.token)`.
     - Redirect to `/dashboard`.
   - If error: show accessible error message.

2. `templates/dashboard.html`:
   - Add IDs to user profile and metric elements (`user-profile-username`, `user-profile-avatar`, `user-level-title`, `user-citizen-id`, `user-total-scans`, `user-current-streak`, `user-points-val`, `user-co2-val`, `user-phone-charges`, `user-ev-miles`, `user-level-bar`, etc.).
   - Implement `hydrateDashboard()`:
     - Get token from `localStorage.getItem('binsync_token')` or cookie.
     - Call `fetch('/api/dashboard/stats', { headers: { 'Authorization': 'Bearer ' + token } })`.
     - If status is 401 and no local user, redirect to `/login`.
     - When `data.ok`:
       - Update user handle, avatar letter, ID, level title, points, scans, streak, CO2 saved, phone charges, EV miles, level progress bar.
       - Update community hub selector.
       - Dynamically render recent scans list in `#scans-list-container` (or update existing rows), with working delete button calling `/api/scan/:id`.
       - Dynamically render / update daily quests with functional "Claim Points" buttons that call `POST /api/claim_quest`.

3. `templates/base.html`:
   - Add dynamic user authentication sync:
     - Check `localStorage.getItem('binsync_user')` or call `GET /api/auth/me`.
     - Update header user slot with citizen handle, points pill, avatar, and "Sign Out" button.
     - Implement `window.signOutCitizen()` to clear localStorage and call `/api/auth/logout`.

4. `templates/classifier.html`:
   - Pass `Authorization: Bearer <token>` in header during `/api/classify` and `/api/log_audit_items`.
   - If `data.citizen_stats` returned, update `localStorage.setItem('binsync_user', ...)` and update the header points pill immediately.

5. Verification:
   - Run `python test_suite.py` -> 19/19 OK.
   - Verify no template syntax errors.

6. Commit:
   `git add templates/login.html templates/dashboard.html templates/base.html templates/classifier.html`
   `git commit -m "feat(frontend): add dynamic client-side hydration for auth, dashboard, and scan persistence"`
