# Netlify Persistent Serverless Backend, Authentication & Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a resilient, persistent serverless backend on Netlify with citizen handle login/account creation, database storage (PostgreSQL with Netlify Blobs fallback), dynamic dashboard hydration, and continuous scan persistence.

**Architecture:**
- **Database Engine (`netlify/functions/lib/db.mjs`)**: Dual-engine storage adapter supporting PostgreSQL (when `DATABASE_URL` / `NETLIFY_DB_URL` is configured) and zero-config Netlify Blobs (`@netlify/blobs`) store (`binsync_db`), guaranteeing data persistence across function cold starts.
- **Serverless API Routes**:
  - `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` handled by `netlify/functions/auth.mjs`.
  - `GET /api/dashboard/stats`, `POST /api/claim_quest`, `POST /api/update_hub` handled by `netlify/functions/dashboard.mjs`.
  - Updated `netlify/functions/classify.mjs` and `scan.mjs` to record packaging inspections directly into the persistent user database.
- **Dynamic Frontend Hydration**: Client-side scripts in `templates/login.html`, `templates/dashboard.html`, `templates/base.html`, and `templates/classifier.html` that consume the serverless API.
- **Routing & Deployment**: Updated `netlify.toml` and `public/_redirects`, static freeze via `python freeze_site.py`, unit test validation (`test_suite.py` 19/19 OK), and live deployment to Netlify.

---

## Tasks

### Task 1: Package Scaffolding & Unified Database Adapter (`netlify/functions/lib/db.mjs`)

**Files:**
- Modify: `package.json`
- Create: `netlify/functions/lib/db.mjs`
- Create: `netlify/functions/test_db_runner.mjs` (scratch verification script)

**Interfaces:**
- `findUserByUsername(username)`: Returns user object or null.
- `findUserById(id)`: Returns user object or null.
- `createUser({ username, community_hub })`: Creates citizen record with initial badges and 0 points.
- `updateUser(id, updates)`: Updates points, recycled count, streak, CO2 saved, community hub.
- `createScanLog({ user_id, item_name, material, category, co2_saved, points_earned, disposal_steps })`: Records scan.
- `getUserScans(user_id, limit)`: Returns array of recent scans.
- `deleteScan(user_id, scan_id)`: Removes scan.
- `getQuestClaims(user_id, date_str)`: Returns set/array of claimed quest keys for date.
- `createQuestClaim({ user_id, quest_key, claimed_date, points_awarded })`: Records quest claim.

- [ ] **Step 1: Update `package.json` dependencies**
  Add `@netlify/blobs` and `pg` to `package.json` dependencies. Run `npm install`.

- [ ] **Step 2: Implement `netlify/functions/lib/db.mjs`**
  Implement dual-driver adapter:
  - If `process.env.DATABASE_URL` or `process.env.NETLIFY_DB_URL` is set, connect via `pg.Pool`, create tables if not present, and execute parameterized SQL queries.
  - If not set, use `@netlify/blobs` `getStore('binsync_db')` (with fallback local memory/file store) to store collections `users`, `scans`, and `quest_claims`.

- [ ] **Step 3: Test database adapter locally**
  Create and execute `netlify/functions/test_db_runner.mjs` using `node netlify/functions/test_db_runner.mjs` verifying:
  - User creation
  - User lookup by handle
  - Scan log creation and retrieval
  - Quest claim recording
  Remove scratch runner upon verification.

- [ ] **Step 4: Commit**
  `git add package.json package-lock.json netlify/functions/lib/db.mjs`
  `git commit -m "feat(backend): implement persistent dual-driver database adapter for netlify"`

---

### Task 2: Serverless Authentication & User Endpoints (`netlify/functions/auth.mjs`)

**Files:**
- Create: `netlify/functions/auth.mjs`
- Modify: `netlify.toml`
- Modify: `public/_redirects`

**Interfaces:**
- `POST /api/auth/login`: Body `{ username, community_hub }` -> Returns `{ ok: true, user, token }` and sets `binsync_session` cookie.
- `GET /api/auth/me`: Query param `?token=` or cookie -> Returns `{ ok: true, authenticated: true, user }` or `{ ok: true, authenticated: false }`.
- `POST /api/auth/logout`: Clears cookie -> Returns `{ ok: true }`.

- [ ] **Step 1: Implement `netlify/functions/auth.mjs`**
  Write request router in `netlify/functions/auth.mjs` handling `login`, `me`, and `logout` with CORS headers and cookie handling.

- [ ] **Step 2: Update routing in `netlify.toml` and `public/_redirects`**
  Add redirect rules:
  ```toml
  [[redirects]]
    from = "/api/auth/*"
    to = "/.netlify/functions/auth"
    status = 200
  ```

- [ ] **Step 3: Test auth function via Node script**
  Test login with a new citizen handle and verify session retrieval.

- [ ] **Step 4: Commit**
  `git add netlify/functions/auth.mjs netlify.toml public/_redirects`
  `git commit -m "feat(backend): add serverless citizen authentication endpoint"`

---

### Task 3: Serverless Dashboard & Quest Endpoints (`netlify/functions/dashboard.mjs`)

**Files:**
- Create: `netlify/functions/dashboard.mjs`
- Modify: `netlify/functions/scan.mjs`
- Modify: `netlify.toml`
- Modify: `public/_redirects`

