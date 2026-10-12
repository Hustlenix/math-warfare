# Numberglen conversations

Each of the 18 people has a fixed temperament, voice, desire, relationships and authored greeting. A new Talk button sits alongside their existing quest/shop/arena actions. Conversations include bounded recent history, completed quest IDs, companion kind, location and current activity. The model cannot perform gameplay actions. Coins and quest completion remain entirely in the existing game systems.

The client sends text to a separately hosted NPC-only endpoint. Provider keys belong exclusively in backend environment variables, never VITE_* configuration, public assets, repository files or local storage. Replies use textContent, not HTML. Memory is kept only in the current game tab: eight messages per person. Forget conversation clears that person's local memory; it does not delete provider records.

## Current status

The implementation and local fixture tests are ready. No real inference has been verified and no AI backend has been deployed. The public Pages game still runs the previous release until this draft is connected and verified. Fixture screenshots are interface tests, not evidence of model output.

The selected model is fixed to `apodex/apodex-1.1-mini:free`. It has a free listing on [OpenRouter](https://openrouter.ai/apodex/apodex-1.1-mini:free). There is no paid model fallback. Free-model availability and account/provider quotas still apply.

The supplied credential belongs to Hack Club, not OpenRouter. The “no coding agents” rule applies when using the API for coding-agent tasks; game dialogue is a project feature, not code generation. A separate [Hack Club rule](https://docs.ai.hackclub.com/guide/rules.html) requires eligible teen users and prohibits shared tools that let others access the API without meeting those rules. The unrestricted public game therefore cannot expose this credential as a shared service. The backend rejects Hack Club in public/serverless deployment, including a mistakenly set local-private flag.

For a private local preview, copy `.env.local.example` to ignored `.env.local`, replace the exposed key with a fresh key, and save it there. Copy `.env.development.local.example` to ignored `.env.development.local` to point only the development frontend at the local service. Start the service in one terminal from the game project directory with `rtk proxy node --env-file=.env.local scripts/local-npc-server.mjs`, then run `rtk proxy npm run dev -- --host 127.0.0.1` in a second terminal. The game sends only to a loopback listener bound on `127.0.0.1`. Do not expose that listener with a tunnel or public port forward. Live inference must still be verified with the eligible account and selected free model.

## Deployment configuration

Deploy this nested project as a separate Vercel conversation service, with server-only `NPC_PROVIDER=openrouter` and `OPENROUTER_API_KEY`. The CLI is authenticated, but a suitable provider credential is still missing. Before live deployment, verify the credential and free model, and configure abuse controls appropriate to expected traffic. The endpoint has a six-request/minute per-IP burst guard **per running function instance**; that is not a durable global quota. The provider quota is authoritative. CORS is an origin filter, not authentication.

Set `VITE_NPC_ENDPOINT` to that service's `/api/npc` URL when building the Pages frontend. Build, package and verify the release using the existing scripts. Test real conversations in the compiled frontend and the public game before claiming AI works. With no endpoint, the game clearly displays that conversations are not connected and disables sending.

Requests accept at most 400 characters, eight history messages, and a total payload of 10 KB. The server constructs the character prompt and fixes the model; client model/system/tool parameters are ignored. Reply generation is limited to 160 tokens with an 18-second provider timeout, and the client cancels at 22 seconds. Responses are plain text capped at 700 characters. Opening another dialog or leaving a conversation aborts the request and suppresses late replies. A failed request keeps the player's text for retry.

## Verification

`npm test` includes seven NPC tests alongside the adventure, movement, village, wardrobe and online checks. Tests cover all characters, bounded state/history, malformed actors and messages, fixed model and server-only credentials, blocked public Hack Club use, burst recovery, CORS and oversized payloads. The provider transport test uses a synthetic credential and injected fetch; it makes no external calls.

Browser testing uses an explicitly labelled local fixture server outside the repository. Check request history, persona isolation, error retry, markup rendering, abort/late-result suppression, back to quests, forgetting memory, desktop/mobile layout, and unchanged rewards. The fixture must never be deployed or described as AI.
