import { randomUUID } from "node:crypto";

const NORMAL_PRIZES = [
  { id: "empty", label: "谢谢参与", detail: "下次再来试试", kind: "empty", weight: 7000 },
  { id: "balance-1", label: "余额 +1 元", detail: "立即到账", kind: "balance", weight: 1700 },
  { id: "balance-2", label: "余额 +2 元", detail: "立即到账", kind: "balance", weight: 700 },
  { id: "balance-3", label: "余额 +3 元", detail: "立即到账", kind: "balance", weight: 300 },
  { id: "balance-5", label: "余额 +5 元", detail: "立即到账", kind: "balance", weight: 150 },
  { id: "recharge-bonus", label: "充值加赠 5%", detail: "满 50 元，最高加赠 5 元", kind: "coupon", weight: 100 },
  { id: "subscription-1", label: "活动订阅 1 天", detail: "活动专属套餐", kind: "subscription", weight: 40 },
  { id: "subscription-3", label: "活动订阅 3 天", detail: "活动专属套餐", kind: "subscription", weight: 8 },
  { id: "subscription-7", label: "活动订阅 7 天", detail: "活动专属套餐", kind: "subscription", weight: 2 },
];

const GUARANTEE_PRIZES = [
  { id: "balance-1", label: "余额 +1 元", detail: "保底普通奖 · 立即到账", kind: "balance", weight: 7000 },
  { id: "balance-2", label: "余额 +2 元", detail: "保底普通奖 · 立即到账", kind: "balance", weight: 2500 },
  { id: "balance-3", label: "余额 +3 元", detail: "保底普通奖 · 立即到账", kind: "balance", weight: 500 },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function chooseWeighted(prizes, random) {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  let cursor = random() * total;
  for (const prize of prizes) {
    cursor -= prize.weight;
    if (cursor <= 0) return prize;
  }
  return prizes[prizes.length - 1];
}

function publicPrize(prize, grantStatus) {
  return {
    id: prize.id,
    label: prize.label,
    detail: prize.detail,
    kind: prize.kind,
    grantStatus,
  };
}

function createUser(initialState) {
  return {
    paidAmount: initialState.paidAmount,
    threshold: initialState.threshold,
    starterDraws: initialState.starterDraws,
    remainingDraws: initialState.remainingDraws,
    missStreak: initialState.missStreak,
    idempotency: new Map(),
  };
}

function badRequest(message, code = "invalid_request") {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  return error;
}

export function createLotteryService({
  random = Math.random,
  initialState = {
    paidAmount: 36.4,
    threshold: 50,
    starterDraws: 2,
    remainingDraws: 2,
    missStreak: 0,
  },
  grantReward = async ({ prize }) => ({
    status: prize.kind === "empty" ? "not_applicable" : "committed",
  }),
} = {}) {
  const users = new Map();
  const locks = new Map();

  function getUser(userId) {
    const key = String(userId ?? "").trim();
    if (!key) throw badRequest("user id is required", "missing_user");
    if (!users.has(key)) users.set(key, createUser(initialState));
    return users.get(key);
  }

  async function withUserLock(userId, task) {
    const key = String(userId);
    const previous = locks.get(key) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    locks.set(key, current);
    await previous;
    try {
      return await task();
    } finally {
      release();
      if (locks.get(key) === current) locks.delete(key);
    }
  }

  function getState(userId) {
    const user = getUser(userId);
    return {
      paidAmount: user.paidAmount,
      threshold: user.threshold,
      starterDraws: user.starterDraws,
      remainingDraws: user.remainingDraws,
      missStreak: user.missStreak,
      animation: { key: "pixi-runtime", src: "runtime" },
    };
  }

  async function draw({ userId, count = 1, idempotencyKey }) {
    const parsedCount = Number(count);
    const key = String(idempotencyKey ?? "").trim();
    if (!Number.isInteger(parsedCount) || ![1, 5].includes(parsedCount)) {
      throw badRequest("count must be 1 or 5");
    }
    if (!key || key.length > 120) {
      throw badRequest("Idempotency-Key is required", "missing_idempotency_key");
    }

    return withUserLock(userId, async () => {
      const user = getUser(userId);
      const previous = user.idempotency.get(key);
      if (previous) return clone(previous);
      if (user.remainingDraws < parsedCount) {
        const error = new Error("not enough draw attempts");
        error.code = "insufficient_draws";
        error.status = 409;
        throw error;
      }

      const drawId = randomUUID();
      const selected = [];
      let missStreak = user.missStreak;
      for (let index = 0; index < parsedCount; index += 1) {
        const prize = missStreak >= 3
          ? chooseWeighted(GUARANTEE_PRIZES, random)
          : chooseWeighted(NORMAL_PRIZES, random);
        missStreak = prize.kind === "empty" ? missStreak + 1 : 0;
        selected.push(prize);
      }

      const results = [];
      for (const prize of selected) {
        const grant = await grantReward({ userId: String(userId), drawId, prize: clone(prize) });
        const grantStatus = String(grant?.status || (prize.kind === "empty" ? "not_applicable" : "committed"));
        if (prize.kind !== "empty" && grantStatus !== "committed") {
          const error = new Error("reward grant did not commit");
          error.code = "grant_failed";
          error.status = 502;
          throw error;
        }
        results.push(publicPrize(prize, grantStatus));
      }

      user.remainingDraws -= parsedCount;
      user.missStreak = missStreak;
      const response = {
        drawId,
        animation: { key: "pixi-runtime", src: "runtime" },
        results,
        paidAmount: user.paidAmount,
        threshold: user.threshold,
        remainingDraws: user.remainingDraws,
        starterDraws: user.starterDraws,
        missStreak: user.missStreak,
        grantStatus: results.every((prize) => ["committed", "not_applicable"].includes(prize.grantStatus))
          ? "committed"
          : "pending",
      };
      user.idempotency.set(key, response);
      return clone(response);
    });
  }

  return {
    draw,
    getState,
    reset() {
      users.clear();
      locks.clear();
    },
  };
}
