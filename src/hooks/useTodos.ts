import { useState, useEffect, useCallback, useRef } from 'react';
import { Todo, TodosStore } from '../types';
import { loadTodosFromStorage, saveTodosToStorage } from '../utils/storage';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useTodos(selectedDate: string) {
  const [store, setStore] = useState<TodosStore>({});
  const storeRef = useRef<TodosStore>({});

  useEffect(() => {
    loadTodosFromStorage().then((data) => {
      storeRef.current = data;
      setStore(data);
    });
  }, []);

  const persist = useCallback((next: TodosStore) => {
    storeRef.current = next;
    setStore(next);
    saveTodosToStorage(next);
  }, []);

  const todos: Todo[] = storeRef.current[selectedDate] ?? [];

  const addTodo = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const todo: Todo = { id: makeId(), text: trimmed, completed: false };
      const current = storeRef.current[selectedDate] ?? [];
      persist({ ...storeRef.current, [selectedDate]: [...current, todo] });
    },
    [selectedDate, persist],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      const current = storeRef.current[selectedDate] ?? [];
      persist({ ...storeRef.current, [selectedDate]: current.filter((t) => t.id !== id) });
    },
    [selectedDate, persist],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const current = storeRef.current[selectedDate] ?? [];
      persist({
        ...storeRef.current,
        [selectedDate]: current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      });
    },
    [selectedDate, persist],
  );

  const reorderTodos = useCallback(
    (reordered: Todo[]) => {
      persist({ ...storeRef.current, [selectedDate]: reordered });
    },
    [selectedDate, persist],
  );

  return { todos, store, addTodo, deleteTodo, toggleTodo, reorderTodos };
}
