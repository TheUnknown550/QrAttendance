import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, AuthResponse } from "../types/api";

const AUTH_STORAGE_KEY = "event-qr-attendance-auth";
const PENDING_INVITE_STORAGE_KEY = "event-qr-attendance-pending-invite";
const AUTH_CHANGED_EVENT = "eventqr:auth-changed";
const apiBaseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<AuthResponse> | null = null;

function normalizeStoredAuth(value: unknown): AuthResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<AuthResponse> & {
    user?: { id?: unknown; name?: unknown; email?: unknown };
  };

  if (
    typeof candidate.token !== "string" ||
    !candidate.user ||
    typeof candidate.user.id !== "string" ||
    typeof candidate.user.name !== "string" ||
    typeof candidate.user.email !== "string"
  ) {
    return null;
  }

  return {
    token: candidate.token,
    user: {
      id: candidate.user.id,
      name: candidate.user.name,
      email: candidate.user.email,
    },
    memberships: Array.isArray(candidate.memberships) ? candidate.memberships : [],
    activeOrganizationId:
      typeof candidate.activeOrganizationId === "string" ? candidate.activeOrganizationId : null,
  };
}

export function getStoredAuth() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const normalized = normalizeStoredAuth(JSON.parse(raw));

    if (!normalized) {
      clearStoredAuth();
    }

    return normalized;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function setStoredAuth(value: unknown) {
  const normalized = normalizeStoredAuth(value);

  if (!normalized) {
    clearStoredAuth();
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function dispatchAuthChange(auth: AuthResponse | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AuthResponse | null>(AUTH_CHANGED_EVENT, { detail: auth }));
}

export function syncAuthState(auth: AuthResponse | null) {
  if (auth) {
    setStoredAuth(auth);
  } else {
    clearStoredAuth();
  }

  dispatchAuthChange(auth);
}

export function subscribeToAuthChanges(listener: (auth: AuthResponse | null) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = (event: Event) => {
    listener((event as CustomEvent<AuthResponse | null>).detail ?? null);
  };

  window.addEventListener(AUTH_CHANGED_EVENT, handleChange);

  return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleChange);
}

function decodeTokenPayload(token: string) {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const decoded = JSON.parse(window.atob(paddedPayload)) as { exp?: unknown };

    return decoded;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, bufferMs = 0) {
  const payload = decodeTokenPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + bufferMs;
}

function isPublicAuthRoute(url?: string) {
  return Boolean(
    url &&
      [
        "/auth/login",
        "/auth/register",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/refresh",
      ].some((path) => url.startsWith(path)),
  );
}

const refreshClient = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const currentAuth = getStoredAuth();

      try {
        const auth = unwrapResponse<AuthResponse>(
          await refreshClient.post("/auth/refresh", {
            ...(currentAuth ? { activeOrganizationId: currentAuth.activeOrganizationId } : {}),
          }),
        );
        syncAuthState(auth);
        return auth;
      } catch (error) {
        syncAuthState(null);
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function logoutSession() {
  try {
    await refreshClient.post("/auth/logout");
  } finally {
    syncAuthState(null);
  }
}

export function getPendingInviteToken() {
  return window.localStorage.getItem(PENDING_INVITE_STORAGE_KEY);
}

export function setPendingInviteToken(token: string) {
  window.localStorage.setItem(PENDING_INVITE_STORAGE_KEY, token);
}

export function clearPendingInviteToken() {
  window.localStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
}

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (isPublicAuthRoute(config.url)) {
    return config;
  }

  const auth = getStoredAuth();

  if (auth?.token && isTokenExpired(auth.token, 30_000)) {
    try {
      const refreshedAuth = await refreshSession();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${refreshedAuth.token}`;
      return config;
    } catch {
      return config;
    }
  }

  if (auth?.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as AuthRequestConfig | undefined;

    if (!originalRequest || originalRequest._retry || isPublicAuthRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshedAuth = await refreshSession();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedAuth.token}`;
      return api.request(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);

export function unwrapResponse<T>(response: { data: ApiResponse<T> }) {
  return response.data.data;
}

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

export { AUTH_STORAGE_KEY, PENDING_INVITE_STORAGE_KEY };
