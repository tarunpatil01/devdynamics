// Determine API base URL with clear priority:
// 1. Explicit VITE_API_URL
// 2. Local dev (localhost / 127.*) -> protocol + host + :VITE_API_PORT|5000
// 3. Same-origin (non onrender.com host) -> relative '' (supports reverse proxy)
// 4. Fallback to production deployment URL
export function getApiBase() {
  try {
    const envUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim();
    if (envUrl) return envUrl.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const port = (import.meta.env.VITE_API_PORT || '5000').toString();
        return `${protocol}//${hostname}:${port}`.replace(/\/$/, '');
      }
      if (hostname && !hostname.includes('onrender.com')) {
        return '';
      }
    }
  } catch (e) {
    console.warn('API base resolution failed, using fallback', e);
  }
  return 'https://devdynamics-yw9g.onrender.com';
}
export const API_BASE = getApiBase();
