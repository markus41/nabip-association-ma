# Chapter Admin View - Implementation Guide

## Overview

This document describes the Chapter Admin View implementation for Issue #25, which provides a role-restricted interface for chapter administrators to manage their chapter's data.

## Features Implemented

### 1. Chapter-Specific Dashboard

The Chapter Admin View provides chapter leaders with a comprehensive dashboard showing:

- **Key Metrics**
  - Total members (active/pending breakdown)
  - Upcoming and completed events
  - Total and monthly revenue
  - Average member engagement score
  - Expiring membership alerts (30-day window)

- **Tabbed Interface**
  - **Overview**: Quick summary with recent members and upcoming events
  - **Members**: Full member list with status, engagement scores, and join dates
  - **Events**: Complete event listing with registration counts
  - **Finances**: Revenue tracking and transaction history
  - **Reports**: Chapter-specific reports access

### 2. Data Isolation & Security

The implementation ensures chapter admins can only access their chapter's data:

- **Member Filtering**: Only members with matching `chapterId`
- **Event Filtering**: Only events associated with the chapter
- **Transaction Filtering**: Only transactions from chapter members
- **Report Filtering**: Only chapter-level or public reports

### 3. Role-Based Navigation

Navigation is dynamically filtered based on user role:

- **Chapter Admin**: Only sees "My Chapter" view
- **State Admin**: Sees all state-level views
- **National Admin**: Sees all system views
- **Member**: Only sees "My Portal"

## File Structure

### New Files Created

1. **`src/components/features/ChapterAdminView.tsx`**
   - Main chapter admin dashboard component
   - Implements all tabs (Overview, Members, Events, Finances, Reports)
   - Handles data filtering and display

2. **`src/components/features/RoleSwitcher.tsx`**
   - Demo component for testing role switching
   - Allows switching between different user roles
   - Useful for development and testing

### Modified Files

1. **`src/lib/types.ts`**
   - Added `UserRole` type: `'member' | 'chapter_admin' | 'state_admin' | 'national_admin'`
   - Added `User` interface for future authentication integration
   - Added optional `role` field to `Member` interface

2. **`src/App.tsx`**
   - Integrated `ChapterAdminView` component
   - Implemented role-based navigation filtering
   - Added `RoleSwitcher` for demonstration
   - Created `handleRoleChange` function for role switching

## How to Use

### For Development/Testing

1. **Switch to Chapter Admin Role**
   - Click the role badge in the top-right header
   - Select "Chapter Admin" and choose a chapter
   - The view automatically switches to "My Chapter"

2. **View Chapter Data**
   - Navigate through tabs to see different aspects of chapter management
   - All data is filtered to show only the selected chapter's information

3. **Test Data Isolation**
   - Switch between different chapter admin roles
   - Verify that data changes based on selected chapter
   - Confirm other chapters' data is not visible

### For Production Integration

When integrating with a real authentication system:

1. **Authentication Hook**
   ```typescript
   // Replace mock state with real auth
   const { user, loading } = useAuth()
   const currentUserRole = user?.role
   const currentUserChapterId = user?.chapterId
   ```

2. **Route Protection**
   ```typescript
   // Add route guards
   if (currentUserRole === 'chapter_admin' && !currentUserChapterId) {
     return <UnauthorizedView />
   }
   ```

3. **API Integration**
   ```typescript
   // Replace mock data filtering with API calls
   const { data: chapterMembers } = useQuery(
     ['members', currentUserChapterId],
     () => fetchChapterMembers(currentUserChapterId)
   )
   ```

## Component Props

### ChapterAdminView

```typescript
interface ChapterAdminViewProps {
  chapter: Chapter                    // The chapter to display
  allMembers: Member[]                // All members (will be filtered)
  allEvents: Event[]                  // All events (will be filtered)
  allTransactions: Transaction[]      // All transactions (will be filtered)
  allReports?: Report[]               // All reports (will be filtered)
  loading?: boolean                   // Loading state
}
```

### RoleSwitcher

```typescript
interface RoleSwitcherProps {
  currentRole: UserRole                           // Current user role
  onRoleChange: (role: UserRole, chapterId: string | null) => void  // Role change callback
  chapters: Array<{ id: string; name: string }>   // Available chapters
}
```

## Data Flow

```
1. User logs in with chapter_admin role
   ↓
2. System identifies user's assigned chapter (chapterId)
   ↓
3. Navigation shows only "My Chapter" option
   ↓
4. ChapterAdminView receives chapter and all data
   ↓
5. Component filters data by chapterId
   ↓
6. Only chapter-specific data is displayed
```

## Security Considerations

### Current Implementation (Mock)

- Role stored in component state
- Data filtered on client-side
- Suitable for demonstration only

### Production Requirements

- **Server-Side Filtering**: Filter data at API level
- **JWT Authentication**: Use signed tokens for role verification
- **API Route Guards**: Protect endpoints based on user role
- **Row-Level Security**: Implement database RLS policies
- **Audit Logging**: Track all admin actions

Example RLS policy (Supabase):
```sql
CREATE POLICY chapter_admin_members ON members
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'chapter_admin'
    AND chapter_id = auth.jwt() ->> 'chapter_id'
  );
```

## Future Enhancements

As part of the broader RBAC implementation (Issues #24-36):

1. **State Admin View** (Issue #26)
   - Multi-chapter access within a state
   - Cross-chapter analytics
   - State-level reporting

2. **Permission Management** (Issue #28)
   - Granular permission assignment
   - Custom role creation
   - Permission inheritance

3. **Audit Logging** (Issue #31)
   - Track all chapter admin actions
   - View change history
   - Compliance reporting

4. **Advanced Filtering** (Issue #21)
   - Save filter preferences
   - Custom report building
   - Export configurations

## Testing Checklist

- [x] Chapter admin can view their chapter's members
- [x] Chapter admin can view their chapter's events
- [x] Chapter admin can view their chapter's finances
- [x] Chapter admin can access chapter-specific reports
- [x] Chapter admin cannot see other chapters' data
- [x] Navigation is properly restricted
- [x] Metrics calculate correctly
- [x] Data export functionality works
- [x] Expiring membership alerts display
- [x] Role switching works correctly

## Support

For questions or issues related to the Chapter Admin View:

1. Review this documentation
2. Check the feature request documentation in `FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md`
3. Review related issues #24-27 for RBAC context
4. Create a new issue with detailed description

## Related Issues

- Issue #24: Implement Member View
- Issue #25: Create Chapter Admin View (this implementation)
- Issue #26: Build State Admin View
- Issue #27: Design National Admin View
- Issue #28-36: RBAC Permission Management & Compliance
