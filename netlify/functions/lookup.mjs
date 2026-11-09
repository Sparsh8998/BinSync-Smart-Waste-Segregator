// Netlify Serverless Function for BinSync Text & Barcode Lookup
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

const KNOWLEDGE_BASE = {
  "coffee": {
    item_name: "Single-Use Hot Coffee Cup with Closure",
    brand_name: "Cafe / Retail Hot Drink",
    material: "Polyethylene-Bonded Paperboard with Polystyrene Lid",
    category: "Landfill",
    components: [
      { part: "Plastic Lid #6", material: "Polystyrene (PS #6)", destination: "Blue Bin / Curbside", action: "Rinse clean and toss loose" },
      { part: "Paper Cup Body", material: "Bonded Polyethylene Liquid Paperboard", destination: "Trash / Landfill", action: "Cannot separate bonded plastic film at standard pulpers" },
      { part: "Corrugated Heat Sleeve", material: "Uncoated Cardboard", destination: "Blue Bin / Paper Stream", action: "Flatten dry and place loose" }
    ],
    co2_saved_grams: 35.0
  },
  "pizza": {
    item_name: "Corrugated Delivery Pizza Box",
    brand_name: "Takeout Pizzeria",
    material: "Corrugated Kraft Paperboard with Oil Residues",
    category: "Recyclable",
    components: [
      { part: "Clean Unsoiled Lid", material: "Corrugated Cardboard", destination: "Blue Bin (Recyclable)", action: "Tear lid off along hinge and flatten" },
      { part: "Grease-Soaked Base Liner", material: "Oil-Contaminated Fiber", destination: "Green / Organics Bin or Trash", action: "Tear into pieces for compost bin or trash" }
    ],
    co2_saved_grams: 75.0
  },
  "can": {
    item_name: "Aluminum Beverage Can",
    brand_name: "Beverage Producer",
    material: "100% Infinitely Recyclable Aluminum Alloy",
    category: "Recyclable",
    components: [
      { part: "Can Body & Stay-on Tab", material: "Drawn Aluminum Alloy 3104", destination: "Curbside Blue Bin", action: "Rinse empty; do not crush if bottle deposit state" }
    ],
    co2_saved_grams: 95.0
  },
  "bottle": {
    item_name: "Rigid Beverage Bottle with Closure",
    brand_name: "Beverage Producer",
    material: "Polyethylene Terephthalate (PET) & Polypropylene Cap",
    category: "Recyclable",
    components: [
      { part: "Screw Cap", material: "Polypropylene PP #5", destination: "Blue Bin (Curbside)", action: "Reattach loosely to neck" },
      { part: "Bottle Body", material: "Clear PET #1", destination: "Blue Bin (Curbside)", action: "Rinse empty and crush" },
      { part: "Label Wrap", material: "Shrink Sleeve Polymer", destination: "Trash / Landfill", action: "Peel along perforation if removable" }
    ],
    co2_saved_grams: 65.0
  },
  "chips": {
    item_name: "Multi-Layer Snack Chip Pouch",
    brand_name: "Snack Producer",
    material: "Biaxially Oriented Polypropylene (BOPP) & Metallized Film",
    category: "Landfill",
    components: [
      { part: "Outer Plastic Film", material: "Polypropylene (PP)", destination: "Specialized Soft Plastic Drop-off", action: "Take to store collection bin" },
      { part: "Metallized Foil Seal", material: "Vaporized Aluminum Coating", destination: "Specialized Soft Plastic Drop-off", action: "Keep dry and intact" }
    ],
    co2_saved_grams: 42.5
  }
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();

  if (!q) {
    return new Response(JSON.stringify({ error: "Query parameter 'q' is required" }), {
      status: 400,
      headers: CORS_HEADERS
    });
  }

  // OpenFoodFacts barcode check if 8-14 digits
  if (/^\d{8,14}$/.test(q)) {
    try {
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${q}.json`, {
        headers: { "User-Agent": "BinSync-WasteInspector/1.0" }
      });
      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const prod = offData.product;
          const name = prod.product_name || prod.generic_name || `Product ${q}`;
          const packText = prod.packaging || "Packaged Food Container";
          return new Response(JSON.stringify({
            item_name: name,
            brand_name: prod.brands || "Commercial Brand",
            material: packText,
            category: "Recyclable",
            points_earned: 20,
            components: [
              { part: "Primary Container", material: packText, destination: "Blue Bin (Check local rules)", action: "Rinse clean and empty" }
            ],
            co2_saved_grams: 45.0
          }), { status: 200, headers: CORS_HEADERS });
        }
      }
    } catch (e) {}
  }

  // Knowledge base check
  for (const [key, item] of Object.entries(KNOWLEDGE_BASE)) {
    if (q.includes(key)) {
      return new Response(JSON.stringify({
        ...item,
        confidence_pct: 94,
        points_earned: item.category === "Recyclable" ? 25 : 15
      }), { status: 200, headers: CORS_HEADERS });
    }
  }

  // Generic fallback
  return new Response(JSON.stringify({
    item_name: q.charAt(0).toUpperCase() + q.slice(1) + " Packaging",
    brand_name: "Generic / Packaged Goods",
    material: "Rigid Polymer / Fiber Composite",
    category: "Recyclable",
    confidence_pct: 88,
    points_earned: 20,
    components: [
      { part: "Main Body", material: "Recyclable Material", destination: "Blue Bin (Curbside)", action: "Rinse clean and place loose" }
    ],
    co2_saved_grams: 35.0
  }), { status: 200, headers: CORS_HEADERS });
};

export const config = {
  path: ["/api/lookup", "/.netlify/functions/lookup"]
};
