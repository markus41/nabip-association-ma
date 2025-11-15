# Custom Agent Assignment Quick Reference

This guide helps determine which custom GitHub agent should be assigned to different types of issues in the NABIP Association Management System.

## Available Custom Agents

### 1. administrative-workflow-agent
**Expertise**: RBAC permissions, approval processes, bulk operations, audit logging, compliance workflows

**Assign for**:
- ✅ Permission management and role assignments
- ✅ Bulk operations (delete, update, export)
- ✅ Approval workflows
- ✅ Audit logging and tracking
- ✅ GDPR/compliance tools
- ✅ Session management
- ✅ Data retention policies
- ✅ IP restrictions and security policies

**Examples from our issues**:
- Issue #10: Add Bulk Chapter Operations
- Issue #28: Add Permission Management Interface
- Issue #30: Implement GDPR Compliance Tools
- Issue #31: Build Audit Log Viewer

---

### 2. dashboard-analytics-engineer
**Expertise**: Data visualization, interactive analytics, real-time updates, export capabilities, reporting

**Assign for**:
- ✅ Charts and data visualizations
- ✅ Sparklines and trend graphs
- ✅ Performance indicators and comparisons
- ✅ Report execution and preview
- ✅ Analytics dashboards
- ✅ KPI displays

**Examples from our issues**:
- Issue #7: Fix "Run Report" Functionality
- Issue #13: Add Sparkline Graphs to Chapter Cards
- Issue #15: Show Comparative Performance Indicators
- Issue #17: Enable Chapter Comparison View

---

### 3. data-management-export-agent
**Expertise**: Advanced filtering, search, sorting, multi-format export (CSV/Excel/PDF)

**Assign for**:
- ✅ Data export functionality
- ✅ Advanced filtering and search
- ✅ Data sorting and organization
- ✅ Comparison tools with filtering
- ✅ Multi-format data exports

**Examples from our issues**:
- Issue #16: Add Chapter Data Export Option
- Issue #21: Implement Chapter Comparison Tools

---

### 4. feature-completion-specialist
**Expertise**: Fixing broken features, completing incomplete workflows, establishing end-to-end functionality

**Assign for**:
- ✅ Broken buttons and non-functional features
- ✅ Incomplete workflows
- ✅ Missing modals or dialogs
- ✅ Non-functional forms
- ✅ Broken navigation or routing
- ✅ End-to-end feature completion

**Examples from our issues**:
- Issue #1: Fix "Add Member" Button
- Issue #2: Fix "New Campaign" Creation
- Issue #3: Fix "Create Course" Button

---

### 5. form-validation-architect
**Expertise**: React Hook Form, Zod validation, form architecture, user input validation

**Assign for**:
- ✅ Form creation and validation
- ✅ Complex form fields
- ✅ Input validation logic
- ✅ Error handling in forms
- ✅ Form submission workflows
- ✅ Multi-step forms/wizards

**Examples from our issues**:
- Issue #5: Implement Member Portal Login (form portion)
- Issue #6: Fix Event Creation Workflow (form validation)
- Issue #8: Add Chapter Creation Form Outside Grid
- Issue #35: Create Privacy Preference Center

---

### 6. integration-api-specialist
**Expertise**: API integration, external services, authentication, third-party APIs

**Assign for**:
- ✅ API endpoint integration
- ✅ Authentication (JWT, OAuth)
- ✅ External service integration
- ✅ Payment processor integration
- ✅ CRM system integration
- ✅ Calendar platform integration

**Examples from our issues**:
- Issue #5: Implement Member Portal Login (JWT authentication)

---

### 7. missing-states-feedback-agent
**Expertise**: Loading states, empty states, error states, success feedback, user feedback patterns

**Assign for**:
- ✅ Adding loading indicators
- ✅ Empty state displays
- ✅ Error handling and messages
- ✅ Success feedback
- ✅ Progress indicators
- ✅ Toast notifications

**Not directly used in current feature requests** (but available for future issues)

---

### 8. navigation-accessibility-agent
**Expertise**: WCAG 2.1 AA compliance, keyboard navigation, ARIA attributes, screen reader support, role-based navigation

**Assign for**:
- ✅ Role-based views (Member, Admin, etc.)
- ✅ Navigation restrictions based on permissions
- ✅ Keyboard navigation
- ✅ Accessibility compliance
- ✅ Focus management
- ✅ ARIA attributes

