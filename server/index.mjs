import http from "node:http";
import { fileURLToPath } from "node:url";

import {
  buildRankingSnapshot,
  getPeriodRange,
  normalizeNewApiRows,
  normalizeSub2ApiRanking,
  normalizeSub2ApiTrend,
  normalizePeriod,
} from "./normalize.mjs";
import { createLotteryService } from "./lottery.mjs";

const DEFAULT_PORT = 8788;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_CACHE_MS = 15000;

function envNumber(name, fallback, env = process.env) {
  const value = Number(env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function normalizeSource(value) {
  return String(value ?? "newapi").trim().toLowerCase() === "sub2api"
    ? "sub2api"
    : "newapi";
}

export function getConfig(env = process.env) {
  return {
    host: env.HOST || "127.0.0.1",
    port: envNumber("PORT", DEFAULT_PORT, env),
    source: normalizeSource(env.USAGE_SOURCE || env.DATA_SOURCE),
    baseUrl: trimTrailingSlash(env.NEWAPI_BASE_URL || "https://api.yhoo.lol"),
    accessToken: String(env.NEWAPI_ACCESS_TOKEN || "").trim(),
    userId: String(env.NEWAPI_USER_ID || "").trim(),
    sub2ApiBaseUrl: trimTrailingSlash(env.SUB2API_BASE_URL || "https://ohlaoo.com"),
    sub2ApiAdminApiKey: String(env.SUB2API_ADMIN_API_KEY || "").trim(),
    sub2ApiAccessToken: String(
      env.SUB2API_ACCESS_TOKEN || env.SUB2API_JWT || "",
    ).trim(),
    sub2ApiRankingPath:
      env.SUB2API_RANKING_PATH || "/api/v1/admin/dashboard/users-ranking",
    sub2ApiTrendPath:
      env.SUB2API_TREND_PATH || "/api/v1/admin/dashboard/users-trend",
    sub2ApiLimit: Math.max(
      12,
      Math.min(50, envNumber("SUB2API_QUERY_LIMIT", 50, env)),
    ),
    sub2ApiTimezone: env.SUB2API_TIMEZONE || "Asia/Shanghai",
    timeoutMs: envNumber("NEWAPI_TIMEOUT_MS", DEFAULT_TIMEOUT_MS, env),
    cacheMs: envNumber("RANKING_CACHE_MS", DEFAULT_CACHE_MS, env),
    timezoneOffsetMinutes: envNumber(
      "RANKING_TIMEZONE_OFFSET_MINUTES",
      480,
      env,
    ),
    corsOrigins: String(
      env.CORS_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173"
    )
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

function isConfigured(config) {
  if (config.source === "sub2api") {
    return config.sub2ApiAdminApiKey !== "" || config.sub2ApiAccessToken !== "";
  }
  return config.accessToken !== "" && /^\d+$/.test(config.userId);
}

function jsonResponse(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function applyCors(req, res, config) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Accept,Authorization,Content-Type,Idempotency-Key,X-Lottery-Preview",
    );
  }
}

function authHeader(accessToken) {
  return /^Bearer\s+/i.test(accessToken)
    ? accessToken
    : `Bearer ${accessToken}`;
}

function authHeaders(config, source) {
  if (source === "sub2api") {
    if (config.sub2ApiAdminApiKey) {
      return { "x-api-key": config.sub2ApiAdminApiKey };
    }
    return { Authorization: authHeader(config.sub2ApiAccessToken) };
  }
  return {
    Authorization: authHeader(config.accessToken),
    "New-Api-User": config.userId,
  };
}

async function requestJson(url, headers, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`upstream returned non-JSON (${response.status})`);
    }
    if (!response.ok) {
      throw new Error(`upstream request failed (${response.status})`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function readJsonBody(req, maxBytes = 32 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error("request body too large"), { code: "payload_too_large", status: 413 });
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("request body must be valid JSON"), { code: "invalid_json", status: 400 });
  }
}

export async function fetchCurrentSub2ApiUser(config, authorization) {
  const bearer = String(authorization ?? "").trim();
  if (config.source !== "sub2api" || !/^Bearer\s+\S+$/i.test(bearer)) return null;

  const payload = await requestJson(
    new URL(`${config.sub2ApiBaseUrl}/api/v1/auth/me`),
    { Authorization: bearer },
    config.timeoutMs,
  );
  const data = payload?.code === 0 || payload?.success === true ? payload.data : null;
  const id = Math.trunc(Number(data?.id));
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    name: String(data?.email ?? data?.username ?? data?.name ?? "").trim(),
  };
}

