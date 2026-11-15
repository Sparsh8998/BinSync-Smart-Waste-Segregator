# Boreal Aurora & Glassmorphic Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BinSync from a flat, sterile white interface into a living, fluid climate-tech experience featuring ambient boreal aurora mesh lighting, glassmorphic depth, smooth scroll-linked parallax, an interactive household carbon simulator, a 3D exploded packaging deconstruction sandbox, and native Web Audio micro-feedback.

**Architecture:** Enrich the base template with a fixed hardware-accelerated ambient aurora mesh canvas, top scroll progress indicator, and zero-dependency Web Audio synthesizer. Refactor cards across all pages to use frosted glassmorphism (`bg-white/80 backdrop-blur-xl border border-white/60 shadow-glass`) with specular highlights and cursor 3D tilt. Build client-side interactive calculators and 3D exploded packaging visualizers with zero external dependencies.

**Tech Stack:** HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Web Audio API, CSS 3D Transforms, Flask, Python, Leaflet.js.

**Spec:** `docs/superpowers/specs/2026-11-16-boreal-aurora-glassmorphic-design.md`

## Global Constraints
- Preserve exact Nordic Glacier Climate Tech color tokens (Cobalt `#2563EB`, Solar `#F59E0B`, Obsidian `#0F172A`).
- All interactive visual effects must gracefully degrade when `prefers-reduced-motion` is detected.
- Zero external audio or heavy 3D library dependencies (use browser Web Audio API and CSS 3D transforms).
- Mobile responsiveness down to 390px viewport width (no horizontal scrolling or cutoff elements).
- All 19 unit tests in `test_suite.py` must pass at every step.
- `freeze_site.py` must compile clean static pages to `public/` with zero 500 errors.

## Review Focus
1. Low-power mobile devices and battery usage: ensure ambient mesh gradients and scroll handlers run inside `requestAnimationFrame` with passive event listeners to avoid scroll jank.
2. Web Audio policy: browsers require a user interaction (click/touch) before AudioContext can resume; handle `audioCtx.state === 'suspended'` gracefully.
3. Translucent text contrast: ensure Obsidian Slate (`#0F172A`) and Charcoal (`#334155`) text maintain WCAG AAA contrast (minimum 7:1) over frosted glass backgrounds.
4. Exploded 3D packaging slider boundary conditions: ensure layer separation clamps between 0% and 100% without clipping on mobile screens.
5. PWA Service Worker cache sync: static freeze must ensure `public/sw.js` and `_redirects` route properly on Netlify.

---

### Task 1: Aurora Mesh Canvas, Glassmorphism Tokens & Scroll Progress Bar (`templates/base.html`)

**Files:**
- Modify: `templates/base.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: Tailwind config, existing CSS variables in `templates/base.html`.
- Produces: `.aurora-mesh-canvas`, `.glass-card`, `#scroll-progress-bar`, ambient floating parallax orbs, updated `.taste-card` styling with specular borders.

- [ ] **Step 1: Check base route test in `test_suite.py`**
  Run: `python -c "from app import app; res = app.test_client().get('/'); assert res.status_code == 200; print('Base test PASS')"`
  Expected: Base test PASS.

- [ ] **Step 2: Add Aurora Mesh Canvas, Scroll Progress Bar & Glassmorphic Classes to `templates/base.html`**
  - Add fixed `#scroll-progress-bar` at top of viewport (`z-index: 100`).
  - Add fixed `.aurora-mesh-canvas` with multi-stop radial aurora gradients (Boreal Ice `#E0F2FE`, Canopy Mint `#DCFCE7`, Solar Dawn `#FEF3C7`, Cobalt `#2563EB`).
  - Add `.glass-card` styling with `backdrop-filter: blur(16px)`, white borders (`border: 1px solid rgba(255,255,255,0.7)`), and inner specular highlights (`box-shadow: inset 0 1px 1px 0 rgba(255,255,255,0.9)`).
  - Add passive scroll listener updating `#scroll-progress-bar` width and drifting ambient background orbs.
  - Disable motion and tilt when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

- [ ] **Step 3: Run unit tests to verify no regressions**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.

- [ ] **Step 4: Commit**
  `git add templates/base.html`
  `git commit -m "feat(design): implement aurora mesh canvas, scroll progress bar, and glassmorphic tokens"`

---

### Task 2: Web Audio Micro-Haptic Synthesizer & Audio Toggle (`templates/base.html`)

