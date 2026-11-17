import db from './lib/db.mjs';

function getCorsHeaders(req) {
  const origin = req.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-citizen-token',
    'Content-Type': 'application/json'
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  return headers;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

function decodeSessionToken(token) {
  if (!token) return null;
  try {
    const json = Buffer.from(token, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    try {
      const json = Buffer.from(token, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}

async function parseRequestBody(req) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await req.json();
    } catch {
      return {};
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const formData = await req.formData();
      return Object.fromEntries(formData.entries());
    } catch {
      return {};
    }
  }
  try {
    const text = await req.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      const params = new URLSearchParams(text);
      return Object.fromEntries(params.entries());
    }
  } catch {
    return {};
  }
}

async function getAuthenticatedUser(req, body = {}) {
  const url = new URL(req.url);
  let token = '';

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Query param ?token=... or x-citizen-token header or body.token
  if (!token) {
    token = url.searchParams.get('token') || req.headers.get('x-citizen-token') || body.token || '';
  }

  // 3. Cookie binsync_session=...
  if (!token) {
    const cookies = parseCookies(req.headers.get('cookie'));
    token = cookies['binsync_session'] || '';
  }

  if (!token) return null;

  const decoded = decodeSessionToken(token);
  let user = null;
  if (decoded && decoded.id) {
    user = await db.findUserById(decoded.id);
  }
  if (!user && decoded && decoded.username) {
    user = await db.findUserByUsername(decoded.username);
  }
  // Support raw token as user ID e.g. "user_..." or numeric ID
  if (!user && typeof token === 'string' && (token.startsWith('user_') || /^\d+$/.test(token))) {
    user = await db.findUserById(token);
  }
  // Support raw username if token isn't decoded JSON
  if (!user && typeof token === 'string' && !token.includes('{') && token.length < 50) {
    user = await db.findUserByUsername(token);
  }

  return user;
}

const QUEST_REWARDS = {
  daily_scan: 25,
  diversion_hero: 35,
  zero_wishcycle: 20
};

export default async (req, context) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const actionParam = url.searchParams.get('action') || '';
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';

    let body = {};
    if (req.method === 'POST') {
      body = await parseRequestBody(req);
    }

    // Determine target route
    let route = '';
    if (
      pathname.includes('/claim_quest') ||
      lastSegment === 'claim_quest' ||
      actionParam === 'claim_quest' ||
      body.action === 'claim_quest'
    ) {
      route = 'claim_quest';
    } else if (
      pathname.includes('/update_hub') ||
      lastSegment === 'update_hub' ||
      actionParam === 'update_hub' ||
      body.action === 'update_hub'
    ) {
      route = 'update_hub';
    } else if (
      pathname.includes('/stats') ||
      lastSegment === 'stats' ||
      actionParam === 'stats' ||
      pathname === '/api/dashboard' ||
      lastSegment === 'dashboard'
    ) {
      route = 'stats';
    } else if (body.quest_key) {
      route = 'claim_quest';
    } else if (body.community_hub) {
      route = 'update_hub';
    } else if (req.method === 'GET') {
      route = 'stats';
    }

    // Citizen authentication is required for all dashboard actions
    const authUser = await getAuthenticatedUser(req, body);
    if (!authUser) {
      return new Response(JSON.stringify({ ok: false, error: 'Authentication required' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Fetch fresh user record
    const user = (await db.findUserById(authUser.id)) || authUser;

    // ------------------------------------------------------------------------
    // Route: GET /api/dashboard/stats
    // ------------------------------------------------------------------------
    if (route === 'stats') {
      const points = Number(user.points || 0);
      let level_info;
      if (points < 100) {
        level_info = {
          title: 'Seedling',
          next_tier: 100,
          progress_pct: Math.min(100, Math.max(0, Number(((points / 100) * 100).toFixed(1))))
        };
      } else if (points < 300) {
        level_info = {
          title: 'Sprout',
          next_tier: 300,
          progress_pct: Math.min(100, Math.max(0, Number((((points - 100) / 200) * 100).toFixed(1))))
        };
      } else if (points < 1000) {
        level_info = {
          title: 'Forest Guardian',
          next_tier: 1000,
          progress_pct: Math.min(100, Math.max(0, Number((((points - 300) / 700) * 100).toFixed(1))))
        };
      } else {
        level_info = {
          title: 'Eco Legend',
          next_tier: points,
          progress_pct: 100
        };
      }

      const totalCo2 = Number(user.total_co2_saved || 0);
      const smartphone_charges = Math.floor(totalCo2 / 8.22);
      const ev_miles = Number((totalCo2 / 150.0).toFixed(1));

      // Fetch recent scans (up to 20)
      const rawScans = await db.getUserScans(user.id, 20);
      const recent_scans = (rawScans || []).map((scan) => {
        let parsed_components = [];
        try {
          parsed_components = typeof scan.disposal_steps === 'string'
            ? JSON.parse(scan.disposal_steps || '[]')
            : (scan.disposal_steps || []);
        } catch {
          parsed_components = [];
        }
        return {
          ...scan,
          parsed_components
        };
      });

      // Calculate category counts
      const category_counts = {
        Recyclable: recent_scans.filter((s) => s.category === 'Recyclable').length,
        Compostable: recent_scans.filter((s) => s.category === 'Compostable').length,
        Landfill: recent_scans.filter((s) => s.category === 'Landfill').length
      };

      // Daily Climate Quests for today (UTC YYYY-MM-DD)
      const today_str = new Date().toISOString().slice(0, 10);
      const claimed_keys_list = await db.getQuestClaims(user.id, today_str);
      const claimed_keys = Array.isArray(claimed_keys_list) ? claimed_keys_list : [];
      const claimedSet = new Set(claimed_keys);

      const scanned_today = recent_scans.some((s) => (s.timestamp || '').startsWith(today_str));
      const diverted_today = recent_scans.some(
        (s) =>
          (s.timestamp || '').startsWith(today_str) &&
          (s.category === 'Recyclable' || s.category === 'Compostable')
      );

      const daily_quests = [
        {
          id: 1,
          key: 'daily_scan',
          title: 'Daily Citizen Scan',
          desc: 'Inspect at least 1 packaging item today',
          reward_points: 25,
          reward: '+25 Eco-Pts',
          completed: scanned_today || claimedSet.has('daily_scan'),
          claimed: claimedSet.has('daily_scan')
        },
        {
          id: 2,
          key: 'diversion_hero',
          title: 'Diversion Hero',
          desc: 'Sort a recyclable or compostable item away from landfill',
          reward_points: 35,
          reward: '+35 Eco-Pts',
          completed: diverted_today || claimedSet.has('diversion_hero'),
          claimed: claimedSet.has('diversion_hero')
        },
        {
          id: 3,
          key: 'zero_wishcycle',
          title: 'Zero Wishcycle',
          desc: 'Read municipal rules and verify a packaging composite',
          reward_points: 20,
          reward: '+20 Eco-Pts',
          completed: true,
          claimed: claimedSet.has('zero_wishcycle')
        }
      ];

      return new Response(
        JSON.stringify({
          ok: true,
          user,
          level_info,
          stats: {
            smartphone_charges,
            ev_miles
          },
          recent_scans,
          category_counts,
          daily_quests
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/claim_quest
    // ------------------------------------------------------------------------
    if (route === 'claim_quest') {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
          status: 405,
          headers: corsHeaders
        });
      }

      const rawQuestKey = body.quest_key || url.searchParams.get('quest_key') || '';
      const quest_key = String(rawQuestKey).trim();

      if (!quest_key || !QUEST_REWARDS.hasOwnProperty(quest_key)) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid or missing quest_key' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const today_str = new Date().toISOString().slice(0, 10);
      const claimed_keys = await db.getQuestClaims(user.id, today_str);
      if (Array.isArray(claimed_keys) && claimed_keys.includes(quest_key)) {
        return new Response(JSON.stringify({ ok: false, error: 'Quest already claimed today' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const points_awarded = QUEST_REWARDS[quest_key];
      await db.createQuestClaim({
        user_id: user.id,
        quest_key,
        claimed_date: today_str,
        points_awarded
      });

      const currentPoints = Number(user.points || 0);
      const new_points = currentPoints + points_awarded;
      await db.updateUser(user.id, { points: new_points });

      return new Response(
        JSON.stringify({
          ok: true,
          points_awarded,
          new_points,
          quest_key
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // ------------------------------------------------------------------------
    // Route: POST /api/update_hub
    // ------------------------------------------------------------------------
    if (route === 'update_hub') {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
          status: 405,
          headers: corsHeaders
        });
      }

      const rawHub = body.community_hub || url.searchParams.get('community_hub') || '';
      const community_hub = String(rawHub).trim();

      if (!community_hub) {
        return new Response(JSON.stringify({ ok: false, error: 'community_hub is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const updated = await db.updateUser(user.id, { community_hub });

      return new Response(
        JSON.stringify({
          ok: true,
          community_hub: updated ? updated.community_hub : community_hub
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // Route not recognized
    return new Response(JSON.stringify({ ok: false, error: 'Endpoint not found' }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (err) {
    console.error('Serverless dashboard error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message || 'Internal server error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
};

export const config = {
  path: [
    '/api/dashboard',
    '/api/dashboard/*',
    '/api/claim_quest',
    '/api/update_hub',
    '/.netlify/functions/dashboard'
  ]
};
