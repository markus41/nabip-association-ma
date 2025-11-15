# /add-command - Interactive Slash Command Creation Wizard for AMS

Interactive wizard for creating new slash commands with comprehensive documentation, agent coordination workflows, usage examples, and integration with the AMS agent ecosystem.

## Purpose

Establishes a streamlined workflow for creating new slash commands, ensuring consistency, completeness, and integration with the NABIP AMS architecture. Auto-generates command markdown with proper structure, agent coordination patterns optimized for Next.js/Supabase workflows, success criteria, and validation aligned with Brookside BI brand standards.

## Multi-Agent Coordination Strategy

Uses **guided creation pattern** with interactive prompts, template generation, validation, and documentation to support sustainable AMS development.

### Command Creation Architecture
```
┌──────────────────────────────────────────────────┐
│       Command Creation Wizard                     │
│       (general-purpose orchestrator)              │
└────────────┬─────────────────────────────────────┘
             │
    ┌────────┼────────┬────────┬────────┬─────────┐
    ▼        ▼        ▼        ▼        ▼         ▼
 Prompt   Template  Agent   Validate  Doc    Test
 User     Generate  Coord             Gen
```

## Execution Flow

### Phase 1: Interactive Requirements Gathering (0-10 mins)
1. **requirements-gatherer** - Interactive prompts for AMS command details
2. **existing-command-analyzer** - Analyze existing AMS commands for patterns
3. **name-validator** - Validate command name uniqueness in AMS ecosystem
4. **category-selector** - Determine command category (meta-tools, platform, member-ops, chapter-ops, event-ops, devex)
5. **agent-suggester** - Suggest appropriate agents from AMS agent ecosystem

**Prompts**:
- Command name (e.g., `/sync-members`, `/generate-chapter-report`)
- Command purpose (one-sentence description focusing on outcomes)
- Category (meta-tools, platform, member-operations, chapter-operations, event-operations, developer-experience)
- Primary use case for NABIP AMS workflows
- Target agents (from AMS agent ecosystem: database-architect, api-integration-architect, etc.)
- Expected execution time
- Success criteria (measurable outcomes)

### Phase 2: Template Generation (10-20 mins)
6. **template-selector** - Select appropriate command template for AMS workflows
7. **structure-generator** - Generate markdown structure with Brookside BI voice
8. **agent-coordinator** - Define agent coordination strategy for AMS patterns
9. **execution-flow-builder** - Build multi-phase execution flow for Next.js/Supabase operations
10. **example-generator** - Generate realistic AMS usage examples (member workflows, chapter operations, events)

### Phase 3: Documentation Generation (20-35 mins)
11. **purpose-writer** (markdown-specialist) - Write purpose section with outcome-focused language
12. **architecture-diagrammer** (visual-content-architect) - Create Mermaid architecture diagram
13. **agent-layer-documenter** (documentation-expert) - Document agent coordination layers
14. **success-criteria-definer** - Define measurable success criteria for AMS workflows
15. **notes-writer** (markdown-specialist) - Write implementation notes with best practices

### Phase 4: Validation & Testing (35-45 mins)
16. **markdown-validator** (markdown-specialist) - Validate markdown syntax
17. **link-checker** - Check internal links (agents, CLAUDE.md references)
18. **example-validator** - Validate example code (TypeScript, Supabase queries, Next.js patterns)
19. **consistency-checker** - Check consistency with existing AMS commands
20. **completeness-validator** - Ensure all required sections present

### Phase 5: Integration & Registration (45-55 mins)
21. **file-writer** - Write command file to `.claude/commands/`
22. **index-updater** (markdown-specialist) - Update command index/registry
23. **documentation-updater** (markdown-specialist) - Update CLAUDE.md with new command
24. **test-command-generator** - Generate test invocation
25. **usage-guide-updater** (documentation-expert) - Update usage guide

## Agent Coordination Layers

