# Math Warfare

Math Warfare is a browser game about exploring a small frontier village and helping its neighbours with maths. Story quests cover arithmetic, fractions, decimals, percentages and word problems. There are also practice rounds, a journal, character outfits, companions and optional multiplayer.

## Why I started it

> [Write in your own words what made you start this project and who you hoped would enjoy it.]

## How to play

Move with WASD, the arrow keys, or a click/tap. Press E or select a neighbour to talk. Use the journal for hints and worked answers. Story questions have no timer; practice modes offer a quicker challenge.

## How it works

The game uses JavaScript, Vite and the Canvas API. The world, quests, maths questions, saves and multiplayer each have separate modules. Solo progress is saved in the browser with localStorage. Guest multiplayer uses PeerJS/WebRTC, so connections can fail on networks that block peer traffic. Optional NPC AI chat uses a separate server endpoint; the browser build does not contain a provider key, and the public Pages game does not yet have a deployed AI service.

The Canvas world renderer keeps the project easy to host as a static site, but movement, collision and drawing need to stay in sync. Saves are simple and work offline, but do not follow a player between devices. The art importer also needs the original licensed art packs, which are not included here.

## Run locally

Install Node.js 22 or newer, then run these commands from this repository:

```sh
cd math-warfare
npm ci
npm run dev
```

Run `npm test` and `npm run build` from the `math-warfare` folder to check the project. Rebuilding the full art set also requires Python, Pillow and your own licensed copies of the packs; see [credits](math-warfare/CREDITS.md).

## Credits and authorship

Pixel art by [LimeZu](https://limezu.itch.io/). Press Start 2P is licensed under the SIL Open Font License. The full asset details are in [CREDITS.md](math-warfare/CREDITS.md).

Substantial parts of this project were created with Codex AI assistance. The amount of AI-assisted work has not been independently measured for Stardance review. Please do not read this repository as a claim of human-only authorship.

> [Describe which parts you personally built, changed or reviewed, and one thing you learned. Replace this with your own account before presenting it as your development story.]
