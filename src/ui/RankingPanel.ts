import type { CurrentUserStatus } from "../api/ranking";
import { formatTokens } from "../data/players";
import type { Player, RankingSource } from "../types";

type RankingPanelOptions = {
  players: Player[];
  selected: Player;
  onSelect: (player: Player) => void;
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
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
      character
    ] as string,
  );
}

function sourceLabel(source: RankingPanelOptions["source"]): string {
  if (source === "loaded") return "近 7 日 · 实时";
  if (source === "stale") return "近 7 日 · 更新失败";
  if (source === "unavailable") return "近 7 日 · 暂不可用";
  return "近 7 日 · 加载中";
}

function sourceName(source: RankingPanelOptions["rankingSource"]): string {
  return source === "sub2api" ? "Sub2API" : source === "newapi" ? "NewAPI" : "排行榜";
}

function deltaMarkup(value: number | undefined): string {
  if (!value) return "";
  const direction = value > 0 ? "up" : "down";
  const mark = value > 0 ? "↑" : "↓";
  return `<small class="rank-delta ${direction}">${mark}${Math.abs(value)}</small>`;
}

export function renderRankingPanel(root: HTMLElement, options: RankingPanelOptions): void {
  const hasRanking = options.players.length > 0;
  const current = options.currentUser;
  const boardSource = sourceName(options.rankingSource);
  const currentPosition = !current
    ? "登录后显示个人排名"
    : current.rank === null
      ? "近 7 日未上榜"
      : current.inTop
        ? `近 7 日第 ${current.rank} 名 · 已进入 TOP 10`
        : `近 7 日第 ${current.rank} 名 · 未进入 TOP 10`;
  const lottery = options.lottery ?? {
    preview: false,
    paidAmount: 0,
    threshold: 50,
    availableTokens: 0,
    starterTokens: 0,
  };
  const lotteryProgress = Math.min(100, Math.max(0, (lottery.paidAmount / lottery.threshold) * 100));
  const lotteryStatus = lottery.preview ? "READY" : "LOCKED";
  const lotteryAction = lottery.preview ? "进入扭蛋机" : "查看活动";
  const personalPoints = Math.max(0, Math.floor(options.personalPoints ?? 1280));
  const checkinAction = options.checkedIn ? "已签到 +10" : "每日签到 +10";
  const checkinStatus = options.checkedIn ? "今日已签到" : "今日未签到";
  const topTenFloor = options.players.find((player) => player.rank === 10) ?? options.players[options.players.length - 1];
  const personalGap = current && !current.inTop && topTenFloor
    ? Math.max(0, topTenFloor.tokens - current.tokens)
    : 0;
  const personalRankLabel = !current ? "未登录" : current.inTop && current.rank ? `第 ${current.rank} 名` : "未上榜";
  const personalRankDetail = !current
    ? "登录后显示个人排名"
    : current.inTop
      ? "已进入 TOP10"
      : `距 TOP10 ${formatTokens(personalGap)} Token`;

  root.innerHTML = `
    <header class="side-header">
      <div class="side-heading">
        <span class="side-title">TOKEN 周榜</span>
        <em class="source-${options.source ?? "loading"}">${escapeHtml(boardSource)} · ${sourceLabel(options.source)}</em>
      </div>
      <strong><span class="desktop-top">TOP 10</span><span class="mobile-top">TOP 3</span></strong>
    </header>
    <section class="activity-entry" aria-labelledby="activity-entry-title">
      <div class="activity-entry-head">
        <div>
          <span class="activity-entry-kicker">活动中心 / 01</span>
          <strong id="activity-entry-title">幸运扭蛋机</strong>
        </div>
        <em>${lotteryStatus}</em>
      </div>
      <p>消费每满 ${money(lottery.threshold)}，获得 1 枚抽奖代币</p>
      <div class="activity-entry-bottom">
        <div class="activity-entry-progress">
          <strong>${money(lottery.paidAmount)} / ${money(lottery.threshold)}</strong>
          <span><i style="width:${lotteryProgress.toFixed(2)}%"></i></span>
        </div>
        <strong class="activity-entry-count">${lottery.availableTokens}<small>枚</small></strong>
        <button class="lottery-open-button" type="button">${lotteryAction}</button>
      </div>
    </section>
    <ol class="ranking">
      ${hasRanking
        ? options.players
          .slice(0, 10)
          .map(
            (player) => `
              <li class="rank-card ${player.rank === options.selected.rank ? "is-selected" : ""} ${player.self ? "is-self" : ""}" data-rank="${player.rank}">
                <span class="rank-medal">${player.rank}</span>
                <span>
                  <strong>${escapeHtml(player.name)}${player.self ? '<small class="current-mark">我</small>' : ""}${player.title ? `<small class="player-title">${escapeHtml(player.title)}</small>` : ""}${deltaMarkup(player.rankDelta)}</strong>
                  <span>${formatTokens(player.tokens)} token · ${escapeHtml(player.state)}</span>
                </span>
              </li>
            `,
          )
          .join("")
        : `<li class="ranking-empty">
            <strong>近 7 日暂无 Token 消耗</strong>
            <span>有人开工后将自动上榜</span>
          </li>`}
    </ol>
    <section class="personal-card" aria-label="个人活动">
      <div class="personal-rank-line">
        <div><small>近 7 日个人排名</small><strong>${personalRankLabel}</strong></div>
        <em>${personalRankDetail}</em>
      </div>
      <div class="personal-head"><span>个人活动</span><em>${checkinStatus}</em></div>
      <div class="personal-main">
        <div class="personal-points"><small>我的积分</small><strong>${personalPoints}</strong><label>PTS</label></div>
        <button class="checkin-button" type="button" ${options.checkedIn ? "disabled" : ""}>${checkinAction}</button>
      </div>
    </section>
    <section class="self-card">
      <span>我的排名</span>
      <strong>${escapeHtml(current?.name ?? "尚未识别当前用户")}</strong>
      <span>${escapeHtml(currentPosition)}${deltaMarkup(current?.rankDelta)}</span>
      <span>${current ? `${formatTokens(current.tokens)} token${current.tokenDelta ? ` · ${current.tokenDelta > 0 ? "+" : ""}${formatTokens(current.tokenDelta)}` : ""}` : `请先登录 ${escapeHtml(boardSource)}`} · 全榜 ${formatTokens((options.totalTokens ?? 0) / 10000)} token</span>
    </section>
  `;

  root.querySelectorAll<HTMLElement>(".rank-card").forEach((card) => {
    card.addEventListener("click", () => {
      const rank = Number(card.dataset.rank);
      const player = options.players.find((item) => item.rank === rank);
      if (player) options.onSelect(player);
    });
  });
  root.querySelector<HTMLButtonElement>(".lottery-open-button")?.addEventListener("click", () => options.onLotteryOpen?.());
  root.querySelector<HTMLButtonElement>(".checkin-button")?.addEventListener("click", () => options.onCheckin?.());
}

function money(value: number): string {
  return `¥${value.toFixed(2)}`;
}
