/**
 * Brookside BI Design System - Spacing & Layout Tokens
 *
 * Establish harmonious spatial relationships using an 8px base unit system
 * that scales consistently across responsive breakpoints for enterprise UIs.
 *
 * Based on 8px grid for pixel-perfect alignment and mathematical predictability
 *
 * Best for: Complex layouts requiring consistent visual rhythm and hierarchy
 *
 * @module design-system/tokens/spacing
 */

/**
 * Base spacing unit (8px)
 *
 * All spacing values are multiples of this base for mathematical consistency
 */
const BASE_UNIT = 8;

/**
 * Spacing scale using 8px base unit
 *
 * Values progress geometrically for clear visual hierarchy
 * Each step represents a meaningful spatial relationship
 */
export const spacing = {
  0: '0',
  1: `${BASE_UNIT * 0.125}px`,  // 1px - Hairline borders, subtle dividers
  2: `${BASE_UNIT * 0.25}px`,   // 2px - Fine spacing adjustments
  4: `${BASE_UNIT * 0.5}px`,    // 4px - Tight spacing within components
  8: `${BASE_UNIT}px`,          // 8px - Base unit, minimum touch target padding
  12: `${BASE_UNIT * 1.5}px`,   // 12px - Compact spacing
  16: `${BASE_UNIT * 2}px`,     // 16px - Default component padding
  20: `${BASE_UNIT * 2.5}px`,   // 20px - Comfortable spacing
  24: `${BASE_UNIT * 3}px`,     // 24px - Section spacing
  32: `${BASE_UNIT * 4}px`,     // 32px - Card padding, container spacing
  40: `${BASE_UNIT * 5}px`,     // 40px - Large gaps
  48: `${BASE_UNIT * 6}px`,     // 48px - Major section dividers
  64: `${BASE_UNIT * 8}px`,     // 64px - Page-level spacing
  80: `${BASE_UNIT * 10}px`,    // 80px - Extra large gaps
  96: `${BASE_UNIT * 12}px`,    // 96px - Hero section spacing
  128: `${BASE_UNIT * 16}px`,   // 128px - Maximum vertical spacing
} as const;

/**
 * Semantic spacing tokens for specific use cases
 *
 * Maps intent to spacing values for consistent application
 */
export const semanticSpacing = {
  /**
   * Component internal spacing
   */
  component: {
    xs: spacing[8],   // Tight padding for buttons, badges
    sm: spacing[12],  // Compact padding for inputs
    md: spacing[16],  // Default padding for most components
    lg: spacing[24],  // Spacious padding for cards
    xl: spacing[32],  // Large padding for containers
  },

  /**
   * Gap spacing between elements
   */
  gap: {
    xs: spacing[4],   // Tight gaps in button groups
    sm: spacing[8],   // Default gap in flex/grid layouts
    md: spacing[12],  // Comfortable gap between cards
    lg: spacing[16],  // Large gaps in grid layouts
    xl: spacing[24],  // Section-level gaps
  },

  /**
   * Stack spacing for vertical layouts
   */
  stack: {
    xs: spacing[8],   // Tight vertical spacing
    sm: spacing[12],  // Compact lists
    md: spacing[16],  // Default form field spacing
    lg: spacing[24],  // Section spacing
    xl: spacing[32],  // Major section dividers
  },

  /**
   * Container padding for different breakpoints
   */
  container: {
    mobile: spacing[16],   // 16px on mobile
    tablet: spacing[24],   // 24px on tablet
    desktop: spacing[32],  // 32px on desktop
    wide: spacing[40],     // 40px on wide screens
  },

  /**
   * Touch target minimum size (accessibility)
   */
  touch: {
    min: '44px',  // WCAG 2.1 AAA minimum touch target
    comfortable: '48px',
  },
} as const;

/**
 * Border radius scale for component styling
 *
 * Aligned with Brookside BI's subtle, professional aesthetic
 */
export const borderRadius = {
  none: '0',
  sm: '4px',      // Small - Pills, badges
  md: '6px',      // Medium - Buttons, inputs
  lg: '8px',      // Large - Cards, modals
  xl: '12px',     // Extra large - Hero cards
  '2xl': '16px',  // Double XL - Featured sections
  '3xl': '24px',  // Triple XL - Prominent containers
  full: '9999px', // Full - Circles, pills
} as const;

/**
 * Border width scale
 *
 * Limited to essential widths for visual clarity
 */
