// Captures every case study slide as a 1920×1080 PNG, as the site renders it (no deck controls or modal
// frame), for the reference copies on the "published decks" page in Figma (px.ph.26).
//
//   npm run dev                         (in another terminal)
//   npm run capture:decks               → deck-captures/<deck>-<nn>.png + manifest.json
//   npm run capture:decks -- vw twc     (just those decks)
//
// Options (environment variables):
//   BASE_URL     site to capture (default http://localhost:5173; a deployed URL works too)
//   OUT_DIR      where to write the images (default deck-captures, which git ignores)
//   CHROME_PATH  Chrome or Chromium to drive (default: Google Chrome in /Applications)
//
// manifest.json lists each slide's file with the Figma frame name it belongs in ("TWC 2.3 Design and
// Prototyping"), so the images can be swapped into the existing frames without disturbing comments.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const base = (process.env.BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const out = path.resolve(root, process.env.OUT_DIR ?? "deck-captures");
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Deck ids, read from the registry so new decks are picked up automatically
const registry = fs.readFileSync(path.join(root, "src/case-study/pages.ts"), "utf8");
const allDecks = [...registry.matchAll(/^\s+(\w+),$/gm)].map((m) => m[1]);
const decks = process.argv.slice(2).length ? process.argv.slice(2) : allDecks;
const unknown = decks.filter((d) => !allDecks.includes(d));
if (unknown.length) throw new Error(`Unknown deck(s): ${unknown.join(", ")} (known: ${allDecks.join(", ")})`);

// Short names used in the Figma frame names
const shortName = { samsung: "Samsung", vw: "VW", twc: "TWC", axs: "AXS", holibob: "Holibob" };

const W = 1920;
const H = 1080;
// The deck panel is min(100dvh − 64px, (100dvw − 64px) × 9/16), so this viewport makes it exactly 1920×1080
const viewport = { width: W + 64, height: H + 64, deviceScaleFactor: 1 };
const hideChrome = `*,*::before,*::after{transition:none!important;animation:none!important}
dialog>button,dialog>div[data-edge-nav-ignore],dialog>div.z-30{display:none!important}
dialog{border-radius:0!important}`;

fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  pipe: true,
  args: ["--hide-scrollbars"],
  userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), "capture-decks-")),
});

const manifest = [];
try {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

  for (const id of decks) {
    await page.goto(`${base}/case-studies/${id}`, { waitUntil: "networkidle0" });
    await page.addStyleTag({ content: hideChrome });
    await page.waitForSelector("dialog[open] section[aria-hidden='false']");
    const count = await page.$$eval("dialog nav button", (dots) => dots.length);

    for (let i = 0; i < count; i++) {
      if (i > 0) await page.evaluate((n) => document.querySelectorAll("dialog nav button")[n].click(), i);
      await page.waitForFunction(
        (n) => document.querySelector("dialog section[aria-hidden='false']")?.getAttribute("aria-label")?.endsWith(`, ${n} of ${document.querySelectorAll("dialog nav button").length}`),
        {},
        i + 1,
      );
      // wait for fonts and every image on the slide
      await page.evaluate(async () => {
        await document.fonts.ready;
        const imgs = [...document.querySelectorAll("dialog section[aria-hidden='false'] img")];
        await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((done) => (img.onload = img.onerror = done)))));
        await Promise.all(imgs.map((img) => img.decode?.().catch(() => {})));
      });
      await new Promise((done) => setTimeout(done, 300));

      const slide = await page.evaluate(() => {
        const section = document.querySelector("dialog section[aria-hidden='false']");
        const box = section.firstElementChild.getBoundingClientRect();
        return {
          label: section.getAttribute("aria-label").replace(/, \d+ of \d+$/, ""),
          number: section.querySelector("header span")?.textContent?.trim() ?? "",
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
      });
      if (Math.round(slide.width) !== W || Math.round(slide.height) !== H) {
        throw new Error(`${id} slide ${i + 1} rendered at ${slide.width}×${slide.height}, expected ${W}×${H}`);
      }

      const file = `${id}-${String(i + 1).padStart(2, "0")}.png`;
      await page.screenshot({ path: path.join(out, file), clip: { x: slide.x, y: slide.y, width: W, height: H } });
      const frame = [shortName[id] ?? id, slide.number, slide.label].filter(Boolean).join(" ");
      manifest.push({ deck: id, slide: i + 1, number: slide.number, label: slide.label, file, frame });
      console.log(`${file}  ${frame}`);
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify({ capturedAt: new Date().toISOString(), baseUrl: base, slides: manifest }, null, 2),
);
console.log(`\n${manifest.length} slides → ${path.relative(root, out)}/`);
