/**
 * Typography Components for NABIP AMS
 *
 * Establishes consistent typographic hierarchy across the association management platform.
 * Designed to streamline content presentation while maintaining WCAG 2.1 AA readability standards.
 *
 * Best for: Creating accessible, semantically correct text content with proper visual hierarchy
 */

import { cn } from '@/lib/utils'
import { HTMLAttributes, forwardRef } from 'react'

// ============================================================================
// HEADING COMPONENTS
// ============================================================================

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Visual styling variant - allows semantic HTML to differ from visual appearance
   * Best for: Maintaining SEO/accessibility while achieving desired design hierarchy
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * H1 - Primary page heading
 * Best for: Page titles, main section headings requiring maximum visual prominence
 */
export const H1 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = 'h1', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl',
          'text-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
H1.displayName = 'H1'

/**
 * H2 - Secondary section heading
 * Best for: Major section divisions, feature area titles
 */
export const H2 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = 'h2', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'scroll-m-20 text-3xl font-semibold tracking-tight',
          'text-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
H2.displayName = 'H2'

/**
 * H3 - Tertiary section heading
 * Best for: Subsections, card titles, dialog headings
 */
export const H3 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'scroll-m-20 text-2xl font-semibold tracking-tight',
          'text-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
H3.displayName = 'H3'

/**
 * H4 - Quaternary heading
 * Best for: List section headers, minor divisions within cards
 */
export const H4 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = 'h4', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'scroll-m-20 text-xl font-semibold tracking-tight',
          'text-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
H4.displayName = 'H4'

// ============================================================================
// TEXT COMPONENTS
// ============================================================================

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  /**
   * Size variant for text scaling
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  /**
   * Visual emphasis variant
   */
  variant?: 'default' | 'muted' | 'subtle'
  /**
   * Semantic element to render
   */
  as?: 'p' | 'span' | 'div'
}

/**
 * Text - Flexible body text component with size and color variants
 * Best for: General content paragraphs, inline text, descriptive labels
 *
 * @example
 * ```tsx
 * <Text>Default paragraph text</Text>
 * <Text size="sm" variant="muted">Small muted helper text</Text>
 * <Text size="lg" as="span">Large inline text</Text>
 * ```
 */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size = 'base', variant = 'default', as: Component = 'p', ...props }, ref) => {
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    }

    const variantClasses = {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      subtle: 'text-muted-foreground/70',
    }

    return (
      <Component
        ref={ref}
        className={cn(
          'leading-relaxed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Text.displayName = 'Text'

/**
 * Lead - Emphasized introductory text
 * Best for: Page/section introductions, feature descriptions, important announcements
 */
export const Lead = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-lg text-muted-foreground leading-relaxed', className)}
        {...props}
      />
    )
  }
)
Lead.displayName = 'Lead'

/**
 * Label - Form field labels and metadata
 * Best for: Input labels, data attribute labels, tag-like text
 */
export const Label = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none text-foreground',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = 'Label'

/**
 * Caption - Small supplementary text
 * Best for: Timestamps, metadata, helper text, image captions
 */
export const Caption = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('text-xs text-muted-foreground', className)}
        {...props}
      />
    )
  }
)
Caption.displayName = 'Caption'

/**
 * Code - Inline code snippet
 * Best for: Technical documentation, API references, configuration values
 */
export const Code = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium',
          'text-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
Code.displayName = 'Code'

/**
 * Blockquote - Quoted text with visual emphasis
 * Best for: Testimonials, citations, important callouts
 */
export const Blockquote = forwardRef<HTMLQuoteElement, HTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => {
    return (
      <blockquote
        ref={ref}
        className={cn(
          'mt-6 border-l-4 border-primary pl-6 italic text-muted-foreground',
          className
        )}
        {...props}
      />
    )
  }
)
Blockquote.displayName = 'Blockquote'

/**
 * List - Ordered or unordered lists with proper spacing
 * Best for: Bullet point content, numbered steps, feature lists
 */
export interface ListProps extends HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  ordered?: boolean
}

export const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(
  ({ className, ordered = false, ...props }, ref) => {
    const Component = ordered ? 'ol' : 'ul'
    return (
      <Component
        ref={ref as any}
        className={cn(
          'my-6 ml-6 space-y-2 text-foreground',
          ordered ? 'list-decimal' : 'list-disc',
          className
        )}
        {...props}
      />
    )
  }
)
List.displayName = 'List'

/**
 * ListItem - Individual list item with proper styling
 */
export const ListItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn('leading-relaxed', className)}
        {...props}
      />
    )
  }
)
ListItem.displayName = 'ListItem'

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Muted - Subdued text for de-emphasized content
 * Best for: Secondary information, disabled states, placeholder text
 */
export const Muted = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    )
  }
)
Muted.displayName = 'Muted'

/**
 * Small - Reduced size text for legal, footnotes, fine print
 * Best for: Terms & conditions, copyright notices, disclaimers
 */
export const Small = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <small
        ref={ref}
        className={cn('text-xs font-medium leading-none text-muted-foreground', className)}
        {...props}
      />
    )
  }
)
Small.displayName = 'Small'

/**
 * Strong - Bold emphasis for important inline text
 * Best for: Key terms, important phrases requiring emphasis
 */
export const Strong = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return (
      <strong
        ref={ref}
        className={cn('font-semibold text-foreground', className)}
        {...props}
      />
    )
  }
)
Strong.displayName = 'Strong'
