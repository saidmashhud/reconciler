import { describe, it, expect, beforeEach } from "vitest";
import { render } from "./reconciler.js";
import { createElement } from "./element.js";
import { __resetForTests } from "./reconciler.js";
import type { ReconcilerElement } from "./types.js";

describe("cooperative scheduler (async work loop)", () => {
  beforeEach(() => {
    __resetForTests();
    document.body.innerHTML = "";
  });

  it("commits a large tree across time slices without flushSync", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const children: ReconcilerElement[] = [];
    for (let i = 0; i < 500; i++) {
      children.push(createElement("li", { key: i }, `item ${i}`));
    }
    const tree = createElement("ul", { id: "big" }, ...children);

    render(tree, container);

    await new Promise<void>((resolve) => {
      const check = () => {
        const ul = container.querySelector("#big");
        if (ul && ul.children.length === 500) resolve();
        else setTimeout(check, 0);
      };
      check();
    });

    const ul = container.querySelector("#big")!;
    expect(ul.children.length).toBe(500);
    expect(ul.firstElementChild!.textContent).toBe("item 0");
    expect(ul.lastElementChild!.textContent).toBe("item 499");
  });
});
