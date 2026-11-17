# Task 2 Brief: Serverless Authentication & User Endpoints (`netlify/functions/auth.mjs`)

## Plan Reference
Plan: `docs/superpowers/plans/2026-11-17-netlify-backend-auth-db.md`
Spec: `docs/superpowers/specs/2026-11-17-netlify-backend-auth-db-design.md`

## What to Do
1. Create `netlify/functions/auth.mjs`:
   Import `db` from `./lib/db.mjs`.
   Implement request router supporting CORS (`OPTIONS` returning 204 with CORS headers):
   - `POST /api/auth/login`:
     - Accepts JSON `{ username, community_hub }` (also handle form urlencoded if submitted).
     - Trim handle. If empty, return status 400 with `{ ok: false, error: "Username is required" }`.
     - Call `db.findUserByUsername(username)`.
     - If user exists: update community_hub if provided (`db.updateUser(user.id, { community_hub })`).
     - If user does not exist: call `db.createUser({ username, community_hub: community_hub || "Global Network" })`.
     - Generate a session token (e.g. `Buffer.from(JSON.stringify({ id: user.id, username: user.username, ts: Date.now() })).toString('base64url')`).
     - Set response cookie: `Set-Cookie: binsync_session=${token}; Path=/; SameSite=Lax; Max-Age=2592000` (add Secure in production).
     - Return status 200 with JSON `{ ok: true, user, token }`.
   - `GET /api/auth/me`:
     - Extract token from `Authorization: Bearer <token>`, `?token=...`, or `Cookie: binsync_session=...`.
     - If token found, decode citizen ID/username and fetch user via `db.findUserById(decoded.id)` or `db.findUserByUsername(decoded.username)`.
     - If user found: return status 200 with `{ ok: true, authenticated: true, user }`.
     - If not: return status 200 with `{ ok: true, authenticated: false, user: null }`.
   - `POST /api/auth/logout`:
     - Clear cookie: `Set-Cookie: binsync_session=; Path=/; SameSite=Lax; Max-Age=0`.
     - Return status 200 with `{ ok: true, message: "Logged out successfully" }`.
   - Export config:
     ```javascript
     export const config = {
       path: ["/api/auth", "/api/auth/*", "/.netlify/functions/auth"]
     };
     ```

2. Update routing in `netlify.toml` and `public/_redirects`:
   - In `netlify.toml`:
     ```toml
     [[redirects]]
       from = "/api/auth"
       to = "/.netlify/functions/auth"
       status = 200

     [[redirects]]
       from = "/api/auth/*"
       to = "/.netlify/functions/auth"
       status = 200
     ```
   - In `public/_redirects`:
     ```
     /api/auth          /.netlify/functions/auth     200
     /api/auth/*        /.netlify/functions/auth     200
     ```

3. Test with a scratch script `netlify/functions/test_auth_runner.mjs`:
   Test `login` handler with a mock request, verify cookie and returned user.
   Test `me` handler with the generated token, verify authenticated response.
   Test `logout` handler, verify cookie clearing.
   Remove scratch runner.
   Run `python test_suite.py` to ensure local tests pass.

4. Commit:
   `git add netlify/functions/auth.mjs netlify.toml public/_redirects`
   `git commit -m "feat(backend): add serverless citizen authentication endpoint"`
