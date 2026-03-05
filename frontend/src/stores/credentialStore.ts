import { create } from "zustand";
import { api } from "../utils/api";

export type CredentialStatus = "never_tested" | "passed" | "failed";

export interface Credential {
  id: string;
  name: string;
  provider: string;
  status: CredentialStatus;
  lastTestedAt: number | null;
  lastTestError: string | null;
  createdAt: number;
  updatedAt: number;
}

interface CredentialStore {
  credentials: Credential[];
  isLoading: boolean;
  error: string | null;
  loadCredentials: () => Promise<void>;
  addCredential: (
    credential: {
      name: string;
      provider: string;
      data: Record<string, string>;
    },
  ) => Promise<void>;
  updateCredential: (
    id: string,
    updates: Partial<Pick<Credential, "name" | "provider">>,
  ) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  testCredential: (id: string) => Promise<void>;
}

const normalizeCredential = (credential: Credential): Credential => ({
  ...credential,
  lastTestedAt: credential.lastTestedAt ?? null,
  lastTestError: credential.lastTestError ?? null,
});

export const useCredentialStore = create<CredentialStore>((set) => ({
  credentials: [],
  isLoading: false,
  error: null,
  loadCredentials: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<Credential[]>("/credentials");
      set({
        credentials: data.map(normalizeCredential),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message ?? "Failed to load credentials",
      });
      throw error;
    }
  },
  addCredential: async (credential) => {
    try {
      await api.post("/credentials", credential);
      const { data } = await api.get<Credential[]>("/credentials");
      set({
        credentials: data.map(normalizeCredential),
        error: null,
      });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? "Failed to create credential" });
      throw error;
    }
  },
  updateCredential: async (id, updates) => {
    try {
      await api.put(`/credentials/${id}`, updates);
      const { data } = await api.get<Credential[]>("/credentials");
      set({
        credentials: data.map(normalizeCredential),
        error: null,
      });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? "Failed to update credential" });
      throw error;
    }
  },
  deleteCredential: async (id) => {
    try {
      await api.delete(`/credentials/${id}`);
      const { data } = await api.get<Credential[]>("/credentials");
      set({
        credentials: data.map(normalizeCredential),
        error: null,
      });
    } catch (error: any) {
      set({ error: error?.response?.data?.message ?? "Failed to delete credential" });
      throw error;
    }
  },
  testCredential: async (id) => {
    try {
      const { data } = await api.post<{
        credential: Credential;
      }>(`/credentials/${id}/test`, {});
      const updatedCredential = normalizeCredential(data.credential);
      set((state) => ({
        credentials: state.credentials.map((c) =>
          c.id === id ? updatedCredential : c,
        ),
        error: null,
      }));
    } catch (error: any) {
      const fallbackMessage =
        error?.response?.data?.result?.message ??
        error?.response?.data?.message ??
        "Failed to test credential";
      const responseCredential = error?.response?.data?.credential as
        | Credential
        | undefined;

      set((state) => ({
        credentials: responseCredential
          ? state.credentials.map((c) =>
              c.id === id ? normalizeCredential(responseCredential) : c,
            )
          : state.credentials,
        error: fallbackMessage,
      }));
      throw error;
    }
  },
}));
