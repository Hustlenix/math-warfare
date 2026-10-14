import { PERSONALITIES, cleanText, normalizeHistory, systemPrompt } from "../src/adventure/npc-personalities.js";

// Fixed NPC-only endpoint. The client cannot choose provider, model or system prompt.
const buckets = new Map();
export function rateLimit(identity, now = Date.now()) {
  if (buckets.size > 2000) for (const [id, b] of buckets) if (now - b.since > 60000) buckets.delete(id);
  const b = buckets.get(identity);
  if (!b || now - b.since > 60000) { if (buckets.size >= 2000 && !b) return false; buckets.set(identity, { since: now, count: 1 }); return true; }
  if (b.count >= 6) return false;
  b.count++; return true;
}
export function validateRequest(body) {
  if (!body || typeof body !== "object" || !Object.hasOwn(PERSONALITIES, body.npc)) throw new Error("Unknown resident");
  if (typeof body.message !== "string" || body.message.length > 400) throw new Error("Invalid message");
  const message = cleanText(body.message, 400);
  if (!message) throw new Error("Empty message");
  return { npc: body.npc, message, history: normalizeHistory(body.history), context: body.context };
}
export async function generateReply(input, { env = process.env, fetcher = fetch } = {}) {
  const provider = env.NPC_PROVIDER || "openrouter";
  const privateHackClub = provider === "hackclub" && env.NPC_LOCAL_PRIVATE === "true" && !env.VERCEL;
  if (provider === "hackclub" && !privateHackClub) throw new Error("Hack Club public access is not enabled");
  if (!["hackclub", "openrouter"].includes(provider)) throw new Error("Unsupported provider");
  const key = provider === "hackclub" ? env.HACKCLUB_API_KEY : env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Provider is not configured");
  const model = "apodex/apodex-1.1-mini:free";
  const url = privateHackClub ? "https://ai.hackclub.com/proxy/v1/chat/completions" : "https://openrouter.ai/api/v1/chat/completions";
  const response = await fetcher(url, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://hustlenix.github.io/math-warfare/", "X-Title": "Numberglen NPC conversations" },
    signal: AbortSignal.timeout(18000),
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt(input.npc, input.context) }, ...input.history, { role: "user", content: input.message }], max_tokens: 160, temperature: 0.85, stream: false, reasoning: { effort: "none" } }) });
  if (!response.ok) { const error = new Error("Conversation provider unavailable"); error.status = response.status === 429 || response.status === 402 ? 429 : 503; throw error; }
  const data = await response.json();
  const reply = cleanText(data.choices?.[0]?.message?.content, 700);
  if (!reply) throw new Error("Empty reply");
  return { reply, model, source: "ai" };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store"); res.setHeader("Vary", "Origin");
  const origin = req.headers.origin;
  const local = process.env.NPC_LOCAL_PRIVATE === "true" && !process.env.VERCEL && ["http://127.0.0.1:5173", "http://127.0.0.1:4173"].includes(origin);
  if (origin !== "https://hustlenix.github.io" && !local) return res.status(403).json({ error: "Origin not allowed" });
  if (process.env.NPC_PROVIDER === "hackclub" && !local) return res.status(503).json({ error: "Public conversations are not configured" });
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!String(req.headers["content-type"] ?? "").startsWith("application/json")) return res.status(415).json({ error: "JSON required" });
  if (Number(req.headers["content-length"] ?? 0) > 10000) return res.status(413).json({ error: "Request too large" });
  let input;
  try { const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; if (JSON.stringify(body).length > 10000) throw new Error("Too large"); input = validateRequest(body); }
  catch { return res.status(400).json({ error: "Invalid conversation" }); }
  // Best-effort per-instance burst protection; provider quota remains authoritative.
  const ip = String(req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown");
  if (!rateLimit(ip)) { res.setHeader("Retry-After", "60"); return res.status(429).json({ error: "Please wait before talking again" }); }
  try { return res.status(200).json(await generateReply(input)); }
  catch (error) { return res.status(error.status ?? 503).json({ error: "Conversation service unavailable" }); }
}
