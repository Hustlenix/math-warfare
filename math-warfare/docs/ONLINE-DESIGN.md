# Fullscreen frontier and guest rooms

The player explores a village, notices a neighbour's problem, solves a short maths challenge, sees the village improve and chooses the next destination. Online rooms add a separate loop: invite friends, explore together, choose a skill, calculate the same five questions, compare room scores and rematch. The full viewport belongs to the world; journal, training, wardrobe and settings open only when requested.

## Boundaries and owners

| State                                 | Owner and initial value                     | Bounds and visible evidence                                                                             |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Solo quest progress, coins, XP, notes | Existing local save                         | Nine quests; one-time rewards; HUD and journal                                                          |
| Appearance and nickname               | Local save; selected baked character        | 324 IDs, 24-character sanitized name; portrait and avatar                                               |
| Guest room membership                 | Host; one player on creation                | Four players; code, roster and crew counter                                                             |
| Position, facing, zone                | Each guest provides their own pose          | Clamped map coordinates, four directions, two maps; cyan remote avatar and minimap dot                  |
| Active question, answer and deadline  | Host                                        | Five rounds, 18 seconds each; question and countdown. Answer stays on the host until the solution phase |
| Race scores and attempts              | Host; zero points and attempts per new race | Three tries per question; correct answer can score once; shared scoreboard                              |
| Connection lifetime                   | PeerJS/WebRTC                               | Room disappears when host leaves; disconnected players removed; visible error/retry                     |

The game opens no online connection during solo loading. Creating or joining a room lazy-loads PeerJS 1.5.5, contacts its public signaling service and establishes data channels. The static GitHub Pages release needs no server account. No camera, microphone, login, persistent online leaderboard or cloud save is requested. A room host can inspect or change their own game; this is friendly private competition, not an anti-cheat platform.

## Time and feedback

Movement is sent on changes at up to 10 Hz; host snapshots run at 5 Hz. Rendering remains in the local animation loop. Connection attempts time out after 15 seconds; unregistered channels close after seven seconds. The host accepts answers only in the active round before its deadline, rejects stale rounds and throttles retries. Correct answers earn 10 points plus up to three timing points. Solving early never grants persistent coins or XP. Everyone solving ends the round early; otherwise the deadline advances it. A 2.8-second solution phase gives everyone a breather. Late joiners spectate until the next race.

The solo meta loop remains: solve → earn local reward → choose companion or cosmetic village upgrade → explore again. Online success leads to a new shared skill choice, with scores reset for each race. Losing a race never removes learning progress or resources. No compounding stat advantage exists.

## Interaction and recovery

The small quest chip opens a keyboard-trapped native journal drawer. Choosing a neighbour closes it and walks to that neighbour. J opens the journal, P trains, O opens online, C changes character, F toggles native fullscreen. Escape closes menus or pauses solo challenges. Fullscreen CSS does not depend on native fullscreen support. Touch arrows and the action bar remain within the viewport.

Joining must receive a host snapshot that contains the guest's actual peer ID before showing connected. A room code alone is not success evidence. Disconnection removes avatars; losing the host ends the room with an explanatory message and preserves the local adventure. Back to village hides the race UI without repeatedly reopening it. Room lobby lets participants return to a running race. Solo challenges do not freeze a shared deadline or get interrupted by incoming room updates.

## Dependencies and practical limits

[PeerJS getting started](https://peerjs.com/client/getting-started), [API](https://peerjs.com/client/api/peer), and [FAQ](https://peerjs.com/client/faq) describe public signaling and WebRTC connectivity. The current build uses the SDK's default ICE configuration and no paid TURN service. Some restricted firewalls or symmetric NAT combinations cannot establish a channel; the UI reports failures and offers retry. Public signaling availability is an external dependency. A two-client same-computer browser test proves real data channels and game flow, but cannot establish connectivity for all networks.

## Verification and edge traces

- First use: intro loads real artwork; solo start explains controls; online start enters guest lobby directly.
- Typical: host creates → guest joins → both see roster → remote walking → same equation → host validates answers → identical scoreboards → results → rematch.
- Recovery: wrong answer gives a method; three failed attempts wait for solution; timeout gives no points; room disconnection preserves solo save.
- Exploit: duplicate correct answers, stale-round answers, post-deadline answers, non-numeric strings, oversized packets and excess membership cannot earn additional points through the normal host rules.
- UI: desktop and phone world cover viewport; drawer traps focus; native fullscreen is optional; closing a race returns control to the world.

`scripts/check-online.mjs` checks code/profile bounds, private answers, score ownership, duplicate prevention, attempts, deadlines, five-round completion and disconnect cancellation. Transport acceptance requires actual connected browser clients; see the accompanying release verification report for the tested build and observations.
