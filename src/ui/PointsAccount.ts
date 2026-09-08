import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleCheck, Coins, Copy, History, Link, RefreshCw, X } from "lucide";
import { authenticatedSessionHeaders } from "../api/ranking";
import { gameLoginHref, rememberGameLogin } from "../api/game-login";
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
  private dialogView: "ledger" | "rules" | "link" = "ledger";
  private copyMessage = "";
  private generation = 0;
  private controller?: AbortController;
  private timer: number;
  private readonly onSession = () => {
    this.generation++;
    this.controller?.abort();
    this.busy = false;
    this.account = null;
    this.copyMessage = "";
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
    let timeout: number | undefined;
    try {
      const headers = await authenticatedSessionHeaders();
      if (generation !== this.generation) return;
      timeout = window.setTimeout(() => controller.abort(), 20000);
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
    const login = escape(gameLoginHref());
    let action = `<button type="button" data-points-action="retry" ${this.busy ? "disabled" : ""}>${icon(RefreshCw)}${this.busy ? "正在同步" : "重新连接"}</button>`;
    if (this.status === "login") action = `<a href="${login}" data-points-login>登录查看 ${icon(ArrowRight)}</a>`;
    if (this.status === "required") action = `<button type="button" data-points-action="register" ${this.busy ? "disabled" : ""}>${icon(Coins)}${this.busy ? "开通中" : "开通积分账户"}</button>`;
    if (a) action = `<button type="button" data-points-action="checkin" ${this.busy || a.checkedIn || !a.checkInEnabled ? "disabled" : ""}>${icon(a.checkedIn ? Check : CircleCheck)}${this.busy ? "正在同步" : a.checkedIn ? "今日已签到" : a.checkInEnabled ? `签到 +${a.checkInPoints}` : "签到未开放"}</button>`;
    this.element.innerHTML = `<div class="points-heading"><span>${icon(Coins)}我的积分</span><button class="points-icon" type="button" data-points-action="ledger" aria-label="查看积分流水" title="积分流水" ${a ? "" : "disabled"}>${icon(History)}</button></div>
      <div class="points-summary"><strong>${a ? a.balance.toLocaleString("zh-CN") : "--"}<small>PTS</small></strong>${action}</div>
      <p class="points-note" role="status">${escape(this.message || (a ? `${a.day} · 北京时间${a.linked ? " · 已关联积分账户" : ""}` : this.status === "required" ? "积分账户尚未开通" : this.status === "login" ? "登录后查看账户余额" : "正在连接积分账户"))}</p>
      <nav class="points-links" aria-label="积分帮助"><button type="button" data-points-action="rules">积分规则</button><button type="button" data-points-action="link">${icon(Link)}关联账户</button></nav>`;
    this.bind(this.element);
    if (this.dialog.open) this.renderDialog();
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

  private renderDialog(): void {
    this.dialog.setAttribute("aria-labelledby", this.dialogView === "ledger" ? "points-ledger-title" : "points-help-title");
    if (this.dialogView === "ledger") { this.renderLedger(); return; }
    const a = this.account;
    const rules = this.dialogView === "rules";
    const title = rules ? "每一点努力，都算数" : "让积分回到同一个账户";
    const subtitle = rules ? "薅乐马 · 积分规则" : a?.linked ? "已有身份关联，可继续核验其他账户" : "QQ 与站点账户 · 人工核验关联";
    const content = rules ? `<ol class="points-rules">
      <li><b>01</b><div><h3>从零开始，真实积累</h3><p>首次开通积分账户为 0 分。积分以账户流水为准，本地练习成绩不计入账户积分。</p></div></li>
      <li><b>02</b><div><h3>每天来领一次签到</h3><p>按北京时间每日 00:00 开始新的一天。${a ? a.checkInEnabled ? `当前每日签到 +${a.checkInPoints} 分。` : "当前签到暂未开放。" : "每日奖励与开放状态以签到按钮显示为准。"}重复点击不会重复入账。</p></div></li>
      <li><b>03</b><div><h3>关联后，共用一份积分</h3><p>核验为本人所有的 QQ、NewAPI 和 Sub2API 账户可关联，共用余额、流水和每日签到资格。昵称或邀请码相同不会自动关联。</p></div></li>
      <li><b>04</b><div><h3>好礼还在准备中</h3><p>扭蛋机可免费试玩动画。正式抽奖、积分换代币与奖品发放暂未开放，规则将在开放前公布。</p></div></li></ol>`
      : `<div class="points-link-intro"><p>已有其他入口的积分？请让主站管理员核验这些账号都属于你，再关联到同一个积分账户。</p></div>
        ${a ? `<div class="points-identity"><span>我的积分编号</span><strong>${escape(a.accountId)}</strong><small>${escape(window.location.host)} · ${a.linked ? "已有关联身份" : "本站独立账户"}</small></div>
          <ol class="points-link-steps"><li>复制下方核验信息，提供给主站管理员。</li><li>说明要关联的另一个站点账号或 QQ，由管理员核验本人所有权。</li><li>处理后返回这里刷新，查看关联状态和积分。</li></ol>
          <textarea class="points-copy-text" readonly aria-label="账户关联核验信息">${escape(this.linkInfo())}</textarea>
          <p class="points-help-note">复制信息不会提交申请或自动合并账户。请勿提供密码、验证码或 API Key。</p>`
          : `<div class="points-help-empty"><h3>${this.status === "login" ? "先登录，找到你的积分账户" : this.status === "required" ? "先开通本站积分账户" : "积分账户暂时无法读取"}</h3><p>${this.status === "required" ? "关闭此窗口，点击「开通积分账户」后即可获取核验信息。" : "账户加载成功后，这里会显示你的积分编号与核验信息。"}</p>${this.status === "login" ? `<a class="points-help-login" href="${escape(gameLoginHref())}" data-points-login>登录后继续 ${icon(ArrowRight)}</a>` : ""}</div>`}`;
    this.dialog.innerHTML = `<header><div><p class="points-eyebrow">${escape(subtitle)}</p><h2 id="points-help-title">${title}</h2></div><button type="button" class="points-icon" data-points-action="close" aria-label="关闭${rules ? "积分规则" : "账户关联"}">${icon(X)}</button></header>
      <div class="points-help-body">${content}</div><footer><span role="status">${escape(rules ? "以当前活动开放状态为准" : this.copyMessage || "由主站管理员人工核验")}</span><div class="points-help-actions">${rules ? '<button type="button" data-points-action="link">查看账户关联</button>' : a ? `<button type="button" data-points-action="refresh-link" ${this.busy ? "disabled" : ""}>${icon(RefreshCw)}刷新状态</button><button type="button" data-points-action="copy">${icon(Copy)}复制核验信息</button>` : '<button type="button" data-points-action="close">知道了</button>'}</div></footer>`;
    this.bind(this.dialog);
  }

  private linkInfo(): string {
    return this.account ? `薅乐马积分账户关联核验\n站点：${window.location.origin}\n积分编号：${this.account.accountId}\n请核验本站账户与我提供的其他站点账号或 QQ 均属于本人，再进行关联。` : "";
  }

  private async copyLinkInfo(): Promise<void> {
    const info = this.linkInfo();
    if (!info) return;
    const accountId = this.account?.accountId;
    try {
      await navigator.clipboard.writeText(info);
      if (this.account?.accountId !== accountId) return;
      this.copyMessage = "已复制，请提供给主站管理员核验";
    } catch {
      this.copyMessage = "请选中下方核验信息手动复制";
    }
    if (this.dialog.open && this.dialogView === "link") {
      this.renderDialog();
      if (this.copyMessage.startsWith("请选中")) {
        const text = this.dialog.querySelector<HTMLTextAreaElement>("textarea");
        text?.focus(); text?.select();
      } else this.dialog.querySelector<HTMLButtonElement>('[data-points-action="copy"]')?.focus();
    }
  }

  private bind(root: HTMLElement): void {
    root.querySelectorAll<HTMLAnchorElement>("[data-points-login]").forEach(link => link.addEventListener("click", rememberGameLogin));
    root.querySelectorAll<HTMLButtonElement>("[data-points-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.pointsAction;
      if (action === "close") this.dialog.close();
      else if (action === "ledger" || action === "rules" || action === "link") {
        this.dialogView = action; this.copyMessage = ""; this.renderDialog();
        if (!this.dialog.open) this.dialog.showModal();
        if (action === "ledger") void this.request("account", "GET", 0);
      }
      else if (action === "copy") void this.copyLinkInfo();
      else if (action === "refresh-link") { this.copyMessage = ""; void this.request(); }
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