### Interactive Layer
- **requirements-gatherer**: User prompts and input collection for AMS workflows
- **name-validator**: Name uniqueness and convention checking
- **category-selector**: Command categorization for NABIP operations
- **agent-suggester**: AI-powered agent recommendations from AMS ecosystem

### Generation Layer
- **template-selector**: Template matching for AMS patterns
- **structure-generator**: Markdown generation with Brookside BI voice
- **agent-coordinator**: Coordination pattern design (Supabase, Next.js, shadcn/ui)
- **execution-flow-builder**: Workflow definition for sustainable development

### Validation Layer
- **markdown-validator**: Syntax validation
- **link-checker**: Link verification
- **consistency-checker**: Pattern compliance with AMS standards
- **completeness-validator**: Section completeness

### Integration Layer
- **file-writer**: File system integration
- **index-updater**: Registry updates
- **documentation-updater**: CLAUDE.md synchronization

## Usage Examples

### Example 1: Create Simple Member Management Command
```
/add-command

Interactive Wizard:
? Command name: /bulk-import-members
? Purpose: Streamline bulk member imports with validation and duplicate detection
? Category: Member Operations
? Primary use case: Import member data from CSV/Excel with Supabase batch operations
? Execution time estimate: 15-30 minutes
? Success criteria: All valid members imported, duplicates flagged, audit log created

Suggested Agents:
  1. database-architect (schema validation, RLS policies)
  2. api-integration-architect (data transformation)
  3. documentation-expert (audit log generation)
  4. visual-content-architect (import summary dashboard)

? Select agents (space to select, enter to continue):
  [x] database-architect
  [x] api-integration-architect
  [x] documentation-expert
  [ ] visual-content-architect

Generating command structure with Brookside BI brand voice...
✅ Created: .claude/commands/bulk-import-members.md
✅ Updated: .claude/commands/README.md
✅ Validated: All sections complete
✅ Brand voice: Outcome-focused language applied

Next steps:
1. Review generated command: .claude/commands/bulk-import-members.md
2. Customize examples with specific NABIP member types
3. Test command: /bulk-import-members --dry-run
4. Commit to repository
```

### Example 2: Create Complex Chapter Operations Command
```
/add-command --template=multi-phase

Interactive Wizard:
? Command name: /generate-state-performance-report
? Purpose: Establish comprehensive state-level chapter performance analysis with visual dashboards
? Category: Chapter Operations
? Orchestration pattern: Sequential with data aggregation
? Phases: 5 (data-collection, analysis, visualization, report-generation, distribution)
? Agents needed: 6-8
? Estimated time: 30-45 minutes

Generating multi-phase orchestration command for sustainable chapter reporting...
✅ Created with 5 phases, 7 agents
✅ Includes Supabase aggregation queries
✅ shadcn/ui dashboard components included
✅ Mermaid diagrams generated
```

### Example 3: Create Event Management Command
```
/add-command --category=event-operations

Interactive Wizard:
? Command name: /capitol-conference-coordinator
? Purpose: Streamline Capitol Conference registration, venue management, and post-event analytics
? Event workflows: Registration, check-in, session tracking, attendee analytics
? Supabase patterns: Real-time registration, RLS for attendee data
? Integration focus: Payment processing, email notifications

Generating event management command...
✅ Created with event-specific templates
✅ Includes Supabase Realtime patterns
✅ References Stripe integration patterns
✅ Email notification workflows included
```

### Example 4: Create Developer Experience Command
```
/add-command --template=analysis

Interactive Wizard:
? Command name: /analyze-supabase-performance
? Purpose: Improve visibility into Supabase query performance and RLS policy efficiency
? Analysis scope: Query execution times, RLS policy overhead, index usage
? Report format: Markdown report + Mermaid diagrams
? Optimization recommendations: Automatic index suggestions, query rewrites

Generating analysis command...
✅ Created with performance analysis templates
✅ Includes Supabase-specific metrics
✅ Query optimization recommendations included
✅ Mermaid sequence diagrams for slow queries
```

