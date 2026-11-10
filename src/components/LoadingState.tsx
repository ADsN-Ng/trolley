export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl bg-white px-4 py-10 text-sm text-slate-600 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
        aria-hidden
      />
      {label}
    </div>
  );
}
