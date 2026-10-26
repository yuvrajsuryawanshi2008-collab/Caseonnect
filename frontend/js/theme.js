/**
 * CaseConnect Enterprise Theme Manager (Dark & Light Mode)
 */

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('caseconnect_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);
  }

  getTheme() {
    return this.currentTheme;
  }

  isDark() {
    return this.currentTheme === 'dark';
  }

  setTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('caseconnect_theme', theme);
    this.applyTheme(theme);
    window.renderHeader?.();
  }

  toggleTheme() {
    const next = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
    if (window.Toast) {
      window.Toast.info(`Switched to ${next === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
    }
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
    }
  }
}

window.Theme = new ThemeManager();
