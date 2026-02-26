# GUESS.EXE

A retro-terminal number-guessing game built with vanilla HTML, CSS, and JavaScript.

## Quick start

```
# No build step — just open in a browser
open index.html
```

## Repo layout

```
guess-exe/
├── index.html          ← HTML shell (imports only)
├── css/
│   ├── base.css        ← Reset, :root vars, body
│   ├── housing.css     ← Device housing, screws, vents
│   ├── screen.css      ← CRT terminal, log, range display
│   ├── scoreboard.css  ← Dot-matrix scoreboard
│   ├── controls.css    ← Battery, bulbs, keypad
│   ├── effects.css     ← Jackpot, range takeover, flashes
│   ├── stats.css       ← Stats slide-out panel
│   ├── splash.css      ← Splash / boot screen
│   ├── tutorial.css    ← First-run tutorial overlay
│   └── responsive.css  ← All @media queries
├── js/
│   ├── audio.js        ← AudioContext + all synth sounds
│   ├── ui.js           ← Scoreboard, battery, bulbs, keypad display
│   ├── dialogue.js     ← Log output + 5-tier dialogue pools
│   ├── stats.js        ← localStorage helpers + stats panel
│   ├── effects.js      ← Celebrations, fireworks, range animations
│   ├── tutorial.js     ← 7-step first-time tutorial
│   ├── splash.js       ← Boot sequence + callsign entry
│   └── main.js         ← Game state, init, core loop, events
└── README.md
```

## Architecture notes

* **Zero dependencies** — no frameworks, no build tools, no npm.
* **Shared state** lives on `window.GUESS` (created in `main.js`).
* **Script order matters**: `audio → ui → dialogue → stats → effects → tutorial → splash → main`.
  Each file's functions are global (`function` declarations), so later scripts can call earlier ones.
  `main.js` loads last because it wires everything together.
* **CSS is split by component**; all `@media` queries are collected in `responsive.css`.