## Expected Outputs

### 1. Command Markdown File
Generated at: `.claude/commands/{command-name}.md`

**Structure** (Brookside BI brand voice applied):
```markdown
# Command Name

Brief description focusing on outcomes

## Purpose
Detailed explanation emphasizing sustainable practices and measurable results

## Multi-Agent Coordination Strategy
Mermaid diagram and strategy optimized for AMS architecture

## Execution Flow
Multi-phase breakdown with agents and timing for Next.js/Supabase operations

### Phase 1: Name (0-X mins)
1. **agent-name** - Action description with outcome focus
...

## Agent Coordination Layers
Organized agent responsibilities by layer (aligned with AMS ecosystem)

## Usage Examples
3-5 realistic NABIP AMS scenarios with specific examples

## Expected Outputs
Deliverables from command execution (dashboards, reports, database updates)

## Success Criteria
Measurable outcomes supporting scalable AMS operations

## Notes
Implementation considerations, Supabase best practices, Next.js patterns
```

### 2. Validation Report
```
=== COMMAND VALIDATION REPORT ===

✅ SYNTAX
  Markdown syntax: Valid
  Mermaid diagrams: 2 (syntax validated)
  Code blocks: 12 (all properly formatted with TypeScript/SQL)

✅ STRUCTURE
  Required sections: 8/8 present
  - Purpose ✓ (outcome-focused, Brookside BI voice)
  - Multi-Agent Coordination ✓
  - Execution Flow ✓
  - Agent Layers ✓
  - Usage Examples ✓ (AMS-specific scenarios)
  - Expected Outputs ✓
  - Success Criteria ✓ (measurable outcomes)
  - Notes ✓ (Supabase/Next.js best practices)

✅ CONTENT
  Purpose clarity: Clear, solution-focused
  Agent references: Valid (all agents exist in AMS registry)
  Example quality: Good (3 examples, realistic NABIP workflows)
  Success criteria: Measurable (6 criteria defined)
  Brand voice: Brookside BI standards applied

✅ INTEGRATION
  File location: .claude/commands/my-command.md ✓
  Command index: Updated ✓
  CLAUDE.md reference: Added ✓
  No naming conflicts: Confirmed ✓

⚠️  SUGGESTIONS
  - Consider adding Supabase RLS policy examples
  - Add estimated Supabase compute usage
  - Include rollback procedures for data operations
```

### 3. Command Index Update
```
=== UPDATED COMMAND INDEX ===

Total Commands: 9 (was 8)

Meta-Development Tools (2):
  /add-command ........................ NEW ✨
  /create-agent

Platform Integration (3):
  /sync-to-notion
  /sync-to-monday
  /sync-to-jira

Member Operations (1):
  /bulk-import-members ............... NEW ✨

...

Command added to:
  - .claude/commands/README.md
  - CLAUDE.md (Slash Commands section)
```

## Success Criteria

- ✅ Command name validated (unique, follows kebab-case conventions)
- ✅ Category assigned (one of 6 AMS categories)
- ✅ All required sections generated with Brookside BI voice
- ✅ Agent coordination strategy defined for AMS workflows
- ✅ Execution flow with phases optimized for Next.js/Supabase
- ✅ 3+ realistic NABIP AMS usage examples
- ✅ Measurable success criteria (5+ criteria emphasizing outcomes)
- ✅ Markdown syntax valid with properly formatted Mermaid diagrams
- ✅ Internal links valid (agents, files, CLAUDE.md sections)
- ✅ File written to `.claude/commands/`
- ✅ Command registered in index and CLAUDE.md
- ✅ Command testable (dry-run capability)
- ✅ Supabase/Next.js patterns included where applicable

## Command Templates

### Template 1: Simple Command
For single-purpose commands with linear execution supporting focused AMS operations.

