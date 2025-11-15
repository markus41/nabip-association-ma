/**
 * Brookside BI Design System - Shadow & Elevation Tokens
 *
 * Establish depth hierarchy using subtle, navy-tinted shadows aligned with
 * Apple/Stripe-inspired design principles for professional enterprise UIs.
 *
 * Shadow philosophy:
 * - Subtle navy tints maintain brand consistency
 * - Progressive elevation for clear hierarchy
 * - Optimized for both light and dark modes
 * - Performance-conscious (minimal layers)
 *
 * Best for: Creating visual depth without overwhelming data-dense interfaces
 *
 * @module design-system/tokens/shadows
 */

import { shadowColors } from './colors';

/**
 * Shadow elevation levels
 *
 * 6-level system from flat (0) to floating (5) for clear depth hierarchy
 * Each level uses multi-layer shadows for realistic depth perception
 */
export const shadows = {
  /**
   * None - Flat elements, no elevation
   */
  none: 'none',

  /**
   * XS - Minimal elevation for subtle depth
   * Use: Hover states, slight lift on interaction
   */
  xs: `0 1px 2px 0 ${shadowColors.light}`,

  /**
   * SM - Small elevation for cards and buttons
   * Use: Default cards, raised buttons, input fields
   */
  sm: [
    `0 1px 3px 0 ${shadowColors.light}`,
    `0 1px 2px -1px ${shadowColors.light}`,
  ].join(', '),

  /**
   * MD - Medium elevation for panels and modals
   * Use: Dropdowns, popovers, elevated cards
   */
  md: [
    `0 4px 6px -1px ${shadowColors.medium}`,
    `0 2px 4px -2px ${shadowColors.light}`,
  ].join(', '),

  /**
   * LG - Large elevation for floating elements
   * Use: Modals, dialogs, command palette
   */
  lg: [
    `0 10px 15px -3px ${shadowColors.medium}`,
    `0 4px 6px -4px ${shadowColors.light}`,
  ].join(', '),

  /**
   * XL - Extra large elevation for prominent overlays
   * Use: Full-screen modals, drawer panels
   */
  xl: [
    `0 20px 25px -5px ${shadowColors.strong}`,
    `0 8px 10px -6px ${shadowColors.medium}`,
  ].join(', '),

  /**
   * 2XL - Maximum elevation for critical overlays
   * Use: Notifications, alerts requiring immediate attention
   */
  '2xl': [
    `0 25px 50px -12px ${shadowColors.intense}`,
    `0 12px 16px -8px ${shadowColors.strong}`,
  ].join(', '),
} as const;

/**
 * Inner shadows for inset/recessed elements
 *
 * Creates depth by appearing "carved in" rather than raised
 */
export const innerShadows = {
  /**
   * Subtle inset for input fields
   */
  sm: `inset 0 1px 2px 0 ${shadowColors.light}`,

  /**
   * Medium inset for wells and containers
   */
  md: `inset 0 2px 4px 0 ${shadowColors.medium}`,

  /**
   * Deep inset for strong emphasis
   */
  lg: `inset 0 4px 8px 0 ${shadowColors.strong}`,
} as const;

/**
 * Focus ring shadows for accessibility
 *
 * High-contrast outlines for keyboard navigation visibility
 */
export const focusRings = {
  /**
   * Default focus ring - Navy brand color
   */
  default: `0 0 0 3px oklch(0.25 0.05 250 / 0.2)`,

  /**
   * Teal focus ring - Secondary actions
   */
  teal: `0 0 0 3px oklch(0.60 0.12 200 / 0.2)`,

  /**
   * Gold focus ring - Success states
   */
  gold: `0 0 0 3px oklch(0.75 0.15 85 / 0.2)`,

  /**
   * Error focus ring - Invalid inputs
   */
  error: `0 0 0 3px oklch(0.55 0.22 25 / 0.2)`,

  /**
   * Strong focus ring - High contrast mode
   */
  strong: `0 0 0 4px oklch(0.25 0.05 250 / 0.4)`,
} as const;

/**
 * Colored shadows for brand accent highlights
 *
 * Used sparingly for emphasis on key interactive elements
 */
