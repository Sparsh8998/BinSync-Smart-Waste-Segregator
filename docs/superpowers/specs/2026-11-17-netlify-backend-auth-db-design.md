# Design Document: Persistent Netlify Serverless Backend, Authentication & Database Engine

**Date:** 2026-11-17  
**Topic:** Netlify Serverless Backend, Citizen Account Creation, Authentication & Persistent Database Storage  
**Status:** In Review  
**Author:** Antigravity Engineering

---

## 1. Intent & The Why

BinSync is deployed as a high-performance static PWA on Netlify, backed by serverless edge functions for AI image classification and municipal lookup. However, when users visit `https://binsyncc.netlify.app/login` and submit the login form, Netlify returns an **HTTP 404 Page Not Found** error because static hosting rejects `POST` requests. Furthermore, there is no persistent database connected to the serverless runtime; user accounts, eco-points, streak days, and scan logs do not persist on production, and `/dashboard` renders a frozen build-time snapshot.

The objective is to implement a robust, production-grade serverless backend on Netlify so citizens can create handles, sign in, inspect packaging, earn eco-points, maintain streaks, and view their personalized impact dashboards with data reliably persisted in a database across cold starts, sessions, and devices.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Frictionless Citizen Account Creation & Login**: Enable users to enter their citizen handle (e.g., `EcoWarrior`, `GreenCitizen`) and community hub on `/login` to create or retrieve their profile without passwords, mirroring the local Flask experience.
- **Persistent Serverless Database Engine**: Provide a dual-engine database layer in `netlify/functions/lib/db.mjs`:
  1. **Primary**: PostgreSQL (via `DATABASE_URL` or `NETLIFY_DB_URL` using `pg` / `@netlify/database`) with auto-created tables (`users`, `scan_logs`, `quest_claims`).
  2. **Zero-Config Resilient Fallback**: Netlify Blobs (`@netlify/blobs`) persistent store (`binsync_db`), ensuring 100% data persistence immediately out-of-the-box even before external credentials are configured.
- **Dynamic Dashboard Hydration**: Upgrade `/dashboard` with client-side hydration that queries `/api/dashboard/stats` to render real-time user statistics, level badges, recent scans table with deletion capability, and claimable daily climate quests.
- **Continuous Scan Persistence**: Update `netlify/functions/classify.mjs` to accept the authenticated user session, record each classified item to `scan_logs`, and increment the user's `points`, `total_recycled`, `total_co2_saved`, and `current_streak`.
- **Global Auth Synchronization**: Synchronize citizen login status in `templates/base.html` header and navigation across all pages (`/`, `/classifier`, `/dashboard`, `/rules`, `/classifications`).
- **Full Backward Compatibility**: Maintain 100% passing tests on `test_suite.py` (19/19 OK) and clean compilation via `python freeze_site.py`.

### Non-Goals
- Requiring OAuth (Google/GitHub) or email/password verification for this phase; the product specification prioritizes zero-friction citizen handles.
- Migrating historical local SQLite `binsync.db` rows to the cloud; cloud users begin fresh with auto-provisioned or claimed handles.

### Anti-Goals
- Ephemeral in-memory arrays in serverless functions that reset upon function sleep/cold start.
- Silent failures or unhandled promises when database connectivity drops.

---

## 3. Constraints & Technical Environment

- **Hosting & Runtime**: Netlify Edge & Serverless Functions running on Node.js 20 (`ES modules / .mjs`).
- **Static Hosting**: Frontend served from `public/` compiled via `python freeze_site.py`. All API interactions must flow through `/api/*` routed to `/.netlify/functions/*` via `netlify.toml` and `public/_redirects`.
- **Session Management**: Dual storage supporting `HttpOnly` / `SameSite=Lax` cookies with `localStorage` token mirroring (`binsync_citizen_session`) to ensure seamless PWA service worker offline/online continuity.

---

## 4. Approaches Considered

