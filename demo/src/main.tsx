import { render, useState, useEffect, useMemo, useRef } from "reconciler";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `reconciler — count ${count}`;
  }, [count]);

  return (
    <div className="card">
      <h1>Counter</h1>
      <div className="row">
        <button onClick={() => setCount((c) => c - 1)} className="secondary">
          −
        </button>
        <strong style={{ minWidth: "3ch", textAlign: "center" }}>
          {count}
        </strong>
        <button onClick={() => setCount((c) => c + 1)}>+</button>
        <button onClick={() => setCount(0)} className="secondary">
          reset
        </button>
      </div>
      <p className="muted">The document title syncs via useEffect([count]).</p>
    </div>
  );
}

type Todo = { id: number; text: string; done: boolean };

function Todos() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Read about fiber", done: true },
    { id: 2, text: "Implement reconciler", done: false },
    { id: 3, text: "Write the README", done: false },
  ]);
  const nextId = useRef(4);
  const [draft, setDraft] = useState("");

  const remaining = useMemo(
    () => todos.filter((t) => !t.done).length,
    [todos],
  );

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: nextId.current++, text, done: false },
    ]);
    setDraft("");
  };

  const toggle = (id: number) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const remove = (id: number) =>
    setTodos((prev) => prev.filter((t) => t.id !== id));

  const shuffle = () =>
    setTodos((prev) => [...prev].sort(() => Math.random() - 0.5));

  return (
    <div className="card">
      <h1>Todos</h1>
      <div className="row">
        <input
          value={draft}
          placeholder="Add a todo…"
          onInput={(e: InputEvent) =>
            setDraft((e.target as HTMLInputElement).value)
          }
        />
        <button onClick={add}>Add</button>
        <button onClick={shuffle} className="secondary">
          Shuffle
        </button>
      </div>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              className={todo.done ? "done" : ""}
              onClick={() => toggle(todo.id)}
              style={{ cursor: "pointer", flex: "1" }}
            >
              {todo.text}
            </span>
            <button onClick={() => remove(todo.id)} className="secondary">
              ✕
            </button>
          </li>
        ))}
      </ul>
      <p className="muted">{remaining} remaining — keys keep nodes stable across Shuffle.</p>
    </div>
  );
}

function App() {
  return (
    <>
      <Counter />
      <Todos />
    </>
  );
}

const root = document.getElementById("root")!;
render(<App />, root);
