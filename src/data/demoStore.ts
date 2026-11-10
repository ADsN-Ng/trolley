import type {
  Category,
  GroceryItem,
  GroceryList,
  ListChangeEvent,
  ListMember,
  UserProfile,
} from '../types/models';
import { createId, createToken, nowIso } from '../lib/id';
import type { CreateItemInput, GroceryStore, UpdateItemInput } from './store';

const STORAGE_KEY = 'trolley.demo.v1';
const CHANNEL_NAME = 'trolley-demo-sync';

type DemoDb = {
  user: UserProfile;
  lists: GroceryList[];
  members: ListMember[];
  items: GroceryItem[];
};

function defaultUser(displayName = 'You'): UserProfile {
  return {
    id: 'demo-user',
    email: 'you@example.com',
    displayName,
  };
}

function seedDb(user: UserProfile): DemoDb {
  const listId = createId('list');
  const token = createToken();
  const createdAt = nowIso();
  const list: GroceryList = {
    id: listId,
    name: 'Flat groceries',
    createdBy: user.id,
    createdAt,
    updatedAt: createdAt,
    inviteToken: token,
  };
  const member: ListMember = {
    listId,
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: 'owner',
    joinedAt: createdAt,
  };
  const milk: GroceryItem = {
    id: createId('item'),
    listId,
    name: 'Oat milk',
    quantity: '2',
    note: 'barista if they have it',
    category: 'Dairy',
    checked: false,
    addedBy: user.id,
    addedByName: user.displayName,
    checkedBy: null,
    checkedByName: null,
    createdAt,
    updatedAt: createdAt,
  };
  const bananas: GroceryItem = {
    id: createId('item'),
    listId,
    name: 'Bananas',
    quantity: '1 bunch',
    note: '',
    category: 'Produce',
    checked: false,
    addedBy: user.id,
    addedByName: user.displayName,
    checkedBy: null,
    checkedByName: null,
    createdAt,
    updatedAt: createdAt,
  };
  return { user, lists: [list], members: [member], items: [milk, bananas] };
}

function readDb(): DemoDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const db = seedDb(defaultUser());
      writeDb(db);
      return db;
    }
    return JSON.parse(raw) as DemoDb;
  } catch {
    const db = seedDb(defaultUser());
    writeDb(db);
    return db;
  }
}

