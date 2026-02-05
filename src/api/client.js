/**
 * HTTP client for TalentX backend. Uses VITE_API_BASE_URL.
 * For protected routes, pass getToken (async () => idToken) to attach Authorization header.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function request(path, options = {}, getToken = null) {
  const url = `${BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };
  if (getToken && typeof getToken === 'function') {
    try {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_) {}
  if (!res.ok) {
    const msg = body?.error || res.statusText || 'Request failed';
    throw new ApiError(msg, { status: res.status, code: body?.code });
  }
  return body;
}

export function getBaseUrl() {
  return BASE;
}

export function isRealApi() {
  return Boolean(BASE);
}
