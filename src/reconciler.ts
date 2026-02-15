import { createDom, updateDom } from "./dom.js";
import { scheduleWork, type IdleDeadline } from "./scheduler.js";
import {
  Fragment,
  type EffectHook,
  type Fiber,
  type ReconcilerElement,
  type FunctionComponent,
  type Hook,
  type MemoHook,
  type Props,
  type RefHook,
  type StateHook,
} from "./types.js";

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletions: Fiber[] = [];
let isLoopScheduled = false;

let wipFiber: Fiber | null = null;
let hookIndex = 0;

export function render(element: ReconcilerElement, container: Node): void {
  wipRoot = {
    type: null,
    dom: container,
    props: { children: [element] },
    key: null,
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
    effectTag: null,
    hooks: null,
    pendingEffects: null,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
  ensureLoop();
}

function scheduleRerender(): void {
  if (!currentRoot) return;
  wipRoot = {
    type: currentRoot.type,
    dom: currentRoot.dom,
    props: currentRoot.props,
    key: currentRoot.key,
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
    effectTag: null,
    hooks: null,
    pendingEffects: null,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
  ensureLoop();
}

function ensureLoop(): void {
  if (isLoopScheduled) return;
  isLoopScheduled = true;
  scheduleWork(workLoop);
}

function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
    isLoopScheduled = false;
    return;
  }

  if (nextUnitOfWork) {
    scheduleWork(workLoop);
  } else {
    isLoopScheduled = false;
  }
}

export function flushSync(): void {
  while (nextUnitOfWork || wipRoot) {
    while (nextUnitOfWork) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
    if (wipRoot) commitRoot();
  }
  isLoopScheduled = false;
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (typeof fiber.type === "function") {
    updateFunctionComponent(fiber);
  } else if (fiber.type === Fragment) {
    reconcileChildren(fiber, fiber.props.children as ReconcilerElement[]);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) return fiber.child;

  let next: Fiber | null = fiber;
  while (next) {
    if (next.sibling) return next.sibling;
    next = next.parent;
  }
  return null;
}

function updateHostComponent(fiber: Fiber): void {
  if (!fiber.dom) fiber.dom = createDom(fiber);
  reconcileChildren(fiber, fiber.props.children as ReconcilerElement[]);
}

function updateFunctionComponent(fiber: Fiber): void {
  wipFiber = fiber;
  hookIndex = 0;
  fiber.hooks = [];
  fiber.pendingEffects = [];

  const component = fiber.type as FunctionComponent;
  reconcileChildren(fiber, normalizeRenderOutput(component(fiber.props)));

  wipFiber = null;
}

function normalizeRenderOutput(child: unknown): ReconcilerElement[] {
  if (child == null || typeof child === "boolean") return [];
  if (Array.isArray(child)) {
    return child.filter(
      (c) => c != null && typeof c !== "boolean",
    ) as ReconcilerElement[];
  }
  if (typeof child === "string" || typeof child === "number") {
    return [
      {
        type: "TEXT_ELEMENT",
        key: null,
        props: { nodeValue: String(child), children: [] },
      },
    ];
  }
  return [child as ReconcilerElement];
}

function reconcileChildren(
  wipFiber: Fiber,
  elements: ReconcilerElement[],
): void {
  const oldFibers: Fiber[] = [];
  let old = wipFiber.alternate?.child ?? null;
  while (old) {
    oldFibers.push(old);
    old = old.sibling;
  }

  const keyedOld = new Map<string | number, Fiber>();
  const unkeyedOld: Fiber[] = [];
  for (const f of oldFibers) {
    if (f.key != null) keyedOld.set(f.key, f);
    else unkeyedOld.push(f);
  }

  const matched = new Set<Fiber>();
  let prevSibling: Fiber | null = null;
  let unkeyedCursor = 0;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]!;
    const key = element.key;

    let match: Fiber | null = null;
    if (key != null) {
      const candidate = keyedOld.get(key);
      if (candidate && candidate.type === element.type) match = candidate;
    } else {
      while (unkeyedCursor < unkeyedOld.length) {
        const candidate = unkeyedOld[unkeyedCursor++]!;
        if (candidate.type === element.type) {
          match = candidate;
          break;
        }
      }
    }

    let newFiber: Fiber;
    if (match) {
      matched.add(match);
      newFiber = {
        type: element.type,
        props: element.props,
        key: element.key,
        dom: match.dom,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: match,
        effectTag: "UPDATE",
        hooks: null,
        pendingEffects: null,
      };
    } else {
      newFiber = {
        type: element.type,
        props: element.props,
        key: element.key,
        dom: null,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: null,
        effectTag: "PLACEMENT",
        hooks: null,
        pendingEffects: null,
      };
    }

    if (i === 0) wipFiber.child = newFiber;
    else if (prevSibling) prevSibling.sibling = newFiber;
    prevSibling = newFiber;
  }

  for (const f of oldFibers) {
    if (!matched.has(f)) {
      f.effectTag = "DELETION";
      deletions.push(f);
    }
  }
}

function commitRoot(): void {
  for (const d of deletions) commitDeletion(d);
  if (wipRoot?.child) commitUpdates(wipRoot.child);
  if (wipRoot) commitPlacements(wipRoot);

  runEffects(wipRoot);

  currentRoot = wipRoot;
  wipRoot = null;
  deletions = [];
}

function commitUpdates(fiber: Fiber | null): void {
  if (!fiber) return;
  if (fiber.effectTag === "UPDATE" && fiber.dom) {
    updateDom(
      fiber.dom,
      (fiber.alternate?.props as Props) ?? { children: [] },
      fiber.props,
    );
  }
  commitUpdates(fiber.child);
  commitUpdates(fiber.sibling);
}

