import test from "node:test";
import assert from "node:assert/strict";

import {
  aggregateRows,
  buildRankingSnapshot,
  FUN_WORK_LABELS,
  funWorkLabel,
  getPeriodRange,
  maskUsername,
  normalizeNewApiRows,
  normalizeSub2ApiRanking,
  normalizeSub2ApiTrend,
} from "./normalize.mjs";

const NOW = Date.parse("2026-07-22T04:00:00.000Z");
const NOW_SECONDS = Math.floor(NOW / 1000);

test("normalizes NewAPI quota data and ranks users by consumed tokens", () => {
  const rows = normalizeNewApiRows({
    success: true,
    data: [
      {
        user_id: 7,
        username: "alice@example.com",
        created_at: NOW_SECONDS - 600,
        token_used: 900,
        count: 3,
        model_name: "gpt-5",
      },
      {
        user_id: 7,
        username: "alice@example.com",
        created_at: NOW_SECONDS - 3600,
        token_used: 100,
        count: 1,
        model_name: "gpt-5",
      },
      {
        user_id: 8,
        username: "bob@example.com",
        created_at: NOW_SECONDS - 1200,
        token_used: 500,
        count: 2,
        model_name: "claude",
      },
    ],
  });
  const snapshot = buildRankingSnapshot({
    rows,
    historyRows: rows,
    start: NOW_SECONDS - 86400,
    end: NOW_SECONDS,
    nowSeconds: NOW_SECONDS,
    limit: 10,
  });

  assert.equal(snapshot.total_tokens, 1500);
  assert.equal(snapshot.users.length, 2);
  assert.equal(snapshot.users[0].name, "ali***@example.com");
  assert.equal(snapshot.users[0].tokens, 1000);
  assert.equal(snapshot.users[0].requests, 4);
  assert.equal(snapshot.users[0].model, "gpt-5");
});

test("masks non-email usernames without exposing the full value", () => {
  assert.equal(maskUsername("admin-user"), "adm***");
  assert.equal(maskUsername("a***@example.com"), "a***@example.com");
  assert.equal(maskUsername(""), "匿名用户");
});

test("period range starts at the Shanghai local day boundary", () => {
  const range = getPeriodRange("today", NOW, 480);
  assert.equal(new Date(range.start * 1000).toISOString(), "2026-07-21T16:00:00.000Z");
  assert.equal(range.end, NOW_SECONDS);
});

test("weekly range covers the current and previous six Shanghai days", () => {
  const range = getPeriodRange("week", NOW, 480);
  assert.equal(new Date(range.start * 1000).toISOString(), "2026-07-15T16:00:00.000Z");
  assert.equal(range.period, "week");
});

test("aggregates request counts and daily token totals", () => {
  const rows = normalizeNewApiRows({
    success: true,
    data: [
      { user_id: 1, username: "a@example.com", created_at: NOW_SECONDS, token_used: 12, count: 2 },
    ],
  });
  const aggregate = [...aggregateRows(rows).values()][0];
  assert.equal(aggregate.tokens, 12);
  assert.equal(aggregate.requests, 2);
  assert.equal([...aggregate.daily.values()][0], 12);
});

test("normalizes the Sub2API admin ranking envelope", () => {
  const rows = normalizeSub2ApiRanking(
    {
      code: 0,
      data: {
        ranking: [
          {
            user_id: 19,
            email: "ranked@example.com",
            tokens: 2048,
            requests: 6,
          },
        ],
      },
    },
    NOW_SECONDS,
  );
  assert.deepEqual(rows[0], {
    userId: 19,
    username: "ranked@example.com",
    modelName: "",
    createdAt: NOW_SECONDS,
    tokenUsed: 2048,
    count: 6,
  });
});

test("uses a rotating playful label when model data is unavailable", () => {
  const rows = normalizeSub2ApiRanking(
    {
      code: 0,
      data: {
        ranking: [
          {
            user_id: 19,
            email: "ranked@example.com",
            tokens: 2048,
            requests: 6,
          },
        ],
      },
    },
    NOW_SECONDS,
  );
  const snapshot = buildRankingSnapshot({
    rows,
    start: NOW_SECONDS - 86400,
    end: NOW_SECONDS,
    nowSeconds: NOW_SECONDS,
    source: "sub2api",
  });

  assert.equal(snapshot.users[0].model, funWorkLabel("id:19", NOW_SECONDS));
  assert.ok(FUN_WORK_LABELS.includes(snapshot.users[0].model));
  assert.doesNotMatch(snapshot.users[0].model, /Sub2API|NewAPI/);
});

test("normalizes Sub2API daily trend dates in Shanghai time", () => {
  const rows = normalizeSub2ApiTrend(
    {
      code: 0,
      data: {
        trend: [
          {
            user_id: 19,
            email: "ranked@example.com",
            date: "2026-07-22",
            tokens: 300,
            requests: 2,
          },
        ],
      },
    },
    480,
  );
  assert.equal(new Date(rows[0].createdAt * 1000).toISOString(), "2026-07-22T04:00:00.000Z");
});

test("reports the authenticated user's rank outside the visible top ten", () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    userId: index + 1,
    username: `user${index + 1}@example.com`,
    modelName: "gpt-5",
    createdAt: NOW_SECONDS - 60,
    tokenUsed: 1200 - index * 10,
    count: 1,
  }));
  const snapshot = buildRankingSnapshot({
    rows,
    start: NOW_SECONDS - 86400,
    end: NOW_SECONDS,
    nowSeconds: NOW_SECONDS,
    limit: 10,
    currentUser: { id: 11, name: "user11@example.com" },
  });

  assert.equal(snapshot.users.length, 10);
  assert.equal(snapshot.current_user.rank, 11);
  assert.equal(snapshot.current_user.listed, true);
  assert.equal(snapshot.current_user.in_top, false);
  assert.equal(snapshot.current_user.name, "use***@example.com");
});

test("reports an authenticated user with no usage as not listed", () => {
  const snapshot = buildRankingSnapshot({
    rows: [],
    start: NOW_SECONDS - 86400,
    end: NOW_SECONDS,
    nowSeconds: NOW_SECONDS,
    limit: 10,
    currentUser: { id: 99, name: "new-user@example.com" },
  });

  assert.equal(snapshot.current_user.rank, null);
  assert.equal(snapshot.current_user.listed, false);
  assert.equal(snapshot.current_user.in_top, false);
  assert.equal(snapshot.current_user.name, "new***@example.com");
});
