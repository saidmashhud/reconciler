import { describe, it, expect, beforeEach } from "vitest";
import { useState, flushSync } from "./index.js";
import { makeContainer, mount, reset } from "./test-utils.js";

type Item = { id: number; text: string };

describe("keyed reconciliation", () => {
  beforeEach(reset);

  function setupList(initial: Item[]) {
    let setItems!: (items: Item[]) => void;
    const List = () => {
      const [items, set] = useState(initial);
      setItems = set;
      return (
        <ul>
          {items.map((it) => (
            <li key={it.id} data-id={it.id}>
              {it.text}
            </li>
          ))}
        </ul>
      );
    };
    const container = makeContainer();
    mount(<List />, container);
    return { container, setItems: (i: Item[]) => setItems(i) };
  }

  it("reuses DOM nodes across a reorder (identity preserved)", () => {
    const { container, setItems } = setupList([
      { id: 1, text: "a" },
      { id: 2, text: "b" },
      { id: 3, text: "c" },
    ]);

    const before = new Map<string, Element>();
    container.querySelectorAll("li").forEach((li) => {
      before.set(li.getAttribute("data-id")!, li);
    });

    setItems([
      { id: 3, text: "c" },
      { id: 2, text: "b" },
      { id: 1, text: "a" },
    ]);
    flushSync();

    const after = container.querySelectorAll("li");
    expect(after.length).toBe(3);
    expect([...after].map((li) => li.getAttribute("data-id"))).toEqual([
      "3",
      "2",
      "1",
    ]);
    expect(after[0]).toBe(before.get("3"));
    expect(after[1]).toBe(before.get("2"));
    expect(after[2]).toBe(before.get("1"));
  });

  it("inserts a new keyed node without recreating existing ones", () => {
    const { container, setItems } = setupList([
      { id: 1, text: "a" },
      { id: 2, text: "b" },
    ]);
    const node1 = container.querySelector('[data-id="1"]')!;
    const node2 = container.querySelector('[data-id="2"]')!;

    setItems([
      { id: 1, text: "a" },
      { id: 3, text: "new" },
      { id: 2, text: "b" },
    ]);
    flushSync();

    const lis = container.querySelectorAll("li");
    expect([...lis].map((l) => l.getAttribute("data-id"))).toEqual([
      "1",
      "3",
      "2",
    ]);
    expect(container.querySelector('[data-id="1"]')).toBe(node1);
    expect(container.querySelector('[data-id="2"]')).toBe(node2);
    expect(container.querySelector('[data-id="3"]')!.textContent).toBe("new");
  });

  it("removes a keyed node and keeps the rest", () => {
    const { container, setItems } = setupList([
      { id: 1, text: "a" },
      { id: 2, text: "b" },
      { id: 3, text: "c" },
    ]);
    const node1 = container.querySelector('[data-id="1"]')!;
    const node3 = container.querySelector('[data-id="3"]')!;

    setItems([
      { id: 1, text: "a" },
      { id: 3, text: "c" },
    ]);
    flushSync();

    const lis = container.querySelectorAll("li");
    expect(lis.length).toBe(2);
    expect([...lis].map((l) => l.getAttribute("data-id"))).toEqual(["1", "3"]);
    expect(container.querySelector('[data-id="1"]')).toBe(node1);
    expect(container.querySelector('[data-id="3"]')).toBe(node3);
    expect(container.querySelector('[data-id="2"]')).toBeNull();
  });

  it("updates the text content of a reused keyed node", () => {
    const { container, setItems } = setupList([
      { id: 1, text: "a" },
      { id: 2, text: "b" },
    ]);
    const node2 = container.querySelector('[data-id="2"]')!;

    setItems([
      { id: 1, text: "a" },
      { id: 2, text: "updated" },
    ]);
    flushSync();

    expect(container.querySelector('[data-id="2"]')).toBe(node2);
    expect(node2.textContent).toBe("updated");
  });

  it("handles a full mix: reorder + insert + remove + update", () => {
    const { container, setItems } = setupList([
      { id: 1, text: "a" },
      { id: 2, text: "b" },
      { id: 3, text: "c" },
    ]);
    const node1 = container.querySelector('[data-id="1"]')!;
    const node3 = container.querySelector('[data-id="3"]')!;

    setItems([
      { id: 3, text: "C!" },
      { id: 4, text: "d" },
      { id: 1, text: "a" },
    ]);
    flushSync();

    const lis = container.querySelectorAll("li");
    expect([...lis].map((l) => l.getAttribute("data-id"))).toEqual([
      "3",
      "4",
      "1",
    ]);
    expect(container.querySelector('[data-id="3"]')).toBe(node3);
    expect(container.querySelector('[data-id="1"]')).toBe(node1);
    expect(container.querySelector('[data-id="3"]')!.textContent).toBe("C!");
    expect(container.querySelector('[data-id="2"]')).toBeNull();
  });
});
