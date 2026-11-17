import { getStore } from '@netlify/blobs';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

// ============================================================================
// Driver Detection & State
// ============================================================================

function shouldUsePostgres() {
  return Boolean(process.env.DATABASE_URL || process.env.NETLIFY_DB_URL);
}

// ============================================================================
// Local Fallback KV Store (for local dev & test environments)
// ============================================================================

class LocalKVStore {
  constructor() {
    this.memory = new Map();
    this.filePath = path.resolve(process.cwd(), '.netlify', 'local_binsync_store.json');
    this.loadFromFile();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        for (const [key, val] of Object.entries(data)) {
          this.memory.set(key, val);
        }
      }
    } catch {
      // Gracefully ignore local read errors, keep memory store
    }
  }

  saveToFile() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Object.fromEntries(this.memory.entries());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Gracefully ignore local write errors, memory persists for process duration
    }
  }

  async get(key, _options) {
    if (!this.memory.has(key)) return null;
    const item = this.memory.get(key);
    return JSON.parse(JSON.stringify(item));
  }

  async setJSON(key, value) {
    this.memory.set(key, JSON.parse(JSON.stringify(value)));
    this.saveToFile();
    return { modified: true };
  }

  async delete(key) {
    const deleted = this.memory.delete(key);
    if (deleted) this.saveToFile();
    return undefined;
  }
}

// ============================================================================
// Netlify Blobs Handle Manager
// ============================================================================

let cachedKVStore = null;

function getKVStore() {
  if (cachedKVStore) return cachedKVStore;

  try {
    // Attempt standard Netlify Blobs store initialization
    const store = getStore({ name: 'binsync_db', consistency: 'strong' });
    cachedKVStore = store;
    return cachedKVStore;
  } catch {
    // Netlify Blobs environment credentials not present (local dev / offline test)
    cachedKVStore = new LocalKVStore();
    return cachedKVStore;
  }
}

// ============================================================================
// Normalizers
// ============================================================================

function normalizeUser(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    username: String(row.username),
    total_recycled: Number(row.total_recycled || 0),
    points: Number(row.points || 0),
    total_co2_saved: Number(row.total_co2_saved || 0.0),
    current_streak: Number(row.current_streak || 0),
    last_scan_date: row.last_scan_date ? String(row.last_scan_date) : null,
    badges: row.badges || "First Explorer, Newbie Recycler",
    community_hub: row.community_hub || "Downtown Metro",
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at ? String(row.created_at) : new Date().toISOString())
  };
}

function normalizeScan(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    item_name: String(row.item_name),
    material: String(row.material),
    category: String(row.category),
    co2_saved: Number(row.co2_saved || 0.0),
    points_earned: Number(row.points_earned || 0),
    disposal_steps: typeof row.disposal_steps === 'string' ? row.disposal_steps : JSON.stringify(row.disposal_steps || []),
    brand_name: row.brand_name || "Generic / Unbranded",
    recyclability_grade: row.recyclability_grade || "C",
    estimated_weight_g: Number(row.estimated_weight_g || 15.0),
    scrap_value_usd: Number(row.scrap_value_usd || 0.02),
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : (row.timestamp ? String(row.timestamp) : new Date().toISOString())
  };
}

function normalizeQuestClaim(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    quest_key: String(row.quest_key),
    claimed_date: String(row.claimed_date),
    points_awarded: Number(row.points_awarded || 0),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at ? String(row.created_at) : new Date().toISOString())
  };
}

// ============================================================================
// PostgreSQL Engine
// ============================================================================

let pgPool = null;
let tablesCreatedPromise = null;

function getPgPool() {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });
  }
  return pgPool;
}

