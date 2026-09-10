import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { adminFetch, getAdminToken, setAdminToken } from "./api";

export function parseLoginResponse(value: unknown): { token: string; email: string } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.token !== "string" || typeof v.email !== "string") return null;
  return { token: v.token, email: v.email };
}

type AdminSessionValue = {
  email: string | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionValue>({
  email: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAdminToken();
      if (token) {
        try {
          const me = await adminFetch<{ email: string }>("/auth/admin/me");
          setEmail(me.email);
        } catch {
          await setAdminToken(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (loginEmail: string, password: string) => {
    const res = await adminFetch<unknown>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email: loginEmail, password }),
    });
    const parsed = parseLoginResponse(res);
    if (!parsed) throw new Error("Invalid response");
    await setAdminToken(parsed.token);
    setEmail(parsed.email);
  }, []);

  const signOut = useCallback(async () => {
    await setAdminToken(null);
    setEmail(null);
  }, []);

  return (
    <AdminSessionContext.Provider value={{ email, ready, signIn, signOut }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}