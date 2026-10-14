// Private local preview only. This process cannot bind on a network interface.
import http from 'node:http';
import { once } from 'node:events';
import handler from '../api/npc.js';

if (process.env.VERCEL) throw new Error('This server is only for a local preview.');
if (process.env.NPC_PROVIDER !== 'hackclub' || process.env.NPC_LOCAL_PRIVATE !== 'true' || !process.env.HACKCLUB_API_KEY) {
  throw new Error('Set NPC_PROVIDER=hackclub, NPC_LOCAL_PRIVATE=true and HACKCLUB_API_KEY in the ignored local secrets file.');
}
const server = http.createServer(async (request, response) => {
  if (request.method !== 'POST' && request.method !== 'OPTIONS') {
    response.writeHead(405, { 'Cache-Control': 'no-store' }); response.end(); return;
  }
  let raw = '';
  try {
    for await (const chunk of request) {
      raw += chunk;
      if (raw.length > 10000) { response.writeHead(413); response.end(); return; }
    }
    if (request.method === 'POST' && raw) request.body = JSON.parse(raw);
  } catch { response.writeHead(400); response.end(); return; }
  const reply = {
    setHeader: (...args) => response.setHeader(...args),
    status(code) { response.statusCode = code; return this; },
    json(value) { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(value)); return this; },
    end: (...args) => response.end(...args),
  };
  await handler(request, reply);
});
server.listen(5185, '127.0.0.1');
await once(server, 'listening');
console.log('Private NPC preview listening on http://127.0.0.1:5185 (request content and credentials are never logged).');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
