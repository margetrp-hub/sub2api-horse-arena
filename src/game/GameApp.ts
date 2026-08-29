import { Application, Assets } from "pixi.js";
import type { Player } from "../types";
import { WORLD } from "./constants";
import { ASSET_LIST } from "./constants";
import { NetbarScene } from "./scenes/NetbarScene";
import { loadStationManifest } from "./stationManifest";

type GameAppOptions = {
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  onBossHit: (hits: number) => void;
};

export class GameApp {
  private readonly app: Application<HTMLCanvasElement>;
  private scene?: NetbarScene;
  private players: Player[];

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
    });
    this.app.view.className = "pixi-view";
    this.mount.appendChild(this.app.view);
  }

  async start(): Promise<void> {
    const manifest = await loadStationManifest();
    const assetUrls = [
      manifest.background,
      manifest.workstation.image,
      ...ASSET_LIST,
      ...Object.values(manifest.horses)
        .filter((asset) => asset !== undefined)
        .map((asset) => asset.image),
    ];
    if (manifest.boss) assetUrls.push(manifest.boss.image);
    await Assets.load(assetUrls);
    this.scene = new NetbarScene({
      ...this.options,
      renderer: this.app.renderer,
      manifest,
      players: this.players,
    });
    this.app.stage.addChild(this.scene);
    const selected = this.players.find((player) => player.self) ?? this.players[0];
    if (selected) this.scene.selectRank(selected.rank);
    this.scene.update(performance.now());
    this.app.renderer.render(this.app.stage);
    this.app.ticker.add(() => this.scene?.update(performance.now()));
  }

  selectRank(rank: number): void {
    this.scene?.selectRank(rank);
  }

  setPlayers(players: Player[]): void {
    this.players = players;
    this.scene?.setPlayers(players);
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: false, baseTexture: false });
  }
}
