import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, type User } from '@/services/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, storedUser] = await AsyncStorage.multiGet(['token', 'user']);
        if (token[1]) {
          if (storedUser[1]) setUser(JSON.parse(storedUser[1]));
          const me = await api.auth.me().catch(() => null);
          if (me?.user) {
            setUser(me.user);
            await AsyncStorage.setItem('user', JSON.stringify(me.user));
          }
        }
      } catch (err) {
        console.warn('Auth restore error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (token: string, u: User) => {
    await AsyncStorage.multiSet([
      ['token', token],
      ['user', JSON.stringify(u)],
    ]);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    await persist(res.token, res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.auth.register({ name, email, password, role: 'customer' });
    await persist(res.token, res.user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
