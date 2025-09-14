import { API_BASE } from './apiBase';

// Auth-aware fetch helper.
// - Prepends API_BASE unless endpoint is absolute.
// - Injects Authorization header if token exists.
// - Optionally auto-logs out on 401.
export async function authFetch(endpoint, options = {}) {
  const { base = API_BASE, autoLogout = true, headers = {}, ...rest } = options;

  let url = endpoint;
  if (!/^https?:/i.test(endpoint)) {
    if (base === '') {
      url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    } else {
      url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    }
  }

  let token = null;
  try { token = localStorage.getItem('token'); } catch {
    // ignore storage access errors
  }

  const finalHeaders = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers };
  const res = await fetch(url, { headers: finalHeaders, ...rest });

  if (res.status === 401 && autoLogout) {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.dispatchEvent(new Event('auth-token-changed'));
  } catch {
      // ignore logout failures
    }
  }
  return res;
}

export default authFetch;