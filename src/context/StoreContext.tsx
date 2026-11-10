import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getStore, type GroceryStore } from '../data';
import type { UserProfile } from '../types/models';

type StoreContextValue = {
  store: GroceryStore;
  user: UserProfile | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => getStore(), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = store.onAuthChange((next) => {
      setUser(next);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [store]);

  const value = useMemo<StoreContextValue>(
    () => ({
      store,
      user,
      authLoading,
      refreshUser: async () => {
        setUser(await store.getCurrentUser());
      },
    }),
    [store, user, authLoading],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used inside StoreProvider');
  return ctx;
}
