import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ItemRow } from '../components/ItemRow';
import { AddItemForm } from '../components/AddItemForm';
import { useStoreContext } from '../context/StoreContext';
import { CATEGORIES, type GroceryItem, type GroceryList, type ListMember } from '../types/models';

export function ListPage() {
  const { listId = '' } = useParams();
  const { store } = useStoreContext();
  const [list, setList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [members, setMembers] = useState<ListMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    if (!listId) return;
    try {
      setError(null);
      const [nextList, nextItems, nextMembers] = await Promise.all([
        store.getList(listId),
        store.listItems(listId),
        store.listMembers(listId),
      ]);
      setList(nextList);
      setItems(nextItems);
      setMembers(nextMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load list');
    } finally {
      setLoading(false);
    }
  }, [store, listId]);

  useEffect(() => {
    void refresh();
    return store.subscribe((event) => {
      if (event.type === 'lists') void refresh();
      if (event.type === 'items' && event.listId === listId) void refresh();
      if (event.type === 'members' && event.listId === listId) void refresh();
    });
  }, [store, listId, refresh]);

  const grouped = useMemo(() => {
    const open = items.filter((i) => !i.checked);
    const done = items.filter((i) => i.checked);
    const byCategory = CATEGORIES.map((category) => ({
      category,
      items: open.filter((i) => i.category === category),
    })).filter((group) => group.items.length > 0);
    return { byCategory, done };
  }, [items]);

  const inviteUrl =
    list && typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${list.id}/${list.inviteToken}`
      : '';

  if (loading) {
    return (
      <Layout>
        <LoadingState label="Opening list…" />
      </Layout>
    );
  }

  if (!list) {
    return (
      <Layout>
        <EmptyState
          title="List not found"
          description="You might need an invite link, or the list was deleted."
          action={
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white no-underline"
            >
              Back to my lists
            </Link>
          }
        />
      </Layout>
    );
  }

  return (
    <Layout
      title={list.name}
      actions={
        <Link
          to="/"
          className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600 no-underline hover:bg-slate-100"
        >
          Lists
        </Link>
      }
    >
      <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{list.name}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {members.length} member{members.length === 1 ? '' : 's'}
              {members.length > 0
                ? ` · ${members.map((m) => m.displayName).join(', ')}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                window.prompt('Copy this invite link', inviteUrl);
              }
            }}
          >
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>
        </div>
      </section>

      {error ? (
        <p className="mb-4 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-5">
        <AddItemForm
          onAdd={async (input) => {
            await store.addItem(list.id, input);
            await refresh();
          }}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="List is empty"
          description="Add milk, eggs, or whatever you need. Friends will see updates live."
        />
      ) : (
        <div className="space-y-6">
          {grouped.byCategory.map((group) => (
            <section key={group.category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.category}
              </h2>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={async (target) => {
                      await store.updateItem(target.id, { checked: !target.checked });
                      await refresh();
                    }}
                    onDelete={async (target) => {
                      if (!window.confirm(`Remove “${target.name}”?`)) return;
                      await store.deleteItem(target.id);
                      await refresh();
                    }}
                    onSave={async (target, patch) => {
                      await store.updateItem(target.id, patch);
                      await refresh();
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}

          {grouped.done.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bought ({grouped.done.length})
              </h2>
              <ul className="space-y-2">
                {grouped.done.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={async (target) => {
                      await store.updateItem(target.id, { checked: !target.checked });
                      await refresh();
                    }}
                    onDelete={async (target) => {
                      if (!window.confirm(`Remove “${target.name}”?`)) return;
                      await store.deleteItem(target.id);
                      await refresh();
                    }}
                    onSave={async (target, patch) => {
                      await store.updateItem(target.id, patch);
                      await refresh();
                    }}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Layout>
  );
}
