/**
 * Brookside BI Design System - Color Tokens
 *
 * Establish consistent color palette aligned with Brookside BI brand guidelines
 * to support professional, Apple/Stripe-inspired UI across the NABIP AMS platform.
 *
 * All colors use OKLCH color space for perceptual uniformity and better dark mode support.
 *
 * Best for: Enterprise applications requiring consistent brand expression
 *
 * @module design-system/tokens/colors
 */

/**
 * Brand color definitions using OKLCH color space
 *
 * OKLCH (Oklch Lightness Chroma Hue) provides:
 * - Perceptually uniform lightness
 * - Better interpolation for gradients
 * - Easier dark mode color derivation
 * - Accessible color contrast by default
 */
export const brandColors = {
  /**
   * Primary Brand Color - Deep Navy
   *
   * Usage: Primary actions, headings, brand elements
   * Conveys: Trust, authority, professionalism
   */
  navy: {
    base: 'oklch(0.25 0.05 250)',
    light: 'oklch(0.35 0.06 250)',
    lighter: 'oklch(0.45 0.07 250)',
    dark: 'oklch(0.20 0.04 250)',
    darker: 'oklch(0.15 0.03 250)',
    subtle: 'oklch(0.96 0.01 250)',
    alpha: {
      10: 'oklch(0.25 0.05 250 / 0.1)',
      20: 'oklch(0.25 0.05 250 / 0.2)',
      30: 'oklch(0.25 0.05 250 / 0.3)',
      50: 'oklch(0.25 0.05 250 / 0.5)',
      80: 'oklch(0.25 0.05 250 / 0.8)',
    },
  },

  /**
   * Secondary Brand Color - Vibrant Teal
   *
   * Usage: Secondary actions, data visualization accents, hover states
   * Conveys: Modern energy, innovation, growth
   */
  teal: {
    base: 'oklch(0.60 0.12 200)',
    light: 'oklch(0.70 0.13 200)',
    lighter: 'oklch(0.80 0.10 200)',
    dark: 'oklch(0.50 0.11 200)',
    darker: 'oklch(0.40 0.10 200)',
    subtle: 'oklch(0.95 0.02 200)',
    alpha: {
      10: 'oklch(0.60 0.12 200 / 0.1)',
      20: 'oklch(0.60 0.12 200 / 0.2)',
      30: 'oklch(0.60 0.12 200 / 0.3)',
      50: 'oklch(0.60 0.12 200 / 0.5)',
      80: 'oklch(0.60 0.12 200 / 0.8)',
    },
  },

  /**
   * Accent Color - Warm Gold
   *
   * Usage: Success states, highlights, premium features, calls-to-action
   * Conveys: Success, achievement, premium quality
   */
  gold: {
    base: 'oklch(0.75 0.15 85)',
    light: 'oklch(0.85 0.12 85)',
    lighter: 'oklch(0.92 0.08 85)',
    dark: 'oklch(0.65 0.17 85)',
    darker: 'oklch(0.55 0.18 85)',
    subtle: 'oklch(0.97 0.03 85)',
    alpha: {
      10: 'oklch(0.75 0.15 85 / 0.1)',
      20: 'oklch(0.75 0.15 85 / 0.2)',
      30: 'oklch(0.75 0.15 85 / 0.3)',
      50: 'oklch(0.75 0.15 85 / 0.5)',
      80: 'oklch(0.75 0.15 85 / 0.8)',
    },
  },
} as const;

/**
 * Semantic color system for functional UI states
 *
 * Maps semantic meaning to brand colors for consistent state communication
 */
export const semanticColors = {
  success: {
    base: 'oklch(0.65 0.15 145)',
    light: 'oklch(0.75 0.12 145)',
    dark: 'oklch(0.55 0.17 145)',
    background: 'oklch(0.96 0.03 145)',
    foreground: 'oklch(0.25 0.05 145)',
  },
  warning: {
    base: 'oklch(0.75 0.15 75)',
    light: 'oklch(0.85 0.12 75)',
    dark: 'oklch(0.65 0.17 75)',
    background: 'oklch(0.97 0.03 75)',
    foreground: 'oklch(0.30 0.08 75)',
  },
  error: {
    base: 'oklch(0.55 0.22 25)',
    light: 'oklch(0.65 0.18 25)',
    dark: 'oklch(0.45 0.24 25)',
    background: 'oklch(0.97 0.03 25)',
    foreground: 'oklch(0.40 0.20 25)',
  },
  info: {
    base: 'oklch(0.60 0.12 240)',
    light: 'oklch(0.70 0.10 240)',
    dark: 'oklch(0.50 0.14 240)',
    background: 'oklch(0.96 0.02 240)',
    foreground: 'oklch(0.25 0.05 240)',
  },
} as const;

