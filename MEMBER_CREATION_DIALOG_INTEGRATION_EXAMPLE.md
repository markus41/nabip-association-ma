# MemberCreationDialog Integration Guide

## Quick Integration Example

This guide demonstrates how to integrate the MemberCreationDialog component into the MembersView to fix Issue #10.

### Step 1: Import the Component

Add the import to your MembersView.tsx:

```typescript
import { MemberCreationDialog } from '@/components/features/MemberCreationDialog'
```

### Step 2: Add State Management

Add dialog state and member creation handler:

```typescript
// In your MembersView component
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

/**
 * Handle member creation with ID generation and default values
 * Establishes new member record with engagement tracking initialization
 */
const handleCreateMember = (
  memberData: Omit<Member, 'id' | 'joinedDate' | 'engagementScore' | 'credentials'>
) => {
  const newMember: Member = {
    ...memberData,
    id: crypto.randomUUID(), // Generate unique identifier
    joinedDate: new Date().toISOString(), // Capture enrollment timestamp
    engagementScore: 0, // Initialize engagement tracking
    credentials: [], // Empty credentials array for future additions
    expiryDate: memberData.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // Add to members array
  setMembers([...members, newMember])
}
```

### Step 3: Add Dialog Component to Render

Place the dialog component at the bottom of your MembersView return statement:

```typescript
return (
  <div className="space-y-6">
    {/* Existing members view content */}
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Members</h1>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Member
      </Button>
    </div>

    {/* Members table/grid */}
    {/* ... existing content ... */}

    {/* Member Creation Dialog */}
    <MemberCreationDialog
      open={isCreateDialogOpen}
      onOpenChange={setIsCreateDialogOpen}
      onCreateMember={handleCreateMember}
      chapters={chapters}
    />
  </div>
)
```

### Step 4: Import Phosphor Icon for Button

Add Plus icon import at the top:

```typescript
import { Plus } from '@phosphor-icons/react'
```

## Complete Integration Example

Here's a minimal complete example:

```typescript
import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { MemberCreationDialog } from '@/components/features/MemberCreationDialog'
import { Plus } from '@phosphor-icons/react'
import type { Member, Chapter } from '@/lib/types'

interface MembersViewProps {
  members: Member[]
  onAddMember: (member: Member) => void
  chapters: Chapter[]
}

export function MembersView({ members, onAddMember, chapters }: MembersViewProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleCreateMember = (
    memberData: Omit<Member, 'id' | 'joinedDate' | 'engagementScore' | 'credentials'>
  ) => {
    const newMember: Member = {
      ...memberData,
      id: crypto.randomUUID(),
      joinedDate: new Date().toISOString(),
      engagementScore: 0,
      credentials: [],
      expiryDate: memberData.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }

    onAddMember(newMember)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Member Management</h1>
          <p className="text-muted-foreground">
            Manage {members.length} active members across all chapters
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" weight="bold" />
          Add Member
        </Button>
      </div>

      {/* Members content (table, cards, etc.) */}
      <div className="grid gap-4">
        {/* Your existing members display logic */}
      </div>

      {/* Member Creation Dialog */}
      <MemberCreationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateMember={handleCreateMember}
        chapters={chapters}
      />
    </div>
  )
}
```

## Testing the Integration

### Manual Testing Steps

1. **Open Dialog**:
   - Click "Add Member" button
   - Verify dialog appears with proper title and description
   - Check that first field (First Name) is focused

2. **Test Validation - Required Fields**:
   - Try submitting empty form
   - Verify error messages appear for all required fields
   - Check ARIA attributes with screen reader or DevTools

3. **Test Phone Formatting**:
   - Type "5551234567" in phone field
   - Verify it auto-formats to "(555) 123-4567"
   - Try invalid formats and verify error on blur

4. **Test Email Validation**:
   - Enter "invalid-email" - should show error on blur
   - Enter "valid@example.com" - should clear error

