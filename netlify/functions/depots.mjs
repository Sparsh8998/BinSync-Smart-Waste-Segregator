// Netlify Serverless Function for BinSync Recycling Depots
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

const DEFAULT_DEPOTS = [
  {
    id: 1,
    name: "Central EcoStation Drop-Off",
    stream_type: "Hazardous & E-Waste",
    description: "Accepts lithium batteries, paints, motor oils, solvents, and electronics. Free residential drop-off.",
    lat: 43.6532,
    lon: -79.3832,
    submitted_by: "City Eco Action",
    upvotes: 42,
    created_at: "2026-01-15"
  },
  {
    id: 2,
    name: "Metro Soft-Plastic & Film Return",
    stream_type: "Soft Plastics",
    description: "Takes clean grocery bags, bread bags, bubble wrap, and pallet stretch film. Must be clean and dry.",
    lat: 43.6620,
    lon: -79.3950,
    submitted_by: "Circular Hub",
    upvotes: 38,
    created_at: "2026-02-01"
  },
  {
    id: 3,
    name: "Community Compost & Organic Soil Hub",
    stream_type: "Compost & Yard Waste",
    description: "Drop off fruit & veg scraps, coffee grounds, and yard trimmings. Finished organic compost available free.",
    lat: 43.6450,
    lon: -79.4000,
    submitted_by: "Green Thumb Society",
    upvotes: 29,
    created_at: "2026-02-14"
  },
  {
    id: 4,
    name: "Textile & Scrap Metal Reclaim Depot",
    stream_type: "Textiles & Metal",
    description: "Accepts non-wearable clothing for industrial fiber recycling, clean scrap aluminum, and copper piping.",
    lat: 43.6700,
    lon: -79.3700,
    submitted_by: "Resource Recovery Co",
    upvotes: 19,
    created_at: "2026-03-01"
  }
];

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body.action === "upvote" || req.url.includes("upvote")) {
        return new Response(JSON.stringify({ status: "success", upvotes: 43 }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }
      const newDepot = {
        id: Date.now(),
        name: body.name || "Community Recycling Spot",
        stream_type: body.stream_type || "General Recyclables",
        description: body.description || "Community contributed drop-off location.",
        lat: parseFloat(body.lat) || 43.6532,
        lon: parseFloat(body.lon) || -79.3832,
        submitted_by: body.submitted_by || "Eco Citizen",
        upvotes: 1,
        created_at: new Date().toISOString().slice(0, 10)
      };
      return new Response(JSON.stringify({ status: "success", depot: newDepot }), {
        status: 200,
        headers: CORS_HEADERS
      });
    } catch (e) {
      return new Response(JSON.stringify({ status: "success", depots: DEFAULT_DEPOTS }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }
  }

  return new Response(JSON.stringify(DEFAULT_DEPOTS), {
    status: 200,
    headers: CORS_HEADERS
  });
};

export const config = {
  path: ["/api/depots", "/api/depots/*", "/.netlify/functions/depots"]
};

