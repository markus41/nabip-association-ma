/**
 * Brookside BI Design System - Container Layout Component
 *
 * Responsive container with max-width constraints and consistent padding
 * optimized for content readability across all viewport sizes.
 *
 * Features:
 * - Responsive max-width breakpoints
 * - Automatic horizontal centering
 * - Consistent padding across breakpoints
 * - Fluid or fixed width options
 * - Full accessibility support
 *
 * Best for: Page layouts, content sections, centered containers
 *
 * @module design-system/layouts/Container
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Container variant definitions
 */
const containerVariants = cva('mx-auto w-full', {
  variants: {
    /**
     * Max width constraints
     */
    maxWidth: {
      sm: 'max-w-screen-sm',    // 640px
      md: 'max-w-screen-md',    // 768px
      lg: 'max-w-screen-lg',    // 1024px
      xl: 'max-w-screen-xl',    // 1280px
      '2xl': 'max-w-screen-2xl', // 1536px
      '3xl': 'max-w-[1920px]',  // 1920px
      full: 'max-w-full',       // No constraint
    },

    /**
     * Horizontal padding
     */
    padding: {
      none: 'px-0',
      sm: 'px-4',    // 16px
      md: 'px-6',    // 24px
      lg: 'px-8',    // 32px
      xl: 'px-12',   // 48px
    },

    /**
     * Responsive padding (increases on larger screens)
     */
    responsive: {
      true: 'px-4 md:px-6 lg:px-8',
      false: '',
    },
  },
  defaultVariants: {
    maxWidth: 'xl',
    padding: 'md',
    responsive: false,
  },
});

/**
 * Container component props
 */
export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * Render as different HTML element
   */
  as?: React.ElementType;
}

/**
 * Container Component
 *
 * Production-ready responsive container with max-width constraints
 *
 * @example
 * ```tsx
 * // Standard page container
 * <Container>
 *   <h1>Page Title</h1>
 *   <p>Content here...</p>
 * </Container>
 *
 * // Wide container for dashboards
 * <Container maxWidth="3xl" responsive>
 *   <DashboardGrid />
 * </Container>
 *
 * // Narrow container for text content
 * <Container maxWidth="md">
 *   <Article />
 * </Container>
 * ```
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      maxWidth,
      padding,
      responsive,
      as: Comp = 'div',
      ...props
    },
    ref
  ) => {
    return (
      <Comp
        ref={ref}
        className={cn(
          containerVariants({ maxWidth, padding, responsive, className })
        )}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';

export { containerVariants };
