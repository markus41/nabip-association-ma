# /create-agent - Interactive Agent Creation Wizard for AMS Development

**Category**: meta-tools
**Complexity**: Very High
**Execution Time**: 90-120 minutes
**Agent Orchestration**: Heavy (8 phases, 20+ coordinated tasks)

## Purpose

The `/create-agent` command establishes a comprehensive interactive workflow that guides you through creating, validating, and integrating specialized agents for NABIP AMS development. This command leverages sophisticated multi-agent orchestration to ensure new agents are well-designed, non-redundant, properly documented, thoroughly tested, and seamlessly integrated with your existing AMS agent ecosystem.

This command streamlines agent creation by:
- Performing intelligent needs analysis to determine optimal agent decomposition
- Preventing duplication by analyzing existing agent capabilities across your AMS ecosystem
- Generating production-ready agent definitions with rich personas and detailed methodologies
- Creating comprehensive documentation, usage guides, and integration examples tailored for Next.js/Supabase
- Validating agent quality through multiple review cycles
- Establishing test scenarios specifically for AMS workflows (member management, chapter coordination, events)
- Updating all relevant ecosystem documentation (CLAUDE.md, registry, guides)

## Multi-Agent Coordination Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     MASTER STRATEGIST                           │
│         (Orchestration & Coordination Hub for AMS)              │
└────┬────────────────────────────────────────────────────────────┘
     │
     ├─── Phase 1: Discovery Layer ────────────────────────┐
     │    ├── general-purpose (needs analysis)            │
     │    ├── Explore (ecosystem search)                  │
     │    └── Plan (decomposition analysis)               │
     │                                                     │
     ├─── Phase 2-3: Design Layer ──────────────────────┐ │
     │    ├── database-architect (data architecture)    │ │
     │    ├── documentation-expert (persona design)     │ │
     │    └── documentation-expert (prompt engineering) │ │
     │                                                   │ │
     ├─── Phase 4-6: Generation Layer ────────────────┐ │ │
     │    ├── documentation-expert (file generation)   │ │ │
     │    ├── visual-content-architect (diagrams)      │ │ │
     │    └── markdown-specialist (doc formatting)     │ │ │
     │                                                 │ │ │
     └─── Phase 7-8: Validation Layer ──────────────┐ │ │ │
          ├── code-generator-typescript (tests)      │ │ │ │
          ├── general-purpose (test execution)       │ │ │ │
          └── documentation-expert (final approval)  │ │ │ │
                                                     └─┴─┴─┘
