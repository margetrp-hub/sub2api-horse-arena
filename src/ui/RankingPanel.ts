import type { CurrentUserStatus } from "../api/ranking";
import { formatTokens } from "../data/players";
import { assetPath } from "../game/constants";
import type { Player, RankingSource } from "../types";
import { ArrowRight, Check, CircleCheck, RefreshCw, Trophy, Unplug, UserRound } from "lucide";
import { icon } from "./icons";

type RankingPanelOptions = {
  players: Player[];
  selected: Player;
  onSelect: (player: Player) => void;
  onRefresh?: () => void;
  onLotteryOpen?: () => void;
  onCheckin?: () => void;
  personalPoints?: number;
  checkedIn?: boolean;
  lottery?: {
    preview: boolean;
    paidAmount: number;
    threshold: number;
    availableTokens: number;
    starterTokens: number;
  };
  currentUser?: CurrentUserStatus | null;
  source?: "loading" | "loaded" | "stale" | "unavailable";
  rankingSource?: RankingSource;
  totalTokens?: number;
  activeUsers?: number;
  lastSync?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] as string,
  );
}

function sourceLabel(source: RankingPanelOptions["source"]): string {
  if (source === "loaded") return "近 7 日 · 已同步";
  if (source === "stale") return "近 7 日 · 更新失败";
  if (source === "unavailable") return "近 7 日 · 暂不可用";
  return "近 7 日 · 连接中";
}

function deltaMarkup(value: number | undefined): string {
  if (!value) return "";
  return `<small class="rank-delta ${value > 0 ? "up" : "down"}">${value > 0 ? "↑" : "↓"}${Math.abs(value)}</small>`;
}