export const borderWidth = {
  none: '0',
  thin: '1px',    // Default borders, dividers
  medium: '2px',  // Emphasized borders, focus rings
  thick: '3px',   // Strong emphasis, active states
  heavy: '4px',   // Maximum border weight
} as const;

/**
 * Container max widths for responsive layouts
 *
 * Optimized for readability and content density across viewports
 */
export const containerMaxWidth = {
  xs: '320px',    // Mobile minimum
  sm: '640px',    // Small devices
  md: '768px',    // Tablets
  lg: '1024px',   // Small desktops
  xl: '1280px',   // Standard desktops
  '2xl': '1536px',// Wide screens
  '3xl': '1920px',// Maximum width for content
  full: '100%',   // Full viewport width
} as const;

/**
 * Breakpoint definitions matching container widths
 *
 * Mobile-first responsive design approach
 */
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

/**
 * Z-index scale for layering components
 *
 * Establishes clear stacking context for overlapping elements
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  notification: 1600,
  max: 9999,
} as const;

/**
 * CSS custom property names for Tailwind integration
 */
export const cssVariables = {
  // Spacing scale
  '--spacing-0': spacing[0],
  '--spacing-1': spacing[1],
  '--spacing-2': spacing[2],
  '--spacing-4': spacing[4],
  '--spacing-8': spacing[8],
  '--spacing-12': spacing[12],
  '--spacing-16': spacing[16],
  '--spacing-20': spacing[20],
  '--spacing-24': spacing[24],
  '--spacing-32': spacing[32],
  '--spacing-40': spacing[40],
  '--spacing-48': spacing[48],
  '--spacing-64': spacing[64],
  '--spacing-80': spacing[80],
  '--spacing-96': spacing[96],
  '--spacing-128': spacing[128],

  // Border radius
  '--radius-sm': borderRadius.sm,
  '--radius-md': borderRadius.md,
  '--radius-lg': borderRadius.lg,
  '--radius-xl': borderRadius.xl,
  '--radius-2xl': borderRadius['2xl'],
  '--radius-3xl': borderRadius['3xl'],
  '--radius-full': borderRadius.full,

  // Z-index
  '--z-index-dropdown': zIndex.dropdown.toString(),
  '--z-index-sticky': zIndex.sticky.toString(),
  '--z-index-overlay': zIndex.overlay.toString(),
  '--z-index-modal': zIndex.modal.toString(),
  '--z-index-popover': zIndex.popover.toString(),
  '--z-index-tooltip': zIndex.tooltip.toString(),
  '--z-index-notification': zIndex.notification.toString(),
} as const;

/**
 * Type-safe spacing utilities
 */
export type SpacingKey = keyof typeof spacing;
export type SemanticSpacingCategory = keyof typeof semanticSpacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ZIndexKey = keyof typeof zIndex;

/**
 * Helper function to get spacing value
 *
 * @param size - Spacing key from spacing scale
 * @returns Pixel value as string
 *
 * @example
 * ```typescript
 * const padding = getSpacing(16); // '16px'
 * ```
 */
export function getSpacing(size: SpacingKey): string {
  return spacing[size];
}

/**
 * Helper function to get semantic spacing
 *
 * @param category - Semantic category (component, gap, stack, etc.)
 * @param size - Size variant (xs, sm, md, lg, xl)
 * @returns Pixel value as string
 *
 * @example
 * ```typescript
 * const cardPadding = getSemanticSpacing('component', 'lg'); // '24px'
 * ```
 */
export function getSemanticSpacing(
  category: SemanticSpacingCategory,
  size: keyof typeof semanticSpacing.component
): string {
  return semanticSpacing[category][size];
}

/**
 * Helper function to calculate responsive spacing
 *
 * @param min - Minimum spacing value at mobile breakpoint
 * @param max - Maximum spacing value at desktop breakpoint
 * @returns CSS clamp() function for fluid spacing
 *
 * @example
 * ```typescript
 * const fluidPadding = getFluidSpacing(16, 32);
 * // 'clamp(16px, 1rem + 1vw, 32px)'
 * ```
 */
export function getFluidSpacing(min: number, max: number): string {
  const minRem = min / 16;
  const maxRem = max / 16;
  const slope = (max - min) / (1920 - 320);
  const intercept = min - slope * 320;

  return `clamp(${min}px, ${intercept / 16}rem + ${slope * 100}vw, ${max}px)`;
}
