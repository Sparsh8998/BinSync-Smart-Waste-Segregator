# Boreal Aurora & Glassmorphic Depth Design Specification

**Date:** 2026-11-16  
**Status:** Approved by user  
**Author:** Antigravity Agent & Sparsh  
**Project:** BinSync — Precision Waste Intelligence  
**Target File:** `docs/superpowers/specs/2026-11-16-boreal-aurora-glassmorphic-design.md`

---

## 1. Intent & The Why

The BinSync interface currently uses high-contrast typography and clean cards, but the background and card surfaces suffer from a sterile, flat, "dead white" look (`#FFFFFF` on `#F8FAFC`). When users scroll, the page feels rigid, static, and clinical rather than alive, fluid, and environmentally inspiring.

The goal of this overhaul is to:
1. **Infuse Organic Luminous Life**: Replace the flat dead-white canvas with subtle boreal aurora mesh gradients (luminous blends of Boreal Ice `#E0F2FE`, Canopy Emerald `#DCFCE7`, Solar Dawn `#FEF3C7`, and Electric Cobalt `#2563EB`) diffused behind translucent frosted glassmorphic cards (`bg-white/80 backdrop-blur-xl border border-white/60 shadow-glass`).
2. **Add Fluid Scroll Choreography**: Introduce a continuous reading experience featuring:
   - A top glowing viewport scroll-progress bar.
   - Ambient light orbs that drift gently with scroll parallax.
   - Smooth staggered spring entry transitions as cards and chapters cross the viewport.
   - Tactile cursor-following 3D perspective tilt on interactive cards.
3. **Deepen Interactive Functionality**:
   - **Interactive Household Carbon & Waste Impact Simulator**: Draggable real-time sliders (weekly coffee cups, takeout cartons, plastic bottles, delivery boxes) calculating annual kg of CO₂ avoided, trees preserved, and EV miles credited.
   - **Interactive 3D Exploded Layer Sandbox**: A slider and scrub control allowing users to physically pull apart a multi-layer composite package in 3D perspective.
   - **Synthesized Micro-Audio Feedback**: Zero-asset native browser Web Audio API sounds (crisp wooden pop on click, crystal glass chime on scan completion) with a persistent mute toggle in the navigation bar.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Eliminate the Dead White Look**: Create rich, organic visual depth using layered frosted glass, subtle specular borders, and flowing aurora mesh lighting.
- **Fluid Scroll Pacing**: Ensure scrolling feels weighted, smooth, and physically alive without causing jank or layout thrashing.
- **Tangible Climate Utility**: Provide citizen households with direct, immediate interactive feedback on their personal waste diversion.
- **Mobile First & Responsive**: Maintain full responsiveness across 390px mobile viewports (iOS/Android Safari/Chrome) and 1440px desktop displays.
- **100% Test & Offline Safety**: All 19 unit tests in `test_suite.py` must pass, static site freeze (`freeze_site.py`) must compile cleanly, and PWA service worker must continue caching offline assets.

### Non-Goals
- We are not changing the backend database schema or altering the core `/api/classify` serverless endpoints.
- We are not introducing heavy external 3D libraries (e.g. Three.js / WebGL shaders) that would slow down bundle times; all 3D tilt and exploded schemas will use CSS 3D transforms (`perspective`, `transform-style: preserve-3d`, `translateZ`) and vanilla JavaScript for 60fps performance on low-power devices.
- We are not forcing dark mode; the aesthetic is a vibrant, light Nordic Aurora climate-tech environment.

### Anti-Goals
- No aggressive, nauseating parallax or scrolling hijackers. Native scrolling behavior must remain completely uninterrupted and accessible.
- Respect `prefers-reduced-motion`: When reduced motion is requested, all ambient drift, spring animations, and 3D tilts are disabled while preserving all functionality and layout beauty.
- No intrusive audio autoplay: The Web Audio synthesizer must be polite, subtle, and easily toggled off from the navigation bar.

---

## 3. Approaches Considered & Selection

### Approach 1: Boreal Aurora & Glassmorphic Depth (Selected)
- **Atmospheric Palette**: Luminous mesh gradients, frosted glass (`backdrop-blur-xl`), inner specular borders, and deep Nordic Cobalt accents.
- **Motion**: Parallax light orbs, top progress bar, staggered spring reveals, 3D tilt physics.
- **Functionality**: Household Carbon Simulator, Exploded 3D Layer Sandbox, Web Audio micro-feedback.
- **Trade-offs**: Requires disciplined CSS GPU compositing to avoid mobile battery drain. *Chosen because it delivers the exact lively, fluid, high-craft atmosphere the user requested.*

### Approach 2: Kinetic Climate-Tech Workstation (Rejected)
- Pinned scroll-scrubbing with dark blueprint styling.
- *Reason for Rejection:* Too industrial and mechanical; does not cure the sterile feeling as warmly as Approach 1.

### Approach 3: Living Ecosystem & Biophilic Gamification (Rejected)
- Heavy illustrated flora and plant growth animations.
- *Reason for Rejection:* Too cartoony/whimsical; lacks the precision climate-tech authority of BinSync.

---

## 4. Architectural & Component Specification

