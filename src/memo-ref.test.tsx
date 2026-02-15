import { describe, it, expect, beforeEach } from "vitest";
import { useState, useMemo, useRef, useCallback, flushSync } from "./index.js";
import { makeContainer, mount, reset } from "./test-utils.js";

describe("useMemo", () => {
  beforeEach(reset);

  it("recomputes only when deps change", () => {
    let computations = 0;
    let setA!: (n: number) => void;
    let setB!: (n: number) => void;
    const C = () => {
      const [a, sa] = useState(1);
      const [b, sb] = useState(1);
      setA = sa;
      setB = sb;
      const doubled = useMemo(() => {
        computations++;
        return a * 2;
      }, [a]);
      return (
        <p>
          {doubled}-{b}
        </p>
      );
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(computations).toBe(1);

    setB(2);
    flushSync();
    expect(computations).toBe(1);
    expect(container.querySelector("p")!.textContent).toBe("2-2");

    setA(5);
    flushSync();
    expect(computations).toBe(2);
    expect(container.querySelector("p")!.textContent).toBe("10-2");
  });

  it("useCallback returns a stable identity until deps change", () => {
    const seen: Array<() => void> = [];
    let setN!: (n: number) => void;
    let setDep!: (n: number) => void;
    const C = () => {
      const [, sn] = useState(0);
      const [dep, sd] = useState(0);
      setN = sn;
      setDep = sd;
      const cb = useCallback(() => {}, [dep]);
      seen.push(cb);
      return <span>{dep}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);

    setN(1);
    flushSync();
    expect(seen[1]).toBe(seen[0]);

    setDep(1);
    flushSync();
    expect(seen[2]).not.toBe(seen[1]);
  });
});

describe("useRef", () => {
  beforeEach(reset);

  it("persists a mutable value across renders without re-rendering", () => {
    let renders = 0;
    let setN!: (n: number) => void;
    let refObj!: { current: number };
    const C = () => {
      const [n, s] = useState(0);
      setN = s;
      const ref = useRef(0);
      refObj = ref;
      renders++;
      ref.current += 1;
      return <span>{n}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    expect(renders).toBe(1);
    expect(refObj.current).toBe(1);

    setN(1);
    flushSync();
    expect(renders).toBe(2);
    expect(refObj.current).toBe(2);
  });

  it("returns a stable ref object identity across renders", () => {
    const refs: Array<{ current: number }> = [];
    let setN!: (n: number) => void;
    const C = () => {
      const [n, s] = useState(0);
      setN = s;
      refs.push(useRef(42));
      return <span>{n}</span>;
    };
    const container = makeContainer();
    mount(<C />, container);
    setN(1);
    flushSync();
    expect(refs[1]).toBe(refs[0]);
    expect(refs[1]!.current).toBe(42);
  });
});
