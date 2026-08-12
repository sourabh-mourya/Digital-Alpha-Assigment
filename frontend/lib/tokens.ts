/**
 * Design tokens — single source of truth for the visual system.
 * 
 * Fintech dark-mode aesthetic: deep slate backgrounds, electric indigo accent,
 * generous whitespace, tabular numerals for amounts.
 */

export const tokens = {
  colors: {
    // Primary accent
    primary: {
      50:  '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // main accent
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    // Neutral grays (slate-based for fintech feel)
    neutral: {
      0:   '#ffffff',
      50:  '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      850: '#172033',
      900: '#0f172a',
      950: '#020617',
    },
    // Semantic
    success: { light: '#dcfce7', main: '#22c55e', dark: '#15803d' },
    error:   { light: '#fee2e2', main: '#ef4444', dark: '#b91c1c' },
    warning: { light: '#fef3c7', main: '#f59e0b', dark: '#b45309' },
    pending: { light: '#e0e7ff', main: '#818cf8', dark: '#4338ca' },
  },

  spacing: {
    xs:   '4px',
    sm:   '8px',
    md:   '12px',
    base: '16px',
    lg:   '24px',
    xl:   '32px',
    '2xl':'48px',
    '3xl':'64px',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizes: {
      xs:   '0.75rem',   // 12px
      sm:   '0.8125rem', // 13px
      base: '0.875rem',  // 14px
      md:   '1rem',      // 16px
      lg:   '1.125rem',  // 18px
      xl:   '1.5rem',    // 24px
      '2xl':'2rem',      // 32px
      '3xl':'2.5rem',    // 40px
    },
    weights: {
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
    lineHeights: {
      tight:  1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  radius: {
    sm:   '6px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    full: '9999px',
  },

  shadows: {
    subtle:   '0 1px 2px rgba(0, 0, 0, 0.08)',
    medium:   '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.15)',
    glow:     '0 0 20px rgba(99, 102, 241, 0.3)',
  },

  transitions: {
    fast:    '150ms ease',
    normal:  '200ms ease',
    slow:    '300ms ease',
  },

  breakpoints: {
    mobile:  '360px',
    tablet:  '768px',
    desktop: '1024px',
    wide:    '1440px',
  },
} as const;

export type Tokens = typeof tokens;
