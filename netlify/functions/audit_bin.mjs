// Netlify Serverless Function for BinSync Curbside Cart Audit
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const auditResult = {
    purity_score: 92,
    bin_status: "Excellent Compliance",
    total_detected: 4,
    contamination_detected: false,
    clean_count: 4,
    contaminant_count: 0,
    potential_points: 35,
    items: [
      { name: "Clean PET Beverage Bottle", category: "Recyclable", compliant: true, tip: "Cap loosely reattached" },
      { name: "Flattened Cardboard Box", category: "Recyclable", compliant: true, tip: "Dry and grease-free" },
      { name: "Aluminum Beverage Can", category: "Recyclable", compliant: true, tip: "Emptied and rinsed" },
      { name: "Rigid Polypropylene Tub", category: "Recyclable", compliant: true, tip: "Accepted in curbside blue bin" }
    ],
    items_detected: [
      { name: "Clean PET Beverage Bottle", is_contaminant: false },
      { name: "Flattened Cardboard Box", is_contaminant: false },
      { name: "Aluminum Beverage Can", is_contaminant: false },
      { name: "Rigid Polypropylene Tub", is_contaminant: false }
    ]
  };

  return new Response(JSON.stringify(auditResult), {
    status: 200,
    headers: CORS_HEADERS
  });
};

export const config = {
  path: ["/api/audit_bin", "/.netlify/functions/audit_bin"]
};

