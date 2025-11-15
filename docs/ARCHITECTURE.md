# NABIP AMS Architecture

Comprehensive architecture documentation for the NABIP Association Management System.

## State Management Pattern

### Client-Side Persistent State

This application uses a **client-side persistent state architecture** via `@github/spark/hooks`:

- **`useKV<T>(key, defaultValue)`**: Primary state hook for persistent data storage
- All major entities (members, chapters, events, transactions, campaigns, courses, enrollments, reports) persist across sessions
- Data initializes on first load using generator functions from `src/lib/data-utils.ts`
- State updates trigger re-renders and automatic persistence

### Example Pattern

```typescript
const [members, setMembers] = useKV<Member[]>('ams-members', [])
const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', [])
```

### Data Initialization Flow

1. **First Load**: `useEffect` in `App.tsx` checks if data exists in KV storage
2. **Generation**: If empty, calls generator functions to populate mock data
3. **Persistence**: `useKV` automatically persists to browser storage
4. **Statistics**: Dashboard stats recalculate on member/event/transaction changes

## Application Structure

### Main Entry: `src/App.tsx`

- Single-page application with view-based routing (no React Router)
- Tab-based navigation with 9 main views: dashboard, members, events, communications, finance, chapters, learning, reports, portal
- Responsive layout with desktop sidebar + mobile bottom navigation
- Command palette (⌘K) for quick navigation

### Type System: `src/lib/types.ts`

- Comprehensive TypeScript definitions for all domain models
- 15+ main entity types with strict typing for member status, event registration, payment processing, etc.
- Hierarchical chapter structure with type safety

### Data Layer: `src/lib/data-utils.ts`

- Generator functions for mock data: `generateMembers()`, `generateChapters()`, `generateEvents()`, etc.
- Dashboard statistics calculation: `calculateDashboardStats()`
- All data generation uses realistic mock values for development

## Component Organization

```
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

## UI Framework Stack

- **React 19**: Latest React with concurrent features
- **Shadcn/ui v4**: Component library built on Radix UI
- **Radix UI**: Accessible primitive components
- **Tailwind CSS v4**: Utility-first styling with `@tailwindcss/vite` plugin
- **Phosphor Icons**: Icon system (`@phosphor-icons/react`)
- **Recharts**: Data visualization and charting
- **Sonner**: Toast notifications
- **Framer Motion**: Animation library

## Path Aliases

```typescript
"@/*" → "./src/*"
```

All imports use `@/` prefix for cleaner imports (configured in `vite.config.ts` and `tsconfig.json`)

## Build Configuration

### Vite Setup (`vite.config.ts`)

- React SWC plugin for fast refresh
- Tailwind CSS v4 Vite plugin
- Spark Vite plugin for GitHub Spark SDK integration
- Phosphor icon import proxy plugin (DO NOT REMOVE)

### TypeScript Config

- `target: ES2020` with bundler module resolution
- Strict null checks enabled
- No emit mode (Vite handles compilation)
- Path mapping for `@/*` aliases

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

## Hierarchical Chapter Structure

The system models a three-tier organizational hierarchy:

```
National (type: 'national')
└── State Chapters (type: 'state', has parentChapterId)
    └── Local Chapters (type: 'local', has parentChapterId)
```

### Chapter Data Model

Chapter data includes:

- Membership counts
- Revenue sharing calculations
- Leadership and contact information
- Event tracking per chapter

## GitHub Workflows & Automation

The project includes intelligent GitHub Actions workflows for:

- **CI/CD**: Build validation, linting, deployment pipelines
- **Issue Management**: Auto-enrichment, intelligent triage, agent delegation
- **Security**: Comprehensive security scanning and vulnerability detection
- **Accessibility**: WCAG compliance auditing
- **Documentation**: Automated changelog generation

Workflows located in `.github/workflows/` with specialized agent configurations in `.github/agents/`
