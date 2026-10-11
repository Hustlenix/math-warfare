# MATH-Warefare: The Dustlight Frontier

A maths adventure by Lalith. Ride into a dusty frontier village, help its neighbours and venture into a mushroom cave to restore the last light. The desert palette, black-hatted chemist and caravan pay tribute to desert crime-drama and Western-film imagery while the story remains a friendly maths adventure.

## What you can play

- A fullscreen world with a compact quest/player HUD, on-demand journal drawer and optional browser fullscreen. The cast intro remains, with solo and online entry choices.
- Guest online rooms for up to four players: share an eight-character code, explore with visible remote avatars, and play five-question maths races with shared questions, countdowns, feedback and scores.
- Two explorable maps with collision, click-to-walk routes, keyboard movement and a minimap.
- Nine connected quests, requiring 49 correct answers to finish the story. Neighbours have dialogue and each quest teaches a different skill.
- Animated characters, cats, frogs and butterflies; furniture and cave scenery from paid LimeZu packs.
- **324 prebuilt playable looks**: 12 character styles × 9 skin tones × 3 coordinated colourways. Includes curly-haired men and women, long hair, a pixie cut, silver hair, shaved heads, black-fedora chemists/detectives, cowboys and cowgirls. Choose a name, preview all four walking directions, browse/search collections and apply or cancel. Every look is free and available immediately.
- A countryside settlement with tiled cottages, orchard, vegetable beds, pond landing, market awning and chickens. Villagers walk to deliveries and meetups, face one another, exchange dialogue and return home. Hazel, Jun and Sage wander the lanes and can be spoken to.
- An ensemble pixel-art intro featuring the playable character and villagers, with real artwork-loading progress and a Continue button for saved adventures.
- A dust-and-sage frontier palette, cacti, mesas, timber shopfronts, a parked caravan, notice board and wind-blown tumbleweed. Meet Cal the caravan chemist and Mae the deputy. Five paired village routines include their lemonade-ratio conversation.
- Eight skills: addition/subtraction, multiplication, division, decimals, percentages, order of operations, fractions of amounts, and short everyday word problems. Mixed practice draws from all eight.
- Three number-size settings; untimed ten-question training and a 60 second sprint with a local personal best.
- A daily seeded expedition, one coin reward per UTC date.
- Wrong-answer explanations, method hints and a revision notebook that clears questions when you answer them correctly.
- Cat/frog companions, three visible cosmetic upgrades, one-time quest coins, XP, saved progress, mute and reduced motion settings.

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

Use “Track quest” if you get lost. Story quests are untimed and recover after mistakes. Solo countdowns run only in the sprint. Leaving the browser tab pauses a solo challenge. Online races keep running for the room. Quitting an unfinished challenge gives no quest reward; completed quests stay saved.

## Play online with friends

1. Select **Play with friends** on the intro, or **Online** / O in the world.
2. Host selects **Create room**, then shares the eight-character room code.
3. Friends open the same game and select **Join room** with that code. No account is needed.
4. Explore together, or let the host choose a skill and difficulty and start a maths race. Everyone receives the same five questions. Each has three tries and 18 seconds; correct answers score once.
5. Return to the room lobby to rematch or leave. The host must keep their game open.

Online scores are temporary and never change solo coins, XP or quests. Quest progression and NPC routines remain local; online play synchronizes player presence and race state. Guests joining during a race spectate until the next one. Closing the race window returns to exploration; its timer keeps running.

The first online action contacts the public PeerJS signaling service. Room peers receive your nickname, character, position and submitted race answers. WebRTC establishes the data channel; camera/microphone permissions are not requested. Some school firewalls or symmetric NAT combinations block peer connections. No paid TURN relay is configured, so connectivity on every network cannot be guaranteed. Check the code, keep the host open and retry on another network when a connection fails. See [online design and dependencies](docs/ONLINE-DESIGN.md).

## Develop locally

