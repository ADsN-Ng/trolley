import type {
  GroceryItem,
  GroceryList,
  ListChangeEvent,
  ListMember,
  UserProfile,
  Category,
} from '../types/models';

export type CreateItemInput = {
  name: string;
  quantity?: string;
  note?: string;
  category?: Category;
};

export type UpdateItemInput = Partial<{
  name: string;
  quantity: string;
  note: string;
  category: Category;
  checked: boolean;
}>;

export type GroceryStore = {
  mode: 'demo' | 'supabase';
  getCurrentUser(): Promise<UserProfile | null>;
  signInWithMagicLink(email: string): Promise<{ message: string }>;
  signInDemo(displayName?: string): Promise<UserProfile>;
  signOut(): Promise<void>;
  onAuthChange(callback: (user: UserProfile | null) => void): () => void;

  listLists(): Promise<GroceryList[]>;
  createList(name: string): Promise<GroceryList>;
  renameList(listId: string, name: string): Promise<GroceryList>;
  deleteList(listId: string): Promise<void>;
  getList(listId: string): Promise<GroceryList | null>;

  listMembers(listId: string): Promise<ListMember[]>;
  joinListByInvite(listId: string, token: string): Promise<GroceryList>;

  listItems(listId: string): Promise<GroceryItem[]>;
  addItem(listId: string, input: CreateItemInput): Promise<GroceryItem>;
  updateItem(itemId: string, input: UpdateItemInput): Promise<GroceryItem>;
  deleteItem(itemId: string): Promise<void>;

  subscribe(callback: (event: ListChangeEvent) => void): () => void;
};
