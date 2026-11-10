import { useState } from 'react';
import type { GroceryItem } from '../types/models';
import { CATEGORIES } from '../types/models';

export function ItemRow({
  item,
  onToggle,
  onDelete,
  onSave,
}: {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
  onSave: (
    item: GroceryItem,
    patch: { name: string; quantity: string; note: string; category: GroceryItem['category'] },
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [note, setNote] = useState(item.note);
  const [category, setCategory] = useState(item.category);

  if (editing) {
    return (
      <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(item, { name, quantity, note, category });
            setEditing(false);
          }}
        >
          <div>
            <label htmlFor={`name-${item.id}`} className="mb-1 block text-xs font-medium text-slate-600">
              Item
            </label>
            <input
              id={`name-${item.id}`}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`qty-${item.id}`}
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Qty
              </label>
              <input
                id={`qty-${item.id}`}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor={`cat-${item.id}`}
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Category
              </label>
              <select
                id={`cat-${item.id}`}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                value={category}
                onChange={(e) => setCategory(e.target.value as GroceryItem['category'])}
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
            <label htmlFor={`note-${item.id}`} className="mb-1 block text-xs font-medium text-slate-600">
              Note
            </label>
            <input
              id={`note-${item.id}`}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setName(item.name);
                setQuantity(item.quantity);
                setNote(item.note);
                setCategory(item.category);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 ${
        item.checked ? 'opacity-70' : ''
      }`}
    >
      <button
        type="button"
        aria-label={item.checked ? `Mark ${item.name} as needed` : `Tick off ${item.name}`}
        aria-pressed={item.checked}
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-lg ${
          item.checked
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-300 bg-white text-transparent hover:border-emerald-500'
        }`}
        onClick={() => onToggle(item)}
      >
        ✓
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`truncate text-base font-medium text-slate-900 ${
                item.checked ? 'line-through' : ''
              }`}
            >
              {item.name}
              {item.quantity ? (
                <span className="ml-2 text-sm font-normal text-slate-500">× {item.quantity}</span>
              ) : null}
            </p>
            {item.note ? <p className="mt-0.5 truncate text-sm text-slate-500">{item.note}</p> : null}
            <p className="mt-1 text-xs text-slate-400">
              Added by {item.addedByName}
              {item.checked && item.checkedByName ? ` · bought by ${item.checkedByName}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              className="min-h-10 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${item.name}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="min-h-10 rounded-lg px-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
