import {
  AnimatedSprite,
  BaseTexture,
  Container,
  Graphics,
  IRenderer,
  Rectangle,
  SCALE_MODES,
  Sprite,
  Texture,
} from "pixi.js";
import type { Player, StationSlot } from "../../types";
import { formatTokens } from "../../data/players";
import { pixelText } from "../rendering/pixelText";
import type { CharacterAsset, StationManifest } from "../stationManifest";
import { LayeredScreen } from "./LayeredScreen";
import type { OfficeEventType } from "./OfficeEventLayer";

const FRAME_ORDER = [0, 4, 1, 5, 2, 6, 3, 7, 3, 6, 2, 5, 1, 4];

type LayeredWorkstationOptions = {
  renderer: IRenderer;
  manifest: StationManifest;
  player: Player;
  slot: StationSlot;
  index: number;
  scale: number;
  onSelect: (player: Player) => void;
};

export class LayeredWorkstation extends Container {
  private readonly screen: LayeredScreen;
  private readonly horse: AnimatedSprite;
  private readonly selection = new Graphics();
  private readonly podium = new Graphics();
  private readonly badge = new Graphics();
  private readonly horseBaseY: number;
  private hovered = false;
  private selected = false;
  private officeEvent: OfficeEventType | null = null;

  readonly player: Player;

  constructor(private readonly options: LayeredWorkstationOptions) {
    super();
    this.player = options.player;
    this.position.set(options.slot.x, options.slot.y);
    this.scale.set(options.scale);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(110, 90, 1110, 1060);

    this.screen = new LayeredScreen(
      options.renderer,
      options.player.screen,
      options.manifest.workstation.screenQuad,
      options.index,
    );

    const frame = Sprite.from(options.manifest.workstation.image);
    frame.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    frame.width = options.manifest.workstation.size[0];
    frame.height = options.manifest.workstation.size[1];

    const horseAsset = this.horseAsset();
    this.horse = new AnimatedSprite(this.horseTextures(horseAsset));
    this.horse.animationSpeed = this.horseFps() / 60;
    this.horse.position.set(-220, 80);
    this.horse.scale.set(1.75);
    this.horse.gotoAndPlay(options.index % this.horse.totalFrames);
    this.horseBaseY = this.horse.y;

    const rankLabel = pixelText(String(options.index + 1).padStart(2, "0"), 72, 0x0b0805);
    rankLabel.position.set(677, 952);
    const tokenLabel = pixelText(formatTokens(options.player.tokens), 58, 0xffe086);
    tokenLabel.position.set(770, 955);
    this.drawBadge();
    this.drawPodium();

    this.addChild(this.podium, this.selection, this.screen.view, frame, this.horse, this.badge, rankLabel, tokenLabel);
    this.on("pointertap", () => options.onSelect(options.player));
    this.on("pointerover", () => {
      this.hovered = true;
      this.drawSelection();
    });
    this.on("pointerout", () => {
      this.hovered = false;
      this.drawSelection();
    });
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.drawSelection();
  }

  setOfficeEvent(event: OfficeEventType | null): void {
    this.officeEvent = event;
    this.screen.setOfficeEvent(event);
  }

  update(elapsedMs: number): void {
    this.screen.update(elapsedMs);
    const speed = this.player.mode === "sleep" ? 430 : this.player.mode === "gaming" ? 125 : 165;
    const amplitude = this.player.mode === "sleep" ? 1 : this.player.mode === "gaming" ? 2 : 1;
    const eventAmplitude = this.officeEvent === "inspection"
      ? 2
      : this.officeEvent === "delivery"
        ? 3
        : 0;
    const eventSpeed = this.officeEvent === "inspection" ? 52 : 90;
    this.horse.y = this.horseBaseY + Math.round(
      Math.sin(elapsedMs / speed + this.options.index) * amplitude
      + Math.sin(elapsedMs / eventSpeed + this.options.index * 2) * eventAmplitude,
    );
    if (this.player.rank <= 3) {
      this.podium.alpha = 0.55 + Math.sin(elapsedMs / 260 + this.options.index) * 0.18;
    }
    this.selection.alpha = this.selected
      ? 0.72 + Math.sin(elapsedMs / 240 + this.options.index) * 0.2
      : 1;
  }

  popupAnchor(): { x: number; y: number } {
    return {
      x: this.x + 690 * this.options.scale,
      y: this.y - (this.options.slot.row === "back" ? 20 : 34),
    };
  }

  destroy(options?: boolean | { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
    this.screen.destroy();
    super.destroy(options);
  }

  private horseAsset(): CharacterAsset {
    return this.options.manifest.horses[this.player.mode] ?? this.options.manifest.horse;
  }

  private horseTextures(asset: CharacterAsset): Texture[] {
    const [frameWidth, frameHeight] = asset.frameSize;
    const base = BaseTexture.from(asset.image);
    base.scaleMode = SCALE_MODES.NEAREST;
    const source = Array.from({ length: asset.frames }, (_, index) => {
      return new Texture(base, new Rectangle(index * frameWidth, 0, frameWidth, frameHeight));
    });
    return FRAME_ORDER.map((index) => source[index % source.length]);
  }

  private horseFps(): number {
    if (this.player.mode === "sleep") return 1.4;
    if (this.player.mode === "gaming") return 7;
    if (this.player.mode === "overdrive") return 9;
    return 5;
  }

  private drawBadge(): void {
    this.badge.beginFill(0x171109, 0.92);
    this.badge.drawRect(645, 936, 350, 105);
    this.badge.endFill();
    this.badge.lineStyle(10, 0x5b3218, 1);
    this.badge.drawRect(645, 936, 350, 105);
  }

  private drawPodium(): void {
    this.podium.clear();
    if (this.player.rank > 3) {
      this.podium.visible = false;
      return;
    }
    this.podium.visible = true;
    const color = this.player.rank === 1 ? 0xf3b43f : this.player.rank === 2 ? 0xcbd2d2 : 0xc77c3d;
    this.podium.lineStyle(12, color, 0.68);
    this.podium.moveTo(226, 1128).lineTo(1086, 1128);
    this.podium.lineStyle(4, color, 0.9);
    this.podium.moveTo(310, 1112).lineTo(1004, 1112);
  }

  private drawSelection(): void {
    this.selection.clear();
    if (!this.selected && !this.hovered) return;
    this.selection.lineStyle(12, this.selected ? 0x63e990 : 0xffe086, 0.9);
    this.selection.drawPolygon([128, 934, 452, 1125, 1110, 1068, 1202, 884, 830, 740, 224, 790]);
  }
}
