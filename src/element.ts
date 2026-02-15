import {
  TEXT_ELEMENT,
  Fragment,
  type ElementType,
  type ReconcilerElement,
  type ReconcilerNode,
  type Props,
} from "./types.js";

export { Fragment };

function createTextElement(text: string | number): ReconcilerElement {
  return {
    type: TEXT_ELEMENT,
    key: null,
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
}

function isPrimitive(node: unknown): node is string | number {
  return typeof node === "string" || typeof node === "number";
}

export function normalizeChildren(
  children: ReconcilerNode[],
): ReconcilerElement[] {
  const out: ReconcilerElement[] = [];
  const walk = (node: ReconcilerNode): void => {
    if (node == null || typeof node === "boolean") return;
    if (Array.isArray(node)) {
      for (const c of node) walk(c);
      return;
    }
    if (isPrimitive(node)) {
      out.push(createTextElement(node));
      return;
    }
    out.push(node);
  };
  for (const c of children) walk(c);
  return out;
}

export function createElement(
  type: ElementType,
  config: Record<string, unknown> | null,
  ...children: ReconcilerNode[]
): ReconcilerElement {
  const props: Props = { children: [] };
  let key: string | number | null = null;

  if (config) {
    for (const name of Object.keys(config)) {
      if (name === "key") {
        const k = config[name];
        key = k == null ? null : (k as string | number);
        continue;
      }
      if (name === "children") continue;
      props[name] = config[name];
    }
    if (config["children"] !== undefined && children.length === 0) {
      children = config["children"] as ReconcilerNode[];
      if (!Array.isArray(children)) children = [children];
    }
  }

  props.children = normalizeChildren(children);
  props.key = key;
  return { type, props, key };
}
