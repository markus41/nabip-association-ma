# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NABIP Association Management System (AMS) - A comprehensive, enterprise-grade platform built for the National Association of Benefits and Insurance Professionals. This React 19 + TypeScript application manages 20,000+ members across a hierarchical structure (National → State → Local chapters) with advanced reporting, event management, and member engagement tracking.

**Built on GitHub Spark SDK** with AI capabilities and uses `useKV` hooks for persistent client-side state management.

## Development Commands

### Core Development

```bash
npm run dev          # Start development server
npm run build        # Build for production (TypeScript compilation + Vite)
npm run lint         # Run ESLint checks
npm run preview      # Preview production build
npm run optimize     # Optimize Vite dependencies
```

### Port Management (Windows)

```bash
npm run kill         # Kill process on port 5000 (uses fuser)
```

## Architecture Overview

### State Management Pattern

This application uses a **client-side persistent state architecture** via `@github/spark/hooks`:

- **`useKV<T>(key, defaultValue)`**: Primary state hook for persistent data storage
- All major entities (members, chapters, events, transactions, campaigns, courses, enrollments, reports) persist across sessions
- Data initializes on first load using generator functions from `src/lib/data-utils.ts`
- State updates trigger re-renders and automatic persistence

Example pattern:

```typescript
const [members, setMembers] = useKV<Member[]>('ams-members', [])
const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', [])
```

### Application Structure

**Main Entry**: `src/App.tsx`

- Single-page application with view-based routing (no React Router)
- Tab-based navigation with 9 main views: dashboard, members, events, communications, finance, chapters, learning, reports, portal
- Responsive layout with desktop sidebar + mobile bottom navigation
- Command palette (⌘K) for quick navigation

**Type System**: `src/lib/types.ts`

- Comprehensive TypeScript definitions for all domain models
- 15+ main entity types with strict typing for member status, event registration, payment processing, etc.
- Hierarchical chapter structure with type safety

**Data Layer**: `src/lib/data-utils.ts`

- Generator functions for mock data: `generateMembers()`, `generateChapters()`, `generateEvents()`, etc.
- Dashboard statistics calculation: `calculateDashboardStats()`
- All data generation uses realistic mock values for development

**Component Organization**:

```markdown
src/components/
├── features/          # Feature-specific components (Views, dialogs, specialized widgets)
│   ├── DashboardView.tsx
│   ├── MembersView.tsx
│   ├── EventsView.tsx
│   ├── ChaptersView.tsx
│   ├── EventCreationDialog.tsx
│   ├── ReportBuilder.tsx
│   └── ...
└── ui/                # Shadcn/ui v4 + Radix UI primitives
    ├── button.tsx
    ├── dialog.tsx
    ├── card.tsx
    └── ...
```

### UI Framework Stack

- **React 19**: Latest React with concurrent features
- **Shadcn/ui v4**: Component library built on Radix UI
- **Radix UI**: Accessible primitive components
- **Tailwind CSS v4**: Utility-first styling with `@tailwindcss/vite` plugin
- **Phosphor Icons**: Icon system (`@phosphor-icons/react`)
- **Recharts**: Data visualization and charting
- **Sonner**: Toast notifications
- **Framer Motion**: Animation library

### Path Aliases

```typescript
"@/*" → "./src/*"
```

All imports use `@/` prefix for cleaner imports (configured in `vite.config.ts` and `tsconfig.json`)

### Build Configuration

**Vite Setup** (`vite.config.ts`):

- React SWC plugin for fast refresh
- Tailwind CSS v4 Vite plugin
- Spark Vite plugin for GitHub Spark SDK integration
- Phosphor icon import proxy plugin (DO NOT REMOVE)

**TypeScript Config**:

- `target: ES2020` with bundler module resolution
- Strict null checks enabled
- No emit mode (Vite handles compilation)
- Path mapping for `@/*` aliases

## Data Initialization Flow

1. **First Load**: `useEffect` in `App.tsx` checks if data exists in KV storage
2. **Generation**: If empty, calls generator functions to populate mock data
3. **Persistence**: `useKV` automatically persists to browser storage
4. **Statistics**: Dashboard stats recalculate on member/event/transaction changes

## Key Design Patterns

### View Components

All main views (`*View.tsx`) follow this pattern:

- Accept data as props (members, chapters, events, etc.)
- Include `loading` prop for skeleton states
- Provide action handlers (`onAddMember`, `onAddEvent`, etc.)
- Use feature components for complex UI sections

