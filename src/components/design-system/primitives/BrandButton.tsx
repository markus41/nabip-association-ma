/**
 * Brookside BI Design System - Brand Button Component
 *
 * Enhanced button primitive with Brookside BI brand variants, comprehensive
 * accessibility features, and performance optimizations for enterprise applications.
 *
 * Features:
 * - Brand-aligned color variants (navy, teal, gold)
 * - Multiple size options with optimal touch targets
 * - Loading states with skeleton animations
 * - Icon support with proper spacing
 * - Full keyboard navigation support
 * - WCAG 2.1 AA compliant
 *
 * Best for: Primary actions, CTAs, form submissions across NABIP AMS
 *
 * @module design-system/primitives/BrandButton
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button variant definitions using class-variance-authority
 *
 * Establishes consistent visual hierarchy with brand-aligned colors
 * and state-based styling for optimal user feedback
 */
const brandButtonVariants = cva(
  // Base styles applied to all button variants
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-[3px]',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    '[&_svg:not([class*="size-"])]:size-4',
    'shrink-0',
  ].join(' '),
  {
    variants: {
      /**
       * Visual variant definitions
       */
      variant: {
        /**
         * Primary - Deep Navy brand color
         * Use for: Main CTAs, primary actions, form submissions
         */
        primary: [
          'bg-[oklch(0.25_0.05_250)] text-white shadow-sm',
          'hover:bg-[oklch(0.20_0.04_250)] hover:shadow-md',
          'active:bg-[oklch(0.15_0.03_250)] active:shadow-sm',
          'focus-visible:ring-[oklch(0.25_0.05_250/0.2)]',
        ].join(' '),

        /**
         * Secondary - Vibrant Teal
         * Use for: Secondary actions, alternative CTAs
         */
        secondary: [
          'bg-[oklch(0.60_0.12_200)] text-white shadow-sm',
          'hover:bg-[oklch(0.50_0.11_200)] hover:shadow-md',
          'active:bg-[oklch(0.40_0.10_200)] active:shadow-sm',
          'focus-visible:ring-[oklch(0.60_0.12_200/0.2)]',
        ].join(' '),

        /**
         * Accent - Warm Gold
         * Use for: Success actions, premium features, upgrades
         */
        accent: [
          'bg-[oklch(0.75_0.15_85)] text-[oklch(0.20_0.03_250)] shadow-sm',
          'hover:bg-[oklch(0.65_0.17_85)] hover:shadow-md',
          'active:bg-[oklch(0.55_0.18_85)] active:shadow-sm',
          'focus-visible:ring-[oklch(0.75_0.15_85/0.2)]',
        ].join(' '),

        /**
         * Outline - Bordered navy
         * Use for: Tertiary actions, cancel buttons, secondary navigation
         */
        outline: [
          'border-2 border-[oklch(0.25_0.05_250)]',
          'bg-transparent text-[oklch(0.25_0.05_250)]',
          'hover:bg-[oklch(0.25_0.05_250/0.05)]',
          'active:bg-[oklch(0.25_0.05_250/0.1)]',
          'focus-visible:ring-[oklch(0.25_0.05_250/0.2)]',
        ].join(' '),

        /**
         * Ghost - Minimal styling
         * Use for: Toolbar actions, subtle interactions, icon buttons
         */
        ghost: [
          'bg-transparent text-[oklch(0.20_0.03_250)]',
          'hover:bg-[oklch(0.90_0.01_250)]',
          'active:bg-[oklch(0.85_0.01_250)]',
          'focus-visible:ring-[oklch(0.25_0.05_250/0.2)]',
        ].join(' '),

        /**
         * Destructive - Error/delete actions
         * Use for: Delete operations, destructive confirmations
         */
        destructive: [
          'bg-[oklch(0.55_0.22_25)] text-white shadow-sm',
          'hover:bg-[oklch(0.45_0.24_25)] hover:shadow-md',
          'active:bg-[oklch(0.40_0.20_25)] active:shadow-sm',
          'focus-visible:ring-[oklch(0.55_0.22_25/0.2)]',
        ].join(' '),

        /**
         * Link - Text-only styled as link
         * Use for: Inline actions, navigation within text
         */
        link: [
          'text-[oklch(0.25_0.05_250)] underline-offset-4',
          'hover:underline',
          'focus-visible:ring-[oklch(0.25_0.05_250/0.2)]',
        ].join(' '),
      },

      /**
       * Size variant definitions with optimal touch targets
       */
      size: {
        /**
         * Small - Compact interfaces
         * Touch target: 32px (meets WCAG AA)
         */
        sm: 'h-8 px-3 text-xs has-[>svg]:px-2',

        /**
         * Medium - Default size
         * Touch target: 40px (meets WCAG AA)
         */
        md: 'h-10 px-4 text-sm has-[>svg]:px-3',

        /**
         * Large - Prominent CTAs
         * Touch target: 48px (meets WCAG AAA)
         */
        lg: 'h-12 px-6 text-base has-[>svg]:px-4',

        /**
         * Icon - Square button for icons only
         * Touch target: 40px × 40px
         */
        icon: 'size-10 p-0',

        /**
         * Icon Small - Compact icon button
         * Touch target: 32px × 32px
         */
        'icon-sm': 'size-8 p-0',

        /**
         * Icon Large - Prominent icon button
         * Touch target: 48px × 48px
         */
        'icon-lg': 'size-12 p-0',
      },

      /**
       * Full width variant for mobile layouts
       */
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

/**
 * BrandButton component props interface
 */
export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof brandButtonVariants> {
  /**
   * Render as child component (uses Radix Slot)
   */
  asChild?: boolean;

  /**
   * Loading state - Shows spinner and disables interaction
   */
  loading?: boolean;

  /**
   * Icon to display before button text
   */
  icon?: React.ReactNode;

  /**
   * Icon to display after button text
   */
  trailingIcon?: React.ReactNode;
}

/**
 * BrandButton Component
 *
 * Production-ready button with comprehensive accessibility support,
 * brand-aligned styling, and performance optimizations.
 *
 * @example
 * ```tsx
 * // Primary action button
 * <BrandButton variant="primary" size="lg">
 *   Submit Application
 * </BrandButton>
 *
 * // Button with icon
 * <BrandButton variant="secondary" icon={<Plus />}>
 *   Add Member
 * </BrandButton>
 *
 * // Loading state
 * <BrandButton variant="primary" loading disabled>
 *   Processing...
 * </BrandButton>
 *
 * // Icon-only button
 * <BrandButton variant="ghost" size="icon" aria-label="Close">
 *   <X />
 * </BrandButton>
 * ```
 */
export const BrandButton = React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      icon,
      trailingIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Combine disabled state with loading
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(brandButtonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        aria-busy={loading}
        data-loading={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin size-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span className="shrink-0">{icon}</span>}
        {children}
        {!loading && trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
      </Comp>
    );
  }
);

BrandButton.displayName = 'BrandButton';

/**
 * Export variants for external use (e.g., custom components)
 */
export { brandButtonVariants };

/**
 * Type exports for TypeScript consumers
 */
export type BrandButtonVariant = NonNullable<BrandButtonProps['variant']>;
export type BrandButtonSize = NonNullable<BrandButtonProps['size']>;
