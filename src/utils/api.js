/**
 * Get API URL - works on both desktop and mobile
 * Automatically detects the current hostname and uses it with port 5000
 */
export const getApiUrl = () => {
  // VITE_API_URL overrides everything (dev LAN testing or production Render URL)
  if (import.meta?.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '');
  }

  // Local development fallback
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // Same-origin fallback (Vercel monorepo)
  return window.location.origin;
};

export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;
