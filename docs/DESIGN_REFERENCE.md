# Design Reference & Visual System Translation Guide

**Reference Source**: CampusX Engineering Platform (`index.html`, `style.css`)  
**Target Product**: CaseConnect — Centralized Institution-Related Complaint & Case Monitoring Platform  
**Purpose**: Document design tokens, layout architecture, typography, card structures, and visual patterns extracted from the reference and applied to enterprise institutional governance.

---

## 1. Visual Identity & Brand System

CaseConnect inherits the modern, high-contrast, clean aesthetic of CampusX while elevating it for high-stakes institutional administration. It completely eliminates all student, tutorial, or hackathon elements and presents an enterprise regulatory platform.

### Color Palette Tokens

```css
:root {
  /* Brand Primary Accents */
  --color-primary: #4f46e5;         /* Deep Indigo */
  --color-primary-dark: #3730a3;    /* Indigo 800 */
  --color-primary-light: #eef2ff;   /* Soft Indigo Surface */
  --color-primary-focus: rgba(79, 70, 229, 0.25);

  /* Surfaces & Backgrounds */
  --color-bg: #f5f7fb;              /* Cool Slate Tinted Canvas */
  --color-surface: #ffffff;         /* Pure Card White */
  --color-surface-subtle: #f8fafc;  /* Neutral Table/Subhead Surface */

  /* Text & Hierarchy */
  --color-text: #0f172a;            /* Slate 900 (High Legibility) */
  --color-text-secondary: #334155;  /* Slate 700 */
  --color-text-muted: #64748b;      /* Slate 500 */
  --color-text-inverse: #ffffff;

  /* Structural Borders */
  --color-border: #e2e8f0;          /* Slate 200 */
  --color-border-hover: #cbd5e1;    /* Slate 300 */
  --color-border-focus: #4f46e5;

  /* Institutional Status Accents */
  --color-success: #10b981;         /* Emerald Green (Disposed / Compliant) */
  --color-warning: #f59e0b;         /* Amber (Pending / Coordination Req.) */
  --color-danger: #ef4444;          /* Crimson (Overdue / High Severity / Escalated) */
  --color-info: #0284c7;            /* Sky Blue (Under Review / Assigned) */
  --color-purple: #8b5cf6;          /* Violet (Cross-Bureau Coordination) */

  /* Elevation & Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-card: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
  --shadow-hover: 0 10px 15px -3px rgba(79, 70, 229, 0.1), 0 4px 6px -4px rgba(79, 70, 229, 0.06);
  --shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);

  /* Geometry & Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  /* Layout Consts */
  --header-height: 68px;
  --sidebar-width: 260px;
  --max-content-width: 1440px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
```

---

## 2. Key Component Patterns from CampusX Recreated in CaseConnect

### A. Navigation Bar & Brand Header
- **CampusX Pattern**: Fixed top bar with logo pill, desktop links, quick search with shortcut pill (`Ctrl K`), action buttons (Login/Join), responsive drawer.
- **CaseConnect Enterprise Adaptation**:
  - Left: Institutional Emblem + `CaseConnect` branding with subtitle *"Centralized Institution Case Monitoring System"*.
  - Center: Global Quick Search (`Ctrl + K`) to immediately jump to Institutions by Permanent ID or Cases by Case Number.
  - Right: Quick Bureau Switcher, Notification Bell with live unread counter badge, User Profile avatar & active Bureau/Role badge.

### B. Metric Summary Cards & Metric Grids
- **CampusX Pattern**: 4-column community pillars grid with clean icons, clear titles, subtle border on card hover.
- **CaseConnect Enterprise Adaptation**:
  - Executive KPI cards for Total Cases, Open Under Process, Cross-Bureau Overlaps, Overdue Cases, and Bureau Distribution.
  - Interactive drill-down: clicking an Overdue metric card filters the case directory instantly.

### C. Status Badges & Priority Indicator Pills
- **CampusX Pattern**: `.badge .badge-indigo`, `.badge-green`, `.badge-purple`.
- **CaseConnect Enterprise Adaptation**:
  - Normalized status pills: `Received` (Slate), `Assigned` (Blue), `Under Process` (Amber), `Pending Response` (Orange), `Escalated` (Red), `Disposed` (Emerald), `Closed` (Slate-Dark).
  - Severity indicators: `Low`, `Medium`, `High`, `Critical`.

### D. Data Tables & Searchable Registers
- Responsive tables with alternating row hovers, column sort indicators, sticky headers, multi-criteria filters, and server-side pagination controls.

### E. Interactive Modals & Slide-in Drawers
- Accessible dialog overlay with blur backdrop, Escape-to-close, structured forms with inline error validation, and confirmation modal for consequential status changes.
