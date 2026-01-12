import API_URL from '../config/api';

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/employees')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise} - Fetch response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  const url = `${API_URL}${endpoint}`;
  return fetch(url, config);
};

export default apiRequest;
