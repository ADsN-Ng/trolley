import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useStoreContext } from '../context/StoreContext';
import { LoadingState } from '../components/LoadingState';

export function LoginPage() {
  const { store, user, authLoading } = useStoreContext();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  if (user && store.mode === 'demo') {
    return <Navigate to="/" replace />;
  }

  if (user && store.mode === 'supabase') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout title="Sign in">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Welcome to Trolley</h1>
        <p className="mt-2 text-sm text-slate-600">
          Shared grocery lists that update live while you shop.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            setMessage(null);
            try {
              if (store.mode === 'demo') {
                await store.signInDemo(email.split('@')[0] || 'You');
              } else {
                const result = await store.signInWithMagicLink(email);
                setMessage(result.message);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not sign in');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-slate-600">
              {store.mode === 'demo' ? 'Display name or email' : 'Email'}
            </label>
            <input
              id="login-email"
              type={store.mode === 'demo' ? 'text' : 'email'}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
              placeholder={store.mode === 'demo' ? 'You' : 'you@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={store.mode !== 'demo'}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Working…' : store.mode === 'demo' ? 'Continue in demo mode' : 'Send magic link'}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </Layout>
  );
}
