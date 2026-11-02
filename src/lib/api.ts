import { ApiError, apiErrorFromBody, notifyError, rememberApiError, statusMessage } from './errors';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

// API selalu memakai token eksplisit (Bearer token di localStorage) tanpa cookie agar kompatibel lintas-origin.
export const API_CREDENTIALS: RequestCredentials = 'omit';

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
 * We send refreshToken in JSON body using explicit tokens (credentials: 'omit').
 */
export async function tryRefresh(): Promise<string | null> {
  const storedRefreshToken = getRefreshToken();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: API_CREDENTIALS,
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

export interface ApiRequestInit extends RequestInit {
  /** true = jangan tampilkan toast global untuk galat sistem (pemanggil menangani sendiri). */
  silent?: boolean;
}

export const SESSION_EXPIRED_EVENT = 'si:session-expired';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/me', '/auth/logout'];

/**
 * Lakukan fetch; galat jaringan diubah menjadi ApiError (status 0) yang berpesan jelas.
 * AbortError dilempar apa adanya supaya pembatalan tidak dianggap galat.
 */
async function send(url: string, config: RequestInit): Promise<Response> {
  try {
    return await fetch(url, config);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', summary: statusMessage(0) });
  }
}

/**
 * Untuk respons gagal: baca body sekali, bentuk ApiError, lalu kembalikan Response baru berisi
 * JSON standar `{ success:false, message, code, errors, requestId }`. Dengan begitu kode lama
 * yang membaca `body.message` tetap mendapat pesan rinci, termasuk saat proxy membalas HTML.
 */
async function normalizeFailure(response: Response): Promise<{ response: Response; error: ApiError }> {
  const requestId = response.headers.get('x-request-id') ?? undefined;
  const text = await response.text().catch(() => '');
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* bukan JSON, mis. halaman 502 dari nginx */ }
  const error = apiErrorFromBody(response.status, body, requestId);
  const original = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const normalized = new Response(
    JSON.stringify({
      ...original,
      success: false,
      message: error.message,
      code: error.code,
      errors: error.details,
      requestId: error.requestId,
    }),
    { status: response.status, statusText: response.statusText, headers: { 'Content-Type': 'application/json' } },
  );
  rememberApiError(normalized, error);
  return { response: normalized, error };
}

export async function fetchApi(endpoint: string, options: ApiRequestInit = {}): Promise<Response> {
  const { silent = false, ...init } = options;
  const apiPath = new URL(API_BASE_URL, window.location.origin).pathname.replace(/\/$/, '');
  const normalized = endpoint.startsWith(`${apiPath}/`) ? endpoint.slice(apiPath.length) : endpoint;
  const cleanEndpoint = normalized.startsWith('/') ? normalized : `/${normalized}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => cleanEndpoint.startsWith(p));

  const headers = new Headers(init.headers || {});

  // Only set Content-Type: application/json when there is actually a body to send.
  // Sending Content-Type without a body causes a 400 on the backend.
  const hasBody = init.body !== undefined && init.body !== null;
  if (!headers.has('Content-Type') && hasBody && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Always inject Bearer token from localStorage if available
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...init,
    headers,
    credentials: API_CREDENTIALS,
  };

  let response: Response;
  let sessionExpired = false;
  try {
    response = await send(url, config);

    // On 401, attempt a single silent refresh then replay the request
    if (response.status === 401 && !isAuthEndpoint) {
      let newAccessToken: string | null;
      if (!isRefreshing) {
        isRefreshing = true;
        newAccessToken = await tryRefresh();
        isRefreshing = false;
        onRefreshed(newAccessToken);
      } else {
        // Another request already triggered a refresh — wait for it to complete
        newAccessToken = await new Promise<string | null>((resolve) => addRefreshSubscriber(resolve));
      }

      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await send(url, { ...config, headers });
      } else {
        sessionExpired = true;
      }
    }
  } catch (err) {
    if (err instanceof ApiError && !silent) notifyError(err);
    throw err;
  }

  if (response.ok || response.status < 400) return response;

  const failure = await normalizeFailure(response);
  if (sessionExpired || (response.status === 401 && !isAuthEndpoint)) {
    // Refresh gagal: bersihkan token dan beri tahu authStore supaya diarahkan ke halaman login.
    clearTokens();
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    if (!silent) notifyError(new ApiError({ status: 401, code: 'SESSION_EXPIRED', summary: statusMessage(401) }));
    failure.error.notified = true;
  } else if (!silent && !isAuthEndpoint && failure.error.isSystem) {
    notifyError(failure.error);
  }
  return failure.response;
}
