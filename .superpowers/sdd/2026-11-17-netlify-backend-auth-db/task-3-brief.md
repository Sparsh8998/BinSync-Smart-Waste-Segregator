# Task 3 Brief: Serverless Dashboard & Quest Endpoints (`netlify/functions/dashboard.mjs`, `scan.mjs`)

## Plan Reference
Plan: `docs/superpowers/plans/2026-11-17-netlify-backend-auth-db.md`
Spec: `docs/superpowers/specs/2026-11-17-netlify-backend-auth-db-design.md`

## What to Do
1. Create `netlify/functions/dashboard.mjs`:
   Import `db` from `./lib/db.mjs`.
   Implement request router supporting CORS:
   - Helper to extract and decode citizen token from `Authorization: Bearer <token>`, `?token=...`, or `binsync_session` cookie. If not provided or user not found, return 401 `{ ok: false, error: "Authentication required" }`.
   - `GET /api/dashboard/stats`:
     - Load fresh user via `db.findUserById(user.id)`.
     - Calculate RPG Level info:
       - `points < 100`: `{ title: "Seedling", next_tier: 100, progress_pct: Math.min(100, (points / 100) * 100) }`
       - `points < 300`: `{ title: "Sprout", next_tier: 300, progress_pct: Math.min(100, ((points - 100) / 200) * 100) }`
       - `points < 1000`: `{ title: "Forest Guardian", next_tier: 1000, progress_pct: Math.min(100, ((points - 300) / 700) * 100) }`
       - Else: `{ title: "Eco Legend", next_tier: points, progress_pct: 100 }`
     - Calculate stats:
       - `smartphone_charges`: `Math.floor((user.total_co2_saved || 0) / 8.22)`
       - `ev_miles`: `Number(((user.total_co2_saved || 0) / 150.0).toFixed(1))`
     - Fetch recent scans: `await db.getUserScans(user.id, 20)`.
     - Parse `disposal_steps` JSON into `parsed_components` for each scan.
     - Calculate category counts:
       - `Recyclable`: count where `category === "Recyclable"`
       - `Compostable`: count where `category === "Compostable"`
       - `Landfill`: count where `category === "Landfill"`
     - Calculate dynamic daily quests for today (date in `YYYY-MM-DD` UTC):
       - `claimed_keys = await db.getQuestClaims(user.id, today_str)` (as Set or Array)
       - `scanned_today = recent_scans.some(s => (s.timestamp || "").startsWith(today_str))`
       - `diverted_today = recent_scans.some(s => (s.timestamp || "").startsWith(today_str) && (s.category === "Recyclable" || s.category === "Compostable"))`
       - Quests list:
         1. `{ id: 1, key: "daily_scan", title: "Daily Citizen Scan", desc: "Inspect at least 1 packaging item today", reward_points: 25, completed: scanned_today, claimed: claimed_keys.includes("daily_scan") }`
         2. `{ id: 2, key: "diversion_hero", title: "Diversion Hero", desc: "Sort a recyclable or compostable item away from landfill", reward_points: 35, completed: diverted_today, claimed: claimed_keys.includes("diversion_hero") }`
         3. `{ id: 3, key: "zero_wishcycle", title: "Zero Wishcycle", desc: "Read municipal rules and verify a packaging composite", reward_points: 20, completed: true, claimed: claimed_keys.includes("zero_wishcycle") }`
     - Return status 200 with JSON:
       `{ ok: true, user, level_info, stats: { smartphone_charges, ev_miles }, recent_scans, category_counts, daily_quests }`

   - `POST /api/claim_quest` (and `/api/dashboard/claim_quest`):
     - Body: `{ quest_key }`
     - Check if already claimed today (`db.getQuestClaims(user.id, today_str)`). If claimed, return 400 `{ ok: false, error: "Quest already claimed today" }`.
     - Award points: `daily_scan`: 25, `diversion_hero`: 35, `zero_wishcycle`: 20.
     - Call `await db.createQuestClaim({ user_id: user.id, quest_key, claimed_date: today_str, points_awarded })`.
     - Call `await db.updateUser(user.id, { points: (user.points || 0) + points_awarded })`.
     - Return status 200 with `{ ok: true, points_awarded, new_points: (user.points || 0) + points_awarded, quest_key }`.

   - `POST /api/update_hub` (and `/api/dashboard/update_hub`):
     - Body: `{ community_hub }`
     - Call `await db.updateUser(user.id, { community_hub })`.
     - Return status 200 with `{ ok: true, community_hub }`.

   - Export config:
     ```javascript
     export const config = {
       path: ["/api/dashboard", "/api/dashboard/*", "/api/claim_quest", "/api/update_hub", "/.netlify/functions/dashboard"]
     };
     ```

2. Update `netlify/functions/scan.mjs`:
   - Inspect existing `scan.mjs`.
   - Wire `DELETE /api/scan/:id`:
     - Extract citizen token.
     - Extract `scan_id` from URL.
     - Call `await db.deleteScan(user.id, scan_id)`.
     - Return status 200 with `{ ok: true, scan_id }`.

3. Update routing in `netlify.toml` and `public/_redirects`:
   - In `netlify.toml`:
     ```toml
     [[redirects]]
       from = "/api/dashboard"
       to = "/.netlify/functions/dashboard"
       status = 200

     [[redirects]]
       from = "/api/dashboard/*"
       to = "/.netlify/functions/dashboard"
       status = 200

     [[redirects]]
       from = "/api/claim_quest"
       to = "/.netlify/functions/dashboard"
       status = 200

     [[redirects]]
       from = "/api/update_hub"
       to = "/.netlify/functions/dashboard"
       status = 200
     ```
   - In `public/_redirects`:
     ```
     /api/dashboard     /.netlify/functions/dashboard 200
     /api/dashboard/*   /.netlify/functions/dashboard 200
     /api/claim_quest   /.netlify/functions/dashboard 200
     /api/update_hub    /.netlify/functions/dashboard 200
     ```

4. Test with a scratch script `netlify/functions/test_dashboard_runner.mjs`:
   - Test getting stats for a user with mock token.
   - Test claiming a quest and verifying point increments.
   - Test updating hub.
   - Test deleting a scan via `scan.mjs`.
   - Remove scratch runner.
   - Run `python test_suite.py` to ensure local tests pass (19/19 OK).

5. Commit:
   `git add netlify/functions/dashboard.mjs netlify/functions/scan.mjs netlify.toml public/_redirects`
   `git commit -m "feat(backend): implement dashboard stats, quest claims, and scan deletion serverless endpoints"`

