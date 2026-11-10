import { createDemoStore } from './demoStore';
import { createSupabaseStore } from './supabaseStore';
import type { GroceryStore } from './store';

export type { GroceryStore, CreateItemInput, UpdateItemInput } from './store';

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

let singleton: GroceryStore | null = null;

export function getStore(): GroceryStore {
  if (singleton) return singleton;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  singleton =
    url && key ? createSupabaseStore(url, key) : createDemoStore();
  return singleton;
}

/** Test-only: replace the shared store instance. */
export function setStoreForTests(store: GroceryStore | null): void {
  singleton = store;
}