```

## Execution Flow

### Phase 1: Requirements Discovery & Analysis (0-10 minutes)

**Objective**: Deeply understand AMS development needs and determine optimal agent architecture

**Tasks**:
1. **Initial Needs Gathering** (general-purpose)
   - Collect detailed description of desired agent capabilities for AMS workflows
   - Identify specific use cases (member management, chapter coordination, events, REBC designation)
   - Understand integration requirements with Supabase (RLS, Auth, Realtime, Storage)
   - Determine Next.js 16 App Router patterns needed (Server Components, Server Actions, route groups)

2. **Ecosystem Compatibility Analysis** (Explore agent)
   - Search existing AMS agents for similar capabilities
   - Identify potential overlaps or redundancies in AMS agent ecosystem
   - Analyze integration opportunities with existing agents
   - Map capability gaps specific to NABIP AMS requirements

3. **Decomposition Analysis** (Plan agent)
   - Evaluate if single agent or multiple agents needed for AMS features
   - Identify natural boundaries between responsibilities (e.g., member lifecycle vs chapter reporting)
   - Assess coordination requirements between potential agents
   - Recommend optimal agent architecture (1 vs N agents) for scalable AMS development

4. **Requirements Validation** (general-purpose)
   - Synthesize findings from discovery tasks
   - Confirm understanding with user
   - Establish success criteria for new agent(s) aligned with AMS objectives
   - Create requirements specification document

### Phase 2: Architecture & Design (10-30 minutes)

**Objective**: Design comprehensive agent architecture supporting sustainable AMS development

**Tasks**:
5. **Agent Architecture Design** (database-architect or appropriate specialist)
   - Define agent boundaries and responsibilities for AMS domain
   - Design interaction patterns with other agents (database-architect, api-integration-architect, etc.)
   - Specify input/output interfaces for Next.js/Supabase workflows
   - Create capability matrix and decision trees for AMS-specific scenarios
   - Design error handling and fallback strategies

6. **Persona Development** (documentation-expert)
   - Create distinctive agent personality aligned with Brookside BI brand voice
   - Define communication style: professional, solution-focused, outcome-oriented
   - Establish expertise boundaries (Supabase, Next.js 16, NABIP domain)
   - Design behavioral patterns emphasizing sustainable practices
   - Craft agent backstory and motivation tied to AMS success

7. **Capability Specification** (database-architect or appropriate specialist)
   - Define core competencies for AMS workflows
   - Specify knowledge domains: Next.js App Router, Supabase patterns, NABIP business logic
   - Establish quality standards and constraints (TypeScript strict mode, accessibility)
   - Design output formats: React components, Supabase queries, API routes
   - Create decision-making frameworks for scalable architecture

8. **Integration Planning** (general-purpose)
   - Map touchpoints with existing AMS agents
   - Design handoff protocols between agents
   - Specify orchestration patterns for complex AMS features
   - Plan CLAUDE.md documentation updates
   - Create integration test scenarios for AMS workflows

### Phase 3: Prompt Engineering & Optimization (30-50 minutes)

**Objective**: Craft highly effective prompts embodying Brookside BI brand voice and AMS expertise

**Tasks**:
9. **Core Prompt Development** (documentation-expert)
   - Write comprehensive identity section with Brookside BI brand voice
   - Develop detailed expertise descriptions (Supabase, Next.js 16, NABIP domain)
   - Create methodology frameworks emphasizing sustainable practices
   - Design pattern libraries (Server Components, RLS policies, shadcn/ui)
   - Establish principle hierarchies focusing on scalability and measurable outcomes

10. **Prompt Optimization** (documentation-expert)
    - Refine instruction clarity and specificity for AMS context
    - Optimize token efficiency while maintaining comprehensive guidance
    - Enhance reasoning chains for complex AMS workflows
    - Strengthen guardrails (security, accessibility, performance)
    - Validate prompt coherence with Brookside BI voice

11. **Example Generation** (documentation-expert)
    - Create 5-10 realistic AMS usage examples (member onboarding, chapter reporting, event registration)
    - Design edge case scenarios (duplicate members, chapter conflicts, sold-out events)
    - Develop integration examples with Supabase and Next.js patterns
    - Write error handling examples (auth failures, database conflicts)
    - Generate output format samples (React components, API routes, database migrations)

12. **Prompt Validation** (documentation-expert)
    - Review prompt completeness for AMS requirements
    - Validate alignment with Brookside BI brand guidelines
    - Check for ambiguities or conflicts with existing agents
    - Assess prompt engineering best practices
    - Verify ecosystem compatibility with AMS architecture

### Phase 4: File Generation & Structure (50-65 minutes)

**Objective**: Generate production-ready agent definition files for AMS ecosystem

**Tasks**:
13. **Agent File Creation** (documentation-expert)
    - Generate `.claude/agents/{name}.md` file(s)
    - Write YAML frontmatter with AMS-specific metadata
    - Structure prompt body with all sections (identity, expertise, methodology, examples)
    - Include comprehensive AMS examples (member workflows, chapter operations, events)
    - Add integration notes for Supabase/Next.js patterns

14. **Supporting File Generation** (markdown-specialist)
    - Create usage guide documents with visual hierarchy
    - Generate integration examples for common AMS scenarios
    - Write troubleshooting guides for Supabase/Next.js issues
    - Develop best practices documentation aligned with AMS architecture
    - Create quick reference cards for rapid agent invocation

15. **Code Example Generation** (code-generator-typescript)
    - Generate TypeScript integration examples (Server Components, Server Actions)
    - Write Supabase query examples (RLS policies, real-time subscriptions)
    - Develop shadcn/ui component samples
    - Create test harness code for AMS workflows
    - Generate mock response examples

### Phase 5: Quality Validation & Review (65-80 minutes)

**Objective**: Ensure agent quality meets Brookside BI standards for sustainable development

**Tasks**:
16. **Technical Review** (documentation-expert)
    - Validate technical accuracy for Next.js 16/Supabase patterns
    - Check prompt engineering quality and clarity
    - Verify capability boundaries align with AMS architecture
    - Assess error handling completeness for production scenarios
    - Review integration patterns with existing agents

17. **Documentation Review** (markdown-specialist)
    - Check documentation completeness and visual hierarchy
    - Validate example quality and relevance to AMS workflows
    - Verify clarity, readability, and Brookside BI brand voice
    - Assess user guidance adequacy for team onboarding
    - Review troubleshooting coverage

18. **Consistency Check** (general-purpose)
    - Verify naming consistency across AMS ecosystem
    - Check format adherence to CLAUDE.md standards
    - Validate cross-references between agents
    - Ensure version compatibility (Next.js 16, Supabase latest)
    - Review dependency accuracy

### Phase 6: Integration & Documentation Updates (80-95 minutes)

**Objective**: Fully integrate new agent(s) into AMS ecosystem documentation

**Tasks**:
19. **CLAUDE.md Updates** (markdown-specialist)
    - Update agent registry section with new agent
    - Add to relevant AMS workflow examples
    - Update orchestration patterns for complex features
    - Modify best practices sections
    - Add to troubleshooting guides

20. **Registry Updates** (documentation-expert)
    - Add agent to official AMS agent registry
    - Update capability matrices showing agent interactions
    - Modify agent relationship diagrams (Mermaid)
    - Update performance benchmarks for AMS workflows
    - Add to agent comparison tables

21. **Guide Creation** (documentation-expert)
    - Write getting started guide for new agent
    - Create migration guide (if replacing existing functionality)
    - Develop cookbook recipes for common AMS scenarios
    - Write performance tuning guide for scalability
    - Create debugging guide with common issues

### Phase 7: Testing & Validation (95-110 minutes)

**Objective**: Thoroughly test new agent(s) to ensure proper functioning in AMS context

**Tasks**:
22. **Test Scenario Creation** (code-generator-typescript)
    - Design unit test scenarios for agent core capabilities
    - Create integration test cases with Supabase/Next.js
    - Develop end-to-end AMS workflows (member onboarding, event registration)
    - Design edge case tests (duplicate data, concurrent updates, auth failures)
    - Create performance benchmarks for production readiness

23. **Test Execution** (general-purpose)
    - Run basic invocation tests for agent
    - Execute integration scenarios with existing agents
    - Validate output formats (React components, Supabase queries)
    - Test error handling and recovery
    - Verify performance characteristics meet AMS requirements

24. **Results Analysis** (code-generator-typescript)
    - Analyze test results and identify failure patterns
    - Assess performance metrics against AMS benchmarks
    - Evaluate quality scores
    - Generate comprehensive test report
    - Provide recommendations for improvements

### Phase 8: Finalization & Deployment (110-120 minutes)

**Objective**: Complete agent creation and prepare for production use in AMS development

**Tasks**:
25. **Final Adjustments** (documentation-expert)
    - Apply fixes from testing phase
    - Refine based on test results and feedback
    - Update documentation with findings
    - Optimize performance issues
    - Enhance error messages with actionable guidance

26. **Deployment Preparation** (general-purpose)
    - Create deployment checklist for AMS integration
    - Generate release notes with Brookside BI brand voice
    - Prepare announcement template for team
    - Update change logs
    - Create rollback plan if issues arise

27. **User Communication** (documentation-expert)
    - Generate summary report emphasizing outcomes
    - Create usage instructions with clear examples
    - Provide integration guide for AMS workflows
    - Share best practices for sustainable use
    - Deliver final recommendations

## Agent Coordination Layers

### Discovery Layer (Phase 1)
**Lead**: general-purpose
**Agents**: Explore, Plan
**Responsibility**: Understanding AMS requirements, analyzing ecosystem, determining architecture

### Design Layer (Phases 2-3)
**Lead**: database-architect or appropriate specialist
**Agents**: documentation-expert
**Responsibility**: Creating agent architecture, developing personas, engineering prompts

### Generation Layer (Phase 4)
**Lead**: documentation-expert
**Agents**: markdown-specialist, code-generator-typescript, visual-content-architect
**Responsibility**: Generating all files, documentation, and code examples

### Validation Layer (Phase 5)
**Lead**: documentation-expert
**Agents**: markdown-specialist, general-purpose
**Responsibility**: Ensuring quality, consistency, and completeness

### Integration Layer (Phase 6)
**Lead**: markdown-specialist
**Agents**: documentation-expert, visual-content-architect
**Responsibility**: Updating ecosystem documentation and guides

### Testing Layer (Phase 7)
**Lead**: code-generator-typescript
**Agents**: general-purpose
**Responsibility**: Creating and executing comprehensive tests

### Finalization Layer (Phase 8)
**Lead**: general-purpose
**Agents**: documentation-expert
**Responsibility**: Final adjustments, deployment, and user communication

## Usage Examples

### Example 1: Creating a Chapter Coordinator Agent

<example>
**Context**: User needs an agent specialized in chapter management and reporting for NABIP AMS

**User**: /create-agent

**Assistant (Phase 1 - Discovery)**:
I'll help you create a specialized agent for AMS development. Let me start by understanding your needs.

*general-purpose agent analyzing requirements...*

What specific capabilities do you need this agent to have for NABIP AMS? Please describe:
1. Primary use cases (chapter management, reporting, coordination)
2. Supabase data models it will work with (chapters, members, events)
3. Expected outputs (reports, dashboards, automated workflows)
4. Integration needs with existing agents

**User**: I need an agent that can coordinate chapter operations - manage chapter profiles, track performance metrics, generate state-level reports, and handle chapter-to-national communication workflows. It should work with our chapters and members tables in Supabase, create Next.js dashboard components, and integrate with our existing member-management workflows.

**Assistant (Phase 1 - Ecosystem Analysis)**:
*Explore agent searching existing AMS agents...*

I've analyzed your existing AMS agent ecosystem. While you have:
- `database-architect`: Handles Supabase schema design and RLS policies
- `api-integration-architect`: Manages API connections
- `frontend-engineer`: Creates React/Next.js components

You don't have a dedicated chapter coordination specialist. This represents a clear capability gap for managing NABIP's multi-chapter structure.

*Plan agent analyzing architecture...*

**Recommendation**: Single agent "chapter-coordinator" is optimal for sustainable development. It establishes cohesive responsibilities around chapter operations that don't require decomposition, supporting scalable multi-state management.

**Assistant (Phase 2-3 - Design & Prompt Engineering)**:
*database-architect designing architecture...*
*documentation-expert creating persona and prompts...*

Designing agent to streamline chapter operations with:
- **Core Skills**: Chapter performance tracking, state-level reporting, cross-chapter coordination
- **Data Patterns**: Supabase RLS policies for chapter access, real-time chapter metrics
- **Outputs**: Chapter dashboards (shadcn/ui), performance reports, automated workflows
- **Personality**: Strategic coordinator, data-driven, outcome-focused (Brookside BI voice)
- **Integration**: Coordinates with database-architect for schema, api-integration-architect for external systems

[Continues through all phases...]

**Final Output**:
✅ Created: `.claude/agents/chapter-coordinator.md`
✅ Updated: CLAUDE.md agent registry
✅ Generated: 5 test scenarios, 10 AMS-specific usage examples
✅ Integration verified with database-architect and member-management workflows
✅ Mermaid diagrams created showing chapter coordination workflows
</example>

### Example 2: Creating Multiple Event Management Agents

<example>
**Context**: User needs comprehensive event management coverage for Capitol Conference and chapter events

**User**: /create-agent - I need agents to handle event registration, attendee tracking, venue coordination, and post-event reporting for NABIP events

**Assistant (Phase 1 - Decomposition Analysis)**:
*Plan agent analyzing requirements...*

This requires multiple specialized agents to establish scalable event operations across distinct domains:

1. **event-registration-specialist**: Registration workflows, payment processing, capacity management
2. **attendee-coordinator**: Check-in processes, badge printing, real-time attendance tracking
3. **venue-operations**: Room assignments, A/V coordination, catering management
4. **event-analytics**: Post-event reporting, ROI analysis, attendee insights

Each agent focuses on specific expertise that warrants separate specialization for sustainable multi-event operations.

[Creates 4 coordinated agents through all phases...]
</example>

### Example 3: Enhancing Existing Agent with REBC Designation Capabilities

<example>
**Context**: User wants to extend member management capabilities for REBC designation application workflow

**User**: /create-agent - The member-management agent needs REBC designation application tracking

**Assistant (Phase 1 - Analysis)**:
*Explore agent analyzing existing capabilities...*

Your existing member-management agent handles core member CRUD but lacks specialized REBC designation workflow capabilities.

**Options**:
1. Extend existing agent (not recommended - violates single responsibility principle)
2. Create new `rebc-designation-coordinator` agent that coordinates with member-management

**Recommendation**: Create specialized `rebc-designation-coordinator` agent to streamline:
- REBC application submission and validation
- Multi-step approval workflows
- Document verification (education, experience, ethics requirements)
- Designation status tracking across member lifecycle
- Continuing education compliance monitoring

This approach establishes sustainable governance for REBC designation while maintaining clear separation of concerns.

[Continues with new agent creation...]
</example>

### Example 4: Test-Drive Before Commitment

<example>
**Context**: User wants to test agent concept before full creation

**User**: /create-agent --dry-run - Create a dues-collection-automator

**Assistant (Phase 1-3 - Design Only)**:
Running in dry-run mode. I'll design the agent and create a test prompt without generating files, allowing you to validate the approach before full implementation.

*Completes Phases 1-3 only*

**Test Prompt Generated**:
```markdown
You are the Dues Collection Automator, a specialized agent that streamlines membership dues collection and financial tracking for NABIP AMS...

