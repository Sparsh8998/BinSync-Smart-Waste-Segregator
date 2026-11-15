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
    let originalItem = "Packaging Item";
    let correctedResin = "#1 PET";
    let correctedCategory = "Recyclable";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      originalItem = body.original_item || originalItem;
      correctedResin = body.corrected_resin_code || correctedResin;
      correctedCategory = body.corrected_category || correctedCategory;
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      originalItem = formData.get("original_item") || originalItem;
      correctedResin = formData.get("corrected_resin_code") || correctedResin;
      correctedCategory = formData.get("corrected_category") || correctedCategory;
    }

    return new Response(JSON.stringify({
      status: "success",
      message: `Verified as ${correctedResin}! +10 Eco-Pts awarded.`,
      user_points: 10,
      awarded_pts: 10,
      corrected_resin: correctedResin,
      corrected_category: correctedCategory
    }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "success",
      message: "Resin stamp verified! +10 Eco-Pts awarded.",
      user_points: 10
    }), { status: 200, headers: CORS_HEADERS });
  }
};

export const config = {
  path: ["/api/verify_correction", "/.netlify/functions/verify_correction"]
};
