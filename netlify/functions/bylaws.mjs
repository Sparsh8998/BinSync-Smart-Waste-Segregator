// Netlify Serverless Function for Municipal Sorting Bylaws
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

const BYLAWS = {
  "Seattle, WA": {
    city_name: "Seattle, WA",
    tagline: "Seattle Public Utilities (SPU) Mandatory Composting Mandate",
    bin_terminology: { recycle: "Blue Cart (Clean Recyclables)", compost: "Green Cart (Food & Yard Waste)", trash: "Black Cart (Garbage)" },
    accepts_pp_5: true, accepts_ps_6: false, accepts_coffee_cups: false, compost_mandatory: true,
    prohibited_items: ["Plastic bags loose in blue bin", "Styrofoam food packaging", "Shredded paper loose", "Garden hoses / tanglers"],
    fine_policy: "Warning tag on 1st contamination; $50 violation fee on repeat infractions.",
    collection_schedule: [
      { day: "Tuesday", stream: "Curbside Clean Recycling", bins: "Blue Cart", frequency: "Bi-Weekly" },
      { day: "Tuesday", stream: "Food & Organics Waste", bins: "Green Cart", frequency: "Weekly" },
      { day: "Tuesday", stream: "Residual Landfill Waste", bins: "Black Cart", frequency: "Bi-Weekly" }
    ]
  },
  "New York, NY": {
    city_name: "New York, NY",
    tagline: "NYC Department of Sanitation (DSNY) Universal Curbside Composting",
    bin_terminology: { recycle: "Blue & Green Bins", compost: "Brown Bin (Curbside Composting)", trash: "Black Bags" },
    accepts_pp_5: true, accepts_ps_6: false, accepts_coffee_cups: false, compost_mandatory: true,
    prohibited_items: ["Plastic film bags in blue/green bins", "Wax-coated cardboard", "Styrofoam", "Lithium-ion batteries"],
    fine_policy: "DSNY enforces fines from $25 to $100 for unseparated recyclables.",
    collection_schedule: [
      { day: "Wednesday", stream: "Metals, Glass & Rigid Plastics", bins: "Blue Bin", frequency: "Weekly" },
      { day: "Wednesday", stream: "Paper & Cardboard", bins: "Green Bin", frequency: "Weekly" },
      { day: "Friday", stream: "Curbside Organics", bins: "Brown Bin", frequency: "Weekly" }
    ]
  },
  "San Francisco, CA": {
    city_name: "San Francisco, CA",
    tagline: "SF Environment Zero-Waste Directive & Mandatory Sorting Law",
    bin_terminology: { recycle: "Blue Cart (Recycle)", compost: "Green Cart (Compost)", trash: "Black Cart (Landfill)" },
    accepts_pp_5: true, accepts_ps_6: false, accepts_coffee_cups: true, compost_mandatory: true,
    prohibited_items: ["Treated wood", "Electronic waste", "Batteries in carts", "Fluorescent tubes"],
    fine_policy: "Mandatory sorting ordinance. Commercial & residential properties audited regularly.",
    collection_schedule: [
      { day: "Thursday", stream: "Curbside Recyclables", bins: "Blue Cart", frequency: "Weekly" },
      { day: "Thursday", stream: "Food Scraps & Organics", bins: "Green Cart", frequency: "Weekly" },
      { day: "Thursday", stream: "Landfill Residue", bins: "Black Cart", frequency: "Weekly" }
    ]
  },
  "Toronto, ON": {
    city_name: "Toronto, ON",
    tagline: "City of Toronto Solid Waste Management Blue Bin & Green Bin Program",
    bin_terminology: { recycle: "Blue Bin", compost: "Green Bin (Organics)", trash: "Grey/Black Bin (Garbage)" },
    accepts_pp_5: true, accepts_ps_6: false, accepts_coffee_cups: true, compost_mandatory: true,
    prohibited_items: ["Black plastic containers", "Expanded polystyrene foam", "Coffee pods", "Textiles"],
    fine_policy: "Non-compliant bins will not be serviced and may incur administrative penalty charges.",
    collection_schedule: [
      { day: "Wednesday", stream: "Blue Bin Recyclables", bins: "Blue Bin", frequency: "Bi-Weekly" },
      { day: "Wednesday", stream: "Green Bin Organics", bins: "Green Bin", frequency: "Weekly" },
      { day: "Wednesday", stream: "Garbage Stream", bins: "Black Bin", frequency: "Bi-Weekly" }
    ]
  },
  "Default": {
    city_name: "Standard North American Model",
    tagline: "EPA Standard Triple-Stream Municipal Guidelines",
    bin_terminology: { recycle: "Blue Bin (Clean Recyclables)", compost: "Green Bin (Organics)", trash: "Black/Grey Bin (Landfill)" },
    accepts_pp_5: true, accepts_ps_6: false, accepts_coffee_cups: false, compost_mandatory: false,
    prohibited_items: ["Loose plastic grocery bags", "Batteries and hazardous electronics", "Liquid food residues"],
    fine_policy: "Curbside bins containing visible contamination will be left unserviced.",
    collection_schedule: [
      { day: "Monday", stream: "Curbside Recyclables", bins: "Blue Bin", frequency: "Bi-Weekly" },
      { day: "Monday", stream: "Compost & Food Waste", bins: "Green Bin", frequency: "Weekly" },
      { day: "Monday", stream: "Landfill Trash", bins: "Black Bin", frequency: "Weekly" }
    ]
  }
};

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const cityParam = (url.searchParams.get("city") || "").toLowerCase().trim();

  let matched = null;
  if (cityParam) {
    for (const [name, data] of Object.entries(BYLAWS)) {
      if (name.toLowerCase().includes(cityParam) || cityParam.includes(name.toLowerCase().split(",")[0])) {
        matched = data;
        break;
      }
    }
  }

  return new Response(JSON.stringify(matched || BYLAWS["Default"]), {
    status: 200,
    headers: CORS_HEADERS
  });
};

export const config = {
  path: ["/api/bylaws", "/.netlify/functions/bylaws"]
};

