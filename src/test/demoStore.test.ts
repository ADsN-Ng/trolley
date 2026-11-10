import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoStore, resetDemoStorage } from '../data/demoStore';

describe('demo grocery store', () => {
  beforeEach(() => {
    resetDemoStorage();
    localStorage.clear();
  });

  it('seeds a starter list with items', async () => {
    const store = createDemoStore();
    const lists = await store.listLists();
    expect(lists.length).toBe(1);
    expect(lists[0]?.name).toBe('Flat groceries');

    const items = await store.listItems(lists[0]!.id);
    expect(items.map((i) => i.name)).toEqual(expect.arrayContaining(['Oat milk', 'Bananas']));
  });

  it('adds and ticks off an item with attribution', async () => {
    const store = createDemoStore();
    const [list] = await store.listLists();
    expect(list).toBeTruthy();

    const created = await store.addItem(list!.id, {
      name: 'Eggs',
      quantity: '12',
      category: 'Dairy',
      note: 'free range',
    });
    expect(created.name).toBe('Eggs');
    expect(created.checked).toBe(false);
    expect(created.addedByName).toBe('You');

    const checked = await store.updateItem(created.id, { checked: true });
    expect(checked.checked).toBe(true);
    expect(checked.checkedByName).toBe('You');

    const items = await store.listItems(list!.id);
    const eggs = items.find((i) => i.id === created.id);
    expect(eggs?.checked).toBe(true);
  });

  it('joins a list via invite token', async () => {
    const store = createDemoStore();
    const [list] = await store.listLists();
    expect(list).toBeTruthy();

    await store.signInWithMagicLink('sam@example.com');
    const joined = await store.joinListByInvite(list!.id, list!.inviteToken);
    expect(joined.id).toBe(list!.id);

    const members = await store.listMembers(list!.id);
    expect(members.some((m) => m.email === 'sam@example.com')).toBe(true);
  });

  it('rejects a bad invite token', async () => {
    const store = createDemoStore();
    const [list] = await store.listLists();
    await expect(store.joinListByInvite(list!.id, 'nope')).rejects.toThrow(/invalid/i);
  });
});
