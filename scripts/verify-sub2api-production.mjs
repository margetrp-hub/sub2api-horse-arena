import crypto from "node:crypto";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.GAME_URL || "https://api.ohlao.cfd/game/";
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
  await page.waitForTimeout(1400);

  const metrics = await page.evaluate(async () => {
    const runtime = window.OH_HAOLEMA_RUNTIME || {};
    const rankingPath = runtime.rankingPath || "/api/ranking";
    const rankingResponse = await fetch(`${rankingPath}?period=week&limit=10`);
    const ranking = await rankingResponse.json();
    const playfield = document.querySelector(".playfield")?.getBoundingClientRect();
    const side = document.querySelector(".side-panel")?.getBoundingClientRect();
    const shell = document.querySelector(".game-shell")?.getBoundingClientRect();
    const canvas = document.querySelector("canvas");
    return {
      title: document.title,
      sourceState: document.querySelector(".side-header em")?.textContent?.trim() ?? null,
      rankCount: document.querySelectorAll(".rank-card").length,
      rankModels: [...document.querySelectorAll(".rank-card")].map((card) => card.textContent?.trim() ?? ""),
      ranking: {
        status: rankingResponse.status,
        success: ranking?.success === true,
        source: ranking?.data?.source ?? null,
        userCount: Array.isArray(ranking?.data?.users) ? ranking.data.users.length : null,
        totalTokens: ranking?.data?.total_tokens ?? null,
      },
      canvasPixels: canvas ? { width: canvas.width, height: canvas.height } : null,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
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

  const canvas = page.locator("canvas");
  const firstFrame = await canvas.screenshot();
  await page.waitForTimeout(700);
  const secondFrame = await canvas.screenshot();
  const box = await canvas.boundingBox();
  if (!box) throw new Error(`Canvas has no bounding box in ${name}`);
  await canvas.click({ position: { x: box.width * 0.31, y: box.height * 0.49 } });
  await page.waitForTimeout(220);
  const clickPath = `${outputDir}/sub2api-production-${name}-click.png`;
  const clickFrame = await canvas.screenshot({ path: clickPath });
  const screenshotPath = `${outputDir}/sub2api-production-${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const horizontallyContained = metrics.documentWidth <= metrics.viewportWidth + 1;
  const centered = metrics.shell
    ? Math.abs(metrics.shell.left - (metrics.viewportWidth - metrics.shell.width) / 2) <= 2
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
    clickChanged: digest(secondFrame) !== digest(clickFrame),
    horizontallyContained,
    centered,
    separated,
    errors,
    screenshotPath,
    clickPath,
  };
  await page.close();
  return result;
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await verifyViewport(browser, "desktop", { width: 1440, height: 900 }),
    await verifyViewport(browser, "mobile", { width: 390, height: 844 }),
  ];
  console.log(JSON.stringify(results, null, 2));
  if (results.some((result) =>
    !result.metrics.ranking.success ||
    result.metrics.ranking.source !== "sub2api" ||
    result.metrics.ranking.userCount !== 10 ||
    !result.metrics.sourceState?.includes("近 7 日") ||
    !result.animationChanged ||
    !result.clickChanged ||
    !result.horizontallyContained ||
    !result.centered ||
    result.metrics.rankModels.some((text) => text.includes("NewAPI Usage")) ||
    !result.separated ||
    result.errors.length > 0
  )) process.exitCode = 1;
} finally {
  await browser.close();
}
