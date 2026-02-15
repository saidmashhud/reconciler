import { createElement, Fragment } from "./element.js";
import type { ElementType, ReconcilerElement, Props } from "./types.js";

export { Fragment };

function jsxImpl(
  type: ElementType,
  props: Record<string, unknown>,
  key?: string | number,
): ReconcilerElement {
  const config: Record<string, unknown> = { ...props };
  if (key !== undefined) config["key"] = key;
  return createElement(type, config);
}

export function jsx(
  type: ElementType,
  props: Record<string, unknown>,
  key?: string | number,
): ReconcilerElement {
  return jsxImpl(type, props, key);
}

export function jsxs(
  type: ElementType,
  props: Record<string, unknown>,
  key?: string | number,
): ReconcilerElement {
  return jsxImpl(type, props, key);
}

export namespace JSX {
  export interface Element extends ReconcilerElement {}
  export interface ElementChildrenAttribute {
    children: Props["children"];
  }
  export interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}
