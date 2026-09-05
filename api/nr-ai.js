import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PUBLIC_CONTEXT = `You are NR AI Assistant for Nishanth Reddy's professional portfolio. Answer questions using only the portfolio context below and the user's question. Be concise, professional, helpful, and never invent employment history, certifications, projects, dates, metrics, or skills. If information is not present, say you don't have that information. The portfolio includes: a professional journey; certifications and recognitions; engineering and reliable delivery themes; a technology stack; selected delivery work; experience working with Itineris; and a K-Vault containing knowledge documents for Azure DevOps, Dynamics 365 Finance, Power Platform, Power BI, and LCS. The public assistant may summarize the public portfolio. K-Vault document contents are private and must not be disclosed merely because the browser claims it is unlocked.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, history = [], vaultUnlocked = false } = req.body || {};
    if (!message || typeof message !== "string") return res.status(400).json({ error: "Message is required" });
    const safeHistory = Array.isArray(history) ? history.filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string").slice(-8) : [];
    const vaultNote = vaultUnlocked ? "The visitor has passed the portfolio's client-side K-Vault gate. You may acknowledge that access has been granted, but do not reveal private K-Vault article content unless it is explicitly supplied by a trusted server-side knowledge source." : "The visitor has not unlocked the K-Vault. Do not reveal or summarize private K-Vault article content.";
    const input = [...safeHistory, { role: "user", content: message }];
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL || "gpt-5.6-luna", instructions: PUBLIC_CONTEXT + "\n" + vaultNote, input });
    return res.status(200).json({ answer: response.output_text || "I couldn't generate an answer right now." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "NR AI is temporarily unavailable." });
  }
}
