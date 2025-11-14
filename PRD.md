# Planning Guide

Create an elegant, production-quality Association Management System (AMS) for NABIP that unifies member management, event registration, and communications into one seamless platform, demonstrating enterprise-grade UX in a modern web application.

**Experience Qualities**:
1. **Effortlessly Professional** - Complex association workflows feel natural and require minimal clicks, hiding sophisticated data management behind intuitive interfaces
2. **Instantly Responsive** - Every interaction provides immediate feedback with smooth transitions, making the system feel alive and attentive to user needs
3. **Confidently Powerful** - Users discover advanced capabilities progressively, with smart defaults and AI assistance making expert-level tasks accessible to everyone

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Multi-module system with member database, event management, email campaigns, financial tracking, and analytics requiring sophisticated state management and cross-feature data relationships

## Essential Features

### Member Management Dashboard
- **Functionality**: Centralized view and management of 20,000+ members across national, state, and local chapters with filtering, search, and bulk operations
- **Purpose**: Provides the single source of truth for member data, eliminating fragmented spreadsheets and disconnected systems
- **Trigger**: Clicking "Members" in main navigation or using Cmd+K command palette
- **Progression**: Dashboard loads with member statistics → User applies filters or searches → Results update instantly → User can view details, edit, or perform bulk actions → Changes save automatically with confirmation
- **Success criteria**: Users can find any member in <3 seconds, bulk operations complete successfully with rollback capability, no data inconsistencies

### Event Registration System
- **Functionality**: Complete event lifecycle from creation to check-in with multiple ticket types, payment processing simulation, and attendee management
- **Purpose**: Replaces manual event coordination with automated workflows that handle registration, capacity, waitlists, and check-in seamlessly
- **Trigger**: Creating new event via "Events" section or registering for event as member
- **Progression**: Event creation wizard with smart defaults → Configure ticket types and pricing → Publish event → Members register and pay → Automated confirmations → Day-of check-in with QR codes → Post-event analytics
- **Success criteria**: Event setup takes <5 minutes, registration flow completes in <2 minutes, 100% accuracy in capacity tracking and payment reconciliation

### Email Campaign Builder
- **Functionality**: Visual email composer with dynamic segmentation, template library, scheduled sending, and engagement analytics
- **Purpose**: Enables targeted communication to member segments without requiring technical skills or external tools
- **Trigger**: "Communications" → "New Campaign" or "Email members who..." command
- **Progression**: Select template → Customize content with visual editor → Define audience with smart filters → Preview and test → Schedule or send → Track opens, clicks, and conversions in real-time
- **Success criteria**: Non-technical users create professional campaigns independently, segmentation queries work correctly, analytics track all engagement metrics

### Financial Dashboard
- **Functionality**: Real-time view of revenue streams (dues, events, donations) with transaction history, invoice generation, and reconciliation tools
- **Purpose**: Provides financial transparency and automates payment tracking across all revenue sources
- **Trigger**: "Finance" navigation or specific member/event payment actions
- **Progression**: Dashboard shows revenue summary → User drills into transactions → Can generate invoices or process refunds → Export reports for accounting → Automated reconciliation flags discrepancies
- **Success criteria**: Revenue numbers accurate to the penny, payment status updates in <1 minute, export formats compatible with QuickBooks

### AI Command Palette
- **Functionality**: Natural language interface (Cmd+K) that translates requests like "email members who haven't renewed" into system actions
- **Purpose**: Accelerates workflows by allowing users to describe intent rather than navigate menus
- **Trigger**: Cmd+K keyboard shortcut from anywhere
- **Progression**: User types natural language query → AI interprets intent and suggests actions → User selects match → System executes with preview/confirmation → Result displayed with success feedback
- **Success criteria**: 90%+ query interpretation accuracy, <500ms response time, seamless handoff to relevant feature

### Chapter Hierarchy Management
- **Functionality**: Visual organization chart of national → state → local chapters with delegation, revenue sharing, and isolated data views
- **Purpose**: Supports NABIP's federated structure while maintaining unified data and enabling chapter autonomy
- **Trigger**: "Chapters" navigation or chapter selector in header
- **Progression**: View org chart → Select chapter → See chapter-specific dashboard → Manage chapter members and events → Configure revenue sharing → Roll up reports to parent
- **Success criteria**: Data isolation prevents cross-chapter leaks, hierarchy changes propagate correctly, revenue calculations balance to 100%

## Edge Case Handling

- **Duplicate Members**: Fuzzy matching algorithm detects potential duplicates on import/creation, prompting merge workflow with field-by-field selection
- **Oversold Events**: Automatic waitlist activation when capacity reached, with promotion queue and notification system when spots open
- **Payment Failures**: Retry logic for temporary failures, grace period for expiring memberships, dunning email sequence before suspension
- **Conflicting Updates**: Optimistic locking with conflict resolution UI showing "another user modified this" with diff view and merge options
- **Lost Connections**: Offline-first architecture queues actions locally, syncs when reconnected, shows clear connectivity status
- **Invalid Imports**: Validation preview before committing bulk uploads, detailed error reports with line numbers, partial success handling

## Design Direction

The interface should evoke the confident professionalism of enterprise banking software combined with the delightful simplicity of modern consumer apps - think JP Morgan Chase meets Linear. A minimal, spacious interface with purposeful animations guides users through complex workflows without overwhelming them, using white space and typography hierarchy to create calm focus even when managing thousands of records.

## Color Selection

Triadic color scheme anchored in NABIP's brand identity, using deep navy as the foundation of trust and authority, teal for actionable elements that feel modern and approachable, and gold sparingly for celebration and premium features.

