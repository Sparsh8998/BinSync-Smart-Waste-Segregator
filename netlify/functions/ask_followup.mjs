// Netlify Serverless Function for BinSync Advisor Follow-up Micro-Chat
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

  try {
    const body = await req.json();
    const itemName = body.item_name || "Packaging Item";
    const category = body.category || "Recyclable";
    const question = (body.question || "").toLowerCase();

    // Check Gemini API key if present
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_BACKUP_KEY;
    if (apiKey && body.question) {
      try {
        const prompt = `You are BinSync Advisor, an expert municipal waste segregation AI.
Item: ${itemName}
Category: ${category}
User Question: "${body.question}"
Provide a concise, practical 1-3 sentence directive explaining exact separation, rinsing, or disposal instructions.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (answer) {
            return new Response(JSON.stringify({ answer }), { status: 200, headers: CORS_HEADERS });
          }
        }
      } catch (e) {}
    }

    // Smart heuristic answer
    let answer = `For ${itemName}, adhere to ${category} sorting rules. Disassemble composite parts where feasible, rinse off liquid or greasy food residues, and ensure materials are placed loose into your collection bin.`;
    if (question.includes("rinse") || question.includes("wash") || question.includes("water")) {
      answer = `Yes, a quick cold rinse is recommended for ${itemName} to eliminate organic residues that can attract pests or degrade paper recyclables in the collection truck.`;
    } else if (question.includes("cap") || question.includes("lid")) {
      answer = `Keep caps attached! Rinse the ${itemName} body clean, then reattach the screw cap loosely so it does not fall through the municipal sorting trommel screens.`;
    } else if (question.includes("label") || question.includes("sticker")) {
      answer = `Standard paper labels on ${itemName} are removed during industrial pulping and washing, so you don't need to peel them unless they are thick plastic sleeves.`;
    }

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({
      answer: "Follow standard municipal guidelines: separate composite parts, rinse clean of food residue, and deposit loose."
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }
};

export const config = {
  path: ["/api/ask_followup", "/.netlify/functions/ask_followup"]
};

