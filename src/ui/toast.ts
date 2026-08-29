export class Toast {
  private timer = 0;

  constructor(private readonly element: HTMLElement) {}

  show(message: string): void {
    this.element.textContent = message;
    this.element.classList.add("is-showing");
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.element.classList.remove("is-showing");
    }, 2200);
  }
}
