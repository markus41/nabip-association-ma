---
name: component-generator
description: Generates React 19 components using Shadcn/ui v4 and Radix UI primitives for the NABIP AMS. Use when creating forms, dialogs, data tables, dashboards, or custom UI components that follow the Apple/Stripe-inspired design system with Tailwind CSS v4.
---

# Component Generator

Streamline UI development with consistent, accessible React components designed for enterprise association management workflows.

## When to Use

Activate this skill when:
- Creating new React components with TypeScript
- Building forms with React Hook Form + Zod validation
- Implementing data tables with sorting/filtering
- Designing dialogs, popovers, or modals
- Adding interactive charts with Recharts
- Building member/event/chapter management interfaces
- Working with the command palette (⌘K)

## Design System Guidelines

### Color Palette (from README)
- **Primary (Deep Navy)**: `oklch(0.25 0.05 250)` - Trust & authority
- **Secondary (Teal)**: `oklch(0.60 0.12 200)` - Modern energy
- **Accent (Gold)**: `oklch(0.75 0.15 85)` - Success & premium

### Component Structure

```typescript
// Example: Member detail card component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useKV } from "@github/spark"

interface MemberCardProps {
  member: {
    id: string
    name: string
    email: string
    memberType: "national" | "state" | "local"
    status: "active" | "pending" | "inactive"
    engagementScore: number
  }
  onEdit?: () => void
}

export function MemberCard({ member, onEdit }: MemberCardProps) {
  const statusColors = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{member.name}</CardTitle>
            <CardDescription>{member.email}</CardDescription>
          </div>
        </div>
        <Badge className={statusColors[member.status]}>
          {member.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Member Type</p>
            <p className="font-medium capitalize">{member.memberType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Engagement</p>
            <p className="font-medium">{member.engagementScore}/100</p>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Form Patterns

```typescript
// Example: Event registration form
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  eventType: z.enum(["conference", "webinar", "workshop", "networking"]),
  capacity: z.number().min(1).max(10000),
  registrationFee: z.number().min(0),
  startDate: z.date(),
  endDate: z.date()
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"]
})

export function EventForm() {
  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      eventType: "conference" as const,
      capacity: 100,
      registrationFee: 0
    }
  })

  const onSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    // Establish reliable event creation workflow
    console.log("Creating event:", values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Annual Conference 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Additional fields... */}
        <Button type="submit">Create Event</Button>
      </form>
    </Form>
  )
}
```

### Data Table Pattern

```typescript
// Use Shadcn's data table pattern with TanStack Table
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export const memberColumns: ColumnDef<Member>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
  // More columns...
]
```

### Chart Components

```typescript
// Example: Member growth chart
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function MemberGrowthChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="members"
          stroke="oklch(0.60 0.12 200)"
          strokeWidth={2}
          dot={{ fill: "oklch(0.60 0.12 200)", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## Component Checklist

✅ **TypeScript**: Explicit types for all props
✅ **Accessibility**: ARIA labels, keyboard navigation
✅ **Responsive**: Mobile-first design (md:, lg: breakpoints)
✅ **Dark Mode**: Use theme-aware colors
✅ **Performance**: React.memo for expensive components
✅ **Error Handling**: ErrorBoundary wrapper where needed
✅ **Loading States**: Skeleton loaders or spinners
✅ **Empty States**: Meaningful messages when no data

## File Structure

```
src/
├── components/
│   ├── ui/              # Shadcn components (auto-generated)
│   ├── members/         # Member-specific components
│   ├── events/          # Event-specific components
│   ├── chapters/        # Chapter-specific components
│   └── analytics/       # Chart and dashboard components
```

## Integration with Other Skills

- Use with `member-workflow` for member UI components
- Combine with `analytics-helper` for chart components
- Works with `event-management` for event interfaces

---

**Best for**: Frontend developers building user interfaces, forms, data tables, and interactive visualizations for the NABIP AMS with React 19 and Shadcn/ui.