function writeDb(db: DemoDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function mutate(mutator: (db: DemoDb) => void): DemoDb {
  const db = readDb();
  mutator(db);
  writeDb(db);
  return db;
}

export function createDemoStore(): GroceryStore {
  const listeners = new Set<(event: ListChangeEvent) => void>();
  const authListeners = new Set<(user: UserProfile | null) => void>();

  const notify = (event: ListChangeEvent) => {
    for (const listener of listeners) listener(event);
  };

  const notifyAuth = (user: UserProfile | null) => {
    for (const listener of authListeners) listener(user);
  };

  const broadcast =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  const onRemote = (event: ListChangeEvent) => {
    notify(event);
  };

  if (broadcast) {
    broadcast.onmessage = (message: MessageEvent<ListChangeEvent>) => {
      onRemote(message.data);
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    notify({ type: 'lists' });
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  const publish = (event: ListChangeEvent) => {
    notify(event);
    broadcast?.postMessage(event);
  };

  const ensureMember = (db: DemoDb, listId: string, user: UserProfile) => {
    const exists = db.members.some((m) => m.listId === listId && m.userId === user.id);
    if (!exists) {
      db.members.push({
        listId,
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        role: 'member',
        joinedAt: nowIso(),
      });
    }
  };

  return {
    mode: 'demo',

    async getCurrentUser() {
      return readDb().user;
    },

    async signInWithMagicLink(email: string) {
      const name = email.split('@')[0] || 'Friend';
      const user: UserProfile = {
        id: createId('user'),
        email,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
      };
      mutate((db) => {
        db.user = user;
      });
      notifyAuth(user);
      return {
        message:
          'Demo mode: signed you in locally. Add Supabase env vars for real magic links.',
      };
    },

    async signInDemo(displayName = 'You') {
      const user = defaultUser(displayName);
      mutate((db) => {
        db.user = user;
      });
      notifyAuth(user);
      return user;
    },

    async signOut() {
      // Keep demo data, just reset to the default local user.
      const user = defaultUser();
      mutate((db) => {
        db.user = user;
      });
      notifyAuth(user);
    },

    onAuthChange(callback) {
      authListeners.add(callback);
      void this.getCurrentUser().then(callback);
      return () => {
        authListeners.delete(callback);
      };
    },

    async listLists() {
      const db = readDb();
      const myListIds = new Set(
        db.members.filter((m) => m.userId === db.user.id).map((m) => m.listId),
      );
      return db.lists
        .filter((list) => myListIds.has(list.id))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async createList(name: string) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('List name is required');
      let created!: GroceryList;
      mutate((db) => {
        const stamp = nowIso();
        created = {
          id: createId('list'),
          name: trimmed,
          createdBy: db.user.id,
          createdAt: stamp,
          updatedAt: stamp,
          inviteToken: createToken(),
        };
        db.lists.push(created);
        db.members.push({
          listId: created.id,
          userId: db.user.id,
          email: db.user.email,
          displayName: db.user.displayName,
          role: 'owner',
          joinedAt: stamp,
        });
      });
      publish({ type: 'lists' });
      return created;
    },

    async renameList(listId: string, name: string) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('List name is required');
      let updated!: GroceryList;
      mutate((db) => {
        const list = db.lists.find((l) => l.id === listId);
        if (!list) throw new Error('List not found');
        list.name = trimmed;
        list.updatedAt = nowIso();
        updated = { ...list };
      });
      publish({ type: 'lists' });
      return updated;
    },

    async deleteList(listId: string) {
      mutate((db) => {
        db.lists = db.lists.filter((l) => l.id !== listId);
        db.members = db.members.filter((m) => m.listId !== listId);
        db.items = db.items.filter((i) => i.listId !== listId);
      });
      publish({ type: 'lists' });
    },

    async getList(listId: string) {
      const db = readDb();
      const isMember = db.members.some((m) => m.listId === listId && m.userId === db.user.id);
      if (!isMember) return null;
      return db.lists.find((l) => l.id === listId) ?? null;
    },

    async listMembers(listId: string) {
      return readDb()
        .members.filter((m) => m.listId === listId)
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    },

    async joinListByInvite(listId: string, token: string) {
      let joined!: GroceryList;
      mutate((db) => {
        const list = db.lists.find((l) => l.id === listId);
        if (!list || list.inviteToken !== token) {
          throw new Error('Invite link is invalid or expired');
        }
        ensureMember(db, listId, db.user);
        list.updatedAt = nowIso();
        joined = { ...list };
      });
      publish({ type: 'lists' });
      publish({ type: 'members', listId });
      return joined;
    },

    async listItems(listId: string) {
      return readDb()
        .items.filter((i) => i.listId === listId)
        .sort((a, b) => {
          if (a.checked !== b.checked) return a.checked ? 1 : -1;
          return a.createdAt.localeCompare(b.createdAt);
        });
    },

    async addItem(listId: string, input: CreateItemInput) {
      const name = input.name.trim();
      if (!name) throw new Error('Item name is required');
      let created!: GroceryItem;
      mutate((db) => {
        const list = db.lists.find((l) => l.id === listId);
        if (!list) throw new Error('List not found');
        const stamp = nowIso();
        created = {
          id: createId('item'),
          listId,
          name,
          quantity: (input.quantity ?? '').trim() || '1',
          note: (input.note ?? '').trim(),
          category: (input.category ?? 'Other') as Category,
          checked: false,
          addedBy: db.user.id,
          addedByName: db.user.displayName,
          checkedBy: null,
          checkedByName: null,
          createdAt: stamp,
          updatedAt: stamp,
        };
        db.items.push(created);
        list.updatedAt = stamp;
      });
      publish({ type: 'items', listId });
      publish({ type: 'lists' });
      return created;
    },

    async updateItem(itemId: string, input: UpdateItemInput) {
      let updated!: GroceryItem;
      let listId = '';
      mutate((db) => {
        const item = db.items.find((i) => i.id === itemId);
        if (!item) throw new Error('Item not found');
        listId = item.listId;
        if (input.name !== undefined) {
          const name = input.name.trim();
          if (!name) throw new Error('Item name is required');
          item.name = name;
        }
        if (input.quantity !== undefined) item.quantity = input.quantity.trim() || '1';
        if (input.note !== undefined) item.note = input.note.trim();
        if (input.category !== undefined) item.category = input.category;
        if (input.checked !== undefined) {
          item.checked = input.checked;
          if (input.checked) {
            item.checkedBy = db.user.id;
            item.checkedByName = db.user.displayName;
          } else {
            item.checkedBy = null;
            item.checkedByName = null;
          }
        }
        item.updatedAt = nowIso();
        const list = db.lists.find((l) => l.id === item.listId);
        if (list) list.updatedAt = item.updatedAt;
        updated = { ...item };
      });
      publish({ type: 'items', listId });
      publish({ type: 'lists' });
      return updated;
    },

    async deleteItem(itemId: string) {
      let listId = '';
      mutate((db) => {
        const item = db.items.find((i) => i.id === itemId);
        if (!item) throw new Error('Item not found');
        listId = item.listId;
        db.items = db.items.filter((i) => i.id !== itemId);
        const list = db.lists.find((l) => l.id === listId);
        if (list) list.updatedAt = nowIso();
      });
      publish({ type: 'items', listId });
      publish({ type: 'lists' });
    },

    subscribe(callback) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
  };
}

/** Test helper: wipe demo storage. */
export function resetDemoStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
