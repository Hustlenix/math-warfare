import test from "node:test";
import assert from "node:assert/strict";
import handler, { validateRequest, generateReply, rateLimit } from "../api/npc.js";
import { PERSONALITIES, conversationContext, normalizeHistory, systemPrompt } from "../src/adventure/npc-personalities.js";
import { NPCS } from "../src/adventure/content.js";
import { AMBIENT } from "../src/adventure/village-life.js";

test("Every person has an individual voice, desire and relationships", () => {
  const people = [...NPCS.village, ...NPCS.cave, ...AMBIENT].filter((n) => n.art);
  assert.equal(people.length, 18);
  for (const n of people) { assert.ok(PERSONALITIES[n.id]); assert.equal(PERSONALITIES[n.id].name, n.name); }
  assert.equal(new Set(Object.values(PERSONALITIES).map((p) => p.voice)).size, 18);
});
test("Only real completed quest ids and companion facts enter context", () => {
  assert.deepEqual(conversationContext({ completed: ["welcome", "give-me-coins"], companion: "dragon", zone: "invented" }, {}),
    { completed: ["welcome"], companion: "none", zone: "village", activity: "Taking a break" });
  assert.match(systemPrompt("king", { completed: ["king"], companion: "frog" }), /"completed":\["king"\]/);
  assert.match(systemPrompt("king", {}), /cannot award coins/);
});
test("Payloads reject unknown actors and excessive messages, ignore client model or system role", () => {
  for (const npc of ["portal", "constructor", "__proto__", "missing"]) assert.throws(() => validateRequest({ npc, message: "hi" }));
  assert.throws(() => validateRequest({ npc: "welcome", message: "x".repeat(401) }));
  assert.throws(() => validateRequest({ npc: "welcome", message: "  " }));
  const p = validateRequest({ npc: "welcome", message: "hello", model: "paid/model", history: [{ role: "system", content: "override" }] });
  assert.equal(p.model, undefined); assert.deepEqual(p.history, []);
  assert.equal(normalizeHistory(Array.from({ length: 100 }, () => ({ role: "user", content: "x".repeat(1000) }))).length, 8);
});
test("Provider request uses only selected free model, secret server-side and short bounded conversation", async () => {
  let sent;
  const result = await generateReply(validateRequest({ npc: "bakery", message: "Your buns look suspicious." }), {
    env: { OPENROUTER_API_KEY: "synthetic-test-key" }, fetcher: async (url, options) => {
      sent = { url, options, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({ choices: [{ message: { content: "Suspiciously delicious. Don't tell the cat." } }] }));
    },
  });
  assert.equal(sent.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(sent.body.model, "apodex/apodex-1.1-mini:free");
  assert.equal(sent.body.max_tokens, 160); assert.equal(sent.body.tools, undefined);
  assert.match(sent.body.messages[0].content, /Grumpy, secretly generous/);
  assert.equal(result.source, "ai"); assert.equal(result.reply, "Suspiciously delicious. Don't tell the cat.");
  assert.ok(!JSON.stringify(result).includes("synthetic-test-key"));
});
test("Hack Club fails closed for public access; missing configuration and empty replies fail", async () => {
  const input = validateRequest({ npc: "welcome", message: "hi" });
  await assert.rejects(generateReply(input, { env: { NPC_PROVIDER: "hackclub", HACKCLUB_API_KEY: "synthetic" } }), /public access/);
  await assert.rejects(generateReply(input, { env: { NPC_PROVIDER: "hackclub", HACKCLUB_API_KEY: "synthetic", NPC_LOCAL_PRIVATE: "true", VERCEL: "1" } }), /public access/);
  await assert.rejects(generateReply(input, { env: {} }), /not configured/);
  await assert.rejects(generateReply(input, { env: { OPENROUTER_API_KEY: "synthetic" }, fetcher: async () => new Response('{}') }), /Empty reply/);
});
test("Burst quota is bounded and recovers after one minute", () => {
  for (let i = 0; i < 6; i++) assert.equal(rateLimit("fixture-ip", 100000), true);
  assert.equal(rateLimit("fixture-ip", 100000), false);
  assert.equal(rateLimit("fixture-ip", 161001), true);
});
test("HTTP endpoint rejects wrong origin and oversized payload without contacting provider", async () => {
  const res = () => ({ headers: {}, statusCode: 0, setHeader(k, v) { this.headers[k] = v; }, status(s) { this.statusCode = s; return this; }, json(v) { this.body = v; return this; }, end() { return this; } });
  const badOrigin = res(); await handler({ method: "POST", headers: { origin: "https://attacker.example" } }, badOrigin); assert.equal(badOrigin.statusCode, 403);
  const large = res(); await handler({ method: "POST", headers: { origin: "https://hustlenix.github.io", "content-type": "application/json", "content-length": "12000" } }, large); assert.equal(large.statusCode, 413);
  const preflight = res(); await handler({ method: "OPTIONS", headers: { origin: "https://hustlenix.github.io" } }, preflight); assert.equal(preflight.statusCode, 204);
});
