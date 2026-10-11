# Country and companion revision

The old 33×25 village becomes a 60×44 countryside (2,640 tiles), while the cave remains 33×25. Existing quest locations and saved progress remain compatible. Copperfield's fenced beds move farming away from the old south walking space. The centre/cross aisles, fence gates, ranch lane and two creek bridges create readable routes through distinct places.

`map-layout.js` owns dimensions, roads, the planted bed mask, fence mask, creek openings and solid building/tree footprints. Rendering and collision consume those same coordinates, instead of drawing walk-blocking scenery independently. Save and peer profiles use per-map dimensions. Four journal/map destinations expose optional skill practice or pet care without adding duplicate quest rewards. Wren and Bo have collision-aware patrols, an exchange, and return-home behaviour.

`Companion` owns its position, direction, route, delayed hero trail, Follow/Stay mode, idle time and temporary affection. Hero tile changes append breadcrumbs; the pet walks a BFS route to earlier breadcrumbs and leaves two tiles of separation, preventing its sprite from appearing on a tall hero's head. It does not directly lerp to the hero. Route speed is bounded, obstacles are respected and map transitions reset to a free adjacent tile. Recall replaces stale breadcrumbs with a route that stops near the hero. Stay is session-only; names and selected species are saved with the existing version-1 adventure schema.

Cat walking uses small original pixel poses in four directions. Idle feet stop; seven seconds of rest use the owned curled animation. The frog remains a licensed animation, with a movement-only hop. Pets sort by ground depth with the hero/NPCs. Affection lasts three active seconds and has no gameplay advantage or persistent currency value. No upkeep, hunger or loss mechanics were added.

New online rooms use protocol 2 so earlier clients with small-world position limits cannot join the expanded map by mistake. Shared avatars retain expanded coordinates. Pets, NPC routines, quest progress and currencies remain local; races keep their existing host-owned rules.

Regression checks cover districts and old paths, bed/path separation, bridges, cave bounds, pet obstacle routes at 20 FPS, no teleport catch-up, Stay/Recall/affection, four-direction rendering, small naps, legacy saves, pet-name sanitization and multiplayer position bounds. Browser checks should use real unlocks and controls, verify layout on desktop/mobile, and verify the deployed release before calling publication complete.
