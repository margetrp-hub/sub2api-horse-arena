import "./practice.css";
import { PracticeScene } from "./PracticeScene";
import { SlackRound, type RoundSnapshot } from "./rules";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Coffee, DoorOpen, Gamepad2, Play, RotateCcw, ShieldCheck, Timer, Trophy, Volume2, VolumeX } from "lucide";
import { icon } from "../ui/icons";

type Options = { onVisibilityChange?: (visible: boolean) => void };
type InputMode = "hold" | "toggle";
const whole = (value: number) => String(Math.floor(value + 0.000001));

export class PersonalWorkstation {
  private readonly root = document.createElement("section");
  private readonly launcher = document.createElement("button");
  private readonly abortController = new AbortController();
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private scene?: PracticeScene;
  private round?: SlackRound;
  private previous?: RoundSnapshot;
  private frame = 0;
  private visible = false;
  private ready = false;
  private loading = false;
  private inputMode: InputMode = "hold";
  private pointer: number | null = null;
  private keyboardHeld = false;
  private best = 0;
  private completed = 0;
  private recorded = false;
  private noticeUntil = 0;
  private abortReason = "";
  private audio?: AudioContext;
  private sound = false;
  private inertPeers = new Map<HTMLElement, boolean>();

  constructor(private readonly mount: HTMLElement, private readonly options: Options = {}) {
    this.root.className = "practice";
    this.root.dataset.phase = "lobby";
    this.root.dataset.boss = "away";
    this.root.setAttribute("aria-label", "我的工位");
    this.root.hidden = true;
    this.root.innerHTML = `
      <header class="practice-header">
        <div class="practice-brand"><span class="practice-logotype">OH!</span><div><h1>薅乐马</h1><span class="practice-brand-sub">打工有时，摸鱼有道</span></div></div>
        <button class="practice-leave" type="button">${icon(DoorOpen)}<span data-field="leave-label">公共办公室</span></button>
      </header>
      <div class="practice-ledger">
        <div><span>${icon(ShieldCheck)}保住分</span><strong data-field="banked">0</strong></div>
        <div><span>${icon(Coffee)}暂存分 <b data-field="multiplier">x1</b></span><strong data-field="pending">0</strong></div>
        <div class="practice-timer"><span>${icon(Timer)}剩余时间</span><strong data-field="timer">60s</strong></div>
      </div>
      <div class="practice-warning" role="status" aria-live="polite">
        <div class="practice-warning-state"><i class="practice-signal" aria-hidden="true"></i><b data-field="boss">工位已就绪</b></div><span data-field="boss-detail">随时开工</span>
      </div>
      <div class="practice-art">
        <div class="practice-canvas"></div>
        <div class="practice-scene-title"><span>PERSONAL OFFICE</span><h2>我的工位<span class="practice-online" aria-label="已就位"></span></h2><p>今天，也要忙里偷闲。</p></div>
        <div class="practice-station-label">${icon(BriefcaseBusiness)}<div><b data-field="name">访客</b><span data-field="rank">本地访客工位</span></div><span class="practice-station-number">01</span></div>
        <div class="practice-countdown" hidden aria-live="assertive"></div>
        <div class="practice-notice" hidden role="status"></div>
        <div class="practice-loading" role="status">工位开机中</div>
      </div>
      <div class="practice-controls">
        <div class="practice-statusline"><b>${icon(Gamepad2)}<span data-field="action">一分钟摸鱼挑战</span></b><span class="practice-best">${icon(Trophy)}<span data-field="best">本页最好 0</span></span></div>
        <progress class="practice-bank-progress" value="0" max="1" aria-label="保分进度"></progress>
        <div class="practice-control-row">
          <fieldset class="practice-input-mode" aria-label="操作方式">
            <label><input type="radio" name="practice-input" value="hold" checked><span>按住</span></label>
            <label><input type="radio" name="practice-input" value="toggle"><span>切换</span></label>
          </fieldset>
          <button class="practice-start practice-primary" type="button" disabled>${icon(Play)}<span data-field="start-label">摸鱼一局</span><small>60 秒</small>${icon(ArrowRight)}</button>
          <button class="practice-slack practice-primary" type="button" hidden aria-label="按住摸鱼，松开上班" aria-keyshortcuts="Space">${icon(Coffee)}<span data-field="slack-label">按住摸鱼</span></button>
          <label class="practice-sound" data-tooltip="音效" title="音效"><input type="checkbox" aria-label="音效"><span class="sound-off">${icon(VolumeX)}</span><span class="sound-on">${icon(Volume2)}</span></label>
        </div>
        <div class="practice-footer"><span>本地练习 · 不计账户积分</span><span data-field="rounds">本页完成 0 局</span></div>
      </div>
      <section class="practice-result" hidden aria-labelledby="practice-result-title">
        <div class="practice-receipt">
          <div class="practice-receipt-top"><span>OH! 薅乐马</span><span>下班小票 / 60s</span></div>
          <h2 id="practice-result-title" tabindex="-1">打卡下班</h2>
          <span class="practice-result-caption">本局保住分</span><strong data-field="result-score">0</strong>
          <b class="practice-result-verdict" data-field="verdict"></b>
          <dl>
            <div><dt>最高单次保分</dt><dd data-field="largest">0</dd></div>
            <div><dt>成功保分</dt><dd data-field="banks">0 次</dd></div>
            <div><dt>被老板抓到</dt><dd data-field="catches">0 次</dd></div>
            <div><dt>到点 / 中止未保住</dt><dd data-field="expired">0 分</dd></div>
            <div><dt>本页最好</dt><dd data-field="result-best">0</dd></div>
          </dl>
          <p>练习成绩仅本页保留，不发放账户奖励。</p>
          <div class="practice-receipt-barcode" aria-hidden="true"></div>
          <div class="practice-result-actions"><button class="practice-retry practice-primary" type="button">${icon(RotateCcw)}再来一局</button><button class="practice-home" type="button">${icon(ArrowLeft)}回工位</button></div>
        </div>
      </section>
    `;
    this.launcher.className = "practice-launcher";
    this.launcher.type = "button";
    this.launcher.innerHTML = `${icon(BriefcaseBusiness)}我的工位${icon(ArrowRight)}`;
    mount.append(this.root, this.launcher);
    this.bind();
    this.open();
  }

