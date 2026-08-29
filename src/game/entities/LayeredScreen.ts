import {
  Container,
  Graphics,
  IRenderer,
  RenderTexture,
  SCALE_MODES,
  SimplePlane,
  Text,
  TextStyle,
} from "pixi.js";
import type { ScreenTheme } from "../../types";
import type { Point } from "../stationManifest";
import type { OfficeEventType } from "./OfficeEventLayer";

const SCREEN = { width: 320, height: 240 };
const SCREEN_REFRESH_MS = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  ? 200
  : 120;

const labels: Record<ScreenTheme, [string, string]> = {
  dashboard: ["OH! TOKEN OPS", "API RUNNING"],
  api: ["API CONSOLE", "200 OK"],
  moba: ["LOL · RANKED", "TEAM FIGHT"],
  shooter: ["CS2 · DUST", "100 HP · 30 AMMO"],
  video: ["VIDEO ROOM", "WEEK · 12.8K"],
  download: ["MODEL SYNC", "DOWNLOADING"],
  rank: ["TOKEN RANK", "WEEK"],
  card: ["SOLITAIRE", "AFK MODE"],
  afk: ["SCREEN SAVER", "AWAY"],
  fishing: ["DESKTOP FISH", "IDLE"],
};

const chrome: Record<ScreenTheme, { background: number; header: number; accent: number }> = {
  dashboard: { background: 0x06171b, header: 0x103b42, accent: 0x5be3d7 },
  api: { background: 0x09151b, header: 0x182c36, accent: 0x63e990 },
  moba: { background: 0x102419, header: 0x244f38, accent: 0xe7c85e },
  shooter: { background: 0x17140f, header: 0x443625, accent: 0xf1c55d },
  video: { background: 0x111622, header: 0x29334b, accent: 0xef5d5d },
  download: { background: 0x0b1d26, header: 0x164156, accent: 0x61d7f2 },
  rank: { background: 0x15120c, header: 0x3f2d15, accent: 0xf3b43f },
  card: { background: 0x10311f, header: 0x245638, accent: 0xf2e3bb },
  afk: { background: 0x090a19, header: 0x242247, accent: 0xb28af4 },
  fishing: { background: 0x173b52, header: 0x2c6c83, accent: 0xf0d26f },
};

export class LayeredScreen {
  readonly view: SimplePlane;

  private readonly texture: RenderTexture;
  private readonly scene = new Container();
  private readonly pixels = new Graphics();
  private readonly title: Text;
  private readonly status: Text;
  private lastRender = -Infinity;
  private officeEvent: OfficeEventType | null = null;

  constructor(
    private readonly renderer: IRenderer,
    private readonly theme: ScreenTheme,
    quad: [Point, Point, Point, Point],
    private readonly stationIndex: number,
  ) {
    this.texture = RenderTexture.create({ width: SCREEN.width, height: SCREEN.height, resolution: 1 });
    this.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    this.title = this.makeText(13, 0xf2f0d8);
    this.status = this.makeText(10, chrome[theme].accent);
    this.title.position.set(13, 10);
    this.status.position.set(28, 218);
    this.scene.addChild(this.pixels, this.title, this.status);
    this.view = this.warpScreen(quad);
  }

  update(elapsedMs: number): void {
    if (elapsedMs - this.lastRender < SCREEN_REFRESH_MS) return;
    this.lastRender = elapsedMs;
    this.view.alpha = this.officeEvent === "outage"
      ? (Math.floor(elapsedMs / 180) % 3 === 0 ? 0.42 : 0.78)
      : 1;
    this.pixels.clear();
    this.drawBase(elapsedMs);
    switch (this.theme) {
      case "dashboard":
        this.drawDashboard(elapsedMs);
        break;
      case "api":
        this.drawApi(elapsedMs);
        break;
      case "moba":
        this.drawMoba(elapsedMs);
        break;
      case "shooter":
        this.drawShooter(elapsedMs);
        break;
      case "video":
        this.drawVideo(elapsedMs);
        break;
      case "download":
        this.drawDownload(elapsedMs);
        break;
      case "rank":
        this.drawRank(elapsedMs);
        break;
      case "card":
        this.drawCards(elapsedMs);
        break;
      case "afk":
        this.drawAfk(elapsedMs);
        break;
      case "fishing":
        this.drawFishing(elapsedMs);
        break;
    }
    this.drawCrtOverlay(elapsedMs);
    this.renderer.render(this.scene, { renderTexture: this.texture, clear: true });
  }