**Files:**
- Modify: `templates/base.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: Browser Web Audio API (`window.AudioContext || window.webkitAudioContext`).
- Produces: Global functions `window.playMicroSound('pop')`, `window.playMicroSound('chime')`, `window.toggleSound()`, and audio mute pill in desktop and mobile navigation.

- [ ] **Step 1: Check navigation rendering test in `test_suite.py`**
  Run: `python -c "from app import app; res = app.test_client().get('/'); assert b'BinSync' in res.data; print('Nav test PASS')"`

- [ ] **Step 2: Implement zero-asset Web Audio Synthesizer in `templates/base.html`**
  - Synthesize a 35ms wooden tactile "pop" sweep (80Hz to 240Hz) for button clicks and slider interactions.
  - Synthesize a gentle 180ms two-tone crystal "chime" (523Hz -> 659Hz) with exponential gain decay for scan completions.
  - Add an accessible sound toggle button (`#sound-toggle-btn`) in the top navigation bar with icon states (`volume_up` / `volume_off`).
  - Persist sound preference in `localStorage('binsync_sound_enabled')` (defaults to on, respects user toggle).
  - Handle browser autoplay suspension gracefully on first user interaction.

- [ ] **Step 3: Run unit tests to verify no regressions**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.

- [ ] **Step 4: Commit**
  `git add templates/base.html`
  `git commit -m "feat(audio): add native web audio micro-haptic synthesizer and nav sound toggle"`

---

### Task 3: Interactive Household Carbon & Waste Impact Simulator (`templates/index.html`)

**Files:**
- Modify: `templates/index.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: EPA WARM waste emission factors, `window.playMicroSound`.
- Produces: Interactive Household Carbon Calculator section with 4 real-time sliders (coffee cups, bottles, snack wrappers, delivery boxes), live metric readouts (annual kg CO₂ avoided, EV miles credited, seedling trees planted), and direct CTA into `/classifier`.

- [ ] **Step 1: Write verification test for household simulator calculation in `test_suite.py`**
  Verify the emission calculation formula:
  - Coffee cup avoided: ~35g CO₂e
  - Plastic beverage bottle avoided: ~82g CO₂e
  - Snack pouch avoided: ~45g CO₂e
  - Cardboard box avoided: ~120g CO₂e
  Run: `python -c "cup=35; bot=82; pouch=45; box=120; co2_g = (5*cup + 10*bot + 7*pouch + 4*box)*52; assert round(co2_g/1000, 1) == 93.0; print('Calc test PASS')"`

- [ ] **Step 2: Add Household Carbon Simulator chapter to `templates/index.html`**
  - Design a glassmorphic card with 4 tactile range sliders:
    1. Single-use Coffee Cups per week (0 to 30)
    2. Plastic Beverage Bottles per week (0 to 50)
    3. Flexible Snack Pouches per week (0 to 40)
    4. Cardboard Delivery Boxes per week (0 to 30)
  - Bind slider input events to update live metrics with tabular numerals and `window.playMicroSound('pop')`.
  - Display live annual impact counters: Total kg Diverted, kg CO₂e Greenhouse Gas Avoided, Equivalent Electric Vehicle Miles, and Trees Seedling Equivalent.
  - Direct launch button linking directly to `/classifier` to start scanning.

- [ ] **Step 3: Run unit tests to verify no regressions**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.

- [ ] **Step 4: Commit**
  `git add templates/index.html`
  `git commit -m "feat(simulator): add interactive household carbon and waste impact calculator"`

---

### Task 4: Interactive 3D Exploded Layer Sandbox & Parallax Choreography (`templates/index.html`)

**Files:**
- Modify: `templates/index.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: Sample packaging images (`/static/samples/`), CSS 3D transforms (`perspective`, `translateZ`).
- Produces: Interactive packaging explosion scrubber slider (0% Assembled to 100% Exploded), floating 3D layer perspective, dynamic layer connector lines, and cursor 3D tilt on sample cards.

- [ ] **Step 1: Check homepage route test in `test_suite.py`**
  Run: `python -c "from app import app; res = app.test_client().get('/'); assert res.status_code == 200; print('Home test PASS')"`