export function renderRankingPanel(root: HTMLElement, options: RankingPanelOptions): void {
  const current = options.currentUser;
  const hasSnapshot = options.source === "loaded" || options.source === "stale";
  const source = options.rankingSource === "sub2api" ? "Sub2API" : options.rankingSource === "newapi" ? "NewAPI" : "Token";
  const loading = !options.source || options.source === "loading";
  const emptyTitle = loading ? "榜单连接中" : options.source === "unavailable" ? "榜单暂时离线" : "这周，工位还很安静";
  const emptyDetail = loading ? "正在同步近 7 日消耗" : options.source === "unavailable" ? "暂时无法取得排名数据" : "近 7 日暂无 Token 消耗";
  const floor = options.players.find((player) => player.rank === 10);
  const position = !current ? "登录后显示个人排名" : current.rank === null ? "近 7 日未上榜"
    : `近 7 日第 ${current.rank} 名${current.inTop ? " · TOP 10" : ""}`;
  const gap = current && !current.inTop && floor
    ? `距 TOP 10 ${formatTokens(Math.max(0, floor.tokens - current.tokens))} Token` : "";
  const lottery = options.lottery;
  const active = document.activeElement instanceof HTMLElement && root.contains(document.activeElement)
    ? document.activeElement.dataset.focus : undefined;
  const scrollTop = root.querySelector(".ranking")?.scrollTop ?? 0;
  const syncDate = options.lastSync ? new Date(options.lastSync) : null;
  const syncTime = syncDate && Number.isFinite(syncDate.getTime())
    ? new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(syncDate) : "";

  root.innerHTML = `
    <header class="side-header board-header">
      <div><span class="board-eyebrow">${icon(Trophy)} 办公室周榜</span><h2>TOP <b>10</b></h2></div>
      <button class="board-refresh" type="button" aria-label="刷新排行榜" title="刷新排行榜" data-tooltip="刷新排行榜" data-focus="refresh" ${loading ? "disabled" : ""}>${icon(RefreshCw)}</button>
      <em class="source-${options.source ?? "loading"}"><i aria-hidden="true"></i>${escapeHtml(source)} · ${sourceLabel(options.source)}</em>
      <span class="board-sync">${syncTime ? `${syncTime} 更新` : "7 DAYS"}</span>
    </header>
    <div class="board-summary"><span>全榜消耗<strong>${hasSnapshot ? formatTokens((options.totalTokens ?? 0) / 10000) : "--"}<small>Token</small></strong></span><span>活跃人数<strong>${hasSnapshot ? options.activeUsers ?? 0 : "--"}<small>人</small></strong></span></div>
    <ol class="ranking board-list" aria-label="近 7 日 Token TOP 10" aria-busy="${loading}">
      ${options.players.length ? options.players.slice(0, 10).map((player) => `
        <li class="rank-card ${player.rank === options.selected.rank ? "is-selected" : ""} ${player.self ? "is-self" : ""}" data-rank="${player.rank}">
          <button class="rank-select" type="button" data-focus="rank-${player.rank}" aria-pressed="${player.rank === options.selected.rank}">
            <span class="rank-medal">${String(player.rank).padStart(2, "0")}</span>
            <span class="board-player"><strong>${escapeHtml(player.name)}${player.self ? '<small class="current-mark">我</small>' : ""}</strong><span>${escapeHtml(player.state)}${player.title ? ` · ${escapeHtml(player.title)}` : ""}</span></span>
            <span class="board-tokens">${formatTokens(player.tokens)}${deltaMarkup(player.rankDelta)}</span>
          </button>
        </li>`).join("") : `
        <li class="ranking-empty board-empty">${icon(options.source === "unavailable" ? Unplug : Trophy)}<strong>${emptyTitle}</strong><span>${emptyDetail}</span>${options.source === "unavailable" ? '<button type="button" class="board-retry" data-focus="retry">重新连接</button>' : ""}</li>`}
    </ol>
    <section class="board-personal" aria-label="我的排名与本地签到">
      <div class="board-identity">${icon(UserRound)}<div><strong>${escapeHtml(current?.name ?? "访客工位")}</strong><span>${escapeHtml(position)}</span></div>${current ? `<b>${formatTokens(current.tokens)}</b>` : ""}</div>
      ${gap ? `<p class="board-gap">${escapeHtml(gap)}</p>` : ""}
      <div class="board-checkin"><span>本机积分 <b>${Math.max(0, Math.floor(options.personalPoints ?? 1280))}</b></span><button class="checkin-button" data-focus="checkin" type="button" ${options.checkedIn ? "disabled" : ""}>${icon(options.checkedIn ? Check : CircleCheck)}${options.checkedIn ? "今日已签到" : "签到 +10"}</button></div>
    </section>
    <section class="board-activity" aria-labelledby="activity-entry-title">
      <img src="${assetPath("lottery-capsule-machine.png")}" alt="" width="52" height="68">
      <div><span>活动中心</span><h3 id="activity-entry-title">幸运扭蛋机</h3><small>${lottery?.preview ? `预览 · ${lottery.availableTokens} 枚代币` : "活动暂未开放"}</small></div>
      <button class="lottery-open-button" data-focus="lottery" type="button" aria-label="查看幸运扭蛋机" title="查看幸运扭蛋机">${icon(ArrowRight)}</button>
    </section>
  `;

  root.querySelectorAll<HTMLButtonElement>(".rank-select").forEach((button) => {
    button.addEventListener("click", () => {
      const rank = Number(button.closest<HTMLElement>("[data-rank]")?.dataset.rank);
      const player = options.players.find((item) => item.rank === rank);
      if (player) options.onSelect(player);
    });
  });
  root.querySelectorAll<HTMLButtonElement>(".board-refresh, .board-retry").forEach((button) =>
    button.addEventListener("click", () => options.onRefresh?.()));
  root.querySelector<HTMLButtonElement>(".lottery-open-button")?.addEventListener("click", () => options.onLotteryOpen?.());
  root.querySelector<HTMLButtonElement>(".checkin-button")?.addEventListener("click", () => options.onCheckin?.());
  const list = root.querySelector(".ranking");
  if (list) list.scrollTop = scrollTop;
  if (active) {
    const target = [...root.querySelectorAll<HTMLButtonElement>("[data-focus]")].find((button) => button.dataset.focus === active);
    if (target && !target.disabled) target.focus({ preventScroll: true });
  }
}
