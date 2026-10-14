# The Last Lantern — design and engineering report

The player should understand why a calculation matters by inspecting supplies, solving a practical task, and seeing the settlement change. This is a design target, not a measured learning outcome.

## Confirmed baseline issues

- Mira's repair dialogue led to bare random equations with a generic practice creature. There was no visible supply model.
- Completion led with accuracy, elapsed time and streak, rather than the repaired landmark and next neighbour.
- Practice and Online occupied the exploration action bar even before the first quest.
- The prior source repair separated battle state/UI but its browser timer and lifecycle still lived in the application entry point.
- The two READMEs duplicated a long feature inventory and left little room for the owner's explanation.

The prior repair's NPC route-precedence fix, collision-aware schedules, paused timers, save transactions, camera culling and minimap cache were retained. They were already covered by the baseline's 40 passing checks.

## Implemented loop

Inspect the neighbour's problem → inspect quantities → calculate → see task feedback → advance to save a checkpoint → complete the quest → see its world effect → follow the next objective.

Mira alternates combining delivered stock and finding a missing supply. Bram displays equal bread baskets and packs an order. Fern divides a pool of water among equal beds; a correct answer fills every displayed allocation. Noor computes the final sale price after a discount. Ada joins decimal route sections, Scout sets a gear lock, Pip shares soup, Ivo prepares remaining rations, and the king combines those task types into the last repair.

This uses a dedicated contextual generator, not captions added to arena equations. Practice, daily, revision and multiplayer keep the existing maths generator and rules.

## Ownership and compatibility

- quest-tasks.js: contextual generator, effect descriptions and world receipt rendering.
- quest-ui.js: quantity presentation, resolution feedback and quest completion panels.
- battle-session.js: answer validity, score, hearts, task index and duplicate-answer guard.
- battle-controller.js: rendering coordination, browser timers, pause/resume, records and reward handoff.
- progress.js: bounded optional questWork and questResults fields on the existing version-1 save; unchanged save key and quest IDs.
- world.js: calls the effect renderer and reports nearby interactions while retaining its existing simulation/render optimizations.
- game-theme.css: shared palette and quest-component ownership. Older layout/style files remain to preserve the other interfaces; they have not all been consolidated.

Checkpoints save when the player advances after a correct answer. Reloading an unfinished task repeats that task; typed text and in-progress battle timing are not persisted. This avoids awarding a task from a partially entered answer. Session accuracy uses only answers from the current session, including after a checkpoint resume.

Completed quest IDs remain authoritative for permanent effects and rewards. Old saves therefore gain the new delivery/watering/market markers without a second reward. New completed orders and prices also retain the final checked quantity. Mira's existing square lantern and the existing cave gates/final light keep their original completion conditions.

The retained legacy engine is still used by historical tests, not the active game. No dependency or framework was added. Licensed artwork and catalogue assets were not edited.

## Presentation and onboarding

The opening names The Last Lantern and states the fading-light problem. Its progress display still uses actual artwork loading. Quest challenges show quantities in parchment/timber frames rather than unrelated creatures. Quest completion reports the world change, reward, unlock and next neighbour. Practice retains its session statistics.

Practice and Online remain in the journal and on their keyboard shortcuts but leave the exploration action bar. Nearby prompts name the available neighbour; visible name cues now use the same 2.4-tile radius as interaction.

The requested first-five-minute sequence is a target. No artificial wait was added. An agent-driven browser playthrough can verify transitions; it cannot establish that fresh human players understand, enjoy or complete the experience in five minutes.

## Verification boundaries

Regression checks cover contextual quantities for all nine quests across three difficulties, old saves, checkpoint restoration, wrong-answer recovery, all story rewards and duplicate submissions. Existing suites still cover routes, collisions, companions, wardrobe, online model, practice and runtime pause/culling behavior.

Before/after screenshots and production-browser results are recorded in the delivered evidence report. Physical touch devices, real network multiplayer, independent human playtest feedback and Stardance eligibility remain separate checks. No human playtest feedback has been invented.