function commitPlacements(fiber: Fiber): void {
  if (fiber.dom) placeChildren(fiber);
  let child = fiber.child;
  while (child) {
    commitPlacements(child);
    child = child.sibling;
  }
}

function placeChildren(hostFiber: Fiber): void {
  const parentDom = hostFiber.dom!;
  const hostChildren: Node[] = [];
  collectHostChildren(hostFiber.child, hostChildren);

  let anchor: Node | null = null;
  for (let i = hostChildren.length - 1; i >= 0; i--) {
    const node = hostChildren[i]!;
    if (node.parentNode !== parentDom || node.nextSibling !== anchor) {
      parentDom.insertBefore(node, anchor);
    }
    anchor = node;
  }
}

function collectHostChildren(fiber: Fiber | null, out: Node[]): void {
  let cur = fiber;
  while (cur) {
    if (cur.effectTag === "DELETION") {
      cur = cur.sibling;
      continue;
    }
    if (cur.dom) out.push(cur.dom);
    else collectHostChildren(cur.child, out);
    cur = cur.sibling;
  }
}

function commitDeletion(fiber: Fiber): void {
  runCleanupForTree(fiber);
  removeDom(fiber);
}

function removeDom(fiber: Fiber): void {
  if (fiber.dom) {
    fiber.dom.parentNode?.removeChild(fiber.dom);
    return;
  }
  let child = fiber.child;
  while (child) {
    removeDom(child);
    child = child.sibling;
  }
}

function runEffects(root: Fiber | null): void {
  if (!root) return;
  const visit = (fiber: Fiber | null): void => {
    if (!fiber) return;
    visit(fiber.child);
    visit(fiber.sibling);
    if (fiber.pendingEffects) {
      for (const effect of fiber.pendingEffects) {
        if (effect.create) {
          if (effect.cleanup) {
            effect.cleanup();
            effect.cleanup = undefined;
          }
          const cleanup = effect.create();
          effect.cleanup = typeof cleanup === "function" ? cleanup : undefined;
          effect.create = undefined;
        }
      }
    }
  };
  visit(root.child);
}

function runCleanupForTree(fiber: Fiber | null): void {
  if (!fiber) return;
  if (fiber.hooks) {
    for (const hook of fiber.hooks) {
      if (hook.tag === "effect" && hook.cleanup) {
        hook.cleanup();
        hook.cleanup = undefined;
      }
    }
  }
  let child = fiber.child;
  while (child) {
    runCleanupForTree(child);
    child = child.sibling;
  }
}

function currentFiber(): Fiber {
  if (!wipFiber) {
    throw new Error("Hooks can only be called inside a function component.");
  }
  return wipFiber;
}

function previousHook(): Hook | undefined {
  return wipFiber?.alternate?.hooks?.[hookIndex];
}

export function useState<S>(
  initial: S | (() => S),
): [S, (action: S | ((prev: S) => S)) => void] {
  return useReducer<S, S | ((prev: S) => S)>(
    (prev, action) =>
      typeof action === "function" ? (action as (p: S) => S)(prev) : action,
    undefined as never,
    () =>
      typeof initial === "function" ? (initial as () => S)() : (initial as S),
  );
}

export function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialArg: S,
  init?: (arg: S) => S,
): [S, (action: A) => void] {
  const fiber = currentFiber();
  const index = hookIndex;
  const old = previousHook() as StateHook<S> | undefined;

  const hook: StateHook<S> = {
    tag: "state",
    state: old ? old.state : init ? init(initialArg) : initialArg,
    queue: [],
  };

  for (const update of old?.queue ?? []) {
    hook.state = update(hook.state);
  }

  const dispatch = (action: A): void => {
    hook.queue.push((prev) => reducer(prev, action));
    scheduleRerender();
  };

  fiber.hooks![index] = hook as unknown as Hook;
  hookIndex++;
  return [hook.state, dispatch];
}

export function useEffect(
  create: () => void | (() => void),
  deps?: unknown[],
): void {
  const fiber = currentFiber();
  const index = hookIndex;
  const old = previousHook() as EffectHook | undefined;

  const changed = old ? depsChanged(old.deps, deps) : true;

  const hook: EffectHook = {
    tag: "effect",
    deps,
    create: changed ? create : undefined,
    cleanup: old?.cleanup,
  };

  fiber.hooks![index] = hook;
  if (changed) fiber.pendingEffects!.push(hook);
  hookIndex++;
}

export function useMemo<T>(factory: () => T, deps: unknown[]): T {
  const fiber = currentFiber();
  const index = hookIndex;
  const old = previousHook() as MemoHook<T> | undefined;

  const value = old && !depsChanged(old.deps, deps) ? old.value : factory();

  const hook: MemoHook<T> = { tag: "memo", value, deps };
  fiber.hooks![index] = hook as unknown as Hook;
  hookIndex++;
  return value;
}

export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: unknown[],
): T {
  return useMemo(() => callback, deps);
}

export function useRef<T>(initial: T): { current: T } {
  const fiber = currentFiber();
  const index = hookIndex;
  const old = previousHook() as RefHook<T> | undefined;

  const hook: RefHook<T> = old ?? { tag: "ref", ref: { current: initial } };

  fiber.hooks![index] = hook as unknown as Hook;
  hookIndex++;
  return hook.ref;
}

function depsChanged(
  prev: unknown[] | undefined,
  next: unknown[] | undefined,
): boolean {
  if (!prev || !next) return true;
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (!Object.is(prev[i], next[i])) return true;
  }
  return false;
}

export function __resetForTests(): void {
  nextUnitOfWork = null;
  wipRoot = null;
  currentRoot = null;
  deletions = [];
  isLoopScheduled = false;
  wipFiber = null;
  hookIndex = 0;
}
