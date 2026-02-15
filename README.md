# reconciler

Маленький React «с нуля» — писал, чтобы самому понять, как внутри устроены виртуальный DOM, реконсиляция и хуки. Не замена React и ни на что не претендует, учебная штука.

```tsx
import { createElement, render, useState } from "reconciler";

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN((c) => c + 1)}>кликов: {n}</button>;
}

render(<Counter />, document.getElementById("root")!);
```

Есть JSX (свой рантайм, подключается через `jsxImportSource: "reconciler"`), функциональные компоненты, keyed-диффинг списков и хуки — `useState`, `useEffect`, `useMemo`, `useReducer`, `useRef`, `useCallback`. Рендер разбит на куски, чтобы не подвешивать главный поток на большом дереве.

`pnpm test` — тесты на happy-dom, `cd demo && pnpm dev` — демка.
