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
 * Attempt a silent token refresh.
 * Backend accepts refreshToken in JSON body OR via HttpOnly cookie.
 * We send both: body (for localhost dev where Secure cookies don't work over HTTP)
 * and credentials:include (for production where cookies are available).
 */
export async function tryRefresh(): Promise<string | null> {
  const storedRefreshToken = getRefreshToken();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      // Send refreshToken in body so localhost dev works (Secure cookies are blocked on HTTP).
      // Backend also accepts cookie, so production still works correctly.
      ...(storedRefreshToken
        ? {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          }
        : {}),
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

  // Only set Content-Type: application/json when there is actually a body to send.
  // Sending Content-Type without a body causes a 400 on the backend.
  const hasBody = options.body !== undefined && options.body !== null;
  if (!headers.has('Content-Type') && hasBody && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Always inject Bearer token from localStorage if available
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

  // On 401, attempt a single silent refresh then replay the request
  const isAuthEndpoint =
    cleanEndpoint.includes('/auth/refresh') || cleanEndpoint.includes('/auth/login');

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

      // Refresh failed — clear tokens, user will be redirected to login by RoleGuard
      clearTokens();
      return response;
    } else {
      // Another request already triggered a refresh — wait for it to complete
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
