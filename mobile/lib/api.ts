import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const ADMIN_TOKEN_KEY = "petpals_admin_token";

export function apiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  return typeof extra.apiUrl === "string" ? extra.apiUrl : "http://localhost:8787";
}

export function buildUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(apiBaseUrl(), path), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getAdminToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
}

export async function setAdminToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAdminToken();
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}