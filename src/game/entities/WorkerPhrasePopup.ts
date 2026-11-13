import { WORLD } from "../constants";

/** DOM text stays readable when the pixel scene is scaled down on a phone. */
export class WorkerPhrasePopup {
  private readonly element = document.createElement("div");
  private readonly observer: ResizeObserver;
  private readonly startMs = performance.now();
  private readonly durationMs = 4200;

  constructor(
    text: string,
    private readonly x: number,
    private readonly y: number,
    private readonly mount: HTMLElement,
  ) {
    this.element.className = "worker-phrase";
    this.element.textContent = text;
    this.element.setAttribute("role", "status");
    mount.append(this.element);
    this.observer = new ResizeObserver(() => this.place());
    this.observer.observe(mount);
    this.place();
  }

  update(elapsedMs: number): boolean {
    const age = elapsedMs - this.startMs;
    this.element.classList.toggle("is-leaving", age > this.durationMs - 180);
    return age < this.durationMs;
  }

  destroy(): void {
    this.observer.disconnect();
    this.element.remove();
  }

  private place(): void {
    const { width, height } = this.mount.getBoundingClientRect();
    if (!width || !height) return;
    const anchorX = this.x / WORLD.width * width;
    const anchorY = this.y / WORLD.height * height;
    const bubbleWidth = this.element.offsetWidth;
    const bubbleHeight = this.element.offsetHeight;
    const left = Math.max(12, Math.min(width - bubbleWidth - 12, anchorX - bubbleWidth / 2));
    const above = anchorY - bubbleHeight - 14 >= 12;
    const top = above ? anchorY - bubbleHeight - 14 : Math.min(height - bubbleHeight - 12, anchorY + 14);
    this.element.style.left = `${left}px`;
    this.element.style.top = `${Math.max(12, top)}px`;
    this.element.dataset.side = above ? "above" : "below";
    this.element.style.setProperty("--phrase-tail", `${Math.max(14, Math.min(bubbleWidth - 14, anchorX - left))}px`);
  }
}
