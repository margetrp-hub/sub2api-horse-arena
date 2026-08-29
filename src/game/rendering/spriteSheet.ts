import { BaseTexture, Rectangle, SCALE_MODES, Texture } from "pixi.js";

export function texturesFromHorizontalSheet(src: string, frameWidth: number, frameHeight: number, frames: number): Texture[] {
  const base = BaseTexture.from(src);
  base.scaleMode = SCALE_MODES.NEAREST;
  return Array.from({ length: frames }, (_, index) => {
    return new Texture(base, new Rectangle(index * frameWidth, 0, frameWidth, frameHeight));
  });
}
