import "./station-prototype.css";
import {
  AnimatedSprite,
  Application,
  Assets,
  BaseTexture,
  Container,
  Graphics,
  Rectangle,
  RenderTexture,
  SCALE_MODES,
  SimplePlane,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from "pixi.js";

type Point = [number, number];

type StationManifest = {
  workstation: {
    image: string;
    size: [number, number];
    bounds: [number, number, number, number];
    screenQuad: [Point, Point, Point, Point];
  };
  horse: {
    image: string;
    frameSize: [number, number];
    frames: number;
    fps: number;
  };
};

const PORTRAIT = window.matchMedia("(max-width: 640px) and (orientation: portrait)").matches;
const WORLD = PORTRAIT ? { width: 800, height: 1000 } : { width: 1280, height: 800 };
const SCREEN_SIZE = { width: 320, height: 240 };
const MODES = ["工作中", "摸鱼中 · MOBA", "摸鱼中 · CS2"] as const;
const HORSE_FRAME_ORDER = [0, 4, 1, 5, 2, 6, 3, 7, 3, 6, 2, 5, 1, 4];
const HORSE_FPS = 5;

class ScreenAnimation {
  readonly texture: RenderTexture;

  private readonly scene = new Container();
  private readonly pixels = new Graphics();
  private readonly title = new Text(
    "",
    new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 14,
      fontWeight: "bold",
      fill: 0xe9f6d8,
      letterSpacing: 0,
    }),
  );
  private readonly status = new Text(
    "",
    new TextStyle({
      fontFamily: "Consolas, monospace",
      fontSize: 11,
      fontWeight: "bold",
      fill: 0x70f0a2,
      letterSpacing: 0,
    }),
  );
  private mode = 0;
  private lastRender = -1;

  constructor(private readonly app: Application<HTMLCanvasElement>) {
    this.texture = RenderTexture.create({
      width: SCREEN_SIZE.width,
      height: SCREEN_SIZE.height,
      resolution: 1,
    });
    this.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    this.title.position.set(14, 10);
    this.status.position.set(14, 216);
    this.scene.addChild(this.pixels, this.title, this.status);
  }

  get modeIndex(): number {
    return this.mode;
  }

  nextMode(): number {
    this.mode = (this.mode + 1) % MODES.length;
    this.lastRender = -1;
    return this.mode;
  }

  update(elapsedMs: number): void {
    if (elapsedMs - this.lastRender < 90) return;
    this.lastRender = elapsedMs;
    this.pixels.clear();
    this.drawScreenBase(elapsedMs);
    if (this.mode === 0) this.drawTokenWork(elapsedMs);
    if (this.mode === 1) this.drawMoba(elapsedMs);
    if (this.mode === 2) this.drawShooter(elapsedMs);
    this.app.renderer.render(this.scene, { renderTexture: this.texture, clear: true });
  }

  private drawScreenBase(elapsedMs: number): void {
    this.pixels.beginFill(0x061217);
    this.pixels.drawRect(0, 0, SCREEN_SIZE.width, SCREEN_SIZE.height);
    this.pixels.endFill();
    this.pixels.beginFill(this.mode === 0 ? 0x133b3b : this.mode === 1 ? 0x293548 : 0x342b27);
    this.pixels.drawRect(0, 0, SCREEN_SIZE.width, 34);
    this.pixels.endFill();

    const scanOffset = Math.floor(elapsedMs / 90) % 4;
    this.pixels.beginFill(0x87fff1, 0.055);
    for (let y = scanOffset; y < SCREEN_SIZE.height; y += 4) this.pixels.drawRect(0, y, SCREEN_SIZE.width, 1);
    this.pixels.endFill();
  }

  private drawTokenWork(elapsedMs: number): void {
    const phase = Math.floor(elapsedMs / 180);
    this.title.text = "OH! TOKEN OPS";
    this.status.text = `API RUNNING  ${98_765 + (phase % 43)}`;

    this.pixels.lineStyle(2, 0x1d5861, 1);
    this.pixels.drawRect(12, 46, 188, 154);
    this.pixels.drawRect(210, 46, 98, 154);

    const colors = [0x76e69b, 0x56c9ec, 0xf2bd45, 0xe86f63];
    for (let row = 0; row < 7; row += 1) {
      const width = 58 + ((row * 31 + phase * 7) % 105);
      this.pixels.beginFill(colors[row % colors.length], 0.88);
      this.pixels.drawRect(24, 60 + row * 18, width, 5);
      this.pixels.endFill();
      this.pixels.beginFill(0x294451);
      this.pixels.drawRect(24, 68 + row * 18, 138, 3);
      this.pixels.endFill();
    }

    for (let index = 0; index < 6; index += 1) {
      const height = 24 + ((index * 17 + phase * 5) % 88);
      this.pixels.beginFill(colors[index % colors.length]);
      this.pixels.drawRect(222 + index * 13, 181 - height, 8, height);
      this.pixels.endFill();
    }

    this.pixels.lineStyle(3, 0x75efb1, 1);
    let previousY = 178;
    for (let index = 0; index < 7; index += 1) {
      const x = 218 + index * 13;
      const y = 82 + ((index * 29 + phase * 6) % 72);
      if (index > 0) this.pixels.moveTo(x - 13, previousY).lineTo(x, y);
      previousY = y;
    }
  }

  private drawMoba(elapsedMs: number): void {
    const phase = elapsedMs / 260;
    this.title.text = "MOBA · MATCH 18:42";
    this.status.text = "5 VS 5   PING 22MS";
    this.pixels.beginFill(0x173426);
    this.pixels.drawRect(28, 48, 264, 154);
    this.pixels.endFill();
    this.pixels.lineStyle(5, 0x547654, 1);
    this.pixels.moveTo(44, 188).lineTo(278, 62);
    this.pixels.moveTo(44, 62).lineTo(278, 188);
    this.pixels.lineStyle(2, 0xa4c574, 1);
    this.pixels.drawRect(44, 62, 234, 126);

    for (let index = 0; index < 10; index += 1) {
      const friendly = index < 5;
      const x = 58 + ((index * 43 + Math.sin(phase + index) * 12 + 230) % 220);
      const y = 72 + ((index * 29 + Math.cos(phase * 0.8 + index) * 10 + 100) % 106);
      this.pixels.beginFill(friendly ? 0x57cfff : 0xef6c5a);
      this.pixels.drawRect(Math.round(x), Math.round(y), 7, 7);
      this.pixels.endFill();
    }
  }

  private drawShooter(elapsedMs: number): void {
    const phase = Math.floor(elapsedMs / 120) % 14;
    this.title.text = "CS2 · DUST";
    this.status.text = `100 HP   30 / ${90 - phase}`;
    this.pixels.beginFill(0x745b3f);
    this.pixels.drawRect(18, 45, 284, 160);
    this.pixels.endFill();
    this.pixels.beginFill(0x283942);
    this.pixels.drawPolygon([18, 45, 92, 94, 92, 205, 18, 205]);
    this.pixels.drawPolygon([302, 45, 228, 94, 228, 205, 302, 205]);
    this.pixels.endFill();
    this.pixels.beginFill(0x9d8565);
    this.pixels.drawRect(92, 94, 136, 111);
    this.pixels.endFill();
    this.pixels.lineStyle(3, 0xf3d46e, 1);
    this.pixels.moveTo(148, 139).lineTo(172, 139);
    this.pixels.moveTo(160, 127).lineTo(160, 151);
    this.pixels.beginFill(0xffd46b, phase % 5 === 0 ? 0.9 : 0);
    this.pixels.drawRect(175, 133, 18, 12);
    this.pixels.endFill();
  }
}

