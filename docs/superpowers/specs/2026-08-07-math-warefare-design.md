# MATH-Warefare: Omega Ultra — Design Document

Date: 2026-08-07
Status: Approved

## 1. Overview

MATH-Warefare is a full-stack math quiz game: an upgrade port of the single-file
`stellar.html` prototype (neo-brutalist quiz with modes, combos, memes, sounds)
into a proper deployed Next.js project with accounts, a real database, a global
leaderboard, a stats dashboard, and a 2-player duel mode.

It satisfies the project requirements: full-stack website (HTML + CSS + JS,
framework optional), public repo with frequent commits and a good README,
devlogs, no AI one-click builders, fully deployed (not localhost), custom
UI/CSS, and real features (auth + API + database + dashboard).

## 2. Architecture

- **Framework:** Next.js (App Router, TypeScript) deployed on Vercel.
- **Database:** Neon Postgres (Vercel integration) accessed via `pg` with raw
  parameterized SQL. No ORM. `schema.sql` applied by a small migrate script.
- **Auth:** Hand-rolled. bcrypt(12) password hashes; login issues a
  `crypto.randomBytes(32)` session token stored in `sessions`, delivered as an
  httpOnly, secure, sameSite=lax cookie with 7-day expiry.
- **Styling:** Hand-written custom CSS (neo-brutalism), no framework. Fonts:
  Bungee (display) + Outfit (body) via Google Fonts. Confetti via
  canvas-confetti CDN.
- **Pages:** `/` landing + leaderboard preview, `/game` single-player,
  `/duel` two-player rapid-fire, `/login`, `/signup`, `/dashboard` (protected).
- **API routes:** `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`,
  `/api/auth/me`, `/api/games` (POST result, GET history), `/api/leaderboard`
  (GET), `/api/memes` (GET, SFW-filtered, no-repeat).

### Meme engine

- Server fetches from meme-api.com using wholesome/study subreddits.
- Responses with `nsfw: true` are rejected server-side.
- Seen meme IDs are recorded in `seen_memes` so nothing repeats (global pool).
- A built-in static list of family-friendly study memes (image URLs) serves as
  the offline/fallback pool.

## 3. Data model

```sql
users(id uuid PK, email text UNIQUE, password_hash text, display_name text,
      xp int default 0, created_at timestamptz)

sessions(id uuid PK, user_id fk, token text UNIQUE, expires_at timestamptz)

games(id uuid PK, user_id fk, mode text,        -- 'solo' | 'duel'
      class_level int, chaos text,              -- 'chill' | 'normal' | 'chaos'
      operations text[], score int, total int,
      xp_earned int, duration_sec int, created_at timestamptz)

duels(id uuid PK, p1_id fk, p2_id fk, rounds int, winner_id fk NULL,
      class_level int, chaos text, created_at timestamptz)

seen_memes(id serial PK, meme_id text UNIQUE, created_at timestamptz)
```

Ranks are computed from `users.xp`, no table:

| Rank | XP |
|---|---|
| Private | 0 |
| Corporal | 250 |
| Sergeant | 600 |
| Lieutenant | 1200 |
| Captain | 2000 |
| Major | 3500 |
| Colonel | 5500 |
| General | 8000 |

## 4. Game design

### Class 1–12 question tiers (answer always a number)

- C1: add/sub 1–20
- C2: add/sub to 100, ×2/5/10
- C3: 3-digit +/−, tables to 10, ÷
- C4: tables to 12, ÷ with remainders
- C5: decimals (+/×), fraction basics
- C6: negatives, fractions, ratios
- C7: percentages, powers (x², x³)
- C8: squares, √, percentage applications
- C9: exponent laws, algebraic evaluation
- C10: quadratics, sin/cos/tan values, arithmetic progressions
- C11: logs, sequences, function evaluation
- C12: simple derivatives, sigma sums

### Chaos knob (picked alongside class)

- chill: 15 s/question
- normal: 10 s/question
- chaos: 5 s/question + screen tilt/shake

### Operations

+ − × ÷ available all classes; ÷, powers, square roots, percentages, trig
unlocked per class tiers above.

### Single player

10 questions (configurable 1–100). Combo multiplier: every 3-streak bumps the
multiplier (x2, x3, …). XP = 10 × multiplier. Meme blast at streak 5/10/15 and
on game end. Confetti + WebAudio SFX (correct/combo/wrong) preserved from the
prototype.

### Duel (rapid-fire)

Best of 5 rounds on one keyboard. Both players pick class + chaos together.
Same question shown; first correct answer wins the round; simultaneous correct
(within the same tick) = re-question. Winner gets a victory meme + confetti and
a winner XP bonus; both players earn XP. A `duels` row records the outcome.

## 5. Auth, security & guardrails

- Signup: email + password + display name; bcrypt(12); duplicate email → 409.
- Login: verified hash → new session token; cookie httpOnly + secure +
  sameSite=lax; 7-day expiry; logout deletes the session row.
- Rate limiting on login/signup (in-memory, per-IP and per-email).
- All route handlers validate input with zod; parameterized SQL only.
- `/dashboard` and `/api/games` require a valid session token (401 otherwise).
- API errors return `{error: string}` with proper status codes; client shows
  neo-brutalist toast banners. DB failures degrade to guest mode (local scores,
  no ranking).

## 6. Dashboard

Protected page showing:

- Rank title + XP progress bar to next rank.
- Last 20 games (class, mode, score, XP, date).
- Per-game XP bar chart (hand-rolled SVG, no chart library).
- All-time global leaderboard position.

## 7. UI/UX

- Neo-brutalist style preserved: yellow dot-grid background, white cards with
  8px black borders and hard 15px shadows, chunky Bungee typography, pressable
  buttons with offset shadows.
- Screens: start → quiz → results with pop-in animations; wrong-answer screen
  shake; chaos tilt; meme overlay with caption ("BIG BRAIN!" / "L + RATIO!").
- Mobile-responsive (90% max-width 450px card on phones, centered).

## 8. Repository, devlogs & deployment

- Public GitHub repo named MATH-Warefare; frequent commits with clear messages.
- README: features, screenshots, tech stack, local setup, deploy notes.
- Devlogs in `docs/devlogs/` (one per working session, date-stamped).
- Deployed to Vercel (frontend + API) with Neon Postgres.
- `schema.sql` migration run as part of setup and documented in README.

## 9. Error handling & testing

- Question generator lives in a pure TypeScript module (`lib/questions.ts`)
  with Vitest unit tests (validity per class tier, answer correctness).
- API routes validated with zod; integration smoke tests for auth flow
  (signup → login → me → logout) with Vitest + a test database.
- Server errors never leak stack traces to the client.

## 10. Out of scope (YAGNI)

- No email verification, password reset, OAuth, or 2FA.
- No multiplayer over the network (duel is local hot-seat).
- No PWA/offline app shell beyond static fallback memes.
- No leaderboard pagination beyond top 50 + player position.
