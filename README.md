# MATH WARFARE

A small pixel arcade for mental arithmetic. Solve questions, build a streak and review the calculations that slowed you down.

**[Play the game](https://hustlenix.github.io/math-warfare/)** · [Stardance project](https://stardance.hackclub.com/projects/45075)

## The idea

Lalith's original project description identifies slow basic calculations during exams as the motivation. This game offers repeatable arithmetic practice; it does not claim to improve exam scores or replace a maths curriculum.

## Play

1. Optionally enter a callsign. Choose a mode, difficulty and at least one operation.
2. Start the run. Type an answer or use the on-screen number pad.
3. Press **Enter** or **Check**. Build a streak with correct answers.
4. At the end, review accuracy, average answer time and missed questions. **Practise missed questions** replays those exact equations without a timer.

| Mode | Behaviour |
| --- | --- |
| Adventure | 10, 20 or 30 questions. Each question has a clock; every tenth is a boss worth triple points. |
| Speed sprint | One 60-second clock for the whole run, including feedback. |
| Practice room | A fixed number of questions with no time limit. |

| Difficulty | Numbers | Adventure clock |
| --- | --- | --- |
| Rookie | Whole numbers, non-negative subtraction, multiplication tables up to 12 (15 at bosses) | 15 seconds; 20 at bosses |
| Tactician | Negative numbers, decimals, multiplication up to 20 | 12 seconds; 18 at bosses |
| Boss level | Larger numbers and multiplication with decimals | 10 seconds; 15 at bosses |

Answers are exact, with at most two decimal places. No rounding is required. Division is constructed from a known quotient and divisor.

## Controls and accessibility

- **Enter:** check the answer; continue after a miss.
- **Esc / Pause:** pause. Esc closes the pause dialog and resumes.
- **Sound on/off:** toggle synthesized sound effects; the setting is saved locally.
- **Number pad:** digits, decimal point, negative sign, clear and backspace.
- Switching to another tab automatically pauses the game. Return and choose Resume.
- Keyboard focus, semantic form labels, a skip link, status messages and reduced-motion support are included.

## Scoring and progress

A correct answer starts at 10 points. Every third consecutive correct answer increases the multiplier, up to 5×. Boss questions add another 3×. A wrong answer, skipped question or timeout earns zero and resets the streak. Accuracy includes all completed attempts; average answer time includes submitted answers and excludes paused time and feedback.

Run history, preferences and sound settings live in the browser's localStorage. Best scores compare the same callsign, mode, difficulty, operations and run length; missed-question practice is separate. The previous warfare_xp totals remain and receive new earned points. If storage is blocked, progress is kept for the current session only.

There is no global leaderboard, account system or score server. The previous simulated global board and external meme requests were removed. Clearing browser data removes saved progress. Progress does not sync between devices.

## Run locally

Requires Node.js 22+ and npm. The inner math-warfare directory is the Vite app.

```sh
git clone https://github.com/Hustlenix/math-warfare.git
cd math-warfare/math-warfare
npm ci
npm run dev
```

Vite prints the local URL. From that same directory:

```sh
npm test
npm run build
npm run preview
```

The outer repository has matching dev, test, build and preview wrapper scripts after the inner dependencies are installed. Production files are generated in math-warfare/dist. No API keys or .env file are required.

## Source map

- math-warfare/index.html — screens and accessible controls.
- math-warfare/src/styles.css — custom cream, plum and moss pixel-arcade theme.
- math-warfare/src/main.js — screen flow, active-time clocks, pause, input, results and replay.
- math-warfare/src/engine/questions.js — exact question generation and calculation tips.
- math-warfare/src/engine/session.js — answer validation, scoring and run statistics.
- math-warfare/src/engine/storage.js — local persistence and session fallback.
- math-warfare/src/fx/audio.js — existing WebAudio sound synthesis.
- math-warfare/public/frontier.svg and calculator.svg — original pixel scenery and sprites.
- math-warfare/tests/engine.test.js — arithmetic, validation, score and storage regression tests.
- .github/workflows/deploy.yml — test, build and publish to GitHub Pages on pushes to master.

## Verification

The automated suite contains 18 tests, including 6,000 generated equations across all difficulties and operations. It covers exact decimal products, input validation, scoring, boss rewards and unavailable storage. Browser checks cover completed rounds, mistake review, targeted replay, keyboard/number-pad input, pause/resume and responsive layouts. These checks verify game behaviour, not educational effectiveness.

## Credits and AI disclosure

- Project owner and original concept: Lalith / [Hustlenix](https://github.com/Hustlenix).
- Vite and vanilla JavaScript; no UI framework or CSS template.
- Press Start 2P by CodeMan38, bundled locally under the SIL Open Font License; see public/FONT-LICENSE.txt.
- The October 11, 2026 pixel-arcade revision was implemented with substantial Codex AI assistance, including the HTML/CSS, game-flow revision, artwork code, tests and this factual README. The earlier sound module was retained from the existing project.

**Stardance eligibility is not asserted.** The reviewer cited a maximum 30% AI-use rule. This revision has not been measured against that rule and must not be described as independently human-authored. Review the assistance with the organisers before requesting re-certification. No devlogs, personal work hours or recertification request were generated or submitted by this revision.