5. **Test Chapter Selection**:
   - Open chapter dropdown
   - Verify chapters are sorted (National → State → Local)
   - Verify state/city labels appear correctly

6. **Test Form Submission**:
   - Fill all required fields with valid data
   - Click "Add Member"
   - Verify success toast appears
   - Verify dialog closes
   - Verify new member appears in members list

7. **Test Form Reset**:
   - Open dialog, fill some fields
   - Click "Cancel" button
   - Re-open dialog
   - Verify form is empty (no previous values)

### Keyboard Navigation Test

1. Press Tab through all fields (verify logical order)
2. Use arrow keys in Select dropdowns
3. Press Enter to submit form
4. Press Escape to close dialog

### Screen Reader Test

1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through form
3. Verify required fields are announced
4. Trigger validation error
5. Verify error is announced immediately

## Troubleshooting

### Dialog Doesn't Open
- Check that `open` prop is controlled by state
- Verify button onClick sets state to `true`
- Ensure Dialog component is rendered (not conditionally hidden)

### Validation Not Working
- Verify `@hookform/resolvers` and `zod` are installed
- Check that zodResolver is imported correctly
- Ensure schema matches field names exactly

### Phone Formatting Issues
- Check that `handlePhoneChange` is attached to onChange
- Verify `watch('phone')` is providing current value
- Ensure maxLength={14} is set on input

### Member Not Added to List
- Verify `onCreateMember` callback is invoked
- Check that parent component updates state correctly
- Ensure new member has all required fields (id, joinedDate, etc.)

### TypeScript Errors
- Verify all required Member fields are included in transformation
- Check that Chapter type matches expected structure
- Ensure MembershipType and MemberStatus enums match schema

## Advanced Usage

### Pre-fill Chapter Based on User Context

```typescript
const handleOpenDialog = () => {
  // If user is a chapter admin, pre-select their chapter
  if (currentUserChapterId) {
    setValue('chapterId', currentUserChapterId)
  }
  setIsCreateDialogOpen(true)
}
```

### Async Email Validation (Future Enhancement)

```typescript
const checkEmailAvailability = async (email: string) => {
  const exists = members.some(m => m.email.toLowerCase() === email.toLowerCase())
  if (exists) {
    setError('email', {
      message: 'This email is already registered. Please use a different email or contact support.',
    })
  }
}
```

### Custom Success Handler

```typescript
const handleCreateMember = async (memberData) => {
  try {
    const newMember = { ...memberData, id: crypto.randomUUID(), /* ... */ }

    // Save to backend (if applicable)
    await api.createMember(newMember)

    // Update local state
    setMembers(prev => [...prev, newMember])

    // Send welcome email
    await sendWelcomeEmail(newMember.email, newMember.firstName)

    // Custom success notification
    toast.success('Welcome Email Sent', {
      description: `${newMember.firstName} will receive onboarding instructions shortly.`,
    })
  } catch (error) {
    toast.error('Failed to create member', {
      description: error.message,
    })
  }
}
```

## Next Steps

After successful integration:

1. **Add Member Editing**: Create `MemberEditDialog` with similar validation
2. **Bulk Import**: Build CSV import wizard for multiple members
3. **Duplicate Detection**: Add warnings when similar members exist
4. **Custom Fields**: Support chapter-specific custom member fields
5. **Audit Logging**: Track member creation events for compliance
6. **Role Assignment**: Add RBAC role selection during creation
7. **Welcome Automation**: Trigger welcome emails and onboarding workflows

## Related Documentation

- [Member Creation Dialog Implementation](./MEMBER_CREATION_DIALOG_IMPLEMENTATION.md)
- [Form Validation Patterns](./docs/form-validation-patterns.md) (future)
- [Member Management Workflows](./docs/member-workflows.md) (future)
- [Accessibility Guidelines](./docs/accessibility-guidelines.md) (future)

---

**Status**: ✅ Ready for Integration
**Issue**: #10 - Create Member Creation Dialog
**Date**: 2025-11-15
