import { Container, Graphics } from "pixi.js";
import { WORLD } from "../constants";
import { pixelText } from "../rendering/pixelText";

export type OfficeEventType = "inspection" | "outage" | "delivery";

const EVENT_ORDER: OfficeEventType[] = ["inspection", "outage", "delivery"];
const EVENT_COPY: Record<OfficeEventType, string> = {
  inspection: "老板巡场 · 切屏！",
  outage: "网吧断电 · 重新连线",
  delivery: "外卖到了 · 休息 3 秒",
};

export class OfficeEventLayer extends Container {
  private readonly pixels = new Graphics();
  private readonly label = pixelText("", 18, 0x21150b);
  private active: OfficeEventType | null = null;
  private activeUntil = 0;
  private nextEventAt = 8500;
  private eventCursor = 0;

  constructor() {
    super();
    this.label.anchor.set(0.5);
    this.addChild(this.pixels, this.label);
    this.visible = false;
  }

  update(elapsedMs: number): OfficeEventType | null {
    if (!this.active && elapsedMs >= this.nextEventAt) {
      this.active = EVENT_ORDER[this.eventCursor % EVENT_ORDER.length];
      this.eventCursor += 1;
      this.activeUntil = elapsedMs + 3600;
      this.visible = true;
    }
    if (this.active && elapsedMs >= this.activeUntil) {
      this.active = null;
      this.visible = false;
      this.nextEventAt = elapsedMs + 25000 + (this.eventCursor % 3) * 3500;
      this.pixels.clear();
      return null;
    }
    if (!this.active) return null;

    this.drawEvent(this.active, elapsedMs);
    return this.active;
  }

  private drawEvent(type: OfficeEventType, elapsedMs: number): void {
    const age = elapsedMs - (this.activeUntil - 3600);
    const pulse = 0.7 + Math.sin(age / 90) * 0.18;
    const accent = type === "inspection" ? 0xf3b43f : type === "outage" ? 0x8fa8bc : 0x63e990;
    this.pixels.clear();

    if (type === "outage") {
      this.pixels.beginFill(0x020407, 0.27 + Math.sin(age / 80) * 0.06);
      this.pixels.drawRect(0, 344, WORLD.width, 590);
      this.pixels.endFill();
    }

    if (type === "inspection") {
      const scanY = 360 + (Math.floor(age / 10) % 555);
      this.pixels.beginFill(accent, 0.12);
      this.pixels.drawRect(14, scanY - 12, WORLD.width - 28, 26);
      this.pixels.endFill();
      this.pixels.beginFill(accent, pulse);
      this.pixels.drawRect(14, scanY, WORLD.width - 28, 4);
      this.pixels.endFill();
    }

    const width = 310;
    const height = 42;
    const x = (WORLD.width - width) / 2;
    const y = 326;
    this.pixels.beginFill(0x17120d, 0.96);
    this.pixels.drawRect(x, y, width, height);
    this.pixels.endFill();
    this.pixels.lineStyle(4, accent, pulse);
    this.pixels.drawRect(x, y, width, height);
    this.label.text = EVENT_COPY[type];
    this.label.style.fill = accent;
    this.label.position.set(WORLD.width / 2, y + height / 2);
    this.label.alpha = type === "outage" ? 0.78 + Math.sin(age / 75) * 0.2 : 1;
  }
}