function horseTextures(manifest: StationManifest): Texture[] {
  const [frameWidth, frameHeight] = manifest.horse.frameSize;
  const base = BaseTexture.from(manifest.horse.image);
  base.scaleMode = SCALE_MODES.NEAREST;
  const sourceTextures = Array.from({ length: manifest.horse.frames }, (_, index) => {
    return new Texture(base, new Rectangle(index * frameWidth, 0, frameWidth, frameHeight));
  });
  return HORSE_FRAME_ORDER.map((index) => sourceTextures[index]);
}

function warpScreen(texture: Texture, quad: [Point, Point, Point, Point]): SimplePlane {
  const columns = 9;
  const rows = 7;
  const plane = new SimplePlane(texture, columns, rows);
  plane.autoResize = false;
  const vertices = plane.verticesBuffer.data as unknown as Float32Array;
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;

  for (let row = 0; row < rows; row += 1) {
    const vertical = row / (rows - 1);
    for (let column = 0; column < columns; column += 1) {
      const horizontal = column / (columns - 1);
      const topX = topLeft[0] + (topRight[0] - topLeft[0]) * horizontal;
      const topY = topLeft[1] + (topRight[1] - topLeft[1]) * horizontal;
      const bottomX = bottomLeft[0] + (bottomRight[0] - bottomLeft[0]) * horizontal;
      const bottomY = bottomLeft[1] + (bottomRight[1] - bottomLeft[1]) * horizontal;
      const index = (row * columns + column) * 2;
      vertices[index] = topX + (bottomX - topX) * vertical;
      vertices[index + 1] = topY + (bottomY - topY) * vertical;
    }
  }
  plane.verticesBuffer.update();
  return plane;
}

