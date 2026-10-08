import "./style.css";
import { ArrowLeft, ArrowRight, Coffee, Keyboard, Moon, Play, RotateCcw, ShieldCheck, Timer, Volume2, VolumeX } from "lucide";
import { icon } from "../ui/icons";
import { SlackRound, type RoundSnapshot } from "../practice/rules";
import type { OfficeDiorama } from "./OfficeDiorama";
import type { DioramaState } from "./types";

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <div class="club" data-phase="preview" data-boss="away">
    <header class="masthead">
      <a class="brand" href="./" aria-label="返回薅乐马"><span class="brand-mark">OH!</span><span class="brand-name">薅乐马<small>忙里偷闲俱乐部</small></span></a>
      <div class="edition"><span class="status-dot"></span> 一号工位 <span class="edition-divider">/</span> 3D 试玩</div>
      <a class="back-link" href="./">${icon(ArrowLeft)}<span>回到像素网吧</span></a>
    </header>
    <main class="workplace">
      <section class="stage-column" aria-label="微缩网吧">
        <div class="stage-topline"><span>THE LITTLE OFFICE</span><span>工位 001 <i>营业中</i></span></div>
        <div class="stage" id="stage" tabindex="-1">
          <div class="scene-mount" id="scene"></div>
          <div class="scene-loading" id="loading" role="status"><span class="loading-mark">OH!</span><span>正在打开网吧的灯…</span></div>
          <div class="scene-caption"><span class="caption-line"></span><span id="caption">一张桌子，一匹马。今天也要忙里偷闲。</span></div>
          <div class="scene-countdown" id="countdown" hidden aria-live="assertive"></div>
          <div class="scene-message" id="scene-message" hidden role="status"></div>
          <span class="scene-corner" aria-hidden="true">EST. 2026<br>OH! CLUB</span>
        </div>
        <div class="scene-toolbar">
          <div class="pose-controls" role="group" aria-label="角色动作预览"><span class="toolbar-label">看看小马</span><button type="button" data-pose="work" aria-pressed="true">打字上班</button><button type="button" data-pose="slack" aria-pressed="false">偷偷摸鱼</button><button type="button" data-pose="boss" aria-pressed="false">老板查岗</button></div>
          <div class="scene-options"><button class="icon-button" type="button" id="motion" aria-label="减少动态效果" aria-pressed="false" title="减少动态效果">${icon(Moon)}</button><button class="icon-button" type="button" id="sound" aria-label="开启音效" aria-pressed="false" title="开启音效">${icon(VolumeX)}</button></div>
        </div>
      </section>
      <aside class="play-column" aria-label="一分钟摸鱼挑战">
        <div class="play-intro"><span class="eyebrow">打工有时 · 摸鱼有道</span><h1>认真上班。<br><span>顺便摸鱼。</span></h1><p>在老板回来之前，<br>偷一点属于自己的时间。</p><p class="compact-guide">按住摸鱼 · 松手 1 秒保分 · 老板来时松手</p></div>
        <div class="round-status" id="round-status" role="status" aria-live="polite"><span class="status-dot"></span><span id="status-text">工位空闲，随时开工</span></div>
        <div class="scoreboard" aria-label="本局计分">
          <div class="score-main"><span>${icon(ShieldCheck)}保住分</span><strong id="banked">0</strong></div>
          <div class="score-secondary"><div><span>暂存分 <b id="multiplier">×1</b></span><strong id="pending">0</strong></div><div><span>${icon(Timer)}剩余时间</span><strong id="time">60<small>s</small></strong></div></div>
          <progress id="bank-progress" max="1" value="0" aria-label="上班保分进度"></progress>
        </div>
        <ol class="how-to"><li><span>01</span><p><b>按住摸鱼</b>，攒下暂存分</p></li><li><span>02</span><p><b>松手上班 1 秒</b>，把分保住</p></li><li><span>03</span><p><b>留意门口</b>，老板随时会来</p></li></ol>
        <div class="play-actions">
          <fieldset class="input-mode" id="input-mode"><legend>操作方式</legend><label><input type="radio" name="input-mode" value="hold" checked /><span>按住</span></label><label><input type="radio" name="input-mode" value="toggle" /><span>点按切换</span></label><span class="keyboard-hint">${icon(Keyboard)} 空格也可以</span></fieldset>
          <button class="primary-action" id="start" type="button" disabled>${icon(Play)}<span>摸鱼一局</span><small>60 秒</small>${icon(ArrowRight)}</button>
          <button class="primary-action slack-action" id="slack" type="button" hidden aria-keyshortcuts="Space" aria-pressed="false">${icon(Coffee)}<span id="slack-label">按住摸鱼</span></button>
          <button class="end-action" id="end" type="button" hidden>结束本局</button>
          <p class="practice-note">本地练习 · 成绩不计账户积分</p>
        </div>
      </aside>
    </main>
    <footer class="colophon"><span>今天的工作，也要给快乐留个位子。</span><span>OH! HAOLEMA <i>—</i> LITTLE OFFICE / 01</span></footer>
  </div>
  <dialog class="receipt-dialog" id="receipt" aria-labelledby="receipt-title">
    <div class="receipt-heading"><b>OH! 薅乐马</b><span>一号工位 / 下班小票</span></div>
    <h2 id="receipt-title">打卡下班</h2><p id="receipt-verdict"></p>
    <span class="receipt-score-label">本局保住分</span><strong class="receipt-score" id="receipt-score">0</strong>
    <dl><div><dt>成功保分</dt><dd id="receipt-banks">0 次</dd></div><div><dt>被老板抓到</dt><dd id="receipt-catches">0 次</dd></div><div><dt>未保住的暂存分</dt><dd id="receipt-lost">0</dd></div></dl>
    <p class="receipt-note">练习成绩仅本页展示，不发放账户奖励。</p><div class="barcode" aria-hidden="true"></div>
    <button class="primary-action" id="retry" type="button">${icon(RotateCcw)}再来一局${icon(ArrowRight)}</button><button class="receipt-home" id="home" type="button">回工位看看</button>
  </dialog>