  setIdentity(identity: { name: string; rank: number | null } | null): void {
    this.field("name").textContent = identity?.name || "访客";
    this.field("rank").textContent = !identity ? "本地访客工位"
      : identity.rank === null ? "周榜未上榜" : `周榜第 ${identity.rank} 名`;
  }

  showOffice(): void {
    if (!this.active()) this.close();
  }

  open(): void {
    if (this.visible) return;
    this.visible = true;
    this.root.hidden = false;
    this.launcher.hidden = true;
    this.mount.classList.add("has-practice");
    this.setExpanded(false);
    this.options.onVisibilityChange?.(true);
    if (!this.ready) void this.load();
    this.tick();
  }

  destroy(): void {
    this.abortController.abort();
    window.cancelAnimationFrame(this.frame);
    this.visible = false;
    this.setExpanded(false);
    this.scene?.destroy();
    void this.audio?.close();
    this.root.remove();
    this.launcher.remove();
    this.mount.classList.remove("has-practice");
    this.options.onVisibilityChange?.(false);
  }

  private node<T extends HTMLElement = HTMLElement>(selector: string): T {
    return this.root.querySelector<T>(selector)!;
  }

  private field(name: string): HTMLElement {
    return this.node(`[data-field="${name}"]`);
  }

  private async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    const loading = this.node(".practice-loading");
    loading.hidden = false;
    loading.textContent = "工位开机中";
    this.node<HTMLButtonElement>(".practice-start").disabled = true;
    let timeout = 0;
    try {
      this.scene?.destroy();
      this.scene = new PracticeScene(this.node(".practice-canvas"));
      await Promise.race([
        this.scene.load(),
        new Promise<never>((_, reject) => {
          timeout = window.setTimeout(() => reject(new Error("asset timeout")), 20_000);
        }),
      ]);
      if (this.abortController.signal.aborted) return;
      this.ready = true;
      this.root.dataset.ready = "true";
      loading.hidden = true;
      this.field("start-label").textContent = "摸鱼一局";
    } catch {
      this.scene?.destroy();
      this.scene = undefined;
      loading.textContent = "工位素材未就绪";
      this.field("start-label").textContent = "重新开机";
    } finally {
      window.clearTimeout(timeout);
      this.loading = false;
      this.node<HTMLButtonElement>(".practice-start").disabled = false;
    }
  }

  private start(): void {
    if (!this.ready) { void this.load(); return; }
    this.clearInput();
    this.round = new SlackRound(performance.now());
    this.previous = undefined;
    this.recorded = false;
    this.abortReason = "";
    this.noticeUntil = 0;
    this.setExpanded(true);
    this.node(".practice-result").hidden = true;
    this.node(".practice-start").hidden = true;
    this.node(".practice-slack").hidden = false;
    this.node<HTMLButtonElement>(".practice-slack").disabled = true;
    this.node<HTMLFieldSetElement>(".practice-input-mode").disabled = true;
    this.field("leave-label").textContent = "结束本局";
    this.node(".practice-leave").focus({ preventScroll: true });
    this.render(this.round.snapshot());
  }

  private home(): void {
    this.clearInput();
    this.round = undefined;
    this.previous = undefined;
    this.setExpanded(false);
    this.node(".practice-result").hidden = true;
    this.node(".practice-start").hidden = false;
    this.node(".practice-slack").hidden = true;
    this.node<HTMLFieldSetElement>(".practice-input-mode").disabled = false;
    this.node(".practice-countdown").hidden = true;
    this.node(".practice-notice").hidden = true;
    this.field("leave-label").textContent = "公共办公室";
    this.root.dataset.phase = "lobby";
    this.root.dataset.boss = "away";
    this.root.dataset.urgent = "false";
    this.root.dataset.slacking = "false";
    this.field("action").textContent = "一分钟摸鱼挑战";
    this.field("boss").textContent = "工位已就绪";
    this.field("boss-detail").textContent = "随时开工";
    this.field("banked").textContent = "0";
    this.field("pending").textContent = "0";
    this.field("timer").textContent = "60s";
    this.field("multiplier").textContent = "x1";
    this.node<HTMLProgressElement>(".practice-bank-progress").value = 0;
    this.node(".practice-start").focus({ preventScroll: true });
  }

  private close(): void {
    this.home();
    this.visible = false;
    this.setExpanded(false);
    this.root.hidden = true;
    this.launcher.hidden = false;
    this.mount.classList.remove("has-practice");
    window.cancelAnimationFrame(this.frame);
    this.options.onVisibilityChange?.(false);
    this.launcher.focus({ preventScroll: true });
  }

  private active(): boolean {
    const phase = this.round?.snapshot().phase;
    return phase === "playing" || phase === "countdown";
  }

  private interrupt(reason: string): void {
    if (!this.active()) return;
    this.abortReason = reason;
    this.clearInput();
    this.round!.abort(performance.now());
    this.render(this.round!.snapshot());
  }

  private setExpanded(expanded: boolean): void {
    this.root.classList.toggle("practice-expanded", expanded);
    const modal = expanded || (this.visible && window.matchMedia(
      "(max-width: 760px), (max-height: 520px) and (orientation: landscape)",
    ).matches);
    document.documentElement.classList.toggle("practice-modal-open", modal);
    if (modal) {
      this.root.setAttribute("role", "dialog");
      this.root.setAttribute("aria-modal", "true");
      let branch: HTMLElement = this.root;
      while (branch.parentElement) {
        for (const peer of branch.parentElement.children) {
          if (peer !== branch && peer instanceof HTMLElement && !this.inertPeers.has(peer)) {
            this.inertPeers.set(peer, peer.inert);
            peer.inert = true;
          }
        }
        branch = branch.parentElement;
        if (branch === document.body) break;
      }
    } else {
      this.root.removeAttribute("role");
      this.root.removeAttribute("aria-modal");
      for (const [peer, inert] of this.inertPeers) peer.inert = inert;
      this.inertPeers.clear();
    }
  }

  private bind(): void {
    const signal = this.abortController.signal;
    this.launcher.addEventListener("click", () => this.open(), { signal });
    this.node(".practice-start").addEventListener("click", () => this.start(), { signal });
    this.node(".practice-retry").addEventListener("click", () => this.start(), { signal });
    this.node(".practice-home").addEventListener("click", () => this.home(), { signal });
    this.node(".practice-leave").addEventListener("click", () =>
      this.active() ? this.interrupt("主动结束，本局不计纪录") : this.close(), { signal });
    this.node(".practice-input-mode").addEventListener("change", (event) => {
      this.clearInput();
      this.inputMode = (event.target as HTMLInputElement).value as InputMode;
      this.node(".practice-slack").setAttribute("aria-label", this.inputMode === "hold"
        ? "按住摸鱼，松开上班" : "切换摸鱼与上班");
    }, { signal });
    this.node<HTMLInputElement>(".practice-sound input").addEventListener("change", (event) => {
      this.sound = (event.target as HTMLInputElement).checked;
      if (this.sound) {
        try {
          this.audio ??= new AudioContext();
          void this.audio.resume().catch(() => {});
          this.beep(520);
        } catch { this.sound = false; (event.target as HTMLInputElement).checked = false; }
      }
    }, { signal });
    const button = this.node<HTMLButtonElement>(".practice-slack");
    button.addEventListener("pointerdown", (event) => {
      if (this.inputMode !== "hold" || event.button !== 0 || this.pointer !== null) return;
      event.preventDefault();
      this.pointer = event.pointerId;
      button.setPointerCapture(event.pointerId);
      this.applyInput(true);
    }, { signal });
    const release = (event: PointerEvent) => {
      if (event.pointerId !== this.pointer) return;
      this.pointer = null;
      this.applyInput(this.keyboardHeld);
    };
    button.addEventListener("pointerup", release, { signal });
    button.addEventListener("pointercancel", release, { signal });
    button.addEventListener("lostpointercapture", release, { signal });
    button.addEventListener("contextmenu", (event) => event.preventDefault(), { signal });
    button.addEventListener("click", () => {
      if (this.inputMode === "toggle") this.applyInput(!this.round?.snapshot().slacking);
    }, { signal });
    window.addEventListener("keydown", (event) => {
      if (!this.visible) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.active()) this.interrupt("主动结束，本局不计纪录");
        else if (this.round) this.home();
        else this.close();
      }
      if (event.key === "Tab" && this.root.getAttribute("aria-modal") === "true") this.trapFocus(event);
      if (event.code !== "Space" || !this.active()) return;
      const target = event.target as HTMLElement;
      if (target.matches("input, select, textarea") || target.isContentEditable) return;
      // The round shortcut owns Space, including when the start button still had focus.
      event.preventDefault();
      if (event.repeat) return;
      if (this.inputMode === "toggle") this.applyInput(!this.round?.snapshot().slacking);
      else { this.keyboardHeld = true; this.applyInput(true); }
    }, { signal });
    window.addEventListener("keyup", (event) => {
      if (event.code !== "Space" || !this.keyboardHeld) return;
      event.preventDefault();
      this.keyboardHeld = false;
      this.applyInput(this.pointer !== null);
    }, { signal });
    window.addEventListener("blur", () => this.interrupt("窗口失焦，本局已中止"), { signal });
    window.addEventListener("resize", () => {
      this.setExpanded(this.root.classList.contains("practice-expanded"));
    }, { signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.interrupt("离开页面，本局已中止");
    }, { signal });
  }

  private clearInput(): void {
    const button = this.node(".practice-slack");
    if (this.pointer !== null && button.hasPointerCapture(this.pointer)) button.releasePointerCapture(this.pointer);
    this.pointer = null;
    this.keyboardHeld = false;
  }

  private applyInput(slacking: boolean): void {
    if (!this.round) return;
    const state = this.round.setSlacking(slacking, performance.now());
    this.render(state);
  }

  private trapFocus(event: KeyboardEvent): void {
    const scope = this.node(".practice-result").hidden ? this.root : this.node(".practice-result");
    const focusable = [...scope.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")].filter((node) => node.getClientRects().length > 0);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement as HTMLElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement as HTMLElement))) {
      event.preventDefault(); first.focus();
    }
  }

  private tick = (): void => {
    if (!this.visible || this.abortController.signal.aborted) return;
    const now = performance.now();
    const state = this.round?.advance(now);
    if (state) this.render(state);
    this.scene?.render(now, state, this.reducedMotion.matches);
    if (now > this.noticeUntil) this.node(".practice-notice").hidden = true;
    this.frame = window.requestAnimationFrame(this.tick);
  };

  private render(state: RoundSnapshot): void {
    this.root.dataset.phase = state.phase;
    this.root.dataset.boss = state.boss;
    this.root.dataset.urgent = String(state.remaining <= 5_000);
    this.root.dataset.slacking = String(state.slacking);
    this.field("banked").textContent = whole(state.banked);
    this.field("pending").textContent = whole(state.pending);
    this.field("multiplier").textContent = `x${state.multiplier}`;
    this.field("timer").textContent = `${Math.ceil(state.remaining / 1_000)}s`;
    this.node<HTMLProgressElement>(".practice-bank-progress").value = state.bankProgress;
    const countdown = this.node(".practice-countdown");
    countdown.hidden = state.phase !== "countdown";
    const countdownText = String(Math.ceil(state.countdown / 1_000));
    if (countdown.textContent !== countdownText) countdown.textContent = countdownText;
    const warning = state.boss === "warning";
    const inspecting = state.boss === "inspecting";
    const boss = state.phase === "countdown" ? "准备开工"
      : warning ? "脚步近了 · 老板将到" : inspecting ? "正在查岗" : "老板已走远";
    if (this.field("boss").textContent !== boss) this.field("boss").textContent = boss;
    this.field("boss-detail").textContent = warning ? `${(state.warningRemaining / 1_000).toFixed(1)}s`
      : inspecting ? "上班中安全" : "安全时段";
    this.field("action").textContent = state.phase === "countdown" ? "准备中"
      : state.recovery > 0 ? `被抓了 / 恢复 ${Math.ceil(state.recovery / 1_000)}s`
      : state.slacking ? `摸鱼中 / ${state.multiplier} 倍`
      : state.pending > 0 ? "上班中 / 正在保分" : "上班中 / 分数已保住";
    const button = this.node<HTMLButtonElement>(".practice-slack");
    button.disabled = state.phase !== "playing" || state.recovery > 0;
    this.field("slack-label").textContent = state.recovery > 0 ? "整理工位中" : this.inputMode === "toggle"
      ? state.slacking ? "回去上班" : "开始摸鱼" : state.slacking ? "松开上班" : "按住摸鱼";
    button.setAttribute("aria-pressed", String(state.slacking));
    if (state.catches > (this.previous?.catches ?? 0)) {
      this.notice(`被抓到了！暂存分 -${whole(state.lost - (this.previous?.lost ?? 0))}`, "caught");
      this.clearInput();
      this.beep(180);
    } else if (state.banks > (this.previous?.banks ?? 0)) {
      this.notice(`保住 +${whole(state.banked - (this.previous?.banked ?? 0))}`, "banked");
      this.beep(720);
    }
    if (warning && this.previous?.boss !== "warning") this.beep(360);
    this.previous = state;
    if (state.phase === "finished" || state.phase === "aborted") this.result(state);
  }

  private notice(text: string, kind: string): void {
    const notice = this.node(".practice-notice");
    notice.textContent = text;
    notice.dataset.kind = kind;
    notice.hidden = false;
    this.noticeUntil = performance.now() + 1_500;
  }

  private result(state: RoundSnapshot): void {
    if (this.recorded) return;
    this.recorded = true;
    this.clearInput();
    const score = Math.floor(state.banked + 0.000001);
    const newRecord = state.valid && score > this.best;
    if (state.valid) { this.best = Math.max(this.best, score); this.completed += 1; }
    this.field("result-score").textContent = whole(state.banked);
    this.field("largest").textContent = whole(state.largestBank);
    this.field("banks").textContent = `${state.banks} 次`;
    this.field("catches").textContent = `${state.catches} 次`;
    this.field("expired").textContent = `${whole(state.expired)} 分`;
    this.field("result-best").textContent = String(this.best);
    this.field("best").textContent = `本页最好 ${this.best}`;
    this.field("rounds").textContent = `本页完成 ${this.completed} 局`;
    this.field("verdict").textContent = state.phase === "aborted" ? this.abortReason
      : !state.valid ? "未完成有效保分，本局不计纪录"
      : newRecord ? "本页新纪录" : state.catches ? "下回少贪一点？" : "今天没被老板逮到";
    this.node("#practice-result-title").textContent = state.phase === "aborted" ? "本局中止" : "打卡下班";
    this.node(".practice-receipt").dataset.record = String(newRecord);
    this.node(".practice-result").hidden = false;
    this.node(".practice-notice").hidden = true;
    this.node("#practice-result-title").focus({ preventScroll: true });
  }

  private beep(frequency: number): void {
    if (!this.sound || !this.audio || this.audio.state !== "running") return;
    const oscillator = this.audio.createOscillator();
    const gain = this.audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, this.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(this.audio.destination);
    oscillator.start();
    oscillator.stop(this.audio.currentTime + 0.12);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