  setOfficeEvent(event: OfficeEventType | null): void {
    this.officeEvent = event;
  }

  destroy(): void {
    this.scene.destroy({ children: true });
    this.texture.destroy(true);
  }

  private makeText(size: number, fill: number): Text {
    return new Text(
      "",
      new TextStyle({
        fontFamily: "Consolas, monospace",
        fontSize: size,
        fontWeight: "bold",
        fill,
        letterSpacing: 0,
      }),
    );
  }

  private drawBase(elapsedMs: number): void {
    const style = chrome[this.theme];
    const [title, status] = labels[this.theme];
    this.title.text = title;
    this.status.text = status;
    this.status.style.fill = style.accent;
    this.fillRect(0, 0, SCREEN.width, SCREEN.height, style.background);
    this.fillRect(0, 0, SCREEN.width, 34, style.header);
    const pulse = Math.floor(elapsedMs / 360) % 2 === 0;
    this.fillRect(265, 10, 14, 8, pulse ? style.accent : 0x33464a);
    this.fillRect(284, 10, 20, 8, 0x25373b);
    this.fillRect(287, 12, 12, 4, style.accent, pulse ? 0.85 : 0.35);
    this.fillRect(0, 210, SCREEN.width, 30, 0x080d10);
    this.fillRect(6, 216, 16, 16, style.accent);
    this.fillRect(9, 219, 4, 4, 0x081015);
    this.fillRect(15, 225, 4, 4, 0x081015);
    const activeApp = (Math.floor(elapsedMs / 800) + this.stationIndex) % 4;
    const appColors = [0x4bc9e9, 0x62e78d, 0xf0be4b, 0xe8635b];
    for (let index = 0; index < 4; index += 1) {
      this.fillRect(196 + index * 22, 217, 15, 14, index === activeApp ? appColors[index] : 0x293b42);
    }
    this.fillRect(291, 218, 20, 3, style.accent);
    this.fillRect(291, 224, 13, 3, 0x5f7479);
    this.fillRect(291, 230, 17, 2, 0x3d5157);
  }

  private drawDashboard(elapsedMs: number): void {
    const phase = Math.floor(elapsedMs / 150) + this.stationIndex * 3;
    const colors = [0x63e990, 0x5bc8ff, 0xf3b43f];
    for (let index = 0; index < 3; index += 1) {
      const x = 10 + index * 101;
      this.frame(x, 42, 94, 40, 0x0d2a31, 0x26525c);
      this.fillRect(x + 8, 50, 12, 12, colors[index]);
      this.fillRect(x + 27, 49, 43 + ((phase + index * 11) % 28), 5, 0xd9eee8);
      this.fillRect(x + 27, 61, 29 + ((phase * 3 + index * 9) % 35), 4, colors[index]);
      this.fillRect(x + 8, 70, 71, 3, 0x173f47);
      this.fillRect(x + 8, 70, 24 + ((phase * 5 + index * 17) % 48), 3, colors[index]);
    }

    this.frame(10, 90, 197, 111, 0x0a2026, 0x28515b);
    for (let y = 112; y < 194; y += 20) this.fillRect(18, y, 180, 1, 0x17383f);
    for (let x = 42; x < 200; x += 32) this.fillRect(x, 98, 1, 94, 0x17383f);
    const linePoints: Array<[number, number]> = [];
    for (let index = 0; index < 12; index += 1) {
      const x = 18 + index * 16;
      const y = 178 - ((index * 23 + phase * 7 + (index % 3) * 11) % 68);
      linePoints.push([x, y]);
      this.fillRect(x - 2, y - 2, 5, 5, index % 3 === 0 ? 0xf3b43f : 0x63e990);
    }
    this.polyline(linePoints, 0x63e990, 3);

    this.frame(215, 90, 95, 111, 0x0d252a, 0x28515b);
    for (let row = 0; row < 5; row += 1) {
      const color = colors[row % colors.length];
      this.fillRect(224, 101 + row * 19, 9, 9, color);
      this.fillRect(239, 102 + row * 19, 57, 4, 0x42636a);
      this.fillRect(239, 109 + row * 19, 22 + ((phase * 4 + row * 13) % 53), 4, color);
    }
  }

