# PRODUCT.md — BinSync

## Identity & Purpose
- **Product Name**: BinSync (Advanced Waste Intelligence)
- **Tagline**: Eradicate Wishcycling with Advanced Vision Intelligence
- **Core Mechanism**: Computer-vision powered multi-layer packaging decomposition using Google Gemini models, transforming user waste scans into actionable segregation directives and personal carbon diversion metrics.
- **Platform**: Web (Responsive desktop and mobile web PWA).

## Primary Audience & Use Context
1. **Conscientious Consumers & Citizens**: Sorting household waste at the point of disposal (kitchen, office, curb), frequently confused by multi-layer packaging (foil-lined cartons, coffee cups, blister packs, plastic films).
2. **Municipal Compliance & Eco-Advocates**: Seeking regional drop-off locations, understanding local municipal sorting rules, and engaging in habit formation through gamified metrics.

## Core Capabilities & Workflows
- **Visual Packaging Inspector**: Capture or upload packaging images to automatically isolate composite layers (e.g., plastic cap vs. cardboard sleeve vs. foil seal) with explicit destination bins.
- **Gamified Impact Engine**: Award eco-points for verified scans, dynamic RPG level tiering (*Seedling* to *Eco Legend*), daily recycling streaks, and milestone badges.
- **Ecological Equivalencies**: Translate grams of CO2 avoided into tangible real-world equivalents (smartphone full recharges, EV miles driven).
- **Regional Facilities & Map**: Search municipal depot facilities (E-waste, Soft plastics, Composting) by location and review regional sorting bylaws.
- **Material Taxonomy**: Structured searchable directory explaining composite vs. pure recyclables to educate against common "wishcycling" assumptions.

## Technical Stack & Constraints
- **Backend**: Python 3.11+, Flask, Flask-SQLAlchemy, Flask-Limiter, Pillow, `google-genai` SDK.
- **Database**: SQLite (`envirotech.db`).
- **Frontend**: Semantic HTML5, Jinja2 template inheritance, Tailwind CSS with customized design tokens, Geist typography, Material Symbols.
- **Environment**: Lightweight zero-build setup without Node compilation pipeline, compatible with serverless/container deployment.