**Use Cases**: Member data operations, simple reports, data exports

**Sections**: 6 (Purpose, Execution, Examples, Outputs, Criteria, Notes)

**Agents**: 1-3

**AMS Examples**: `/export-member-list`, `/validate-chapter-data`

### Template 2: Multi-Phase Command
For commands with distinct phases and state management across Supabase operations.

**Use Cases**: Member onboarding workflows, chapter performance analysis, event registration

**Sections**: 8 (adds Agent Coordination, Architecture Diagram)

**Agents**: 4-8

**Phases**: 3-6

**AMS Examples**: `/member-onboarding-workflow`, `/generate-chapter-report`

### Template 3: Orchestration Command
For commands coordinating multiple agents across layers to support complex AMS features.

**Use Cases**: Full event coordination, multi-chapter analytics, dues collection automation

**Sections**: 9 (adds Configuration Options, Integration Points)

**Agents**: 8-12

**Phases**: 6-10

**Patterns**: Event-driven workflows, Saga pattern for rollbacks

**AMS Examples**: `/orchestrate-capitol-conference`, `/automate-dues-collection`

### Template 4: Analysis Command
For codebase analysis, metrics, reporting to improve AMS visibility.

**Use Cases**: Performance analysis, Supabase query optimization, accessibility audits

**Sections**: 7 (includes Metrics, Report Format)

**Agents**: Analysis-focused (database-architect, performance-optimizer, visual-content-architect)

**Outputs**: Reports, dashboards, metrics visualizations

**AMS Examples**: `/analyze-supabase-performance`, `/audit-accessibility`

### Template 5: Integration Command
For platform integrations and cross-system synchronization.

**Use Cases**: Notion sync, Monday.com sync, payment gateway integration

**Sections**: 8 (includes Integration Endpoints, Auth Patterns)

**Agents**: api-integration-architect, security-specialist, documentation-expert

**Outputs**: Sync reports, integration logs, API documentation

**AMS Examples**: `/sync-to-notion`, `/integrate-stripe-payments`

## Configuration Options

### Template Selection
- `--template=simple` - Simple linear command for focused operations
- `--template=multi-phase` - Multi-phase workflow for complex AMS features
- `--template=orchestration` - Multi-agent orchestration for large-scale operations
- `--template=analysis` - Analysis and reporting for visibility
- `--template=integration` - Platform integration and synchronization

### Interactivity
- `--interactive` - Full interactive wizard (default)
- `--quick` - Minimal prompts, use AMS defaults
- `--from-spec=file.yaml` - Generate from YAML specification

### Validation
- `--validate-only` - Validate without writing
- `--skip-validation` - Skip validation (not recommended for AMS)
- `--strict` - Strict validation (enforce Brookside BI brand voice)

### Output
- `--dry-run` - Show generated content without writing
- `--output=path` - Custom output path
- `--format=markdown` - Markdown output (default)
- `--format=yaml` - YAML specification output

## Integration Points

### File System
- **Command Directory**: `.claude/commands/`
- **Command Index**: `.claude/commands/README.md` (or dedicated index file)
- **Documentation**: `CLAUDE.md` (Slash Commands section)

### Agent Registry
- **AMS Agent List**: Specialized agents for NABIP workflows
- **Agent Definitions**: `.claude/agents/*.md`
- **Coordination Patterns**: Multi-agent workflows for AMS features

### Templates
- **Template Library**: `.claude/templates/commands/` (future)
- **Reusable Sections**: `.claude/templates/sections/` (future)
- **Example Library**: `.claude/templates/examples/` (future)

## YAML Specification Format

For `--from-spec` option:

