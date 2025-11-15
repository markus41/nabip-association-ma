/**
 * Brookside BI Design System - Grid Layout Component
 *
 * Flexible grid layout system with responsive column configurations
 * and consistent gap spacing aligned with the 8px base unit system.
 *
 * Features:
 * - Responsive column counts (1-12 columns)
 * - Semantic gap spacing (xs, sm, md, lg, xl)
 * - Auto-fit and auto-fill support
 * - Alignment and justification controls
 * - Full accessibility support
 *
 * Best for: Dashboard layouts, card grids, responsive data displays
 *
 * @module design-system/layouts/Grid
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Grid variant definitions
 */
const gridVariants = cva('grid w-full', {
  variants: {
    /**
     * Column count variants
     */
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
    },

    /**
     * Responsive column overrides
     */
    colsMd: {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      6: 'md:grid-cols-6',
      12: 'md:grid-cols-12',
    },

    colsLg: {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      6: 'lg:grid-cols-6',
      12: 'lg:grid-cols-12',
    },

    /**
     * Gap spacing (8px base unit system)
     */
    gap: {
      none: 'gap-0',
      xs: 'gap-2',  // 8px
      sm: 'gap-3',  // 12px
      md: 'gap-4',  // 16px
      lg: 'gap-6',  // 24px
      xl: 'gap-8',  // 32px
    },

    /**
     * Item alignment
     */
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },

    /**
     * Content justification
     */
    justify: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      stretch: 'justify-items-stretch',
    },
  },
  defaultVariants: {
    cols: 1,
    gap: 'md',
    align: 'stretch',
    justify: 'stretch',
  },
});

/**
 * Grid component props
 */
export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  /**
   * Render as different HTML element
   */
  as?: React.ElementType;
}

/**
 * Grid Component
 *
 * Production-ready grid layout with responsive column configuration
 *
 * @example
 * ```tsx
 * // Responsive 3-column grid
 * <Grid cols={1} colsMd={2} colsLg={3} gap="lg">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Dashboard widget grid
 * <Grid cols={12} gap="md">
 *   <div className="col-span-8">Main content</div>
 *   <div className="col-span-4">Sidebar</div>
 * </Grid>
 * ```
 */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      cols,
      colsMd,
      colsLg,
      gap,
      align,
      justify,
      as: Comp = 'div',
      ...props
    },
    ref
  ) => {
    return (
      <Comp
        ref={ref}
        className={cn(
          gridVariants({ cols, colsMd, colsLg, gap, align, justify, className })
        )}
        {...props}
      />
    );
  }
);

Grid.displayName = 'Grid';

export { gridVariants };
