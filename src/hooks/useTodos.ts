import { useState, useEffect, useCallback, useRef } from 'react';
import { Todo, TodosStore } from '../types';
import { loadTodosFromStorage, saveTodosToStorage } from '../utils/storage';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_HISTORY = 50;

export function useTodos(selectedDate: string) {
  const [store, setStore] = useState<TodosStore>({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const storeRef = useRef<TodosStore>({});
  const historyRef = useRef<TodosStore[]>([]);
  const futureRef = useRef<TodosStore[]>([]);

  useEffect(() => {
    loadTodosFromStorage().then((data) => {
      // Migrate old todos that lack parentId
      const migrated: TodosStore = {};
      for (const date of Object.keys(data)) {
        migrated[date] = data[date].map((t) =>
          'parentId' in t ? t : { ...t, parentId: null },
        );
      }
      storeRef.current = migrated;
      setStore(migrated);
    });
  }, []);

  const persist = useCallback((next: TodosStore) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), storeRef.current];
    futureRef.current = [];
    storeRef.current = next;
    setStore(next);
    setCanUndo(true);
    setCanRedo(false);
    saveTodosToStorage(next);
  }, []);

  const todos: Todo[] = storeRef.current[selectedDate] ?? [];

  const addTodo = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const todo: Todo = { id: makeId(), text: trimmed, completed: false, parentId: null };
      const current = storeRef.current[selectedDate] ?? [];
      persist({ ...storeRef.current, [selectedDate]: [...current, todo] });
    },
    [selectedDate, persist],
  );

  const editTodo = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const current = storeRef.current[selectedDate] ?? [];
      persist({
        ...storeRef.current,
        [selectedDate]: current.map((t) => (t.id === id ? { ...t, text: trimmed } : t)),
      });
    },
    [selectedDate, persist],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      const current = storeRef.current[selectedDate] ?? [];
      const toDelete = new Set<string>();
      const collect = (targetId: string) => {
        toDelete.add(targetId);
        current.filter((t) => t.parentId === targetId).forEach((c) => collect(c.id));
      };
      collect(id);
      persist({ ...storeRef.current, [selectedDate]: current.filter((t) => !toDelete.has(t.id)) });
    },
    [selectedDate, persist],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      const current = storeRef.current[selectedDate] ?? [];
      const target = current.find((t) => t.id === id);
      if (!target) return;
      const newCompleted = !target.completed;
      const toToggle = new Set<string>();
      const collect = (targetId: string) => {
        toToggle.add(targetId);
        current.filter((t) => t.parentId === targetId).forEach((c) => collect(c.id));
      };
      collect(id);
      persist({
        ...storeRef.current,
        [selectedDate]: current.map((t) => (toToggle.has(t.id) ? { ...t, completed: newCompleted } : t)),
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

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [storeRef.current, ...futureRef.current];
    storeRef.current = prev;
    setStore(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
    saveTodosToStorage(prev);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current, storeRef.current];
    storeRef.current = next;
    setStore(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    saveTodosToStorage(next);
  }, []);

  return {
    todos,
    store,
    addTodo,
    editTodo,
    deleteTodo,
    toggleTodo,
    reorderTodos,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
