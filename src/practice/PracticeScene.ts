import { Application, Assets, Container, Rectangle, SCALE_MODES, Sprite, Texture } from "pixi.js";
import { LayeredScreen, SCREEN_ART } from "../game/entities/LayeredScreen";
import { loadStationManifest, type CharacterAsset } from "../game/stationManifest";
import type { RoundSnapshot } from "./rules";

export class PracticeScene {
  private readonly app: Application<HTMLCanvasElement>;
  private readonly world = new Container();
  private readonly desk = new Container();
  private readonly observer: ResizeObserver;
  private background?: Sprite;
  private working?: Sprite;
  private gaming?: Sprite;
  private boss?: Sprite;
  private workingFrames: Texture[] = [];
  private gamingFrames: Texture[] = [];
  private bossFrames: Texture[] = [];
  private screens: LayeredScreen[] = [];
  private disposed = false;
  private ready = false;

  constructor(private readonly mount: HTMLElement) {
    this.app = new Application<HTMLCanvasElement>({
      width: 1000, height: 760, backgroundColor: 0x191e1e,
      antialias: false, resolution: 1, autoStart: false,
    });
    this.app.view.setAttribute("aria-label", "我的工位：工作、摸鱼与老板巡场");
    this.app.view.setAttribute("role", "img");
    mount.append(this.app.view);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(mount);
  }

  async load(): Promise<void> {
    const manifest = await loadStationManifest();
    if (this.disposed) return;
    const working = manifest.horses.working ?? manifest.horse;
    const gaming = manifest.horses.gaming ?? working;
    await Assets.load([
      manifest.background, manifest.workstation.image, working.image, gaming.image,
      SCREEN_ART.api, SCREEN_ART.moba,
      ...(manifest.boss ? [manifest.boss.image] : []),
    ]);
    if (this.disposed) return;
    this.background = Sprite.from(manifest.background);
    this.background.alpha = 0.92;
    this.app.stage.addChild(this.background, this.world);
    this.world.addChild(this.desk);
    this.desk.position.set(125, 10);
    this.desk.scale.set(0.62);
    this.screens = [
      new LayeredScreen(this.app.renderer, "api", manifest.workstation.screenQuad, 0),
      new LayeredScreen(this.app.renderer, "moba", manifest.workstation.screenQuad, 0),
    ];
    this.desk.addChild(this.screens[0].view, this.screens[1].view, Sprite.from(manifest.workstation.image));
    this.workingFrames = this.frames(working);
    this.gamingFrames = this.frames(gaming);
    this.working = new Sprite(this.workingFrames[0]);
    this.gaming = new Sprite(this.gamingFrames[0]);
    for (const horse of [this.working, this.gaming]) {
      horse.position.set(-200, 30);
      horse.scale.set(2.1);
      this.desk.addChild(horse);
    }
    if (manifest.boss) {
      this.bossFrames = this.frames(manifest.boss);
      this.boss = new Sprite(this.bossFrames[0]);
      this.boss.position.set(700, 4);
      this.boss.scale.set(0.78);
      this.world.addChild(this.boss);
    }
    this.ready = true;
    this.resize();
  }

  render(now: number, state?: RoundSnapshot, reducedMotion = false): void {
    if (!this.ready || this.disposed) return;
    const time = reducedMotion ? 0 : now;
    const frame = reducedMotion ? 0 : Math.floor(now / 130) % 8;
    const gaming = state?.phase === "playing" && state.slacking;
    this.working!.visible = !gaming;
    this.gaming!.visible = Boolean(gaming);
    this.working!.texture = this.workingFrames[frame % this.workingFrames.length];
    this.gaming!.texture = this.gamingFrames[frame % this.gamingFrames.length];
    this.screens[0].view.visible = !gaming;
    this.screens[1].view.visible = Boolean(gaming);
    this.screens[gaming ? 1 : 0].update(time, reducedMotion);
    if (this.boss) {
      this.boss.visible = Boolean(state && state.boss !== "away" && state.phase === "playing");
      this.boss.texture = this.bossFrames[frame % this.bossFrames.length];
      this.boss.x = state?.boss === "warning" && !reducedMotion
        ? 700 + Math.min(120, state.warningRemaining / 16) : 700;
    }
    this.app.renderer.render(this.app.stage);
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.observer.disconnect();
    this.screens.forEach((screen) => screen.destroy());
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
    [...this.workingFrames, ...this.gamingFrames, ...this.bossFrames].forEach((texture) => texture.destroy(false));
  }

  private frames(asset: CharacterAsset): Texture[] {
    const texture = Texture.from(asset.image);
    texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    return Array.from({ length: asset.frames }, (_, index) => new Texture(
      texture.baseTexture,
      new Rectangle(index * asset.frameSize[0], 0, asset.frameSize[0], asset.frameSize[1]),
    ));
  }

  private resize(): void {
    if (this.disposed) return;
    const { width, height } = this.mount.getBoundingClientRect();
    if (!width || !height) return;
    this.app.renderer.resize(Math.round(width), Math.round(height));
    // Reserve room for the office title and nameplate without shrinking the workstation on wide screens.
    const top = width > 600 || width > height * 1.5 ? 0 : 70;
    const usableHeight = Math.max(120, height - top - 42);
    const scale = Math.min(width / 1050, usableHeight / 710);
    this.world.scale.set(scale);
    this.world.position.set((width - 1000 * scale) / 2, top + (usableHeight - 710 * scale) / 2);
    if (this.background) {
      const cover = Math.max(width / this.background.texture.width, height / this.background.texture.height);
      this.background.scale.set(cover);
      this.background.position.set((width - this.background.width) / 2, (height - this.background.height) / 2);
    }
  }
}