`;

const node = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const put = (id: string, value: string) => { const target = node(id); if (target.textContent !== value) target.textContent = value; };
const whole = (value: number) => String(Math.floor(value + 0.000001));
const club = root.querySelector<HTMLElement>(".club")!;
const receipt = node<HTMLDialogElement>("receipt");
const startButton = node<HTMLButtonElement>("start");
const slackButton = node<HTMLButtonElement>("slack");
const poseButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-pose]")];
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motionPreference.matches;
let scene: OfficeDiorama | undefined;
let round: SlackRound | undefined;
let previous: RoundSnapshot | undefined;
let pose: "work" | "slack" | "boss" = "work";
let poseStarted = 0;
let inputMode: "hold" | "toggle" = "hold";
let heldPointer: number | null = null;
let heldKey = false;
let frame = 0;
let lastFrame = -Infinity;
let sound = false;
let audio: AudioContext | undefined;
let lastFootstep = -1;
let closed = false;

function tone(frequency: number, duration: number, volume = 0.025): void {
  if (!sound || !audio || audio.state !== "running") return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}

function active(): boolean {
  const phase = round?.snapshot().phase;
  return phase === "playing" || phase === "countdown";
}

function clearHeld(): void {
  const pointer = heldPointer;
  heldPointer = null;
  heldKey = false;
  if (pointer !== null && slackButton.hasPointerCapture(pointer)) slackButton.releasePointerCapture(pointer);
}

function setSlacking(value: boolean): void {
  if (!round || !active()) return;
  updateRound(round.setSlacking(value, performance.now()));
}

function startRound(): void {
  if (!scene || active()) return;
  receipt.close();
  clearHeld();
  previous = undefined;
  round = new SlackRound(performance.now());
  poseButtons.forEach(button => { button.disabled = true; });
  node<HTMLFieldSetElement>("input-mode").disabled = true;
  startButton.hidden = true;
  slackButton.hidden = false;
  node("end").hidden = false;
  node("stage").focus({ preventScroll: true });
  updateRound(round.snapshot());
}

function showReceipt(state: RoundSnapshot, reason = ""): void {
  clearHeld();
  put("receipt-title", state.phase === "aborted" ? "这局先歇会儿" : "打卡下班");
  put("receipt-verdict", reason || (state.valid ? "忙里偷闲，也是一门手艺。" : "下次试试摸鱼后，松手上班一秒。"));
  put("receipt-score", whole(state.banked));
  put("receipt-banks", `${state.banks} 次`);
  put("receipt-catches", `${state.catches} 次`);
  put("receipt-lost", `${whole(state.lost + state.expired)} 分`);
  if (!receipt.open) receipt.showModal();
  tone(state.phase === "finished" ? 660 : 220, 0.2);
}

function abortRound(reason: string): void {
  if (!active() || !round) return;
  const state = round.abort(performance.now());
  updateRound(state);
  put("receipt-verdict", reason);
}

function home(): void {
  receipt.close();
  clearHeld();
  round = undefined;
  previous = undefined;
  club.dataset.phase = "preview";
  club.dataset.boss = "away";
  club.dataset.slacking = "false";
  poseButtons.forEach(button => { button.disabled = false; });
  node<HTMLFieldSetElement>("input-mode").disabled = false;
  startButton.hidden = false;
  slackButton.hidden = true;
  node("end").hidden = true;
  node("countdown").hidden = true;
  node("scene-message").hidden = true;
  put("banked", "0");
  put("pending", "0");
  put("multiplier", "×1");
  node("time").innerHTML = "60<small>s</small>";
  node<HTMLProgressElement>("bank-progress").value = 0;
  selectPose("work");
  startButton.focus({ preventScroll: true });
}

function updateRound(state: RoundSnapshot): void {
  club.dataset.phase = state.phase;
  club.dataset.boss = state.boss;
  club.dataset.slacking = String(state.slacking);
  put("banked", whole(state.banked));
  put("pending", whole(state.pending));
  put("multiplier", `×${state.multiplier}`);
  const seconds = String(Math.ceil(state.remaining / 1000));
  if (node("time").dataset.seconds !== seconds) {
    node("time").dataset.seconds = seconds;
    node("time").innerHTML = `${seconds}<small>s</small>`;
  }
  node<HTMLProgressElement>("bank-progress").value = state.bankProgress;
  node("countdown").hidden = state.phase !== "countdown";
  if (state.phase === "countdown") put("countdown", String(Math.ceil(state.countdown / 1000)));
  slackButton.disabled = state.phase !== "playing" || state.recovery > 0;
  slackButton.setAttribute("aria-pressed", String(state.slacking));
  put("slack-label", state.recovery > 0 ? "被发现了，缓一缓…" : inputMode === "toggle"
    ? state.slacking ? "切回上班 · 保住分数" : "点一下，开始摸鱼"
    : state.slacking ? "松手上班 · 保住分数" : "按住摸鱼");
  const status = state.phase === "countdown" ? "准备开工，坐稳啦"
    : state.phase === "aborted" ? "本局已中止"
    : state.phase === "finished" ? "到点下班，辛苦啦"
    : state.recovery > 0 ? "被老板发现了！暂存分丢失"
    : state.boss === "warning" ? "有脚步声，老板快来了！"
    : state.boss === "inspecting" ? "老板正在查岗，认真一点"
    : state.slacking ? "老板不在，偷偷歇一会儿"
    : state.pending > 0 ? "认真上班中，马上保住分数"
    : "风平浪静，放心找点乐子";
  put("status-text", status);
  const callout = state.recovery > 0 ? "咳，我在查资料。" : state.boss === "warning" ? "嘘…门外有脚步声！"
    : state.boss === "inspecting" ? "老板：都在忙什么呢？" : "";
  node("scene-message").hidden = !callout;
  put("scene-message", callout);
  put("caption", state.phase === "playing" ? state.slacking ? "快乐是自己的，工作是老板的。" : "认真工作的样子，拿捏了。" : "一张桌子，一匹马。今天也要忙里偷闲。");
  if (previous && state.catches > previous.catches) { clearHeld(); tone(130, 0.25, 0.04); }
  if (previous && state.banks > previous.banks) tone(880, 0.12);
  if (state.phase === "playing" && previous?.phase === "countdown") tone(660, 0.15);
  const ended = state.phase === "finished" || state.phase === "aborted";
  if (ended && previous?.phase !== state.phase) showReceipt(state);
  previous = state;
}

function selectPose(next: typeof pose): void {
  if (active()) return;
  pose = next;
  poseStarted = performance.now();
  lastFootstep = -1;
  poseButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.pose === next)));
  put("status-text", next === "slack" ? "先歇一会儿，老板应该没看见" : next === "boss" ? "嘘…好像有人来了" : "工位空闲，随时开工");
}

function visualState(now: number): DioramaState {
  if (round) {
    const state = round.snapshot();
    return {
      action: state.phase === "finished" ? "finished" : state.recovery > 0 ? "caught" : state.slacking ? "slack" : "work",
      boss: state.phase === "playing" ? state.boss : "away",
    };
  }
  if (pose === "boss") {
    const elapsed = now - poseStarted;
    if (elapsed > 7000) selectPose("work");
    else return { action: elapsed < 1800 ? "slack" : elapsed < 3600 ? "caught" : "work", boss: elapsed < 1800 ? "warning" : "inspecting" };
  }
  return { action: pose === "slack" ? "slack" : "work", boss: "away" };
}

function tick(now: number): void {
  if (closed || document.hidden) return;
  frame = requestAnimationFrame(tick);
  // The rules integrate real time; 30 visual frames are enough for this desk toy.
  if (now - lastFrame < 1000 / 30) return;
  lastFrame = now;
  if (round) updateRound(round.advance(now));
  const state = visualState(now);
  if (!round) {
    club.dataset.boss = state.boss;
    put("caption", pose === "slack" ? "快乐是自己的，工作是老板的。" : pose === "boss" ? "老板：怎么一过来，你们就这么认真？" : "一张桌子，一匹马。今天也要忙里偷闲。");
    node("scene-message").hidden = pose !== "boss";
    if (pose === "boss") put("scene-message", state.boss === "warning" ? "嘘…门外有脚步声！" : "咳，我在查资料。");
  }
  if (state.boss === "warning") {
    const beat = Math.floor(now / 430);
    if (beat !== lastFootstep) { tone(85, 0.09, 0.045); lastFootstep = beat; }
  }
  scene?.render(now, state, reducedMotion);
}

function updateMotion(): void {
  node("motion").setAttribute("aria-pressed", String(reducedMotion));
}
updateMotion();
node("motion").addEventListener("click", () => { reducedMotion = !reducedMotion; updateMotion(); });
motionPreference.addEventListener("change", event => { reducedMotion = event.matches; updateMotion(); });
node("sound").addEventListener("click", async () => {
  sound = !sound;
  if (sound) {
    try { audio ??= new AudioContext(); await audio.resume(); }
    catch { sound = false; }
  }
  const label = sound ? "关闭音效" : "开启音效";
  node("sound").innerHTML = icon(sound ? Volume2 : VolumeX);
  node("sound").setAttribute("aria-pressed", String(sound));
  node("sound").setAttribute("aria-label", label);
  node("sound").title = label;
  tone(440, 0.1);
});
startButton.addEventListener("click", startRound);
node("retry").addEventListener("click", startRound);
node("home").addEventListener("click", home);
receipt.addEventListener("cancel", event => { event.preventDefault(); home(); });
node("end").addEventListener("click", () => abortRound("提前收工，这局不计有效完成。"));
poseButtons.forEach(button => button.addEventListener("click", () => selectPose(button.dataset.pose as typeof pose)));
root.querySelectorAll<HTMLInputElement>('input[name="input-mode"]').forEach(input => input.addEventListener("change", () => {
  inputMode = input.value as typeof inputMode;
}));

slackButton.addEventListener("pointerdown", event => {
  if (event.button !== 0 || slackButton.disabled || inputMode !== "hold" || heldPointer !== null) return;
  event.preventDefault();
  heldPointer = event.pointerId;
  slackButton.setPointerCapture(event.pointerId);
  setSlacking(true);
});
const releasePointer = (event: PointerEvent) => {
  if (event.pointerId !== heldPointer) return;
  heldPointer = null;
  setSlacking(heldKey);
};
slackButton.addEventListener("pointerup", releasePointer);
slackButton.addEventListener("pointercancel", releasePointer);
slackButton.addEventListener("lostpointercapture", releasePointer);
slackButton.addEventListener("click", event => {
  if (inputMode === "toggle" || (event.detail === 0 && !heldKey)) setSlacking(!round?.snapshot().slacking);
});
window.addEventListener("keydown", event => {
  if (event.code !== "Space" || !active() || receipt.open) return;
  const target = event.target as HTMLElement;
  if (target.closest("input, select, textarea, a, button") && target !== slackButton) return;
  event.preventDefault();
  if (event.repeat) return;
  if (round?.snapshot().phase !== "playing") return;
  heldKey = true;
  setSlacking(inputMode === "toggle" ? !round?.snapshot().slacking : true);
});
window.addEventListener("keyup", event => {
  if (event.code !== "Space" || !heldKey) return;
  event.preventDefault();
  heldKey = false;
  if (inputMode === "hold") setSlacking(heldPointer !== null);
});
window.addEventListener("blur", () => abortRound("离开工位，本局已中止。回来再开一局吧。"));
document.addEventListener("visibilitychange", () => {
  cancelAnimationFrame(frame);
  if (document.hidden) { abortRound("页面已离开，本局已中止。回来再开一局吧。"); clearHeld(); }
  else if (!closed) frame = requestAnimationFrame(tick);
});
window.addEventListener("pagehide", event => {
  cancelAnimationFrame(frame);
  if (event.persisted) { abortRound("离开工位，本局已中止。"); return; }
  closed = true;
  scene?.destroy();
  void audio?.close();
});
window.addEventListener("pageshow", event => { if (event.persisted) frame = requestAnimationFrame(tick); });

async function boot(): Promise<void> {
try {
  const { OfficeDiorama: Scene } = await import("./OfficeDiorama");
  scene = new Scene(node("scene"));
  await scene.load();
  if (closed) return;
  scene.render(performance.now(), { action: "idle", boss: "away" }, reducedMotion);
  node("loading").hidden = true;
  club.dataset.ready = "true";
  startButton.disabled = false;
  frame = requestAnimationFrame(tick);
} catch (error) {
  console.error("Unable to open 3D workstation", error);
  scene?.destroy();
  node("loading").innerHTML = '<span class="loading-mark">OH!</span><span>这个浏览器暂时无法打开 3D 工位。</span><a href="./">返回像素网吧</a>';
  poseButtons.forEach(button => { button.disabled = true; });
  put("status-text", "3D 工位未就绪，可返回像素网吧");
}
}
void boot();
