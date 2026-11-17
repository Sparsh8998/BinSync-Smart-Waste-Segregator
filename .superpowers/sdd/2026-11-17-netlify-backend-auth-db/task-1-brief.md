# Task 1 Brief: Package Scaffolding & Unified Database Adapter (`netlify/functions/lib/db.mjs`)

## Plan Reference
Plan: `docs/superpowers/plans/2026-11-17-netlify-backend-auth-db.md`
Spec: `docs/superpowers/specs/2026-11-17-netlify-backend-auth-db-design.md`

## What to Do
1. Update `package.json`:
   Add `@netlify/blobs` (e.g. `^8.1.0` or latest) and `pg` (e.g. `^8.13.0`) to `"dependencies"`.
   Run `npm install` to update `package-lock.json` and `node_modules`.
2. Create `netlify/functions/lib/db.mjs`:
   Implement the dual-driver persistent storage adapter:
   - Primary: PostgreSQL when `process.env.DATABASE_URL` or `process.env.NETLIFY_DB_URL` is set.
     - Lazy initialize `pg.Pool`.
     - Automatically execute `CREATE TABLE IF NOT EXISTS` for `users`, `scan_logs`, and `quest_claims`.
   - Fallback: Netlify Blobs (`@netlify/blobs`) store `binsync_db`.
     - When running in Netlify or with Blobs available, use `getStore('binsync_db')`.
     - When running locally without Netlify Blobs environment variables, provide a transparent fallback (e.g. local JSON file or memory store) so local development and tests never crash.
   - Implement the complete exported API:
     - `findUserByUsername(username)`: case-insensitive match, returns user object or null.
     - `findUserById(id)`: returns user object or null.
     - `createUser({ username, community_hub })`: creates user with id, badges="First Explorer, Newbie Recycler", 0 points, 0 total_recycled, 0 total_co2_saved, 0 current_streak.
     - `updateUser(id, updates)`: updates specified fields (points, total_recycled, total_co2_saved, current_streak, last_scan_date, community_hub, badges).
     - `createScanLog({ user_id, item_name, material, category, co2_saved, points_earned, disposal_steps })`: inserts scan record with unique id and timestamp.
     - `getUserScans(user_id, limit = 20)`: returns array of scans sorted by timestamp descending.
     - `deleteScan(user_id, scan_id)`: removes scan matching user_id and scan_id.
     - `getQuestClaims(user_id, date_str)`: returns array of claimed quest keys for the user on date_str (YYYY-MM-DD).
     - `createQuestClaim({ user_id, quest_key, claimed_date, points_awarded })`: records quest claim.
3. Test using a scratch script `netlify/functions/test_db_runner.mjs`:
   Run `node netlify/functions/test_db_runner.mjs`.
   Verify:
   - Creating a user `TestCitizen` returns a valid user record with ID.
   - Finding `testcitizen` (case-insensitive) returns the user.
   - Logging a scan works and `getUserScans` returns it.
   - Claiming a quest works and `getQuestClaims` returns it.
   - Deleting a scan works.
   Clean up `test_db_runner.mjs` before committing.
4. Commit:
   `git add package.json package-lock.json netlify/functions/lib/db.mjs`
   `git commit -m "feat(backend): implement persistent dual-driver database adapter for netlify"`
