# The Lanterns of Numberglen

## Countryside and village-life revision

Experience target: players should feel like a neighbour in a countryside community by seeing people go about their day, meeting them in the lanes, and helping with their problems.

Four scripted pairs follow collision-aware routes, face each other and alternate conversation turns. They return home after meeting. Three additional neighbours follow small circuits and share local stories. These are authored routines, not an AI simulation or multiplayer chat. The village clock pauses during challenges and dialogues. Following a quest neighbour pins their position so players do not have to chase them; walking away releases them. Quest IDs and rewards stay independent of temporary actor positions. Deliveries, gardening, reading and lights give the conversations a village purpose.

Cottages, vegetable beds, an orchard, pond landing, farm stall, fences, chickens and birds replace exposed furniture and large checkerboard lawns. Roofs have a cutaway front so indoor quest characters stay visible. The southern cottage has collision; decorations preserve required routes. A status line repeats the current neighbour exchange outside the Canvas.

The intro composes the actual licensed game cast in a rural pixel scene. Its loading bar reports decoded artwork count, and Start becomes available after successful loading. Returning players can continue their save. There is no artificial minimum loading delay. Reduced motion freezes decorative animation.

Animation normalizes Modern Interiors’ right/up/left/down order and Fungus Cave’s down/left/right/up order to consistent runtime directions. Idle uses a dedicated idle frame; movement uses walking frames. Added verification compares actual pixels to original crops, and simulates several minutes of meetings, conversation, returns, collision and low-frame-rate movement.

The intended experience is a friendly adventure about becoming confident at mental arithmetic. Players walk, meet neighbours, choose a method, answer a short challenge, and see their help change the settlement. Maths is the action that moves the story forward.

## Core and longer loops

Walk → speak → solve → receive feedback → finish a quest → restore a landmark → explore further. Nine quests require 49 correct answers in total. Wrong answers offer a method and a fresh attempt; they do not erase completed quest steps. Three lost hearts on a story quest trigger a recovery rather than a game over. Hearts are a feedback signal, not an economy resource.

Across sessions: choose a companion, save for three cosmetic village upgrades, restore two cave gates, finish the king’s lantern, revisit mistakes, and practise chosen skills. A daily seeded trail gives one coin reward per UTC date; the one minute arena supplies a personal speed target. There is no public ranking or purchase advantage.

## Meaningful choices

- Choose which initial neighbour to help after the introduction. Bram and Fern both unlock Ada’s route; Noor’s discount quest is also needed for the final lantern.
- Choose accuracy-focused training or a timed sprint. The story has no deadline.
- Choose a method hint when stuck. Results report hint use without withholding story progress.
- Spend coins on flowers, trail lights or a picnic corner. The effects appear in the world.
- Choose a cat, frog or solo walk after earning companions.

## System ownership and boundaries

`content.js` owns immutable quests, prerequisites, NPC locations and shop prices. `questions.js` owns question generation and strict numeric matching. It returns a complete answer and method together, avoiding a separate inconsistent answer source. Decimal questions use integer tenths before conversion; division and fractions start from divisible amounts.

`progress.js` owns the save schema and reward/purchase transactions. Quest IDs are unique, prerequisites are checked again at reward time, and completed quests never pay twice. Cosmetics cannot overdraw coins. Unknown save versions start fresh; corrupt numeric values are bounded. Storage failure leaves a playable in-memory session and a visible saving notice.

`World` owns movement, collision, BFS navigation, camera, sprites and minimap. DOM controls offer another route to each NPC so canvas pointer precision is optional. `main.js` coordinates application startup, quest flow, input and challenge lifecycle. `battle-session.js` owns question progression, scoring, hearts, retries and elapsed time; `battle-ui.js` owns the challenge markup and its event bindings. `world-panels.js` groups companion care, the country map, supplies and settings without creating another save store. The modal pauses movement. Pausing retains the actual DOM nodes, including the typed answer and feedback. Tab hiding pauses challenges and clears held movement keys.

## Feedback map

Correct answer → sound, spark animation, points, streak → visible confidence. Incorrect answer → method, revision note, reset streak → targeted later practice. Quest completion → one-time coins/XP, unlocked route and changed scenery → reason to explore. A saved mistaken question → later correct revision → note removed. Daily practice → small capped coin reward → repeated practice without an unlimited same-day coin loop.

## Decisions and tradeoffs

The runtime uses Canvas and plain JavaScript instead of a large game engine. This keeps the game small, static-hostable and independent of maths APIs. The village environment is built from code and the paid artist’s furniture/characters; the cave uses the supplied cave tiles. Animation frames are cropped locally. Paid source images remain private; the public release embeds the exact game-only crops into its compiled JavaScript.

The save is local and editable by its owner. It is not an anti-cheat system. There is no server or cross-device sync. Questions train mental arithmetic, not a complete grade syllabus. Numerical size settings describe difficulty without claiming grade certification. No study efficacy measurement or reward eligibility has been established.

## Verification and playtesting boundary

Automated checks cover 24,000 independently parsed equations, input validation, deterministic daily seeds, quest gates, duplicate rewards, shop transactions, reload safety and reachable NPCs. Browser verification uses actual UI actions and visible question text rather than editing save state to claim completion. Target-player fun, retention and learning improvements need independent human playtesting; automated completion does not prove them.
# Dustlight wardrobe and frontier revision

Experience target: players express a personal traveller through a free, immediately readable wardrobe, then help neighbours in a dusty frontier settlement through maths. The catalogue has 12 silhouettes, nine skin tones and three coordinated colourways, baked into 324 unique sprite strips before the release. All walking directions and portraits share those final pixels.

The cosmetic loop is browse → preview → adjust style/skin/colour/name → wear → explore. Appearance is a draft until Apply; cancellation discards it. There is no coin cost, statistical advantage, random unlock or generation wait. The existing maths/quest/economy loop stays intact. Old saves gain an appearance without losing quests or rewards.

The reference portrait informed a black pork-pie hat, glasses and goatee. Western atmosphere comes from sandstone, cacti, timber fronts, dust, a caravan and a deputy. Cal and Mae add a fifth authored meeting, with reciprocal ratio/lemonade dialogue. The caravan is solid; nearby actors and the cave route remain reachable. Paired actors temporarily stop ambient wandering until their meeting ends.

Verification covers legacy save migration, selected-character persistence, catalogue completeness, every atlas coordinate, final-pixel uniqueness, portrait consistency, five routine pairs, caravan collision and mobile wardrobe browsing. Manual browser checks cover cancelling, applying, searching, paging and the intro/world/battle use of the selected character. These checks establish software behaviour, rather than organiser acceptance or learning outcomes.

