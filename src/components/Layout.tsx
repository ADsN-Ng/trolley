import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStoreContext } from '../context/StoreContext';

export function Layout({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}) {
  const { store, user } = useStoreContext();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-10 pt-4">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/" className="inline-flex items-center gap-2 no-underline">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white"
            >
              🛒
            </span>
            <span className="truncate text-lg font-semibold text-slate-900">
              {title ?? 'Trolley'}
            </span>
          </Link>
          {store.mode === 'demo' && (
            <p className="mt-1 text-xs text-amber-700">
              Demo mode · data stays in this browser
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {user && (
            <span
              className="hidden rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 sm:inline"
              title={user.email}
            >
              {user.displayName}
            </span>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
