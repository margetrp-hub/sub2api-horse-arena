import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleCheck, Coins, History, RefreshCw, X } from "lucide";
import { authenticatedSessionHeaders } from "../api/ranking";
import { icon } from "./icons";
import "./points.css";

type Entry = { id: string; type: string; points: number; createdAt: string };
type Account = {
  accountId: string; balance: number; day: string; checkedIn: boolean;
  checkInPoints: number; checkInEnabled: boolean; linked: boolean;
  entries: Entry[]; hasMore: boolean; offset: number; limit: number;
};

function escape(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export class PointsAccount {
  readonly element = document.createElement("section");
  private readonly dialog = document.createElement("dialog");
  private account: Account | null = null;
  private status = "loading";
  private message = "";
  private busy = false;
  private offset = 0;
  private generation = 0;
  private controller?: AbortController;
  private timer: number;
  private readonly onSession = () => {
    this.generation++;
    this.controller?.abort();
    this.busy = false;
    this.account = null;
    this.offset = 0;
    this.status = "loading";
    this.render();
    void this.request();
  };
  private readonly onStorage = (event: StorageEvent) => {
    if (event.key === null || ["user", "uid", "auth_token"].includes(event.key)) this.onSession();
  };
  private readonly onVisible = () => {
    if (document.visibilityState === "visible") void this.request();
  };

  constructor(compact = false) {
    this.element.className = `points-account${compact ? " points-compact" : ""}`;
    this.element.setAttribute("aria-label", "我的积分与签到");
    this.dialog.className = "points-dialog";
    this.dialog.setAttribute("aria-labelledby", "points-ledger-title");
    document.body.append(this.dialog);
    this.dialog.addEventListener("click", (event) => { if (event.target === this.dialog) this.dialog.close(); });
    window.addEventListener("storage", this.onStorage);
    window.addEventListener("focus", this.onVisible);
    document.addEventListener("visibilitychange", this.onVisible);
    this.timer = window.setInterval(this.onVisible, 60000);
    this.render();
    void this.request();
  }

  private async request(action = "account", method = "GET", offset = this.offset): Promise<void> {
    if (this.busy) return;
    const generation = ++this.generation;
    this.busy = true;
    this.message = "";
    this.render();
    const controller = new AbortController();
    this.controller = controller;
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const headers = await authenticatedSessionHeaders();
      if (generation !== this.generation) return;
      const response = await fetch(`/api/points/${action}?limit=20&offset=${offset}`, {
        method, credentials: "include", cache: "no-store", signal: controller.signal,
        headers: { ...headers, ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
        ...(method === "POST" ? { body: "{}" } : {}),
      });
      const payload = await response.json().catch(() => null);
      if (generation !== this.generation) return;
      if (!response.ok || payload?.success !== true) {
        this.account = null;
        this.status = response.status === 401 ? "login" : payload?.code === "points_account_required" ? "required" : "error";
        this.message = this.status === "error" ? "暂时无法更新积分，请重试" : "";
        return;
      }
      const data = payload.data as Account;
      if (!data || !Number.isSafeInteger(data.balance) || !Number.isSafeInteger(data.checkInPoints) || !Array.isArray(data.entries) || typeof data.checkedIn !== "boolean") throw new Error("invalid account");
      this.account = data;
      this.offset = data.offset;
      this.status = "ready";
      if (method === "POST") this.message = action === "checkin" ? payload.awarded ? `签到成功，积分 +${data.checkInPoints}` : "今日已签到" : "积分账户已开通";
    } catch {
      if (generation !== this.generation) return;
      this.account = null;
      this.status = "error";
      this.message = "暂时无法更新积分，请重试";
    } finally {
      window.clearTimeout(timeout);
      if (generation === this.generation) { this.busy = false; this.render(); }
    }
  }

  private render(): void {
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.pointsAction : undefined;
    const inDialog = this.dialog.contains(document.activeElement);
    const a = this.account;
    const login = window.OH_HAOLEMA_RUNTIME?.source === "sub2api" ? "/login" : "/sign-in";
    let action = `<button type="button" data-points-action="retry" ${this.busy ? "disabled" : ""}>${icon(RefreshCw)}${this.busy ? "正在同步" : "重新连接"}</button>`;
    if (this.status === "login") action = `<a href="${login}">登录查看 ${icon(ArrowRight)}</a>`;
    if (this.status === "required") action = `<button type="button" data-points-action="register" ${this.busy ? "disabled" : ""}>${icon(Coins)}${this.busy ? "开通中" : "开通积分账户"}</button>`;
    if (a) action = `<button type="button" data-points-action="checkin" ${this.busy || a.checkedIn || !a.checkInEnabled ? "disabled" : ""}>${icon(a.checkedIn ? Check : CircleCheck)}${this.busy ? "正在同步" : a.checkedIn ? "今日已签到" : a.checkInEnabled ? `签到 +${a.checkInPoints}` : "签到未开放"}</button>`;
    this.element.innerHTML = `<div class="points-heading"><span>${icon(Coins)}我的积分</span><button class="points-icon" type="button" data-points-action="ledger" aria-label="查看积分流水" title="积分流水" ${a ? "" : "disabled"}>${icon(History)}</button></div>
      <div class="points-summary"><strong>${a ? a.balance.toLocaleString("zh-CN") : "--"}<small>PTS</small></strong>${action}</div>
      <p class="points-note" role="status">${escape(this.message || (a ? `${a.day} · 北京时间${a.linked ? " · 已关联积分账户" : ""}` : this.status === "required" ? "积分账户尚未开通" : this.status === "login" ? "登录后查看账户余额" : "正在连接积分账户"))}</p>`;
    this.bind(this.element);
    if (this.dialog.open) this.renderLedger();
    if (focused) (inDialog ? this.dialog : this.element).querySelector<HTMLButtonElement>(`[data-points-action="${focused}"]`)?.focus({ preventScroll: true });
  }

  private renderLedger(): void {
    const a = this.account;
    const labels: Record<string, string> = { check_in: "每日签到", invite: "邀请奖励", adjustment: "积分调整", redemption: "积分兑换", lottery: "抽奖", refund: "积分退回", order_reserve: "积分预扣", order_refund: "积分退回" };
    this.dialog.innerHTML = `<header><div><h2 id="points-ledger-title">积分流水</h2><p>${a ? `当前积分 ${a.balance.toLocaleString("zh-CN")} PTS` : "暂时无法读取积分"}</p></div><button type="button" class="points-icon" data-points-action="close" title="关闭" aria-label="关闭积分流水">${icon(X)}</button></header>
      <div class="points-ledger" aria-busy="${this.busy}">${a ? a.entries.length ? `<ol>${a.entries.map((entry) => {
        const date = new Date(entry.createdAt);
        const formatted = Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) : "--";
        return `<li><span><strong>${escape(labels[entry.type] || "积分变动")}</strong><time>${escape(formatted)}</time></span><b class="${entry.points > 0 ? "points-credit" : ""}">${entry.points > 0 ? "+" : ""}${entry.points.toLocaleString("zh-CN")}</b></li>`;
      }).join("")}</ol>` : '<p class="points-empty">暂无积分流水</p>' : '<p class="points-empty">积分流水暂不可用</p>'}</div>
      <footer><span role="status">${escape(this.busy ? "正在同步" : this.message || "北京时间")}</span><nav aria-label="流水分页"><button type="button" class="points-icon" data-points-action="previous" title="上一页" aria-label="上一页" ${this.busy || !a || a.offset === 0 ? "disabled" : ""}>${icon(ChevronLeft)}</button><span>${a ? Math.floor(a.offset / a.limit) + 1 : "--"}</span><button type="button" class="points-icon" data-points-action="next" title="下一页" aria-label="下一页" ${this.busy || !a?.hasMore ? "disabled" : ""}>${icon(ChevronRight)}</button><button type="button" class="points-icon" data-points-action="retry" title="刷新流水" aria-label="刷新流水" ${this.busy ? "disabled" : ""}>${icon(RefreshCw)}</button></nav></footer>`;
    this.bind(this.dialog);
  }

  private bind(root: HTMLElement): void {
    root.querySelectorAll<HTMLButtonElement>("[data-points-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.pointsAction;
      if (action === "close") this.dialog.close();
      else if (action === "ledger") { this.renderLedger(); this.dialog.showModal(); void this.request("account", "GET", 0); }
      else if (action === "register") void this.request("account", "POST", 0);
      else if (action === "checkin") void this.request("checkin", "POST", 0);
      else if (action === "previous") void this.request("account", "GET", Math.max(0, this.offset - 20));
      else if (action === "next") void this.request("account", "GET", this.offset + 20);
      else void this.request();
    }));
  }

  destroy(): void {
    this.generation++;
    this.controller?.abort();
    window.clearInterval(this.timer);
    window.removeEventListener("storage", this.onStorage);
    window.removeEventListener("focus", this.onVisible);
    document.removeEventListener("visibilitychange", this.onVisible);
    this.dialog.remove();
  }
}
