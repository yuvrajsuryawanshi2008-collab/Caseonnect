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

  isStudent() {
    const PORTAL_ROLES = ['STUDENT', 'ROLE_FACULTY', 'ROLE_STAKEHOLDER', 'ROLE_INSTITUTION_REP'];
    return !!this.currentUser && PORTAL_ROLES.includes(this.currentUser.role);
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
    if (res.success) return res;
    throw new Error(res.message || 'Registration failed');
  }

  async studentLogin(email, password) {
    // Try new /user/login first, fall back to /student/login for backward compat
    try {
      return await this.userLogin(email, password);
    } catch (e) {
      // Fall back only when an older deployment does not expose the alias.
      // Credential, network, and database errors should be shown directly and
      // must not trigger a redundant request to the legacy endpoint.
      if (!/\b404\b|not found|endpoint.*missing/i.test(e.message || '')) {
        throw e;
      }
      const res = await window.API.post('/auth/student/login', { email, password });
      if (res.success && res.token) {
        window.API.setToken(res.token);
        this.currentUser = res.student || res.user;
        localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }
      throw new Error(res.message || 'Student login failed');
    }
  }

  async userLogin(email, password) {
    const res = await window.API.post('/auth/user/login', { email, password });
    if (res.success && res.token) {
      window.API.setToken(res.token);
      this.currentUser = res.user || res.student;
      localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    throw new Error(res.message || 'Login failed');
  }

  async userRegister(registrationData) {
    const res = await window.API.post('/auth/user/register', registrationData);
    if (res.success && res.token) {
      window.API.setToken(res.token);
      this.currentUser = res.user || res.student;
      localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    throw new Error(res.message || 'Registration failed');
  }

  async studentRegister(registrationData) {
    const res = await window.API.post('/auth/student/register', registrationData);
    if (res.success && res.token) {
      window.API.setToken(res.token);
      this.currentUser = res.student || res.user;
      localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    throw new Error(res.message || 'Student registration failed');
  }

  async fetchMe() {
    try {
      const res = await window.API.get('/auth/me');
      if (res.success && (res.user || res.student)) {
        this.currentUser = res.user || res.student;
        localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }
    } catch (e) {
      if (e.message && (e.message.includes('401') || e.message.includes('Session expired') || e.message.includes('revoked'))) {
        this.logout();
      } else {
        console.warn('[Auth] Session profile refresh deferred:', e.message);
      }
    }
    return this.currentUser;
  }

  async updateStudentProfile(profileData) {
    const res = await window.API.put('/auth/student/profile', profileData);
    if (res.success && (res.student || res.user)) {
      this.currentUser = res.student || res.user;
      localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    throw new Error(res.message || 'Failed to update profile');
  }

  logout() {
    const wasStudent = this.isStudent();
    window.API.setToken(null);
    this.currentUser = null;
    localStorage.removeItem('caseconnect_user');
    window.location.hash = wasStudent ? '#/student-login' : '#/login';
  }
}

window.Auth = new AuthManager();
