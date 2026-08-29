import type { CurrentUserStatus } from "../api/ranking";
import { formatTokens } from "../data/players";
import type { Player, RankingSource } from "../types";

type RankingPanelOptions = {
  players: Player[];
  selected: Player;
  onSelect: (player: Player) => void;
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

  root.innerHTML = `
    <header class="side-header">
      <div class="side-heading">
        <span class="side-title">TOKEN 周榜</span>
        <em class="source-${options.source ?? "loading"}">${escapeHtml(boardSource)} · ${sourceLabel(options.source)}</em>
      </div>
      <strong><span class="desktop-top">TOP 10</span><span class="mobile-top">TOP 3</span></strong>
    </header>
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
}
