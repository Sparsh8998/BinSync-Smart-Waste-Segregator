const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({
    status: "success",
    message: "Scan record successfully updated/removed.",
    user_points: 0
  }), { status: 200, headers: CORS_HEADERS });
};

export const config = {
  path: ["/api/scan/:id", "/.netlify/functions/scan", "/api/scan/*"]
};
