// Plays every mode in a real browser and checks it can be solved in exactly the minimum swaps.
// Run: npx -y http-server -p 8765 . & node test/solvable.cjs   (needs `playwright` or PW=<path to playwright-core>)
const { chromium } = require(process.env.PW || "playwright");
const assert = require("assert");
const URL = process.env.URL || "http://localhost:8765/numberwaffle13.html";

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW ? "chrome" : undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem("nw-seen-help", "1"));

  for (const mode of ["daily", "classic", "giant", "fog", "blitz", "perfect"]) {
    for (let round = 0; round < 3; round++) {
      await page.goto(URL + "?" + round + "#" + mode);   // new URL = fresh page each round
      const r = await page.evaluate(() => {
        // Each misplaced tile has a partner holding its value whose value it holds (2-cycle).
        const out = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          if (!isNum(r, c) || grid[r][c] === sol[r][c]) continue;
          for (let r2 = 0; r2 < N; r2++) for (let c2 = 0; c2 < N; c2++)
            if (isNum(r2, c2) && grid[r2][c2] !== sol[r2][c2] && grid[r2][c2] === sol[r][c] && grid[r][c] === sol[r2][c2]) {
              if (out.length < 1e4) { tap(r, c); tap(r2, c2); }
              r2 = c2 = N;
            }
        }
        return { N, min: minSwaps, scr: MODES[mode].scramble, left: swapsLeft, total: totalSwaps, over, solved: isSolved(),
                 msg: document.getElementById("msg").textContent };
      });
      assert.strictEqual(r.min, r.scr, `${mode}: scramble reached requested size`);
      assert.ok(r.solved && r.over, `${mode}: solved -> ${JSON.stringify(r)}`);
      assert.strictEqual(r.total - r.left, r.min, `${mode}: used exactly minimum swaps`);
      assert.match(r.msg, /Solved/);
      if (mode === "daily") break;
    }
    console.log("ok", mode);
  }

  // Daily is the same board on every load.
  await page.goto(URL + "?a#daily"); const a = await page.evaluate(() => JSON.stringify(grid));
  await page.goto(URL + "?b#daily"); assert.strictEqual(await page.evaluate(() => JSON.stringify(grid)), a);
  // Blitz ends when the clock runs out.
  await page.goto(URL + "?t#blitz");
  assert.ok(await page.evaluate(() => { startAt -= 151e3; tick(); return over; }), "blitz timeout");
  // Fog: nothing locks, clashes get flagged.
  await page.goto(URL + "?f#fog");
  const fog = await page.evaluate(() => [document.querySelectorAll(".cell.locked").length, document.querySelectorAll(".cell.dup").length]);
  assert.deepStrictEqual([fog[0], fog[1] > 0], [0, true], "fog flags");
  // Keyboard: arrow + Enter twice swaps two tiles.
  await page.goto(URL + "?k#classic");
  await page.evaluate(() => { const [r, c] = [...document.querySelectorAll(".cell:not(.locked)")].map(e => [+e.dataset.r, +e.dataset.c])[0]; els[key(r, c)].focus(); });
  await page.keyboard.press("Enter");
  for (let i = 0; i < 20 && await page.evaluate(() => fixed(...cellOf(document.activeElement))); i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  while (await page.evaluate(() => fixed(...cellOf(document.activeElement)))) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.strictEqual(await page.evaluate(() => totalSwaps - swapsLeft), 1, "keyboard swap");

  assert.deepStrictEqual(errors, []);
  console.log("all checks passed");
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