function drawBackdrop(stage: Container): void {
  const floorTop = PORTRAIT ? 610 : 470;
  const backdrop = new Graphics();
  backdrop.beginFill(0x17130f);
  backdrop.drawRect(0, 0, WORLD.width, floorTop);
  backdrop.endFill();
  backdrop.beginFill(0x263239);
  backdrop.drawRect(0, floorTop, WORLD.width, WORLD.height - floorTop);
  backdrop.endFill();
  backdrop.lineStyle(2, 0x131a1e, 0.8);
  for (let y = floorTop; y <= WORLD.height; y += 52) backdrop.moveTo(0, y).lineTo(WORLD.width, y);
  for (let x = -120; x <= WORLD.width + 120; x += 104) {
    backdrop.moveTo(x, floorTop).lineTo(x + 180, WORLD.height);
  }
  backdrop.beginFill(0x45301f);
  backdrop.drawRect(0, floorTop - 20, WORLD.width, 20);
  backdrop.endFill();
  stage.addChild(backdrop);
}

async function start(): Promise<void> {
  const mount = document.querySelector<HTMLElement>("#stationRoot");
  const modeLabel = document.querySelector<HTMLElement>("#modeLabel");
  if (!mount || !modeLabel) throw new Error("Missing station prototype mount.");

  const response = await fetch(`${import.meta.env.BASE_URL}assets/station-prototype/manifest.json`);
  if (!response.ok) throw new Error("Station manifest failed to load.");
  const manifest = (await response.json()) as StationManifest;
  const rebase = (path: string) => path.startsWith("/assets/")
    ? `${import.meta.env.BASE_URL}assets/${path.slice("/assets/".length)}`
    : path;
  manifest.workstation.image = rebase(manifest.workstation.image);
  manifest.horse.image = rebase(manifest.horse.image);
  await Assets.load([manifest.workstation.image, manifest.horse.image]);

  const app = new Application<HTMLCanvasElement>({
    width: WORLD.width,
    height: WORLD.height,
    antialias: false,
    autoDensity: false,
    resolution: 1,
    backgroundColor: 0x17130f,
  });
  app.view.className = "station-view";
  mount.appendChild(app.view);
  drawBackdrop(app.stage);

  const workstation = new Container();
  workstation.position.set(PORTRAIT ? 18 : 250, PORTRAIT ? 85 : 10);
  workstation.scale.set(PORTRAIT ? 0.61 : 0.62);

  const screen = new ScreenAnimation(app);
  const screenMesh = warpScreen(screen.texture, manifest.workstation.screenQuad);

  const frame = Sprite.from(manifest.workstation.image);
  frame.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
  frame.width = manifest.workstation.size[0];
  frame.height = manifest.workstation.size[1];

  const horse = new AnimatedSprite(horseTextures(manifest));
  horse.animationSpeed = HORSE_FPS / 60;
  horse.position.set(-235, 10);
  horse.scale.set(2.4);
  horse.eventMode = "static";
  horse.cursor = "pointer";
  horse.play();

  const screenHit = new Graphics();
  screenHit.beginFill(0x000000, 0.001);
  screenHit.drawPolygon(manifest.workstation.screenQuad.flat());
  screenHit.endFill();
  screenHit.eventMode = "static";
  screenHit.cursor = "pointer";
  screenHit.on("pointertap", () => {
    const mode = screen.nextMode();
    modeLabel.textContent = MODES[mode];
  });

  let boosted = false;
  horse.on("pointertap", () => {
    boosted = !boosted;
    horse.animationSpeed = (HORSE_FPS / 60) * (boosted ? 1.8 : 1);
    modeLabel.textContent = boosted ? `加速 · ${MODES[screen.modeIndex]}` : MODES[screen.modeIndex];
  });

  workstation.addChild(screenMesh, frame, horse, screenHit);
  app.stage.addChild(workstation);
  const horseBaseY = horse.y;
  app.ticker.add(() => {
    const elapsedMs = performance.now();
    horse.y = horseBaseY + Math.round(Math.sin(elapsedMs / 150) * 3);
    screen.update(elapsedMs);
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Station prototype failed to start.";
  document.body.textContent = message;
});
