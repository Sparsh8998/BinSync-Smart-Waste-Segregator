# Task 4 Brief: Connect Classifier to Persistent Database (`netlify/functions/classify.mjs`)

## Plan Reference
Plan: `docs/superpowers/plans/2026-11-17-netlify-backend-auth-db.md`
Spec: `docs/superpowers/specs/2026-11-17-netlify-backend-auth-db-design.md`

## What to Do
1. Update `netlify/functions/classify.mjs`:
   - Import `db` from `./lib/db.mjs`.
   - Add authentication extractor supporting:
     - `Authorization: Bearer <token>`
     - `x-citizen-token` header
     - Cookie `binsync_session`
     - Body `token` or `user_id`
   - Implement helper `async function persistScanForCitizen(user, result)`:
     - If `user` is present:
       - Today = `new Date().toISOString().slice(0, 10)`
       - Yesterday = `new Date(Date.now() - 86400000).toISOString().slice(0, 10)`
       - Compute `new_streak`:
         - if `user.last_scan_date === today`: keep `user.current_streak || 1`
         - else if `user.last_scan_date === yesterday`: `(user.current_streak || 0) + 1`
         - else: `1`
       - Compute `new_points = (user.points || 0) + (result.points_earned || 20)`
       - Compute `new_recycled = (user.total_recycled || 0) + 1`
       - Compute `new_co2 = Number(((user.total_co2_saved || 0) + (result.co2_saved_grams || 40) / 1000.0).toFixed(3))`
       - Call `const scan = await db.createScanLog({ user_id: user.id, item_name: result.item_name, material: result.material, category: result.category, co2_saved: result.co2_saved_grams, points_earned: result.points_earned, disposal_steps: JSON.stringify(result.components || []) })`
       - Call `await db.updateUser(user.id, { points: new_points, total_recycled: new_recycled, total_co2_saved: new_co2, current_streak: new_streak, last_scan_date: today })`
       - If `scan?.id`, set `result.scan_id = scan.id`
       - Attach `result.citizen_stats = { user_id: user.id, username: user.username, points: new_points, total_recycled: new_recycled, total_co2_saved: new_co2, current_streak: new_streak, last_scan_date: today }`
     - Return `result`.
   - In all branches that return a classification payload (mock sample branch, Gemini AI branch, fallback branch, error catch branch), pass the payload through `persistScanForCitizen(user, payload)` before serializing to JSON.
   - Update CORS headers to support origin reflection and `Access-Control-Allow-Credentials: true`.

2. Test with a scratch script `netlify/functions/test_classify_db_runner.mjs`:
   - Create a test user via `db.createUser`.
   - Issue a request to `classifyHandler` with the user's token.
   - Verify that `citizen_stats` is returned with updated points and scan_id.
   - Verify that `db.getUserScans(user.id)` returns the newly created scan.
   - Remove scratch runner.
   - Run `python test_suite.py` (19/19 OK).

3. Commit:
   `git add netlify/functions/classify.mjs`
   `git commit -m "feat(backend): link packaging classifier to persistent citizen database"`
