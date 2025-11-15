# Skills Integration Guide

This document explains how NABIP AMS agent skills integrate with hooks, agents, and sub-agents to establish comprehensive development workflows.

## 🎯 Skills Overview

Agent skills are **automatically invoked** by Claude based on context. Located in `.claude/skills/`, they provide specialized guidance for:

1. **supabase-schema-validator** - Database schemas, migrations, RLS policies
2. **component-generator** - React 19 + Shadcn/ui components
3. **member-workflow** - Member lifecycle, renewals, engagement
4. **analytics-helper** - Recharts dashboards, reports, KPIs
5. **event-management** - Event registration, QR check-in, analytics
6. **rbac-validator** - Four-tier RBAC, permissions, audit logs

## 🔗 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SessionStart Hook                       │
│            (Announces available skills)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│  Main Claude  │◄────────│   Sub-Agent  │
│   Session     │         │   (Task)     │
└───────┬───────┘         └──────┬───────┘
        │                        │
        │ Auto-invokes           │ Auto-invokes
        │ based on context       │ based on context
        │                        │
        ▼                        ▼
┌─────────────────────────────────────────┐
│           Agent Skills (.claude/skills/) │
│                                         │
│  ├─ supabase-schema-validator/         │
│  ├─ component-generator/               │
│  ├─ member-workflow/                   │
│  ├─ analytics-helper/                  │
│  ├─ event-management/                  │
│  └─ rbac-validator/                    │
└─────────────────────────────────────────┘
        │
        │ Validated by
        ▼
┌─────────────────────────────────────────┐
│      Specialized Agents (.claude/agents)│
│                                         │
│  ├─ senior-reviewer (validates code)   │
│  ├─ security-specialist (audits RBAC)  │
│  ├─ skills-advisor (recommends skills) │
│  └─ documentation-expert (docs)        │
└─────────────────────────────────────────┘
```

## 🪝 Hooks Integration

### SessionStart Hook
Location: `.claude/hooks.mjs`

The `SessionStart` hook announces available skills when a Claude Code session begins:

```javascript
console.log('⚡ ACTIVE SKILLS (Auto-invoked):');
console.log('   • supabase-schema-validator  - Database schema, migrations, RLS policies');
console.log('   • component-generator        - React 19 components with Shadcn/ui v4');
console.log('   • member-workflow            - Member lifecycle, renewals, engagement');
console.log('   • analytics-helper           - Recharts dashboards, reports, KPIs');
console.log('   • event-management           - Event registration, QR check-in, analytics');
console.log('   • rbac-validator             - Four-tier RBAC, permissions, audit logs');
```

This ensures developers are aware of available skills from the start of each session.

### Documentation Reference
The hook also references the skills guide:

```javascript
console.log('   • .claude/skills/README.md    - Agent skills guide (NEW!)');
```

## 🤖 Agent Integration

### skills-advisor Agent
Location: `.claude/agents/skills-advisor.md`

The `skills-advisor` agent helps users and sub-agents understand:
- **Which skills** to use for specific tasks
- **Sequence** of skill application for complex features
- **Integration points** between skills
- **Validation** after applying skills

**Usage Example**:
```
User: "I need to build member registration with database, UI, and workflows"
→ skills-advisor recommends: supabase-schema-validator → member-workflow → component-generator → rbac-validator
```

### senior-reviewer Agent
Location: `.claude/agents/senior-reviewer.md`

The `senior-reviewer` agent **validates code against skill patterns**:

```markdown
## Integration with NABIP AMS Skills

When reviewing code, validate implementation against these project-specific skills:

### supabase-schema-validator
- Verify database schemas follow the skill's validation checklist
- Check RLS policies match the recommended patterns
...

### component-generator
- Verify React components use Shadcn/ui patterns from the skill
- Check form implementations use React Hook Form + Zod as prescribed
...
```

**When code deviates**, it provides specific skill references:
```
### Recommendation: Align with member-workflow Skill

