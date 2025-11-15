/**
 * Brookside BI Design System - Typography Tokens
 *
 * Establish scalable type system optimized for data-dense enterprise applications
 * with professional readability across desktop, tablet, and mobile viewports.
 *
 * Font stack: Inter (primary), system fallbacks for performance
 * Features: Tabular numerals, lining figures for data consistency
 *
 * Best for: Multi-tier information hierarchy in business intelligence platforms
 *
 * @module design-system/tokens/typography
 */

/**
 * Font family definitions
 *
 * Primary: Inter - Excellent readability, comprehensive glyph coverage
 * Fallbacks: System fonts for instant rendering
 */
export const fontFamilies = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  display: "'Inter Display', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

/**
 * Font weight scale
 *
 * Limited to essential weights for performance and visual hierarchy
 */
export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Font size scale with responsive fluid sizing
 *
 * Uses clamp() for fluid typography that scales smoothly between breakpoints
 * Base: 16px at 320px viewport, scales to optimal size at 1920px viewport
 */
export const fontSizes = {
  /**
   * Display - Hero headings, landing pages
   * Desktop: 48px, Mobile: 32px
   */
  display: {
    size: 'clamp(2rem, 1.4545rem + 2.4242vw, 3rem)',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    weight: fontWeights.bold,
  },

  /**
   * H1 - Page titles, primary headings
   * Desktop: 36px, Mobile: 28px
   */
  h1: {
    size: 'clamp(1.75rem, 1.5114rem + 1.0606vw, 2.25rem)',
    lineHeight: '1.2',
    letterSpacing: '-0.015em',
    weight: fontWeights.bold,
  },

  /**
   * H2 - Section headings
   * Desktop: 28px, Mobile: 24px
   */
  h2: {
    size: 'clamp(1.5rem, 1.3795rem + 0.5356vw, 1.75rem)',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
    weight: fontWeights.semibold,
  },

  /**
   * H3 - Subsection headings
   * Desktop: 22px, Mobile: 20px
   */
  h3: {
    size: 'clamp(1.25rem, 1.1894rem + 0.2678vw, 1.375rem)',
    lineHeight: '1.4',
    letterSpacing: '-0.005em',
    weight: fontWeights.semibold,
  },

  /**
   * H4 - Card titles, tertiary headings
   * Desktop: 18px, Mobile: 18px
   */
  h4: {
    size: '1.125rem',
    lineHeight: '1.4',
    letterSpacing: '0',
    weight: fontWeights.semibold,
  },

  /**
   * Body Large - Lead paragraphs, emphasized content
   * Desktop: 18px, Mobile: 17px
   */
  'body-lg': {
    size: 'clamp(1.0625rem, 1.0322rem + 0.1339vw, 1.125rem)',
    lineHeight: '1.6',
    letterSpacing: '0',
    weight: fontWeights.regular,
  },

  /**
   * Body - Default text, paragraphs
   * Desktop: 16px, Mobile: 16px
   */
  body: {
    size: '1rem',
    lineHeight: '1.6',
    letterSpacing: '0',
    weight: fontWeights.regular,
  },

  /**
   * Body Small - Secondary information, captions
   * Desktop: 14px, Mobile: 14px
   */
  'body-sm': {
    size: '0.875rem',
    lineHeight: '1.5',
    letterSpacing: '0',
    weight: fontWeights.regular,
  },

  /**
   * Caption - Metadata, timestamps, fine print
   * Desktop: 12px, Mobile: 12px
   */
  caption: {
    size: '0.75rem',
    lineHeight: '1.4',
    letterSpacing: '0.01em',
    weight: fontWeights.medium,
  },

  /**
   * Label - Form labels, input helpers
   * Desktop: 14px, Mobile: 14px
   */
  label: {
    size: '0.875rem',
    lineHeight: '1.4',
    letterSpacing: '0.005em',
    weight: fontWeights.medium,
  },

  /**
   * Button - Call-to-action text
   * Desktop: 14px, Mobile: 14px
   */
  button: {
    size: '0.875rem',
    lineHeight: '1',
    letterSpacing: '0.01em',
    weight: fontWeights.medium,
  },

  /**
   * Code - Inline code, monospace text
   * Desktop: 14px, Mobile: 14px
   */
  code: {
    size: '0.875rem',
    lineHeight: '1.6',
    letterSpacing: '0',
    weight: fontWeights.regular,
  },
} as const;

