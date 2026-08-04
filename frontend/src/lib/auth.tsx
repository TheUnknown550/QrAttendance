import {
  createContext,
  useEffect,
  startTransition,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredAuth,
  isTokenExpired,
  logoutSession,
  refreshSession,
  subscribeToAuthChanges,
  syncAuthState,
} from "./api";
import type { AuthResponse, Membership } from "../types/api";

type AuthContextValue = {
  auth: AuthResponse | null;
  isInitializing: boolean;
  login: (state: AuthResponse) => void;
  setAuthState: (state: AuthResponse) => void;
  logout: () => void;
  activeMembership: Membership | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth());
  const [isInitializing, setIsInitializing] = useState(true);

  const activeMembership =
    auth?.memberships.find((membership) => membership.organizationId === auth.activeOrganizationId) ?? null;

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextAuth) => {
      startTransition(() => setAuth(nextAuth));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedAuth = getStoredAuth();

      if (storedAuth?.token && !isTokenExpired(storedAuth.token, 30_000)) {
        setIsInitializing(false);
        return;
      }

      try {
        const refreshedAuth = await refreshSession();

        if (!cancelled) {
          startTransition(() => setAuth(refreshedAuth));
        }
      } catch {
        if (!cancelled) {
          startTransition(() => setAuth(null));
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      isInitializing,
      activeMembership,
      login: (state) => {
        syncAuthState(state);
        startTransition(() => setAuth(state));
      },
      setAuthState: (state) => {
        syncAuthState(state);
        startTransition(() => setAuth(state));
      },
      logout: () => {
        void logoutSession();
        startTransition(() => setAuth(null));
      },
    }),
    [activeMembership, auth, isInitializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
