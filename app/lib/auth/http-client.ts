import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
  type StoredAccessToken,
} from './token-storage';

interface TokenResponse {
  token: string;
}

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

let tokenRefreshPromise: Promise<StoredAccessToken | null> | null = null;

async function requestTokenFromSessionCookie(): Promise<StoredAccessToken | null> {
  const response = await fetch('/api/auth/token', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as TokenResponse;
  if (!payload.token) {
    return null;
  }

  return setStoredAccessToken(payload.token);
}

export async function bootstrapAccessTokenFromSession(): Promise<StoredAccessToken | null> {
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = requestTokenFromSessionCookie().finally(() => {
      tokenRefreshPromise = null;
    });
  }

  return tokenRefreshPromise;
}

function mergeHeaders(initHeaders: HeadersInit | undefined, token: string | null): Headers {
  const headers = new Headers(initHeaders);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function tryParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token = getStoredAccessToken();
  if (!token) {
    token = await bootstrapAccessTokenFromSession();
  }

  const requestInit: RequestInit = {
    ...init,
    cache: init?.cache ?? 'no-store',
    headers: mergeHeaders(init?.headers, token?.token ?? null),
  };

  let response = await fetch(input, requestInit);

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await bootstrapAccessTokenFromSession();
  if (!refreshedToken) {
    clearStoredAccessToken();
    return response;
  }

  response = await fetch(input, {
    ...requestInit,
    headers: mergeHeaders(init?.headers, refreshedToken.token),
  });

  if (response.status === 401) {
    clearStoredAccessToken();
  }

  return response;
}

export async function authJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await authFetch(input, init);
  const payload = await tryParseJson(response);

  if (!response.ok) {
    const apiError = payload as ApiErrorPayload | null;
    throw new ApiClientError(
      response.status,
      apiError?.error?.message ?? `Request failed with status ${response.status}`,
      payload
    );
  }

  return payload as T;
}
