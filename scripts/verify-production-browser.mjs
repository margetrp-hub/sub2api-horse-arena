import crypto from "node:crypto";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.GAME_URL || "https://new.ohlao.cfd/game/";
const expectedSource = process.env.EXPECTED_SOURCE || "newapi";
const outputDir = `${root}/output/playwright`;

function digest(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function verifyViewport(browser, name, viewport) {
  const startedAt = Date.now();
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForFunction(
    () => /近 7 日/.test(document.querySelector(".side-header em")?.textContent ?? ""),
    null,
    { timeout: 180000 },
  );
  const rankingLiveMs = Date.now() - startedAt;
  await page.waitForSelector('#gameRoot[data-ready="true"]', { timeout: 180000 });
  const sceneReadyMs = Date.now() - startedAt;
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(async () => {
    const playfield = document.querySelector(".playfield")?.getBoundingClientRect();
    const side = document.querySelector(".side-panel")?.getBoundingClientRect();
    const shell = document.querySelector(".game-shell")?.getBoundingClientRect();
    const canvas = document.querySelector("canvas");
    const rankingResponse = await fetch("/api/ranking?period=week&limit=10");
    const ranking = await rankingResponse.json();
    return {
      title: document.title,
      sourceState: document.querySelector(".side-header em")?.textContent?.trim() ?? null,
      hasEmptyRanking: Boolean(document.querySelector(".ranking-empty")),
      rankCount: document.querySelectorAll(".rank-card").length,
      ranking: {
        status: rankingResponse.status,
        success: ranking?.success === true,
        source: ranking?.data?.source ?? null,
        userCount: Array.isArray(ranking?.data?.users) ? ranking.data.users.length : null,
      },
      canvasPixels: canvas ? { width: canvas.width, height: canvas.height } : null,
      documentSize: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      playfield: playfield
        ? { left: playfield.left, right: playfield.right, top: playfield.top, bottom: playfield.bottom }
        : null,
      side: side
        ? { left: side.left, right: side.right, top: side.top, bottom: side.bottom }
        : null,
      shell: shell
        ? { left: shell.left, right: shell.right, width: shell.width }
        : null,
    };
  });

  const firstFrame = await page.locator("canvas").screenshot();
  await page.waitForTimeout(600);
  const secondFrame = await page.locator("canvas").screenshot();
  const screenshotPath = `${outputDir}/production-${name}.png`;
  await page.screenshot({ path: screenshotPath });

  const horizontallyContained = metrics.documentSize.width <= metrics.viewport.width + 1;
  const verticallyContained = metrics.documentSize.height <= metrics.viewport.height + 1;
  const centered = metrics.shell
    ? Math.abs(metrics.shell.left - (metrics.viewport.width - metrics.shell.width) / 2) <= 2
    : false;
  const separated = name === "desktop"
    ? metrics.playfield && metrics.side && metrics.side.right <= metrics.playfield.left + 1
    : metrics.playfield && metrics.side && metrics.playfield.bottom <= metrics.side.top + 1;

  const result = {
    name,
    rankingLiveMs,
    sceneReadyMs,
    metrics,
    animationChanged: digest(firstFrame) !== digest(secondFrame),
    horizontallyContained,
    verticallyContained,
    centered,
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
    !result.metrics.ranking.success ||
    result.metrics.ranking.source !== expectedSource ||
    !result.metrics.sourceState?.includes("近 7 日") ||
    (result.metrics.ranking.userCount === 0 && (!result.metrics.hasEmptyRanking || result.metrics.rankCount !== 0)) ||
    !result.animationChanged ||
    !result.horizontallyContained ||
    !result.verticallyContained ||
    !result.centered ||
    !result.separated ||
    result.errors.length > 0
  )) process.exitCode = 1;
} finally {
  await browser.close();
}
