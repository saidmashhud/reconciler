export interface IdleDeadline {
  timeRemaining(): number;
  didTimeout: boolean;
}

export type SchedulerCallback = (deadline: IdleDeadline) => void;

const FRAME_BUDGET_MS = 5;

function makePostTask(): (cb: () => void) => void {
  if (typeof MessageChannel !== "undefined") {
    let scheduled: (() => void) | null = null;
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      const cb = scheduled;
      scheduled = null;
      if (cb) cb();
    };
    return (cb: () => void) => {
      scheduled = cb;
      channel.port2.postMessage(null);
    };
  }
  return (cb: () => void) => setTimeout(cb, 0);
}

const postTask = makePostTask();

export function scheduleWork(callback: SchedulerCallback): void {
  const ric = (globalThis as { requestIdleCallback?: unknown })
    .requestIdleCallback;
  if (typeof ric === "function") {
    (ric as (cb: SchedulerCallback) => void)(callback);
    return;
  }

  const start = now();
  postTask(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, FRAME_BUDGET_MS - (now() - start));
      },
    });
  });
}

function now(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}
