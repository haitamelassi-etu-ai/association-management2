/**
 * Get API URL - works on both desktop and mobile.
 * Automatically detects the current hostname and uses it with port 5000.
 */
/**
 * Get API URL - works on both desktop and mobile.
 */
export const getApiUrl = () => {
  // استخدام المتغير في الإنتاج والتطوير معاً
  if (import.meta?.env?.VITE_API_URL) {
    const raw = String(import.meta.env.VITE_API_URL).trim();
    if (raw) {
      return raw.replace(/\/+$/, '');
    }
  }

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('Using localhost API');
    return 'http://localhost:5000';
  }

  // رابط الباكند على Vercel كخيار افتراضي مباشر
  return 'https://association-management2.vercel.app';
};

export const API_BASE_URL = getApiUrl();
export const API_URL = `${API_BASE_URL}/api`;

export const getAuthToken = () => {
  const directToken = localStorage.getItem('professionalToken') || localStorage.getItem('token');
  if (directToken) return directToken;

  const storedUser = localStorage.getItem('professionalUser');
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser)?.token || null;
  } catch {
    return null;
  }
};

export const getAuthHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

console.log('API Configuration:');
console.log('   BASE_URL:', API_BASE_URL);
console.log('   API_URL:', API_URL);
