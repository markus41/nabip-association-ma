/**
 * Brookside BI Design System - Brand Card Component
 *
 * Enhanced card primitive with compound component pattern for flexible
 * composition while maintaining consistent brand styling and accessibility.
 *
 * Features:
 * - Multiple visual variants (elevated, bordered, ghost)
 * - Compound component architecture for flexible layouts
 * - Interactive states (hover, active, focus)
 * - Optional clickable card support
 * - Semantic HTML with proper ARIA attributes
 * - WCAG 2.1 AA compliant
 *
 * Best for: Data display, content grouping, dashboard widgets
 *
 * @module design-system/primitives/BrandCard
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card variant definitions using class-variance-authority
 *
 * Establishes visual hierarchy through elevation, borders, and spacing
 */
const brandCardVariants = cva(
  // Base styles for all card variants
  [
    'bg-white rounded-xl transition-all duration-200',
    'flex flex-col gap-4',
  ].join(' '),
  {
    variants: {
      /**
       * Visual variant definitions
       */
      variant: {
        /**
         * Elevated - Default card with shadow
         * Use for: Primary content containers, dashboard widgets
         */
        elevated: [
          'shadow-[0_1px_3px_0_oklch(0.25_0.05_250/0.04),0_1px_2px_-1px_oklch(0.25_0.05_250/0.04)]',
          'hover:shadow-[0_4px_6px_-1px_oklch(0.25_0.05_250/0.08),0_2px_4px_-2px_oklch(0.25_0.05_250/0.04)]',
        ].join(' '),

        /**
         * Bordered - Card with border, no shadow
         * Use for: Secondary content, list items, nested cards
         */
        bordered: [
          'border border-[oklch(0.90_0.01_250)]',
          'hover:border-[oklch(0.80_0.02_250)]',
        ].join(' '),

        /**
         * Ghost - Minimal styling
         * Use for: Subtle content grouping, low-emphasis containers
         */
        ghost: [
          'bg-[oklch(0.98_0.005_250)]',
          'hover:bg-[oklch(0.96_0.01_250)]',
        ].join(' '),

        /**
         * Outline - Bordered with emphasis
         * Use for: Important grouped content, callouts
         */
        outline: [
          'border-2 border-[oklch(0.25_0.05_250)]',
        ].join(' '),

        /**
         * Accent - Gold-tinted background
         * Use for: Success states, premium features, highlights
         */
        accent: [
          'bg-[oklch(0.97_0.03_85)]',
          'border border-[oklch(0.75_0.15_85/0.3)]',
          'hover:bg-[oklch(0.95_0.04_85)]',
        ].join(' '),
      },

      /**
       * Padding size variants
       */
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },

      /**
       * Interactive state for clickable cards
       */
      interactive: {
        true: [
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-[3px]',
          'focus-visible:ring-[oklch(0.25_0.05_250/0.2)]',
          'active:scale-[0.98]',
        ].join(' '),
        false: '',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      padding: 'md',
      interactive: false,
    },
  }
);

/**
 * Card component props interface
 */
export interface BrandCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof brandCardVariants> {
  /**
   * Render as different HTML element (e.g., article, section)
   */
  as?: React.ElementType;
}

/**
 * BrandCard Root Component
 *
 * Main card container with variant styling
 *
 * @example
 * ```tsx
 * <BrandCard variant="elevated" padding="lg">
 *   <BrandCardHeader>
 *     <BrandCardTitle>Member Statistics</BrandCardTitle>
 *     <BrandCardDescription>Overview of member growth</BrandCardDescription>
 *   </BrandCardHeader>
 *   <BrandCardContent>
 *     {/* Card content here *\/}
 *   </BrandCardContent>
 * </BrandCard>
 * ```
 */
export const BrandCard = React.forwardRef<HTMLDivElement, BrandCardProps>(
  ({ className, variant, padding, interactive, as: Comp = 'div', ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(brandCardVariants({ variant, padding, interactive, className }))}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        {...props}
      />
    );
  }
);

BrandCard.displayName = 'BrandCard';

/**
 * CardHeader component props
 */
export interface BrandCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show border bottom separator
   */
  bordered?: boolean;
}

/**
 * BrandCardHeader Component
 *
 * Card header section for title and description
 *
 * @example
 * ```tsx
 * <BrandCardHeader bordered>
 *   <BrandCardTitle>Dashboard Overview</BrandCardTitle>
 *   <BrandCardDescription>Last updated 5 minutes ago</BrandCardDescription>
 *   <BrandCardAction>
 *     <Button size="sm">Refresh</Button>
 *   </BrandCardAction>
 * </BrandCardHeader>
 * ```
 */
export const BrandCardHeader = React.forwardRef<HTMLDivElement, BrandCardHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5',
          'has-[data-card-action]:grid-cols-[1fr_auto]',
          bordered && 'pb-4 border-b border-[oklch(0.90_0.01_250)]',
          className
        )}
        {...props}
      />
    );
  }
);

BrandCardHeader.displayName = 'BrandCardHeader';

/**
 * BrandCardTitle Component
 *
 * Card title with semantic heading styling
 */
export const BrandCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        'text-[oklch(0.20_0.03_250)]',
        className
      )}
      {...props}
    />
  );
});

BrandCardTitle.displayName = 'BrandCardTitle';

/**
 * BrandCardDescription Component
 *
 * Card subtitle or description text
 */
export const BrandCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        'text-sm text-[oklch(0.50_0.02_250)]',
        'leading-relaxed',
        className
      )}
      {...props}
    />
  );
});

BrandCardDescription.displayName = 'BrandCardDescription';

/**
 * BrandCardAction Component
 *
 * Action area in card header (e.g., buttons, menus)
 */
export const BrandCardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-card-action
      className={cn(
        'col-start-2 row-span-2 row-start-1',
        'self-start justify-self-end',
        'flex items-center gap-2',
        className
      )}
      {...props}
    />
  );
});

BrandCardAction.displayName = 'BrandCardAction';

/**
 * BrandCardContent Component
 *
 * Main card content area
 */
export const BrandCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
});

BrandCardContent.displayName = 'BrandCardContent';

/**
 * BrandCardFooter Component
 *
 * Card footer section for actions or metadata
 */
export interface BrandCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show border top separator
   */
  bordered?: boolean;
}

export const BrandCardFooter = React.forwardRef<HTMLDivElement, BrandCardFooterProps>(
  ({ className, bordered = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          bordered && 'pt-4 border-t border-[oklch(0.90_0.01_250)]',
          className
        )}
        {...props}
      />
    );
  }
);

BrandCardFooter.displayName = 'BrandCardFooter';

/**
 * Export variants for external use
 */
export { brandCardVariants };

/**
 * Type exports
 */
export type BrandCardVariant = NonNullable<BrandCardProps['variant']>;
export type BrandCardPadding = NonNullable<BrandCardProps['padding']>;
