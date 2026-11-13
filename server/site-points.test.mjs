import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp, fetchCurrentNewApiUser, getConfig } from "./index.mjs";
import { createSitePointsService } from "./site-points.mjs";

const account = { accountId: "pa_test", balance: 10, day: "2026-09-07", checkedIn: true, checkInPoints: 10, checkInEnabled: true, linked: false, entries: [{ id: "entry", type: "check_in", points: 10, createdAt: "2026-09-07T01:00:00Z", note: "private note" }], limit: 20, offset: 0, hasMore: false };
const config = getConfig({ NEWAPI_BASE_URL: "https://newapi.test", ERDAI_POINTS_BASE_URL: "https://points.test", ERDAI_POINTS_SITE_TOKEN: "test-scoped-site-credential-1234567890", CORS_ORIGINS: "https://game.test", LOTTERY_PREVIEW_ENABLED: "1" });

test("site service sends only verified identity and strips private ledger fields", async () => {
  let calls = 0;
  const service = createSitePointsService(config, async (url, init) => {
    calls++;
    assert.equal(url.origin, "https://points.test");
    assert.equal(init.redirect, "error");
    assert.equal(init.headers["X-ErDai-Points-Token"], config.pointsSiteToken);
    if (init.method === "POST") assert.deepEqual(JSON.parse(init.body), { senderRef: "123" });
    else assert.equal(url.searchParams.get("senderRef"), "123");
    return Response.json({ data: account, awarded: true });
  });
  const response = await service.request(123, "checkin", "POST");
  assert.equal(response.awarded, true);
  assert.equal(response.data.balance, 10);
  assert.equal("note" in response.data.entries[0], false);
  for (const id of ["preview-user", "0123", 0, 1.5, Number.MAX_SAFE_INTEGER + 1]) await assert.rejects(service.request(id), { code: "unauthorized" });
  await assert.rejects(service.request(123, "draw", "POST"), { code: "not_found" });
  await assert.rejects(service.request(123, "account", "GET", { limit: 51 }), { code: "invalid_page" });
  assert.equal(calls, 1);
});

test("site service fails closed for upstream and invalid balances", async () => {
  for (const response of [Response.json({ data: { ...account, balance: "1280" } }), Response.json({ error: { message: "private failure" } }, { status: 500 })]) {
    const service = createSitePointsService(config, async () => response);
    await assert.rejects(service.request(123), (error) => error.status === 503 && !error.message.includes("private"));
  }
  for (const code of ["points_account_required", "checkin_disabled"]) {
    await assert.rejects(createSitePointsService(config, async () => Response.json({ error: { code } }, { status: 409 })).request(123), { status: 409, code });
  }
});

test("points routes require real authentication, same-site JSON, and ignore caller-selected identities", async () => {
  const calls = [];
  const app = createApp(config, async () => [], async (_config, authorization) => {
    if (authorization === "Bearer expired") throw Object.assign(new Error("expired"), { status: 401 });
    if (authorization === "Bearer offline") throw new Error("offline");
    return authorization === "Bearer valid" ? { id: 123 } : null;
  }, undefined, { async request(...args) { calls.push(args); return { data: account, awarded: true }; } });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = { method: "POST", body: "{}", headers: { Origin: "https://game.test", "Content-Type": "application/json", Authorization: "Bearer valid" } };
  try {
    assert.equal((await fetch(`${base}/api/points/account?preview=1&senderRef=456`, { headers: { "X-Lottery-Preview": "1" } })).status, 401);
    assert.equal((await fetch(`${base}/api/points/account`, { headers: { Authorization: "Bearer expired" } })).status, 401);
    assert.equal((await fetch(`${base}/api/points/account`, { headers: { Authorization: "Bearer offline" } })).status, 503);
    assert.equal((await fetch(`${base}/api/points/checkin`, { ...post, headers: { ...post.headers, Origin: "https://evil.test" } })).status, 403);
    assert.equal((await fetch(`${base}/api/points/checkin`, { ...post, headers: { ...post.headers, "Content-Type": "text/plain" } })).status, 403);
    assert.equal((await fetch(`${base}/api/points/checkin`, { ...post, body: '{"userId":456}' })).status, 400);
    assert.equal(calls.length, 0);
    const response = await fetch(`${base}/api/points/account?userId=456`, post);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(calls[0][0], 123);
    assert.equal((await fetch(`${base}/api/points/draw`, post)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("NewAPI modern bearer and legacy session both verify self and reject mismatched or failed identity", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ success: true, data: { id: 123 } });
    assert.equal((await fetchCurrentNewApiUser(config, "Bearer valid", "", "")).id, 123);
    assert.equal((await fetchCurrentNewApiUser(config, "", "session=fixture", "123")).id, 123);
    assert.equal(await fetchCurrentNewApiUser(config, "", "", "123"), null);
    assert.equal(await fetchCurrentNewApiUser(config, "Bearer valid", "", "456"), null);
    globalThis.fetch = async () => Response.json({ success: false, data: { id: 123 } });
    assert.equal(await fetchCurrentNewApiUser(config, "Bearer valid", "", "123"), null);
  } finally { globalThis.fetch = original; }
});