Your registration logic differs from the established pattern in
`.claude/skills/member-workflow/SKILL.md`.

Reference the skill's `checkDuplicateMember()` function for the
recommended fuzzy matching algorithm.
```

## 🔄 How Sub-Agents Access Skills

Skills are **automatically available** to sub-agents invoked via the `Task` tool:

1. **Project-level skills** (`.claude/skills/`) are accessible to all agents in the project
2. Sub-agents detect context keywords and auto-invoke relevant skills
3. Skills provide implementation patterns, validation checklists, and code examples

### Example Flow

```
User Request: "Create a member registration form"
    ↓
Main Claude: Delegates to sub-agent (Task tool)
    ↓
Sub-Agent: Detects "member registration form" context
    ↓
Auto-invokes skills:
    1. component-generator (for form UI with Shadcn)
    2. member-workflow (for registration logic)
    3. supabase-schema-validator (to verify schema)
    ↓
Sub-Agent: Returns implementation following skill patterns
    ↓
senior-reviewer: Validates against skill checklists
```

## 📋 Skill Selection Matrix

| Task Type | Primary Skill | Secondary Skills | Validating Agent |
|-----------|---------------|------------------|------------------|
| Database Schema | supabase-schema-validator | rbac-validator | senior-reviewer |
| Member Features | member-workflow | supabase-schema-validator, component-generator | senior-reviewer |
| Event Features | event-management | supabase-schema-validator, component-generator | senior-reviewer |
| Analytics/Reports | analytics-helper | component-generator, supabase-schema-validator | senior-reviewer, performance-optimizer |
| UI Components | component-generator | - | senior-reviewer |
| Permissions | rbac-validator | supabase-schema-validator | security-specialist |

## 🎓 Best Practices

### For Developers

1. **Use natural language**: Describe tasks with skill keywords (e.g., "database schema", "React form", "QR check-in")
2. **Reference skills directly**: Mention `.claude/skills/member-workflow` when you want that specific pattern
3. **Invoke skills-advisor**: Ask "Which skills should I use for X?" when uncertain
4. **Validate with senior-reviewer**: Request code review to ensure skill pattern compliance

### For Sub-Agents (Task Tool)

1. **Context detection**: Automatically activate skills based on user request keywords
2. **Pattern application**: Follow skill implementation examples for consistency
3. **Cross-skill integration**: Use multiple skills when tasks span domains (e.g., DB + UI)
4. **Validation reference**: Point to skill documentation when explaining patterns

## 🔍 Verification Commands

### Check Skills Availability
```bash
# List all skills
powershell -Command "Get-ChildItem .claude\skills -Recurse -Filter 'SKILL.md'"
```

### View Hooks Configuration
```bash
# Read hooks file
cat .claude/hooks.mjs
```

### View Agent Integration
```bash
# Check senior-reviewer skills section
cat .claude/agents/senior-reviewer.md | grep -A 20 "Integration with NABIP AMS Skills"
```

## 📚 Additional Resources

- **Skills Guide**: `.claude/skills/README.md` - Comprehensive skills documentation
- **Skills Advisor**: `.claude/agents/skills-advisor.md` - Skill selection guidance
- **Hooks File**: `.claude/hooks.mjs` - Session lifecycle and skill announcements
- **Senior Reviewer**: `.claude/agents/senior-reviewer.md` - Code validation against skills

## 🚀 Quick Start

1. **Start Claude Code session** → Skills auto-announced in SessionStart hook
2. **Describe task naturally** → Relevant skills auto-invoke
3. **Need guidance?** → Invoke `skills-advisor` agent
4. **Code review** → Use `senior-reviewer` to validate against skill patterns

---

**Skills are the foundation of sustainable, scalable development practices for the NABIP AMS.** They establish consistent patterns, drive measurable outcomes, and streamline workflows across all development activities.

For questions or contributions, reference the [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills).
