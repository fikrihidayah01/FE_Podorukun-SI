export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export function getAccessToken(): string | null {
  return localStorage.getItem('si_access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('si_refresh_token');
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('si_access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('si_refresh_token', refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem('si_access_token');
  localStorage.removeItem('si_refresh_token');
}

/**
 * Attempt a token refresh.
 * Backend uses HttpOnly cookies (si_refresh_token) — no body or Content-Type needed.
 * Returns the new access token string, or null if refresh failed.
 */
export async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      // No Content-Type, no body — backend reads si_refresh_token cookie only
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data?.data?.accessToken || data?.accessToken;
    const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;

    if (newAccessToken) {
      setTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string | null) => void)[] = [];

function onRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (newToken: string | null) => void) {
  refreshSubscribers.push(callback);
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  // Only set Content-Type for JSON requests (not FormData, not the refresh endpoint)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Always inject Bearer token from localStorage if we have one
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, config);

  // If 401 (expired token), attempt a single refresh cycle
  const isAuthEndpoint = cleanEndpoint.includes('/auth/refresh') || cleanEndpoint.includes('/auth/login');
  if (response.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;

      const newAccessToken = await tryRefresh();

      isRefreshing = false;
      onRefreshed(newAccessToken);

      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return await fetch(url, { ...config, headers });
      }

      // Refresh failed — clear tokens so user is prompted to log in
      clearTokens();
      return response;
    } else {
      // Another request is already refreshing — wait for it
      const newAccessToken = await new Promise<string | null>((resolve) => {
        addRefreshSubscriber(resolve);
      });

      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return await fetch(url, { ...config, headers });
      }
    }
  }

  return response;
}
