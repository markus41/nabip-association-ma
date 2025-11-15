/**
 * NABIP AMS Design Tokens
 *
 * Establishes scalable design foundations for consistent visual language across the association
 * management platform. These tokens ensure reliable performance and maintainability as the system
 * scales to support 20,000+ members across multi-tier chapter hierarchies.
 *
 * Design Philosophy: Apple/Stripe-inspired radical simplicity with WCAG 2.1 AA compliance
 * Best for: Enterprise-grade applications requiring strict accessibility and brand consistency
 */

// ============================================================================
// COLOR SYSTEM - OKLCH Color Space
// ============================================================================

/**
 * Primary color palette designed for trust and authority in professional association management.
 * All colors maintain WCAG 2.1 AA contrast ratios for accessibility.
 */
export const colors = {
  // Primary Colors - Deep Navy (Trust & Authority)
  primary: {
    50: 'oklch(0.97 0.01 250)',
    100: 'oklch(0.94 0.02 250)',
    200: 'oklch(0.88 0.03 250)',
    300: 'oklch(0.76 0.04 250)',
    400: 'oklch(0.60 0.04 250)',
    500: 'oklch(0.45 0.05 250)', // Main primary
    600: 'oklch(0.35 0.05 250)',
    700: 'oklch(0.25 0.05 250)', // Current primary
    800: 'oklch(0.20 0.04 250)',
    900: 'oklch(0.15 0.03 250)',
    950: 'oklch(0.10 0.02 250)',
  },

  // Secondary Colors - Teal (Modern Energy)
  secondary: {
    50: 'oklch(0.96 0.02 200)',
    100: 'oklch(0.92 0.04 200)',
    200: 'oklch(0.84 0.06 200)',
    300: 'oklch(0.76 0.08 200)',
    400: 'oklch(0.68 0.10 200)',
    500: 'oklch(0.60 0.12 200)', // Main secondary
    600: 'oklch(0.52 0.12 200)',
    700: 'oklch(0.44 0.11 200)',
    800: 'oklch(0.36 0.10 200)',
    900: 'oklch(0.28 0.08 200)',
    950: 'oklch(0.20 0.06 200)',
  },

  // Accent Colors - Gold (Success & Premium)
  accent: {
    50: 'oklch(0.97 0.03 85)',
    100: 'oklch(0.94 0.06 85)',
    200: 'oklch(0.88 0.09 85)',
    300: 'oklch(0.82 0.12 85)',
    400: 'oklch(0.75 0.15 85)', // Main accent
    500: 'oklch(0.68 0.15 85)',
    600: 'oklch(0.60 0.14 85)',
    700: 'oklch(0.52 0.13 85)',
    800: 'oklch(0.44 0.11 85)',
    900: 'oklch(0.36 0.09 85)',
    950: 'oklch(0.28 0.07 85)',
  },

  // Neutral Colors - Grayscale
  neutral: {
    50: 'oklch(0.99 0 0)',
    100: 'oklch(0.98 0.005 250)',
    200: 'oklch(0.96 0.01 250)',
    300: 'oklch(0.94 0.01 250)',
    400: 'oklch(0.90 0.01 250)',
    500: 'oklch(0.70 0.02 250)',
    600: 'oklch(0.50 0.02 250)',
    700: 'oklch(0.40 0.03 250)',
    800: 'oklch(0.30 0.03 250)',
    900: 'oklch(0.20 0.03 250)',
    950: 'oklch(0.10 0.02 250)',
  },

  // Semantic Colors - Status & Feedback
  semantic: {
    success: {
      light: 'oklch(0.88 0.12 145)',
      DEFAULT: 'oklch(0.65 0.18 145)',
      dark: 'oklch(0.45 0.15 145)',
      foreground: 'oklch(1 0 0)',
    },
    warning: {
      light: 'oklch(0.92 0.10 75)',
      DEFAULT: 'oklch(0.78 0.16 75)',
      dark: 'oklch(0.60 0.14 75)',
      foreground: 'oklch(0.20 0.03 250)',
    },
    error: {
      light: 'oklch(0.90 0.15 25)',
      DEFAULT: 'oklch(0.55 0.22 25)',
      dark: 'oklch(0.40 0.18 25)',
      foreground: 'oklch(1 0 0)',
    },
    info: {
      light: 'oklch(0.90 0.08 240)',
      DEFAULT: 'oklch(0.60 0.12 240)',
      dark: 'oklch(0.45 0.10 240)',
      foreground: 'oklch(1 0 0)',
    },
  },
} as const

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

/**
 * Typography scale designed for optimal readability across desktop and mobile devices.
 * Includes proper line heights and letter spacing for professional association content.
 */