### Feature Dialogs

Dialog components (`*Dialog.tsx`, `*Modal.tsx`):

- Controlled via `open` and `onOpenChange` props
- Use Radix Dialog primitives
- Include form validation where applicable
- Emit data via callback props (`onCreate`, `onUpdate`, etc.)

### Mock Data Generators

Generator functions in `data-utils.ts`:

- Return fully-typed entities
- Use realistic mock data (names, companies, dates)
- Include relationships (memberId, chapterId, eventId)
- Generate appropriate counts for development

## Common Development Workflows

### Adding New Feature Views

1. Create component in `src/components/features/[Name]View.tsx`
2. Import in `App.tsx` and add to view type union
3. Add navigation item to `navItems` array with Phosphor icon
4. Create corresponding render case in main content area
5. Add to mobile navigation if needed (first 6 items shown)

### Adding Data Entities

1. Define TypeScript types in `src/lib/types.ts`
2. Create generator function in `src/lib/data-utils.ts`
3. Add `useKV` state hook in `App.tsx`
4. Initialize in `useEffect` data initialization
5. Pass to relevant view components as props

### Working with Charts

- Use `src/components/features/ChartComponents.tsx` for pre-built chart components
- Recharts components: `LineChart`, `AreaChart`, `BarChart`, `PieChart`
- Responsive containers and tooltips included
- Custom color palette aligned with design system

## GitHub Workflows & Automation

The project includes intelligent GitHub Actions workflows for:

- **CI/CD**: Build validation, linting, deployment pipelines
- **Issue Management**: Auto-enrichment, intelligent triage, agent delegation
- **Security**: Comprehensive security scanning and vulnerability detection
- **Accessibility**: WCAG compliance auditing
- **Documentation**: Automated changelog generation

Workflows located in `.github/workflows/` with specialized agent configurations in `.github/agents/`

## Hierarchical Chapter Structure

The system models a three-tier organizational hierarchy:
```
National (type: 'national')
└── State Chapters (type: 'state', has parentChapterId)
    └── Local Chapters (type: 'local', has parentChapterId)
```

Chapter data includes:

- Membership counts
- Revenue sharing calculations
- Leadership and contact information
- Event tracking per chapter

## Styling Guidelines

**Color Palette** (oklch color space):

- Primary (Deep Navy): `oklch(0.25 0.05 250)` - Trust & authority
- Secondary (Teal): `oklch(0.60 0.12 200)` - Modern energy
- Accent (Gold): `oklch(0.75 0.15 85)` - Success & premium

**Design Philosophy**:

- Apple/Stripe-inspired radical simplicity
- <100ms UI interactions (target)
- Responsive design: Desktop (1920px+), Tablet (768-1919px), Mobile (<768px)
- Phosphor Icons: Use `weight` prop for visual hierarchy (`"fill"` for active, `"regular"` for inactive)

## Feature Request Tracking

Major feature initiatives documented in:

- `FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md` - Complete feature documentation
- `feature-requests-data.json` - Structured JSON data
- `.github/scripts/` - Issue creation automation

Current priorities:

1. Core Functionality Fixes (broken workflows)
2. Chapter Management Enhancement
3. Role-Based Access Control (RBAC) System

## Important Notes

- **DO NOT modify Vite plugins**: Spark and Phosphor proxy plugins are required
- **State persists**: `useKV` data survives page refreshes; clear browser storage to reset
- **No backend**: This is a frontend-only application; all data is client-side
- **Mock data**: All transactions, payments, and events are simulated
- **Component library**: Use Shadcn/ui components from `src/components/ui/` - do not install additional UI libraries

## Testing Member Workflows

To test member-related features:

1. Navigate to Members view
2. Check `members` array populated via `useKV`
3. Use filters and search to explore data
4. Test engagement scoring and status transitions
5. Verify duplicate detection logic

## Troubleshooting

**Build fails with TypeScript errors**:

- Run `npm run build -- --noCheck` to skip type checking
- Check `tsconfig.json` for strict null check issues

**Port 5000 already in use**:

- Run `npm run kill` to terminate existing process

**State not persisting**:

- Verify `useKV` hook usage in component
- Check browser DevTools → Application → Storage for KV entries

**Missing Phosphor icons**:

- DO NOT remove `createIconImportProxy()` plugin from `vite.config.ts`