async function ensurePgTables() {
  if (tablesCreatedPromise) return tablesCreatedPromise;

  tablesCreatedPromise = (async () => {
    const pool = getPgPool();
    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        total_recycled INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        total_co2_saved DOUBLE PRECISION DEFAULT 0.0,
        current_streak INTEGER DEFAULT 0,
        last_scan_date VARCHAR(20),
        badges TEXT DEFAULT 'First Explorer, Newbie Recycler',
        community_hub VARCHAR(100) DEFAULT 'Downtown Metro',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        material VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        co2_saved DOUBLE PRECISION DEFAULT 0.0,
        points_earned INTEGER DEFAULT 0,
        disposal_steps TEXT DEFAULT '[]',
        brand_name VARCHAR(100) DEFAULT 'Generic / Unbranded',
        recyclability_grade VARCHAR(20) DEFAULT 'C',
        estimated_weight_g DOUBLE PRECISION DEFAULT 15.0,
        scrap_value_usd DOUBLE PRECISION DEFAULT 0.02,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_scan_logs_user_ts ON scan_logs (user_id, timestamp DESC);

      CREATE TABLE IF NOT EXISTS quest_claims (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        quest_key VARCHAR(100) NOT NULL,
        claimed_date VARCHAR(20) NOT NULL,
        points_awarded INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_quest_claims_user_date ON quest_claims (user_id, claimed_date);
    `;
    await pool.query(ddl);
  })();

  return tablesCreatedPromise;
}

// ============================================================================
// Unified Storage Adapter Interface
// ============================================================================

/**
 * Look up a citizen by case-insensitive username.
 * @param {string} username
 * @returns {Promise<object|null>}
 */
export async function findUserByUsername(username) {
  if (!username) return null;
  const cleanUsername = String(username).trim();

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
      [cleanUsername]
    );
    return res.rows[0] ? normalizeUser(res.rows[0]) : null;
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const userId = await kv.get(`user_by_username:${cleanUsername.toLowerCase()}`, { type: 'json' });
  if (!userId) return null;
  return await findUserById(userId);
}

/**
 * Look up a citizen by ID.
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
export async function findUserById(id) {
  if (!id) return null;
  const cleanId = String(id);

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [cleanId]
    );
    return res.rows[0] ? normalizeUser(res.rows[0]) : null;
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const user = await kv.get(`user:${cleanId}`, { type: 'json' });
  return user ? normalizeUser(user) : null;
}

/**
 * Create a new citizen account.
 * @param {{ username: string, community_hub?: string }} params
 * @returns {Promise<object>}
 */
export async function createUser({ username, community_hub }) {
  if (!username) throw new Error('Username is required to create a citizen account.');
  const cleanUsername = String(username).trim();

  // Return existing user if handle already taken (idempotent provision)
  const existing = await findUserByUsername(cleanUsername);
  if (existing) {
    return existing;
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const badges = 'First Explorer, Newbie Recycler';
  const hub = (community_hub && String(community_hub).trim()) || 'Downtown Metro';
  const createdAt = new Date().toISOString();

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      `INSERT INTO users 
       (id, username, total_recycled, points, total_co2_saved, current_streak, last_scan_date, badges, community_hub, created_at)
       VALUES ($1, $2, 0, 0, 0.0, 0, NULL, $3, $4, NOW())
       RETURNING *`,
      [id, cleanUsername, badges, hub]
    );
    return normalizeUser(res.rows[0]);
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const user = {
    id,
    username: cleanUsername,
    total_recycled: 0,
    points: 0,
    total_co2_saved: 0.0,
    current_streak: 0,
    last_scan_date: null,
    badges,
    community_hub: hub,
    created_at: createdAt
  };

  await kv.setJSON(`user:${id}`, user);
  await kv.setJSON(`user_by_username:${cleanUsername.toLowerCase()}`, id);
  return normalizeUser(user);
}

/**
 * Update citizen profile fields.
 * @param {string|number} id
 * @param {object} updates
 * @returns {Promise<object|null>}
 */
export async function updateUser(id, updates = {}) {
  if (!id) return null;
  const cleanId = String(id);

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.points !== undefined) {
      fields.push(`points = $${idx++}`);
      values.push(Number(updates.points));
    }
    if (updates.total_recycled !== undefined) {
      fields.push(`total_recycled = $${idx++}`);
      values.push(Number(updates.total_recycled));
    }
    if (updates.total_co2_saved !== undefined) {
      fields.push(`total_co2_saved = $${idx++}`);
      values.push(Number(updates.total_co2_saved));
    }
    if (updates.current_streak !== undefined) {
      fields.push(`current_streak = $${idx++}`);
      values.push(Number(updates.current_streak));
    }
    if (updates.last_scan_date !== undefined) {
      fields.push(`last_scan_date = $${idx++}`);
      values.push(updates.last_scan_date ? String(updates.last_scan_date) : null);
    }
    if (updates.community_hub !== undefined) {
      fields.push(`community_hub = $${idx++}`);
      values.push(String(updates.community_hub));
    }
    if (updates.badges !== undefined) {
      fields.push(`badges = $${idx++}`);
      values.push(String(updates.badges));
    }
    if (updates.username !== undefined) {
      fields.push(`username = $${idx++}`);
      values.push(String(updates.username).trim());
    }

    if (fields.length === 0) {
      return await findUserById(cleanId);
    }

    values.push(cleanId);
    const pool = getPgPool();
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0] ? normalizeUser(res.rows[0]) : null;
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const user = await kv.get(`user:${cleanId}`, { type: 'json' });
  if (!user) return null;

  if (updates.points !== undefined) user.points = Number(updates.points);
  if (updates.total_recycled !== undefined) user.total_recycled = Number(updates.total_recycled);
  if (updates.total_co2_saved !== undefined) user.total_co2_saved = Number(updates.total_co2_saved);
  if (updates.current_streak !== undefined) user.current_streak = Number(updates.current_streak);
  if (updates.last_scan_date !== undefined) user.last_scan_date = updates.last_scan_date ? String(updates.last_scan_date) : null;
  if (updates.community_hub !== undefined) user.community_hub = String(updates.community_hub);
  if (updates.badges !== undefined) user.badges = String(updates.badges);

  if (updates.username !== undefined && updates.username.trim() !== user.username) {
    const oldUsernameLower = user.username.toLowerCase();
    user.username = updates.username.trim();
    await kv.delete(`user_by_username:${oldUsernameLower}`);
    await kv.setJSON(`user_by_username:${user.username.toLowerCase()}`, cleanId);
  }

  await kv.setJSON(`user:${cleanId}`, user);
  return normalizeUser(user);
}

/**
 * Log a packaging scan inspection.
 * @param {object} scanData
 * @returns {Promise<object>}
 */
export async function createScanLog({
  user_id,
  item_name,
  material,
  category,
  co2_saved = 0.0,
  points_earned = 0,
  disposal_steps = '[]',
  brand_name = 'Generic / Unbranded',
  recyclability_grade = 'C',
  estimated_weight_g = 15.0,
  scrap_value_usd = 0.02
}) {
  if (!user_id) throw new Error('user_id is required for scan logging.');
  const scan_id = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const stepsStr = typeof disposal_steps === 'string' ? disposal_steps : JSON.stringify(disposal_steps || []);

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      `INSERT INTO scan_logs 
       (id, user_id, item_name, material, category, co2_saved, points_earned, disposal_steps, brand_name, recyclability_grade, estimated_weight_g, scrap_value_usd, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [
        scan_id,
        String(user_id),
        String(item_name || 'Packaging Item'),
        String(material || 'Mixed Material'),
        String(category || 'Recyclable'),
        Number(co2_saved) || 0.0,
        Number(points_earned) || 0,
        stepsStr,
        String(brand_name),
        String(recyclability_grade),
        Number(estimated_weight_g) || 15.0,
        Number(scrap_value_usd) || 0.02
      ]
    );
    return normalizeScan(res.rows[0]);
  }

  // Netlify Blobs / KV Fallback
  const scanRecord = {
    id: scan_id,
    user_id: String(user_id),
    item_name: String(item_name || 'Packaging Item'),
    material: String(material || 'Mixed Material'),
    category: String(category || 'Recyclable'),
    co2_saved: Number(co2_saved) || 0.0,
    points_earned: Number(points_earned) || 0,
    disposal_steps: stepsStr,
    brand_name: String(brand_name),
    recyclability_grade: String(recyclability_grade),
    estimated_weight_g: Number(estimated_weight_g) || 15.0,
    scrap_value_usd: Number(scrap_value_usd) || 0.02,
    timestamp: new Date().toISOString()
  };

  const kv = getKVStore();
  const userScans = (await kv.get(`scans:${user_id}`, { type: 'json' })) || [];
  userScans.unshift(scanRecord);
  // Cap at 100 historical scans per user for blob optimization
  if (userScans.length > 100) {
    userScans.length = 100;
  }
  await kv.setJSON(`scans:${user_id}`, userScans);

  return normalizeScan(scanRecord);
}

/**
 * Retrieve recent scan logs for a citizen.
 * @param {string|number} user_id
 * @param {number} limit
 * @returns {Promise<Array<object>>}
 */
export async function getUserScans(user_id, limit = 20) {
  if (!user_id) return [];
  const cleanUserId = String(user_id);
  const maxLimit = Math.max(1, Number(limit) || 20);

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT * FROM scan_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [cleanUserId, maxLimit]
    );
    return res.rows.map(normalizeScan);
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const userScans = (await kv.get(`scans:${cleanUserId}`, { type: 'json' })) || [];
  return userScans.slice(0, maxLimit).map(normalizeScan);
}

/**
 * Remove a specific scan log.
 * @param {string|number} user_id
 * @param {string} scan_id
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteScan(user_id, scan_id) {
  if (!user_id || !scan_id) return { success: false };
  const cleanUserId = String(user_id);
  const cleanScanId = String(scan_id);

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    await pool.query(
      'DELETE FROM scan_logs WHERE user_id = $1 AND id = $2',
      [cleanUserId, cleanScanId]
    );
    return { success: true };
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const userScans = (await kv.get(`scans:${cleanUserId}`, { type: 'json' })) || [];
  const filtered = userScans.filter((s) => s.id !== cleanScanId);
  await kv.setJSON(`scans:${cleanUserId}`, filtered);
  return { success: true };
}

/**
 * Get claimed quest keys for a citizen on a specific date.
 * @param {string|number} user_id
 * @param {string} date_str Format YYYY-MM-DD
 * @returns {Promise<Array<string>>}
 */
export async function getQuestClaims(user_id, date_str) {
  if (!user_id || !date_str) return [];
  const cleanUserId = String(user_id);
  const cleanDate = String(date_str);

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      'SELECT quest_key FROM quest_claims WHERE user_id = $1 AND claimed_date = $2',
      [cleanUserId, cleanDate]
    );
    return res.rows.map((r) => String(r.quest_key));
  }

  // Netlify Blobs / KV Fallback
  const kv = getKVStore();
  const claims = (await kv.get(`quest_claims:${cleanUserId}:${cleanDate}`, { type: 'json' })) || [];
  return claims.map((c) => String(c.quest_key));
}

