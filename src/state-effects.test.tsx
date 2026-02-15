import { describe, it, expect, beforeEach } from "vitest";
import { useState, useEffect, useReducer, flushSync } from "./index.js";
import { makeContainer, mount, reset } from "./test-utils.js";

describe("useState", () => {
  beforeEach(reset);

  it("re-renders and updates DOM on setState", () => {
    let setCount!: (n: number | ((p: number) => number)) => void;
    const Counter = () => {
      const [count, set] = useState(0);
      setCount = set;
      return <button>{count}</button>;
    };
    const container = makeContainer();
    mount(<Counter />, container);
    expect(container.querySelector("button")!.textContent).toBe("0");

    setCount(1);
    flushSync();
    expect(container.querySelector("button")!.textContent).toBe("1");

    setCount((p) => p + 5);
    flushSync();
    expect(container.querySelector("button")!.textContent).toBe("6");
  });

  it("batches multiple queued updates within one render pass", () => {
    let set!: (a: number | ((p: number) => number)) => void;
    let renderCount = 0;
    const C = () => {
      const [n, s] = useState(0);
      set = s;
      renderCount++;
      return <span>{n}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    const initialRenders = renderCount;

    set((p) => p + 1);
    set((p) => p + 1);
    set((p) => p + 1);
    flushSync();

    expect(container.querySelector("span")!.textContent).toBe("3");
    expect(renderCount - initialRenders).toBe(1);
  });

  it("preserves independent state across sibling components", () => {
    const setters: Array<(n: number) => void> = [];
    const Cell = () => {
      const [n, set] = useState(0);
      setters.push(set);
      return <i>{n}</i>;
    };
    const App = () => (
      <div>
        <Cell />
        <Cell />
      </div>
    );
    const container = makeContainer();
    mount(<App />, container);

    setters[0]!(11);
    flushSync();
    const cells = container.querySelectorAll("i");
    expect(cells[0]!.textContent).toBe("11");
    expect(cells[1]!.textContent).toBe("0");
  });
});

describe("useReducer", () => {
  beforeEach(reset);

  it("dispatches actions through a reducer", () => {
    type Action = { type: "inc" } | { type: "dec" };
    let dispatch!: (a: Action) => void;
    const C = () => {
      const [n, d] = useReducer(
        (s: number, a: Action) => (a.type === "inc" ? s + 1 : s - 1),
        10,
      );
      dispatch = d;
      return <b>{n}</b>;
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(container.querySelector("b")!.textContent).toBe("10");

    dispatch({ type: "inc" });
    flushSync();
    expect(container.querySelector("b")!.textContent).toBe("11");

    dispatch({ type: "dec" });
    dispatch({ type: "dec" });
    flushSync();
    expect(container.querySelector("b")!.textContent).toBe("9");
  });
});

describe("useEffect", () => {
  beforeEach(reset);

  it("runs after commit (DOM is present when effect fires)", () => {
    let textWhenEffectRan: string | null = null;
    const C = () => {
      useEffect(() => {
        textWhenEffectRan =
          document.querySelector("#target")?.textContent ?? null;
      }, []);
      return <p id="target">ready</p>;
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(textWhenEffectRan).toBe("ready");
  });

  it("runs once with empty deps and not again on re-render", () => {
    let runs = 0;
    let set!: (n: number) => void;
    const C = () => {
      const [n, s] = useState(0);
      set = s;
      useEffect(() => {
        runs++;
      }, []);
      return <span>{n}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(runs).toBe(1);

    set(1);
    flushSync();
    set(2);
    flushSync();
    expect(runs).toBe(1);
  });

  it("re-runs when deps change and runs cleanup before re-run", () => {
    const log: string[] = [];
    let set!: (n: number) => void;
    const C = () => {
      const [dep, s] = useState(0);
      set = s;
      useEffect(() => {
        log.push(`run:${dep}`);
        return () => log.push(`cleanup:${dep}`);
      }, [dep]);
      return <span>{dep}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(log).toEqual(["run:0"]);

    set(1);
    flushSync();
    expect(log).toEqual(["run:0", "cleanup:0", "run:1"]);
  });

  it("does not re-run when deps are unchanged", () => {
    const log: string[] = [];
    let set!: (n: number) => void;
    const C = () => {
      const [n, s] = useState(0);
      set = s;
      useEffect(() => {
        log.push("effect");
      }, [0]);
      return <span>{n}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    set(1);
    flushSync();
    expect(log).toEqual(["effect"]);
  });

  it("runs cleanup on unmount", () => {
    const log: string[] = [];
    let setShow!: (b: boolean) => void;
    const Child = () => {
      useEffect(() => {
        log.push("mount");
        return () => log.push("unmount");
      }, []);
      return <span>child</span>;
    };
    const App = () => {
      const [show, s] = useState(true);
      setShow = s;
      return <div>{show ? <Child /> : null}</div>;
    };
    const container = makeContainer();
    mount(<App />, container);
    expect(log).toEqual(["mount"]);

    setShow(false);
    flushSync();
    expect(log).toEqual(["mount", "unmount"]);
    expect(container.querySelector("span")).toBeNull();
  });

  it("runs effect every render when deps omitted", () => {
    let runs = 0;
    let set!: (n: number) => void;
    const C = () => {
      const [n, s] = useState(0);
      set = s;
      useEffect(() => {
        runs++;
      });
      return <span>{n}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(runs).toBe(1);
    set(1);
    flushSync();
    expect(runs).toBe(2);
  });
});
