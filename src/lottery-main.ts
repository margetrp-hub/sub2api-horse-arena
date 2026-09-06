import "./lottery-page.css";
import { LotteryMachineRuntime } from "./lottery-machine-runtime";
import { browserSessionHeaders } from "./api/ranking";
import { ArrowLeft, ArrowRight, CircleHelp, Coins, Gift, LockKeyhole, RefreshCw, Ticket, X } from "lucide";
import { icon } from "./ui/icons";

type PrizeKind = "empty" | "balance" | "coupon" | "subscription";

type Prize = {
  id: string;
  label: string;
  detail: string;
  kind: PrizeKind;
  grantStatus: "committed" | "not_applicable" | "pending";
};

type LotteryStateResponse = {
  available?: boolean;
  reason?: string;
  paidAmount: number;
  threshold: number;
  starterTokens: number;
  starterDraws: number;
  lotteryTokens: number;
  remainingDraws: number;
  points: number;
  tokenExchangeCost: number;
  missStreak: number;
  animation?: { key: string; src: string };
};

type LotteryDrawResponse = LotteryStateResponse & {
  drawId: string;
  results: Prize[];
  grantStatus: "committed" | "pending";
  animation: { key: string; src: string };
};

const appRoot = document.querySelector<HTMLDivElement>("#lottery-app");

if (!appRoot) {
  throw new Error("Missing #lottery-app root");
}

const root = appRoot;
const assetBase = import.meta.env.BASE_URL;
const lotteryApiBase = "/api/lottery";

const params = new URLSearchParams(window.location.search);
const previewRequested = params.get("lotteryPreview") === "1";
let preview = false;
const state = {
  phase: "loading" as "loading" | "idle" | "requesting" | "rolling" | "revealed" | "exchanging",
  paidAmount: 0,
  threshold: 50,
  lotteryTokens: 0,
  remainingDraws: 0,
  starterTokens: 0,
  starterDraws: 0,
  points: 0,
  pointsLoaded: false,
  tokenExchangeCost: 0,
  missStreak: 0,
  pendingResults: null as Prize[] | null,
  revealedResults: null as Prize[] | null,
  drawId: null as string | null,
  grantStatus: null as "committed" | "pending" | null,
  apiReady: false,
  apiError: null as string | null,
  loadError: null as "login" | "unavailable" | null,
};

let activeRuntime: LotteryMachineRuntime | null = null;
let returnFocusKey: string | undefined;

