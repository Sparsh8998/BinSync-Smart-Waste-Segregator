# Design Specification: BinSync High-Craft Editorial Storytelling & Visual Immersion

- **Date**: 2026-11-16
- **Approach**: Approach 2 (High-Craft Editorial Storytelling & Visual Immersion)
- **Status**: Proposed for Approval

---

## 1. Intent & The "Why"
BinSync is an intelligent waste segregator and packaging decomposition platform designed to eliminate wishcycling, educate citizens on multi-material consumer packaging, and verify municipal diversion metrics.

While climate tech tools often feel either like bureaucratic government utility portals or generic SaaS dashboards, BinSync is elevated into an **award-winning, high-craft editorial publication** (inspired by Stripe Climate, Watershed, and Figma.com). The visual experience communicates authoritative municipal intelligence, tactile physical decomposition of consumer packaging, and transparent carbon accounting while preserving the established **Nordic Glacier Climate Tech** brand palette.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
- **Editorial Chapter Architecture**: Each page is structured as clear, disciplined visual chapters (`taste-skill` Rule 3: 1 section per screen, no awkward heading peek, equal left/right margins).
- **Physical Packaging Decomposition as the Hero Moment**: Transform the packaging scanner into an editorial material exploration journey where each composite layer (cap, liner, body, label) is revealed with tactile visual weight, bounding boxes, and clear preparation directives.
- **Micro-Interactions & Dealt Moments**: Smooth, quiet micro-animations (`taste-skill` Rule 5: linked cards lift 2px, photos zoom 1.02× inside frame, buttons step on hover and press on click, counters ease-in with spring physics).
- **Preserved Color Theme**: Strict adherence to Electric Precision Cobalt (`#2563EB`), Solar Amber (`#F59E0B`), Glacier Ice-White Canvas (`#F8FAFC`), Pristine Card White (`#FFFFFF`), and Obsidian Slate (`#0F172A`).
- **Complete Responsive Parity**: Flawless layout and touch targets (minimum 48px) across Mobile (390px), Tablet (768px), Laptop (1024px), and Desktop (1440px).

### Non-Goals
- Changing the underlying Flask routes or Netlify serverless functions (`classify.mjs`, `lookup.mjs`, `depots.mjs`, `bylaws.mjs`, etc.).
- Adding unneeded heavy JavaScript frameworks (keep clean vanilla JS and Tailwind CSS utility classes).

### Anti-Goals
- Generic "AI template" aesthetics: No floating colored glow orbs, no uppercase tracked kicker pill pollution over every heading, no low-contrast light grey text on white backgrounds, no emoji soup.
- Cluttered, overwhelming viewports that distract from the central waste segregation action.

---

## 3. Brand & Color Palette Constraints (Preserved)

All color tokens remain anchored to the **Nordic Glacier Climate Tech** palette:
- **Primary Brand / Action**: Electric Precision Cobalt (`#2563EB` / `#1D4ED8`)
- **Accent & Gamification**: Solar Amber Gold (`#F59E0B` / `#D97706`) for eco-streaks, points, and circular achievements
- **Base Canvas**: Glacier Ice-White (`#F8FAFC`) with Crisp Slate Insets (`#F1F5F9`)
- **Card Surfaces**: Pure Card White (`#FFFFFF`) with Glacier Border Lines (`#E2E8F0` / `#CBD5E1`)
- **Headlines & Authority**: Obsidian Slate (`#0F172A`)
- **Body & Secondary Copy**: Cool Charcoal Slate (`#334155`) and Glacier Muted Slate (`#64748B`)
- **Stream Badges**:
  - Curbside Recyclables: Blue Stream (`#0284C7` on `#F0F9FF`)
  - Organics / Compost: Glacier Teal Stream (`#0D9488` on `#F0FDFA`)
  - Managed Landfill: Slate Stream (`#475569` on `#F8FAFC`)
  - Specialty Depot / E-Waste: Solar Amber Stream (`#D97706` on `#FFFBEB`)

---

## 4. Approaches Considered

