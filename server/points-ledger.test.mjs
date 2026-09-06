import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createPointsLotteryService } from "./points-ledger.mjs";
import { createApp, getConfig } from "./index.mjs";

test("live lottery reads the unified account but does not open transactions", async () => {
  const config = { source: "sub2api", sub2ApiBaseUrl: "https://site.test", pointsBaseUrl: "https://points.test", pointsReadToken: "read-only-test-token" };
  const service = createPointsLotteryService(config, async (url, options) => {
    assert.equal(url.pathname, "/points-bridge/v1/account");
    assert.equal(url.searchParams.get("transportInstance"), "https://site.test");
    assert.equal(url.searchParams.get("senderRef"), "123");
    assert.equal(options.headers["X-ErDai-Points-Token"], config.pointsReadToken);
    assert.equal(options.redirect, "error");
    return Response.json({ data: { accountId: "account-1", balance: 37 } });
  });
  const state = await service.getState(123);
  assert.equal(state.points, 37);
  assert.equal(state.available, false);
  assert.equal(state.remainingDraws, 0);
  await assert.rejects(() => service.exchangePoints({ userId: 123, count: 1 }), { code: "lottery_not_open" });
  await assert.rejects(() => service.draw({ userId: 123, count: 1 }), { code: "lottery_not_open" });
});

test("unconfigured and unverified accounts never receive demo balances", async () => {
  await assert.rejects(() => createPointsLotteryService({}).getState(1), { code: "points_not_configured" });
  const config = { source: "newapi", baseUrl: "https://site.test", pointsBaseUrl: "https://points.test", pointsReadToken: "test" };
  const service = createPointsLotteryService(config, async () => Response.json({ error: { code: "points_identity_unverified" } }, { status: 409 }));
  await assert.rejects(() => service.getState(1), { code: "points_identity_unverified" });
  const malformed = createPointsLotteryService(config, async () => Response.json({ data: { balance: "1280" } }));
  await assert.rejects(() => malformed.getState(1), { code: "points_invalid_response" });
});

test("production default rejects preview bypass and never uses in-memory user balances", async () => {
  const app = createApp(getConfig({}), async () => [], async () => ({ id: 42 }));
  const server = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const preview = await fetch(`${base}/api/lottery/state?preview=1`, { headers: { "X-Lottery-Preview": "1" } });
    assert.equal(preview.status, 401);
    const real = await fetch(`${base}/api/lottery/state`);
    assert.equal(real.status, 503);
    assert.equal((await real.json()).code, "points_not_configured");
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
