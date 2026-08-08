# Math Warfare: Omega Ultra

Neo-brutalist math battle game built with Vite, Tailwind CSS 4, and canvas-confetti.

## Features

- 3 modes: BASIC (1–50 ints), PRO (1-decimal reals, −50–50), GOD/CHAOS (up to ±1000, 5s timer, screen tilt/flag)
- Multi-select operations (+ − × ÷) with an exact division engine (no remainders, no repeating decimals)
- Combo multipliers (x1 → x2 → x3...), streak shields every 15 streak (max 2), boost die every 5 correct answers (2× POINTS / REVEAL / BOMB)
- Boss rounds every 10th question: 5× XP, bigger ranges, longer timer, horn + banner
- Revenge question on misses: REDEEM YOUR PRIDE! — 5s to re-answer for half XP
- Personal best + rank ladder (PAPER TIGER → OMEGA OVERLORD) per player, rank-up stamps, XP deltas vs last battle
- Meme engine (meme-api.com → imgflip fallback → inline SVG badges), WebAudio synth with mute, Esc pause, local + simulated-global leaderboards
- Neo-brutalist design: hard black borders, offset shadows, Bungee + Outfit, zero gradients/glassmorphism

## Install

```sh
npm install
```

## Run (development)

```sh
npm run dev
```

## Build (production)

```sh
npm run build
```

The game lives in this folder; the repo root has a wrapper `package.json` so all of the above commands also work from `C:\Users\LalithReddy.b\MATH-Warefare`.
