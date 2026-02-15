import { TEXT_ELEMENT, type Fiber, type Props } from "./types.js";

const isEvent = (key: string): boolean => key.startsWith("on");
const isProperty = (key: string): boolean =>
  key !== "children" && key !== "key" && !isEvent(key);
const isNew =
  (prev: Props, next: Props) =>
  (key: string): boolean =>
    prev[key] !== next[key];
const isGone =
  (_prev: Props, next: Props) =>
  (key: string): boolean =>
    !(key in next);

function eventName(key: string): string {
  return key.toLowerCase().substring(2);
}

export function createDom(fiber: Fiber): Node {
  const dom =
    fiber.type === TEXT_ELEMENT
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, { children: [] }, fiber.props);
  return dom;
}

export function updateDom(dom: Node, prevProps: Props, nextProps: Props): void {
  for (const name of Object.keys(prevProps)) {
    if (
      isEvent(name) &&
      (!(name in nextProps) || isNew(prevProps, nextProps)(name))
    ) {
      dom.removeEventListener(eventName(name), prevProps[name] as EventListener);
    }
  }

  for (const name of Object.keys(prevProps)) {
    if (isProperty(name) && isGone(prevProps, nextProps)(name)) {
      setProperty(dom, name, null);
    }
  }

  for (const name of Object.keys(nextProps)) {
    if (isProperty(name) && isNew(prevProps, nextProps)(name)) {
      setProperty(dom, name, nextProps[name]);
    }
  }

  for (const name of Object.keys(nextProps)) {
    if (isEvent(name) && isNew(prevProps, nextProps)(name)) {
      dom.addEventListener(eventName(name), nextProps[name] as EventListener);
    }
  }
}

function setProperty(dom: Node, name: string, value: unknown): void {
  if (name === "nodeValue") {
    (dom as Text).nodeValue = value == null ? "" : String(value);
    return;
  }

  const el = dom as HTMLElement;

  if (name === "style" && value && typeof value === "object") {
    const style = el.style;
    style.cssText = "";
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      (style as unknown as Record<string, string>)[k] = String(v);
    }
    return;
  }

  if (name === "className") {
    el.setAttribute("class", value == null ? "" : String(value));
    if (value == null) el.removeAttribute("class");
    return;
  }

  if (name === "value" || name === "checked") {
    (el as unknown as Record<string, unknown>)[name] = value;
    return;
  }

  if (value == null || value === false) {
    el.removeAttribute(name);
    return;
  }
  if (value === true) {
    el.setAttribute(name, "");
    return;
  }
  el.setAttribute(name, String(value));
}
