export type Category =
  | 'Produce'
  | 'Dairy'
  | 'Bakery'
  | 'Meat'
  | 'Pantry'
  | 'Frozen'
  | 'Drinks'
  | 'Household'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Produce',
  'Dairy',
  'Bakery',
  'Meat',
  'Pantry',
  'Frozen',
  'Drinks',
  'Household',
  'Other',
];

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
};

export type GroceryList = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  inviteToken: string;
};

export type ListMember = {
  listId: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'member';
  joinedAt: string;
};

export type GroceryItem = {
  id: string;
  listId: string;
  name: string;
  quantity: string;
  note: string;
  category: Category;
  checked: boolean;
  addedBy: string;
  addedByName: string;
  checkedBy: string | null;
  checkedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListChangeEvent =
  | { type: 'lists' }
  | { type: 'items'; listId: string }
  | { type: 'members'; listId: string };
