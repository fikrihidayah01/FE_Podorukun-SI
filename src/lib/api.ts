export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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

let isRefreshing = false;
let refreshSubscribers: ((newToken: string | null) => void)[] = [];

function onRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (newToken: string | null) => void) {
  refreshSubscribers.push(callback);
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

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

  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    const refreshToken = getRefreshToken();

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: refreshToken || undefined }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData?.data?.accessToken || refreshData?.accessToken;
          const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken;

          if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken);
            isRefreshing = false;
            onRefreshed(newAccessToken);
            
            headers.set('Authorization', `Bearer ${newAccessToken}`);
            return await fetch(url, { ...config, headers });
          }
        }
      } catch (err) {
        // Fallthrough
      }
      clearTokens();
      isRefreshing = false;
      onRefreshed(null);
      return response;
    } else {
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