export async function fetchCurrentNewApiUser(
  config,
  authorization,
  cookie,
  newApiUser,
) {
  if (config.source !== "newapi") return null;
  const userId = String(newApiUser ?? "").trim();
  if (!/^\d+$/.test(userId)) return null;

  const headers = { "New-Api-User": userId };
  const browserCookie = String(cookie ?? "").trim();
  if (browserCookie) headers.Cookie = browserCookie;
  const browserAuthorization = String(authorization ?? "").trim();
  if (browserAuthorization) headers.Authorization = browserAuthorization;

  const payload = await requestJson(
    new URL(`${config.baseUrl}/api/user/self`),
    headers,
    config.timeoutMs,
  );
  const data = payload?.success === true || payload?.code === 0
    ? payload.data
    : payload?.data ?? null;
  const id = Math.trunc(Number(data?.id ?? data?.user_id ?? data?.user?.id));
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    name: String(
      data?.email ?? data?.username ?? data?.display_name ?? data?.name ?? "",
    ).trim(),
  };
}

export async function resolveCurrentUser(
  config,
  authorization,
  cookie,
  newApiUser,
) {
  return config.source === "sub2api"
    ? fetchCurrentSub2ApiUser(config, authorization)
    : fetchCurrentNewApiUser(config, authorization, cookie, newApiUser);
}

async function fetchNewApiData(config, range) {
  if (!isConfigured(config)) {
    throw new Error("NewAPI adapter is not configured");
  }

  const url = new URL(`${config.baseUrl}/api/data/users`);
  url.searchParams.set("start_timestamp", String(range.start));
  url.searchParams.set("end_timestamp", String(range.end));

  const payload = await requestJson(url, authHeaders(config, "newapi"), config.timeoutMs);
  const rows = normalizeNewApiRows(payload);
  return { rows, historyRows: rows };
}

function dateInTimezone(timestamp, timezoneOffsetMinutes) {
  return new Date(
    timestamp * 1000 + timezoneOffsetMinutes * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);
}

function sub2ApiRangeParams(url, range, config) {
  url.searchParams.set(
    "start_date",
    dateInTimezone(range.start, config.timezoneOffsetMinutes),
  );
  url.searchParams.set(
    "end_date",
    dateInTimezone(Math.max(range.start, range.end - 1), config.timezoneOffsetMinutes),
  );
  url.searchParams.set("limit", String(config.sub2ApiLimit));
  url.searchParams.set("timezone", config.sub2ApiTimezone);
}

async function fetchSub2ApiData(config, range) {
  if (!isConfigured(config)) {
    throw new Error("Sub2API adapter is not configured");
  }

  const rankingUrl = new URL(
    `${config.sub2ApiBaseUrl}${config.sub2ApiRankingPath}`,
  );
  sub2ApiRangeParams(rankingUrl, range, config);
  const rankingPayload = await requestJson(
    rankingUrl,
    authHeaders(config, "sub2api"),
    config.timeoutMs,
  );
  const rows = normalizeSub2ApiRanking(rankingPayload, range.end);

  let historyRows = rows;
  try {
    const trendUrl = new URL(`${config.sub2ApiBaseUrl}${config.sub2ApiTrendPath}`);
    sub2ApiRangeParams(trendUrl, range, config);
    trendUrl.searchParams.set("granularity", "day");
    const trendPayload = await requestJson(
      trendUrl,
      authHeaders(config, "sub2api"),
      config.timeoutMs,
    );
    const trend = normalizeSub2ApiTrend(
      trendPayload,
      config.timezoneOffsetMinutes,
    );
    if (trend.length > 0) historyRows = trend;
  } catch {
    // The ranking endpoint is sufficient for the live board. Trend data is an
    // enhancement and may not exist on older Sub2API deployments.
  }

  return { rows, historyRows };
}

export async function fetchUsageData(config, range) {
  return config.source === "sub2api"
    ? fetchSub2ApiData(config, range)
    : fetchNewApiData(config, range);
}