**Interfaces:**
- `GET /api/dashboard/stats`: Returns citizen metrics, level info, smartphone charges, EV miles, recent scans list, category distribution, and daily quests with claimed state.
- `POST /api/claim_quest`: Body `{ quest_key }` -> Awards points, records claim, returns updated points.
- `POST /api/update_hub`: Body `{ community_hub }` -> Updates hub.
- `DELETE /api/scan/:id`: Deletes scan log.

- [ ] **Step 1: Implement `netlify/functions/dashboard.mjs`**
  Build stats calculation (RPG level formulas matching `app.py`: Seedling, Sprout, Forest Guardian, Eco Legend; smartphone charges: CO₂/8.22; EV miles: CO₂/150).
  Integrate 3 daily quests (`daily_scan`, `diversion_hero`, `zero_wishcycle`).

- [ ] **Step 2: Update `netlify/functions/scan.mjs`**
  Wire scan deletion to remove record from database.

- [ ] **Step 3: Configure routing for dashboard endpoints**
  Update `netlify.toml` and `public/_redirects`.

- [ ] **Step 4: Commit**
  `git add netlify/functions/dashboard.mjs netlify/functions/scan.mjs netlify.toml public/_redirects`
  `git commit -m "feat(backend): implement dashboard stats, quest claims, and scan deletion serverless endpoints"`

---

### Task 4: Connect Classifier to Persistent Database (`netlify/functions/classify.mjs`)

**Files:**
- Modify: `netlify/functions/classify.mjs`

**Interfaces:**
- `POST /api/classify`: Accepts optional `citizen_token` or `citizen_id` in headers or JSON body.
- When classification succeeds, automatically inserts a `ScanLog` row into the database, increments user `points` and `total_recycled`, updates `total_co2_saved`, and updates streak logic.

- [ ] **Step 1: Update `netlify/functions/classify.mjs`**
  Import `db` from `./lib/db.mjs`.
  Extract citizen session from request header (`Authorization` or `x-citizen-token`) or body.
  Upon successful classification, call `db.createScanLog(...)` and update user stats.
  Return `citizen_stats: { points, streak, total_recycled }` in the response payload.

- [ ] **Step 2: Commit**
  `git add netlify/functions/classify.mjs`
  `git commit -m "feat(backend): link packaging classifier to persistent citizen database"`

---

### Task 5: Frontend Client-Side Dynamic Hydration

**Files:**
- Modify: `templates/login.html`
- Modify: `templates/dashboard.html`
- Modify: `templates/base.html`
- Modify: `templates/classifier.html`

- [ ] **Step 1: Update `templates/login.html`**
  Intercept form submission with JavaScript.
  Call `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, community_hub }) })`.
  Save user and token in `localStorage.setItem('binsync_user', ...)` and `localStorage.setItem('binsync_token', ...)`.
  Redirect smoothly to `/dashboard`.

- [ ] **Step 2: Update `templates/dashboard.html`**
  Add client-side hydration script `hydrateDashboard()`:
  - Reads active citizen token/handle. If none, redirects to `/login`.
  - Calls `fetch('/api/dashboard/stats')`.
  - Updates username, avatar letter, citizen ID, level badge, streak count, points, and impact counters.
  - Dynamically renders recent scans table rows with functional delete buttons.
  - Dynamically renders daily quests with working "Claim Points" buttons.
  - Connects community hub dropdown to `fetch('/api/update_hub')`.

- [ ] **Step 3: Update `templates/base.html`**
  Add global auth hydration in navigation:
  - Check `localStorage.getItem('binsync_user')` or `/api/auth/me`.
  - If authenticated, display citizen handle, points pill, and "Sign Out" button.
  - If unauthenticated, display "Sign In / Join" link.

- [ ] **Step 4: Update `templates/classifier.html`**
  Pass `Authorization: Bearer <token>` in header during `/api/classify` and `/api/log_audit_items`.
  Update header points pill immediately on scan completion.

- [ ] **Step 5: Run unit test suite to verify no regressions**
  Run: `python test_suite.py` -> 19/19 OK.

- [ ] **Step 6: Commit**
  `git add templates/login.html templates/dashboard.html templates/base.html templates/classifier.html`
  `git commit -m "feat(frontend): add dynamic client-side hydration for auth, dashboard, and scan persistence"`

---

### Task 6: Static Site Freeze, Verification & Production Netlify Deployment

**Files:**
- Modify: `public/*`

- [ ] **Step 1: Run unit test suite**
  Run: `python test_suite.py` -> verify 19/19 pass.

- [ ] **Step 2: Compile static site into `public/`**
  Run: `python freeze_site.py` -> verify all routes freeze cleanly into `public/`.

- [ ] **Step 3: Verify clean URLs and service worker**
  Confirm `public/_redirects` and `public/sw.js` are intact.

- [ ] **Step 4: Commit and push to GitHub `origin/main`**
  Commit all generated files and push to trigger Netlify production deploy.

- [ ] **Step 5: Live production verification**
  Run live HTTP queries against:
  - `POST https://binsyncc.netlify.app/api/auth/login` (create account, verify 200 OK and persistent user payload).
  - `GET https://binsyncc.netlify.app/api/auth/me` (verify session).
  - `GET https://binsyncc.netlify.app/api/dashboard/stats` (verify live dashboard stats).
  - `POST https://binsyncc.netlify.app/api/classify` (verify scan persistence).
