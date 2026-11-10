import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LoadingState } from '../components/LoadingState';
import { useStoreContext } from '../context/StoreContext';

export function InvitePage() {
  const { listId = '', token = '' } = useParams();
  const { store, user, authLoading } = useStoreContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      setJoining(true);
      setError(null);
      try {
        await store.joinListByInvite(listId, token);
        if (!cancelled) navigate(`/lists/${listId}`, { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not join list');
          setJoining(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, store, listId, token, navigate]);

  if (authLoading || (user && joining && !error)) {
    return (
      <Layout>
        <LoadingState label="Joining list…" />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Join a list">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-lg font-semibold text-slate-900">You&apos;re invited</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to join this shared grocery list.
            {store.mode === 'demo'
              ? ' Demo mode signs you in locally, no email needed.'
              : ' We will email you a magic link.'}
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setMessage(null);
              setError(null);
              try {
                if (store.mode === 'demo') {
                  await store.signInWithMagicLink(email || 'friend@example.com');
                } else {
                  const result = await store.signInWithMagicLink(email);
                  setMessage(result.message);
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not sign in');
              }
            }}
          >
            <div>
              <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                required={store.mode !== 'demo'}
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
            >
              {store.mode === 'demo' ? 'Continue' : 'Send magic link'}
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

  return (
    <Layout title="Invite">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {error ? (
          <>
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white no-underline"
            >
              Back to my lists
            </Link>
          </>
        ) : (
          <LoadingState label="Joining list…" />
        )}
      </div>
    </Layout>
  );
}
