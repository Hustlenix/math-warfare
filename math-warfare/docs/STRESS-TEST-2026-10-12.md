# Stress test: 12 October 2026

The game is JavaScript, Canvas and Vite, rather than a Godot export. The review applied the requested Godot skills' applicable principles: responsive controls, touch ownership, focus handling, pause/lifecycle boundaries, collision checks and authoritative rewards.

## Findings fixed

| Finding | Change | Evidence |
| --- | --- | --- |
| World redraws continuously while paused behind dialogs and the intro | Retain the last frame; redraw on resize/settings invalidation; skip simulation and drawing while hidden | Live baseline: 513,524 world `fillRect` calls in 2.01 seconds behind settings. Modified build: zero in 2.00 seconds. Regression covers 1,000 paused and 1,000 hidden frames. |
| Static minimap collision terrain rebuilt every frame | Cache one small terrain layer; invalidate for map or completed-quest changes | Gate-open and map-switch regressions. After minimap caching and camera culling, active drawing fell from 4,458 to 876 world rectangle calls per frame, approximately 80.3%, in 320×568 browser samples. |
| Off-camera scenery still submitted thousands of drawing calls | Cull world rectangles, sprites, characters and labels against camera bounds; retain screen-space minimap drawing | Camera-edge/HUD regression and rendered phone screenshot. |
| Caps Lock/Shift makes WASD stop responding; keyboard/touch can cancel one another | Normalize letters; track each keyboard key and pointer as an independent source; clear all sources on interruption | Regressions cover uppercase letters, modifiers, three fingers, keyboard overlap and interrupted input. |
| Some phone buttons measure only 31–38px wide/high | Minimum 44px HUD/action targets, constrained footer grid and smaller dialog padding | 320×568 layout measured without horizontal page overflow; all main HUD, footer and trail targets meet 44×44px. |
| Mobile cutouts were not requested by the viewport meta tag and compact layout overrode inset rules | Add `viewport-fit=cover` and inset-aware HUD, trail tools, online badge, d-pad, drawer and footer spacing | CSS review and browser resize checks. Physical notch/gesture-bar verification remains pending. |

## Executed checks

- 33 adventure/runtime tests pass, including the original 24,000-question independent equation check and five new regressions.
- 18 legacy engine tests pass.
- Deterministic stress seed `20261012`: 240,000 independently parsed maths questions; 1,000 full story/save loops with duplicate reward rejection; 2,000 random country routes; 100,000 collision-checked movement steps at simulated 20/30/60/120 FPS; 1,000 four-player five-round race simulations; 10,000 malformed-save/profile cases. All pass.
- Browser layouts inspected at 320×568, 360×640, 390×844, 844×390, 768×1024, 1366×768, 1920×1080 and 2560×1080; no horizontal page overflow.
- Real browser training: malformed numeric input rejected without losing hearts; one wrong answer produced the method and revision note; nine correct answers completed practice with 90% accuracy and 45 XP.
- Real PeerJS signaling and WebRTC: two compiled-game browsers completed five shared rounds with identical questions and 65 points each; final scoreboard agreed. A development-server reload interrupted an earlier test run; guest recovered to the connection-error screen.
- Production build and `verify-release.mjs` pass. Game-specific licensed crops remain embedded in compiled code; original artist sheets and raw PNGs are excluded.

## Reproduce

```sh
npm ci
npm test
node --test tests/engine.test.js
npm run stress
python scripts/import-art.py
npm run build
node scripts/package-release.mjs
node scripts/verify-release.mjs
npm run preview
```

Run from `math-warfare/`. Importing requires the owner's licensed local artwork packs and Pillow. The stress script accepts an optional output JSON path. Stress tests exercise local simulation; they do not flood GitHub Pages or the public signaling service.

## Limits

Browser viewport emulation and CPU slowdown do not establish physical Android/iOS performance, touch latency, heat, battery use, native keyboard/cutout behavior, gamepad support, Safari compatibility, or broad network connectivity. No paid TURN relay exists, so some networks may still fail to connect. The 611.21 kB minified main chunk remains above Vite's advisory size threshold; most of its transfer cost is embedded artwork. Baseline navigation finished in 1.47 seconds in this browser, but cache was involved, so that is not a cold-network benchmark. FPS was already near 60; drawing-call reduction is a workload measure, not a claimed FPS increase.
