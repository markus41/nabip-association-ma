/**
 * Brookside BI Design System - Design Tokens Index
 *
 * Centralized export of all design tokens establishing scalable foundation
 * for consistent UI development across the NABIP AMS platform.
 *
 * Token categories:
 * - Colors: Brand palette, semantic states, neutrals, charts
 * - Typography: Font scales, weights, feature settings
 * - Spacing: Layout system, borders, breakpoints
 * - Shadows: Elevation hierarchy, focus rings, effects
 *
 * Best for: Ensuring design consistency across enterprise applications
 *
 * @module design-system/tokens
 */

// Color tokens
export {
  brandColors,
  semanticColors,
  neutralColors,
  chartColors,
  shadowColors,
  cssVariables as colorCssVariables,
  getBrandColor,
  type BrandColorName,
  type SemanticColorName,
  type NeutralColorValue,
} from './colors';

// Typography tokens
export {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacings,
  typographyClasses,
  fontFeatureSettings,
  cssVariables as typographyCssVariables,
  getTypographyStyles,
  getFontFeatures,
  type FontSizeKey,
  type FontWeightKey,
  type LineHeightKey,
} from './typography';

// Spacing tokens
export {
  spacing,
  semanticSpacing,
  borderRadius,
  borderWidth,
  containerMaxWidth,
  breakpoints,
  zIndex,
  cssVariables as spacingCssVariables,
  getSpacing,
  getSemanticSpacing,
  getFluidSpacing,
  type SpacingKey,
  type SemanticSpacingCategory,
  type BorderRadiusKey,
  type ZIndexKey,
} from './spacing';

// Shadow tokens
export {
  shadows,
  innerShadows,
  focusRings,
  coloredShadows,
  glows,
  semanticShadows,
  cssVariables as shadowCssVariables,
  getShadow,
  getColoredShadow,
  combineShadows,
  type ShadowKey,
  type InnerShadowKey,
  type FocusRingKey,
  type ColoredShadowColor,
  type ColoredShadowSize,
} from './shadows';

/**
 * Combined CSS variables object for global theme injection
 *
 * Merges all token categories into single object for Tailwind configuration
 */
export const allCssVariables = {
  ...require('./colors').cssVariables,
  ...require('./typography').cssVariables,
  ...require('./spacing').cssVariables,
  ...require('./shadows').cssVariables,
} as const;

/**
 * Design token metadata
 *
 * Version tracking and documentation for token system
 */
export const tokenMetadata = {
  version: '1.0.0',
  lastUpdated: '2025-01-15',
  description: 'Brookside BI Design System - Core design tokens for NABIP AMS',
  brandGuidelines: {
    palette: 'Apple/Stripe-inspired radical simplicity',
    colorSpace: 'OKLCH for perceptual uniformity',
    spacingSystem: '8px base unit with geometric progression',
    typography: 'Inter font family with fluid responsive scaling',
    shadows: 'Navy-tinted subtle elevation hierarchy',
  },
  accessibility: {
    contrastRatio: 'WCAG 2.1 Level AA compliant',
    touchTargets: '44px minimum for AAA compliance',
    focusIndicators: 'High-contrast 3px rings',
    colorBlindSafe: 'Chart colors validated for deuteranopia/protanopia',
  },
  performance: {
    fontLoading: 'System fallbacks for instant rendering',
    colorFormat: 'OKLCH native browser support',
    shadowLayers: 'Maximum 2 layers per elevation',
  },
} as const;