  private drawApi(elapsedMs: number): void {
    const phase = Math.floor(elapsedMs / 180) + this.stationIndex;
    this.frame(8, 42, 58, 160, 0x0c2027, 0x2b4650);
    this.fillRect(15, 50, 10, 10, 0x5bc8ff);
    this.fillRect(31, 52, 26, 4, 0x789097);
    for (let row = 0; row < 7; row += 1) {
      const indent = row % 3 === 0 ? 8 : row % 2 === 0 ? 16 : 12;
      this.fillRect(14 + indent, 70 + row * 17, 6, 6, row === phase % 7 ? 0x63e990 : 0x48626a);
      this.fillRect(24 + indent, 71 + row * 17, 21 + (row % 3) * 4, 3, 0x789097);
    }

    this.frame(70, 42, 242, 160, 0x071217, 0x2b4650);
    this.fillRect(70, 42, 242, 20, 0x152832);
    this.fillRect(78, 49, 45, 5, 0x8aa2a9);
    this.fillRect(130, 49, 32, 5, 0x4e6971);
    const syntax = [0x5bc8ff, 0xf3b43f, 0x63e990, 0xd58bec, 0xe7e0c5];
    for (let row = 0; row < 9; row += 1) {
      const y = 69 + row * 14;
      if (row === phase % 9) this.fillRect(75, y - 2, 230, 12, 0x102a31);
      this.fillRect(78, y, 8, 4, 0x38545c);
      this.fillRect(92, y, 16 + (row % 4) * 5, 4, syntax[row % syntax.length]);
      this.fillRect(114 + (row % 4) * 5, y, 31 + ((row * 17 + phase * 3) % 71), 4, syntax[(row + 2) % syntax.length]);
      if (row % 3 === 0) this.fillRect(208, y, 34, 4, 0x67828a);
    }
    if (phase % 2 === 0) this.fillRect(180, 181, 3, 11, 0xe9f6d8);
    this.fillRect(304, 65, 3, 124, 0x263c43);
    this.fillRect(304, 82 + (phase % 5) * 13, 3, 27, 0x5f7b82);
  }

  private drawMoba(elapsedMs: number): void {
    const phase = elapsedMs / 230;
    this.frame(8, 40, 304, 164, 0x173923, 0x4d6f46);
    this.fillRect(15, 47, 290, 150, 0x1c4528);
    this.pixels.lineStyle(0);
    this.pixels.beginFill(0x27647c);
    this.pixels.drawPolygon([122, 47, 181, 47, 132, 197, 73, 197]);
    this.pixels.endFill();
    this.polyline([[27, 181], [290, 59]], 0x8c8757, 7);
    this.polyline([[29, 60], [289, 181]], 0x8c8757, 6);
    this.polyline([[27, 181], [27, 60], [289, 60]], 0x77774e, 5);
    this.fillRect(19, 169, 23, 22, 0x3a9ed8);
    this.fillRect(278, 50, 23, 22, 0xd5544c);
    for (let index = 0; index < 3; index += 1) {
      this.fillRect(60 + index * 55, 148 - index * 27, 9, 14, 0x62bce7);
      this.fillRect(246 - index * 55, 79 + index * 27, 9, 14, 0xe16a5e);
    }
    for (let index = 0; index < 12; index += 1) {
      const team = index < 6;
      const x = 48 + ((index * 37 + Math.sin(phase + index) * 12 + 240) % 232);
      const y = 65 + ((index * 23 + Math.cos(phase * 0.8 + index) * 9 + 100) % 104);
      this.fillRect(Math.round(x), Math.round(y), team ? 7 : 6, team ? 7 : 6, team ? 0x57cfff : 0xef6c5a);
      this.fillRect(Math.round(x), Math.round(y) - 4, team ? 13 : 11, 2, team ? 0x69ddff : 0xff8e7e);
    }
    for (let index = 0; index < 4; index += 1) {
      this.frame(115 + index * 27, 170, 22, 22, index === Math.floor(phase) % 4 ? 0xd9a943 : 0x273523, 0xd7c56f);
    }
  }

