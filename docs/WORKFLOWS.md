# Development Workflows

Step-by-step guides for common development tasks in the NABIP AMS.

## Adding New Feature Views

Follow this workflow to add a new main view to the application:

### Step 1: Create View Component

Create your component in `src/components/features/[Name]View.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MyFeatureViewProps {
  data: MyData[]
  loading?: boolean
  onAction?: (item: MyData) => void
}

export default function MyFeatureView({
  data,
  loading,
  onAction
}: MyFeatureViewProps) {
  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Feature</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Your content here */}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 2: Import in App.tsx

Add import and update view type union:

```typescript
import MyFeatureView from '@/components/features/MyFeatureView'

type View =
  | 'dashboard'
  | 'members'
  | 'my-feature'  // Add your view
  // ... other views
```

### Step 3: Add Navigation Item

Add to `navItems` array with Phosphor icon:

```typescript
const navItems = [
  // ... existing items
  {
    id: 'my-feature' as const,
    label: 'My Feature',
    icon: 'ChartBar',  // Choose appropriate Phosphor icon
  },
]
```

### Step 4: Add Render Case

Create corresponding render case in main content area:

```typescript
{activeView === 'my-feature' && (
  <MyFeatureView
    data={myData}
    loading={loading}
    onAction={handleMyAction}
  />
)}
```

### Step 5: Mobile Navigation (Optional)

If this should appear in mobile navigation (first 6 items are shown), ensure it's positioned appropriately in the `navItems` array.

## Adding Data Entities

Follow this workflow to add a new data entity to the application:

### Step 1: Define TypeScript Types

Add type definitions in `src/lib/types.ts`:

```typescript
export interface MyEntity {
  id: string
  name: string
  createdAt: string
  // ... other fields
}
```

### Step 2: Create Generator Function

Add generator in `src/lib/data-utils.ts`:

```typescript
export function generateMyEntities(): MyEntity[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `my-${i + 1}`,
    name: `Entity ${i + 1}`,
    createdAt: new Date().toISOString(),
    // ... other fields with realistic mock data
  }))
}
```

### Step 3: Add useKV State Hook

In `App.tsx`, add state hook:

```typescript
const [myEntities, setMyEntities] = useKV<MyEntity[]>('ams-my-entities', [])
```

### Step 4: Initialize in useEffect

Add to data initialization:

```typescript
useEffect(() => {
  // ... existing initializations

  if (myEntities.length === 0) {
    setMyEntities(generateMyEntities())
  }
}, [])
```

### Step 5: Pass to View Components

Pass as props to relevant views:

```typescript
<MyFeatureView
  data={myEntities}
  onUpdate={setMyEntities}
/>
```

## Working with Charts

### Using Pre-built Chart Components

Use components from `src/components/features/ChartComponents.tsx`:

```typescript
import {
  MemberGrowthChart,
  RevenueChart,
  EngagementChart
} from '@/components/features/ChartComponents'

// In your component
<MemberGrowthChart data={memberData} />
```

### Creating Custom Charts

Use Recharts components directly:

```typescript
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line
      type="monotone"
      dataKey="value"
      stroke="#8884d8"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
```

### Chart Color Palette

Use the custom color palette aligned with design system:

```typescript
const chartColors = {
  primary: 'oklch(0.25 0.05 250)',    // Deep Navy
  secondary: 'oklch(0.60 0.12 200)',  // Teal
  accent: 'oklch(0.75 0.15 85)',      // Gold
  // ... add more as needed
}
```

## Testing Member Workflows

To test member-related features:

### Step 1: Navigate to Members View

Click "Members" in the navigation sidebar

### Step 2: Verify Data Population

Check that `members` array is populated via `useKV`:
- Open DevTools → Console
- Check for member data rendering in UI

### Step 3: Test Filters and Search

- Use the search bar to filter by name/email
- Apply status filters (Active, Inactive, Pending)
- Apply tier filters (National, State, Local)

### Step 4: Test Engagement Scoring

- Check engagement score calculations
- Verify scoring algorithm (based on events, communications, payments)

### Step 5: Test Status Transitions

- Try changing member status
- Verify status updates persist via `useKV`

### Step 6: Test Duplicate Detection

- Try adding a member with existing email
- Verify duplicate detection logic triggers

## Feature Request Tracking

### Current Priorities

Major feature initiatives documented in:

1. **`FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md`** - Complete feature documentation
2. **`feature-requests-data.json`** - Structured JSON data
3. **`.github/scripts/`** - Issue creation automation

### Priority Order

1. Core Functionality Fixes (broken workflows)
2. Chapter Management Enhancement
3. Role-Based Access Control (RBAC) System

### Creating New Feature Requests

1. Document in `FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md`
2. Add structured data to `feature-requests-data.json`
3. Use GitHub issue templates for tracking
4. Assign to appropriate specialized agent (see `.github/agents/`)
