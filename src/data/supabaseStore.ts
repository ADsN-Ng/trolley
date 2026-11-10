import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  GroceryItem,
  GroceryList,
  ListChangeEvent,
  ListMember,
  UserProfile,
} from '../types/models';
import type { CreateItemInput, GroceryStore, UpdateItemInput } from './store';

type DbList = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  invite_token: string;
};

type DbMember = {
  list_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'member';
  joined_at: string;
};

type DbItem = {
  id: string;
  list_id: string;
  name: string;
  quantity: string;
  note: string;
  category: Category;
  checked: boolean;
  added_by: string;
  added_by_name: string;
  checked_by: string | null;
  checked_by_name: string | null;
  created_at: string;
  updated_at: string;
};

function mapList(row: DbList): GroceryList {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    inviteToken: row.invite_token,
  };
}

function mapMember(row: DbMember): ListMember {
  return {
    listId: row.list_id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapItem(row: DbItem): GroceryItem {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    quantity: row.quantity,
    note: row.note,
    category: row.category,
    checked: row.checked,
    addedBy: row.added_by,
    addedByName: row.added_by_name,
    checkedBy: row.checked_by,
    checkedByName: row.checked_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function profileFromSession(
  client: SupabaseClient,
): Promise<UserProfile | null> {
  const { data } = await client.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const email = user.email ?? 'unknown@example.com';
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    email.split('@')[0] ||
    'Friend';
  return { id: user.id, email, displayName };
}

export function createSupabaseStore(url: string, anonKey: string): GroceryStore {
  const client = createClient(url, anonKey);
  const listeners = new Set<(event: ListChangeEvent) => void>();
  let channel: RealtimeChannel | null = null;

  const notify = (event: ListChangeEvent) => {
    for (const listener of listeners) listener(event);
  };

  const ensureChannel = () => {
    if (channel) return;
    channel = client
      .channel('trolley-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          const row = (payload.new ?? payload.old) as Partial<DbItem> | null;
          if (row?.list_id) notify({ type: 'items', listId: row.list_id });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        () => notify({ type: 'lists' }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_members' },
        (payload) => {
          const row = (payload.new ?? payload.old) as Partial<DbMember> | null;
          notify({ type: 'lists' });
          if (row?.list_id) notify({ type: 'members', listId: row.list_id });
        },
      )
      .subscribe();
  };

  return {
    mode: 'supabase',

    async getCurrentUser() {
      return profileFromSession(client);
    },

    async signInWithMagicLink(email: string) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      return { message: 'Check your email for a magic link to sign in.' };
    },

    async signInDemo() {
      throw new Error('Demo sign-in is only available in demo mode.');
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    onAuthChange(callback) {
      const { data } = client.auth.onAuthStateChange(() => {
        void profileFromSession(client).then(callback);
      });
      void profileFromSession(client).then(callback);
      return () => data.subscription.unsubscribe();
    },

    async listLists() {
      const { data, error } = await client
        .from('lists')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as DbList[]).map(mapList);
    },

    async createList(name: string) {
      const user = await profileFromSession(client);
      if (!user) throw new Error('You need to sign in first');
      const trimmed = name.trim();
      if (!trimmed) throw new Error('List name is required');

      const { data: list, error } = await client
        .from('lists')
        .insert({ name: trimmed, created_by: user.id })
        .select('*')
        .single();
      if (error) throw error;

      const { error: memberError } = await client.from('list_members').insert({
        list_id: (list as DbList).id,
        user_id: user.id,
        email: user.email,
        display_name: user.displayName,
        role: 'owner',
      });
      if (memberError) throw memberError;
      return mapList(list as DbList);
    },

    async renameList(listId: string, name: string) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('List name is required');
      const { data, error } = await client
        .from('lists')
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', listId)
        .select('*')
        .single();
      if (error) throw error;
      return mapList(data as DbList);
    },

    async deleteList(listId: string) {
      const { error } = await client.from('lists').delete().eq('id', listId);
      if (error) throw error;
    },

    async getList(listId: string) {
      const { data, error } = await client
        .from('lists')
        .select('*')
        .eq('id', listId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapList(data as DbList) : null;
    },

    async listMembers(listId: string) {
      const { data, error } = await client
        .from('list_members')
        .select('*')
        .eq('list_id', listId)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as DbMember[]).map(mapMember);
    },

    async joinListByInvite(listId: string, token: string) {
      const user = await profileFromSession(client);
      if (!user) throw new Error('You need to sign in first');

      const { data, error } = await client.rpc('join_list_by_invite', {
        p_list_id: listId,
        p_token: token,
        p_email: user.email,
        p_display_name: user.displayName,
      });
      if (error) throw error;
      return mapList(data as DbList);
    },

    async listItems(listId: string) {
      const { data, error } = await client
        .from('items')
        .select('*')
        .eq('list_id', listId)
        .order('checked', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as DbItem[]).map(mapItem);
    },

    async addItem(listId: string, input: CreateItemInput) {
      const user = await profileFromSession(client);
      if (!user) throw new Error('You need to sign in first');
      const name = input.name.trim();
      if (!name) throw new Error('Item name is required');

      const { data, error } = await client
        .from('items')
        .insert({
          list_id: listId,
          name,
          quantity: (input.quantity ?? '').trim() || '1',
          note: (input.note ?? '').trim(),
          category: input.category ?? 'Other',
          added_by: user.id,
          added_by_name: user.displayName,
        })
        .select('*')
        .single();
      if (error) throw error;

      await client
        .from('lists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', listId);

      return mapItem(data as DbItem);
    },

    async updateItem(itemId: string, input: UpdateItemInput) {
      const user = await profileFromSession(client);
      if (!user) throw new Error('You need to sign in first');

      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.name !== undefined) {
        const name = input.name.trim();
        if (!name) throw new Error('Item name is required');
        patch.name = name;
      }
      if (input.quantity !== undefined) patch.quantity = input.quantity.trim() || '1';
      if (input.note !== undefined) patch.note = input.note.trim();
      if (input.category !== undefined) patch.category = input.category;
      if (input.checked !== undefined) {
        patch.checked = input.checked;
        patch.checked_by = input.checked ? user.id : null;
        patch.checked_by_name = input.checked ? user.displayName : null;
      }

      const { data, error } = await client
        .from('items')
        .update(patch)
        .eq('id', itemId)
        .select('*')
        .single();
      if (error) throw error;

      const item = data as DbItem;
      await client
        .from('lists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', item.list_id);

      return mapItem(item);
    },

    async deleteItem(itemId: string) {
      const { data, error } = await client
        .from('items')
        .delete()
        .eq('id', itemId)
        .select('list_id')
        .maybeSingle();
      if (error) throw error;
      if (data?.list_id) {
        await client
          .from('lists')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.list_id);
      }
    },

    subscribe(callback) {
      listeners.add(callback);
      ensureChannel();
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0 && channel) {
          void client.removeChannel(channel);
          channel = null;
        }
      };
    },
  };
}