export const coloredShadows = {
  navy: {
    sm: `0 4px 6px -1px oklch(0.25 0.05 250 / 0.1)`,
    md: `0 10px 15px -3px oklch(0.25 0.05 250 / 0.15)`,
    lg: `0 20px 25px -5px oklch(0.25 0.05 250 / 0.2)`,
  },
  teal: {
    sm: `0 4px 6px -1px oklch(0.60 0.12 200 / 0.1)`,
    md: `0 10px 15px -3px oklch(0.60 0.12 200 / 0.15)`,
    lg: `0 20px 25px -5px oklch(0.60 0.12 200 / 0.2)`,
  },
  gold: {
    sm: `0 4px 6px -1px oklch(0.75 0.15 85 / 0.1)`,
    md: `0 10px 15px -3px oklch(0.75 0.15 85 / 0.15)`,
    lg: `0 20px 25px -5px oklch(0.75 0.15 85 / 0.2)`,
  },
} as const;

/**
 * Glow effects for interactive states
 *
 * Subtle luminescence for hover/active states
 */
export const glows = {
  /**
   * Subtle glow for hover states
   */
  soft: `0 0 20px oklch(0.25 0.05 250 / 0.05)`,

  /**
   * Medium glow for active states
   */
  medium: `0 0 30px oklch(0.25 0.05 250 / 0.1)`,

  /**
   * Strong glow for emphasis
   */
  strong: `0 0 40px oklch(0.25 0.05 250 / 0.15)`,

  /**
   * Brand-colored glows
   */
  teal: `0 0 30px oklch(0.60 0.12 200 / 0.2)`,
  gold: `0 0 30px oklch(0.75 0.15 85 / 0.2)`,
} as const;

/**
 * Semantic shadow mappings for component states
 *
 * Maps UI intent to appropriate shadow elevation
 */
export const semanticShadows = {
  /**
   * Cards and panels
   */
  card: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.xs,
  },

  /**
   * Buttons
   */
  button: {
    default: shadows.xs,
    hover: shadows.sm,
    active: innerShadows.sm,
  },

  /**
   * Modals and overlays
   */
  modal: {
    default: shadows.xl,
    backdrop: shadows['2xl'],
  },

  /**
   * Dropdowns and menus
   */
  dropdown: {
    default: shadows.lg,
  },

  /**
   * Tooltips and popovers
   */
  popover: {
    default: shadows.md,
  },

  /**
   * Input fields
   */
  input: {
    default: innerShadows.sm,
    focus: focusRings.default,
    error: focusRings.error,
  },
} as const;

/**
 * CSS custom property names for Tailwind integration
 */
export const cssVariables = {
  // Shadow elevations
  '--shadow-xs': shadows.xs,
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.md,
  '--shadow-lg': shadows.lg,
  '--shadow-xl': shadows.xl,
  '--shadow-2xl': shadows['2xl'],

  // Inner shadows
  '--shadow-inner-sm': innerShadows.sm,
  '--shadow-inner-md': innerShadows.md,
  '--shadow-inner-lg': innerShadows.lg,

  // Focus rings
  '--focus-ring-default': focusRings.default,
  '--focus-ring-teal': focusRings.teal,
  '--focus-ring-gold': focusRings.gold,
  '--focus-ring-error': focusRings.error,
} as const;

/**
 * Type-safe shadow utilities
 */
export type ShadowKey = keyof typeof shadows;
export type InnerShadowKey = keyof typeof innerShadows;
export type FocusRingKey = keyof typeof focusRings;
export type ColoredShadowColor = keyof typeof coloredShadows;
export type ColoredShadowSize = keyof typeof coloredShadows.navy;

/**
 * Helper function to get shadow by elevation level
 *
 * @param level - Shadow elevation key
 * @returns CSS box-shadow value
 *
 * @example
 * ```typescript
 * const cardShadow = getShadow('sm');
 * // '0 1px 3px 0 oklch(...), 0 1px 2px -1px oklch(...)'
 * ```
 */
export function getShadow(level: ShadowKey): string {
  return shadows[level];
}

/**
 * Helper function to get colored shadow
 *
 * @param color - Brand color (navy, teal, gold)
 * @param size - Shadow size (sm, md, lg)
 * @returns CSS box-shadow value with color
 *
 * @example
 * ```typescript
 * const tealShadow = getColoredShadow('teal', 'md');
 * ```
 */
export function getColoredShadow(
  color: ColoredShadowColor,
  size: ColoredShadowSize
): string {
  return coloredShadows[color][size];
}

/**
 * Helper function to combine multiple shadows
 *
 * @param shadows - Array of shadow values to combine
 * @returns Combined CSS box-shadow value
 *
 * @example
 * ```typescript
 * const combined = combineShadows([shadows.sm, focusRings.default]);
 * // Combines elevation shadow with focus ring
 * ```
 */
export function combineShadows(shadows: string[]): string {
  return shadows.join(', ');
}
