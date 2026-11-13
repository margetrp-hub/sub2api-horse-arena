import { AnimatedSprite, BaseTexture, Container, Rectangle, SCALE_MODES, Texture } from "pixi.js";
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
  private hitUntil = 0;
  private hits = 0;
  private hitting = false;
  private lastHitAt = -Infinity;
  private nextPhraseAt = 0;

  constructor(asset: CharacterAsset, private readonly onHit: (hits: number) => void, private readonly onSpeak: (text: string) => void) {
    super();
    this.position.set(686, 62);
    const source = this.textures(asset);
    this.idleTextures = idleOrder.map((index) => source[index % source.length]);
    this.hitTexture = source[7 % source.length];
    this.sprite = new AnimatedSprite(this.idleTextures);
    this.sprite.scale.set(0.58);
    this.sprite.animationSpeed = 3.2 / 60;
    this.sprite.autoUpdate = false;
    this.sprite.gotoAndStop(0);
    this.sprite.eventMode = "static";
    this.sprite.cursor = "pointer";
    this.sprite.hitArea = new Rectangle(60, 55, 330, 370);
    this.sprite.on("pointertap", () => this.hit());

    this.addChild(this.sprite);
  }

  update(elapsedMs: number, reducedMotion = false): void {
    const isHit = elapsedMs < this.hitUntil;
    if (isHit !== this.hitting) {
      this.hitting = isHit;
      if (isHit) {
        this.sprite.stop();
        this.sprite.texture = this.hitTexture;
      } else {
        this.sprite.textures = this.idleTextures;
        this.sprite.gotoAndStop(0);
      }
    }
    this.sprite.x = isHit && !reducedMotion ? Math.round(Math.sin(elapsedMs / 35) * 4) : 0;
    if (!isHit) this.sprite.gotoAndStop(reducedMotion ? 0 : Math.floor(elapsedMs / 320) % this.idleTextures.length);
    if (!this.nextPhraseAt) this.nextPhraseAt = elapsedMs + 18000;
    if (!reducedMotion && elapsedMs >= this.nextPhraseAt) {
      this.nextPhraseAt = elapsedMs + 24000;
      this.onSpeak(phrases[Math.floor(elapsedMs / 24000) % phrases.length]);
    }
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
    this.onSpeak(hitPhrases[this.hits % hitPhrases.length]);
    this.onHit(this.hits);
  }

}
