import "./lottery-page.css";
import { LotteryMachineRuntime } from "./lottery-machine-runtime";
import { browserSessionHeaders } from "./api/ranking";

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
const preview = params.get("lotteryPreview") === "1";
const state = {
  phase: "loading" as "loading" | "idle" | "requesting" | "rolling" | "revealed" | "exchanging",
  paidAmount: 0,
  threshold: 50,
  lotteryTokens: 0,
  remainingDraws: 0,
  starterTokens: 0,
  starterDraws: 0,
  points: preview ? 1280 : 0,
  pointsLoaded: false,
  tokenExchangeCost: preview ? 100 : 0,
  missStreak: 0,
  pendingResults: null as Prize[] | null,
  revealedResults: null as Prize[] | null,
  drawId: null as string | null,
  grantStatus: null as "committed" | "pending" | null,
  apiReady: false,
  apiError: null as string | null,
};

let activeRuntime: LotteryMachineRuntime | null = null;

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
      <button class="result-close" type="button" aria-label="关闭中奖结果" data-result-dismiss>×</button>
      <div class="result-kicker">本次结果</div>
      <h2 id="lottery-result-title">${state.revealedResults.length === 1 ? escapeHtml(state.revealedResults[0].label) : `${state.revealedResults.length} 个扭蛋已开出`}</h2>
      <img class="opened-capsule-art" src="${assetBase}assets/lottery-capsule-open-v1.png" alt="已打开的幸运扭蛋">
      <div class="result-chips">${chips}</div>
      <p>${escapeHtml(detail)} · ${deliveryNote}</p>
      <button class="result-confirm" type="button" data-result-dismiss>知道了</button>
    </section>
  `;
}

function render(): void {
  activeRuntime?.destroy();
  activeRuntime = null;
  const progress = Math.min(100, (state.paidAmount / state.threshold) * 100);
  const remaining = Math.max(0, state.threshold - state.paidAmount);
  const canDraw = state.apiReady && state.phase === "idle" && !state.pendingResults && state.lotteryTokens > 0;
  const canFiveDraw = canDraw && state.lotteryTokens >= 5;
  const canExchange = state.apiReady && state.phase === "idle" && state.tokenExchangeCost > 0 && state.points >= state.tokenExchangeCost;
  const machineStatus = state.phase === "loading"
    ? "连接活动服务"
    : state.phase === "requesting"
      ? "确认抽奖结果"
      : state.phase === "rolling"
        ? "机器运转中"
        : state.phase === "revealed"
          ? "结果已揭晓"
          : state.phase === "exchanging"
            ? "积分兑换中"
            : "等待抽奖";
  const apiStatus = state.apiError
    ? `<small class="chance-error">${escapeHtml(state.apiError)}</small>`
    : "";

  root.innerHTML = `
    <div class="lottery-page" data-phase="${state.phase}">
      <header class="lottery-topbar">
        <a class="brand-lockup" href="${assetBase}game.html${preview ? '?lotteryPreview=1' : ''}" aria-label="回到 OH! 薅乐马">
          <span class="brand-mark">OH!</span>
          <span><strong>薅乐马</strong><small>AI 社区活动中心</small></span>
        </a>
        <div class="topbar-meta">
          <span class="activity-pill"><i></i>${preview ? '活动预览' : '暂未开放'}</span>
          <a class="back-link" href="${assetBase}game.html${preview ? '?lotteryPreview=1' : ''}">回到薅乐马</a>
        </div>
      </header>

      <main class="lottery-layout">
        <section class="lottery-hero" aria-labelledby="lottery-title">
          <div class="hero-copy">
            <span class="hero-eyebrow">OH! 薅乐马 · 消费回馈计划</span>
            <p>${preview ? `每累计消费 ${money(state.threshold)}，获得 1 枚抽奖代币。<br>消费获得的代币长期有效。` : '抽奖与积分兑换暂未开放，奖品待公布。'}</p>
          </div>
          <div class="machine-stage" data-machine-status="${machineStatus}">
            <div class="machine-halo" aria-hidden="true"></div>
            <div class="lottery-runtime" data-can-draw="${canDraw ? "true" : "false"}"></div>
          </div>
        </section>

        <section class="lottery-rail" aria-label="抽奖信息">
          <div class="rail-heading">
            <div><span class="rail-eyebrow">LUCKY CAPSULE</span><h2><span>幸运</span>扭蛋机</h2><p>惊喜不断，好运打满</p></div>
            <span class="preview-badge">${preview ? "服务端交互预览" : "活动服务"}</span>
          </div>

          ${preview ? `<section class="progress-card">
            <div class="card-label">消费进度 <span>循环累计</span></div>
            <div class="progress-value"><strong>${money(state.paidAmount)}</strong><span>/ ${money(state.threshold)}</span></div>
            <div class="progress-track" aria-label="消费进度"><i style="width:${progress.toFixed(2)}%"></i></div>
            <div class="progress-meta"><span>${remaining > 0 ? `还差 ${money(remaining)}` : "下一枚代币已达成"}</span><span>按实际支付金额计算</span></div>
          </section>` : ''}

          <section class="chance-card">
            <div><span class="card-label">可用抽奖代币</span><strong class="chance-number">${state.lotteryTokens}</strong></div>
            <div class="chance-detail">${preview ? `<span>消费获得：${Math.max(0, state.lotteryTokens - state.starterTokens)} 枚</span><span>赠送代币：${state.starterTokens} 枚</span><small>赠送代币 30 天有效</small>` : ''}${apiStatus}</div>
          </section>

          <section class="exchange-card">
            <div class="exchange-head"><div><span class="card-label">积分兑换</span><strong class="points-number">${state.pointsLoaded ? state.points : '--'}<small> PTS</small></strong></div>${state.tokenExchangeCost > 0 ? `<div class="exchange-rate"><b>${state.tokenExchangeCost}</b><span>积分</span><i>→</i><b>1</b><span>抽奖代币</span></div>` : ''}</div>
            <button class="exchange-button" type="button" data-exchange ${canExchange ? "" : "disabled"}>兑换 1 枚抽奖代币</button>
            <small class="exchange-hint">${state.tokenExchangeCost > 0 ? `消耗 ${state.tokenExchangeCost} 积分 · 当前可兑换 ${Math.floor(state.points / state.tokenExchangeCost)} 枚` : '兑换暂未开放'}</small>
          </section>

          <section class="action-card">
            <button class="draw-action primary" type="button" data-draw="single" ${canDraw ? "" : "disabled"}><span>按下抽奖</span><small>消耗 1 枚代币</small></button>
            <button class="draw-action secondary" type="button" data-draw="five" ${canFiveDraw ? "" : "disabled"}><span>五连抽</span><small>消耗 5 枚代币</small></button>
          </section>

          ${preview ? `<section class="prize-card">
            <div class="card-label">本期奖池 <span>订阅奖励概率最低</span></div>
            <div class="prize-grid">
              <div class="prize-item"><i class="prize-art balance-art">¥</i><span>余额</span><strong>1 / 2 / 3 / 5 元</strong></div>
              <div class="prize-item"><i class="prize-art subscription-art">日</i><span>活动订阅</span><strong>1 / 3 / 7 天</strong></div>
              <div class="prize-item"><i class="prize-art coupon-art">%</i><span>充值加赠</span><strong>5%</strong></div>
              <div class="prize-item muted"><i class="prize-art empty-art">·</i><span>普通结果</span><strong>谢谢参与</strong></div>
            </div>
          </section>

          <div class="rule-strip"><span>每 50 元 1 枚代币</span><span>连续 3 次未中奖，第 4 次保底普通奖</span></div>` : '<div class="rule-strip"><span>奖品待公布</span></div>'}
        </section>
      </main>
      ${renderResultModal()}
    </div>
  `;

  bindEvents();
}

function bindEvents(): void {
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
  if (!state.apiReady || state.phase !== "idle" || state.points < state.tokenExchangeCost) return;
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
      if (payload?.code === "insufficient_points") throw new Error("积分不足，先去活动中心签到吧");
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
}

async function loadLotteryState(): Promise<void> {
  const headers: Record<string, string> = preview ? {} : browserSessionHeaders();
  if (preview) headers["X-Lottery-Preview"] = "1";
  try {
    const response = await fetch(`${lotteryApiBase}/state${preview ? "?preview=1" : ""}`, { headers, credentials: "include", cache: "no-store" });
    const payload = await response.json().catch(() => null) as { success?: boolean; data?: LotteryStateResponse; message?: string } | null;
    if (!response.ok || !payload?.success || !payload.data) {
      throw new Error(payload?.message || `活动服务请求失败（${response.status}）`);
    }
    const data = payload.data;
    if (!Number.isSafeInteger(data.points)) throw new Error("积分数据无效，请稍后重试");
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
    state.apiError = error instanceof Error ? error.message : "活动服务暂时不可用";
    state.phase = "idle";
  }
  render();
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.phase === "revealed") dismissResult();
});

render();
void loadLotteryState();
