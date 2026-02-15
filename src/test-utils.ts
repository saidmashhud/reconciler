import { render, flushSync, __resetForTests } from "./reconciler.js";
import type { ReconcilerElement } from "./types.js";

export function makeContainer(): HTMLDivElement {
  const div = document.createElement("div");
  document.body.appendChild(div);
  return div;
}

export function mount(element: ReconcilerElement, container: HTMLElement): void {
  render(element, container);
  flushSync();
}

export function reset(): void {
  __resetForTests();
  document.body.innerHTML = "";
}