/**
 * Line height scale for flexible vertical rhythm
 */
export const lineHeights = {
  none: '1',
  tight: '1.2',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.6',
  loose: '1.8',
} as const;

/**
 * Letter spacing scale for optical adjustments
 */
export const letterSpacings = {
  tighter: '-0.02em',
  tight: '-0.01em',
  normal: '0',
  wide: '0.01em',
  wider: '0.02em',
  widest: '0.04em',
} as const;

/**
 * Typography utility classes for common text patterns
 *
 * Combines font size, weight, line height for consistent application
 */
export const typographyClasses = {
  display: 'text-[clamp(2rem,1.4545rem+2.4242vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]',
  h1: 'text-[clamp(1.75rem,1.5114rem+1.0606vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.015em]',
  h2: 'text-[clamp(1.5rem,1.3795rem+0.5356vw,1.75rem)] font-semibold leading-[1.3] tracking-[-0.01em]',
  h3: 'text-[clamp(1.25rem,1.1894rem+0.2678vw,1.375rem)] font-semibold leading-[1.4] tracking-[-0.005em]',
  h4: 'text-lg font-semibold leading-[1.4]',
  'body-lg': 'text-[clamp(1.0625rem,1.0322rem+0.1339vw,1.125rem)] font-normal leading-relaxed',
  body: 'text-base font-normal leading-relaxed',
  'body-sm': 'text-sm font-normal leading-normal',
  caption: 'text-xs font-medium leading-snug tracking-wide',
  label: 'text-sm font-medium leading-snug tracking-[0.005em]',
  button: 'text-sm font-medium leading-none tracking-wide',
  code: 'text-sm font-normal leading-relaxed font-mono',
} as const;

/**
 * OpenType font feature settings for enhanced typography
 *
 * Enables advanced typographic features for professional appearance
 */
export const fontFeatureSettings = {
  /**
   * Tabular numerals - Same-width numbers for data tables
   */
  tabular: "'tnum' on, 'lnum' on",

  /**
   * Proportional numerals - Variable-width numbers for running text
   */
  proportional: "'pnum' on, 'lnum' on",

  /**
   * Stylistic alternates - Alternative character forms
   */
  stylistic: "'ss01' on, 'ss02' on",

  /**
   * Complete feature set for optimal rendering
   */
  complete: "'tnum' on, 'lnum' on, 'case' on, 'zero' on",
} as const;

/**
 * CSS custom property names for Tailwind integration
 */
export const cssVariables = {
  // Font families
  '--font-family-sans': fontFamilies.sans,
  '--font-family-mono': fontFamilies.mono,
  '--font-family-display': fontFamilies.display,

  // Font weights
  '--font-weight-regular': fontWeights.regular,
  '--font-weight-medium': fontWeights.medium,
  '--font-weight-semibold': fontWeights.semibold,
  '--font-weight-bold': fontWeights.bold,

  // Font features
  '--font-feature-tabular': fontFeatureSettings.tabular,
  '--font-feature-proportional': fontFeatureSettings.proportional,
  '--font-feature-complete': fontFeatureSettings.complete,
} as const;

/**
 * Type-safe typography getter utilities
 */
export type FontSizeKey = keyof typeof fontSizes;
export type FontWeightKey = keyof typeof fontWeights;
export type LineHeightKey = keyof typeof lineHeights;

/**
 * Helper function to generate typography CSS properties
 *
 * @param size - Font size key from fontSizes
 * @returns Object with font-size, line-height, letter-spacing, font-weight
 *
 * @example
 * ```typescript
 * const headingStyles = getTypographyStyles('h1');
 * // { fontSize: 'clamp(...)', lineHeight: '1.2', ... }
 * ```
 */
export function getTypographyStyles(size: FontSizeKey) {
  const config = fontSizes[size];
  return {
    fontSize: config.size,
    lineHeight: config.lineHeight,
    letterSpacing: config.letterSpacing,
    fontWeight: config.weight,
  };
}

/**
 * Helper function to generate font feature settings string
 *
 * @param features - Array of feature names to enable
 * @returns CSS font-feature-settings value
 *
 * @example
 * ```typescript
 * const features = getFontFeatures(['tabular', 'complete']);
 * // "'tnum' on, 'lnum' on, 'case' on, 'zero' on"
 * ```
 */
export function getFontFeatures(features: Array<keyof typeof fontFeatureSettings>): string {
  return features.map(f => fontFeatureSettings[f]).join(', ');
}
