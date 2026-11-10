import { useState } from 'react';
import { CATEGORIES, type Category } from '../types/models';

export function AddItemForm({
  onAdd,
}: {
  onAdd: (input: {
    name: string;
    quantity: string;
    note: string;
    category: Category;
  }) => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await onAdd({ name, quantity, note, category });
          setName('');
          setQuantity('1');
          setNote('');
          setCategory('Other');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not add item');
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm font-semibold text-slate-900">Add an item</p>
      <div>
        <label htmlFor="new-item-name" className="mb-1 block text-xs font-medium text-slate-600">
          Name
        </label>
        <input
          id="new-item-name"
          className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
          placeholder="Milk, eggs, bread…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="new-item-qty" className="mb-1 block text-xs font-medium text-slate-600">
            Qty
          </label>
          <input
            id="new-item-qty"
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-item-cat" className="mb-1 block text-xs font-medium text-slate-600">
            Category
          </label>
          <select
            id="new-item-cat"
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="new-item-note" className="mb-1 block text-xs font-medium text-slate-600">
          Note
        </label>
        <input
          id="new-item-note"
          className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
          placeholder="Optional, e.g. oat please"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Add to list'}
      </button>
    </form>
  );
}
