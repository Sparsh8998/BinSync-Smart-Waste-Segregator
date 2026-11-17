import db from './lib/db.mjs';

function getCorsHeaders(req) {
  const origin = req.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function createSessionToken(user) {
  const payload = {
    id: String(user.id),
    username: String(user.username),
    ts: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
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

    // Determine target route: login, me, logout
    let route = '';
    if (lastSegment === 'login' || actionParam === 'login' || body.action === 'login') {
      route = 'login';
    } else if (lastSegment === 'logout' || actionParam === 'logout' || body.action === 'logout') {
      route = 'logout';
    } else if (lastSegment === 'me' || actionParam === 'me' || body.action === 'me') {
      route = 'me';
    } else if (lastSegment === 'auth') {
      if (req.method === 'GET') {
        route = 'me';
      } else if (req.method === 'POST') {
        route = body.username ? 'login' : 'me';
      }
    }

    // ------------------------------------------------------------------------
    // Route: login
    // ------------------------------------------------------------------------
    if (route === 'login') {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
          status: 405,
          headers: corsHeaders
        });
      }

      const rawUsername = body.username || url.searchParams.get('username') || '';
      const username = String(rawUsername).trim();

      if (!username) {
        return new Response(JSON.stringify({ ok: false, error: 'Username is required' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const rawHub = body.community_hub || url.searchParams.get('community_hub') || '';
      const communityHub = String(rawHub).trim();

      let user = await db.findUserByUsername(username);

      if (user) {
        if (communityHub && communityHub !== user.community_hub) {
          user = (await db.updateUser(user.id, { community_hub: communityHub })) || user;
        }
      } else {
        user = await db.createUser({
          username,
          community_hub: communityHub || 'Downtown Metro'
        });
      }

      const token = createSessionToken(user);
      const isSecure = url.protocol === 'https:' || process.env.NODE_ENV === 'production';
      const cookieHeader = `binsync_session=${token}; Path=/; SameSite=Lax; Max-Age=2592000${isSecure ? '; Secure' : ''}`;

      return new Response(JSON.stringify({ ok: true, user, token }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Set-Cookie': cookieHeader
        }
      });
    }

    // ------------------------------------------------------------------------
    // Route: me
    // ------------------------------------------------------------------------
    if (route === 'me') {
      let token = '';

      // 1. Authorization: Bearer <token>
      const authHeader = req.headers.get('authorization') || '';
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim();
      }

      // 2. Query param ?token=... or POST body token
      if (!token) {
        token = url.searchParams.get('token') || body.token || '';
      }

      // 3. Cookie binsync_session=...
      if (!token) {
        const cookies = parseCookies(req.headers.get('cookie'));
        token = cookies['binsync_session'] || '';
      }

      let user = null;
      if (token) {
        const decoded = decodeSessionToken(token);
        if (decoded && decoded.id) {
          user = await db.findUserById(decoded.id);
        }
        if (!user && decoded && decoded.username) {
          user = await db.findUserByUsername(decoded.username);
        }
        if (!user && typeof token === 'string' && token.startsWith('user_')) {
          user = await db.findUserById(token);
        }
      }

      if (user) {
        return new Response(JSON.stringify({ ok: true, authenticated: true, user }), {
          status: 200,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ ok: true, authenticated: false, user: null }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // ------------------------------------------------------------------------
    // Route: logout
    // ------------------------------------------------------------------------
    if (route === 'logout') {
      const isSecure = url.protocol === 'https:' || process.env.NODE_ENV === 'production';
      const clearCookieHeader = `binsync_session=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isSecure ? '; Secure' : ''}`;

      return new Response(JSON.stringify({ ok: true, message: 'Logged out successfully' }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Set-Cookie': clearCookieHeader
        }
      });
    }

    // Default: route not found
    return new Response(JSON.stringify({ ok: false, error: 'Endpoint not found' }), {
      status: 404,
      headers: corsHeaders
    });

  } catch (err) {
    console.error('Serverless auth error:', err);
    return new Response(JSON.stringify({ ok: false, error: err.message || 'Internal server error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
};

export const config = {
  path: ['/api/auth', '/api/auth/*', '/.netlify/functions/auth']
};
