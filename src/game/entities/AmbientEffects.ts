import { AnimatedSprite, Container, SCALE_MODES } from "pixi.js";
import { ASSETS, FRAME } from "../constants";
import { texturesFromHorizontalSheet } from "../rendering/spriteSheet";

function animatedSheet(
  source: string,
  width: number,
  height: number,
  speed: number,
): AnimatedSprite {
  const sprite = new AnimatedSprite(texturesFromHorizontalSheet(source, width, height, 12));
  sprite.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
  sprite.animationSpeed = speed;
  sprite.autoUpdate = false;
  sprite.gotoAndStop(0);
  return sprite;
}

export class AmbientEffects extends Container {
  private readonly dust: AnimatedSprite[] = [];

  constructor() {
    super();

    const sign = animatedSheet(
      ASSETS.ambient.signGlint,
      FRAME.ambient.signGlint.width,
      FRAME.ambient.signGlint.height,
      0.12,
    );
    sign.position.set(86, 42);
    sign.width = 402;
    sign.height = 106;
    sign.alpha = 0.72;

    const fan = animatedSheet(
      ASSETS.ambient.fanMotion,
      FRAME.ambient.fanMotion.width,
      FRAME.ambient.fanMotion.height,
      0.16,
    );
    fan.position.set(408, 20);
    fan.width = 138;
    fan.height = 138;
    fan.alpha = 0.8;

    const dustLeft = this.makeDust(10, 244, 640, 360, 0);
    const dustRight = this.makeDust(632, 330, 640, 360, 5);
    this.dust.push(dustLeft, dustRight);
    this.addChild(sign, fan, dustLeft, dustRight);
  }

  update(elapsedMs: number): void {
    for (const child of this.children) {
      const sprite = child as AnimatedSprite;
      sprite.gotoAndStop(Math.floor(elapsedMs * sprite.animationSpeed * 60 / 1000) % sprite.totalFrames);
    }
    this.dust.forEach((sprite, index) => {
      sprite.alpha = 0.16 + Math.sin(elapsedMs / 1300 + index * 1.7) * 0.04;
      sprite.x = (index === 0 ? 10 : 632) + Math.sin(elapsedMs / 1700 + index) * 2;
    });
  }

  private makeDust(
    x: number,
    y: number,
    width: number,
    height: number,
    startFrame: number,
  ): AnimatedSprite {
    const sprite = animatedSheet(
      ASSETS.ambient.roomDust,
      FRAME.ambient.roomDust.width,
      FRAME.ambient.roomDust.height,
      0.08,
    );
    sprite.position.set(x, y);
    sprite.width = width;
    sprite.height = height;
    sprite.alpha = 0.16;
    sprite.gotoAndStop(startFrame);
    return sprite;
  }
}