export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.005em' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],          // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],  // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }], // 36px
    '5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em' }],   // 48px
    '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.035em' }],    // 60px
    '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],      // 72px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  letterSpacing: {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
    widest: '0.04em',
  },
} as const

// ============================================================================
// SPACING SYSTEM - 4px Baseline Grid
// ============================================================================

/**
 * Spacing scale based on 4px baseline grid for consistent rhythm and alignment.
 * Best for: Creating harmonious layouts with predictable spacing relationships
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================

/**
 * Border radius scale for consistent component roundness.
 * Aligned with modern design trends while maintaining professional appearance.
 */
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const

// ============================================================================
// SHADOWS
// ============================================================================

/**
 * Shadow system for depth and elevation hierarchy.
 * Designed to establish clear visual layers without overwhelming the interface.
 */
export const shadows = {
  xs: '0 1px 2px 0 oklch(0.10 0.02 250 / 0.05)',
  sm: '0 1px 3px 0 oklch(0.10 0.02 250 / 0.1), 0 1px 2px -1px oklch(0.10 0.02 250 / 0.1)',
  DEFAULT: '0 4px 6px -1px oklch(0.10 0.02 250 / 0.1), 0 2px 4px -2px oklch(0.10 0.02 250 / 0.1)',
  md: '0 4px 6px -1px oklch(0.10 0.02 250 / 0.1), 0 2px 4px -2px oklch(0.10 0.02 250 / 0.1)',
  lg: '0 10px 15px -3px oklch(0.10 0.02 250 / 0.1), 0 4px 6px -4px oklch(0.10 0.02 250 / 0.1)',
  xl: '0 20px 25px -5px oklch(0.10 0.02 250 / 0.1), 0 8px 10px -6px oklch(0.10 0.02 250 / 0.1)',
  '2xl': '0 25px 50px -12px oklch(0.10 0.02 250 / 0.25)',
  inner: 'inset 0 2px 4px 0 oklch(0.10 0.02 250 / 0.05)',
  none: 'none',
} as const

// ============================================================================
// BREAKPOINTS - Responsive Design
// ============================================================================

/**
 * Responsive breakpoints aligned with common device sizes.
 * Supports mobile-first development approach.
 */
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
  '3xl': '1920px', // Ultra-wide
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Z-index layering system to prevent elevation conflicts.
 * Best for: Managing complex UI overlays and ensuring predictable stacking contexts
 */
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  commandPalette: 1800,
  max: 9999,
} as const

// ============================================================================
// ANIMATION & TRANSITIONS
// ============================================================================

/**
 * Animation timing and easing functions for smooth, professional interactions.
 * Supports reduced motion preferences for accessibility.
 */
export const animation = {
  duration: {
    fastest: '50ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slowest: '500ms',
  },

  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring effect
  },

  transition: {
    base: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-100 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
  },
} as const

// ============================================================================
// ACCESSIBILITY
// ============================================================================

/**
 * Accessibility-focused design tokens to ensure WCAG 2.1 AA compliance.
 * Best for: Creating inclusive experiences for all users including assistive technologies
 */
export const accessibility = {
  // Focus ring configuration
  focusRing: {
    color: 'oklch(0.25 0.05 250)',
    width: '2px',
    offset: '2px',
    style: 'solid',
  },

  // Minimum touch target size (WCAG 2.1 Level AAA)
  minTouchTarget: '44px',

  // Contrast ratios
  contrast: {
    normalText: 4.5,   // WCAG AA for normal text
    largeText: 3,      // WCAG AA for large text (18px+ or 14px+ bold)
    uiComponents: 3,   // WCAG AA for UI components
  },

  // Screen reader only utility
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  },
} as const

// ============================================================================
// DESIGN TOKEN EXPORT
// ============================================================================

/**
 * Complete design token system for NABIP AMS.
 * This consolidated object streamlines integration across component libraries and design tools.
 */
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animation,
  accessibility,
} as const

export type DesignTokens = typeof designTokens
export type ColorToken = typeof colors
export type TypographyToken = typeof typography
export type SpacingToken = typeof spacing

/**
 * Helper function to generate CSS custom properties from design tokens.
 * Best for: Enabling runtime theme switching and design token management
 */
export function generateCSSVariables(tokens: typeof designTokens): Record<string, string> {
  const cssVars: Record<string, string> = {}

  // Generate color variables
  Object.entries(tokens.colors).forEach(([category, shades]) => {
    if (typeof shades === 'object' && shades !== null) {
      Object.entries(shades).forEach(([shade, value]) => {
        if (typeof value === 'string') {
          cssVars[`--color-${category}-${shade}`] = value
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([variant, variantValue]) => {
            cssVars[`--color-${category}-${shade}-${variant}`] = variantValue as string
          })
        }
      })
    }
  })

  // Generate spacing variables
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })

  // Generate border radius variables
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value
  })

  return cssVars
}
