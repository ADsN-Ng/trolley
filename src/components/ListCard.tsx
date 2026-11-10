import { Link } from 'react-router-dom';
import type { GroceryList } from '../types/models';
import { relativeTime } from '../lib/format';

export function ListCard({
  list,
  onRename,
  onDelete,
}: {
  list: GroceryList;
  onRename: (list: GroceryList) => void;
  onDelete: (list: GroceryList) => void;
}) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/lists/${list.id}`}
            className="block truncate text-base font-semibold text-slate-900 no-underline hover:text-emerald-700"
          >
            {list.name}
          </Link>
          <p className="mt-1 text-xs text-slate-500">Updated {relativeTime(list.updatedAt)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => onRename(list)}
            aria-label={`Rename ${list.name}`}
          >
            Rename
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl px-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
            onClick={() => onDelete(list)}
            aria-label={`Delete ${list.name}`}
          >
            Delete
          </button>
        </div>
      </div>
      <Link
        to={`/lists/${list.id}`}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-800 no-underline hover:bg-emerald-100"
      >
        Open list
      </Link>
    </article>
  );
}
