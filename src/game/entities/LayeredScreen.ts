import { Container, Graphics, IRenderer, RenderTexture, SCALE_MODES, SimplePlane, Sprite } from "pixi.js";
import type { ScreenTheme } from "../../types";
import { assetPath } from "../constants";
import type { Point } from "../stationManifest";
import type { OfficeEventType } from "./OfficeEventLayer";

const SCREEN = { width: 320, height: 240 };
export const SCREEN_ART: Record<ScreenTheme, string> = Object.fromEntries(
  ["dashboard", "api", "moba", "shooter", "video", "download", "rank", "card", "afk", "fishing"]
    .map((theme) => [theme, assetPath(`screen-real-v4/${theme}.webp`)]),
) as Record<ScreenTheme, string>;

/** Keep the approved artwork intact and animate its live regions inside the CRT. */
export class LayeredScreen {
  readonly view: SimplePlane;
  private readonly texture: RenderTexture;
  private readonly scene = new Container();
  private readonly pixels = new Graphics();
  private lastRender = -Infinity;
  private lastMotionTime = -Infinity;
  private officeEvent: OfficeEventType | null = null;

  constructor(
    private readonly renderer: IRenderer,
    private readonly theme: ScreenTheme,
    quad: [Point, Point, Point, Point],
    private readonly stationIndex: number,
  ) {
    this.texture = RenderTexture.create({ ...SCREEN, resolution: 2 });
    this.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    const artwork = Sprite.from(SCREEN_ART[theme]);
    artwork.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    artwork.width = SCREEN.width;
    artwork.height = SCREEN.height;
    this.scene.addChild(artwork, this.pixels);
    this.view = this.warpScreen(quad);
  }

  update(elapsedMs: number, reducedMotion = false): void {
    const time = reducedMotion ? 0 : elapsedMs;
    if (time === this.lastMotionTime) return;
    if (!reducedMotion && elapsedMs >= this.lastRender && elapsedMs - this.lastRender < 120) return;
    this.lastRender = elapsedMs;
    this.lastMotionTime = time;
    this.view.alpha = this.officeEvent === "outage" ? 0.6 : 1;
    this.pixels.clear();
    this.drawActivity(time);
    this.renderer.render(this.scene, { renderTexture: this.texture, clear: true });
  }

  setOfficeEvent(event: OfficeEventType | null): void {
    this.officeEvent = event;
    this.lastMotionTime = -Infinity;
  }

  destroy(): void {
    this.scene.destroy({ children: true });
    this.texture.destroy(true);
  }