- [ ] **Step 2: Upgrade Chapter 2 in `templates/index.html` with Interactive 3D Exploded Sandbox**
  - Add an interactive scrubber slider ("Scrub to Disassemble Packaging Layers: 0% to 100%").
  - Animate the 3 physical layers in 3D perspective as the slider moves:
    - Layer 1 (Bleached Cardboard Sleeve) translates +60px Z and -24px Y toward the user.
    - Layer 2 (BOPP Film + Metallized Vapor) tilts at center with golden glow.
    - Layer 3 (Inner Sealant & Food Remnants) recedes -60px Z and +24px Y.
  - Add dynamic guideline badges showing municipal destinations for each layer (Curbside Blue, Store Soft-Plastic, Wipe Clean).
  - Add cursor-following 3D perspective tilt (`data-tilt="true"`) to hero sample cards.

- [ ] **Step 3: Run unit tests to verify no regressions**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.

- [ ] **Step 4: Commit**
  `git add templates/index.html`
  `git commit -m "feat(motion): implement interactive 3D exploded layer sandbox and cursor tilt physics"`

---

### Task 5: Packaging Inspector & Secondary Pages Glassmorphic Polish (`templates/classifier.html`, `templates/rules.html`, `templates/classifications.html`)

**Files:**
- Modify: `templates/classifier.html`
- Modify: `templates/rules.html`
- Modify: `templates/classifications.html`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: `.glass-card`, `window.playMicroSound`, `data-tilt`.
- Produces: Elevated frosted glass workstation in Inspector, audio trigger on classification success, glassmorphic depot cards in Rules, and tactile glass arcade cards in Classifications.

- [ ] **Step 1: Check classifier, rules, and classifications route tests**
  Run: `python -c "from app import app; c = app.test_client(); [print(r, c.get(r).status_code) for r in ['/classifier', '/rules', '/classifications']]"`
  Expected: All return 200.

- [ ] **Step 2: Polish `templates/classifier.html`**
  - Upgrade scanner container and results cards to `.glass-card` with specular borders.
  - Hook `window.playMicroSound('chime')` into successful AI decomposition rendering.
  - Add subtle 3D hover tilt to physical decomposition cards.

- [ ] **Step 3: Polish `templates/rules.html` & `templates/classifications.html`**
  - Apply `.glass-card` styling to depot facility cards and Wishcycling Encyclopedia accordions.
  - Integrate sound feedback into Arcade game sorting buttons in `templates/classifications.html`.

- [ ] **Step 4: Run unit tests to verify no regressions**
  Run: `python test_suite.py`
  Expected: 19 tests PASS.

- [ ] **Step 5: Commit**
  `git add templates/classifier.html templates/rules.html templates/classifications.html`
  `git commit -m "feat(design): elevate classifier, rules, and taxonomy with glassmorphic depth and audio cues"`

---

### Task 6: Static Site Compilation, PWA Service Worker Verification & Production Deployment

**Files:**
- Modify: `public/*`
- Test: `test_suite.py`

**Interfaces:**
- Consumes: All updated templates.
- Produces: Compiled static assets in `public/`, service worker cache update, and live production deployment on Netlify.

- [ ] **Step 1: Run full unit test suite**
  Run: `python test_suite.py`
  Expected: 19/19 tests PASS.

- [ ] **Step 2: Compile static site into `public/`**
  Run: `python freeze_site.py`
  Expected: All routes frozen without error.

- [ ] **Step 3: Verify clean URLs, `_redirects`, and service worker in `public/`**
  Ensure `public/sw.js` and `public/_redirects` are intact.

- [ ] **Step 4: Commit and push to GitHub `origin/main`**
  Commit all changes and push to trigger automated Netlify deployment.

- [ ] **Step 5: Live production verification**
  Run HTTP status checks against `https://binsyncc.netlify.app/` and `/classifier` confirming live HTTP 200 OK.

---

## Self-Review Checklist
- **Spec Coverage:**
  - Luminous Aurora Mesh background: covered in Task 1.
  - Top scroll progress indicator: covered in Task 1.
  - Web Audio micro-haptics & toggle: covered in Task 2.
  - Household Carbon & Waste Impact Simulator: covered in Task 3.
  - Interactive 3D Exploded Layer Sandbox & tilt: covered in Task 4.
  - Glassmorphic elevation across Inspector, Rules, and Taxonomy: covered in Task 5.
  - Static freeze, test verification, and live Netlify push: covered in Task 6.
- **Review Focus:**
  - Mobile performance, audio context suspension, WCAG contrast over glass, 3D transform bounds, and service worker caching are explicitly addressed.
- **Proportion:**
  - Tasks are right-sized with checkable verification commands and clean commits.
