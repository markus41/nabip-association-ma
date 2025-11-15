# NABIP AMS Agent Skills

Comprehensive agent skills designed to streamline development workflows for the NABIP Association Management System.

## 📚 Available Skills

### 1. **supabase-schema-validator**
Validates Supabase database schema changes for the NABIP AMS, ensuring migrations align with member management, event tracking, chapter hierarchy, and financial models.

**Best for**: Backend developers working on database migrations, schema design, and Row Level Security (RLS) policies.

**Triggers**: Database schema, Supabase migrations, RLS policies, table relationships

---

### 2. **component-generator**
Generates React 19 components using Shadcn/ui v4 and Radix UI primitives following the Apple/Stripe-inspired design system with Tailwind CSS v4.

**Best for**: Frontend developers building forms, dialogs, data tables, dashboards, and interactive UI components.

**Triggers**: React components, Shadcn/ui, forms, data tables, TypeScript interfaces

---

### 3. **member-workflow**
Guides implementation of member lifecycle workflows including registration, renewal, engagement tracking, and duplicate detection for 20,000+ members across national, state, and local chapters.

**Best for**: Developers implementing member management features, automated renewals, and self-service portals.

**Triggers**: Member registration, renewal reminders, engagement scoring, duplicate detection, tier upgrades

---

### 4. **analytics-helper**
Assists with building reports, dashboards, and data visualizations using Recharts and D3.js for member growth, revenue analytics, event performance, and custom report builders.

**Best for**: Developers creating interactive dashboards, custom reports, and data-driven insights.

**Triggers**: Recharts, charts, reports, dashboards, KPIs, data visualization, aggregations

---

### 5. **event-management**
Guides event lifecycle implementation including registration, capacity management, waitlists, QR code check-in, virtual/hybrid events, and post-event analytics.

**Best for**: Developers building event management features for conferences, webinars, workshops, and networking events.

**Triggers**: Event registration, capacity management, QR code, virtual events, check-in, waitlists

---

### 6. **rbac-validator**
Validates role-based access control (RBAC) implementation for four-tier permissions (Member, Chapter Admin, State Admin, National Admin).

**Best for**: Developers implementing secure, scalable access control with comprehensive audit trails.

**Triggers**: RBAC, permissions, roles, access control, RLS policies, audit logging, authorization

---

## 🎯 How Skills Work

Skills are **model-invoked**—Claude autonomously decides when to use them based on:
- Your request context
- Specific keywords and terminology
- The type of task you're working on

You don't need to explicitly call skills; Claude will activate the relevant skill when it detects a matching scenario.

## 📖 Skill Structure

Each skill includes:
- **When to Use**: Clear triggers and scenarios
- **Implementation Patterns**: Code examples and best practices
- **Integration Guidelines**: How skills work together
- **Checklists**: Validation and quality assurance steps

## 🔗 Skill Relationships

Skills are designed to work together:

```
supabase-schema-validator ←→ member-workflow
         ↓                           ↓
  rbac-validator            component-generator
         ↓                           ↓
  analytics-helper ←→ event-management
```

## 🚀 Getting Started

1. **No setup required**: Skills are automatically available in this project
2. **Use natural language**: Describe your task, and Claude will activate the relevant skill
3. **Reference patterns**: Skills provide code examples you can adapt to your needs

## 💡 Examples

### Activating Skills

**Example 1: Database Schema**
```
You: "I need to add a table for tracking member engagement scores"
→ Activates: supabase-schema-validator
```

**Example 2: UI Component**
```
You: "Create a member profile card with Shadcn/ui"
→ Activates: component-generator
```

**Example 3: Event Feature**
```
You: "Implement QR code check-in for events"
→ Activates: event-management
```

**Example 4: Analytics**
```
You: "Build a revenue chart using Recharts"
→ Activates: analytics-helper
```

**Example 5: Permissions**
```
You: "Add RLS policies for chapter admin access"
→ Activates: rbac-validator + supabase-schema-validator
```

## 📝 Contributing

To add new skills:
1. Create a new directory: `.claude/skills/skill-name/`
2. Add `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: What it does and when to use it (max 1024 characters)
   ---
   ```
3. Include implementation patterns and examples
4. Update this README

## 🔍 Troubleshooting

If a skill doesn't activate:
- Use specific terminology from the skill description
- Reference the exact features the skill covers
- Check `.claude/skills/` directory structure
- Run `claude --debug` to see skill detection

---

**Aligned with Brookside BI Brand Guidelines**

All skills emphasize:
- **Sustainable practices** for scalable development
- **Measurable outcomes** with clear business value
- **Strategic guidance** for enterprise association management
- **Professional excellence** in code quality and architecture

For questions or feedback about agent skills, refer to the [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills).
