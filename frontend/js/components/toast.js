/**
 * Professional Toast Notification Engine
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.ensureContainer();
  }

  ensureContainer() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 4000) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = window.Icons?.alertCircle('w-4 h-4 text-indigo-600') || '';
    if (type === 'success') iconSvg = window.Icons?.checkCircle('w-4 h-4 text-emerald-600') || '';
    if (type === 'error') iconSvg = window.Icons?.alertCircle('w-4 h-4 text-red-600') || '';
    if (type === 'warning') iconSvg = window.Icons?.alertTriangle('w-4 h-4 text-amber-600') || '';

    toast.innerHTML = `
      <div style="flex-shrink: 0;">${iconSvg}</div>
      <div style="flex: 1; line-height: 1.35; font-size: 0.8rem;">${message}</div>
      <button style="border: none; background: transparent; cursor: pointer; color: #94a3b8; padding: 0.1rem;" onclick="this.parentElement.remove()">
        ${window.Icons?.x('w-3.5 h-3.5') || '✕'}
      </button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
      }
    }, duration);
  }

  success(msg) { this.show(msg, 'success'); }
  error(msg) { this.show(msg, 'error', 6000); }
  warning(msg) { this.show(msg, 'warning', 5000); }
  info(msg) { this.show(msg, 'info'); }
}

window.Toast = new ToastManager();
