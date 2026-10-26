/**
 * Authentication & Official Session State Management
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem('caseconnect_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  isAuthenticated() {
    return !!window.API.getToken() && !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  hasRole(...roles) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'SUPER_ADMIN') return true;
    return roles.includes(this.currentUser.role);
  }

  async login(email, password) {
    const res = await window.API.post('/auth/login', { email, password });
    if (res.success && res.token) {
      window.API.setToken(res.token);
      this.currentUser = res.user;
      localStorage.setItem('caseconnect_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Authentication failed');
  }

  async register(registrationData) {
    const res = await window.API.post('/auth/register', registrationData);
    if (res.success && res.token) {
      window.API.setToken(res.token);
      this.currentUser = res.user;
      localStorage.setItem('caseconnect_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  }

  async fetchMe() {
    try {
      const res = await window.API.get('/auth/me');
      if (res.success && res.user) {
        this.currentUser = res.user;
        localStorage.setItem('caseconnect_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (e) {
      this.logout();
    }
    return null;
  }

  logout() {
    window.API.setToken(null);
    this.currentUser = null;
    localStorage.removeItem('caseconnect_user');
    window.location.hash = '#/login';
  }
}

window.Auth = new AuthManager();
