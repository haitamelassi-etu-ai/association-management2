/**
 * Get API URL - works on both desktop and mobile
 * Automatically detects the current hostname and uses it with port 5000
 */
export const getApiUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // In production: Vercel proxies /api/* to the backend — use same origin
  return window.location.origin;
};

export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;
