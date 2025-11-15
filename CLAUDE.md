# CLAUDE.md

Quick reference for Claude Code when working with the NABIP Association Management System.

## Project Overview

NABIP AMS - Enterprise-grade platform for managing 20,000+ members across National → State → Local chapter hierarchy. React 19 + TypeScript application with advanced reporting, event management, and member engagement tracking.

**Built on GitHub Spark SDK** with `useKV` hooks for persistent client-side state management.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production (TypeScript + Vite)
npm run lint         # Run ESLint checks
npm run preview      # Preview production build
npm run optimize     # Optimize Vite dependencies
npm run kill         # Kill process on port 5000 (Windows)
```

## Core Architecture

### State Management
- **`useKV<T>(key, defaultValue)`** - Primary state hook for persistent data
- All entities (members, chapters, events, etc.) persist across sessions
- Data initializes on first load via generator functions in `src/lib/data-utils.ts`

### Key Files
- **Main Entry**: `src/App.tsx` - Single-page app with view-based routing
- **Types**: `src/lib/types.ts` - TypeScript definitions for all domain models
- **Data Layer**: `src/lib/data-utils.ts` - Mock data generators and calculations
- **Components**: `src/components/features/` (views, dialogs) + `src/components/ui/` (Shadcn/ui)

### Tech Stack
- React 19 + TypeScript
- Shadcn/ui v4 + Radix UI
- Tailwind CSS v4
- Phosphor Icons
- Recharts (data visualization)
- Path aliases: `@/*` → `./src/*`

## Critical Constraints

⚠️ **DO NOT modify Vite plugins** - Spark and Phosphor proxy plugins are required
⚠️ **State persists** - `useKV` data survives page refreshes; clear browser storage to reset
⚠️ **Client-side only** - No backend; all data is mock/simulated
⚠️ **Use Shadcn/ui components** - Do not install additional UI libraries

## Chapter Hierarchy

```
National (type: 'national')
└── State Chapters (type: 'state', has parentChapterId)
    └── Local Chapters (type: 'local', has parentChapterId)
```

## Detailed Documentation

For comprehensive guidance, see the `docs/` folder:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - State management patterns, component structure, data flow
- **[WORKFLOWS.md](docs/WORKFLOWS.md)** - Step-by-step development workflows
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and resolutions
- **[STYLING.md](docs/STYLING.md)** - Design system, color palette, UI guidelines

## Quick Tips

- **Adding features**: Create in `src/components/features/`, import in `App.tsx`, add to `navItems`
- **Adding entities**: Define types in `types.ts`, create generator in `data-utils.ts`, add `useKV` hook
- **Charts**: Use pre-built components from `src/components/features/ChartComponents.tsx`
- **Feature tracking**: See `FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md` for current priorities