### Approach 1: Unified Zero-Config Database & Serverless Auth (Selected & Approved)
- **Concept**: A resilient database adapter (`netlify/functions/lib/db.mjs`) supporting PostgreSQL (`DATABASE_URL` or `NETLIFY_DB_URL`) with automatic schema creation, paired with an instant Netlify Blobs (`@netlify/blobs`) fallback. Serverless functions for `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/dashboard/stats`, `/api/claim_quest`, `/api/update_hub`, and updated `/api/classify`.
- **Pros**: Zero-config instant deployment, robust persistence, automatic upgrade to external PostgreSQL without changing code.
- **Cons**: Requires building a unified interface mapping relational operations across Postgres and Blobs store.

### Approach 2: Pure PostgreSQL via `@netlify/database`
- **Concept**: Strict SQL migrations targeting Postgres only.
- **Pros**: Traditional relational SQL.
- **Cons**: Hard dependency on pre-configured database connection; fails with 500 if environment variable is missing on Netlify.

### Approach 3: Netlify Identity / Supabase Auth
- **Concept**: Full email/password or OAuth modal authentication.
- **Pros**: Industry-standard JWT/OAuth flows.
- **Cons**: High user friction, breaks the seamless citizen handle model.

---

## 5. Architecture & Data Model

### 5.1 Data Entities

#### `User`
| Field | Type | Description |
|---|---|---|
| `id` | Integer / String | Unique citizen identifier |
| `username` | String | Unique citizen handle (case-insensitive lookup) |
| `total_recycled` | Integer | Total verified packaging scans (default: 0) |
| `points` | Integer | Earned eco-points (default: 0) |
| `total_co2_saved` | Float | Kilograms of CO₂e avoided (default: 0.0) |
| `current_streak` | Integer | Consecutive scanning days (default: 0) |
| `last_scan_date` | String (YYYY-MM-DD) | Date of most recent packaging scan |
| `badges` | String | Comma-separated badge identifiers |
| `community_hub` | String | Selected neighborhood/campus hub |
| `created_at` | String (ISO) | Registration timestamp |

#### `ScanLog`
| Field | Type | Description |
|---|---|---|
| `id` | String | Unique scan identifier (e.g. `scan-179424...`) |
| `user_id` | String / Integer | Associated citizen identifier |
| `item_name` | String | Identified packaging item name |
| `material` | String | Detailed polymer / substrate composition |
| `category` | String | `Recyclable`, `Compostable`, or `Landfill` |
| `co2_saved` | Float | Grams/kg of CO₂ saved |
| `points_earned` | Integer | Points awarded for inspection |
| `disposal_steps` | Text / JSON | Exploded component breakdown JSON string |
| `timestamp` | String (ISO) | Scan creation timestamp |

#### `QuestClaim`
| Field | Type | Description |
|---|---|---|
| `id` | String | Unique claim identifier |
| `user_id` | String / Integer | Associated citizen identifier |
| `quest_key` | String | Quest identifier (`daily_scan`, `diversion_hero`, etc.) |
| `claimed_date` | String (YYYY-MM-DD) | Date quest was completed and claimed |
| `points_awarded` | Integer | Points granted for claim |

---

## 6. Serverless API Endpoints

### 1. `POST /api/auth/login`
- **Request Body**: `{ "username": "EcoWarrior", "community_hub": "Downtown Metro" }`
- **Behavior**:
  - Sanitizes and validates handle.
  - Queries database for existing citizen; if not found, provisions new profile with initial badges (`First Explorer, Newbie Recycler`).
  - Updates community hub preference if altered.
  - Returns `{ "ok": true, "user": { ... }, "token": "..." }` and sets `binsync_session` cookie.

### 2. `GET /api/auth/me`
- **Behavior**:
  - Reads session token from cookie or `Authorization: Bearer <token>` header.
  - Returns authenticated user profile or `{ "authenticated": false }`.

