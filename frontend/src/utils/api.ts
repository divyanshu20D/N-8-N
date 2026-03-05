import axios from "axios";

export const AUTH_STORAGE_KEY = "flowforge_auth";

type StoredAuth = {
  state?: {
    token?: string;
  };
  token?: string;
};

const getStoredToken = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed.state?.token ?? parsed.token ?? null;
  } catch {
    return null;
  }
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