function money(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function prizeIcon(kind: PrizeKind): string {
  if (kind === "balance") return "¥";
  if (kind === "subscription") return "日";
  if (kind === "coupon") return "%";
  return "·";
}

function renderResultModal(): string {
  if (state.phase !== "revealed" || !state.revealedResults) return "";
  const chips = state.revealedResults.map((prize) => `
    <span class="result-chip result-${prize.kind}">
      <i>${prizeIcon(prize.kind)}</i>${escapeHtml(prize.label)}
    </span>
  `).join("");
  const detail = state.revealedResults.map((prize) => prize.detail).join(" · ");
  const deliveryNote = preview
    ? "服务端预览，不写入真实账户"
    : state.grantStatus === "committed"
      ? "奖品已发放"
      : "奖品发放处理中";
  return `
    <div class="lottery-result-backdrop" data-result-dismiss></div>
    <section class="lottery-result-modal" role="dialog" aria-modal="true" aria-labelledby="lottery-result-title">
      <button class="result-close icon-button" type="button" aria-label="关闭中奖结果" title="关闭中奖结果" data-result-dismiss>${icon(X)}</button>
      <div class="result-kicker">本次结果</div>
      <h2 id="lottery-result-title" tabindex="-1">${state.revealedResults.length === 1 ? escapeHtml(state.revealedResults[0].label) : `${state.revealedResults.length} 个扭蛋已开出`}</h2>
      <img class="opened-capsule-art" src="${assetBase}assets/lottery-capsule-open-v1.png" alt="已打开的幸运扭蛋">
      <div class="result-chips">${chips}</div>
      <p>${escapeHtml(detail)} · ${deliveryNote}</p>
      <button class="result-confirm" type="button" data-result-dismiss>知道了</button>
    </section>
  `;
}

function render(): void {
  const focusKey = (document.activeElement as HTMLElement | null)?.dataset.focus ?? returnFocusKey;
  if (focusKey) returnFocusKey = focusKey;
  activeRuntime?.destroy();
  activeRuntime = null;
  const progress = Math.min(100, (state.paidAmount / state.threshold) * 100);
  const remaining = Math.max(0, state.threshold - state.paidAmount);
  const canDraw = state.apiReady && state.phase === "idle" && !state.pendingResults && state.lotteryTokens > 0;
  const canFiveDraw = canDraw && state.lotteryTokens >= 5;
  const canExchange = state.apiReady && state.phase === "idle" && state.tokenExchangeCost > 0 && state.points >= state.tokenExchangeCost;
  const busy = ["loading", "requesting", "rolling", "exchanging"].includes(state.phase);
  const machineStatus = ({
    loading: "正在连接", requesting: "正在确认抽奖", rolling: "好运正在出仓",
    revealed: "扭蛋已揭晓", exchanging: "正在兑换代币", idle: state.apiReady ? "等待下一份好运" : "期待下一次开启",
  })[state.phase];
  const status = state.phase === "loading" ? "连接中" : preview ? "活动预览" : state.apiReady ? "活动进行中" : "暂未开放";
  const errorNotice = state.loadError === "login"
    ? `<div class="notice-copy">${icon(LockKeyhole)}<div><strong>登录后查看账户</strong><p>积分与抽奖代币将在这里显示</p></div></div><a class="notice-link" href="${window.OH_HAOLEMA_RUNTIME?.source === "sub2api" ? "/login" : "/sign-in"}">登录 ${icon(ArrowRight)}</a>`
    : state.loadError === "unavailable"
      ? `<div class="notice-copy">${icon(CircleHelp)}<div><strong>暂时无法连接活动</strong><p>请稍后再试</p></div></div><button class="icon-button" data-retry data-focus="retry" title="重新连接" aria-label="重新连接活动服务">${icon(RefreshCw)}</button>`
      : state.apiError
        ? `<div class="notice-copy">${icon(state.apiReady ? CircleHelp : LockKeyhole)}<div><strong>${state.apiReady ? "操作未完成" : "活动筹备中"}</strong><p>${escapeHtml(state.apiError)}</p></div></div>`
        : "";

  root.innerHTML = `
    <div class="lottery-page" data-phase="${state.phase}">
      <header class="lottery-topbar">
        <a class="brand-lockup" href="${assetBase}" aria-label="回到薅乐马">
          <span class="brand-mark">OH!</span>
          <span><strong>薅乐马</strong><small>打工人的快乐据点</small></span>
        </a>
        <a class="back-link" href="${assetBase}">${icon(ArrowLeft)}<span>回到工位</span></a>
      </header>

      <main class="lottery-layout">
        <section class="lottery-hero" aria-labelledby="lottery-title">
          <div class="hero-copy">
            <span class="hero-eyebrow">OH! / LUCKY CAPSULE</span>
            <h1 id="lottery-title">幸运<span>扭蛋机</span><i aria-hidden="true">!</i></h1>
            <p>给努力的一天，添一点好运。</p>
          </div>
          <div class="machine-stage">
            <div class="machine-floor" aria-hidden="true"></div>
            <div class="lottery-runtime" data-can-draw="${canDraw}"></div>
          </div>
          <div class="stage-caption"><span class="stage-number">NO. 01</span><span class="machine-status" role="status"><i class="${busy ? "is-busy" : ""}"></i>${machineStatus}</span><span class="stage-edition">OH! CLUB</span></div>
        </section>

        <section class="lottery-rail" aria-label="抽奖信息" aria-busy="${busy}">
          <div class="rail-heading"><h2 tabindex="-1">我的好运账户</h2><span class="activity-pill" data-ready="${state.apiReady}"><i></i>${status}</span></div>
          <div class="account-balances">
            <div class="balance-item token-balance"><span class="card-label">${icon(Ticket)}抽奖代币</span><div><strong class="chance-number">${state.pointsLoaded ? state.lotteryTokens.toLocaleString() : "--"}</strong><span>枚</span></div></div>
            <div class="balance-item"><span class="card-label">${icon(Coins)}账户积分</span><div><strong class="points-number">${state.pointsLoaded ? state.points.toLocaleString() : "--"}</strong><span>PTS</span></div></div>
          </div>
          ${errorNotice ? `<div class="account-notice" role="status">${errorNotice}</div>` : ""}
          <div class="draw-section">
            <div class="section-label"><h3>扭一份好运</h3><span>${preview ? "预览代币 · 不计入真实账户" : state.apiReady ? "代币已就绪" : "开放时间待公布"}</span></div>
            <div class="draw-actions">
              <button class="draw-action primary" type="button" data-draw="single" data-focus="single" ${canDraw ? "" : "disabled"}><span>${icon(Gift)}${state.phase === "requesting" || state.phase === "rolling" ? "正在抽奖" : "扭一次"}</span><small>1 枚代币</small></button>
              <button class="draw-action secondary" type="button" data-draw="five" data-focus="five" ${canFiveDraw ? "" : "disabled"}><span>五连扭 ${icon(ArrowRight)}</span><small>5 枚代币</small></button>
            </div>
          </div>
          <div class="exchange-section">
            <div><h3>积分换代币</h3><p>${state.tokenExchangeCost > 0 ? `${state.tokenExchangeCost} 积分 / 枚` : "兑换暂未开放"}</p></div>
            <button class="exchange-button" type="button" data-exchange data-focus="exchange" ${canExchange ? "" : "disabled"}>${icon(RefreshCw)}${state.phase === "exchanging" ? "兑换中" : "兑换 1 枚"}</button>
          </div>
          ${preview ? `<section class="progress-section" aria-label="消费进度">
            <div class="section-label"><h3>下一枚消费代币</h3><span>${money(state.paidAmount)} / ${money(state.threshold)}</span></div>
            <progress max="100" value="${progress}" aria-label="消费进度"></progress>
            <p>${remaining > 0 ? `还差 ${money(remaining)}` : "下一枚代币已达成"}<span>赠送代币 ${state.starterTokens} 枚 · 30 天有效</span></p>
          </section>` : ""}
          <section class="prize-section" aria-labelledby="prize-title">
            <div class="section-label"><h3 id="prize-title">扭蛋里有什么</h3><span>${preview ? "预览奖池" : "敬请期待"}</span></div>
            ${preview ? `<div class="prize-grid">
              <div class="prize-item"><i>¥</i><span>余额奖励<strong>1 / 2 / 3 / 5 元</strong></span></div>
              <div class="prize-item"><i>${icon(Gift)}</i><span>活动订阅<strong>1 / 3 / 7 天</strong></span></div>
              <div class="prize-item"><i>%</i><span>充值加赠<strong>5%</strong></span></div>
              <div class="prize-item"><i>${icon(Ticket)}</i><span>普通结果<strong>谢谢参与</strong></span></div>
            </div><p class="prize-note">连续 3 次未中奖，第 4 次保底普通奖</p>`
            : `<div class="prize-pending"><img src="${assetBase}assets/lottery-capsule-open-v1.png" alt="" width="84" height="84"><div><strong>惊喜，还在准备中</strong><p>本期奖品即将公布</p></div></div>`}
          </section>
          <footer class="rail-footer"><span>薅乐马 · 幸运补给站</span><span>GOOD LUCK!</span></footer>
        </section>
      </main>
      ${renderResultModal()}
    </div>
  `;
  bindEvents();
  const modalOpen = state.phase === "revealed";
  root.querySelector<HTMLElement>(".lottery-topbar")!.inert = modalOpen;
  root.querySelector<HTMLElement>(".lottery-layout")!.inert = modalOpen;
  document.documentElement.classList.toggle("lottery-modal-open", modalOpen);
  if (modalOpen) root.querySelector<HTMLElement>("#lottery-result-title")?.focus();
  else if (focusKey) root.querySelector<HTMLElement>(`[data-focus="${CSS.escape(focusKey)}"]`)?.focus();
  if (!busy) returnFocusKey = undefined;
}
function bindEvents(): void {
  root.querySelector<HTMLButtonElement>("[data-retry]")?.addEventListener("click", () => {
    state.phase = "loading";
    state.loadError = null;
    state.apiError = null;
    render();
    void loadLotteryState();
  });
  root.querySelector<HTMLButtonElement>("[data-draw='single']")?.addEventListener("click", () => void draw(1));
  root.querySelector<HTMLButtonElement>("[data-draw='five']")?.addEventListener("click", () => void draw(5));
  root.querySelector<HTMLButtonElement>("[data-exchange]")?.addEventListener("click", () => void exchangePoints(1));
  root.querySelectorAll<HTMLElement>("[data-result-dismiss]").forEach((element) => {
    element.addEventListener("click", () => dismissResult());
  });

  const runtimeMount = root.querySelector<HTMLElement>(".lottery-runtime");
  if (runtimeMount) {
    activeRuntime = new LotteryMachineRuntime(runtimeMount, {
      onActivate: () => void draw(1),
      onComplete: finishSpin,
    });
    if (state.phase === "rolling") activeRuntime.play();
  }
}

async function draw(count: number): Promise<void> {
  if (!state.apiReady || state.phase !== "idle" || state.pendingResults) return;
  if (state.lotteryTokens < count) {
    return;
  }
  state.phase = "requesting";
  state.revealedResults = null;
  state.apiError = null;
  render();
  let drawStarted = false;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    };
    if (preview) headers["X-Lottery-Preview"] = "1";
    const response = await fetch(`${lotteryApiBase}/draw${preview ? "?preview=1" : ""}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ count }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; data?: LotteryDrawResponse; message?: string } | null;
    if (!response.ok || !payload?.success || !payload.data) {
      throw new Error(payload?.message || `抽奖服务请求失败（${response.status}）`);
    }
    const data = payload.data;
    if (Number.isFinite(data.paidAmount)) state.paidAmount = data.paidAmount;
    if (Number.isFinite(data.threshold) && data.threshold > 0) state.threshold = data.threshold;
    if (Number.isFinite(data.starterTokens)) state.starterTokens = data.starterTokens;
    if (Number.isFinite(data.starterDraws)) state.starterDraws = data.starterDraws;
    if (Number.isFinite(data.lotteryTokens)) state.lotteryTokens = data.lotteryTokens;
    if (Number.isFinite(data.remainingDraws)) state.remainingDraws = data.remainingDraws;
    if (Number.isFinite(data.points)) state.points = data.points;
    if (Number.isFinite(data.missStreak)) state.missStreak = data.missStreak;
    state.drawId = data.drawId;
    state.grantStatus = data.grantStatus;
    state.pendingResults = data.results;
    state.phase = "rolling";
    drawStarted = true;
  } catch (error) {
    state.phase = "idle";
    state.apiError = error instanceof Error ? error.message : "抽奖服务暂时不可用";
  }
  if (drawStarted && typeof navigator.vibrate === "function") navigator.vibrate(count === 1 ? 35 : [30, 45, 30]);
  render();
}

async function exchangePoints(count: number): Promise<void> {
  if (!state.apiReady || state.phase !== "idle" || state.tokenExchangeCost <= 0 || state.points < state.tokenExchangeCost) return;
  state.phase = "exchanging";
  state.apiError = null;
  render();
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    };
    if (preview) headers["X-Lottery-Preview"] = "1";
    const response = await fetch(`${lotteryApiBase}/exchange${preview ? "?preview=1" : ""}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ count }),
    });
    const payload = await response.json().catch(() => null) as { success?: boolean; data?: LotteryStateResponse; message?: string; code?: string } | null;
    if (!response.ok || !payload?.success || !payload.data) {
      if (payload?.code === "insufficient_points") throw new Error("账户积分不足，暂时无法兑换");
      throw new Error(payload?.message || `积分兑换请求失败（${response.status}）`);
    }
    const data = payload.data;
    if (Number.isFinite(data.points)) state.points = data.points;
    if (Number.isFinite(data.lotteryTokens)) state.lotteryTokens = data.lotteryTokens;
    if (Number.isFinite(data.remainingDraws)) state.remainingDraws = data.remainingDraws;
    state.apiError = null;
  } catch (error) {
    state.apiError = error instanceof Error ? error.message : "积分兑换暂时不可用";
  }
  state.phase = "idle";
  render();
}

