// Design System Tokens
// Minimal, System-Driven, Data-First SaaS UI (Notion × Linear × Stripe)

export const colors = {
  // Primary: Neutral slate scale
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Accent: One controlled brand color
  accent: {
    light: '#e0e7ff',
    DEFAULT: '#4f46e5',
    dark: '#3730a3',
  },
  // Status colors - Muted versions
  success: {
    light: '#dcfce7',
    DEFAULT: '#22c55e',
    muted: '#86efac',
    text: '#166534',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    muted: '#fcd34d',
    text: '#92400e',
  },
  danger: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    muted: '#fca5a5',
    text: '#991b1b',
  },
  info: {
    light: '#dbeafe',
    DEFAULT: '#3b82f6',
    muted: '#93c5fd',
    text: '#1e40af',
  },
};

export const typography = {
  // Page title
  pageTitle: 'text-2xl font-semibold text-slate-900',
  // Section title
  sectionTitle: 'text-xs font-medium uppercase tracking-wider text-slate-500',
  // Metric/KPI
  metric: 'text-3xl font-semibold text-slate-900',
  metricSmall: 'text-2xl font-semibold text-slate-900',
  // Body text
  body: 'text-sm text-slate-600',
  bodySmall: 'text-xs text-slate-500',
  // Labels
  label: 'text-sm font-medium text-slate-700',
  // Links
  link: 'text-sm font-medium text-indigo-600 hover:text-indigo-700',
};

export const spacing = {
  page: 'p-6 lg:p-8',
  section: 'mb-6',
  card: 'p-5',
  cardCompact: 'p-4',
  gap: 'gap-4',
  gapLarge: 'gap-6',
};

export const borders = {
  default: 'border border-slate-200',
  light: 'border border-slate-100',
  left: 'border-l-2',
  bottom: 'border-b border-slate-200',
};

export const shadows = {
  sm: 'shadow-sm',
  none: 'shadow-none',
};

export const radius = {
  default: 'rounded-lg',
  sm: 'rounded-md',
  full: 'rounded-full',
};

export const transitions = {
  default: 'transition-all duration-150 ease-in-out',
  fast: 'transition-all duration-100 ease-in-out',
};

// Component style presets
export const componentStyles = {
  card: `bg-white ${borders.default} ${radius.default} ${shadows.sm}`,
  cardHover: `bg-white ${borders.default} ${radius.default} ${shadows.sm} hover:border-slate-300 ${transitions.default}`,
  
  button: {
    primary: `inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 ${radius.default} hover:bg-slate-800 ${transitions.default}`,
    secondary: `inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white ${borders.default} ${radius.default} hover:bg-slate-50 ${transitions.default}`,
    ghost: `inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 ${radius.default} hover:bg-slate-100 ${transitions.default}`,
    danger: `inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 ${radius.default} hover:bg-red-700 ${transitions.default}`,
  },
  
  input: `w-full px-3 py-2 text-sm ${borders.default} ${radius.default} bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${transitions.default}`,
  
  badge: {
    default: `inline-flex items-center px-2 py-0.5 text-xs font-medium ${radius.sm}`,
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    neutral: 'bg-slate-100 text-slate-700',
  },
  
  table: {
    wrapper: 'overflow-hidden border border-slate-200 rounded-lg',
    header: 'bg-slate-50 border-b border-slate-200',
    headerCell: 'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500',
    row: 'border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors',
    cell: 'px-4 py-3 text-sm text-slate-600',
  },
  
  sidebar: {
    wrapper: 'fixed top-0 left-0 h-full w-56 bg-white border-r border-slate-200',
    item: 'flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 transition-colors',
    itemActive: 'flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md border-l-2 border-indigo-500',
  },
};

// Priority colors (muted)
export const priorityColors = {
  HIGH: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    indicator: 'bg-red-500',
  },
  MEDIUM: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    indicator: 'bg-amber-500',
  },
  LOW: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    indicator: 'bg-green-500',
  },
};

// Status colors
export const statusColors = {
  COMPLETED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  PENDING: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};
