import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import {
  createApp,
  fetchCurrentNewApiUser,
  fetchCurrentSub2ApiUser,
  fetchUsageData,
  getConfig,
} from "./index.mjs";
import { createLotteryService } from "./lottery.mjs";

test("ranking endpoint returns masked normalized data and caches upstream reads", async () => {
  let upstreamCalls = 0;
  const now = Math.floor(Date.now() / 1000);
  const rows = [
    {
      userId: 11,
      username: "alice@example.com",
      modelName: "gpt-5",
      createdAt: now - 300,
      tokenUsed: 1200,
      count: 4,
    },
  ];
  const config = {
    host: "127.0.0.1",
    port: 0,
    baseUrl: "https://newapi.example.com",
    accessToken: "not-returned",
    userId: "1",
    timeoutMs: 1000,
    cacheMs: 60000,
    timezoneOffsetMinutes: 480,
    corsOrigins: ["https://game.example.com"],
  };
  const app = createApp(config, async () => {
    upstreamCalls += 1;
    return rows;
  });
  const server = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const first = await fetch(`${base}/api/ranking`, {
      headers: { Origin: "https://game.example.com" },
    });
    const second = await fetch(`${base}/api/ranking`, {
      headers: { Origin: "https://game.example.com" },
    });
    const body = await first.json();
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.period, "week");
    assert.equal(body.data.users[0].name, "ali***@example.com");
    assert.equal(body.data.users[0].tokens, 1200);
    assert.equal(first.headers.get("access-control-allow-origin"), "https://game.example.com");
    assert.equal(upstreamCalls, 2);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("health endpoint refuses an unconfigured adapter", async () => {
  const config = {
    host: "127.0.0.1",
    port: 0,
    baseUrl: "https://newapi.example.com",
    accessToken: "",
    userId: "",
    timeoutMs: 1000,
    cacheMs: 1000,
    timezoneOffsetMinutes: 480,
    corsOrigins: [],
  };
  const app = createApp(config, async () => []);
  const server = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/healthz`);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.configured, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("ranking endpoint resolves the authenticated Sub2API user's position", async () => {
  const now = Math.floor(Date.now() / 1000);
  const config = {
    source: "sub2api",
    host: "127.0.0.1",
    port: 0,
    sub2ApiAdminApiKey: "admin-test-key",
    timeoutMs: 1000,
    cacheMs: 60000,
    timezoneOffsetMinutes: 480,
    corsOrigins: [],
  };
  const fetchData = async () => Array.from({ length: 12 }, (_, index) => ({
    userId: index + 1,
    username: `user${index + 1}@example.com`,
    modelName: "gpt-5",
    createdAt: now - 60,
    tokenUsed: 1200 - index * 10,
    count: 1,
  }));
  const resolveCurrentUser = async (_config, authorization) => {
    assert.equal(authorization, "Bearer signed-user-token");
    return { id: 11, name: "user11@example.com" };
  };
  const app = createApp(config, fetchData, resolveCurrentUser);
  const server = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/ranking`, {
      headers: { Authorization: "Bearer signed-user-token" },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.users.length, 10);
    assert.equal(body.data.current_user.rank, 11);
    assert.equal(body.data.current_user.in_top, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("Sub2API adapter requests the admin ranking and trend contracts", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push({ url, headers: init?.headers ?? {} });
    if (url.pathname.endsWith("/auth/me")) {
      return Response.json({
        code: 0,
        data: { id: 7, email: "alice@example.com" },
      });
    }
    if (url.pathname.endsWith("users-ranking")) {
      return Response.json({
        code: 0,
        data: {
          ranking: [
            { user_id: 7, email: "alice@example.com", tokens: 2400, requests: 4 },
          ],
        },
      });
    }
    return Response.json({
      code: 0,
      data: {
        trend: [
          {
            user_id: 7,
            email: "alice@example.com",
            date: "2026-07-22",
            tokens: 2400,
            requests: 4,
          },
        ],
      },
    });
  };

  try {
    const config = getConfig({
      USAGE_SOURCE: "sub2api",
      SUB2API_BASE_URL: "https://sub2api.example.com",
      SUB2API_ADMIN_API_KEY: "private-test-key",
      SUB2API_QUERY_LIMIT: "50",
      RANKING_TIMEZONE_OFFSET_MINUTES: "480",
    });
    const data = await fetchUsageData(config, {
      start: 1780000000,
      end: 1780086400,
    });
    const currentUser = await fetchCurrentSub2ApiUser(
      config,
      "Bearer signed-user-token",
    );
    assert.equal(data.rows[0].tokenUsed, 2400);
    assert.equal(data.historyRows[0].createdAt > 0, true);
    assert.deepEqual(currentUser, { id: 7, name: "alice@example.com" });
    assert.equal(calls.length, 3);
    assert.equal(calls[0].headers["x-api-key"], "private-test-key");
    assert.equal(calls[0].url.searchParams.get("limit"), "50");
    assert.equal(calls[1].url.searchParams.get("granularity"), "day");
    assert.equal(calls[2].headers.Authorization, "Bearer signed-user-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("NewAPI current-user adapter forwards the browser session contract", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (input, init) => {
    request = { url: new URL(String(input)), headers: init?.headers ?? {} };
    return Response.json({
      success: true,
      data: { id: 42, username: "newapi-user@example.com" },
    });
  };

  try {
    const config = {
      source: "newapi",
      baseUrl: "https://newapi.example.com",
      timeoutMs: 1000,
    };
    const currentUser = await fetchCurrentNewApiUser(
      config,
      "Bearer browser-token",
      "session=browser-session",
      "42",
    );
    assert.deepEqual(currentUser, { id: 42, name: "newapi-user@example.com" });
    assert.equal(request.url.pathname, "/api/user/self");
    assert.equal(request.headers.Cookie, "session=browser-session");
    assert.equal(request.headers["New-Api-User"], "42");
    assert.equal(request.headers.Authorization, "Bearer browser-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("NewAPI ranking endpoint resolves the authenticated user's position", async () => {
  const now = Math.floor(Date.now() / 1000);
  const config = {
    source: "newapi",
    host: "127.0.0.1",
    port: 0,
    baseUrl: "https://newapi.example.com",
    accessToken: "server-only-token",
    userId: "9000",
    timeoutMs: 1000,
    cacheMs: 60000,
    timezoneOffsetMinutes: 480,
    corsOrigins: [],
  };
  const fetchData = async () => Array.from({ length: 12 }, (_, index) => ({
    userId: index + 1,
    username: `user${index + 1}@example.com`,
    modelName: "gpt-5",
    createdAt: now - 60,
    tokenUsed: 1200 - index * 10,
    count: 1,
  }));
  const app = createApp(config, fetchData, async (_config, authorization, cookie, newApiUser) => {
    assert.equal(authorization, undefined);
    assert.equal(cookie, "session=browser-session");
    assert.equal(newApiUser, "11");
    return { id: 11, name: "user11@example.com" };
  });
  const server = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/ranking`, {
      headers: {
        Cookie: "session=browser-session",
        "New-Api-User": "11",
      },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.source, "newapi");
    assert.equal(body.data.users.length, 10);
    assert.equal(body.data.current_user.rank, 11);
    assert.equal(body.data.current_user.in_top, false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("lottery service locks the result and makes retries idempotent", async () => {
  const lottery = createLotteryService({ random: () => 0.99999 });
  const first = await lottery.draw({ userId: "user-1", count: 1, idempotencyKey: "draw-a" });
  const retry = await lottery.draw({ userId: "user-1", count: 1, idempotencyKey: "draw-a" });

  assert.equal(first.animation.key, "pixi-runtime");
  assert.equal(first.results[0].id, "subscription-7");
  assert.equal(first.remainingDraws, 1);
  assert.deepEqual(retry, first);
  await assert.rejects(
    () => lottery.draw({ userId: "user-1", count: 5, idempotencyKey: "draw-b" }),
    (error) => error.code === "insufficient_draws" && error.status === 409,
  );
});

test("lottery service applies the server-side pity counter", async () => {
  const lottery = createLotteryService({
    random: () => 0,
    initialState: { paidAmount: 0, threshold: 50, starterDraws: 0, remainingDraws: 1, missStreak: 3 },
  });
  const result = await lottery.draw({ userId: "user-2", count: 1, idempotencyKey: "draw-pity" });

  assert.equal(result.results[0].id, "balance-1");
  assert.equal(result.missStreak, 0);
  assert.equal(result.results[0].grantStatus, "committed");
});

test("lottery service exchanges points for lottery tokens atomically", async () => {
  const lottery = createLotteryService({
    initialState: {
      paidAmount: 0,
      threshold: 50,
      starterDraws: 0,
      remainingDraws: 0,
      points: 250,
      tokenExchangeCost: 100,
      missStreak: 0,
    },
  });
  const exchanged = await lottery.exchangePoints({ userId: "user-points", count: 2 });

  assert.equal(exchanged.points, 50);
  assert.equal(exchanged.lotteryTokens, 2);
  assert.equal(exchanged.exchangedTokens, 2);
  await assert.rejects(
    () => lottery.exchangePoints({ userId: "user-points", count: 1 }),
    (error) => error.code === "insufficient_points" && error.status === 409,
  );
});

test("lottery routes expose server state and the Pixi runtime animation contract", async () => {
  const lottery = createLotteryService({ random: () => 0.99999 });
  const config = {
    lotteryPreviewEnabled: true,
    source: "newapi",
    host: "127.0.0.1",
    port: 0,
    timeoutMs: 1000,
    cacheMs: 1000,
    timezoneOffsetMinutes: 480,
    corsOrigins: ["http://127.0.0.1:5173"],
  };
  const app = createApp(config, async () => [], async () => null, lottery);
  const server = http.createServer((req, res) => app(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const headers = { Origin: "http://127.0.0.1:5173", "X-Lottery-Preview": "1" };

  try {
    const stateResponse = await fetch(`http://127.0.0.1:${address.port}/api/lottery/state?preview=1`, { headers });
    const stateBody = await stateResponse.json();
    assert.equal(stateResponse.status, 200);
    assert.equal(stateBody.data.animation.key, "pixi-runtime");
    assert.equal(stateBody.data.remainingDraws, 2);
    assert.equal(stateBody.data.lotteryTokens, 2);
    assert.equal(stateBody.data.points, 1280);

    const drawResponse = await fetch(`http://127.0.0.1:${address.port}/api/lottery/draw?preview=1`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", "Idempotency-Key": "route-draw-1" },
      body: JSON.stringify({ count: 1 }),
    });
    const drawBody = await drawResponse.json();
    assert.equal(drawResponse.status, 200);
    assert.equal(drawBody.data.animation.key, "pixi-runtime");
    assert.equal(drawBody.data.threshold, 50);
    assert.equal(drawBody.data.paidAmount, 36.4);
    assert.equal(drawBody.data.remainingDraws, 1);

    const exchangeResponse = await fetch(`http://127.0.0.1:${address.port}/api/lottery/exchange?preview=1`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ count: 1 }),
    });
    const exchangeBody = await exchangeResponse.json();
    assert.equal(exchangeResponse.status, 200);
    assert.equal(exchangeBody.data.lotteryTokens, 2);
    assert.equal(exchangeBody.data.points, 1180);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
