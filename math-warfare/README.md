# MATH-Warefare: The Dustlight Frontier

Math Warfare is a browser maths adventure set in a frontier village. Walk between the shops, farms and ponds, meet the neighbours, and help restore the village lanterns. The story takes you from Numberglen into a mushroom cave, with short maths challenges along the way.

[Play the game](https://hustlenix.github.io/math-warfare/) · [Source code](https://github.com/Hustlenix/math-warfare) · [Credits](CREDITS.md)

## What’s in the game

- Nine story quests covering addition, multiplication, division, decimals, percentages, fractions, order of operations and everyday word problems. Story questions have no timer.
- A village and cave to explore, with keyboard, mouse and touch controls.
- 324 free character looks, plus a cat or frog companion you can name and care for.
- Optional guest multiplayer. Share a room code and take turns in five-question maths races; no account is needed.
- A journal with hints, worked methods and questions to revisit.

## Controls

| Action | Controls |
| --- | --- |
| Move | WASD, arrow keys, or click/tap a destination |
| Talk | E nearby, or click/tap a neighbour |
| Journal | J or the journal button |
| Practice / online | P / O, or use the action bar |
| Map / companion | M / B, or use the buttons |
| Fullscreen | F or the fullscreen button |

Story quests are untimed and mistakes come with an explanation. Leaving the tab pauses solo play. Online races keep running while the room is open.

## Conversations

Neighbours have their own personalities and routines. This branch also includes optional AI conversation: the game sends a message and a short conversation history to a separate NPC service. Replies do not change quests or rewards. Memory stays in the current browser tab, and the game asks players not to share private details.

AI chat is available in the local preview when configured. The public GitHub Pages build still needs a hosted conversation backend before it can offer AI replies. Setup, provider rules and deployment notes are in [NPC conversations](docs/NPC-CONVERSATIONS.md).

## Play with friends

Choose **Play with friends** from the intro, or **Online** in the world. One player creates a room and shares its eight-character code; friends join with that code. The host picks a skill and difficulty, then starts a race of five shared questions. The host needs to keep the game open.

Online play uses PeerJS and WebRTC. Room peers see each other’s nickname, character and position, and receive submitted race answers. There is no camera or microphone access, and no persistent leaderboard. Some school networks block peer connections; the game does not have a paid relay, so online play may not work on every network.

## Run it locally

You need Node.js 22 or newer and npm. From the repository root:

```sh
cd math-warfare
npm ci
npm run dev
```

To rebuild the full game art from source, you’ll also need Python with Pillow and your own licensed copies of the artwork packs. Run `python scripts/import-art.py` from the `math-warfare` directory before starting Vite. The importer reads the packs and prepares local game assets; the original sheets are not included in the repository. See [credits](CREDITS.md).

Run the checks and make a release with:

```sh
npm test
npm run build
node scripts/package-release.mjs
node scripts/verify-release.mjs
```

## Saves and privacy

Solo progress is stored in this browser. There is no account or cloud sync, so clearing browser data removes the save. Multiplayer room state is temporary. When AI chat is enabled, messages go to the configured conversation provider; don’t include private information.

## Credits and disclosure

This project used substantial Codex AI assistance. Its compliance with the Stardance review’s 30% AI limit has not been verified; check with the organisers before seeking recertification. Review acceptance and Stardust are decided by the organisers and are not guaranteed. More context is in [review readiness](docs/REVIEW-READINESS.md).

Pixel art by [LimeZu](https://limezu.itch.io/). Press Start 2P is licensed under the SIL Open Font License. See [CREDITS.md](CREDITS.md) for details.