Requirements: Node.js 22 or newer, npm, Python with Pillow, and your own licensed copies of the paid artwork packs. On Windows the current supplied packs are in Downloads; the importer reads them without modifying their contents.

```sh
cd math-warfare
npm ci
python scripts/import-art.py
npm run dev
```

If your packs are elsewhere, set `MATH_ASSET_HOME` to their parent folder before running the importer. It expects `moderninteriors-win`, `Fungus Cave [16x16]`, and `Fantasy Battlers - Complete/Fantasy Battlers - Complete/Original size`. Pillow can be installed with `python -m pip install Pillow`.

The importer creates small animation strips and selected game-only crops in `.licensed-art/`, then runs `scripts/build-wardrobe.py` to bake all 324 characters and their portraits ahead of time. No character is generated on demand and there is no generation API. The packed atlas retains every unique look and is used by the world, battle interface, wardrobe and intro. That directory is ignored by Git. Vite embeds the game-specific artwork into the compiled game; no original artist sheet is hosted by the release. The source zip deliberately excludes artist image files. See [CREDITS.md](CREDITS.md) for rights and attribution.

## Test and release

```sh
npm test
npm run build
node scripts/package-release.mjs
node scripts/verify-release.mjs
npm run preview
```

Twenty-three tests cover 24,000 equations, validation, daily determinism, quest and purchase transactions, saves, routes, cave gates, scaled pointer coordinates, walking at 20 FPS, direction selection, five conversation/return cycles, following a moving neighbour, wardrobe coverage, migration of old saves, character reloads and caravan collision. Online checks cover safe room profiles, private answers, host-owned scores, duplicates, attempts, deadlines and five-round completion. `python scripts/check-art.py` compares actual normalized sprite pixels against the owned sheets for eleven villagers and four cave characters. `python scripts/check-wardrobe-art.py` checks all 324 baked characters, their 9,072 animation cells, visually unique pixel hashes and matching portraits. Run the pixel checks after importing artwork. The deployment workflow checks source and release hashes before publishing the compiled game, so CI does not need the private artwork packs. Rebuild and package after changing recorded source files.

## Structure

- `src/main.js`: accessible DOM interface, dialogues, challenge lifecycle and audio.
- `src/adventure/content.js`: neighbours, quest graph and cosmetic prices.
- `src/adventure/questions.js`: exact questions, seeded daily trail and strict answer parsing.
- `src/adventure/progress.js`: versioned saves and one-time reward/purchase transactions.
- `src/adventure/world.js`: Canvas renderer, character animation, movement, collision, BFS routes and camera.
- `src/adventure/village-life.js`: walking routines, neighbour meetings and normalized sprite frame selection.
- `src/adventure/countryside.js`: cottages, farm plots, orchard, market and pond scenery.
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

Appearance uses the same save. Existing adventures gain a default cowboy without losing progress. Character changes are cosmetic: there are no stat boosts, paid unlocks or coin costs. Cancelling the wardrobe keeps the current look. The catalogue contains 324 distinct colour/body/style combinations, rather than 324 separately drawn character concepts.

The game practises arithmetic rather than certifying a grade curriculum or measured learning outcome. Accessibility includes focus-visible controls, semantic forms, keyboard navigation, touch controls, readable methods, reduced motion and DOM journal routes. World exploration itself is visual; this is not a fully screen-reader-equivalent adventure.

## AI disclosure and Stardance review

This expansion was substantially implemented with Codex AI assistance. It cannot honestly be presented as verified compliance with the reviewer’s stated 30% AI limit. Ask the organisers how to handle the disclosed contribution before requesting recertification. Do not invent hours or human authorship. Acceptance and Stardust are external decisions; **300 Stardust is not promised**. See [review readiness](docs/REVIEW-READINESS.md).

Pixel artwork by [LimeZu](https://limezu.itch.io/). Press Start 2P uses the SIL Open Font License. Sound is synthesised in code. Full details are in [credits](CREDITS.md).
