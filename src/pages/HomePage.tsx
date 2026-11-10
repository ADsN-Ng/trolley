import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ListCard } from '../components/ListCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { useStoreContext } from '../context/StoreContext';
import type { GroceryList } from '../types/models';

export function HomePage() {
  const { store, user, authLoading } = useStoreContext();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLists(await store.listLists());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lists');
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
    return store.subscribe((event) => {
      if (event.type === 'lists') void refresh();
    });
  }, [store, refresh, authLoading]);

  if (authLoading || loading) {
    return (
      <Layout>
        <LoadingState label="Loading your lists…" />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mb-5 rounded-2xl bg-emerald-600 px-5 py-5 text-white shadow-sm">
        <h1 className="text-xl font-semibold">My lists</h1>
        <p className="mt-1 text-sm text-emerald-50">
          Share a list with friends and tick things off together in the shop.
        </p>
        {user ? (
          <p className="mt-3 text-xs text-emerald-100">Signed in as {user.displayName}</p>
        ) : null}
      </section>

      <form
        className="mb-5 flex gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!newName.trim()) return;
          setCreating(true);
          setError(null);
          try {
            await store.createList(newName);
            setNewName('');
            await refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create list');
          } finally {
            setCreating(false);
          }
        }}
      >
        <label htmlFor="new-list-name" className="sr-only">
          New list name
        </label>
        <input
          id="new-list-name"
          className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3"
          placeholder="New list name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating}
          className="min-h-12 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {creating ? '…' : 'Create'}
        </button>
      </form>

      {error ? (
        <p className="mb-4 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create one above, then invite a friend with the share link."
        />
      ) : (
        <ul className="space-y-3">
          {lists.map((list) => (
            <li key={list.id}>
              <ListCard
                list={list}
                onRename={async (target) => {
                  const next = window.prompt('Rename list', target.name);
                  if (!next || next.trim() === target.name) return;
                  try {
                    await store.renameList(target.id, next);
                    await refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not rename');
                  }
                }}
                onDelete={async (target) => {
                  if (!window.confirm(`Delete “${target.name}”? This cannot be undone.`)) return;
                  try {
                    await store.deleteList(target.id);
                    await refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not delete');
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
