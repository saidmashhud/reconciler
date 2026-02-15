import { describe, it, expect, beforeEach } from "vitest";
import { useState } from "./index.js";
import { makeContainer, mount, reset } from "./test-utils.js";

describe("mounting", () => {
  beforeEach(reset);

  it("mounts a host element with attributes and text", () => {
    const container = makeContainer();
    mount(<div id="app" title="hi">Hello</div>, container);

    const el = container.querySelector("#app") as HTMLDivElement;
    expect(el).not.toBeNull();
    expect(el.getAttribute("title")).toBe("hi");
    expect(el.textContent).toBe("Hello");
  });

  it("mounts nested host elements", () => {
    const container = makeContainer();
    mount(
      <div className="outer">
        <span>a</span>
        <span>b</span>
      </div>,
      container,
    );

    const outer = container.querySelector(".outer")!;
    expect(outer.getAttribute("class")).toBe("outer");
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(2);
    expect(spans[0]!.textContent).toBe("a");
    expect(spans[1]!.textContent).toBe("b");
  });

  it("mounts a function component", () => {
    const Greeting = ({ name }: { name: string }) => <h1>Hi {name}</h1>;
    const container = makeContainer();
    mount(<Greeting name="Ada" />, container);

    const h1 = container.querySelector("h1")!;
    expect(h1.textContent).toBe("Hi Ada");
  });

  it("mounts composed function components", () => {
    const Item = ({ label }: { label: string }) => <li>{label}</li>;
    const List = () => (
      <ul>
        <Item label="one" />
        <Item label="two" />
      </ul>
    );
    const container = makeContainer();
    mount(<List />, container);

    const items = container.querySelectorAll("li");
    expect(items.length).toBe(2);
    expect(items[0]!.textContent).toBe("one");
    expect(items[1]!.textContent).toBe("two");
  });

  it("renders fragments without an extra wrapper", () => {
    const Pair = () => (
      <>
        <span>x</span>
        <span>y</span>
      </>
    );
    const container = makeContainer();
    mount(
      <div id="host">
        <Pair />
      </div>,
      container,
    );

    const host = container.querySelector("#host")!;
    expect(host.children.length).toBe(2);
    expect(host.querySelector("div > div")).toBeNull();
  });

  it("prunes falsy children", () => {
    const App = () => {
      const show = false;
      return (
        <div id="c">
          {show && <span>nope</span>}
          {null}
          <span>yes</span>
        </div>
      );
    };
    const container = makeContainer();
    mount(<App />, container);
    const c = container.querySelector("#c")!;
    expect(c.querySelectorAll("span").length).toBe(1);
    expect(c.textContent).toBe("yes");
  });

  it("initial useState value renders", () => {
    const Counter = () => {
      const [count] = useState(7);
      return <p>count: {count}</p>;
    };
    const container = makeContainer();
    mount(<Counter />, container);
    expect(container.querySelector("p")!.textContent).toBe("count: 7");
  });
});
