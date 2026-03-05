import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, AUTH_STORAGE_KEY } from "../utils/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const { data } = await api.post<AuthResponse>("/auth/login", {
          email,
          password,
        });
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      },
      register: async (name, email, password) => {
        const { data } = await api.post<AuthResponse>("/auth/register", {
          name,
          email,
          password,
        });
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
    },
  ),
);