  private drawShooter(elapsedMs: number): void {
    const phase = Math.floor(elapsedMs / 110) + this.stationIndex;
    this.frame(8, 40, 304, 164, 0x67543b, 0xb69a6e);
    this.fillRect(15, 47, 290, 57, 0x8f774e);
    this.fillRect(15, 104, 290, 93, 0x6f5b42);
    this.pixels.lineStyle(0);
    this.pixels.beginFill(0x313941);
    this.pixels.drawPolygon([15, 47, 92, 91, 92, 197, 15, 197]);
    this.pixels.drawPolygon([305, 47, 228, 91, 228, 197, 305, 197]);
    this.pixels.endFill();
    this.fillRect(103, 85, 114, 112, 0xa78d66);
    this.fillRect(135, 92, 50, 87, 0x242a2c);
    this.fillRect(29, 126, 55, 48, 0x806740);
    this.fillRect(37, 134, 39, 32, 0x9d8458);
    this.polyline([[92, 197], [143, 118]], 0x9b8666, 2);
    this.polyline([[228, 197], [177, 118]], 0x9b8666, 2);
    this.pixels.lineStyle(3, 0xf4dc85, 1);
    this.pixels.moveTo(148, 137).lineTo(172, 137);
    this.pixels.moveTo(160, 125).lineTo(160, 149);
    if (phase % 5 === 0) this.fillRect(174, 130, 19, 14, 0xffcf58);
    this.pixels.lineStyle(0);
    this.pixels.beginFill(0x263139);
    this.pixels.drawPolygon([203, 197, 229, 155, 281, 166, 301, 197]);
    this.pixels.endFill();
    this.fillRect(216, 166, 42, 8, 0x11191e);
    this.fillRect(21, 181, 50, 7, 0x152126);
    this.fillRect(21, 181, 43, 7, 0x63e990);
    this.fillRect(244, 55, 53, 6, 0x182126);
    this.fillRect(256, 66, 41, 5, phase % 3 === 0 ? 0xef6c5a : 0xd7c99e);
  }

  private drawVideo(elapsedMs: number): void {
    const blink = Math.floor(elapsedMs / 440) % 2;
    const phase = Math.floor(elapsedMs / 180);
    this.frame(10, 42, 216, 160, 0x172633, 0x405467);
    this.fillRect(17, 49, 202, 125, 0x24445a);
    this.fillRect(17, 49, 202, 42, 0x31546b);
    this.fillRect(69, 72, 98, 93, 0x9a6748);
    this.fillRect(82, 61, 73, 36, 0x2c1c1a);
    this.fillRect(92, 98, 54, 45, 0xd6a47b);
    this.fillRect(99, 111, 10, blink ? 2 : 6, 0xf3ead6);
    this.fillRect(130, 111, 10, blink ? 2 : 6, 0xf3ead6);
    this.fillRect(113, 127, 15, 4, 0x8f3e42);
    this.fillRect(76, 145, 84, 20, 0x65436d);
    this.fillRect(23, 55, 28, 12, 0xe44e4e);
    this.fillRect(20, 181, 193, 5, 0x314957);
    this.fillRect(20, 181, 37 + (phase * 9) % 156, 5, 0xef5d5d);
    for (let index = 0; index < 12; index += 1) {
      const height = 3 + ((index * 7 + phase * 3) % 15);
      this.fillRect(26 + index * 9, 197 - height, 5, height, index % 2 ? 0x5bc8ff : 0x63e990);
    }

    this.frame(232, 42, 78, 160, 0x111c27, 0x405467);
    for (let row = 0; row < 6; row += 1) {
      this.fillRect(239, 50 + row * 24, 10, 10, [0xf3b43f, 0x5bc8ff, 0x63e990][row % 3]);
      this.fillRect(254, 50 + row * 24, 47, 4, 0x81909b);
      this.fillRect(254, 58 + row * 24, 24 + ((row * 11 + phase) % 22), 3, 0x40515e);
    }
  }

