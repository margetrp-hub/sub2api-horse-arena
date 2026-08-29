const DAY_SECONDS = 24 * 60 * 60;

const PERIOD_DAYS = {
  today: 1,
  week: 7,
  month: 30,
};

export function normalizePeriod(value) {
  return Object.hasOwn(PERIOD_DAYS, value) ? value : "week";
}

export function getPeriodRange(period, nowMs = Date.now(), timezoneOffsetMinutes = 480) {
  const normalizedPeriod = normalizePeriod(period);
  const shiftedNow = new Date(nowMs + timezoneOffsetMinutes * 60 * 1000);
  const localStartMs = Date.UTC(
    shiftedNow.getUTCFullYear(),
    shiftedNow.getUTCMonth(),
    shiftedNow.getUTCDate()
  ) - timezoneOffsetMinutes * 60 * 1000;
  const startMs = localStartMs - (PERIOD_DAYS[normalizedPeriod] - 1) * DAY_SECONDS * 1000;

  return {
    period: normalizedPeriod,
    start: Math.floor(startMs / 1000),
    end: Math.floor(nowMs / 1000),
  };
}

export function finiteNumber(value, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeNewApiRows(payload) {
  if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
    throw new Error("NewAPI returned an invalid usage payload");
  }

  return payload.data
    .map((row) => ({
      userId: Math.trunc(finiteNumber(row.user_id)),
      username: String(row.username ?? "").trim(),
      modelName: String(row.model_name ?? "").trim(),
      createdAt: Math.trunc(finiteNumber(row.created_at)),
      tokenUsed: Math.max(0, Math.trunc(finiteNumber(row.token_used))),
      count: Math.max(0, Math.trunc(finiteNumber(row.count))),
    }))
    .filter((row) => row.username !== "" && row.createdAt > 0);
}

function responseData(payload) {
  if (payload?.success === true) return payload.data;
  if (payload?.code === 0) return payload.data;
  return undefined;
}

