'use client';
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authApi, userApi } from '../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  preferences?: {
    travelStyle: string[];
    budget: string;
    interests: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false); // Prevent multiple concurrent loads

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    console.log('[AUTH] Init - savedToken:', !!savedToken, 'savedUser:', !!savedUser);
    if (savedUser) {
      console.log('[AUTH] Cached user:', JSON.parse(savedUser));
    }

    if (savedToken) {
      setToken(savedToken);
      // Restore user from cache immediately
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('[AUTH] Restoring cached user:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }
      // Then fetch fresh data
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    // Prevent multiple concurrent calls
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      console.log('[AUTH] loadUser - fetching profile...');
      const { data, error } = await userApi.getProfile();

      console.log('[AUTH] loadUser - API response:', { data, error });

      if (data && !error) {
        console.log('[AUTH] API data fields:', Object.keys(data));
        console.log('[AUTH] API data role:', (data as any).role);

        // Extract user fields the same way as in login
        const userData: User = {
          _id: (data as any)._id,
          name: (data as any).name,
          email: (data as any).email,
          role: (data as any).role,
          avatar: (data as any).avatar,
        };

        console.log('[AUTH] Setting user to:', userData);
        console.log('[AUTH] User role before cache:', userData.role);

        setUser(userData);
        // Cache user in localStorage
        const cacheData = JSON.stringify(userData);
        console.log('[AUTH] Caching user:', cacheData);
        localStorage.setItem('user', cacheData);

        // Verify what was actually cached
        const verification = localStorage.getItem('user');
        console.log('[AUTH] Verification - cached data:', verification);
      } else {
        console.log('[AUTH] loadUser error:', error);
        // Clear token if it's truly invalid (401), expired, or failed
        const isAuthError = error && (
          error.includes('401') ||
          error.includes('Unauthorized') ||
          error.includes('token failed') ||
          error.includes('Token expired') ||
          error.includes('no token') ||
          error.includes('Not authorized')
        );
        if (isAuthError) {
          console.log('[AUTH] Clearing token due to auth error');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      // Don't clear token on network/catch errors
      console.error('[AUTH] Error loading user profile:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await authApi.login({ email, password }) as { data?: User & { token: string }; error?: string };
    console.log('[AUTH] login response:', { data, error });

    if (data && !error) {
      console.log('[AUTH] login - data.role:', data.role);
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, avatar: data.avatar };
      console.log('[AUTH] login - userData to cache:', userData);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Verify what was cached
      const cached = localStorage.getItem('user');
      console.log('[AUTH] login - verified cached user:', cached);

      setToken(data.token);
      setUser(userData);
      console.log('[AUTH] login - state set to:', userData);
      return { success: true };
    }
    console.log('[AUTH] login failed:', error);
    return { success: false, error: error || 'Login failed' };
  };

  const loginWithGoogle = async (idToken: string) => {
    const { data, error } = await authApi.googleLogin(idToken) as { data?: User & { token: string }; error?: string };
    console.log('[AUTH] googleLogin response:', { data, error });

    if (data && !error) {
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, avatar: data.avatar };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(data.token);
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: error || 'Google login failed' };
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await authApi.register({ name, email, password }) as { data?: User & { token: string }; error?: string };
    if (data && !error) {
      const userData = { _id: data._id, name: data.name, email: data.email, role: data.role, avatar: data.avatar };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(data.token);
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: error || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
