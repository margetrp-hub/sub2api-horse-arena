import crypto from "node:crypto";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.GAME_URL || "http://127.0.0.1:5173/?api=http%3A%2F%2F127.0.0.1%3A8788";
const outputDir = `${root}/output/playwright`;

function digest(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function verifyViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector(".source-live", { timeout: 15000 });
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const playfield = document.querySelector(".playfield")?.getBoundingClientRect();
    const side = document.querySelector(".side-panel")?.getBoundingClientRect();
    const canvas = document.querySelector("canvas");
    const body = document.body;
    return {
      live: Boolean(document.querySelector(".source-live")),
      rankCount: document.querySelectorAll(".rank-card").length,
      hasMaskedName: document.body.innerText.includes("fir***@example.com"),
      leakedName: document.body.innerText.includes("first@example.com"),
      canvasPixels: canvas ? { width: canvas.width, height: canvas.height } : null,
      documentSize: { width: body.scrollWidth, height: body.scrollHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      playfield: playfield ? { left: playfield.left, right: playfield.right, top: playfield.top, bottom: playfield.bottom } : null,
      side: side ? { left: side.left, right: side.right, top: side.top, bottom: side.bottom } : null,
    };
  });

  const firstFrame = await page.locator("canvas").screenshot();
  await page.waitForTimeout(500);
  const secondFrame = await page.locator("canvas").screenshot();
  const screenshotPath = `${outputDir}/live-${name}.png`;
  await page.screenshot({ path: screenshotPath });

  const horizontallyContained = metrics.documentSize.width <= metrics.viewport.width + 1;
  const verticallyContained = metrics.documentSize.height <= metrics.viewport.height + 1;
  const separated = name === "desktop"
    ? metrics.playfield && metrics.side && metrics.side.right <= metrics.playfield.left + 1
    : metrics.playfield && metrics.side && metrics.playfield.bottom <= metrics.side.top + 1;
  const result = {
    name,
    metrics,
    animationChanged: digest(firstFrame) !== digest(secondFrame),
    horizontallyContained,
    verticallyContained,
    separated,
    errors,
    screenshotPath,
  };
  await page.close();
  return result;
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await verifyViewport(browser, "desktop", { width: 1280, height: 800 }),
    await verifyViewport(browser, "mobile", { width: 390, height: 844 }),
  ];
  console.log(JSON.stringify(results, null, 2));
  if (results.some((result) =>
    !result.metrics.live ||
    result.metrics.rankCount !== 3 ||
    !result.metrics.hasMaskedName ||
    result.metrics.leakedName ||
    !result.animationChanged ||
    !result.horizontallyContained ||
    !result.verticallyContained ||
    !result.separated ||
    result.errors.length > 0
  )) process.exitCode = 1;
} finally {
  await browser.close();
}
