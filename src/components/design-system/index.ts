/**
 * Brookside BI Design System - Main Export Index
 *
 * Centralized exports for the complete design system enabling
 * streamlined imports and optimal tree-shaking for production builds.
 *
 * Usage:
 * ```tsx
 * // Tokens
 * import { brandColors, spacing } from '@/components/design-system';
 *
 * // Components
 * import { BrandButton, Grid, DataTable } from '@/components/design-system';
 * ```
 *
 * @module design-system
 */

// ============================================================================
// Design Tokens
// ============================================================================

export * from './tokens';

// ============================================================================
// Primitive Components
// ============================================================================

export { BrandButton, brandButtonVariants } from './primitives/BrandButton';
export type { BrandButtonProps, BrandButtonVariant, BrandButtonSize } from './primitives/BrandButton';

export {
  BrandCard,
  BrandCardHeader,
  BrandCardTitle,
  BrandCardDescription,
  BrandCardAction,
  BrandCardContent,
  BrandCardFooter,
  brandCardVariants,
} from './primitives/BrandCard';
export type { BrandCardProps, BrandCardVariant, BrandCardPadding } from './primitives/BrandCard';

// ============================================================================
// Layout Primitives
// ============================================================================

export { Grid, gridVariants } from './layouts/Grid';
export type { GridProps } from './layouts/Grid';

export { Stack, stackVariants } from './layouts/Stack';
export type { StackProps } from './layouts/Stack';

export { Container, containerVariants } from './layouts/Container';
export type { ContainerProps } from './layouts/Container';

// ============================================================================
// Composite Components
// ============================================================================

export { DataTable } from './composites/DataTable';
export type { DataTableProps, DataTableColumn, SortDirection, SortState } from './composites/DataTable';

// ============================================================================
// Design System Metadata
// ============================================================================

export const designSystemVersion = '1.0.0';
export const lastUpdated = '2025-01-15';

/**
 * Design system configuration and metadata
 */
export const designSystemConfig = {
  version: designSystemVersion,
  lastUpdated,
  name: 'Brookside BI Design System',
  description: 'Production-ready component library for NABIP AMS',
  brandGuidelines: {
    colorSpace: 'OKLCH',
    spacingUnit: '8px',
    typography: 'Inter font family',
    accessibility: 'WCAG 2.1 Level AA',
  },
  components: {
    primitives: ['BrandButton', 'BrandCard'],
    layouts: ['Grid', 'Stack', 'Container'],
    composites: ['DataTable'],
  },
} as const;