[Full prompt for testing]
```

You can test this prompt directly to validate it meets your needs. If satisfied, run without --dry-run to complete full creation and integration into your AMS ecosystem.
</example>

### Example 5: Replacing Manual Workflow with Specialized Agent

<example>
**Context**: Replacing manual member onboarding with specialized agent

**User**: /create-agent - We manually handle new member onboarding but need an automated agent for this workflow

**Assistant (Phase 1)**:
*general-purpose analyzing workflow...*

I'll create a `member-onboarding-specialist` agent to automate your member onboarding workflow, establishing structured processes that improve consistency and reduce manual effort.

**Current Manual Process**:
1. Collect member application data
2. Validate membership type eligibility
3. Assign chapter affiliation
4. Set up Supabase Auth account
5. Send welcome email with portal credentials
6. Track onboarding completion

**Agent Design to Streamline Operations**:
- Auto-validates membership eligibility against business rules
- Creates Supabase Auth users with proper RLS policies
- Generates personalized welcome communications
- Establishes tracking dashboards for onboarding metrics
- Coordinates with chapter-coordinator for proper assignment

[Creates agent with migration guide from manual process...]
</example>

## Expected Outputs

Upon successful completion, the command generates:

### Primary Outputs
1. **Agent Definition Files** (`.claude/agents/{name}.md`)
   - Complete YAML frontmatter with AMS-specific metadata
   - Comprehensive prompt body (2000-4000 words) with Brookside BI brand voice
   - 5-10 detailed usage examples for NABIP workflows
   - Integration notes for Supabase/Next.js patterns
   - Model selection guidance (sonnet/opus)

2. **Documentation Updates**
   - CLAUDE.md agent registry entry
   - Updated orchestration patterns for AMS features
   - Modified workflow examples
   - Enhanced best practices for sustainable development

3. **Usage Guides**
   - Getting started guide (500-1000 words)
   - Integration cookbook (10+ AMS recipes)
   - Troubleshooting guide for common Supabase/Next.js issues
   - Performance tuning recommendations for production scalability

4. **Test Artifacts**
   - Unit test scenarios (10-15 tests)
   - Integration test cases (5-10 tests)
   - End-to-end AMS workflows (3-5 workflows)
   - Test execution reports
   - Performance benchmarks

5. **Integration Materials**
   - TypeScript code examples (Server Components, Server Actions, shadcn/ui)
   - Supabase query patterns (RLS, Realtime, Storage)
   - Orchestration patterns for multi-agent coordination
   - Error handling examples
   - Mermaid diagrams (visual-content-architect generated)

### Metadata and Tracking
- Creation timestamp and version
- Author attribution
- Dependency mappings (Supabase, Next.js versions)
- Performance baselines
- Quality metrics

### Communication Deliverables
- Executive summary (outcome-focused, Brookside BI voice)
- Technical specification (for AMS development team)
- Usage instructions (for end users)
- Release notes
- Change log entries

## Success Criteria

The agent creation process is considered successful when ALL of the following criteria are met:

### Functional Criteria
1. ✅ **Unique Value**: Agent fills genuine gap in AMS ecosystem without duplicating existing capabilities
2. ✅ **Clear Boundaries**: Agent has well-defined responsibilities aligned with NABIP domain
3. ✅ **Comprehensive Prompt**: Agent prompt includes all required sections and is 2000+ words
4. ✅ **Rich Examples**: At least 5 detailed AMS usage examples demonstrating various scenarios
5. ✅ **Proper Integration**: Agent correctly integrates with existing AMS agents and architecture

### Quality Criteria
6. ✅ **Test Coverage**: All core capabilities have test scenarios with >90% pass rate
7. ✅ **Documentation Complete**: All documentation sections present with Brookside BI brand voice
8. ✅ **Performance Validated**: Agent responds within acceptable time limits (<30s for most tasks)
9. ✅ **Error Handling**: Graceful handling of edge cases (auth failures, data conflicts, concurrent updates)
10. ✅ **Consistent Voice**: Agent maintains Brookside BI brand voice (solution-focused, outcome-oriented)

### Technical Criteria
11. ✅ **Format Compliance**: Files follow AMS CLAUDE.md format and structure
12. ✅ **Model Optimization**: Correct model selected (opus for complex workflows, sonnet for focused tasks)
13. ✅ **Token Efficiency**: Prompts optimized for token usage without sacrificing quality
14. ✅ **Version Compatibility**: Works with Next.js 16, Supabase latest, TypeScript 5
15. ✅ **Dependency Management**: All dependencies clearly documented (Supabase, shadcn/ui, etc.)

### Integration Criteria
16. ✅ **Registry Updated**: Agent properly added to CLAUDE.md and all registries
17. ✅ **Cross-references Valid**: All documentation cross-references are accurate
18. ✅ **Orchestration Patterns**: Agent works in defined multi-agent orchestration patterns
19. ✅ **Handoff Protocols**: Clean handoffs to/from other AMS agents
20. ✅ **Rollback Plan**: Clear rollback procedure if issues arise

## Notes

### Best Practices for AMS Agent Creation

**Agent Naming Conventions**:
- Use lowercase with hyphens: `chapter-coordinator`, `event-registration-specialist`
- Be specific but concise: prefer `member-onboarding-specialist` over `onboarding`
- Include domain qualifiers: `rebc-designation-coordinator`, `dues-collection-automator`
- Avoid generic names: not `helper`, `manager`, `handler`

**Prompt Engineering Guidelines for Brookside BI Voice**:
- Start with strong identity statement emphasizing outcomes
- Use solution-focused, professional language
- Frame capabilities around solving business problems
- Emphasize sustainable practices and scalability
- Include measurable outcomes in descriptions
- Use action-oriented language: "streamline," "establish," "improve visibility"
- Provide reasoning frameworks for decision-making
- Build in quality checks and validation steps

**Model Selection for AMS Workflows**:
- **Opus**: Complex multi-step workflows (member onboarding, event orchestration), architecture design
- **Sonnet**: Focused tasks (data queries, formatting, simple analysis), component generation
- When in doubt, start with Sonnet and upgrade if needed based on complexity

**Integration Patterns for AMS Agents**:
- **Sequential Handoff**: database-architect designs schema → api-integration-architect creates endpoints
- **Parallel Execution**: Multiple agents analyze codebase simultaneously
- **Iterative Refinement**: Agent loops until quality criteria met
- **Hierarchical Delegation**: chapter-coordinator delegates to state-level agents
- **Consensus Building**: Multiple agents validate security or compliance requirements

### Common Pitfalls to Avoid

1. **Over-broad Scope**: Trying to make one agent handle all member + chapter + event operations
2. **Under-specified Prompts**: Vague instructions not specific to NABIP domain
3. **Ignoring Existing Agents**: Duplicating functionality from database-architect or api-integration-architect
4. **Weak Examples**: Generic examples not tied to actual AMS workflows
5. **Poor Error Handling**: Not planning for Supabase auth failures or RLS policy conflicts
6. **Insufficient Testing**: Skipping test phases to save time (risks production issues)
7. **Documentation Debt**: Creating agent without proper CLAUDE.md integration
8. **Integration Afterthought**: Not planning multi-agent coordination from the start

### Performance Optimization Tips for AMS

- Keep prompts focused on specific NABIP workflows while maintaining completeness
- Use structured output formats (TypeScript types, Supabase schema) to ease parsing
- Implement caching strategies for repeated Supabase queries
- Design for incremental processing where possible (paginated member lists)
- Consider batch operations for bulk member imports or dues processing
- Plan for graceful degradation under load (large chapter reporting)

### Maintenance Considerations

- Agents should be versioned with semantic versioning
- Include deprecation notices when replacing agents
- Maintain backwards compatibility when possible
- Document breaking changes clearly (Supabase schema updates, Next.js upgrades)
- Plan for migration paths from old to new agents
- Establish regular review cycles for agent effectiveness

### Emergency Procedures

If agent creation fails or causes issues:
1. Check test reports for specific failures
2. Review quality validation feedback
3. Verify no conflicts with existing AMS agents
4. Validate all dependencies are available (Supabase connection, Next.js version)
5. Use rollback plan if agent was partially deployed
6. Escalate to general-purpose agent for coordination issues
7. Document lessons learned for future improvements

---

*This command establishes the foundation for sustainable agent creation, leveraging multi-agent orchestration to ensure every new agent drives measurable improvements to your NABIP AMS development workflow.*