/**
 * Neutral color scale for text, borders, and backgrounds
 *
 * 12-step scale optimized for UI hierarchy and accessibility
 */
export const neutralColors = {
  50: 'oklch(0.99 0 0)',      // Almost white - page backgrounds
  100: 'oklch(0.98 0.005 250)', // Subtle backgrounds
  200: 'oklch(0.96 0.01 250)',  // Card backgrounds
  300: 'oklch(0.93 0.015 250)', // Hover states
  400: 'oklch(0.90 0.01 250)',  // Borders, dividers
  500: 'oklch(0.80 0.02 250)',  // Disabled states
  600: 'oklch(0.70 0.02 250)',  // Placeholder text
  700: 'oklch(0.50 0.02 250)',  // Secondary text
  800: 'oklch(0.35 0.03 250)',  // Primary text
  900: 'oklch(0.20 0.03 250)',  // Headings
  950: 'oklch(0.15 0.03 250)',  // High-contrast text
} as const;

/**
 * Data visualization color palette
 *
 * Optimized for charts, graphs, and multi-category data representation
 * Ensures accessibility with sufficient contrast and color-blind safe combinations
 */
export const chartColors = {
  primary: [
    'oklch(0.60 0.12 200)',   // Teal
    'oklch(0.75 0.15 85)',    // Gold
    'oklch(0.25 0.05 250)',   // Navy
    'oklch(0.65 0.15 145)',   // Green
    'oklch(0.70 0.15 310)',   // Purple
    'oklch(0.65 0.18 25)',    // Red-Orange
    'oklch(0.70 0.12 180)',   // Cyan
    'oklch(0.75 0.12 45)',    // Orange
  ],
  monochrome: [
    'oklch(0.20 0.03 250)',
    'oklch(0.35 0.03 250)',
    'oklch(0.50 0.02 250)',
    'oklch(0.65 0.02 250)',
    'oklch(0.80 0.01 250)',
    'oklch(0.90 0.01 250)',
  ],
  diverging: {
    positive: 'oklch(0.65 0.15 145)',
    neutral: 'oklch(0.90 0.01 250)',
    negative: 'oklch(0.55 0.22 25)',
  },
} as const;

/**
 * Shadow color tokens for elevation hierarchy
 *
 * Uses navy-tinted shadows for brand consistency
 */
export const shadowColors = {
  light: 'oklch(0.25 0.05 250 / 0.04)',
  medium: 'oklch(0.25 0.05 250 / 0.08)',
  strong: 'oklch(0.25 0.05 250 / 0.12)',
  intense: 'oklch(0.25 0.05 250 / 0.16)',
} as const;

/**
 * CSS custom property names for Tailwind integration
 *
 * Maps design tokens to CSS variables for dynamic theming
 */
export const cssVariables = {
  // Brand colors
  '--color-brand-navy': brandColors.navy.base,
  '--color-brand-teal': brandColors.teal.base,
  '--color-brand-gold': brandColors.gold.base,

  // Semantic colors
  '--color-success': semanticColors.success.base,
  '--color-warning': semanticColors.warning.base,
  '--color-error': semanticColors.error.base,
  '--color-info': semanticColors.info.base,

  // Neutral scale
  '--color-neutral-50': neutralColors[50],
  '--color-neutral-100': neutralColors[100],
  '--color-neutral-200': neutralColors[200],
  '--color-neutral-300': neutralColors[300],
  '--color-neutral-400': neutralColors[400],
  '--color-neutral-500': neutralColors[500],
  '--color-neutral-600': neutralColors[600],
  '--color-neutral-700': neutralColors[700],
  '--color-neutral-800': neutralColors[800],
  '--color-neutral-900': neutralColors[900],
  '--color-neutral-950': neutralColors[950],

  // Shadow colors
  '--color-shadow-light': shadowColors.light,
  '--color-shadow-medium': shadowColors.medium,
  '--color-shadow-strong': shadowColors.strong,
  '--color-shadow-intense': shadowColors.intense,
} as const;

/**
 * Type-safe color getter utilities
 */
export type BrandColorName = keyof typeof brandColors;
export type SemanticColorName = keyof typeof semanticColors;
export type NeutralColorValue = keyof typeof neutralColors;

/**
 * Helper function to get brand color with optional shade
 *
 * @param color - Brand color name (navy, teal, gold)
 * @param shade - Optional shade variant (base, light, dark, etc.)
 * @returns OKLCH color value
 *
 * @example
 * ```typescript
 * const navyColor = getBrandColor('navy'); // oklch(0.25 0.05 250)
 * const lightTeal = getBrandColor('teal', 'light'); // oklch(0.70 0.13 200)
 * ```
 */
export function getBrandColor(
  color: BrandColorName,
  shade: keyof typeof brandColors.navy = 'base'
): string {
  return brandColors[color][shade as keyof typeof brandColors.navy] as string;
}
