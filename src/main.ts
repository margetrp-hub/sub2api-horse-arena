import "./styles.css";
import { fetchRankingSnapshot, type RankingSnapshot } from "./api/ranking";
import { emptyPlayers } from "./data/players";
import { GameApp } from "./game/GameApp";
import { renderRankingPanel } from "./ui/RankingPanel";
import { Toast } from "./ui/toast";
import type { Player } from "./types";
import { PersonalWorkstation } from "./practice/PersonalWorkstation";
import "./ui/office.css";
import { PointsAccount } from "./ui/PointsAccount";

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("Missing #app root");
}

appRoot.innerHTML = `
  <main class="game-shell" data-ranking-period="week" aria-label="OH！薅乐马 Pixi 小游戏">
    <section class="playfield" aria-label="网吧游戏画面">
      <div class="office-scene-heading"><strong>OH! 薅乐马</strong><span>公共办公室</span></div>
      <div id="gameRoot" class="game-root"></div>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
    </section>
    <aside id="sidePanel" class="side-panel" aria-label="近 7 日 token 排行"></aside>
  </main>
`;

const gameRoot = document.querySelector<HTMLElement>("#gameRoot");
const sidePanel = document.querySelector<HTMLElement>("#sidePanel");
const toastElement = document.querySelector<HTMLElement>("#toast");

if (!gameRoot || !sidePanel || !toastElement) {
  throw new Error("Missing game layout nodes");
}

const gameMount = gameRoot;
const panelRoot = sidePanel;
const toastRoot = toastElement;

const toast = new Toast(toastRoot);
const lotteryPreview = new URLSearchParams(window.location.search).get("lotteryPreview") === "1";
const lotteryState = {
  preview: lotteryPreview,
  paidAmount: lotteryPreview ? 36.4 : 0,
  threshold: 50,
  availableTokens: lotteryPreview ? 2 : 0,
  starterTokens: lotteryPreview ? 2 : 0,
};
const pointsAccount = new PointsAccount(true);
const idlePlayers = emptyPlayers();
let selected = idlePlayers[0];
let currentPlayers: Player[] = [];
let rankingState: "loading" | "loaded" | "stale" | "unavailable" = "loading";
let rankingSnapshot: RankingSnapshot | undefined;
let rankingLoading = false;
let closed = false;
let workstationVisible = false;
let rankingController: AbortController | undefined;
let rankingTimer: number | undefined;

const game = new GameApp(gameMount, {
  players: idlePlayers,
  onPlayerSelect: (player) => selectPlayer(player, false),
  onBossHit: (hits) => toast.show(
    hits >= 3
      ? `牛老板连击 x${hits} · 墨镜都歪了`
      : `你揍了牛老板 ${hits} 下 · 他记住你了`,
  ),
});
const personalWorkstation = new PersonalWorkstation(gameMount.parentElement!, {
  onVisibilityChange: (visible) => {
    workstationVisible = visible;
    gameMount.hidden = visible;
    game.setPaused(visible || document.hidden || closed);
  },
});

function selectPlayer(player: Player, syncGame = true): void {
  selected = player;
  if (syncGame) game.selectRank(player.rank);
  renderPanel();
}

function renderPanel(): void {
  renderRankingPanel(panelRoot, {
    players: currentPlayers,
    selected,
    onSelect: (player) => {
      personalWorkstation.showOffice();
      selectPlayer(player);
    },
    onRefresh: () => void loadRankingSnapshot(),
    lottery: lotteryState,
    onLotteryOpen: () => {
      const lotteryUrl = new URL(`${import.meta.env.BASE_URL}lottery.html`, window.location.origin);
      lotteryUrl.searchParams.set("lotteryPreview", lotteryPreview ? "1" : "0");
      window.location.assign(lotteryUrl.toString());
    },
    pointsElement: pointsAccount.element,
    currentUser: rankingSnapshot?.currentUser,
    source: rankingState,
    totalTokens: rankingSnapshot?.totalTokens,
    activeUsers: rankingSnapshot?.activeUsers,
    lastSync: rankingSnapshot?.generatedAt,
    rankingSource: rankingSnapshot?.source,
  });
}

function playerKey(player: Player): string {
  return player.userId !== undefined
    ? `id:${String(player.userId)}`
    : `name:${player.name}`;
}

renderPanel();

async function loadRankingSnapshot(): Promise<void> {
  if (rankingLoading || closed || document.hidden) return;
  rankingLoading = true;
  if (!rankingSnapshot) { rankingState = "loading"; renderPanel(); }
  const controller = new AbortController();
  rankingController = controller;
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const snapshot = await fetchRankingSnapshot(controller.signal);
    if (closed || controller.signal.aborted) return;
    rankingSnapshot = snapshot;
    personalWorkstation.setIdentity(rankingSnapshot.currentUser);
    currentPlayers = rankingSnapshot.players;
    rankingState = "loaded";
    if (currentPlayers.length > 0) {
      const selectedKey = playerKey(selected);
      selected = currentPlayers.find((player) => playerKey(player) === selectedKey)
        ?? currentPlayers.find((player) => player.self)
        ?? currentPlayers[0];
    }
    game.setPlayers(currentPlayers.length > 0 ? currentPlayers : emptyPlayers());
    renderPanel();
  } catch {
    // A request timeout must leave loading and expose the existing retry action.
    // Only a departed page discards the result entirely.
    if (closed) return;
    rankingState = rankingSnapshot ? "stale" : "unavailable";
    if (!rankingSnapshot) {
      personalWorkstation.setIdentity(null);
      currentPlayers = [];
      game.setPlayers(idlePlayers);
    }
    renderPanel();
  } finally {
    rankingLoading = false;
    window.clearTimeout(timeout);
  }
}

const configuredPollMs = Number(window.OH_HAOLEMA_RUNTIME?.pollMs);
const pollMs = Number.isFinite(configuredPollMs) && configuredPollMs >= 15_000
  ? configuredPollMs
  : 30_000;
function syncActivity(): void {
  window.clearInterval(rankingTimer);
  rankingTimer = undefined;
  game.setPaused(closed || document.hidden || workstationVisible);
  if (closed || document.hidden) return;
  void loadRankingSnapshot();
  rankingTimer = window.setInterval(() => void loadRankingSnapshot(), pollMs);
}
document.addEventListener('visibilitychange', syncActivity);
window.addEventListener('pagehide', event => {
  window.clearInterval(rankingTimer);
  rankingController?.abort();
  game.setPaused(true);
  if (event.persisted) return;
  closed = true;
  document.removeEventListener('visibilitychange', syncActivity);
  personalWorkstation.destroy();
  pointsAccount.destroy();
  game.destroy();
});
window.addEventListener('pageshow', event => { if (event.persisted) syncActivity(); });
syncActivity();

game.start()
  .then(() => {
    gameRoot.dataset.ready = "true";
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Pixi scene failed to start";
    toast.show(message);
  });
