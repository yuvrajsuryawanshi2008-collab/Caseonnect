/**
 * Centralized Typed API Client
 */

class ApiClient {
  constructor() {
    this.baseUrl = (window.CONFIG && window.CONFIG.API_BASE_URL) || '/api';
  }

  getToken() {
    return localStorage.getItem('caseconnect_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('caseconnect_token', token);
    } else {
      localStorage.removeItem('caseconnect_token');
    }
  }

  async request(endpoint, options = {}) {
    // Re-check baseUrl in case CONFIG updated dynamically
    const base = (window.CONFIG && window.CONFIG.API_BASE_URL) || this.baseUrl;
    const url = `${base}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Safe body parsing to prevent SyntaxError on non-JSON or HTML responses
      let data = {};
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { message: text || `HTTP ${response.status}: ${response.statusText}` };
      }

      // Explicit handling for HTTP 405 Method Not Allowed
      if (response.status === 405) {
        const msg = data.message && !data.message.includes('<html') 
          ? data.message 
          : `HTTP 405 Method Not Allowed: The request method ${options.method || 'GET'} is not accepted for ${url}. If using Live Server, verify API proxy routing.`;
        throw new Error(msg);
      }

      if (response.status === 401) {
        // For login and registration attempts, surface the specific validation / credential message
        if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
          throw new Error(data.message || 'Invalid official credentials.');
        }

        // For protected routes, session has expired
        this.setToken(null);
        localStorage.removeItem('caseconnect_user');
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login';
        }
        throw new Error(data.message || 'Official session expired. Please log in.');
      }

      if (!response.ok) {
        throw new Error(data.message || `API Error (${response.status})`);
      }

      return data;
    } catch (err) {
      console.error(`[API Request Error] ${endpoint}:`, err.message);
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

window.API = new ApiClient();
