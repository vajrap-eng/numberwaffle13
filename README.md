# Number Waffle

A hard number-swapping puzzle that runs in the browser, with six game modes.

**Play it:** https://vajrap-eng.github.io/numberwaffle13/

## How to play

The board is a waffle: full rows and columns of number tiles, with clue circles in the holes.

- Every **full row and full column** holds each number from 1 to N exactly once (N is the grid size).
- Each **clue circle** names a sum. The two tiles its arrows point at must add up to it. The circle turns green when they do.
- A tile **turns green and locks** once it's in its final spot (except in Fog).
- **Swap** tiles by tapping two of them, or drag one onto another. Keyboard: arrow keys to move, Enter or Space to select and swap, Esc to cancel.
- Solve the board before your swaps run out. The game shows the **minimum** number of swaps the board needs, so you always know how much slack you have.

Hover a clue to outline the two tiles it adds up. Selecting a tile shades its row and column.

## Game modes

| Mode | Grid | Tiles out of place | Spare swaps | What makes it hard |
|---|---|---|---|---|
| **Daily** | 13×13 | 80 (40 swaps) | 4 | Everyone gets the same board each day and only your first try counts. Builds a day streak. |
| **Classic** | 13×13 | 80 (40 swaps) | 5 | The original game. |
| **Giant** | 17×17 | 140 (70 swaps) | 8 | Numbers 1–17, 225 tiles to track, and less slack for the size. |
| **Fog** | 11×11 | 52 (26 swaps) | 12 | Tiles never lock or turn green, so you can't tell right from wrong by colour. You only see clashing numbers (orange) and satisfied clues. Any arrangement that meets every rule wins. |
| **Blitz** | 11×11 | 52 (26 swaps) | 6 | A 2:30 countdown. |
| **Perfect** | 9×9 | 28 (14 swaps) | 0 | No spare swaps at all: every swap has to put both tiles in place. |

Each mode tracks games played, win rate, streak and best time in your browser (`localStorage`). After a game you can copy a spoiler-free result to share.

## Why every puzzle can be solved

1. **Build a solved board first.** Rows and columns are filled from a shuffled Latin square, so every line is a permutation of 1…N. Clue sums are read off this solved board.
2. **Scramble with disjoint swaps.** The generator makes *k* swaps between pairs of tiles holding different numbers, and never touches a tile twice. That puts exactly 2k tiles out of place. One swap can fix at most two tiles, so the board needs at least k swaps, and undoing the k scramble swaps does it in k. **The minimum is exactly k.**
3. **Budget = minimum + spare swaps.** Since the budget is never below the true minimum, every mode can be solved, Perfect included. The win check tests the *rules* (lines and clues), so any valid answer counts, not just the generated one.
4. **Daily is seeded** from the local date (`mulberry32` seeded with an FNV hash of `YYYY-MM-DD`), so everyone gets the same board each day.

`test/solvable.cjs` checks this in a real browser. It plays every mode through the game's own swap code and confirms each board is solved in exactly the minimum swaps. It also checks that Daily is the same on every load, that Blitz times out, that Fog never locks tiles and flags clashes, and that keyboard swaps work.

## Redesign plan

This is the plan the redesign followed:

1. **Fix the base.** The original `numberwaffle13.html` had been saved as RTF, so browsers couldn't run it. Turn it back into real HTML and keep the original game (now Classic).
2. **Make the size configurable.** Remove the hard-coded 13 so one engine runs 9×9, 11×11, 13×13 and 17×17. The board resizes to fit the screen.
3. **Give each mode one main challenge** (size, information, time, precision or a shared daily board), and tune it so it's hard but fair. The table above lists the numbers.
4. **Keep solvability provable.** Leave the disjoint-swap scramble in place so the minimum is always known, and test every mode automatically.
5. **Add interaction:** mode tabs (with linkable `#mode` URLs), timer, clue hover outlines, row/column shading, keyboard play, how-to-play and result dialogs, stats, sharing, and a win animation.
6. **Ship:** README, then publish on GitHub Pages from `main`.

Ideas for later: an optional hint that costs swaps, a calendar of past Daily puzzles, colour-blind tile patterns.

## Run locally

It's a single HTML file with no build step:

```sh
python -m http.server 8765
# open http://localhost:8765/
```

Run the checks (needs Node and Playwright):

```sh
npm i -D playwright && npx playwright install chromium
node test/solvable.cjs
```

## Files

- `numberwaffle13.html`: the whole game (HTML, CSS and JS)
- `index.html`: sends visitors from the site root to the game
- `test/solvable.cjs`: browser checks for solvability and the mode rules
- `numberwaffle13.rtf`: the original upload, kept for reference
