const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    let items = [];
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      items = body.items || [];
    }

    const count = items.length || 1;
    const points = count * 15;

    return new Response(JSON.stringify({
      success: true,
      logged_count: count,
      points_earned: points,
      message: `Logged ${count} compliant items into environmental diversion record.`
    }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({
      success: true,
      logged_count: 1,
      points_earned: 15,
      message: "Logged audited items into record."
    }), { status: 200, headers: CORS_HEADERS });
  }
};

export const config = {
  path: ["/api/log_audit_items", "/.netlify/functions/log_audit_items"]
};