```yaml
# command-spec.yaml
command:
  name: bulk-import-members
  purpose: Streamline bulk member imports with validation and duplicate detection
  category: member-operations
  template: multi-phase

agents:
  - name: database-architect
    role: Supabase schema validation and batch operations
    phase: 1
  - name: api-integration-architect
    role: Data transformation and validation
    phase: 2
  - name: documentation-expert
    role: Audit log and import summary generation
    phase: 3

phases:
  - name: Data Validation
    duration: 5-10 mins
    steps:
      - action: Validate CSV structure and member data
        agent: database-architect
      - action: Check for duplicate members
        agent: database-architect
  - name: Import Execution
    duration: 10-20 mins
    steps:
      - action: Transform data for Supabase
        agent: api-integration-architect
      - action: Execute batch import with RLS
        agent: database-architect
  - name: Documentation
    duration: 5-10 mins
    steps:
      - action: Generate import summary
        agent: documentation-expert

examples:
  - title: Import from CSV
    command: /bulk-import-members --file=members.csv
    description: Import members from CSV with automatic validation
  - title: Import with dry-run
    command: /bulk-import-members --file=members.csv --dry-run
    description: Validate import without committing to database

success_criteria:
  - criteria: All valid members imported to Supabase
  - criteria: Duplicate members flagged with clear reporting
  - criteria: Audit log created with import timestamp and summary
  - criteria: Import errors clearly documented with remediation guidance

notes:
  - Uses Supabase batch operations for efficient imports
  - RLS policies enforced during import
  - Supports rollback on critical errors
  - Compatible with NABIP member types (Individual, Agency, Student, Corporate)
```

## Best Practices

### Command Naming for AMS
- Use kebab-case: `/bulk-import-members`
- Be descriptive but concise: `/generate-chapter-report` not `/gcr`
- Use verbs emphasizing outcomes: `/streamline-member-onboarding` not `/member-onboarding`
- Include domain context: `/capitol-conference-coordinator` not `/event-manager`

### Documentation with Brookside BI Voice
- **Purpose**: 1-2 sentences emphasizing measurable outcomes
- **Examples**: 3-5 realistic NABIP scenarios with actual Supabase/Next.js patterns
- **Success Criteria**: Measurable, specific, outcome-focused
- **Notes**: Supabase best practices, Next.js patterns, scalability considerations

### Agent Selection for AMS Workflows
- **Primary Agents**: 1-3 core agents for main execution (database-architect, api-integration-architect)
- **Supporting Agents**: 2-5 agents for validation, documentation, visualization
- **Total**: Keep under 12 agents for maintainability
- **Rationale**: Explain how agents support sustainable AMS development

### Execution Flow for Next.js/Supabase
- **Phases**: 3-6 phases (balanced granularity)
- **Timing**: Realistic estimates based on Supabase operations
- **Dependencies**: Clear phase dependencies for Server Actions/Components
- **Parallelization**: Note opportunities for concurrent Supabase queries

## Notes

- **Interactive Mode**: Recommended for first-time command creation to ensure consistency
- **Quick Mode**: For experienced users familiar with AMS patterns
- **YAML Spec**: Best for programmatic generation or batch creation
- **Validation**: Always run validation to ensure Brookside BI brand voice compliance
- **Testing**: Test command in `--dry-run` mode with actual NABIP workflows
- **Documentation**: Keep CLAUDE.md Slash Commands section updated
- **Versioning**: Commands versioned via git; use semantic versioning
- **Deprecation**: Mark deprecated commands clearly, provide migration path
- **Supabase Context**: Include RLS policy considerations in data operation commands
- **Next.js Patterns**: Reference Server Components vs Client Components where applicable
- **Brand Voice**: Maintain solution-focused, outcome-oriented language throughout

## Estimated Execution Time

- **Quick Command** (`--quick`): 5-8 minutes
- **Interactive Wizard** (default): 10-15 minutes
- **Complex Orchestration**: 15-25 minutes
- **From YAML Spec** (`--from-spec`): 2-5 minutes

---

*This command establishes sustainable workflows for creating custom slash commands that streamline NABIP AMS operations, ensuring every command drives measurable improvements to your development process.*
