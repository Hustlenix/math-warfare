# Math Warfare: The Last Lantern

A small JavaScript pixel adventure about bringing light back to a frontier village. Help neighbours count repair supplies, pack bread orders, share water and prepare for the journey beneath the village.

[Play the released game](https://hustlenix.github.io/math-warfare/). The overhaul branch is a review build until merged and deployed.

## Play

Walk with WASD or arrows, or click/tap a destination. Press E near a neighbour to talk. Start with Mira in the square: three supply checks repair its lantern. Bram and Fern need help next; Ada opens the cave after both are ready. Noor's market task also matters for the final lantern.

Quest questions show the quantities being counted or shared. A wrong answer shows a method and keeps the task incomplete. Advance after a correct answer to save that task checkpoint. Closing or reloading an unfinished task repeats that task. Completed quests pay only once; their world changes survive reloads.

Use J for the journal, M for the map, B for companions and C for the wardrobe. Practice, daily challenges, revision notes and online rooms are in the journal. Escape pauses a challenge or opens settings. Touch arrows are available in the journal.

Nine quests, all 324 appearances, cat/frog companions, cosmetic supplies and guest multiplayer are retained. Online rooms support up to four players and five-question maths races. Multiplayer uses PeerJS/WebRTC; some networks block connections. Online scores do not affect solo progress.

## Run the source

The game is in the repository's math-warfare directory. Requirements: Node 22+, npm, Python/Pillow and your own licensed artwork packs.

    cd math-warfare
    npm ci
    python scripts/import-art.py
    npm run dev

Set MATH_ASSET_HOME if your packs are outside the importer's default location. The importer expects Modern Interiors, Fungus Cave and Fantasy Battlers. It prepares game crops and the prebuilt wardrobe in ignored .licensed-art. Original paid sheets are never committed.

The checked-in release directory can also be served with a static HTTP server without the private source packs.

## Code

- content.js defines quest prerequisites and rewards.
- quest-tasks.js generates contextual quantities and defines quest effects. Practice and multiplayer use adventure/questions.js.
- battle-session.js handles answers, streaks, hearts and task progression. battle-controller.js coordinates the DOM, timers and pause/resume. battle-ui.js and quest-ui.js render the interfaces.
- progress.js owns the existing version-1 local save, bounded task checkpoints, receipts and one-time transactions. World effects derive from completed quest IDs so old saves keep their meaning.
- world.js coordinates the Canvas world. village-life.js runs NPC schedules; companion.js handles pet movement; map-layout.js shares collision/layout data.
- world-panels.js, wardrobe-ui.js and online-ui.js own their respective panels. game-theme.css owns the common palette and quest components; existing layout styles remain for compatibility.

The older src/engine implementation is retained with separate tests; it is not imported by the current game. No framework was added.

## Verify and package

    npm test
    node --test tests/engine.test.js
    npm run stress
    npm run build
    node scripts/package-release.mjs
    node scripts/verify-release.mjs

Builds require the local licensed crops. Packaging includes compiled game-specific art and a source-hash manifest, and rejects raw PNG files. The Pages workflow verifies that manifest before publishing.

Checks cover equations, contextual tasks, rewards, saves, routes, companions, wardrobe, race scoring and runtime behavior. Automated tests do not establish fun or learning outcomes. See math-warfare/docs/LAST-LANTERN-OVERHAUL.md for the design decisions and verification limits.

## Limitations and credits

Progress is stored in this browser, without cloud backup. Mid-task typed answers are not restored after reload. Canvas exploration is not a full screen-reader equivalent; DOM task quantities, keyboard routes, reduced motion and touch controls remain available. Physical-device and independent player testing are still needed.

Artwork by LimeZu, used from locally owned paid packs. Press Start 2P uses the SIL Open Font License. Sound is synthesised in code. See math-warfare/CREDITS.md for details.

This adventure and the overhaul were substantially implemented with Codex AI assistance. This is not handwritten-only work or verified compliance with a programme's AI-contribution limit. Stardance eligibility and rewards are decisions for its organisers.

## Lalith's notes

[Your explanation: why you created this game and which design choices you made.]

[Your development work: what you implemented yourself, what you learned, and what you would change after playtesting.]