  private drawDownload(elapsedMs: number): void {
    const progress = (Math.floor(elapsedMs / 95) + this.stationIndex * 11) % 101;
    this.fillRect(8, 40, 304, 164, 0x12354a);
    this.frame(24, 51, 272, 140, 0xd9d0ae, 0x233a45);
    this.fillRect(24, 51, 272, 22, 0x245d78);
    this.fillRect(33, 59, 78, 5, 0xe3eadf);
    this.fillRect(45, 88, 45, 36, 0xe6b547);
    this.fillRect(51, 81, 23, 10, 0xf1c95e);
    this.fillRect(104, 86, 166, 5, 0x31464b);
    this.fillRect(104, 97, 114, 4, 0x607277);
    this.frame(42, 135, 236, 24, 0x5e655e, 0x26373c);
    for (let index = 0; index < 20; index += 1) {
      this.fillRect(47 + index * 11, 140, 8, 14, index * 5 <= progress ? 0x4fca87 : 0x7c8378);
    }
    this.fillRect(43, 169, 72, 6, 0x687679);
    this.fillRect(121, 169, 50, 6, 0x687679);
    this.fillRect(220, 165, 58, 15, 0x2d708d);
    this.status.text = `DOWNLOADING ${progress}%`;
  }

  private drawRank(elapsedMs: number): void {
    const pulse = Math.floor(elapsedMs / 310) % 5;
    const colors = [0xf3b43f, 0xcbd2d2, 0xc77c3d, 0x5bc8ff, 0x63e990];
    for (let index = 0; index < 5; index += 1) {
      const y = 43 + index * 32;
      this.frame(12, y, 296, 27, index === pulse ? 0x273a2c : 0x1b1a14, index === pulse ? 0x63e990 : 0x4c3a22);
      this.fillRect(19, y + 5, 17, 17, colors[index]);
      this.fillRect(24, y + 9, 7, 9, 0x24190e);
      this.fillRect(44, y + 6, 31, 5, 0xe5d7b0);
      this.fillRect(44, y + 16, 72 + (4 - index) * 20, 4, colors[index]);
      this.fillRect(225, y + 7, 65 - index * 7, 5, 0xe6c75e);
      this.fillRect(245, y + 16, 45 - index * 4, 4, 0x8e7c55);
    }
  }

  private drawCards(elapsedMs: number): void {
    const active = Math.floor(elapsedMs / 420) % 7;
    this.fillRect(8, 40, 304, 164, 0x175938);
    this.frame(18, 50, 24, 35, 0x1d3f2d, 0x87a28c);
    this.fillRect(51, 50, 24, 35, 0x284e38);
    for (let index = 0; index < 4; index += 1) {
      this.frame(181 + index * 31, 50, 24, 35, index < 2 ? 0xf2e7c8 : 0x1d3f2d, 0xc5b58c);
      if (index < 2) this.fillRect(188 + index * 31, 59, 10, 10, index ? 0x222933 : 0xc94d45);
    }
    for (let column = 0; column < 7; column += 1) {
      const x = 23 + column * 40;
      for (let row = 0; row <= Math.min(column, 3); row += 1) {
        const y = 103 + row * 20 - (column === active ? 8 : 0);
        this.frame(x, y, 27, 40, 0xf2e7c8, 0x2c332e);
        this.fillRect(x + 6, y + 7, 9, 9, (column + row) % 2 ? 0xcc5149 : 0x222933);
      }
    }
  }