### 3. `POST /api/auth/logout`
- **Behavior**:
  - Clears `binsync_session` cookie and returns `{ "ok": true }`.

### 4. `GET /api/dashboard/stats`
- **Behavior**:
  - Returns user metrics, calculated level (`Seedling`, `Sprout`, `Forest Guardian`, `Eco Legend`), smartphone charges, EV miles, recent scans list (up to 20), category counts, and daily quest claim states for today.

### 5. `POST /api/claim_quest`
- **Request Body**: `{ "quest_key": "daily_scan" }`
- **Behavior**:
  - Verifies criteria (e.g., has scanned today), verifies not already claimed today, adds points, logs `QuestClaim`, returns updated user points.

### 6. `POST /api/update_hub`
- **Request Body**: `{ "community_hub": "University Campus" }`
- **Behavior**:
  - Updates user's hub in the database and returns success.

### 7. `POST /api/classify` (Updated)
- **Behavior**:
  - When a classification succeeds, checks for citizen token/ID.
  - Automatically inserts a `ScanLog` row in the database.
  - Increments user's `total_recycled`, `points`, `total_co2_saved`, and updates streak logic based on `last_scan_date`.
  - Returns updated citizen points and stats in the response payload.

### 8. `DELETE /api/scan/:id`
- **Behavior**:
  - Removes a scan entry from `scan_logs` for the authenticated citizen.

---

## 7. Frontend Dynamic Hydration

### `templates/login.html`
- Wire form submit event listener to `fetch('/api/auth/login', { method: 'POST', ... })`.
- Store returned user in `localStorage` and cookie, then redirect smoothly to `/dashboard`.
- Display inline error states if handle is invalid.

### `templates/dashboard.html`
- Add client-side script `hydrateDashboard()`:
  - Fetches `/api/dashboard/stats`.
  - Dynamically updates username, ID, hub, streak, points, level badge, and impact counters.
  - Renders recent scan rows dynamically into `#recent-scans-list` with functional delete handlers.
  - Renders daily quest cards with interactive "Claim Points" buttons.
  - Renders waste stream breakdown distribution.

### `templates/base.html`
- Header auth badge hydration:
  - On page load, checks `localStorage` or `/api/auth/me`.
  - If authenticated, dynamically updates header avatar, username, points pill, and shows "Sign Out".
  - If unauthenticated, shows "Sign In" button linking to `/login`.

### `templates/classifier.html`
- Passes active citizen auth token/ID to `/api/classify` and `/api/log_audit_items`.
- Updates header points pill immediately upon successful scan without requiring a page refresh.

---

## 8. Routing & Static Build Strategy

- `netlify.toml` and `public/_redirects`:
  - Add explicit redirects for `/api/auth/*` &rarr; `/.netlify/functions/auth`.
  - Add explicit redirects for `/api/dashboard/*` &rarr; `/.netlify/functions/dashboard`.
  - Ensure `/api/*` proxies cleanly to `/.netlify/functions/:splat`.
- Re-run `python freeze_site.py` to compile static HTML containing hydration scripts into `public/`.
- Validate with `python test_suite.py` (19/19 OK).
- Commit and push to `origin/main` for automated Netlify deployment.

---

## 9. Review & Verification Plan
1. **Local & Serverless Function Testing**: Test auth, dashboard, and classify functions directly with mock payloads.
2. **Unit Test Suite**: Run `python test_suite.py` to ensure local Flask routes remain intact.
3. **Static Freeze**: Run `python freeze_site.py` to compile static assets into `public/`.
4. **Production Deployment**: Push to GitHub `origin/main` and run live HTTP tests:
   - `POST https://binsyncc.netlify.app/api/auth/login` (verify 200 OK and persistent account creation).
   - `GET https://binsyncc.netlify.app/api/auth/me` (verify authenticated response).
   - `GET https://binsyncc.netlify.app/api/dashboard/stats` (verify live stats query).
