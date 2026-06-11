import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthChange, signIn, signUp, signOut as firebaseSignOut, type User } from "@/lib/firebase";
import { createFirestoreApi } from "@/lib/firestoreData";
import { setStudioApi } from "@/lib/studioApi";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  api: ReturnType<typeof createFirestoreApi> | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  api: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<ReturnType<typeof createFirestoreApi> | null>(null);

  useEffect(() => {
    const unsub = onAuthChange((fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        const firestoreApi = createFirestoreApi(fbUser.uid);
        setApi(firestoreApi);
        setStudioApi(firestoreApi);
      } else {
        setApi(null);
        setStudioApi(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    await firebaseSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}