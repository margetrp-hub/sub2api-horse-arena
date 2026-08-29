import { Container, Graphics, Text } from "pixi.js";
import { WORLD } from "../constants";
import { pixelText } from "../rendering/pixelText";

export class WorkerPhrasePopup extends Container {
  private readonly startMs: number;
  private readonly startY: number;
  private readonly durationMs = 2600;

  constructor(text: string, x: number, y: number, accent: number) {
    super();
    this.startMs = performance.now();

    const label: Text = pixelText(wrapPhrase(text, 18), 18, 0x21150b);
    label.style.fontWeight = "900";
    label.style.lineHeight = 22;
    label.style.align = "center";
    label.anchor.set(0.5);

    const width = Math.min(430, Math.max(220, Math.ceil(label.width) + 40));
    const height = Math.max(52, Math.ceil(label.height) + 24);
    const bubbleTop = -height - 10;
    const bubble = new Graphics();
    bubble.beginFill(0xfff0c7, 0.98);
    bubble.lineStyle(4, 0x21150b, 1);
    bubble.drawRect(-width / 2, bubbleTop, width, height);
    bubble.endFill();
    bubble.beginFill(accent, 1);
    bubble.lineStyle(3, 0x21150b, 1);
    bubble.drawPolygon([
      -10,
      bubbleTop + height - 1,
      10,
      bubbleTop + height - 1,
      2,
      bubbleTop + height + 12,
    ]);
    bubble.endFill();
    label.position.set(0, bubbleTop + height / 2);

    this.position.set(
      Math.max(width / 2 + 8, Math.min(WORLD.width - width / 2 - 8, x)),
      y,
    );
    this.startY = this.y;
    this.scale.set(0.9);
    this.addChild(bubble, label);
  }

  update(elapsedMs: number): boolean {
    const age = elapsedMs - this.startMs;
    if (age > this.durationMs) return false;

    const intro = Math.min(1, age / 130);
    const fade = age < 1900 ? 1 : 1 - (age - 1900) / (this.durationMs - 1900);
    this.scale.set(0.9 + intro * 0.1);
    this.y = this.startY - Math.round(Math.min(1, age / 1500) * 10);
    this.alpha = Math.max(0, fade);
    return true;
  }
}

function wrapPhrase(value: string, maxChars: number): string {
  const chars = Array.from(value);
  const lines: string[] = [];
  for (let index = 0; index < chars.length; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
  }
  return lines.join("\n");
}
