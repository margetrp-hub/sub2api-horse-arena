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
const PIXEL_SCALE = 1 / 3;
const ANIMATION_DURATION = 6200;
const GOLD = 0xffd166;
const GOLD_LIGHT = 0xffe9a3;
const GLASS = 0x5de6c3;
const BALL_COLORS = [0xff5d7d, 0x4ee4c1, 0xffc857, 0xf7f0d8, 0x9b8cff, 0x55a7ff];

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
  node.beginFill(0x0c0a20, 0.8);
  node.drawPolygon(points.map((value, index) => value + (index % 2 === 0 ? 3 : 5)));
  node.endFill();
  node.beginFill(color);
  node.drawPolygon(points);
  node.endFill();
  node.lineStyle(2, 0xfff5d7, 0.8);
  node.drawPolygon(points.map((value) => value * 0.9));
  node.beginFill(0xfff7df, 0.9);
  node.drawRect(-radius * 0.35, -radius * 0.38, Math.max(3, radius * 0.2), Math.max(3, radius * 0.2));
  node.endFill();
  node.beginFill(0x0c0a20, 0.24);
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
    this.mount.setAttribute("role", "img");
    this.mount.setAttribute("aria-label", "可交互的幸运扭蛋机");
    this.mount.dataset.runtimeState = "idle";
    this.mount.addEventListener("click", this.activate);
    this.mount.addEventListener("keydown", this.activateFromKeyboard);
    this.mount.tabIndex = 0;

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
    this.statusText = new Text("PRESS", new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fontWeight: "700",
      fill: 0xfff0d2,
      letterSpacing: 2,
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
    this.app.ticker.start();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.mount.removeEventListener("click", this.activate);
    this.mount.removeEventListener("keydown", this.activateFromKeyboard);
    this.app.ticker.remove(this.tick, this);
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
  }

  private buildScene(): void {
    const stageGlow = new Graphics();
    stageGlow.beginFill(0x392f73, 0.9);
    stageGlow.drawRect(125, 92, 470, 486);
    stageGlow.endFill();
    stageGlow.beginFill(0x5de6c3, 0.18);
    stageGlow.drawRect(144, 112, 18, 18);
    stageGlow.drawRect(558, 154, 18, 18);
    stageGlow.drawRect(154, 522, 26, 26);
    stageGlow.drawRect(532, 492, 26, 26);
    stageGlow.endFill();
    this.machine.addChild(stageGlow);

    const shadow = new Graphics();
    shadow.beginFill(0x0c0a20, 0.9);
    shadow.drawRect(202, 690, 318, 18);
    shadow.endFill();
    this.machine.addChild(shadow);

    const body = new Graphics();
    body.beginFill(0x171331);
    body.drawRect(218, 390, 284, 298);
    body.endFill();
    body.lineStyle(8, GOLD, 1);
    body.drawRect(218, 390, 284, 298);
    body.beginFill(0x282052, 1);
    body.drawRect(236, 415, 248, 251);
    body.endFill();
    body.lineStyle(3, GLASS, 0.6);
    body.drawRect(236, 415, 248, 251);
    this.machine.addChild(body);

    const bodyHighlight = new Graphics();
    bodyHighlight.beginFill(0x9b8cff, 0.28);
    bodyHighlight.drawRect(248, 425, 12, 220);
    bodyHighlight.endFill();
    this.machine.addChild(bodyHighlight);

    const bodyDetails = new Graphics();
    bodyDetails.lineStyle(3, 0x9b8cff, 0.55);
    bodyDetails.moveTo(257, 438);
    bodyDetails.lineTo(257, 452);
    bodyDetails.moveTo(463, 438);
    bodyDetails.lineTo(463, 452);
    bodyDetails.beginFill(0xffd166, 0.86);
    bodyDetails.drawRect(252, 442, 10, 6);
    bodyDetails.drawRect(458, 442, 10, 6);
    bodyDetails.endFill();
    bodyDetails.beginFill(0x5de6c3, 0.82);
    bodyDetails.drawRect(252, 614, 10, 10);
    bodyDetails.drawRect(458, 614, 10, 10);
    bodyDetails.endFill();
    bodyDetails.beginFill(0x0c0a20, 0.8);
    bodyDetails.drawRect(246, 475, 12, 12);
    bodyDetails.drawRect(462, 475, 12, 12);
    bodyDetails.endFill();
    this.machine.addChild(bodyDetails);

    [
      [252, 442, 0xffd166], [458, 442, 0xffd166],
      [252, 614, 0x5de6c3], [458, 614, 0x5de6c3],
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
    base.beginFill(0x0c0a20);
    base.drawRect(190, 650, 340, 64);
    base.endFill();
    base.lineStyle(8, GOLD, 1);
    base.drawRect(190, 650, 340, 64);
    base.lineStyle(3, GOLD_LIGHT, 0.75);
    base.drawRect(204, 662, 312, 40);
    this.machine.addChild(base);

    const dome = new Graphics();
    dome.beginFill(0x171331, 1);
    dome.drawPolygon([360, 42, 444, 52, 506, 88, 548, 148, 548, 346, 518, 400, 202, 400, 172, 346, 172, 148, 214, 88, 276, 52]);
    dome.endFill();
    dome.lineStyle(8, GOLD, 1);
    dome.drawPolygon([360, 42, 444, 52, 506, 88, 548, 148, 548, 346, 518, 400, 202, 400, 172, 346, 172, 148, 214, 88, 276, 52]);
    dome.lineStyle(3, GLASS, 0.9);
    dome.drawPolygon([360, 60, 434, 70, 490, 102, 526, 158, 526, 338, 500, 380, 220, 380, 194, 338, 194, 158, 230, 102, 286, 70]);
    this.machine.addChild(dome);

    const ballsLayer = new Container();
    const ballPositions = [
      [281, 183, 22], [335, 151, 22], [388, 170, 24], [444, 192, 23],
      [255, 235, 23], [303, 231, 22], [355, 216, 24], [412, 227, 23], [465, 245, 23],
      [278, 287, 24], [329, 278, 22], [380, 278, 23], [430, 293, 24],
      [308, 338, 23], [359, 331, 25], [411, 345, 22],
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
    glassReflection.beginFill(0xeaffdf, 0.16);
    glassReflection.drawRect(236, 136, 12, 156);
    glassReflection.endFill();
    glassReflection.beginFill(0xffffff, 0.1);
    glassReflection.drawRect(458, 206, 10, 72);
    glassReflection.endFill();
    glassReflection.lineStyle(3, 0xeaffdf, 0.62);
    glassReflection.moveTo(242, 120);
    glassReflection.lineTo(270, 92);
    glassReflection.lineTo(296, 78);
    this.machine.addChild(glassReflection);

    const neck = new Graphics();
    neck.beginFill(0x0c0a20);
    neck.drawRect(211, 377, 298, 51);
    neck.endFill();
    neck.lineStyle(8, GOLD, 1);
    neck.drawRect(211, 377, 298, 51);
    this.machine.addChild(neck);

    const cap = new Graphics();
    cap.beginFill(0x0c0a20);
    cap.drawRect(218, 71, 284, 70);
    cap.endFill();
    cap.lineStyle(8, GOLD, 1);
    cap.drawRect(218, 71, 284, 70);
    cap.lineStyle(3, GOLD_LIGHT, 0.75);
    cap.drawRect(232, 83, 256, 45);
    this.machine.addChild(cap);

    const capKnob = new Graphics();
    capKnob.beginFill(0x282052);
    capKnob.drawRect(348, 44, 24, 24);
    capKnob.endFill();
    capKnob.lineStyle(4, GOLD, 1);
    capKnob.drawRect(348, 44, 24, 24);
    capKnob.beginFill(GOLD_LIGHT, 0.5);
    capKnob.drawRect(352, 48, 6, 6);
    capKnob.endFill();
    this.machine.addChild(capKnob);

    const panel = new Graphics();
    panel.beginFill(0x49366f);
    panel.drawRect(268, 458, 184, 125);
    panel.endFill();
    panel.lineStyle(6, GOLD_LIGHT, 1);
    panel.drawRect(268, 458, 184, 125);
    panel.lineStyle(3, 0x0c0a20, 0.9);
    panel.drawRect(279, 469, 162, 102);
    panel.beginFill(0x171331, 1);
    panel.drawRect(297, 511, 126, 25);
    panel.endFill();
    panel.lineStyle(2, GLASS, 0.8);
    panel.drawRect(297, 511, 126, 25);
    panel.beginFill(0xffd166, 0.9);
    panel.drawRect(309, 518, 8, 8);
    panel.drawRect(329, 518, 8, 8);
    panel.drawRect(349, 518, 8, 8);
    panel.drawRect(369, 518, 8, 8);
    panel.endFill();
    this.machine.addChild(panel);

    const lucky = new Text("LUCKY", new TextStyle({
      fontFamily: "monospace",
      fontSize: 18,
      fontWeight: "700",
      fill: GOLD_LIGHT,
      letterSpacing: 2,
    }));
    lucky.anchor.set(0.5);
    lucky.position.set(360, 487);
    this.machine.addChild(lucky);

    const outlet = new Graphics();
    outlet.beginFill(0x0c0a20);
    outlet.drawRect(294, 589, 132, 115);
    outlet.endFill();
    outlet.lineStyle(6, GOLD, 1);
    outlet.drawRect(294, 589, 132, 115);
    outlet.beginFill(0x050411);
    outlet.drawRect(306, 602, 108, 92);
    outlet.endFill();
    outlet.beginFill(0x392f73, 0.85);
    outlet.drawRect(316, 614, 88, 10);
    outlet.drawRect(316, 676, 88, 8);
    outlet.endFill();
    outlet.lineStyle(2, 0x5de6c3, 0.55);
    outlet.drawRect(320, 628, 80, 43);
    this.machine.addChild(outlet);

    const lever = new Graphics();
    lever.lineStyle(8, GOLD, 1);
    lever.moveTo(272, 535);
    lever.lineTo(301, 518);
    lever.beginFill(0xff5d7d, 1);
    lever.drawRect(249, 520, 18, 18);
    lever.endFill();
    lever.lineStyle(2, 0xffb4cb, 0.85);
    lever.drawRect(252, 523, 12, 12);
    this.machine.addChild(lever);

    this.button.position.set(271, 535);
    const buttonBezel = new Graphics();
    buttonBezel.beginFill(0x0c0a20);
    buttonBezel.drawRect(-51, -45, 102, 90);
    buttonBezel.endFill();
    buttonBezel.lineStyle(6, GOLD, 1);
    buttonBezel.drawRect(-51, -45, 102, 90);
    this.button.addChild(buttonBezel);
    const buttonFace = new Graphics();
    buttonFace.beginFill(0xff5d7d);
    buttonFace.drawRect(-37, -31, 74, 62);
    buttonFace.endFill();
    buttonFace.lineStyle(3, 0xffb4cb, 0.9);
    buttonFace.drawRect(-33, -27, 66, 54);
    buttonFace.beginFill(0xfff1d4, 0.9);
    buttonFace.drawRect(-24, -22, 8, 8);
    buttonFace.endFill();
    this.button.addChild(buttonFace);
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(0, 5);
    this.button.addChild(this.statusText);
    this.machine.addChild(this.button);

    const capsuleTopGraphic = new Graphics();
    capsuleTopGraphic.beginFill(0xff5d7d);
    capsuleTopGraphic.drawPolygon([-24, -42, 24, -42, 31, -35, 31, -10, -31, -10, -31, -35]);
    capsuleTopGraphic.endFill();
    capsuleTopGraphic.lineStyle(2, 0xffb4cb, 0.9);
    capsuleTopGraphic.drawPolygon([-24, -39, 24, -39, 28, -34, 28, -13, -28, -13, -28, -34]);
    capsuleTopGraphic.beginFill(0xfff5dd, 0.9);
    capsuleTopGraphic.drawRect(-17, -33, 7, 7);
    capsuleTopGraphic.endFill();
    this.capsuleTop.addChild(capsuleTopGraphic);
    const capsuleBottomGraphic = new Graphics();
    capsuleBottomGraphic.beginFill(0xffe7a6);
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

    this.rewardGlow.beginFill(0xffd166, 0.22);
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
