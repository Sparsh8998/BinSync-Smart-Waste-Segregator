import db from './lib/db.mjs';

function getCorsHeaders(req) {
  const origin = req.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
  // Support raw user ID e.g. "user_..." or numeric ID
  if (!user && typeof token === 'string' && (token.startsWith('user_') || /^\d+$/.test(token))) {
    user = await db.findUserById(token);
  }
  // Support raw username if token isn't decoded JSON
  if (!user && typeof token === 'string' && !token.includes('{') && token.length < 50) {
    user = await db.findUserByUsername(token);
  }

  return user;
}

export default async (req, context) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    let body = {};
    if (req.method === 'POST' || req.method === 'DELETE') {
      body = await parseRequestBody(req);
    }

    const user = await getAuthenticatedUser(req, body);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'Authentication required' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Extract scan_id from context params, URL segments, query param, or body
    let scanId = context?.params?.id || '';
    if (!scanId) {
      const segments = pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      if (last && last !== 'scan' && last !== 'delete') {
        scanId = last;
      }
    }
    if (!scanId) {
      scanId = url.searchParams.get('id') || url.searchParams.get('scan_id') || body.id || body.scan_id || '';
    }

    if (!scanId) {
      return new Response(JSON.stringify({ ok: false, error: 'scan_id is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (req.method === 'DELETE' || req.method === 'POST') {
      await db.deleteScan(user.id, scanId);

      return new Response(
        JSON.stringify({
          ok: true,
          status: 'success',
          message: 'Scan record successfully removed.',
          scan_id: scanId
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  } catch (err) {
    console.error('Serverless scan error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message || 'Internal server error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
};

export const config = {
  path: ['/api/scan/:id', '/.netlify/functions/scan', '/api/scan/*']
};