- **Primary Color**: Deep Navy (`oklch(0.25 0.05 250)`) - Conveys trust, stability, and professional authority appropriate for financial/membership organization
- **Secondary Colors**: 
  - Teal (`oklch(0.60 0.12 200)`) for interactive elements, creating modern energy without overwhelming
  - Soft Gray (`oklch(0.96 0 0)`) for subtle backgrounds and delineation
- **Accent Color**: Rich Gold (`oklch(0.75 0.15 85)`) for success states, premium badges, celebration moments (confetti on task completion)
- **Foreground/Background Pairings**:
  - Background (Soft White `oklch(0.99 0 0)`): Dark Navy text (`oklch(0.20 0.03 250)`) - Ratio 12.8:1 ✓
  - Card (Pure White `oklch(1 0 0)`): Dark Navy text (`oklch(0.20 0.03 250)`) - Ratio 14.1:1 ✓
  - Primary (Deep Navy `oklch(0.25 0.05 250)`): White text (`oklch(1 0 0)`) - Ratio 11.2:1 ✓
  - Secondary (Light Teal `oklch(0.95 0.02 200)`): Dark Navy text (`oklch(0.20 0.03 250)`) - Ratio 12.5:1 ✓
  - Accent (Rich Gold `oklch(0.75 0.15 85)`): Dark Navy text (`oklch(0.20 0.03 250)`) - Ratio 5.2:1 ✓
  - Muted (Cool Gray `oklch(0.96 0.01 250)`): Medium Gray text (`oklch(0.50 0.02 250)`) - Ratio 7.8:1 ✓

## Font Selection

Typography should project quiet authority with exceptional readability for data-dense interfaces, using a sophisticated sans-serif with excellent number rendering for financial figures and member counts - Inter provides the perfect balance of humanist warmth and technical precision.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter SemiBold/32px/tight tracking/-0.02em - Used for main page headers
  - H2 (Section Header): Inter SemiBold/24px/tight tracking/-0.01em - Module titles within pages
  - H3 (Card Title): Inter Medium/18px/normal tracking/0 - Individual cards and dialogs
  - Body (Primary Content): Inter Regular/15px/relaxed leading/1.6 - Main readable text
  - Body Small (Secondary): Inter Regular/13px/relaxed leading/1.5 - Supporting details, metadata
  - Data Display (Numbers): Inter Medium/15px/tabular-nums - Ensures aligned columns in tables
  - Labels: Inter Medium/12px/wide tracking/0.02em/uppercase - Form labels and categories
  - Button: Inter Medium/14px/normal tracking/0 - All interactive elements

## Animations

Animations should reinforce the spatial model of the interface and provide continuity during state changes, with purposeful motion that guides attention without calling attention to itself - smooth, physics-based transitions make the system feel responsive and thoughtful.

- **Purposeful Meaning**: Modal dialogs scale up from their trigger button creating spatial continuity; success actions trigger brief gold sparkle confetti celebrating completion; data tables fade-sort when filters apply showing causality
- **Hierarchy of Movement**: Primary actions (save, submit) get satisfying 150ms spring animations; secondary navigation uses subtle 200ms ease-out slides; background data updates use gentle 300ms opacity transitions to avoid distraction

## Component Selection

- **Components**: 
  - Dialog for member details and forms (modal focus)
  - Command (cmdk) for AI command palette with natural language
  - Table with shadcn for member/event lists with sorting and selection
  - Card for dashboard statistics and section containers
  - Tabs for switching between Members/Events/Communications/Finance
  - Select for chapter hierarchy navigation
  - Calendar with DatePicker for event scheduling
  - Badge for member status, event capacity indicators
  - Progress for bulk operation status
  - Form with react-hook-form for all data entry with validation
  - Avatar for member photos and user profile
  - Popover for inline filters and quick actions
  - Separator for visual section breaks
  - ScrollArea for long lists and content
  - Tooltip for icon button explanations
  
- **Customizations**: 
  - Custom stat cards with trend indicators using Phosphor icons
  - Timeline component for member activity feed
  - Kanban-style event status board using drag-and-drop
  - Email template preview with iframe isolation
  - QR code display for event check-in using canvas
  
- **States**: 
  - Buttons: Default solid navy, hover with brightness increase + subtle lift shadow, active with scale(0.98), disabled at 40% opacity with cursor-not-allowed
  - Inputs: Default with border-input, focus with ring-2 ring-primary, error with border-destructive and shake animation, success with border-teal brief flash
  - Table rows: Hover with bg-muted/30, selected with bg-primary/5 and left border accent, loading with skeleton shimmer
  
- **Icon Selection**: 
  - UserCircle for members, CalendarDots for events, EnvelopeSimple for communications, CurrencyDollar for finance
  - MagnifyingGlass for search, Funnel for filters, ArrowsClockwise for refresh
  - Plus for create actions, Pencil for edit, Trash for delete
  - CheckCircle for success, WarningCircle for alerts, XCircle for errors
  - Download/Upload for import/export, ChartBar for analytics
  
- **Spacing**: 
  - Page container: px-6 py-8 with max-w-7xl mx-auto
  - Card padding: p-6 for standard cards, p-4 for compact
  - Element gaps: gap-4 for related items, gap-6 for section spacing, gap-8 for major divisions
  - Form fields: space-y-4 for field stacking, gap-3 for inline groups
  
- **Mobile**: 
  - Command palette remains full-screen modal
  - Tables transform to stacked cards with essential info visible, "View More" expands details
  - Navigation converts to bottom tab bar with 4 main sections
  - Filters collapse behind "Filter" button that opens sheet drawer
  - Forms use full-width inputs with increased touch targets (min-h-12)
  - Statistics cards stack vertically, charts get horizontal scroll
  - Member detail dialogs become full-screen sheets for easier editing
