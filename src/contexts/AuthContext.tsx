import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthChange, signInWithGoogle, signOut, type User } from "@/lib/firebase";
import { createFirestoreApi } from "@/lib/firestoreData";
import { setStudioApi } from "@/lib/studioApi";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  api: ReturnType<typeof createFirestoreApi> | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
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

  const login = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // The onAuthChange listener will update user & api
    } catch (err) {
      console.error("Login failed:", err);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    await signOut();
    // onAuthChange will set user=null, api=null
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}