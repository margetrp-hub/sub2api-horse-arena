import { createElement, type IconNode } from "lucide";

export function icon(node: IconNode): string {
  return createElement(node, { width: 20, height: 20, "stroke-width": 1.8, "aria-hidden": "true" }).outerHTML;
}
