import { AnimatedSprite, Container, Graphics, Rectangle, Text } from "pixi.js";
import { FRAME } from "../constants";
import { pixelText } from "../rendering/pixelText";
import { texturesFromHorizontalSheet } from "../rendering/spriteSheet";

const phrases = ["本周 token 冲起来!", "别摸鱼, 前三有券!", "报告呢? 周榜呢?", "牛马也要有梦想!"];

export class CowBoss extends Container {
  private readonly sprite: AnimatedSprite;
  private readonly hitFx: AnimatedSprite;
  private readonly bubble = new Graphics();
  private readonly bubbleText: Text;
  private hitUntil = 0;
  private hits = 0;

  constructor(bossSheet: string, hitSheet: string, private readonly onHit: (hits: number) => void) {
    super();
    this.position.set(FRAME.boss.x, FRAME.boss.y);

    this.bubbleText = pixelText(phrases[0], 12, 0x0b0805);
    this.bubbleText.position.set(-28, -44);

    this.sprite = new AnimatedSprite(texturesFromHorizontalSheet(bossSheet, FRAME.boss.width, FRAME.boss.height, FRAME.boss.frames));
    this.sprite.position.set(0, 0);
    this.sprite.width = FRAME.boss.width;
    this.sprite.height = FRAME.boss.height;
    this.sprite.animationSpeed = 0.09;
    this.sprite.play();

    this.hitFx = new AnimatedSprite(texturesFromHorizontalSheet(hitSheet, FRAME.bossFx.width, FRAME.bossFx.height, FRAME.bossFx.frames));
    this.hitFx.position.set(104, -10);
    this.hitFx.width = FRAME.bossFx.width;
    this.hitFx.height = FRAME.bossFx.height;
    this.hitFx.animationSpeed = 0.32;
    this.hitFx.visible = false;
    this.hitFx.play();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(0, 0, FRAME.boss.width, FRAME.boss.height);
    this.on("pointertap", () => this.hit());

    this.addChild(this.bubble, this.bubbleText, this.sprite, this.hitFx);
    this.drawBubble();
  }

  update(elapsedMs: number): void {
    const phraseIndex = this.hitUntil > elapsedMs ? this.hits % phrases.length : Math.floor(elapsedMs / 2600) % phrases.length;
    this.bubbleText.text = phrases[phraseIndex];
    this.bubble.y = Math.round(Math.sin(elapsedMs / 420) * 2);
    this.bubbleText.y = -44 + this.bubble.y;
    this.hitFx.visible = this.hitUntil > elapsedMs;
    this.sprite.x = this.hitUntil > elapsedMs ? Math.round(Math.sin(elapsedMs / 18) * 8) : 0;
  }

  private hit(): void {
    this.hits += 1;
    this.hitUntil = performance.now() + 720;
    this.onHit(this.hits);
  }

  private drawBubble(): void {
    this.bubble.beginFill(0xffe086);
    this.bubble.drawRect(-42, -56, 220, 46);
    this.bubble.endFill();
    this.bubble.lineStyle(4, 0x0b0805, 1);
    this.bubble.drawRect(-42, -56, 220, 46);
    this.bubble.beginFill(0xffe086);
    this.bubble.drawRect(56, -12, 14, 12);
    this.bubble.endFill();
  }
}
