import { jsx, Fragment, JSX } from "./jsx-runtime.js";
import type { ElementType, ReconcilerElement } from "./types.js";

export { Fragment };
export type { JSX };

export function jsxDEV(
  type: ElementType,
  props: Record<string, unknown>,
  key?: string | number,
): ReconcilerElement {
  return jsx(type, props, key);
}
