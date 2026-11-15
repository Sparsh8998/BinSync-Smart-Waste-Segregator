# BinSync Editorial Storytelling & Visual Immersion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BinSync into a high-craft editorial publication and interactive climate tech workstation that educates citizens on packaging decomposition, while preserving its signature Nordic Glacier Climate Tech color theme.

**Architecture:** Paced visual chapters with one primary concept per viewport, strict equal margins, quiet micro-interactions, responsive touch ergonomics, and an interactive physical packaging decomposition workstation backed by live Netlify serverless functions and fail-safe client-side edge decomposition.

**Tech Stack:** HTML5, Jinja2 templates, Tailwind CSS, Vanilla ES6+ JavaScript, Flask (backend/test harness), Netlify Functions v2 (Node.js/ESM).

**Spec:** [`docs/superpowers/specs/2026-11-16-editorial-storytelling-design.md`](file:///c:/Users/spars/Desktop/Hackathons/binsync/docs/superpowers/specs/2026-11-16-editorial-storytelling-design.md)

## Global Constraints
- Primary Brand Cobalt: `#2563EB` and `#1D4ED8` verbatim.
- Accent Solar Amber: `#F59E0B` and `#D97706` for streaks, eco-points, and milestone badges.
- Base Ground Canvas: Glacier Ice-White `#F8FAFC` and Pristine Card White `#FFFFFF`.
- Typography Authority: Obsidian Slate `#0F172A` headlines (`font-black`, `tracking-tight`), Charcoal Slate `#334155` body, JetBrains Mono figures for CO₂ grams and scrap values.
- Stream Badges: Blue Stream (`#0284C7`), Glacier Teal (`#0D9488`), Landfill Slate (`#475569`), Specialty Amber (`#D97706`).
- No generic AI tells: No floating gradient orbs, no uppercase tracked pill pollution over headings, no emoji badges.
- Zero broken links or missing endpoints: Preserve existing Netlify serverless API routing and fail-safe edge decomposition engine.
- Complete responsive parity down to 390px with minimum 48px touch targets.

## Review Focus
1. **Mobile Viewport Scanner**: Camera dropzone and layer decomposition must remain accessible and clean on small phone screens (390px) without horizontal scroll or truncated cards.
2. **Offline Resilience**: Offline scanning or failed network requests must immediately decompose packaging locally without blocking or displaying "Analysis Blocked" error screens.
3. **Bounding Box Alignment**: Physical layer bounding boxes must scale accurately over uploaded images across all aspect ratios without misalignment.
4. **Resin Stamp Verification Loop**: The correction buttons must award +10 Eco-Pts cleanly without console errors or page jumps.
5. **Static Site Freeze & PWA Caching**: All routes (`/`, `/classifier`, `/dashboard`, `/leaderboard`, `/classifications`, `/rules`, `/login`, `/sw.js`) must freeze into `public/` and pass the 19-test suite.

---

### Task 1: Navigation Shell & Editorial Footer Architecture (`templates/base.html`)

**Files:**
- Modify: `templates/base.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: Existing user session context and endpoints (`home`, `classifier`, `rules`, `classifications`, `leaderboard`, `dashboard`, `login`, `logout`).
- Produces: Polished frosted glass header (`backdrop-blur-md bg-white/90`), ergonomic 5-tab mobile bottom bar, and structured Obsidian Slate footer.

- [ ] **Step 1: Write/Update the test asserting base shell markup and navigation routes**
  Verify in `test_suite.py` that all navigation endpoints resolve with status 200 and return proper layout markers.
- [ ] **Step 2: Run test suite to verify baseline**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.
- [ ] **Step 3: Refine `templates/base.html`**
  - Implement sleek frosted glass navbar with active pill indicator and live Eco-Points counter pill (`#nav-points-pill`).
  - Upgrade mobile bottom navigation with generous 48px touch targets, tactile tap feedback, and floating central scan action.
  - Structure the editorial Obsidian footer with clear taxonomy links, municipal accreditation, and zero clutter.
- [ ] **Step 4: Verify in local Flask test client**
  Run: `python -c "from app import app; res = app.test_client().get('/'); assert res.status_code == 200; print('Base shell test PASS')"`
  Expected: Base shell test PASS.
- [ ] **Step 5: Commit**
  `git add templates/base.html`
  `git commit -m "feat(design): implement editorial navigation shell and mobile bottom bar"`

---

### Task 2: Homepage Editorial Chapter Architecture (`templates/index.html`)

**Files:**
- Modify: `templates/index.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: `templates/base.html`, sample images in `/static/samples/`.
- Produces: 4 visual chapters (Entrance Hero with 1-click test packaging cards, Physical Breakdown Exhibit, Community Climate Impact Ledger, and Municipal Stream Protocol).

- [ ] **Step 1: Verify homepage test in `test_suite.py`**
  Run: `python -c "from app import app; res = app.test_client().get('/'); assert b'BinSync' in res.data; print('Home test PASS')"`
- [ ] **Step 2: Redesign `templates/index.html` into paced editorial chapters**
  - **Chapter 1 (Hero)**: High-impact typography stating plainly what BinSync does, paired with 4 high-contrast test packaging cards (Snack Wrapper, PureLife Bottle, Organic Scrap, Garbage Liner).
  - **Chapter 2 (Decomposition Exhibit)**: Visual exhibit explaining why single-stream recycling fails and how layered decomposition identifies each component in milliseconds.
  - **Chapter 3 (Climate Impact Ledger)**: Prominent live counters for items sorted, kilograms of CO₂ avoided, and landfill diversion percentage.
  - **Chapter 4 (4-Stream Protocol)**: Unambiguous municipal guides for Blue, Green, Black, and Depot streams.
- [ ] **Step 3: Run test suite to verify no regressions**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.
- [ ] **Step 4: Commit**
  `git add templates/index.html`
  `git commit -m "feat(design): elevate homepage into high-craft editorial chapters"`

---

### Task 3: Packaging Inspector Workstation & Layer Decomposition (`templates/classifier.html`)

**Files:**
- Modify: `templates/classifier.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: `/api/classify`, `/api/verify_correction`, `/api/claim_upcycle`, `/api/ask_followup`, client-side fallback `CLIENT_FALLBACK_SAMPLES`.
- Produces: Tactile dropzone, laser scanner sweep, physical component cards with bounding box overlays, 3-stage lifecycle carbon barometer, and guaranteed edge decomposition.

- [ ] **Step 1: Check classifier route test in `test_suite.py`**
  Run: `python -c "from app import app; res = app.test_client().get('/classifier'); assert res.status_code == 200; print('Classifier test PASS')"`
- [ ] **Step 2: Redesign `templates/classifier.html`**
  - Clean tactile dropzone with native camera trigger on mobile, image compression pipeline, and vertical laser sweep animation.
  - Physical layer decomposition cards with two-way hover sync highlighting bounding boxes on the packaging photo.
  - 3-stage lifecycle carbon barometer (Manufacturing Avoided, Pulping Saved, Methane Prevented).
  - Inline resin stamp verification bar (+10 Eco-Pts) and circular DIY reuse bonus claim button (+30 Eco-Pts).
  - Defensive null checks and guaranteed client-side edge decomposition so UI never blocks.
- [ ] **Step 3: Run unit tests**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.
- [ ] **Step 4: Commit**
  `git add templates/classifier.html`
  `git commit -m "feat(design): elevate packaging inspector with tactile decomposition cards and carbon barometer"`

---

### Task 4: Municipal Bylaws & Drop-off Depot Guide (`templates/rules.html`)

**Files:**
- Modify: `templates/rules.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: `/api/bylaws`, `/api/depots`, Leaflet map or clean facility list.
- Produces: City lookup, interactive depot category filters, collection schedule cards, and wishcycling encyclopedia.

- [ ] **Step 1: Check rules route in `test_suite.py`**
  Run: `python -c "from app import app; res = app.test_client().get('/rules'); assert res.status_code == 200; print('Rules test PASS')"`
- [ ] **Step 2: Redesign `templates/rules.html`**
  - City switcher with EPA standard triple-stream guidelines and collection schedules.
  - Interactive depot facility cards with stream tags (Hazardous & E-Waste, Soft Plastics, Compost, Textiles).
  - Clean wishcycling accordion encyclopedia for pizza boxes, coffee cups, aerosol cans, and plastic wrap.
- [ ] **Step 3: Run unit tests**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.
- [ ] **Step 4: Commit**
  `git add templates/rules.html`
  `git commit -m "feat(design): craft editorial municipal bylaws and depot guide"`

---

### Task 5: Taxonomy Directory, Leaderboard & Dashboard Polish (`templates/classifications.html`, `templates/leaderboard.html`, `templates/dashboard.html`)

**Files:**
- Modify: `templates/classifications.html`
- Modify: `templates/leaderboard.html`
- Modify: `templates/dashboard.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: Existing user diversion statistics, leaderboard ranks, resin code taxonomy data.
- Produces: Polished resin code lookup (#1-#7), citizen streak leaderboard, and personal CO₂ offset timeline.

- [ ] **Step 1: Check taxonomy, leaderboard, and dashboard routes**
  Run: `python -c "from app import app; c = app.test_client(); [print(r, c.get(r).status_code) for r in ['/classifications', '/leaderboard', '/dashboard']]"`
  Expected: All return 200.
- [ ] **Step 2: Polish `templates/classifications.html`**
  - Clean resin code directory cards (#1 PET to #7 OTHER) with scrap values ($/kg and ₹/kg) and municipal acceptance indicators.
- [ ] **Step 3: Polish `templates/leaderboard.html` & `templates/dashboard.html`**
  - High-craft citizen ranking table with streak flames, milestone badges, and personal CO₂ offset chart.
- [ ] **Step 4: Run unit tests**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.
- [ ] **Step 5: Commit**
  `git add templates/classifications.html templates/leaderboard.html templates/dashboard.html`
  `git commit -m "feat(design): polish taxonomy directory, citizen leaderboard, and carbon audit dashboard"`

---

### Task 6: Static Site Compilation, PWA Service Worker Verification & Final Deployment

**Files:**
- Modify: `freeze_site.py`
- Modify: `public/*`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: All updated templates in `templates/`.
- Produces: Fully compiled static HTML pages and PWA service worker `binsync-pwa-v3` in `public/`.

- [ ] **Step 1: Run complete unit test suite**
  Run: `python test_suite.py`
  Expected: 19/19 tests PASS.
- [ ] **Step 2: Compile static site into `public/`**
  Run: `python freeze_site.py`
  Expected: All routes frozen to `public/` without error.
- [ ] **Step 3: Verify clean URLs and redirects in `public/`**
  Verify `public/_redirects` and `public/sw.js` are in place and intact.
- [ ] **Step 4: Commit and push to GitHub**
  Commit all changes to git and push to `origin/main` to trigger live Netlify deployment.
- [ ] **Step 5: Live verification**
  Run curl tests against `https://binsyncc.netlify.app/` and `/classifier` to confirm live production success.
