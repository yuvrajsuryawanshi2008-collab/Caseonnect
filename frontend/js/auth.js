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
    return !!this.currentUser && this.currentUser.role === 'STUDENT';
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

  async studentLogin(email, password) {
    const res = await window.API.post('/auth/student/login', { email, password });
    if (res.success && res.token) {
      window.API.setToken(res.token);
      this.currentUser = res.student || res.user;
      localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
    throw new Error(res.message || 'Student login failed');
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
      const endpoint = this.isStudent() ? '/auth/student/profile' : '/auth/me';
      const res = await window.API.get(endpoint);
      if (res.success && (res.user || res.student)) {
        this.currentUser = res.student || res.user;
        localStorage.setItem('caseconnect_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      }
    } catch (e) {
      this.logout();
    }
    return null;
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
