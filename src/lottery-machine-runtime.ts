import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";

type LotteryMachineRuntimeOptions = {
  onActivate: () => void;
  onComplete: () => void;
};

type Ball = {
  node: Graphics;
  x: number;
  y: number;
  radius: number;
  phase: number;
  color: number;
};

const WIDTH = 720;
const HEIGHT = 720;
const PIXEL_SCALE = 2 / 3;
const ANIMATION_DURATION = 6200;
const GOLD = 0xc1ef73;
const GOLD_LIGHT = 0xe3efcf;
const GLASS = 0x83deca;
const CHARCOAL = 0x333c36;
const DEEP = 0x151d18;
const BALL_COLORS = [0xff806d, 0x62e0ce, 0xf3c969, 0xf8f0d6, 0x75b7e8, 0xffa45f];

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function easeOut(value: number): number {
  const t = clamp(value);
  return 1 - ((1 - t) ** 3);
}

function easeInOut(value: number): number {
  const t = clamp(value);
  return t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2;
}

function drawBall(node: Graphics, color: number, radius: number): void {
  node.clear();
  const points = [
    -radius + 5, -radius,
    radius - 5, -radius,
    radius, -radius + 5,
    radius, radius - 5,
    radius - 5, radius,
    -radius + 5, radius,
    -radius, radius - 5,
    -radius, -radius + 5,
  ];
  node.beginFill(DEEP, 0.88);
  node.drawPolygon(points.map((value, index) => value + (index % 2 === 0 ? 3 : 5)));
  node.endFill();
  node.beginFill(color);
  node.drawPolygon(points);
  node.endFill();
  node.lineStyle(2, 0xfff1cf, 0.82);
  node.drawPolygon(points.map((value) => value * 0.9));
  node.beginFill(0xfff7df, 0.95);
  node.drawRect(-radius * 0.35, -radius * 0.38, Math.max(4, radius * 0.22), Math.max(4, radius * 0.22));
  node.endFill();
  node.beginFill(DEEP, 0.24);
  node.drawRect(-radius * 0.42, radius * 0.33, radius * 0.84, Math.max(3, radius * 0.16));
  node.endFill();
}

