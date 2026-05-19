import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodosStore } from '../types';

const KEY = '@DailyPlanner:todos';

export async function loadTodosFromStorage(): Promise<TodosStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TodosStore) : {};
  } catch {
    return {};
  }
}

export async function saveTodosToStorage(store: TodosStore): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage errors are non-fatal
  }
}