  private drawAfk(elapsedMs: number): void {
    const tick = Math.floor(elapsedMs / 36) + this.stationIndex * 17;
    this.fillRect(8, 40, 304, 164, 0x070817);
    for (let index = 0; index < 24; index += 1) {
      const x = 14 + ((index * 71 + tick) % 290);
      const y = 46 + ((index * 43 + Math.floor(tick / 2)) % 151);
      this.fillRect(x, y, index % 5 === 0 ? 3 : 2, index % 5 === 0 ? 3 : 2, index % 3 === 0 ? 0xbda0ff : 0x6172b9);
    }
    const x = 28 + (tick % 216);
    const y = 75 + Math.round(Math.sin(elapsedMs / 420) * 42);
    this.frame(x, y, 66, 39, 0x513e96, 0xbba3ff);
    this.fillRect(x + 10, y + 9, 11, 20, 0xe6cb58);
    this.fillRect(x + 25, y + 9, 31, 5, 0xe3ddf3);
    this.fillRect(x + 25, y + 19, 22, 4, 0x92e5ee);
    this.fillRect(x + 25, y + 27, 27, 3, 0x7c72bb);
    this.status.text = "AWAY · AUTO LOCK";
  }

  private drawFishing(elapsedMs: number): void {
    const wave = Math.floor(elapsedMs / 170) % 8;
    this.fillRect(8, 40, 304, 164, 0x67b3cd);
    this.fillRect(8, 123, 304, 81, 0x347fa4);
    this.fillRect(32, 61, 34, 8, 0xd4e6d2);
    this.fillRect(43, 54, 24, 8, 0xd4e6d2);
    this.fillRect(255, 55, 22, 22, 0xf0cf66);
    this.pixels.lineStyle(0);
    this.pixels.beginFill(0x3f7556);
    this.pixels.drawPolygon([8, 123, 56, 84, 111, 123]);
    this.pixels.drawPolygon([76, 123, 151, 74, 223, 123]);
    this.pixels.drawPolygon([176, 123, 247, 88, 312, 123]);
    this.pixels.endFill();
    for (let y = 137; y < 196; y += 17) this.fillRect(14 + ((wave + y) % 13), y, 286, 3, 0x70c3d6, 0.65);
    this.fillRect(221, 104, 91, 9, 0x6c492d);
    this.fillRect(235, 113, 7, 54, 0x503722);
    this.fillRect(281, 113, 7, 54, 0x503722);
    this.fillRect(255, 82, 14, 28, 0x3a2b28);
    this.fillRect(250, 76, 22, 13, 0xd5a26e);
    this.polyline([[263, 91], [185, 143 + wave]], 0xf0dfb0, 2);
    this.fillRect(181, 139 + wave, 8, 13, 0xef6554);
    const fishX = 62 + ((wave * 27 + this.stationIndex * 19) % 120);
    this.fillRect(fishX, 166, 25, 9, 0xf0c45c);
    this.pixels.lineStyle(0);
    this.pixels.beginFill(0xf0c45c);
    this.pixels.drawPolygon([fishX, 170, fishX - 10, 162, fishX - 10, 178]);
    this.pixels.endFill();
  }

  private drawCrtOverlay(elapsedMs: number): void {
    const offset = (Math.floor(elapsedMs / 120) + this.stationIndex) % 4;
    for (let y = 36 + offset; y < 208; y += 4) this.fillRect(0, y, SCREEN.width, 1, 0xa7fff0, 0.045);
    this.fillRect(0, 36, 4, 172, 0x9ffff0, 0.035);
    this.fillRect(316, 36, 4, 172, 0x000000, 0.12);
  }

  private fillRect(x: number, y: number, width: number, height: number, color: number, alpha = 1): void {
    this.pixels.lineStyle(0);
    this.pixels.beginFill(color, alpha);
    this.pixels.drawRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    this.pixels.endFill();
  }

  private frame(x: number, y: number, width: number, height: number, fill: number, border: number): void {
    this.fillRect(x, y, width, height, fill);
    this.pixels.lineStyle(2, border, 1);
    this.pixels.drawRect(x, y, width, height);
  }

  private polyline(points: Array<[number, number]>, color: number, width: number): void {
    if (points.length < 2) return;
    this.pixels.lineStyle(width, color, 1);
    this.pixels.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) {
      this.pixels.lineTo(points[index][0], points[index][1]);
    }
  }

  private warpScreen(quad: [Point, Point, Point, Point]): SimplePlane {
    const columns = 9;
    const rows = 7;
    const plane = new SimplePlane(this.texture, columns, rows);
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
}
