import { AnimatedSprite, Container, Graphics, Rectangle, SCALE_MODES, Sprite, Text, Texture } from "pixi.js";
import type { Player, StationSlot } from "../../types";
import { formatTokens } from "../../data/players";
import { ASSETS, FRAME } from "../constants";
import { pixelText } from "../rendering/pixelText";
import { texturesFromHorizontalSheet } from "../rendering/spriteSheet";
import { ScreenContent } from "./ScreenContent";

type WorkstationOptions = {
  player: Player;
  slot: StationSlot;
  index: number;
  maxTokens: number;
  onSelect: (player: Player) => void;
};

export class Workstation extends Container {
  private readonly selection = new Graphics();
  private readonly meter = new Graphics();
  private readonly screen: ScreenContent;
  private readonly horse: AnimatedSprite;
  private readonly rankLabel: Text;
  private readonly tokenLabel: Text;
  private readonly horseBaseY: number;
  private selected = false;
  private hovered = false;

  readonly player: Player;

  constructor(private readonly options: WorkstationOptions) {
    super();
    this.player = options.player;
    this.position.set(options.slot.x, options.slot.y);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(0, -24, FRAME.station.width, FRAME.station.height + 44);

    const base = this.imageSprite(ASSETS.workstationBases[options.index]);

    this.screen = new ScreenContent(options.player.screen);
    this.screen.position.set(FRAME.screen.x, FRAME.screen.y);

    const screenFrame = this.imageSprite(ASSETS.workstationFrames[options.index]);

    this.horse = new AnimatedSprite(this.horseTextures(options.player));
    this.horse.animationSpeed = this.animationSpeed(options.player);
    this.horse.play();
    this.placeHorse(options.player);
    this.horseBaseY = this.horse.y;

    this.rankLabel = pixelText(String(options.index + 1).padStart(2, "0"), 10, 0x0b0805);
    this.rankLabel.position.set(18, 160);

    this.tokenLabel = pixelText(`#${options.player.rank}`, 8, 0xffe086);
    this.tokenLabel.position.set(70, 222);

    this.addChild(base, screenFrame, this.screen, this.horse, this.selection, this.meter, this.rankLabel, this.tokenLabel);
    this.on("pointertap", () => options.onSelect(options.player));
    this.on("pointerover", () => {
      this.hovered = true;
      this.redrawChrome();
    });
    this.on("pointerout", () => {
      this.hovered = false;
      this.redrawChrome();
    });
    this.redrawChrome();
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    this.redrawChrome();
  }

  update(elapsedMs: number): void {
    this.screen.update(elapsedMs, this.options.index);
    if (this.player.mode !== "sleep") {
      this.horse.y = this.horseBaseY + Math.round(Math.sin(elapsedMs / 180 + this.options.index) * 2);
    }
  }

  popupAnchor(): { x: number; y: number } {
    return {
      x: this.x + FRAME.screen.x + FRAME.screen.width / 2,
      y: this.y + FRAME.screen.y,
    };
  }

  private imageSprite(src: string): Sprite {
    const sprite = Sprite.from(src);
    sprite.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    sprite.width = FRAME.station.width;
    sprite.height = FRAME.station.height;
    return sprite;
  }

  private horseTextures(player: Player): Texture[] {
    const src = ASSETS.horses[player.mode] ?? ASSETS.horses.working;
    return texturesFromHorizontalSheet(src, FRAME.horse.width, FRAME.horse.height, FRAME.horse.frames);
  }

  private animationSpeed(player: Player): number {
    if (player.mode === "sleep") return 0.055;
    if (player.mode === "gaming") return 0.18;
    if (player.mode === "overdrive") return 0.22;
    return 0.14;
  }

  private placeHorse(player: Player): void {
    const lift = player.mode === "sleep" ? 2 : 0;
    this.horse.position.set(FRAME.horse.x, FRAME.horse.y + lift);
    this.horse.width = FRAME.horse.width;
    this.horse.height = FRAME.horse.height;
  }

  private redrawChrome(): void {
    this.selection.clear();
    this.meter.clear();
    this.drawRankPlate();
    this.drawSelection();
    this.drawTokenMeter();
  }

  private drawRankPlate(): void {
    const fill = this.selected ? 0x5bc8ff : this.player.rank <= 3 ? 0xf3b43f : 0xffe086;
    this.selection.beginFill(fill);
    this.selection.drawRect(10, 154, 42, 26);
    this.selection.endFill();
    this.selection.lineStyle(3, 0x0b0805, 1);
    this.selection.drawRect(10, 154, 42, 26);
  }

  private drawSelection(): void {
    if (!this.selected && !this.hovered) return;
    this.selection.lineStyle(4, this.selected ? 0x5bc8ff : 0xffe086, 1);
    this.selection.drawRect(0, 0, FRAME.station.width, FRAME.station.height + 22);
  }

  private drawTokenMeter(): void {
    const ratio = Math.max(0.08, this.player.tokens / this.options.maxTokens);
    this.meter.beginFill(0x07110f, 0.92);
    this.meter.drawRect(66, 214, 110, 15);
    this.meter.endFill();
    this.meter.lineStyle(1, 0x0b0805, 1);
    this.meter.drawRect(66, 214, 110, 15);
    this.meter.beginFill(this.player.rank <= 3 ? 0xf3b43f : 0x63e990);
    this.meter.drawRect(69, 218, Math.floor(ratio * 102), 5);
    this.meter.endFill();
    this.tokenLabel.text = `${formatTokens(this.player.tokens)}`;
    this.tokenLabel.scale.set(0.75);
  }
}
