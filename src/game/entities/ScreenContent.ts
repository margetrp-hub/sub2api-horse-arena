import { AnimatedSprite, Container } from "pixi.js";
import type { ScreenTheme } from "../../types";
import { ASSETS, FRAME } from "../constants";
import { texturesFromHorizontalSheet } from "../rendering/spriteSheet";

export class ScreenContent extends Container {
  private readonly sprite: AnimatedSprite;

  constructor(theme: ScreenTheme) {
    super();
    this.sprite = new AnimatedSprite(
      texturesFromHorizontalSheet(
        ASSETS.screenSheets[theme],
        FRAME.screenSheet.width,
        FRAME.screenSheet.height,
        FRAME.screenSheet.frames,
      ),
    );
    this.sprite.width = FRAME.screen.width;
    this.sprite.height = FRAME.screen.height;
    this.sprite.animationSpeed = 0.16;
    this.sprite.play();
    this.addChild(this.sprite);
  }

  update(_elapsedMs: number, _stationIndex: number): void {
    // AnimatedSprite advances from the shared Pixi ticker.
  }
}