export function createRankingService(config, fetchData = fetchUsageData) {
  const cache = new Map();

  async function resolveData(range) {
    const result = await fetchData(config, range);
    return Array.isArray(result) ? { rows: result, historyRows: result } : result;
  }

  return async function getRanking(period = "week", limit = 10, currentUser = null) {
    const normalizedPeriod = normalizePeriod(period);
    const cacheKey = `${config.source}:${normalizedPeriod}:${limit}:${currentUser?.id ?? 0}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.value;

    const primaryRange = getPeriodRange(
      normalizedPeriod,
      now,
      config.timezoneOffsetMinutes
    );
    const historyRange = getPeriodRange(
      normalizedPeriod === "today" ? "week" : normalizedPeriod,
      now,
      config.timezoneOffsetMinutes
    );
    const [primaryData, historyData] = await Promise.all([
      resolveData(primaryRange),
      resolveData(historyRange),
    ]);
    const value = buildRankingSnapshot({
      rows: primaryData.rows,
      historyRows: historyData.historyRows ?? historyData.rows,
      period: normalizedPeriod,
      start: primaryRange.start,
      end: primaryRange.end,
      nowSeconds: Math.floor(now / 1000),
      timezoneOffsetMinutes: config.timezoneOffsetMinutes,
      limit,
      source: config.source,
      currentUser,
    });
    cache.set(cacheKey, { expiresAt: now + config.cacheMs, value });
    return value;
  };
}

export function createApp(
  config = getConfig(),
  fetchData = fetchUsageData,
  resolveUser = resolveCurrentUser,
  lottery = createLotteryService(),
) {
  const getRanking = createRankingService(config, fetchData);

  async function resolveLotteryUser(req, url) {
    const isPreview = url.searchParams.get("preview") === "1"
      && String(req.headers["x-lottery-preview"] || "") === "1";
    if (isPreview) return { id: "preview-user", name: "预览用户" };
    try {
      return await resolveUser(
        config,
        req.headers.authorization,
        req.headers.cookie,
        req.headers["new-api-user"],
      );
    } catch {
      return null;
    }
  }

  return async function handle(req, res) {
    applyCors(req, res, config);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/healthz") {
      const configured = isConfigured(config);
      jsonResponse(res, configured ? 200 : 503, {
        ok: configured,
        service: "oh-haolema-ranking-adapter",
        source: config.source,
        configured,
      });
      return;
    }

    if ((req.method === "GET" || req.method === "POST") && url.pathname.startsWith("/api/lottery/")) {
      const user = await resolveLotteryUser(req, url);
      if (!user) {
        jsonResponse(res, 401, { success: false, code: "unauthorized", message: "lottery session required" });
        return;
      }
      try {
        if (req.method === "GET" && url.pathname === "/api/lottery/state") {
          jsonResponse(res, 200, { success: true, data: lottery.getState(user.id) });
          return;
        }
        if (req.method === "POST" && url.pathname === "/api/lottery/draw") {
          const body = await readJsonBody(req);
          const data = await lottery.draw({
            userId: user.id,
            count: body?.count,
            idempotencyKey: req.headers["idempotency-key"],
          });
          jsonResponse(res, 200, { success: true, data });
          return;
        }
        if (req.method === "POST" && url.pathname === "/api/lottery/exchange") {
          const body = await readJsonBody(req);
          const data = await lottery.exchangePoints({
            userId: user.id,
            count: body?.count,
          });
          jsonResponse(res, 200, { success: true, data });
          return;
        }
        jsonResponse(res, 404, { success: false, code: "not_found" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "lottery error";
        const status = Number(error?.status) || 500;
        jsonResponse(res, status, {
          success: false,
          code: error?.code || "lottery_error",
          message,
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/ranking") {
      const period = normalizePeriod(url.searchParams.get("period") || "week");
      const requestedLimit = Number(url.searchParams.get("limit") || 10);
      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(10, Math.trunc(requestedLimit)))
        : 10;
      try {
        let currentUser = null;
        try {
          currentUser = await resolveUser(
            config,
            req.headers.authorization,
            req.headers.cookie,
            req.headers["new-api-user"],
          );
        } catch {
          currentUser = null;
        }
        const data = await getRanking(period, limit, currentUser);
        jsonResponse(res, 200, { success: true, data });
      } catch (error) {
        const message = error instanceof Error ? error.message : "upstream error";
        const status = message.includes("not configured") ? 503 : 502;
        jsonResponse(res, status, {
          success: false,
          code: status === 503 ? "not_configured" : "upstream_unavailable",
          message,
        });
      }
      return;
    }

    jsonResponse(res, 404, { success: false, code: "not_found" });
  };
}

export function startServer(config = getConfig()) {
  const handle = createApp(config);
  const server = http.createServer((req, res) => {
    handle(req, res).catch(() => {
      jsonResponse(res, 500, { success: false, code: "internal_error" });
    });
  });
  server.listen(config.port, config.host, () => {
    console.log(`OH!薅乐马 NewAPI adapter listening on ${config.host}:${config.port}`);
  });
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
