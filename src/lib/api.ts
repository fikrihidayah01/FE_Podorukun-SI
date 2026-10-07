export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback);
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, config);

  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const success = refreshResponse.ok;
        isRefreshing = false;
        onRefreshed(success);
        
        if (!success) {
          // Refresh failed
          return response;
        }
      } catch (err) {
        isRefreshing = false;
        onRefreshed(false);
        return response;
      }
    }

    const refreshSucceeded = await new Promise<boolean>((resolve) => {
      addRefreshSubscriber(resolve);
    });

    if (refreshSucceeded) {
      // Retry the original request
      response = await fetch(url, config);
    }
  }

  return response;
}
