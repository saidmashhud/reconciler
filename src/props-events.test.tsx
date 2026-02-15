import { describe, it, expect, beforeEach } from "vitest";
import { useState, flushSync } from "./index.js";
import { makeContainer, mount, reset } from "./test-utils.js";

describe("props, attributes & events", () => {
  beforeEach(reset);

  it("attaches and fires an onClick handler that updates state", () => {
    const Counter = () => {
      const [n, set] = useState(0);
      return <button onClick={() => set((p) => p + 1)}>{n}</button>;
    };
    const container = makeContainer();
    mount(<Counter />, container);
    const btn = container.querySelector("button")!;
    expect(btn.textContent).toBe("0");

    btn.dispatchEvent(new Event("click"));
    flushSync();
    expect(btn.textContent).toBe("1");

    btn.dispatchEvent(new Event("click"));
    flushSync();
    expect(btn.textContent).toBe("2");
  });

  it("removes an event handler when it is no longer present", () => {
    let calls = 0;
    let setOn!: (b: boolean) => void;
    const App = () => {
      const [on, s] = useState(true);
      setOn = s;
      return on ? (
        <button onClick={() => calls++}>x</button>
      ) : (
        <button>x</button>
      );
    };
    const container = makeContainer();
    mount(<App />, container);
    const btn = container.querySelector("button")!;
    btn.dispatchEvent(new Event("click"));
    expect(calls).toBe(1);

    setOn(false);
    flushSync();
    container.querySelector("button")!.dispatchEvent(new Event("click"));
    expect(calls).toBe(1);
  });

  it("updates a changed handler identity", () => {
    const log: string[] = [];
    let setMode!: (m: string) => void;
    const App = () => {
      const [mode, s] = useState("a");
      setMode = s;
      return <button onClick={() => log.push(mode)}>{mode}</button>;
    };
    const container = makeContainer();
    mount(<App />, container);
    container.querySelector("button")!.dispatchEvent(new Event("click"));
    expect(log).toEqual(["a"]);

    setMode("b");
    flushSync();
    container.querySelector("button")!.dispatchEvent(new Event("click"));
    expect(log).toEqual(["a", "b"]);
  });

  it("adds, changes and removes attributes", () => {
    let setStep!: (n: number) => void;
    const App = () => {
      const [step, s] = useState(0);
      setStep = s;
      if (step === 0) return <div id="x" title="first" />;
      if (step === 1) return <div id="x" title="second" data-flag="on" />;
      return <div id="x" />;
    };
    const container = makeContainer();
    mount(<App />, container);
    let el = container.querySelector("#x")!;
    expect(el.getAttribute("title")).toBe("first");

    setStep(1);
    flushSync();
    el = container.querySelector("#x")!;
    expect(el.getAttribute("title")).toBe("second");
    expect(el.getAttribute("data-flag")).toBe("on");

    setStep(2);
    flushSync();
    el = container.querySelector("#x")!;
    expect(el.getAttribute("title")).toBeNull();
    expect(el.getAttribute("data-flag")).toBeNull();
  });

  it("applies style objects", () => {
    const container = makeContainer();
    mount(<div id="s" style={{ color: "red" }} />, container);
    const el = container.querySelector("#s") as HTMLElement;
    expect(el.style.color).toBe("red");
  });

  it("sets boolean DOM properties (checked) live", () => {
    let setChecked!: (b: boolean) => void;
    const App = () => {
      const [checked, s] = useState(true);
      setChecked = s;
      return <input type="checkbox" checked={checked} />;
    };
    const container = makeContainer();
    mount(<App />, container);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.checked).toBe(true);

    setChecked(false);
    flushSync();
    expect((container.querySelector("input") as HTMLInputElement).checked).toBe(
      false,
    );
  });
});
