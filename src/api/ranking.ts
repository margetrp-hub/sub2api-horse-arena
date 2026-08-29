import type { HorseMode, Player, RankingSource, ScreenTheme } from "../types";
import { dailyTitle } from "../data/dailyTitles";

type RankingRow = {
  rank?: number | string | null;
  user_id?: number | string;
  name?: string;
  tokens?: number | string;
  today_tokens?: number | string;
  requests?: number | string;
  days?: number | string;
  model?: string;
  mode?: string;
  screen?: string;
  listed?: boolean;
  in_top?: boolean;
};

type RankingResponse = {
  success?: boolean;
  data?: {
    source?: string;
    generated_at?: string;
    total_tokens?: number | string;
    active_top_users?: number | string;
    current_user?: RankingRow | null;
    users?: RankingRow[];
  };
  message?: string;
};

export type RankingSnapshot = {
  players: Player[];
  currentUser: CurrentUserStatus | null;
  source: RankingSource;
  totalTokens: number;
  activeUsers: number;
  generatedAt: string;
};

export type CurrentUserStatus = {
  userId: number | string;
  name: string;
  rank: number | null;
  tokens: number;
  listed: boolean;
  inTop: boolean;
  rankDelta?: number;
  tokenDelta?: number;
};

const queryParams = new URLSearchParams(window.location.search);
const embeddedAuthToken = String(queryParams.get("token") ?? "").trim();
if (embeddedAuthToken) {
  const sanitizedUrl = new URL(window.location.href);
  sanitizedUrl.searchParams.delete("token");
  window.history.replaceState(window.history.state, "", sanitizedUrl);
}

const SCREEN_THEMES: ScreenTheme[] = [
  "dashboard",
  "api",
  "moba",
  "shooter",
  "video",
  "download",
  "rank",
  "card",
  "afk",
  "fishing",
];

function finite(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function runtimeConfig() {
  return window.OH_HAOLEMA_RUNTIME ?? {};
}

function newApiUserId(): string {
  const configured = String(runtimeConfig().selfUserId ?? "").trim();
  if (configured) return configured;
  try {
    return String(window.localStorage.getItem("uid") ?? "").trim();
  } catch {
    return "";
  }
}

function browserAuthorization(): string {
  if (embeddedAuthToken) return `Bearer ${embeddedAuthToken}`;
  try {
    const stored = String(window.localStorage.getItem("auth_token") ?? "").trim();
    if (!stored) return "";
    return /^Bearer\s+/i.test(stored) ? stored : `Bearer ${stored}`;
  } catch {
    return "";
  }
}

function endpoint(): string {
  const configured = new URLSearchParams(window.location.search).get("api");
  const base = String(configured || runtimeConfig().apiBase || window.location.origin).replace(/\/$/, "");
  if (window.location.protocol === "file:" && !configured && !runtimeConfig().apiBase) return "";
  const url = new URL(runtimeConfig().rankingPath || "/api/ranking", base);
  url.searchParams.set("period", "week");
  url.searchParams.set("limit", "10");
  return url.toString();
}

function modeFor(row: RankingRow): HorseMode {
  if (row.mode === "sleep") return "sleep";
  if (row.mode === "game") return "gaming";
  if (row.mode === "overdrive") return "overdrive";
  return "working";
}

function screenFor(row: RankingRow, index: number): ScreenTheme {
  if (SCREEN_THEMES.includes(row.screen as ScreenTheme)) return row.screen as ScreenTheme;
  const model = String(row.model ?? "").toLowerCase();
  if (/lol|moba|league/.test(model)) return "moba";
  if (/cs2|counter|shooter/.test(model)) return "shooter";
  if (/video|movie|tv/.test(model)) return "video";
  if (/download|sync|embed/.test(model)) return "download";
  if (/rank|leader/.test(model)) return "rank";
  if (/card|game/.test(model)) return "card";
  return SCREEN_THEMES[index % SCREEN_THEMES.length];
}

function stateFor(row: RankingRow, mode: HorseMode): string {
  const model = String(row.model ?? "").trim();
  if (mode === "sleep") return "暂时离开工位";
  if (mode === "gaming") return model ? `${model} 摸鱼中` : "摸鱼中";
  if (mode === "overdrive") return "Token 冲刺中";
  return model ? `${model} 工作中` : "API 工作中";
}

function isSelf(row: RankingRow, currentUserId: RankingRow["user_id"]): boolean {
  return currentUserId !== undefined && String(row.user_id ?? "") === String(currentUserId);
}

export async function fetchRankingSnapshot(signal?: AbortSignal): Promise<RankingSnapshot> {
  const url = endpoint();
  if (!url) throw new Error("Ranking endpoint is not configured");

  const headers: Record<string, string> = { Accept: "application/json" };
  const authorization = browserAuthorization();
  if (authorization) headers.Authorization = authorization;
  const userId = newApiUserId();
  if (userId) headers["New-Api-User"] = userId;
  const response = await fetch(url, {
    headers,
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = (await response.json()) as RankingResponse;
  if (!response.ok || payload.success !== true || !Array.isArray(payload.data?.users)) {
    throw new Error(payload.message || "排行榜接口不可用");
  }

  const currentRow = payload.data.current_user ?? null;
  const currentUserId = currentRow?.user_id;
  const source = String(payload.data.source || "newapi").toLowerCase() === "sub2api"
    ? "sub2api"
    : "newapi";
  const players = payload.data.users.slice(0, 10).map((row, index) => {
    const mode = modeFor(row);
    return {
      rank: Math.max(1, Math.trunc(finite(row.rank, index + 1))),
      userId: row.user_id,
      name: String(row.name || "匿名用户"),
      tokens: Math.max(0, finite(row.tokens)) / 10000,
      state: stateFor(row, mode),
      mode,
      screen: screenFor(row, index),
      title: dailyTitle({
        rank: Math.max(1, Math.trunc(finite(row.rank, index + 1))),
        userId: row.user_id,
        name: String(row.name || "匿名用户"),
        mode,
      }),
      self: isSelf(row, currentUserId),
    } satisfies Player;
  });

  const currentRank = currentRow?.rank == null
    ? null
    : Math.max(1, Math.trunc(finite(currentRow.rank)));
  const currentUser = currentRow
    ? {
        userId: currentRow.user_id ?? "",
        name: String(currentRow.name || "当前用户"),
        rank: currentRank,
        tokens: Math.max(0, finite(currentRow.tokens)) / 10000,
        listed: currentRow.listed === true,
        inTop: currentRow.in_top === true,
      }
    : null;

  return {
    players,
    currentUser,
    source: source satisfies RankingSource,
    totalTokens: Math.max(0, finite(payload.data.total_tokens)),
    activeUsers: Math.max(0, Math.min(10, Math.round(finite(payload.data.active_top_users)))),
    generatedAt: String(payload.data.generated_at || new Date().toISOString()),
  };
}
