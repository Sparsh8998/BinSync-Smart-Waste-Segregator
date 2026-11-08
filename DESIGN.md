# DESIGN.md — BinSync Design System

## Visual World: Nordic Glacier Climate Tech
BinSync adopts a high-precision **Nordic Glacier Climate Tech** visual identity inspired by modern carbon accounting and environmental intelligence systems (Watershed, Normative, and Scandinavian clean technology). It replaces conventional green aesthetics with crystalline ice-whites, deep obsidian slate, precision electric cobalt, and warm solar amber accents.

### Core Philosophy
1. **Precision & Objectivity**: Modern, clean, and free of greenwashing or heavy visual sludge. High legibility and crisp geometry communicate trustworthy, verified circular metrics.
2. **Direct Action First Viewport**: An immediate central AI scanner and dropzone inspired by clean utility search interfaces, complete with one-click demo presets.
3. **No Kicker/Eyebrow Pollution**: Headings carry their own typographic authority without decorative uppercase eyebrow pill badges floating above them.
4. **Crisp Glacier Elevation**: Neutral, subtle elevation shadows (`0 2px 8px -2px rgba(0, 0, 0, 0.04)`) replace colored glow halos or harsh neobrutalist borders.

---

## Color Palette Tokens

### Brand Core
- **Electric Precision Cobalt (`#2563EB`)**:
  - RGB: `37, 99, 235`
  - Role: Primary brand action color, primary CTA buttons (`.btn-primary`), key indicators, active navigation tabs.
- **Deep Royal Cobalt (`#1D4ED8`)**:
  - RGB: `29, 78, 216`
  - Role: Primary button hover states, high-emphasis active elements.
- **Ice Blue Tint (`#EFF6FF`)**:
  - RGB: `239, 246, 255`
  - Role: Subtle pill backgrounds, active tab highlights, crystalline icon containers.
- **Solar Amber Gold (`#F59E0B` / `#D97706`)**:
  - RGB: `245, 158, 11`
  - Role: Streaks, fire indicators, milestone badges, secondary CTA (`.btn-solar`).

### Surfaces & Grounds
- **Glacier Ice-White Canvas (`#F8FAFC` / Slate-50)**:
  - Role: Clean, airy page ground with subtle cool crystalline temperature.
- **Pristine Card White (`#FFFFFF`)**:
  - Role: Floating card surfaces (`.eco-card`), workstation panels, inputs.
- **Ice Slate Inset (`#F1F5F9` / Slate-100)**:
  - Role: Demo presets, table headers, secondary surfaces.
- **Glacier Border Line (`#E2E8F0` / Slate-200 & `#CBD5E1` / Slate-300)**:
  - Role: Soft dividing lines, input borders, card outlines.
- **Obsidian Slate Footer (`#0B1120` / `#0F172A`)**:
  - Role: Deep high-contrast dark footer and dark status badges.

### Typography Colors
- **Obsidian Graphite (`#0F172A` / Slate-900)**:
  - Role: Headlines, titles, and high-impact numerals. 15:1 contrast against `#F8FAFC`.
- **Cool Charcoal Slate (`#334155` / Slate-700)**:
  - Role: Body paragraphs, secondary descriptions.
- **Glacier Muted Slate (`#64748B` / Slate-500)**:
  - Role: Captions, helper text, timestamps.

### Municipal Waste Streams
- **Recyclable (Curbside Blue)**: Text `#0284C7` · Ground `#F0F9FF` · Border `#BAE6FD`
- **Compost (Glacier Teal)**: Text `#0D9488` · Ground `#F0FDFA` · Border `#99F6E4`
- **Landfill (Managed Slate)**: Text `#475569` · Ground `#F8FAFC` · Border `#E2E8F0`
- **Specialty / Drop-off (Solar Amber)**: Text `#D97706` · Ground `#FFFBEB` · Border `#FDE68A`

---

## Typography Hierarchy
- **Primary Stack**: `Geist`, `Inter`, `-apple-system`, `sans-serif`
- **Headlines**: Black/heavy weights (`font-black`), tracking tight (`tracking-tight`), leading `1.08` to `1.15`.
- **Body**: Regular and medium weights (`font-normal`, `font-medium`), comfortable leading for fast scanning.
- **Monospace**: `ui-monospace`, `Menlo`, `monospace` for grams of CO₂, percentages, and citizen IDs.

---

## Reusable Utility Classes
- `.eco-card`: Clean white container with `#E2E8F0` border, `rounded-2xl` or `rounded-3xl`, and neutral elevation shadow.
- `.btn-primary`: Electric Precision Cobalt rounded pill with soft tactile lift on hover.
- `.btn-secondary`: Crisp white rounded pill with slate border and hover state.
- `.btn-solar`: Solar Amber button for energetic calls to action.
