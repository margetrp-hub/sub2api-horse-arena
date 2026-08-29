import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const themePath = fileURLToPath(new URL(
  "../../../ops/oh-haolema-newapi-20260817/theme/newapi-ohlao-theme.js",
  import.meta.url,
));
const themeCssPath = fileURLToPath(new URL(
  "../../../ops/oh-haolema-newapi-20260817/theme/newapi-ohlao-theme.css",
  import.meta.url,
));
const [themeScript, themeStyles] = await Promise.all([
  readFile(themePath, "utf8"),
  readFile(themeCssPath, "utf8"),
]);

const fixture = `
  <!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <title>OH LAO</title>
      <link rel="stylesheet" href="/theme.css">
      <script defer src="/theme.js"></script>
    </head>
    <body>
      <header><button data-slot="sidebar-trigger"></button><a aria-label="返回主页"></a></header>
      <aside>
        <div data-sidebar="group-label">常规</div>
        <ul data-sidebar="menu">
          <li data-sidebar="menu-item" data-slot="sidebar-menu-item">
            <a href="/usage-logs/task" data-sidebar="menu-button" data-active="true" aria-current="page">
              <svg aria-hidden="true"></svg>
              <span>任务日志</span>
            </a>
          </li>
        </ul>
      </aside>
      <main><main>
        <div class="shrink-0"><h2>模型统计</h2></div>
        <div data-native-metrics>原生模型统计内容</div>
      </main></main>
    </body>
  </html>
`;

const fixtureServer = createServer((request, response) => {
  const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  if (pathname === "/theme.js") {
    response.writeHead(200, { "content-type": "application/javascript; charset=utf-8" });
    response.end(themeScript);
    return;
  }
  if (pathname === "/theme.css") {
    response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
    response.end(themeStyles);
    return;
  }
  if (pathname.startsWith("/game/")) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end('<!doctype html><html><body><div data-game-test-marker>OH! 薅乐马</div></body></html>');
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(fixture);
});

await new Promise((resolve) => fixtureServer.listen(0, "127.0.0.1", resolve));
const fixturePort = fixtureServer.address().port;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`http://127.0.0.1:${fixturePort}/dashboard/models`, { waitUntil: "networkidle" });
  await page.waitForSelector('a[data-ohlaoo-game-link]');

  await page.evaluate(() => {
    window.__ohlaooMenuMutationCount = 0;
    const menu = document.querySelector('[data-sidebar="menu"]');
    const observer = new MutationObserver((records) => {
      window.__ohlaooMenuMutationCount += records.length;
    });
    observer.observe(menu, { attributes: true, childList: true, subtree: true });
    window.__ohlaooStopMenuObserver = () => observer.disconnect();
    document.body.appendChild(document.createElement("div"));
  });
  await page.waitForTimeout(250);

  const state = await page.evaluate(() => {
    window.__ohlaooStopMenuObserver?.();
    const links = [...document.querySelectorAll("a[data-ohlaoo-game-link]")];
    const taskItem = document.querySelector('a[href="/usage-logs/task"]')?.closest("li");
    const gameItem = document.querySelector("[data-ohlaoo-game-item]");
    return {
      count: links.length,
      href: links[0]?.getAttribute("href"),
      label: links[0]?.querySelector("span")?.textContent,
      active: links[0]?.hasAttribute("data-active"),
      current: links[0]?.hasAttribute("aria-current"),
      icon: links[0]?.querySelector("img")?.getAttribute("src"),
      directlyAfterTask: taskItem?.nextElementSibling === gameItem,
      mutationCount: window.__ohlaooMenuMutationCount,
    };
  });

  assert.deepEqual(errors, []);
  assert.equal(state.count, 1);
  assert.equal(state.href, "/dashboard/models?view=oh-haolema");
  assert.equal(state.label, "OH! 薅乐马");
  assert.equal(state.active, false);
  assert.equal(state.current, false);
  assert.equal(
    state.icon,
    "/game/assets/station-master-v3/horse-working-00.png",
  );
  assert.equal(state.directlyAfterTask, true);
  assert.equal(state.mutationCount, 0);

  await page.locator('a[data-ohlaoo-game-link]').click();
  await page.waitForURL(`**/dashboard/models?view=oh-haolema`);
  await page.waitForSelector('[data-ohlaoo-embedded-game] iframe');
  const embedded = await page.evaluate(() => {
    const native = document.querySelector('main main > .shrink-0');
    const link = document.querySelector('a[data-ohlaoo-game-link]');
    const iframe = document.querySelector('[data-ohlaoo-embedded-game] iframe');
    return {
      gameClass: document.body.classList.contains('ohlaoo-page-game'),
      hostCount: document.querySelectorAll('[data-ohlaoo-embedded-game]').length,
      iframeSrc: iframe?.getAttribute('src'),
      nativeDisplay: native ? getComputedStyle(native).display : null,
      active: link?.getAttribute('data-active') === 'true',
      current: link?.getAttribute('aria-current') === 'page',
      context: document.querySelector('[data-ohlaoo-app-context] strong')?.textContent,
    };
  });
  assert.deepEqual(errors, []);
  assert.equal(embedded.gameClass, true);
  assert.equal(embedded.hostCount, 1);
  assert.equal(embedded.iframeSrc, "/game/?embedded=1");
  assert.equal(embedded.nativeDisplay, "none");
  assert.equal(embedded.active, true);
  assert.equal(embedded.current, true);
  assert.equal(embedded.context, "OH! 薅乐马");
  const gameFrame = page.frameLocator('[data-ohlaoo-embedded-game] iframe');
  await gameFrame.locator('[data-game-test-marker]').waitFor();

  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForSelector('a[data-ohlaoo-game-link]');
  const restored = await page.evaluate(() => ({
    gameClass: document.body.classList.contains('ohlaoo-page-game'),
    hostCount: document.querySelectorAll('[data-ohlaoo-embedded-game]').length,
    nativeDisplay: getComputedStyle(document.querySelector('main main > .shrink-0')).display,
  }));
  assert.equal(restored.gameClass, false);
  assert.equal(restored.hostCount, 0);
  assert.notEqual(restored.nativeDisplay, "none");
  console.log(JSON.stringify({ baseline: state, embedded, restored }));
} finally {
  await browser.close();
  await new Promise((resolve) => fixtureServer.close(resolve));
}
