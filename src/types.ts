export const TEXT_ELEMENT = "TEXT_ELEMENT" as const;

export const Fragment = Symbol.for("reconciler.fragment");

export type FunctionComponent<P = Record<string, unknown>> = (
  props: P,
) => ReconcilerNode;

export type ElementType =
  | string
  | typeof TEXT_ELEMENT
  | typeof Fragment
  | FunctionComponent<any>;

export interface Props {
  children: ReconcilerNode[];
  key?: string | number | null;
  [name: string]: unknown;
}

export interface ReconcilerElement<P extends Props = Props> {
  type: ElementType;
  props: P;
  key: string | number | null;
}

export type ReconcilerNode =
  | ReconcilerElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ReconcilerNode[];

export type EffectTag = "PLACEMENT" | "UPDATE" | "DELETION";

export interface StateHook<S = unknown> {
  tag: "state";
  state: S;
  queue: Array<(prev: S) => S>;
}

export interface EffectHook {
  tag: "effect";
  deps: unknown[] | undefined;
  create: (() => void | (() => void)) | undefined;
  cleanup: (() => void) | undefined;
}

export interface MemoHook<T = unknown> {
  tag: "memo";
  value: T;
  deps: unknown[] | undefined;
}

export interface RefHook<T = unknown> {
  tag: "ref";
  ref: { current: T };
}

export type Hook = StateHook | EffectHook | MemoHook | RefHook;

export interface Fiber {
  type: ElementType | null;
  props: Props;
  key: string | number | null;

  dom: Node | null;

  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;

  alternate: Fiber | null;

  effectTag: EffectTag | null;

  hooks: Hook[] | null;

  pendingEffects: EffectHook[] | null;
}
