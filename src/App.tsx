import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { StoreProvider, useStoreContext } from './context/StoreContext';
import { HomePage } from './pages/HomePage';
import { ListPage } from './pages/ListPage';
import { InvitePage } from './pages/InvitePage';
import { LoginPage } from './pages/LoginPage';
import { LoadingState } from './components/LoadingState';
import { Layout } from './components/Layout';

function RequireAuth({ children }: { children: ReactNode }) {
  const { store, user, authLoading } = useStoreContext();

  if (authLoading) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  // Demo mode always has a local user. Supabase needs a real session.
  if (store.mode === 'supabase' && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:listId/:token" element={<InvitePage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/lists/:listId"
          element={
            <RequireAuth>
              <ListPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
}