function localDateTimestamp(value, timezoneOffsetMinutes) {
  const dateText = String(value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return 0;
  const utcNoon = Date.parse(`${dateText}T12:00:00.000Z`);
  if (!Number.isFinite(utcNoon)) return 0;
  return Math.floor((utcNoon - timezoneOffsetMinutes * 60 * 1000) / 1000);
}

function sub2ApiUsername(row) {
  return String(row.email ?? row.username ?? row.name ?? "").trim();
}

function sub2ApiTokenCount(row) {
  return Math.max(
    0,
    Math.trunc(
      finiteNumber(
        row.tokens ?? row.total_tokens ?? row.token_used ?? row.token_count,
      ),
    ),
  );
}

function sub2ApiRequestCount(row) {
  return Math.max(0, Math.trunc(finiteNumber(row.requests ?? row.count)));
}

export function normalizeSub2ApiRanking(payload, createdAt = Math.floor(Date.now() / 1000)) {
  const data = responseData(payload);
  const ranking = Array.isArray(data?.ranking)
    ? data.ranking
    : Array.isArray(data?.items)
      ? data.items
      : undefined;
  if (!ranking) throw new Error("Sub2API returned an invalid ranking payload");

  return ranking
    .map((row) => ({
      userId: Math.trunc(finiteNumber(row.user_id ?? row.userId)),
      username: sub2ApiUsername(row),
      modelName: String(row.model_name ?? row.model ?? "").trim(),
      createdAt: Math.trunc(finiteNumber(row.last_seen ?? row.created_at, createdAt)),
      tokenUsed: sub2ApiTokenCount(row),
      count: sub2ApiRequestCount(row),
    }))
    .filter((row) => row.username !== "" && row.createdAt > 0);
}

export function normalizeSub2ApiTrend(
  payload,
  timezoneOffsetMinutes = 480,
) {
  const data = responseData(payload);
  const trend = Array.isArray(data?.trend) ? data.trend : undefined;
  if (!trend) throw new Error("Sub2API returned an invalid trend payload");

  return trend
    .map((row) => ({
      userId: Math.trunc(finiteNumber(row.user_id ?? row.userId)),
      username: sub2ApiUsername(row),
      modelName: String(row.model_name ?? row.model ?? "").trim(),
      createdAt: localDateTimestamp(row.date, timezoneOffsetMinutes),
      tokenUsed: sub2ApiTokenCount(row),
      count: sub2ApiRequestCount(row),
    }))
    .filter((row) => row.username !== "" && row.createdAt > 0);
}

export function maskUsername(value) {
  const username = String(value ?? "").trim();
  if (!username) return "匿名用户";
  if (username.includes("***")) return username;

  const at = username.indexOf("@");
  if (at > 0) {
    const local = username.slice(0, at);
    const domain = username.slice(at + 1);
    return `${local.slice(0, 3)}***@${domain}`;
  }
  return username.length <= 3 ? `${username}***` : `${username.slice(0, 3)}***`;
}

function userKey(row) {
  return row.userId > 0 ? `id:${row.userId}` : `name:${row.username}`;
}

function localDayKey(timestamp, timezoneOffsetMinutes) {
  const shifted = new Date(
    timestamp * 1000 + timezoneOffsetMinutes * 60 * 1000
  );
  return shifted.toISOString().slice(0, 10);
}

function createAggregate(row) {
  return {
    key: userKey(row),
    userId: row.userId,
    username: row.username,
    tokens: 0,
    requests: 0,
    firstSeen: Number.POSITIVE_INFINITY,
    lastSeen: 0,
    days: new Set(),
    daily: new Map(),
    models: new Map(),
  };
}

export function aggregateRows(rows, timezoneOffsetMinutes = 480) {
  const aggregates = new Map();

  for (const row of rows) {
    const key = userKey(row);
    const aggregate = aggregates.get(key) ?? createAggregate(row);
    aggregate.tokens += row.tokenUsed;
    aggregate.requests += row.count;
    aggregate.firstSeen = Math.min(aggregate.firstSeen, row.createdAt);
    aggregate.lastSeen = Math.max(aggregate.lastSeen, row.createdAt);
    const dayKey = localDayKey(row.createdAt, timezoneOffsetMinutes);
    aggregate.days.add(dayKey);
    aggregate.daily.set(dayKey, (aggregate.daily.get(dayKey) ?? 0) + row.tokenUsed);
    if (row.modelName) {
      aggregate.models.set(
        row.modelName,
        (aggregate.models.get(row.modelName) ?? 0) + row.tokenUsed
      );
    }
    aggregates.set(key, aggregate);
  }

  return aggregates;
}

export const FUN_WORK_LABELS = Object.freeze([
  "键盘冒烟中",
  "盯着进度条发功",
  "把报错按回去了",
  "偷偷攒业绩",
  "疯狂敲回车",
  "和延迟斗智斗勇",
  "在日志里考古",
  "把需求揉成结果",
  "给队列排队",
  "给缓存续杯",
  "让数字自己跑",
  "对着接口许愿",
  "把夜班熬成榜一",
  "正在召唤成功响应",
  "把锅先背起来",
  "用咖啡驱动生产力",
  "一边加班一边发光",
  "在数据海里冲浪",
  "给老板画饼中",
  "把复杂问题变简单",
  "跟超时赛跑",
  "进度条不能输",
  "把错误率摁住",
  "努力让电脑先下班",
  "把最后一行焊上",
  "给监控装望远镜",
  "把队友从坑里捞出",
  "用脚本搬砖",
  "和 Bug 谈判中",
  "把请求送上天",
  "让服务器保持清醒",
  "批量收割 Token",
  "低调冲榜中",
  "在后台认真摸鱼",
  "把午休做成压测",
  "假装在开会",
  "等老板路过再切屏",
  "这把结束就干活",
  "测试一下鼠标寿命",
  "偷偷看一眼战绩",
  "正在研究午饭",
  "把摸鱼写进日报",
  "给显示器充电",
  "灵感正在加载",
  "闭眼也能排查",
  "让风扇先冷静",
  "这周一定准点走",
  "干活姿势很专业",
]);

export function funWorkLabel(key, nowSeconds = Math.floor(Date.now() / 1000)) {
  let hash = 2166136261;
  const bucket = Math.floor(nowSeconds / (10 * 60));
  for (const character of `${key}:${bucket}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return FUN_WORK_LABELS[(hash >>> 0) % FUN_WORK_LABELS.length];
}

function mostUsedModel(aggregate, nowSeconds) {
  let winner = "";
  let winnerTokens = -1;
  for (const [model, tokens] of aggregate.models) {
    if (tokens > winnerTokens) {
      winner = model;
      winnerTokens = tokens;
    }
  }
  if (winner) return winner;
  return funWorkLabel(aggregate.key, nowSeconds);
}

function screenForModel(model, index) {
  const normalized = String(model ?? "").toLowerCase();
  if (/claude|gpt|api|openai|anthropic/.test(normalized)) return index % 2 ? "api" : "dashboard";
  if (/lol|moba|league/.test(normalized)) return "moba";
  if (/cs2|counter|shooter/.test(normalized)) return "shooter";
  if (/video|movie|tv/.test(normalized)) return "video";
  if (/download|sync|embed/.test(normalized)) return "download";
  if (/rank|leader/.test(normalized)) return "rank";
  if (/card|game/.test(normalized)) return "card";
  return ["dashboard", "api", "download", "rank", "video", "card"][index % 6];
}

function classifyMode(aggregate, nowSeconds) {
  if (aggregate.tokens <= 0 || aggregate.lastSeen < nowSeconds - 60 * 60) {
    return "sleep";
  }
  const elapsed = Math.max(60, nowSeconds - aggregate.firstSeen);
  return aggregate.tokens / elapsed >= 25 ? "work" : "game";
}

function dayHistory(aggregate, nowSeconds, timezoneOffsetMinutes) {
  const history = [];
  const shiftedNow = new Date(
    nowSeconds * 1000 + timezoneOffsetMinutes * 60 * 1000
  );
  const todayStart = Date.UTC(
    shiftedNow.getUTCFullYear(),
    shiftedNow.getUTCMonth(),
    shiftedNow.getUTCDate()
  );

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(todayStart - offset * DAY_SECONDS * 1000);
    const key = date.toISOString().slice(0, 10);
    history.push(aggregate.daily.get(key) ?? 0);
  }
  return history;
}

export function buildRankingSnapshot({
  rows,
  historyRows = rows,
  period = "week",
  start,
  end,
  nowSeconds = Math.floor(Date.now() / 1000),
  timezoneOffsetMinutes = 480,
  limit = 10,
  source = "newapi",
  currentUser = null,
}) {
  const current = aggregateRows(rows, timezoneOffsetMinutes);
  const history = aggregateRows(historyRows, timezoneOffsetMinutes);
  const ranked = [...current.values()]
    .filter((aggregate) => aggregate.tokens > 0)
    .sort((left, right) => right.tokens - left.tokens);
  const visibleLimit = Math.max(1, Math.min(10, Math.trunc(limit)));
  const sorted = ranked.slice(0, visibleLimit);
  const totalTokens = [...current.values()].reduce(
    (sum, aggregate) => sum + aggregate.tokens,
    0
  );
  const activeUsers = sorted.filter(
    (aggregate) => aggregate.lastSeen >= nowSeconds - 20 * 60
  ).length;

  function serializeAggregate(aggregate, index) {
    const historyAggregate = history.get(aggregate.key) ?? aggregate;
    const periodStart = finiteNumber(start, nowSeconds - PERIOD_DAYS[normalizePeriod(period)] * DAY_SECONDS);
    const elapsed = Math.max(60, nowSeconds - Math.max(periodStart, aggregate.firstSeen));
    const model = mostUsedModel(aggregate, nowSeconds);
    return {
      rank: index + 1,
      user_id: aggregate.userId,
      name: maskUsername(aggregate.username),
      tokens: aggregate.tokens,
      today_tokens: aggregate.tokens,
      week_tokens: historyAggregate.tokens,
      requests: aggregate.requests,
      days: Math.max(1, aggregate.days.size),
      rate_tokens_per_second: Math.round(aggregate.tokens / elapsed),
      last_seen: aggregate.lastSeen,
      model,
      screen: screenForModel(model, index),
      mode: classifyMode(aggregate, nowSeconds),
      history_tokens: dayHistory(historyAggregate, nowSeconds, timezoneOffsetMinutes),
    };
  }

  const currentUserId = Math.trunc(finiteNumber(currentUser?.id));
  const currentUserIndex = currentUserId > 0
    ? ranked.findIndex((aggregate) => aggregate.userId === currentUserId)
    : -1;
  const currentUserRow = currentUserId <= 0
    ? null
    : currentUserIndex >= 0
      ? {
          ...serializeAggregate(ranked[currentUserIndex], currentUserIndex),
          listed: true,
          in_top: currentUserIndex < visibleLimit,
        }
      : {
          rank: null,
          user_id: currentUserId,
          name: maskUsername(currentUser?.name),
          tokens: 0,
          today_tokens: 0,
          requests: 0,
          listed: false,
          in_top: false,
        };

  return {
    period: normalizePeriod(period),
    source,
    generated_at: new Date(nowSeconds * 1000).toISOString(),
    window: { start, end },
    total_tokens: totalTokens,
    active_top_users: activeUsers,
    current_user: currentUserRow,
    users: sorted.map(serializeAggregate),
  };
}
