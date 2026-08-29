import { AnimatedSprite, BaseTexture, Container, Graphics, Rectangle, SCALE_MODES, Text, Texture } from "pixi.js";
import { pixelText } from "../rendering/pixelText";
import type { CharacterAsset } from "../stationManifest";

const idleOrder = [0, 1, 0, 3, 0, 2, 4, 6, 1, 0];
const phrases = [
  "本周 token 冲起来!",
  "别摸鱼, 排行榜看着呢!",
  "谁把日报写成段子了?",
  "服务器没睡, 你们也别睡!",
  "工位都给我亮起来!",
];
const hitPhrases = ["谁动我墨镜了?!", "老板也是有血条的!", "扣你绩效...算了!", "继续干活, 当没发生!"];

export class GeneratedCowBoss extends Container {
  private readonly sprite: AnimatedSprite;
  private readonly idleTextures: Texture[];
  private readonly hitTexture: Texture;
  private readonly bubble = new Graphics();
  private readonly bubbleText: Text;
  private hitUntil = 0;
  private hits = 0;
  private hitting = false;
  private lastHitAt = -Infinity;

  constructor(asset: CharacterAsset, private readonly onHit: (hits: number) => void) {
    super();
    this.position.set(686, 62);
    const source = this.textures(asset);
    this.idleTextures = idleOrder.map((index) => source[index % source.length]);
    this.hitTexture = source[7 % source.length];
    this.sprite = new AnimatedSprite(this.idleTextures);
    this.sprite.scale.set(0.58);
    this.sprite.animationSpeed = 3.2 / 60;
    this.sprite.play();
    this.sprite.eventMode = "static";
    this.sprite.cursor = "pointer";
    this.sprite.hitArea = new Rectangle(60, 55, 330, 370);
    this.sprite.on("pointertap", () => this.hit());

    this.bubbleText = pixelText(phrases[0], 14, 0x171109);
    this.bubbleText.position.set(281, 36);
    this.drawBubble();
    this.addChild(this.bubble, this.bubbleText, this.sprite);
  }

  update(elapsedMs: number): void {
    const isHit = elapsedMs < this.hitUntil;
    if (isHit !== this.hitting) {
      this.hitting = isHit;
      if (isHit) {
        this.sprite.stop();
        this.sprite.texture = this.hitTexture;
      } else {
        this.sprite.textures = this.idleTextures;
        this.sprite.play();
      }
    }
    this.sprite.x = isHit ? Math.round(Math.sin(elapsedMs / 17) * 9) : 0;
    const phraseSet = isHit ? hitPhrases : phrases;
    const phraseIndex = isHit ? this.hits % phraseSet.length : Math.floor(elapsedMs / 2800) % phraseSet.length;
    this.bubbleText.text = phraseSet[phraseIndex];
    const showBubble = isHit || elapsedMs % 5600 < 1900;
    this.bubble.visible = showBubble;
    this.bubbleText.visible = showBubble;
    const bob = Math.round(Math.sin(elapsedMs / 420) * 2);
    this.bubble.y = bob;
    this.bubbleText.y = 36 + bob;
  }

  private textures(asset: CharacterAsset): Texture[] {
    const [frameWidth, frameHeight] = asset.frameSize;
    const base = BaseTexture.from(asset.image);
    base.scaleMode = SCALE_MODES.NEAREST;
    return Array.from({ length: asset.frames }, (_, index) => {
      return new Texture(base, new Rectangle(index * frameWidth, 0, frameWidth, frameHeight));
    });
  }

  private hit(): void {
    const now = performance.now();
    if (now - this.lastHitAt < 260) return;
    this.lastHitAt = now;
    this.hits += 1;
    this.hitUntil = now + 1400;
    this.onHit(this.hits);
  }

  private drawBubble(): void {
    this.bubble.beginFill(0xffe6a4, 0.96);
    this.bubble.drawRect(268, 23, 226, 54);
    this.bubble.drawRect(250, 48, 18, 13);
    this.bubble.endFill();
    this.bubble.lineStyle(4, 0x171109, 1);
    this.bubble.drawRect(268, 23, 226, 54);
  }
}
