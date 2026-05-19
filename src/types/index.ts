export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export type TodosStore = Record<string, Todo[]>;
