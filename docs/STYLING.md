# Styling & Design System

Design guidelines and styling conventions for the NABIP AMS.

## Design Philosophy

### Apple/Stripe-Inspired Radical Simplicity

The NABIP AMS embraces a design philosophy focused on:

- **Clarity**: Every element serves a clear purpose
- **Consistency**: Patterns repeat throughout the interface
- **Performance**: UI interactions target <100ms response time
- **Accessibility**: WCAG 2.1 AA compliance as baseline

## Color Palette

The application uses **oklch color space** for consistent, perceptually uniform colors:

### Primary Colors

```css
/* Deep Navy - Trust & Authority */
--color-primary: oklch(0.25 0.05 250);

/* Teal - Modern Energy */
--color-secondary: oklch(0.60 0.12 200);

/* Gold - Success & Premium */
--color-accent: oklch(0.75 0.15 85);
```

### Usage Guidelines

**Primary (Deep Navy)**
- Main navigation elements
- Primary buttons
- Headers and titles
- Active states

**Secondary (Teal)**
- Secondary buttons
- Links and interactive elements
- Informational badges
- Charts and data visualization accents

**Accent (Gold)**
- Success states
- Call-to-action elements
- Premium features
- Highlights and awards

### Semantic Colors

```css
/* Success */
--color-success: oklch(0.65 0.15 145);

/* Warning */
--color-warning: oklch(0.75 0.15 65);

/* Error */
--color-error: oklch(0.55 0.20 25);

/* Info */
--color-info: oklch(0.60 0.12 220);
```

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### Type Scale

```css
/* Display */
--font-size-display: 3rem;      /* 48px */
--line-height-display: 1.2;

/* Heading 1 */
--font-size-h1: 2.5rem;         /* 40px */
--line-height-h1: 1.3;

/* Heading 2 */
--font-size-h2: 2rem;           /* 32px */
--line-height-h2: 1.3;

/* Heading 3 */
--font-size-h3: 1.5rem;         /* 24px */
--line-height-h3: 1.4;

/* Body */
--font-size-body: 1rem;         /* 16px */
--line-height-body: 1.6;

/* Small */
--font-size-small: 0.875rem;    /* 14px */
--line-height-small: 1.5;

/* Tiny */
--font-size-tiny: 0.75rem;      /* 12px */
--line-height-tiny: 1.4;
```

### Font Weights

```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## Spacing System

Based on 4px base unit:

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

## Responsive Breakpoints

```css
/* Mobile First Approach */

/* Mobile */
@media (max-width: 767px) {
  /* Mobile styles */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1919px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1920px) {
  /* Desktop styles */
}
```

### Breakpoint Usage

- **Mobile (<768px)**: Single column layouts, bottom navigation
- **Tablet (768-1919px)**: Two-column layouts where appropriate
- **Desktop (1920px+)**: Full sidebar navigation, multi-column layouts

## Icon System

### Phosphor Icons

Using `@phosphor-icons/react` for consistent iconography:

```typescript
import { User, Bell, Settings, ChartBar } from '@phosphor-icons/react'
```

### Icon Weights

Use icon weight to establish visual hierarchy:

```typescript
// Regular - Default state
<User weight="regular" size={24} />

// Fill - Active/selected state
<Bell weight="fill" size={24} />

// Bold - Emphasis
<Settings weight="bold" size={24} />

// Light - Secondary actions
<ChartBar weight="light" size={24} />
```

### Icon Sizes

```typescript
// Standard sizes
size={16}  // Small (inline with text)
size={20}  // Default (buttons, nav)
size={24}  // Large (headers)
size={32}  // Extra large (feature cards)
```

## Component Patterns

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Buttons

```tsx
// Primary action
<Button variant="default">Primary Action</Button>

// Secondary action
<Button variant="outline">Secondary Action</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost (minimal)
<Button variant="ghost">Cancel</Button>

// With icon
<Button>
  <Plus size={16} className="mr-2" />
  Add Item
</Button>
```

### Dialogs

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Optional description or instructions
      </DialogDescription>
    </DialogHeader>

    {/* Dialog content */}

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Animation Guidelines

### Transition Durations

```css
--duration-fast: 150ms;      /* Micro-interactions */
--duration-normal: 250ms;    /* Standard transitions */
--duration-slow: 350ms;      /* Complex animations */
```

### Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Performance Guidelines

- Target <100ms for UI interactions
- Use CSS transforms for animations (not position)
- Prefer opacity/transform over other properties
- Use `will-change` sparingly and only when needed

## Accessibility Guidelines

### Color Contrast

- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text (18px+ or 14px+ bold)
- All interactive elements must meet contrast requirements

### Focus States

```css
/* Visible focus indicator */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order throughout application
- Skip links for main content navigation

### Screen Reader Support

```tsx
// Use semantic HTML
<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

// Provide labels for icon-only buttons
<button aria-label="Close dialog">
  <X size={20} />
</button>

// Use ARIA when semantic HTML isn't enough
<div role="alert" aria-live="polite">
  {/* Notification content */}
</div>
```

## Tailwind CSS v4 Usage

### Utility Class Patterns

```tsx
// Spacing
className="p-4 mt-6 mb-8"

// Flexbox
className="flex items-center justify-between gap-4"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Typography
className="text-lg font-semibold text-gray-900 dark:text-gray-100"

// Responsive
className="w-full md:w-1/2 lg:w-1/3"
```

### Custom Utilities

Define custom utilities in Tailwind config for repeated patterns:

```javascript
// Example custom utilities
{
  '.card-shadow': {
    'box-shadow': '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  '.button-transition': {
    'transition': 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

## Best Practices

1. **Use Shadcn/ui components** from `src/components/ui/` - avoid custom implementations
2. **Follow responsive-first** approach - design for mobile, enhance for desktop
3. **Maintain consistency** - reuse patterns throughout the application
4. **Prioritize performance** - aim for <100ms UI interactions
5. **Test accessibility** - use keyboard navigation and screen readers
6. **Use semantic HTML** - choose appropriate elements for content structure
7. **Leverage Tailwind utilities** - compose styles from utility classes
8. **Keep colors consistent** - use defined palette, avoid arbitrary colors