1. **Approach 1: Bento Climate-Tech Workstation**: High-density utility grid. Fast and modular, but less emotionally resonant.
2. **Approach 2: High-Craft Editorial Storytelling & Visual Immersion (Selected)**: Structured visual chapters, refined typography hierarchy, tactile physical material breakdowns, generous breathing room, and intentional dealt moments on every page.
3. **Approach 3: Minimalist Scandinavian Utility**: Monospace data-heavy tables. Efficient for enterprise auditors, but lacks engagement for citizens.

---

## 5. Screen-by-Screen Implementation Directives

### 1. Global Shell & Navigation (`templates/base.html`)
- **Navigation Bar**: Clean frosted glass header (`backdrop-blur-md bg-white/90`) with crisp hairline border (`#E2E8F0`), high-contrast logo typography, active pill indicator, and quick-access Citizen Points pill.
- **Mobile Bottom Navigation Bar**: 5-tab ergonomic layout with 48px touch targets, centered floating Scan action, and active state indicators.
- **Editorial Footer**: Obsidian Slate (`#0F172A`) grounding with structured columns, municipal taxonomy links, carbon accounting accreditation, and zero clutter.

### 2. Homepage Chapter Journey (`templates/index.html`)
- **Chapter 1: The Entrance Hero**: Confident editorial headline stating plainly what BinSync delivers. Clean interactive prompt with quick 1-click test packaging cards (Snack Wrapper, PureLife Bottle, Organic Compost, Garbage Liner).
- **Chapter 2: The Physical Breakdown Exhibit**: Visual demonstration of why single-stream recycling fails and how BinSync's layer decomposition identifies composite packaging in milliseconds.
- **Chapter 3: Community Climate Impact Ledger**: Real-time counter of total items segregated, kilograms of CO₂ avoided, and municipal landfill diversion metrics.
- **Chapter 4: The 4-Stream Municipal Protocol**: Clean editorial cards defining Blue Bin, Green Bin, Black Bin, and Depot streams with unambiguous dos and don'ts.

### 3. Packaging Inspector Workstation (`templates/classifier.html`)
- **Optics & Ingestion Zone**: Large tactile dropzone with native camera trigger on mobile, image compression pipeline, and glowing laser sweep scanner.
- **Decomposition Reveal**: Real-time component cards highlighting distinct layers (e.g. foil seal vs plastic body) with interactive bounding box overlays and two-way hover synchronization.
- **Lifecycle Carbon Barometer**: High-precision 3-stage breakdown (Manufacturing Avoided, Pulping Energy Saved, Methane Prevented).
- **Resilience**: 100% fail-safe client-side edge decomposition ensuring analysis never blocks even offline.

### 4. Drop-off Map & Municipal Bylaws (`templates/rules.html`)
- **City Selector**: Instant lookup with municipal guidelines for major metropolitan areas.
- **Depot Directory**: High-contrast interactive facility cards with category filters (Hazardous/E-Waste, Soft Plastics, Compost Hubs, Textiles).
- **Wishcycling Encyclopedia**: Accordion guide answering common consumer waste dilemmas (e.g., pizza boxes, hot coffee cups, styrofoam).

### 5. Taxonomy & Material Directory (`templates/classifications.html`)
- Searchable editorial index of polymer resin codes (#1 PET to #7 OTHER), standard scrap values in USD & INR, and circular upcycling alternatives.

### 6. Leaderboard & Dashboard (`templates/leaderboard.html` & `templates/dashboard.html`)
- Pristine citizen ledger with verified diversion records, streak badges, achievement unlocks, and personal CO₂ offset timeline.

---

## 6. Verification & Quality Gates
- **Unit Tests**: All 19 tests in `test_suite.py` must pass (`python test_suite.py`).
- **Static Asset Freezing**: `python freeze_site.py` must compile clean HTML without missing routes or broken assets into `public/`.
- **Responsive Audit**: Verified across 390px (Mobile), 768px (Tablet), and 1440px (Desktop).
- **Offline & Function Reliability**: Tested against Netlify serverless handlers with instant edge decomposition fallback.
