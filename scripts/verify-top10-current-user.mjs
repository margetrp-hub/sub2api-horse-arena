import fs from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.GAME_URL || "http://127.0.0.1:5174/";
const outputDir = `${process.cwd()}/output/playwright`;

const users = Array.from({ length: 10 }, (_, index) => ({
  rank: index + 1,
  user_id: index + 1,
  name: `user${index + 1}***@example.com`,
  tokens: 1000000 - index * 50000,
  requests: 20 - index,
  model: "gpt-5",
  mode: "work",
  screen: index % 2 === 0 ? "dashboard" : "api",
}));

async function verifyViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  let rankingAuthorization = "";
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  await page.route("**/api/ranking?**", async (route) => {
    rankingAuthorization = route.request().headers().authorization || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          source: "sub2api",
          generated_at: new Date().toISOString(),
          total_tokens: 7750000,
          active_top_users: 10,
          users,
          current_user: {
            rank: 11,
            user_id: 11,
            name: "current***@example.com",
            tokens: 425000,
            listed: true,
            in_top: false,
          },
        },
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("auth_token", "stored-test-token");
  });

  await page.goto(`${baseUrl}?ui_mode=embedded`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForSelector("canvas", { timeout: 15000 });
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".rank-card")].map((card) => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    const overlaps = cards.some((left, index) => cards.slice(index + 1).some((right) =>
      left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top
    ));
    return {
      desktopHeader: document.querySelector(".side-header .desktop-top")?.textContent?.trim() ?? "",
      mobileHeader: document.querySelector(".side-header .mobile-top")?.textContent?.trim() ?? "",
      rankCount: cards.length,
      visibleRankCount: cards.filter((card) => getComputedStyle(document.querySelectorAll(".rank-card")[cards.indexOf(card)]).display !== "none").length,
      selfText: document.querySelector(".self-card")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      hasCoupon: Boolean(document.querySelector(".coupon-card, .claim-button")),
      source: document.querySelector(".side-header em")?.textContent?.trim() ?? "",
      tokenStillInUrl: new URL(location.href).searchParams.has("token"),
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      overlaps,
    };
  });

  const screenshotPath = `${outputDir}/top10-current-user-${name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await page.close();
  return { name, metrics, rankingAuthorization, errors, screenshotPath };
}

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await verifyViewport(browser, "desktop", { width: 1440, height: 900 }),
    await verifyViewport(browser, "mobile", { width: 390, height: 844 }),
  ];
  console.log(JSON.stringify(results, null, 2));
  if (results.some(({ metrics, rankingAuthorization, errors }) =>
    metrics.desktopHeader !== "TOP 10" ||
    metrics.mobileHeader !== "TOP 3" ||
    metrics.rankCount !== 10 ||
    metrics.visibleRankCount < 3 ||
    !metrics.selfText.includes("近 7 日第 11 名") ||
    !metrics.selfText.includes("未进入 TOP 10") ||
    metrics.hasCoupon ||
    !metrics.source.includes("近 7 日") ||
    metrics.tokenStillInUrl ||
    metrics.documentWidth > metrics.viewportWidth + 1 ||
    metrics.overlaps ||
    rankingAuthorization !== "Bearer stored-test-token" ||
    errors.length > 0
  )) process.exitCode = 1;
} finally {
  await browser.close();
}
