/**
 * Brookside BI Design System - Stack Layout Component
 *
 * Vertical or horizontal stack layout with consistent spacing
 * optimized for form fields, lists, and sequential content.
 *
 * Features:
 * - Vertical and horizontal orientations
 * - Semantic gap spacing aligned with design tokens
 * - Alignment and distribution controls
 * - Divider support between items
 * - Full accessibility support
 *
 * Best for: Forms, vertical navigation, content lists
 *
 * @module design-system/layouts/Stack
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Stack variant definitions
 */
const stackVariants = cva('flex', {
  variants: {
    /**
     * Stack direction
     */
    direction: {
      vertical: 'flex-col',
      horizontal: 'flex-row',
    },

    /**
     * Gap spacing (8px base unit system)
     */
    gap: {
      none: 'gap-0',
      xs: 'gap-2',   // 8px
      sm: 'gap-3',   // 12px
      md: 'gap-4',   // 16px
      lg: 'gap-6',   // 24px
      xl: 'gap-8',   // 32px
      '2xl': 'gap-12', // 48px
    },

    /**
     * Item alignment (cross-axis)
     */
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },

    /**
     * Content justification (main-axis)
     */
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },

    /**
     * Wrap behavior
     */
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },

    /**
     * Full width/height
     */
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    direction: 'vertical',
    gap: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: false,
    fullWidth: false,
  },
});

/**
 * Stack component props
 */
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  /**
   * Render as different HTML element
   */
  as?: React.ElementType;

  /**
   * Show dividers between items
   */
  dividers?: boolean;
}

/**
 * Stack Component
 *
 * Production-ready vertical/horizontal stack layout
 *
 * @example
 * ```tsx
 * // Vertical form stack
 * <Stack gap="lg">
 *   <FormField label="Name" />
 *   <FormField label="Email" />
 *   <FormField label="Phone" />
 * </Stack>
 *
 * // Horizontal button group
 * <Stack direction="horizontal" gap="sm" justify="end">
 *   <Button variant="outline">Cancel</Button>
 *   <Button variant="primary">Submit</Button>
 * </Stack>
 *
 * // Stack with dividers
 * <Stack dividers gap="md">
 *   <ListItem />
 *   <ListItem />
 *   <ListItem />
 * </Stack>
 * ```
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction,
      gap,
      align,
      justify,
      wrap,
      fullWidth,
      dividers = false,
      as: Comp = 'div',
      children,
      ...props
    },
    ref
  ) => {
    const dividerClass =
      direction === 'horizontal'
        ? 'divide-x divide-[oklch(0.90_0.01_250)]'
        : 'divide-y divide-[oklch(0.90_0.01_250)]';

    return (
      <Comp
        ref={ref}
        className={cn(
          stackVariants({ direction, gap, align, justify, wrap, fullWidth }),
          dividers && dividerClass,
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Stack.displayName = 'Stack';

export { stackVariants };
