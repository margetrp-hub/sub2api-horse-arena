import { Application, Assets } from "pixi.js";
import type { Player } from "../types";
import { WORLD } from "./constants";
import { ASSET_LIST } from "./constants";
import { NetbarScene } from "./scenes/NetbarScene";
import { loadStationManifest } from "./stationManifest";
import { SCREEN_ART } from "./entities/LayeredScreen";

type GameAppOptions = {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  onBossHit: (hits: number) => void;
};

export class GameApp {
  private readonly app: Application<HTMLCanvasElement>;
  private scene?: NetbarScene;
  private players: Player[];
  private paused = false;
  private destroyed = false;

  constructor(private readonly mount: HTMLElement, private readonly options: GameAppOptions) {
    this.players = options.players;
    this.app = new Application<HTMLCanvasElement>({
      width: WORLD.width,
      height: WORLD.height,
      antialias: false,
      autoDensity: false,
      backgroundColor: 0x070504,
      backgroundAlpha: 0,
      resolution: 1,
      autoStart: false,
    });
    this.app.ticker.maxFPS = 30;
    this.app.view.className = "pixi-view";
    this.mount.appendChild(this.app.view);
  }

  async start(): Promise<void> {
    const manifest = await loadStationManifest();
    const assetUrls = [
      manifest.background,
      manifest.workstation.image,
      ...ASSET_LIST,
      ...Object.values(SCREEN_ART),
      ...Object.values(manifest.horses)
        .filter((asset) => asset !== undefined)
        .map((asset) => asset.image),
    ];
    if (manifest.boss) assetUrls.push(manifest.boss.image);
    await Assets.load(assetUrls);
    if (this.destroyed) return;
    this.scene = new NetbarScene({
      ...this.options,
      renderer: this.app.renderer,
      manifest,
      popupMount: this.mount,
      players: this.players,
    });
    this.app.stage.addChild(this.scene);
    const selected = this.players.find((player) => player.self) ?? this.players[0];
    if (selected) this.scene.selectRank(selected.rank);
    this.scene.update(performance.now());
    this.app.renderer.render(this.app.stage);
    this.app.ticker.add(() => this.scene?.update(performance.now()));
    this.setPaused(this.paused);
  }

  selectRank(rank: number): void {
    this.scene?.selectRank(rank);
  }

  setPlayers(players: Player[]): void {
    this.players = players;
    this.scene?.setPlayers(players);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (!this.scene || this.destroyed) return;
    if (paused) {
      this.scene.clearPhrases();
      this.app.stop();
    }
    else this.app.start();
  }

  destroy(): void {
    this.destroyed = true;
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
  }
}
