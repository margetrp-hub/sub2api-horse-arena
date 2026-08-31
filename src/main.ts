import "./styles.css";
import { fetchRankingSnapshot, type RankingSnapshot } from "./api/ranking";
import { emptyPlayers } from "./data/players";
import { GameApp } from "./game/GameApp";
import { renderRankingPanel } from "./ui/RankingPanel";
import { Toast } from "./ui/toast";
import type { Player } from "./types";

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("Missing #app root");
}

appRoot.innerHTML = `
  <main class="game-shell" data-ranking-period="week" aria-label="OH！薅乐马 Pixi 小游戏">
    <section class="playfield" aria-label="网吧游戏画面">
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
const PERSONAL_ACTIVITY_KEY = "oh-haolema:personal-activity";
function currentLocalDay(): string {
  const day = new Date();
  return [day.getFullYear(), String(day.getMonth() + 1).padStart(2, "0"), String(day.getDate()).padStart(2, "0")].join("-");
}
function loadPersonalActivity(): { points: number; checkedDate: string } {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PERSONAL_ACTIVITY_KEY) ?? "{}") as { points?: unknown; checkedDate?: unknown };
    const points = Number(saved.points);
    return {
      points: Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 1280,
      checkedDate: typeof saved.checkedDate === "string" ? saved.checkedDate : "",
    };
  } catch {
    return { points: 1280, checkedDate: "" };
  }
}
const personalActivity = loadPersonalActivity();
const idlePlayers = emptyPlayers();
let selected = idlePlayers[0];
let currentPlayers: Player[] = [];
let rankingState: "loading" | "loaded" | "stale" | "unavailable" = "loading";
let rankingSnapshot: RankingSnapshot | undefined;

const game = new GameApp(gameMount, {
  players: idlePlayers,
  onPlayerSelect: (player) => selectPlayer(player, false),
  onBossHit: (hits) => toast.show(
    hits >= 3
      ? `牛老板连击 x${hits} · 墨镜都歪了`
      : `你揍了牛老板 ${hits} 下 · 他记住你了`,
  ),
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
    onSelect: (player) => selectPlayer(player),
    lottery: lotteryState,
    onLotteryOpen: () => {
      const lotteryUrl = new URL(`${import.meta.env.BASE_URL}lottery.html`, window.location.origin);
      lotteryUrl.searchParams.set("lotteryPreview", lotteryPreview ? "1" : "0");
      window.location.assign(lotteryUrl.toString());
    },
    personalPoints: personalActivity.points,
    checkedIn: personalActivity.checkedDate === currentLocalDay(),
    onCheckin: () => {
      if (personalActivity.checkedDate === currentLocalDay()) return;
      personalActivity.points += 10;
      personalActivity.checkedDate = currentLocalDay();
      try {
        window.localStorage.setItem(PERSONAL_ACTIVITY_KEY, JSON.stringify(personalActivity));
      } catch {
        // Keep the current session usable when browser storage is unavailable.
      }
      renderPanel();
      toast.show("每日签到成功 · 积分 +10");
    },
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
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    rankingSnapshot = await fetchRankingSnapshot(controller.signal);
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
    rankingState = rankingSnapshot ? "stale" : "unavailable";
    if (!rankingSnapshot) {
      currentPlayers = [];
      game.setPlayers(idlePlayers);
    }
    renderPanel();
  } finally {
    window.clearTimeout(timeout);
  }
}

void loadRankingSnapshot();
const configuredPollMs = Number(window.OH_HAOLEMA_RUNTIME?.pollMs);
const pollMs = Number.isFinite(configuredPollMs) && configuredPollMs >= 15_000
  ? configuredPollMs
  : 30_000;
window.setInterval(() => void loadRankingSnapshot(), pollMs);

game.start()
  .then(() => {
    gameRoot.dataset.ready = "true";
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Pixi scene failed to start";
    toast.show(message);
  });