  private drawActivity(time: number): void {
    const phase = Math.floor(time / 120) + this.stationIndex * 7;
    const cycle = (time % 2400) / 2400;
    switch (this.theme) {
      case "dashboard": {
        const x = 18 + (phase * 3) % 133;
        this.rect(x, 69, 2, 40, 0x75f5e5, 0.55);
        this.rect(x - 2, 84 + Math.sin(time / 700) * 8, 5, 5, 0xf3b43f);
        this.rect(258, 137 + (phase % 4) * 11, 6, 4, 0x63e990, 0.8);
        break;
      }
      case "api": {
        const y = 34 + (Math.floor(time / 600) % 10) * 12;
        this.rect(94, y, 113, 10, 0x38d985, 0.14);
        this.rect(118 + (phase % 9) * 8, y + 1, 2, 7, 0xe8f8de, phase % 4 < 2 ? 1 : 0.25);
        this.rect(7, 178 + (phase % 5) * 6, 120, 5, 0x63e990, 0.12);
        break;
      }
      case "moba": {
        // Spell travel follows the river; the camera and HUD stay still.
        const x = 126 + cycle * 104;
        const y = 91 + cycle * 46;
        this.pixels.lineStyle(2, 0x8de9ff, 0.85);
        this.pixels.moveTo(x - 15, y - 7).lineTo(x, y);
        this.pixels.beginFill(0xe3fcff).drawCircle(x, y, 3).endFill();
        this.pixels.lineStyle(2, 0xffdc62, 1 - cycle);
        this.pixels.drawEllipse(107, 126, 10 + cycle * 13, 4 + cycle * 6);
        this.rect(154, 224, 24 * cycle, 2, 0x69d5fb, 0.8);
        break;
      }
      case "shooter": {
        const spread = 4 + Math.sin(time / 340) * 2;
        this.pixels.lineStyle(1, 0xa8fb82, 0.9);
        this.pixels.moveTo(160 - spread - 4, 119).lineTo(160 - spread, 119);
        this.pixels.moveTo(160 + spread, 119).lineTo(160 + spread + 4, 119);
        this.pixels.moveTo(160, 119 - spread - 4).lineTo(160, 119 - spread);
        if (phase % 14 === 0) {
          this.pixels.lineStyle(0).beginFill(0xffd45a, 0.9);
          this.pixels.drawPolygon([191, 168, 177, 153, 194, 159, 201, 143, 201, 165]).endFill();
        }
        break;
      }
      case "video": {
        this.rect(208, 8, 4, 4, 0xef4d4d, phase % 8 < 4 ? 1 : 0.4);
        this.rect(248, 191, 63, 22, 0x06130f, 0.9);
        for (let i = 0; i < 11; i++) {
          const height = 4 + (Math.sin(time / 270 + i * 1.8) + 1) * 7;
          this.rect(250 + i * 5, 211 - height, 3, height, i > 8 ? 0xf3b43f : 0x63e990);
        }
        this.rect(60, 208, (phase * 2) % 142, 2, 0xf3b43f, 0.8);
        break;
      }
      case "download": {
        this.rect(107, 171, 166, 10, 0x071316);
        const progress = (time % 16000) / 16000;
        for (let i = 0; i < 30; i++) this.rect(109 + i * 5.3, 173, 4, 6, i / 30 < progress ? 0x8fdf3e : 0x213a3f);
        break;
      }
      case "rank": {
        const y = 66 + (Math.floor(time / 1100) % 10) * 15.2;
        this.rect(45, y, 263, 13, 0xf3b43f, 0.15);
        this.rect(146, y + 5, 72 * cycle, 3, 0xffdd62, 0.75);
        break;
      }
      case "card": {
        const column = Math.floor(time / 1400) % 7;
        this.pixels.lineStyle(2, 0xffe066, 0.65 + Math.sin(time / 280) * 0.3);
        this.pixels.drawRoundedRect(10 + column * 43, 106 + (column % 3) * 7, 35, 63, 2);
        break;
      }
      case "afk": {
        for (let i = 0; i < 9; i++) {
          const x = 18 + (phase * 2 + i * 37) % 288;
          const y = 35 + (i * 41) % 152;
          this.rect(x, y, 2, 2, i % 3 ? 0x7fe3ff : 0xf3b43f, 0.4 + Math.sin(time / 500 + i) * 0.35);
        }
        break;
      }
      case "fishing": {
        const y = 132 + Math.sin(time / 400) * 2;
        this.pixels.lineStyle(1, 0xdff7ff, 1 - cycle);
        this.pixels.drawEllipse(160, y, 3 + cycle * 13, 1 + cycle * 4);
        this.rect(158, y - 5, 3, 6, 0xef5d45);
        for (let i = 0; i < 4; i++) this.rect(85 + i * 45 + Math.sin(time / 800 + i) * 4, 145 + i * 13, 13, 1, 0xa6eaff, 0.35);
        break;
      }
    }
    // Static scan lines keep CRT texture separate from content motion.
    for (let y = 0; y < SCREEN.height; y += 4) this.rect(0, y, SCREEN.width, 1, 0x000000, 0.07);
  }

  private rect(x: number, y: number, width: number, height: number, color: number, alpha = 1): void {
    this.pixels.lineStyle(0).beginFill(color, alpha);
    this.pixels.drawRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height)).endFill();
  }

  private warpScreen(quad: [Point, Point, Point, Point]): SimplePlane {
    const columns = 9;
    const rows = 7;
    const plane = new SimplePlane(this.texture, columns, rows);
    plane.autoResize = false;
    const vertices = plane.verticesBuffer.data as unknown as Float32Array;
    const [topLeft, topRight, bottomRight, bottomLeft] = quad;
    for (let row = 0; row < rows; row++) {
      const vertical = row / (rows - 1);
      for (let column = 0; column < columns; column++) {
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
}