function finishSpin(): void {
  if (state.phase !== "rolling" || !state.pendingResults) return;
  state.revealedResults = state.pendingResults;
  state.pendingResults = null;
  state.phase = "revealed";
  render();
}

function dismissResult(): void {
  if (state.phase !== "revealed") return;
  state.revealedResults = null;
  state.drawId = null;
  state.grantStatus = null;
  state.phase = "idle";
  render();
  const drawButton = root.querySelector<HTMLButtonElement>("[data-draw='single']");
  if (drawButton && !drawButton.disabled) drawButton.focus();
  else root.querySelector<HTMLElement>(".rail-heading h2")?.focus();
}

async function loadLotteryState(): Promise<void> {
  state.loadError = null;
  const headers: Record<string, string> = previewRequested ? {} : browserSessionHeaders();
  if (previewRequested) headers["X-Lottery-Preview"] = "1";
  try {
    const response = await fetch(`${lotteryApiBase}/state${previewRequested ? "?preview=1" : ""}`, { headers, credentials: "include", cache: "no-store" });
    const payload = await response.json().catch(() => null) as { success?: boolean; data?: LotteryStateResponse; message?: string } | null;
    if (!response.ok || !payload?.success || !payload.data) {
      if (response.status === 401) {
        state.loadError = "login";
        throw new Error("登录后可查看积分");
      }
      throw new Error(payload?.message || `活动服务请求失败（${response.status}）`);
    }
    const data = payload.data;
    if (!Number.isSafeInteger(data.points)) throw new Error("积分数据无效，请稍后重试");
    preview = previewRequested && data.available !== false;
    Object.assign(state, data);
    state.pointsLoaded = true;
    if (!Number.isFinite(Number(data.lotteryTokens))) state.lotteryTokens = Number(data.remainingDraws) || 0;
    if (!Number.isFinite(Number(data.remainingDraws))) state.remainingDraws = state.lotteryTokens;
    if (!Number.isFinite(Number(data.starterTokens))) state.starterTokens = Number(data.starterDraws) || 0;
    if (!Number.isFinite(Number(data.tokenExchangeCost)) || Number(data.tokenExchangeCost) < 1) state.tokenExchangeCost = preview ? 100 : 0;
    state.apiReady = data.available !== false;
    state.apiError = data.available === false ? data.reason || "抽奖与积分兑换暂未开放" : null;
    state.phase = "idle";
  } catch (error) {
    state.apiReady = false;
    preview = false;
    state.loadError ??= "unavailable";
    state.apiError = error instanceof Error ? error.message : "活动服务暂时不可用";
    state.phase = "idle";
  }
  render();
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.phase === "revealed") dismissResult();
  if (event.key === "Tab" && state.phase === "revealed") {
    const controls = root.querySelectorAll<HTMLButtonElement>(".lottery-result-modal button");
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement?.id === "lottery-result-title")) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

render();
void loadLotteryState();