export class LotteryMachineRuntime {
  private readonly app: Application<HTMLCanvasElement>;
  private readonly machine = new Container();
  private readonly balls: Ball[] = [];
  private readonly button = new Container();
  private readonly capsule = new Container();
  private readonly capsuleTop = new Container();
  private readonly capsuleBottom = new Container();
  private readonly capsuleBand = new Graphics();
  private readonly rewardGlow = new Graphics();
  private readonly indicatorLights: Graphics[] = [];
  private readonly statusText: Text;
  private readonly mount: HTMLElement;
  private readonly options: LotteryMachineRuntimeOptions;
  private startedAt = 0;
  private running = false;
  private completed = false;
  private destroyed = false;
  private completionTimer: number | undefined;
  private readonly activate = (event?: MouseEvent): void => {
    if (event) {
      const rect = this.mount.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
      if (((x - 271) ** 2) + ((y - 535) ** 2) > 68 ** 2) return;
    }
    if (!this.running && !this.completed) this.options.onActivate();
  };
  private readonly activateFromKeyboard = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    this.activate();
  };

  constructor(mount: HTMLElement, options: LotteryMachineRuntimeOptions) {
    this.mount = mount;
    this.options = options;
    const enabled = this.mount.dataset.canDraw === "true";
    this.mount.setAttribute("role", enabled ? "button" : "img");
    this.mount.setAttribute("aria-label", enabled ? "扭一次，消耗一枚代币" : "幸运扭蛋机");
    this.mount.dataset.runtimeState = "idle";
    this.mount.addEventListener("click", this.activate);
    this.mount.addEventListener("keydown", this.activateFromKeyboard);
    this.mount.tabIndex = enabled ? 0 : -1;

    this.app = new Application<HTMLCanvasElement>({
      width: WIDTH * PIXEL_SCALE,
      height: HEIGHT * PIXEL_SCALE,
      antialias: false,
      autoDensity: false,
      backgroundAlpha: 0,
      resolution: 1,
    });
    this.app.view.className = "lottery-runtime-canvas";
    this.app.view.style.imageRendering = "pixelated";
    this.app.view.setAttribute("aria-hidden", "true");
    this.mount.appendChild(this.app.view);
    this.statusText = new Text("READY", new TextStyle({
      fontFamily: "Cascadia Mono, monospace",
      fontSize: 11,
      fontWeight: "700",
      fill: 0xfff0d2,
      letterSpacing: 0,
      dropShadow: true,
      dropShadowColor: 0x451c1a,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    }));
    this.buildScene();
    this.machine.scale.set(PIXEL_SCALE);
    this.app.stage.addChild(this.machine);
    this.app.ticker.add(this.tick, this);
    this.app.ticker.stop();
    this.renderNow();
  }

  play(): void {
    if (this.destroyed || this.running) return;
    this.running = true;
    this.completed = false;
    this.startedAt = performance.now();
    this.mount.dataset.runtimeState = "playing";
    this.statusText.text = "RUN";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.completionTimer = window.setTimeout(() => this.options.onComplete(), 100);
      return;
    }
    this.app.ticker.start();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.clearTimeout(this.completionTimer);
    this.mount.removeEventListener("click", this.activate);
    this.mount.removeEventListener("keydown", this.activateFromKeyboard);
    this.app.ticker.remove(this.tick, this);
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
  }

  private buildScene(): void {
    const shadow = new Graphics();
    shadow.beginFill(DEEP, 0.95);
    shadow.drawRect(184, 690, 352, 18);
    shadow.endFill();
    this.machine.addChild(shadow);

    const body = new Graphics();
    body.beginFill(CHARCOAL);
    body.drawRect(216, 390, 288, 298);
    body.endFill();
    body.lineStyle(8, GOLD, 1);
    body.drawRect(216, 390, 288, 298);
    body.beginFill(0x173c3e, 1);
    body.drawRect(232, 407, 256, 265);
    body.endFill();
    body.lineStyle(3, GLASS, 0.48);
    body.drawRect(232, 407, 256, 265);
    body.beginFill(0x061519, 0.7);
    body.drawRect(245, 421, 10, 236);
    body.drawRect(465, 421, 10, 236);
    body.endFill();
    this.machine.addChild(body);

    const bodyDetails = new Graphics();
    bodyDetails.lineStyle(3, GOLD_LIGHT, 0.46);
    bodyDetails.moveTo(256, 429);
    bodyDetails.lineTo(256, 454);
    bodyDetails.moveTo(464, 429);
    bodyDetails.lineTo(464, 454);
    bodyDetails.beginFill(GOLD, 0.92);
    bodyDetails.drawRect(251, 440, 10, 7);
    bodyDetails.drawRect(459, 440, 10, 7);
    bodyDetails.endFill();
    bodyDetails.beginFill(GLASS, 0.9);
    bodyDetails.drawRect(251, 633, 10, 10);
    bodyDetails.drawRect(459, 633, 10, 10);
    bodyDetails.endFill();
    bodyDetails.beginFill(DEEP, 0.92);
    bodyDetails.drawRect(250, 474, 12, 12);
    bodyDetails.drawRect(458, 474, 12, 12);
    bodyDetails.endFill();
    this.machine.addChild(bodyDetails);

    [
      [251, 440, GOLD], [459, 440, GOLD],
      [251, 633, GLASS], [459, 633, GLASS],
    ].forEach(([x, y, color]) => {
      const light = new Graphics();
      light.beginFill(color, 1);
      light.drawRect(0, 0, 10, 10);
      light.endFill();
      light.position.set(x, y);
      this.indicatorLights.push(light);
      this.machine.addChild(light);
    });

    const base = new Graphics();
    base.beginFill(DEEP);
    base.drawRect(182, 650, 356, 66);
    base.endFill();
    base.lineStyle(8, GOLD, 1);
    base.drawRect(182, 650, 356, 66);
    base.lineStyle(3, GOLD_LIGHT, 0.72);
    base.drawRect(197, 662, 326, 42);
    base.beginFill(0x173c3e, 1);
    base.drawRect(215, 672, 52, 20);
    base.drawRect(453, 672, 52, 20);
    base.endFill();
    this.machine.addChild(base);

    const dome = new Graphics();
    const outerDome = [360, 38, 430, 46, 492, 74, 540, 124, 560, 180, 560, 346, 522, 400, 198, 400, 160, 346, 160, 180, 180, 124, 228, 74, 290, 46];
    const innerDome = [360, 59, 423, 66, 477, 91, 518, 137, 536, 184, 536, 338, 507, 380, 213, 380, 184, 338, 184, 184, 202, 137, 243, 91, 297, 66];
    dome.beginFill(0x0c2427, 1);
    dome.drawPolygon(outerDome);
    dome.endFill();
    dome.lineStyle(8, GOLD, 1);
    dome.drawPolygon(outerDome);
    dome.beginFill(0x164246, 0.78);
    dome.drawPolygon(innerDome);
    dome.endFill();
    dome.lineStyle(3, GLASS, 0.95);
    dome.drawPolygon(innerDome);
    dome.lineStyle(2, GOLD_LIGHT, 0.42);
    dome.moveTo(190, 180);
    dome.lineTo(190, 336);
    dome.moveTo(530, 180);
    dome.lineTo(530, 336);
    this.machine.addChild(dome);

    const ballsLayer = new Container();
    const ballPositions = [
      [281, 181, 22], [335, 151, 22], [388, 168, 24], [444, 190, 23],
      [255, 234, 23], [303, 230, 22], [355, 214, 24], [412, 225, 23], [465, 244, 23],
      [278, 286, 24], [329, 277, 22], [380, 277, 23], [430, 292, 24],
      [308, 337, 23], [359, 330, 25], [411, 344, 22],
    ];
    ballPositions.forEach(([x, y, radius], index) => {
      const node = new Graphics();
      const color = BALL_COLORS[index % BALL_COLORS.length];
      drawBall(node, color, radius);
      node.position.set(x, y);
      ballsLayer.addChild(node);
      this.balls.push({ node, x, y, radius, phase: index * 0.77, color });
    });
    this.machine.addChild(ballsLayer);

    const glassReflection = new Graphics();
    glassReflection.beginFill(0xeaffdf, 0.13);
    glassReflection.drawRect(222, 136, 11, 166);
    glassReflection.drawRect(485, 214, 9, 74);
    glassReflection.endFill();
    glassReflection.lineStyle(3, 0xeaffdf, 0.7);
    glassReflection.moveTo(228, 118);
    glassReflection.lineTo(258, 88);
    glassReflection.lineTo(290, 72);
    this.machine.addChild(glassReflection);

    const neck = new Graphics();
    neck.beginFill(DEEP);
    neck.drawRect(205, 376, 310, 54);
    neck.endFill();
    neck.lineStyle(8, GOLD, 1);
    neck.drawRect(205, 376, 310, 54);
    neck.lineStyle(2, GOLD_LIGHT, 0.7);
    neck.drawRect(220, 389, 280, 27);
    this.machine.addChild(neck);

    const cap = new Graphics();
    cap.beginFill(DEEP);
    cap.drawRect(226, 66, 268, 76);
    cap.endFill();
    cap.lineStyle(8, GOLD, 1);
    cap.drawRect(226, 66, 268, 76);
    cap.lineStyle(3, GOLD_LIGHT, 0.78);
    cap.drawRect(239, 79, 242, 50);
    cap.beginFill(0x173c3e, 1);
    cap.drawRect(250, 89, 220, 30);
    cap.endFill();
    cap.lineStyle(2, GLASS, 0.55);
    cap.drawRect(250, 89, 220, 30);
    this.machine.addChild(cap);

    const capKnob = new Graphics();
    capKnob.beginFill(0x173c3e);
    capKnob.drawRect(347, 42, 26, 26);
    capKnob.endFill();
    capKnob.lineStyle(4, GOLD, 1);
    capKnob.drawRect(347, 42, 26, 26);
    capKnob.beginFill(GOLD_LIGHT, 0.55);
    capKnob.drawRect(352, 47, 7, 7);
    capKnob.endFill();
    this.machine.addChild(capKnob);

    const capText = new Text("LUCKY  /  CAPSULE", new TextStyle({
      fontFamily: "Cascadia Mono, monospace",
      fontSize: 14,
      fontWeight: "700",
      fill: GOLD_LIGHT,
      letterSpacing: 0,
    }));
    capText.anchor.set(0.5);
    capText.position.set(360, 103);
    this.machine.addChild(capText);

    const panel = new Graphics();
    panel.beginFill(0x1b494a);
    panel.drawRect(306, 452, 146, 116);
    panel.endFill();
    panel.lineStyle(5, GOLD_LIGHT, 1);
    panel.drawRect(306, 452, 146, 116);
    panel.lineStyle(2, DEEP, 0.95);
    panel.drawRect(317, 463, 124, 94);
    panel.beginFill(DEEP, 1);
    panel.drawRect(329, 507, 100, 27);
    panel.endFill();
    panel.lineStyle(2, GLASS, 0.86);
    panel.drawRect(329, 507, 100, 27);
    panel.beginFill(GOLD, 0.9);
    panel.drawRect(340, 514, 8, 8);
    panel.drawRect(358, 514, 8, 8);
    panel.drawRect(376, 514, 8, 8);
    panel.drawRect(394, 514, 8, 8);
    panel.endFill();
    panel.beginFill(GLASS, 0.85);
    panel.drawRect(330, 480, 36, 8);
    panel.drawRect(373, 480, 56, 8);
    panel.endFill();
    this.machine.addChild(panel);

    const lucky = new Text("TOKEN", new TextStyle({
      fontFamily: "Cascadia Mono, monospace",
      fontSize: 17,
      fontWeight: "700",
      fill: GOLD_LIGHT,
      letterSpacing: 0,
    }));
    lucky.anchor.set(0.5);
    lucky.position.set(379, 476);
    this.machine.addChild(lucky);

    const outlet = new Graphics();
    outlet.beginFill(DEEP);
    outlet.drawRect(294, 585, 132, 120);
    outlet.endFill();
    outlet.lineStyle(6, GOLD, 1);
    outlet.drawRect(294, 585, 132, 120);
    outlet.beginFill(0x020d10);
    outlet.drawRect(307, 599, 106, 94);
    outlet.endFill();
    outlet.lineStyle(2, GLASS, 0.62);
    outlet.drawRect(316, 612, 88, 56);
    outlet.beginFill(0x1b494a, 0.9);
    outlet.drawRect(316, 612, 88, 10);
    outlet.drawRect(316, 680, 88, 8);
    outlet.endFill();
    outlet.beginFill(GOLD, 0.8);
    outlet.drawRect(329, 602, 62, 5);
    outlet.endFill();
    this.machine.addChild(outlet);

    const lever = new Graphics();
    lever.lineStyle(9, GOLD, 1);
    lever.moveTo(271, 535);
    lever.lineTo(306, 515);
    lever.beginFill(BALL_COLORS[0], 1);
    lever.drawRect(247, 520, 20, 20);
    lever.endFill();
    lever.lineStyle(2, 0xffc0a9, 0.9);
    lever.drawRect(251, 524, 12, 12);
    this.machine.addChild(lever);

    this.button.position.set(271, 535);
    const buttonBezel = new Graphics();
    buttonBezel.beginFill(DEEP);
    buttonBezel.drawRect(-48, -38, 96, 76);
    buttonBezel.endFill();
    buttonBezel.lineStyle(5, GOLD, 1);
    buttonBezel.drawRect(-48, -38, 96, 76);
    this.button.addChild(buttonBezel);
    const buttonFace = new Graphics();
    buttonFace.beginFill(0xff806d);
    buttonFace.drawRect(-35, -26, 70, 52);
    buttonFace.endFill();
    buttonFace.lineStyle(3, 0xffc0a9, 0.92);
    buttonFace.drawRect(-31, -22, 62, 44);
    buttonFace.beginFill(0xfff1cf, 0.9);
    buttonFace.drawRect(-23, -17, 8, 8);
    buttonFace.endFill();
    this.button.addChild(buttonFace);
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(0, 5);
    this.button.addChild(this.statusText);
    this.machine.addChild(this.button);

    const capsuleTopGraphic = new Graphics();
    capsuleTopGraphic.beginFill(BALL_COLORS[0]);
    capsuleTopGraphic.drawPolygon([-24, -42, 24, -42, 31, -35, 31, -10, -31, -10, -31, -35]);
    capsuleTopGraphic.endFill();
    capsuleTopGraphic.lineStyle(2, 0xffc0a9, 0.9);
    capsuleTopGraphic.drawPolygon([-24, -39, 24, -39, 28, -34, 28, -13, -28, -13, -28, -34]);
    capsuleTopGraphic.beginFill(0xfff5dd, 0.9);
    capsuleTopGraphic.drawRect(-17, -33, 7, 7);
    capsuleTopGraphic.endFill();
    this.capsuleTop.addChild(capsuleTopGraphic);
    const capsuleBottomGraphic = new Graphics();
    capsuleBottomGraphic.beginFill(0xf1d39a);
    capsuleBottomGraphic.drawPolygon([-31, 10, 31, 10, 31, 35, 24, 42, -24, 42, -31, 35]);
    capsuleBottomGraphic.endFill();
    capsuleBottomGraphic.lineStyle(2, GOLD_LIGHT, 0.9);
    capsuleBottomGraphic.drawPolygon([-28, 13, 28, 13, 28, 33, 22, 38, -22, 38, -28, 33]);
    this.capsuleBottom.addChild(capsuleBottomGraphic);
    this.capsuleBand.beginFill(GOLD);
    this.capsuleBand.drawRect(-32, -4, 64, 8);
    this.capsuleBand.endFill();
    this.capsule.addChild(this.capsuleBottom, this.capsuleTop, this.capsuleBand);
    this.capsule.position.set(360, 650);
    this.capsule.scale.set(0.2);
    this.capsule.visible = false;
    this.machine.addChild(this.capsule);

    this.rewardGlow.beginFill(GOLD, 0.22);
    this.rewardGlow.drawRect(-28, -28, 56, 56);
    this.rewardGlow.endFill();
    this.rewardGlow.lineStyle(3, GOLD_LIGHT, 0.8);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      this.rewardGlow.moveTo(Math.cos(angle) * 48, Math.sin(angle) * 48);
      this.rewardGlow.lineTo(Math.cos(angle) * 63, Math.sin(angle) * 63);
    }
    this.rewardGlow.position.set(360, 624);
    this.rewardGlow.alpha = 0;
    this.machine.addChild(this.rewardGlow);
  }

  private tick(): void {
    if (!this.running || this.destroyed) return;
    const elapsed = performance.now() - this.startedAt;
    const progress = clamp(elapsed / ANIMATION_DURATION);
    const agitation = easeInOut(clamp(progress / 0.5));
    const decay = 1 - easeInOut(clamp((progress - 0.48) / 0.25));
    const shake = agitation * (0.65 + decay * 1.8);
    this.machine.position.x = Math.sin(elapsed * 0.047) * shake * 3.2;
    this.machine.position.y = Math.abs(Math.sin(elapsed * 0.038)) * shake * 2.2;
    this.machine.rotation = Math.sin(elapsed * 0.035) * shake * 0.0028;
    this.indicatorLights.forEach((light, index) => {
      const pulse = 0.5 + Math.abs(Math.sin(elapsed * 0.008 + index * 1.3)) * 0.5;
      light.alpha = this.running ? 0.55 + pulse * 0.45 : 0.72;
    });

    this.balls.forEach((ball, index) => {
      const orbit = agitation * (8 + (index % 4) * 3) + decay * 3;
      ball.node.position.x = ball.x + Math.sin(elapsed * (0.005 + index * 0.00012) + ball.phase) * orbit;
      ball.node.position.y = ball.y + Math.cos(elapsed * (0.004 + index * 0.0001) + ball.phase) * orbit * 0.78;
      ball.node.rotation = elapsed * 0.0014 * (index % 2 === 0 ? 1 : -1);
      drawBall(ball.node, ball.color, ball.radius);
    });

    const press = easeOut(clamp(progress / 0.1)) * (1 - easeOut(clamp((progress - 0.18) / 0.12)));
    this.button.position.y = 535 + press * 10;
    this.button.scale.set(1 - press * 0.06);

    const capsuleProgress = clamp((progress - 0.48) / 0.24);
    this.capsule.visible = capsuleProgress > 0;
    if (this.capsule.visible) {
      const drop = easeOut(capsuleProgress);
      this.capsule.position.y = 505 + drop * 145;
      this.capsule.scale.set(0.36 + drop * 0.64);
      this.capsule.rotation = Math.sin(elapsed * 0.01) * (1 - drop) * 0.18;
      const open = easeOut(clamp((progress - 0.78) / 0.17));
      this.capsuleTop.position.y = -open * 34;
      this.capsuleTop.position.x = open * 8;
      this.capsuleTop.rotation = open * 0.16;
      this.capsuleBottom.position.y = open * 9;
      this.capsuleBand.alpha = 1 - open;
      this.rewardGlow.alpha = open * (0.68 + Math.sin(elapsed * 0.015) * 0.18);
      this.rewardGlow.scale.set(0.88 + Math.sin(elapsed * 0.01) * 0.06);
    }

    this.renderNow();
    if (progress >= 1) {
      this.running = false;
      this.completed = true;
      this.mount.dataset.runtimeState = "complete";
      this.statusText.text = "DONE";
      this.app.ticker.stop();
      this.renderNow();
      this.options.onComplete();
    }
  }

  private renderNow(): void {
    if (!this.destroyed) this.app.renderer.render(this.app.stage);
  }
}