### 4.1 Ambient Aurora Mesh & Glassmorphic Tokens (`templates/base.html`)
We will enrich the Tailwind and CSS variables in `templates/base.html`:
```css
:root {
    --aurora-blue: #E0F2FE;
    --aurora-mint: #DCFCE7;
    --aurora-amber: #FEF3C7;
    --aurora-cobalt: rgba(37, 99, 235, 0.08);
    --glass-bg: rgba(255, 255, 255, 0.78);
    --glass-border: rgba(255, 255, 255, 0.65);
    --glass-specular: inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
    --glass-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
}

.aurora-mesh-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    background: radial-gradient(circle at 15% 15%, rgba(224, 242, 254, 0.7) 0%, transparent 45%),
                radial-gradient(circle at 85% 25%, rgba(220, 252, 231, 0.6) 0%, transparent 45%),
                radial-gradient(circle at 50% 75%, rgba(254, 243, 199, 0.5) 0%, transparent 50%),
                radial-gradient(circle at 80% 85%, rgba(37, 99, 235, 0.07) 0%, transparent 40%),
                #F8FAFC;
}

.glass-card {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-specular), var(--glass-shadow);
    border-radius: 1.25rem;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
}

.glass-card:hover {
    transform: translateY(-3px);
    border-color: rgba(37, 99, 235, 0.3);
    box-shadow: var(--glass-specular), 0 20px 40px -8px rgba(15, 23, 42, 0.1), 0 8px 16px -4px rgba(15, 23, 42, 0.05);
}
```

### 4.2 Fluid Scroll Choreography & Viewport Indicator
1. **Scroll Progress Bar**: A fixed 3px bar at the top of the browser:
   `#scroll-progress-bar { width: 0%; height: 3px; background: linear-gradient(90deg, #2563EB, #0D9488, #F59E0B); z-index: 100; }`
   Updated smoothly in a passive scroll loop via `window.scrollY / (documentHeight - windowHeight)`.
2. **Floating Parallax Light Orbs**: Two floating radial blurred elements (`.ambient-orb-1`, `.ambient-orb-2`) that move smoothly in opposite vertical directions during scroll, giving the background depth.
3. **Interactive 3D Card Tilt**:
   Applied to featured cards (`data-tilt="true"`). On `mousemove`, computes cursor position from card center:
   `transform: perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px);`
   Smoothly resets to `transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)` on `mouseleave`.

### 4.3 Interactive Household Carbon & Waste Impact Simulator (`templates/index.html`)
An interactive, high-craft widget allowing citizens to calculate their household impact:
- **Sliders**:
  1. Single-use Coffee Cups per week (0 to 30)
  2. Plastic Beverage Bottles per week (0 to 50)
  3. Flexible Snack Pouches & Chip Bags per week (0 to 40)
  4. Corrugated Cardboard Delivery Boxes per week (0 to 30)
- **Live Output Displays**:
  - Annual Landfill Waste Diverted: `X.X kg/year`
  - Avoided Greenhouse Gases: `X.X kg CO₂e`
  - Real-World Equivalents: `Equivalent to X electric vehicle miles & X trees absorbing carbon for a year`
  - Direct Action Button: "Audit My Household Waste with AI Inspector &rarr;"

### 4.4 Interactive 3D Exploded Layer Sandbox (`templates/index.html` & `templates/classifier.html`)
An interactive packaging viewer with a scrubber slider:
- User drags slider from "Assembled" (0%) to "Fully Deconstructed" (100%).
- The composite package (e.g., Potato Chip / Snack Pouch) physically separates along the Z-axis in 3D:
  - Layer 1 (Bleached Fiber Outer Sleeve) moves forward (`translateZ(60px) translateY(-30px)`).
  - Layer 2 (BOPP Film + Metallized Aluminum Vapor) tilts in center (`translateZ(0px)`).
  - Layer 3 (Inner Sealant + Residue) recedes (`translateZ(-60px) translateY(30px)`).
- Connecting guideline lines show where each layer routes (Curbside Blue, Store Soft-Plastic, Rinse Clean).

### 4.5 Web Audio Micro-Haptic Synthesizer
Zero-dependency sound generator:
- `soundPop()`: A rapid 80Hz to 240Hz sinusoidal frequency sweep (35ms duration) for button clicks and slider steps.
- `soundChime()`: A two-tone crystal harmonic chime (523.25Hz -> 659.25Hz) with gentle exponential decay for scan completion or streak milestones.
- Stored user preference in `localStorage('binsync_sound_enabled')` with an accessible audio toggle in the top navigation bar.

---

## 5. File Modifications & Responsibilities

| File | Responsibility |
|------|----------------|
| `templates/base.html` | Aurora mesh canvas, glassmorphic tokens, scroll progress bar, audio synthesizer, and nav audio toggle |
| `templates/index.html` | 4-chapter narrative elevation with Household Carbon Simulator, Exploded 3D Layer Sandbox, parallax orbs |
| `templates/classifier.html` | Glassmorphic inspector workstation, 3D card tilt on layer decomposition cards, audio trigger hooks |
| `templates/rules.html` | Glassmorphic map cards, enhanced Wishcycling Encyclopedia with smooth height animations |
| `templates/classifications.html` | Glassmorphic taxonomy grid, arcade game sound effects integration |
| `test_suite.py` | Unit tests verifying all routes, simulator math, and template integrity |
| `freeze_site.py` & `public/` | Compiling static HTML and verifying PWA service worker with network-first caching |

---

## 6. Verification & Test Plan

1. **Local Test Client**: `python test_suite.py` must maintain 19/19 passing tests.
2. **Simulator Math Verification**: Unit test verifying that household carbon simulation returns mathematically correct CO₂ and landfill avoidance figures based on EPA WARM emission factors.
3. **Static Freeze**: `python freeze_site.py` compiles all routes to `public/` with zero 500 errors.
4. **Git & Netlify Production Deployment**: Pushed to `origin/main` and verified via `curl.exe` returning HTTP 200 on `https://binsyncc.netlify.app/` and `/classifier`.
