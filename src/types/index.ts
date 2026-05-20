export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  parentId: string | null;
}

export interface FlatTodo {
  todo: Todo;
  depth: number;
}

export type TodosStore = Record<string, Todo[]>;