/**
 * Record a completed quest claim.
 * @param {{ user_id: string|number, quest_key: string, claimed_date: string, points_awarded: number }} claimData
 * @returns {Promise<object>}
 */
export async function createQuestClaim({ user_id, quest_key, claimed_date, points_awarded }) {
  if (!user_id || !quest_key || !claimed_date) {
    throw new Error('user_id, quest_key, and claimed_date are required for quest claim.');
  }
  const cleanUserId = String(user_id);
  const claim_id = `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const points = Number(points_awarded) || 0;

  if (shouldUsePostgres()) {
    await ensurePgTables();
    const pool = getPgPool();
    const res = await pool.query(
      `INSERT INTO quest_claims (id, user_id, quest_key, claimed_date, points_awarded, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [claim_id, cleanUserId, String(quest_key), String(claimed_date), points]
    );
    return normalizeQuestClaim(res.rows[0]);
  }

  // Netlify Blobs / KV Fallback
  const claimRecord = {
    id: claim_id,
    user_id: cleanUserId,
    quest_key: String(quest_key),
    claimed_date: String(claimed_date),
    points_awarded: points,
    created_at: new Date().toISOString()
  };

  const kv = getKVStore();
  const claims = (await kv.get(`quest_claims:${cleanUserId}:${claimed_date}`, { type: 'json' })) || [];
  claims.push(claimRecord);
  await kv.setJSON(`quest_claims:${cleanUserId}:${claimed_date}`, claims);

  return normalizeQuestClaim(claimRecord);
}

// Default export containing all methods for flexible ES module consumption
export default {
  findUserByUsername,
  findUserById,
  createUser,
  updateUser,
  createScanLog,
  getUserScans,
  deleteScan,
  getQuestClaims,
  createQuestClaim
};
