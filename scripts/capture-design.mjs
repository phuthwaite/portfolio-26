// Captures the Design section once per item, as the site shows it 1920px wide (without the dock), cropped
// just below the carousel so every frame is the same size, for the reference copies on the "published
// design work" page in Figma (px.ph.26). The companion to capture-decks.mjs.
//
//   npm run dev                         (in another terminal)
//   npm run capture:design              → design-captures/design-<nn>.png + manifest.json
//
// Options (environment variables):
//   BASE_URL     site to capture (default http://localhost:5173; a deployed URL works too)
//   OUT_DIR      where to write the images (default design-captures, which git ignores)
//   CHROME_PATH  Chrome or Chromium to drive (default: Google Chrome in /Applications)
//
// manifest.json lists each item's file with the Figma frame name it belongs in ("Design 03 AXS Europe"), so
// the images can be swapped into the existing frames without disturbing comments.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const base = (process.env.BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const out = path.resolve(root, process.env.OUT_DIR ?? "design-captures");
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const W = 1920;
const H = 1080;
// the dock, its backdrop and the analytics note are page furniture, not part of the section
const hideChrome = `*,*::before,*::after{transition:none!important;animation:none!important}
#dock,.dock-backdrop,body>div p[inert]{display:none!important}
#design [aria-roledescription='carousel']{box-shadow:none!important;outline:none!important}`;

fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  pipe: true,
  args: ["--hide-scrollbars"],
  userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), "capture-design-")),
});

const manifest = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  // the carousel jumps straight to each item instead of gliding
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  await page.addStyleTag({ content: hideChrome });

  // the section's slide fills the window once scrolled to its top
  const scrollToSection = async () => {
    const top = await page.evaluate(() => {
      const slide = document.getElementById("design").closest("[data-slide]");
      return slide.getBoundingClientRect().top + window.scrollY;
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
    await new Promise((done) => setTimeout(done, 800));
  };
  await scrollToSection();

  // The frames end 40px below the carousel (card and caption), the same for every item; on a 1080px-tall
  // window the rest is empty page. The window is shortened to that height rather than the screenshot
  // clipped, because a clip renders the page's sticky slides out of place.
  const contentHeight = await page.evaluate(() => {
    const region = document.querySelector("#design [aria-roledescription='carousel']").getBoundingClientRect();
    return Math.ceil((region.bottom + 40) / 10) * 10;
  });
  const crop = Math.min(H, contentHeight);
  await page.setViewport({ width: W, height: crop, deviceScaleFactor: 1 });
  await scrollToSection();
  const count = await page.$$eval("#design [aria-roledescription='carousel'] button[aria-label]", (cards) => cards.length);
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      await page.focus("#design [aria-roledescription='carousel']");
      await page.keyboard.press("ArrowRight");
    }
    // settled on item i: its card fully opaque, the live caption naming it, its image loaded
    await page.waitForFunction(
      (n, total) => {
        const card = document.querySelectorAll("#design [aria-roledescription='carousel'] button[aria-label]")[n];
        const live = document.querySelector("#design p[aria-live]")?.textContent ?? "";
        const img = card?.querySelector("img");
        return card && card.style.opacity === "1" && live.endsWith(`, ${n + 1} of ${total}`) && img?.complete && img.naturalWidth > 0;
      },
      { timeout: 30000 },
      i,
      count,
    ).catch(async (err) => {
      const state = await page.evaluate((n) => {
        const card = document.querySelectorAll("#design [aria-roledescription='carousel'] button[aria-label]")[n];
        const img = card?.querySelector("img");
        return { opacity: card?.style.opacity, live: document.querySelector("#design p[aria-live]")?.textContent, img: img && { complete: img.complete, w: img.naturalWidth, src: img.currentSrc } };
      }, i);
      throw new Error(`item ${i + 1} didn't settle: ${JSON.stringify(state)}`, { cause: err });
    });
    await page.evaluate(() => document.fonts.ready);
    // the caption box eases to the new caption's height
    await new Promise((done) => setTimeout(done, 500));

    const item = await page.evaluate((n) => {
      const card = document.querySelectorAll("#design [aria-roledescription='carousel'] button[aria-label]")[n];
      const label = document.querySelector("#design p[aria-live]").textContent;
      return { client: card.getAttribute("aria-label").split(":")[0], caption: label.replace(/, \d+ of \d+$/, "") };
    }, i);

    const nn = String(i + 1).padStart(2, "0");
    const file = `design-${nn}.png`;
    await page.screenshot({ path: path.join(out, file) });
    const frame = `Design ${nn} ${item.client}`;
    manifest.push({ item: i + 1, client: item.client, caption: item.caption, file, frame });
    console.log(`${file}  ${frame}`);
  }
} finally {
  await browser.close();
}

fs.writeFileSync(
  path.join(out, "manifest.json"),
  JSON.stringify({ capturedAt: new Date().toISOString(), baseUrl: base, items: manifest }, null, 2),
);
console.log(`\n${manifest.length} items → ${path.relative(root, out)}/`);
