# MATH-Warefare: The Lanterns of Numberglen

A small maths adventure by Lalith. Numberglen’s lantern has gone dark. Walk around its village, help the baker and gardener, recover a map, and venture into a mushroom cave to restore the last light.

## What you can play

- Two explorable maps with collision, click-to-walk routes, keyboard movement and a minimap.
- Nine connected quests, requiring 49 correct answers to finish the story. Neighbours have dialogue and each quest teaches a different skill.
- Animated characters, cats, frogs and butterflies; furniture and cave scenery from paid LimeZu packs.
- Eight skills: addition/subtraction, multiplication, division, decimals, percentages, order of operations, fractions of amounts, and short everyday word problems. Mixed practice draws from all eight.
- Three number-size settings; untimed ten-question training and a 60 second sprint with a local personal best.
- A daily seeded expedition, one coin reward per UTC date.
- Wrong-answer explanations, method hints and a revision notebook that clears questions when you answer them correctly.
- Cat/frog companions, three visible cosmetic upgrades, one-time quest coins, XP, saved progress, mute and reduced motion settings.

The world is playable without an account or maths API. There is no tracking, fake online leaderboard or reward purchase. Completing the story grants **340 in-game coins**; these have no relationship to Hack Club Stardust.

## Controls

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Walk | WASD, arrow keys, or click a destination | Tap a destination or use touch arrows |
| Meet someone | E nearby, click a neighbour, or choose a journal entry | Tap the neighbour or journal entry |
| Answer | Type a number and Enter | Use the keypad or device keyboard |
| Continue | Enter or the Next button | Next button |
| Pause challenge | Escape or pause button | Pause button |

Follow “Find next quest” if you get lost. Story quests are untimed and recover after mistakes. The countdown runs only in the sprint. Leaving the browser tab pauses a challenge. Quitting an unfinished challenge gives no quest reward; completed quests stay saved.

## Develop locally

Requirements: Node.js 22 or newer, npm, Python with Pillow, and your own licensed copies of the paid artwork packs. On Windows the current supplied packs are in Downloads; the importer reads them without modifying their contents.

```sh
cd math-warfare
npm ci
python scripts/import-art.py
npm run dev
```

If your packs are elsewhere, set `MATH_ASSET_HOME` to their parent folder before running the importer. It expects `moderninteriors-win`, `Fungus Cave [16x16]`, and `Fantasy Battlers - Complete/Fantasy Battlers - Complete/Original size`. Pillow can be installed with `python -m pip install Pillow`.

The importer creates small animation strips and selected game-only crops in `.licensed-art/`. That directory is ignored by Git. Vite embeds those crops into the compiled game; no original atlas is hosted by the release. The source zip deliberately excludes artist image files. See [CREDITS.md](CREDITS.md) for rights and attribution.

## Test and release

```sh
npm test
npm run build
node scripts/package-release.mjs
node scripts/verify-release.mjs
npm run preview
```

Ten tests cover 24,000 equations across all skills and sizes, input validation, daily determinism, quest prerequisites and duplicate rewards, shop overdrafts, save reloads, NPC reachability, cave gates, scaled canvas pointer coordinates and reliable auto-walking at 20 FPS. The deployment workflow verifies source and compiled-release hashes before uploading `math-warfare/release` to GitHub Pages. This allows CI to publish a playable game without possessing the private artwork packs. Rebuild and package again after changing any recorded source file.

## Structure

- `src/main.js`: accessible DOM interface, dialogues, challenge lifecycle and audio.
- `src/adventure/content.js`: neighbours, quest graph and cosmetic prices.
- `src/adventure/questions.js`: exact questions, seeded daily trail and strict answer parsing.
- `src/adventure/progress.js`: versioned saves and one-time reward/purchase transactions.
- `src/adventure/world.js`: Canvas renderer, character animation, movement, collision, BFS routes and camera.
- `scripts/import-art.py`: local licensed artwork preparation.
- `docs/ADVENTURE-DESIGN.md`: loops, state ownership, decisions and verification boundaries.

Older engine/fx/API modules remain as project history; the current entry point uses the adventure modules above. The separate mathsheet generator is preserved and is not part of the game runtime.

## Progress, privacy and limitations

Your adventure uses `math-warfare-adventure-v1` in this browser’s localStorage. Original game save keys are untouched. Clearing browser data removes the adventure save; there is no cloud sync. Storage failure shows a notice and falls back to an in-memory session. Local saves are owner-editable and are not an anti-cheat system.

The game practises arithmetic rather than certifying a grade curriculum or measured learning outcome. Accessibility includes focus-visible controls, semantic forms, keyboard navigation, touch controls, readable methods, reduced motion and DOM journal routes. World exploration itself is visual; this is not a fully screen-reader-equivalent adventure.

## AI disclosure and Stardance review

This expansion was substantially implemented with Codex AI assistance. It cannot honestly be presented as verified compliance with the reviewer’s stated 30% AI limit. Ask the organisers how to handle the disclosed contribution before requesting recertification. Do not invent hours or human authorship. Acceptance and Stardust are external decisions; **300 Stardust is not promised**. See [review readiness](docs/REVIEW-READINESS.md).

Pixel artwork by [LimeZu](https://limezu.itch.io/). Press Start 2P uses the SIL Open Font License. Sound is synthesised in code. Full details are in [credits](CREDITS.md).