**Examples from our issues**:
- Issue #24: Implement Member View
- Issue #25: Create Chapter Admin View
- Issue #26: Build State Admin View
- Issue #27: Design National Admin View

---

### 9. notification-communication-agent
**Expertise**: Multi-channel notifications, email, push notifications, in-app messaging, real-time updates

**Assign for**:
- ✅ Email composition and sending
- ✅ In-app messaging
- ✅ Push notifications
- ✅ Notification preferences
- ✅ Message templates
- ✅ Real-time communication

**Examples from our issues**:
- Issue #22: Add Direct Messaging to Chapter Leaders

---

### 10. performance-optimization-engineer
**Expertise**: Code splitting, lazy loading, bundle optimization, Web Vitals, performance improvements

**Assign for**:
- ✅ Performance optimization
- ✅ Code splitting
- ✅ Lazy loading components
- ✅ Bundle size reduction
- ✅ Render performance
- ✅ Loading time improvements

**Not directly used in current feature requests** (but available for future issues)

---

### 11. react-component-architect
**Expertise**: React 19 components, Radix UI, TypeScript, composition patterns, accessible components

**Assign for**:
- ✅ New React components
- ✅ Component refactoring
- ✅ Interactive UI elements
- ✅ Component state management
- ✅ UI interactions (hover, click, etc.)
- ✅ Visual component improvements
- ✅ Component accessibility

**Examples from our issues**:
- Issue #4: Fix Course Preview
- Issue #11: Implement Chapter Hierarchy Visualization
- Issue #12: Make Chapter Card Metrics Clickable
- Issue #14: Add Quick Action Buttons on Chapter Card Hover
- Issue #23: Add Action Buttons to Hierarchy Table

---

## Decision Matrix

Use this matrix to quickly decide which agent(s) to assign:

| Issue Type | Primary Agent | Secondary Agent (if needed) |
|------------|---------------|----------------------------|
| Broken button/feature | feature-completion-specialist | - |
| Form creation/validation | form-validation-architect | - |
| Login/authentication | form-validation-architect | integration-api-specialist |
| New React component | react-component-architect | - |
| Interactive visualization | dashboard-analytics-engineer | react-component-architect |
| Data export | data-management-export-agent | - |
| Bulk operations | administrative-workflow-agent | - |
| RBAC/permissions | administrative-workflow-agent | navigation-accessibility-agent |
| Role-based views | navigation-accessibility-agent | - |
| Messaging/notifications | notification-communication-agent | - |
| API integration | integration-api-specialist | - |
| Performance issues | performance-optimization-engineer | - |
| Missing UI states | missing-states-feedback-agent | - |

## Tips for Assigning Multiple Agents

Some issues require collaboration between multiple agents:

1. **Login Feature** → form-validation-architect (form) + integration-api-specialist (API)
2. **Event Creation** → form-validation-architect (validation) + feature-completion-specialist (workflow)
3. **RBAC Views** → navigation-accessibility-agent (navigation) + administrative-workflow-agent (permissions)
4. **Interactive Charts** → dashboard-analytics-engineer (charts) + react-component-architect (component)

## Agent Assignment Labels

When creating issues, use these labels:

- `agent:administrative-workflow-agent`
- `agent:dashboard-analytics-engineer`
- `agent:data-management-export-agent`
- `agent:feature-completion-specialist`
- `agent:form-validation-architect`
- `agent:integration-api-specialist`
- `agent:missing-states-feedback-agent`
- `agent:navigation-accessibility-agent`
- `agent:notification-communication-agent`
- `agent:performance-optimization-engineer`
- `agent:react-component-architect`

## Example Issue Assignment Workflow

1. **Read the issue description**
2. **Identify the primary task** (form, component, workflow, etc.)
3. **Select the agent with matching expertise** (use decision matrix)
4. **Check if multiple agents are needed** (e.g., form + API)
5. **Add appropriate agent labels** to the issue
6. **Mention agents in issue description** for clarity

## Getting Help

If you're unsure which agent to assign:
1. Review the agent descriptions above
2. Check similar issues in the repository
3. Look at the examples from our feature requests
4. When in doubt, start with the most relevant agent and adjust if needed
