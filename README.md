# MATH-Warefare: The Dustlight Frontier

A maths adventure by Lalith. Ride into a dusty frontier village, help its neighbours and venture into a mushroom cave to restore the last light. The desert palette, black-hatted chemist and caravan pay tribute to desert crime-drama and Western-film imagery while the story remains a friendly maths adventure.

**[Play in your browser](https://hustlenix.github.io/math-warfare/)** · [Project source](https://github.com/Hustlenix/math-warfare) · [Artwork credits](math-warfare/CREDITS.md)

Built with JavaScript, Canvas and Vite. Solo play runs entirely in your browser. Guest multiplayer uses PeerJS data connections. No login, maths API key, installation or reward purchase is needed to play.

## What you can play

- A fullscreen world with a compact quest/player HUD, on-demand journal drawer and optional browser fullscreen. The cast intro remains, with solo and online entry choices.
- Guest online rooms for up to four players: share an eight-character code, explore with visible remote avatars, and play five-question maths races with shared questions, countdowns, feedback and scores.
- A **60×44 tile countryside** and a separate 33×25 tile cave, with collision, click-to-walk routes, keyboard movement, camera tracking, a minimap and a full country map. The village has 3.2 times its former tile area.
- Nine connected quests, requiring 49 correct answers to finish the story. Neighbours have dialogue and each quest teaches a different skill.
- Animated villagers, butterflies and frogs, with furniture and cave scenery from paid LimeZu packs. The cat has original tiny four-direction walking poses and uses the licensed curled-cat animation only for naps.
- **324 prebuilt playable looks**: 12 character styles × 9 skin tones × 3 coordinated colourways. Includes curly-haired men and women, long hair, a pixie cut, silver hair, shaved heads, black-fedora chemists/detectives, cowboys and cowgirls. Choose a name, preview all four walking directions, browse/search collections and apply or cancel. Every look is free and available immediately.
- Separate town, ranch, fenced farm, creek camp and companion meadow districts. Vegetable beds have collision and stay out of the roads. There are walking aisles through the farm and two bridges across the creek. Wren the farmer and Bo the rancher stroll and meet to trade supplies.
- An ensemble pixel-art intro featuring the playable character and villagers, with real artwork-loading progress and a Continue button for saved adventures.
- A dust-and-sage frontier palette, cacti, mesas, timber shopfronts, a parked caravan, notice board and wind-blown tumbleweed. Meet Cal the caravan chemist and Mae the deputy. Six paired village routines include their lemonade-ratio conversation.
- Eight skills: addition/subtraction, multiplication, division, decimals, percentages, order of operations, fractions of amounts, and short everyday word problems. Mixed practice draws from all eight.
- Three number-size settings; untimed ten-question training and a 60 second sprint with a local personal best.
- A daily seeded expedition, one coin reward per UTC date.
- Wrong-answer explanations, method hints and a revision notebook that clears questions when you answer them correctly.
- Nameable cat/frog companions with route-following, direction changes, feet/hops, depth sorting, naps, scratches, Stay and Recall. Three visible cosmetic upgrades, one-time quest coins, XP, saved progress, mute and reduced motion settings.

Solo play needs no account or maths API. Online play uses PeerJS/WebRTC guest rooms, with no login or persistent online leaderboard. There are no reward purchases. Completing the story grants **340 in-game coins**; these have no relationship to Hack Club Stardust.

## Controls

| Action              | Keyboard / mouse                                                          | Touch                                 |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| Walk                | WASD, arrow keys, or click a destination                                  | Tap a destination or use touch arrows |
| Meet someone        | E nearby, click a neighbour, or choose a journal entry                    | Tap the neighbour or journal entry    |
| Answer              | Type a number and Enter                                                   | Use the keypad or device keyboard     |
| Continue            | Enter or the Next button                                                  | Next button                           |
| Pause challenge     | Escape or pause button                                                    | Pause button                          |
| Journal / game menu | J or journal/menu button                                                  | Same buttons                          |
| Practice / online   | P / O or action bar                                                       | Action bar                            |
| Browser fullscreen  | F or fullscreen icon                                                      | Fullscreen icon (if supported)        |
| Change character    | C, character HUD, journal wardrobe, or Choose your character on the intro | Same buttons                          |
| Country map         | M or Map button; choose a destination to walk there                       | Map button and destination list       |
| Companion care      | B or companion button; click your nearby pet to scratch it                | Companion button or tap the pet       |

Use “Track quest” if you get lost. Story quests are untimed and recover after mistakes. Solo countdowns run only in the sprint. Leaving the browser tab pauses a solo challenge. Online races keep running for the room. Quitting an unfinished challenge gives no quest reward; completed quests stay saved.

## How the adventure works

Explore → talk to a neighbour → solve a short maths challenge → get a method or a reward → unlock the next part of the village. You can help Bram, Fern and Noor in different orders after Mira. Ada needs both Bram and Fern; the king also needs Noor’s market quest, so helping the village matters even after entering the cave.

| Neighbour | Skill | Correct answers | Requires | One-time coins / XP |
| --- | --- | ---: | --- | --- |
| Mira | Addition and subtraction | 3 | Start | 15 / 30 |
| Bram | Multiplication | 5 | Mira | 25 / 50, cat unlocked |
| Fern | Division | 5 | Mira | 25 / 50, frog unlocked |
| Ada | Decimals | 5 | Bram and Fern | 30 / 50, cave trail opens |
| Noor | Percentages | 5 | Mira | 35 / 50 |
| Scout | Order of operations | 6 | Ada | 40 / 60, first cave gate opens |
| Pip | Fractions of amounts | 6 | Scout | 45 / 60, second cave gate opens |
| Ivo | Everyday word problems | 6 | Pip | 45 / 60 |
| Fungus King | Mixed skills | 8 | Ivo and Noor | 80 / 80, last lantern restored |

That is 49 correct answers, 340 coins and 490 XP for the story. Quest mistakes show the answer and a method, save a revision note and offer another question. They do not erase completed quests. Running out of hearts in a story quest gives a recovery rather than ending the adventure. Repeating a completed quest is practice and does not pay its story reward again.

Training is ten untimed questions. The sprint runs for 60 active seconds and records a local personal best. Correct answers award 10 points plus a streak bonus, capped at 10 extra points per answer. Points, coins and XP have different roles: points measure a practice session, XP records progress, and coins buy decorations. The daily expedition uses the UTC date as a shared question seed and pays at most once per date. Learning notes hold up to 24 mistakes and remove a question after a correct revision answer.

Difficulty changes number size across three settings; it does not certify a school grade. Questions are generated locally with exact answers and paired method hints. Decimals use integer tenths internally, division starts with divisible amounts, and numeric input rejects text such as `12abc`.

## The world and its companions

The original square, bakery, library, pond, stall and caravan retain their locations. Former vegetable beds south of the square are now open walking ground. Head east for Sunset ranch and Copperfield farm; continue across a bridge to Willow creek camp. Head south for the companion shelter and picnic green. **M** shows the whole map and provides routes to the four country landmarks. Their practice prompts have no story gate or extra coin reward.

Buildings, water, farm fences, planted beds and tree trunks in the new districts are solid. Farm aisles and gates are clear. The same layout definitions drive rendering, collision, saves and online position bounds. The cave retains its own dimensions and two quest-controlled gates. NPCs use authored walking circuits and six alternating conversation routines; this is a scripted village, not generated AI dialogue. The village and companion pause while you read or solve a solo challenge.

Help Bram to unlock Pixel the cat and Fern to unlock Pebble the frog. Open **B** to choose a pet, rename it (up to 18 characters), scratch it nearby, leave it waiting, or recall it. Your pet remembers the tiles you walked through and uses collision-aware routes around scenery. It walks behind you instead of sliding straight toward you. The cat faces left, right, up and down; the frog hops. Both rest after quiet moments; the cat curls up after seven seconds. Reduced motion freezes decorative animation.

Stay is temporary: recall, switching pets, changing maps or reloading returns it to following. Pet names and the selected species are saved. Pets are cosmetic companions with no hunger timer, damage, stat boosts or coin charges. The 40-coin wildflowers, 50-coin lanterns and 60-coin picnic are also cosmetic; the picnic now appears in the southern green, away from the walking lanes.

## Play online with friends

1. Select **Play with friends** on the intro, or **Online** / O in the world.
2. Host selects **Create room**, then shares the eight-character room code.
3. Friends open the same game and select **Join room** with that code. No account is needed.
4. Explore together, or let the host choose a skill and difficulty and start a maths race. Everyone receives the same five questions. Each has three tries and 18 seconds; correct answers score once.
5. Return to the room lobby to rematch or leave. The host must keep their game open.

Online scores are temporary and never change solo coins, XP or quests. Quest progression and NPC routines remain local; online play synchronizes player presence and race state. Guests joining during a race spectate until the next one. Closing the race window returns to exploration; its timer keeps running.

Pets are local to your adventure and are not synchronized to other players. Expanded-world rooms use protocol version 2; everyone should reload the latest game before sharing a code. Earlier releases use separate rooms so a small-map client cannot incorrectly clamp players in the new districts.

The first online action contacts the public PeerJS signaling service. Room peers receive your nickname, character, position and submitted race answers. WebRTC establishes the data channel; camera/microphone permissions are not requested. Some school firewalls or symmetric NAT combinations block peer connections. No paid TURN relay is configured, so connectivity on every network cannot be guaranteed. Check the code, keep the host open and retry on another network when a connection fails. See [online design and dependencies](math-warfare/docs/ONLINE-DESIGN.md).

## Develop locally

Requirements: Node.js 22 or newer, npm, Python with Pillow, and your own licensed copies of the paid artwork packs. On Windows the current supplied packs are in Downloads; the importer reads them without modifying their contents.

```sh
cd math-warfare
npm ci
python scripts/import-art.py
npm run dev
```

If your packs are elsewhere, set `MATH_ASSET_HOME` to their parent folder before running the importer. It expects `moderninteriors-win`, `Fungus Cave [16x16]`, and `Fantasy Battlers - Complete/Fantasy Battlers - Complete/Original size`. Pillow can be installed with `python -m pip install Pillow`.

The importer creates small animation strips and selected game-only crops in `.licensed-art/`, then runs `scripts/build-wardrobe.py` to bake all 324 characters and their portraits ahead of time. No character is generated on demand and there is no generation API. The packed atlas retains every unique look and is used by the world, battle interface, wardrobe and intro. That directory is ignored by Git. Vite embeds the game-specific artwork into the compiled game; no original artist sheet is hosted by the release. The source zip deliberately excludes artist image files. See [CREDITS.md](math-warfare/CREDITS.md) for rights and attribution.

## Test and release

```sh
npm test
npm run build
node scripts/package-release.mjs
node scripts/verify-release.mjs
npm run preview
```

Twenty-eight tests cover 24,000 equations, input validation, daily determinism, quest/purchase transactions, saved progress, routes, cave gates, scaled pointers, walking at 20 FPS, six conversation/return cycles, wardrobe coverage and caravan collision. Country tests check reachability, crop/path separation, both bridges, pet movement around the pond/farm/creek without crossing solids, Stay/Recall/scratches, four cat directions, small nap rendering, old saves, pet names and expanded multiplayer bounds. Online checks cover safe profiles, private answers, host-owned scores, duplicates, attempts, deadlines and five-round completion. `python scripts/check-art.py` compares normalized sprite pixels against the owned sheets for eleven villagers and four cave characters; `python scripts/check-wardrobe-art.py` checks all 324 characters and their 9,072 animation cells. Run the pixel checks after importing artwork. CI verifies source/release hashes and publishes the compiled game without needing private artwork packs. Rebuild and package after changing recorded source files.

## Structure

- `src/main.js`: accessible DOM interface, dialogues, challenge lifecycle and audio.
- `src/adventure/content.js`: neighbours, quest graph and cosmetic prices.
- `src/adventure/questions.js`: exact questions, seeded daily trail and strict answer parsing.
- `src/adventure/progress.js`: versioned saves and one-time reward/purchase transactions.
- `src/adventure/world.js`: Canvas renderer, character animation, movement, collision, BFS routes and camera.
- `src/adventure/village-life.js`: walking routines, neighbour meetings and normalized sprite frame selection.
- `src/adventure/countryside.js`: cottages, farm plots, orchard, market and pond scenery.
- `src/adventure/map-layout.js`: per-map dimensions, roads, solid scenery, farm beds/gates and country landmarks.
- `src/adventure/expansion.js`: farm, barn, chickens, creek bridges, camp and companion meadow artwork.
- `src/adventure/companion.js`: delayed trail following, Stay/Recall/affection, names and small directional pet rendering.
- `src/adventure/intro.js`: ensemble opening scene and real artwork-load progress.
- `src/adventure/wardrobe-data.json`, `wardrobe.js`, `wardrobe-ui.js`: fixed catalogue, safe appearance selection, browsing and four-direction preview.
- `src/adventure/frontier.js`, `frontier.css`: frontier scenery and dust/sage interface.
- `src/adventure/fullscreen.css`: viewport game HUD, journal drawer and touch layout.
- `src/adventure/online-model.js`, `online-room.js`, `online-ui.js`: host race rules, real WebRTC transport and guest lobby/race interface.
- `docs/ONLINE-DESIGN.md`: online state ownership, loops, dependencies and test boundaries.
- `scripts/import-art.py`: local licensed artwork preparation.
- `scripts/build-wardrobe.py`: offline construction and palette packing of 324 distinct playable looks.
- `docs/ADVENTURE-DESIGN.md`: loops, state ownership, decisions and verification boundaries.

Older engine/fx/API modules remain as project history; the current entry point uses the adventure modules above. The separate mathsheet generator is preserved and is not part of the game runtime.

## Progress, privacy and limitations

Your adventure uses `math-warfare-adventure-v1` in this browser’s localStorage. Original game save keys are untouched. Clearing browser data removes the adventure save; there is no cloud sync. Storage failure shows a notice and falls back to an in-memory session. Local saves are owner-editable and are not an anti-cheat system.

Existing saves keep their quests, coins, XP, appearance and unlocked pets after the world expansion. New saves add default pet names. Position validation uses the current map’s bounds; new-country positions remain valid on reload. Returning from the cave places you at the town trail, and the pet spawns on adjacent walkable ground.

## Troubleshooting and contributing

- **Missing artwork during a source build:** run the importer with your own licensed packs and check `MATH_ASSET_HOME`. `release/` is already compiled and can be served without the private packs.
- **Old map or missing pet controls:** reload the page so the latest deployment loads. Do not clear browser data unless you intend to lose your save.
- **Pet waiting behind:** open B and choose Recall; it walks back using the current map’s paths. Water and crop beds are obstacles, so it may take the long route. A map transition brings it to the new map.
- **No saved progress:** private browsing, denied storage or cleared site data can prevent persistence. The game displays its save status. There is no cloud backup.
- **Online room cannot connect:** ensure both players have the latest release, check the code and keep the host open. A different network may be needed. See the connectivity limits above.
- **Release hash mismatch:** build again, run `package-release.mjs`, then verify. A changed source file with an old bundle should not be deployed.

For bug reports, include browser/device, the map, what you pressed, expected behaviour and a screenshot. Please omit private information and asset source sheets. To change the game, keep shared map/collision definitions consistent, preserve old save compatibility, add a focused regression check where behaviour changes, and run the release checks before opening a pull request.

Appearance uses the same save. Existing adventures gain a default cowboy without losing progress. Character changes are cosmetic: there are no stat boosts, paid unlocks or coin costs. Cancelling the wardrobe keeps the current look. The catalogue contains 324 distinct colour/body/style combinations, rather than 324 separately drawn character concepts.

The game practises arithmetic rather than certifying a grade curriculum or measured learning outcome. Accessibility includes focus-visible controls, semantic forms, keyboard navigation, touch controls, readable methods, reduced motion and DOM journal routes. World exploration itself is visual; this is not a fully screen-reader-equivalent adventure.

## AI disclosure and Stardance review

This expansion was substantially implemented with Codex AI assistance. It cannot honestly be presented as verified compliance with the reviewer’s stated 30% AI limit. Ask the organisers how to handle the disclosed contribution before requesting recertification. Do not invent hours or human authorship. Acceptance and Stardust are external decisions; **300 Stardust is not promised**. See [review readiness](math-warfare/docs/REVIEW-READINESS.md).

Pixel artwork by [LimeZu](https://limezu.itch.io/). Press Start 2P uses the SIL Open Font License. Sound is synthesised in code. Full details are in [credits](math-warfare/CREDITS.md).
