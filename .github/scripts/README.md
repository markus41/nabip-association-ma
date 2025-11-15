# Feature Request Issue Creation Guide

This directory contains scripts and data for creating GitHub issues for the NABIP Association Management System feature requests.

## Overview

Three comprehensive feature requests with 36 sub-issues have been documented:

1. **Feature Request #1: Core Functionality Fixes** (7 sub-issues)
   - Critical priority - broken core features
   - Fixes: Add Member, Campaign Creation, Course Creation, Event Workflow, Reports, Login

2. **Feature Request #2: Chapter Management System Enhancement** (16 sub-issues)
   - High priority - efficiency improvements
   - Features: Bulk operations, hierarchy visualization, analytics, export tools

3. **Feature Request #3: Role-Based Access Control (RBAC) System** (13 sub-issues)
   - High priority - security and compliance
   - Features: Multi-tier access, permissions, audit logging, GDPR compliance

## Files in This Directory

- **`feature-requests-data.json`**: Structured JSON data with all feature requests and sub-issues
- **`create_github_issues.py`**: Python script to create issues via GitHub API
- **`create-feature-requests.sh`**: Bash script to create issues via GitHub CLI
- **`FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md`**: Complete documentation with agent assignments

## Custom Agent Assignments

Each sub-issue has been assigned to the most appropriate custom GitHub agent:

| Agent | Issues | Expertise |
|-------|--------|-----------|
| `administrative-workflow-agent` | 9 | RBAC, bulk operations, audit logging |
| `react-component-architect` | 7 | React components, UI interactions |
| `form-validation-architect` | 5 | Form validation with React Hook Form |
| `dashboard-analytics-engineer` | 5 | Analytics, visualizations, exports |
| `feature-completion-specialist` | 4 | Fix broken features, complete workflows |
| `navigation-accessibility-agent` | 4 | RBAC views, accessible navigation |
| `data-management-export-agent` | 2 | Data filtering, export functionality |
| `notification-communication-agent` | 1 | Messaging and notifications |
| `integration-api-specialist` | 1 | API integration, authentication |

## Method 1: Using Python Script (Recommended)

### Prerequisites

```bash
pip install requests
```

### Usage

1. **Generate a GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Save the token securely

2. **Run in dry-run mode first** (to preview what will be created):
   ```bash
   cd /home/runner/work/nabip-association-ma/nabip-association-ma
   python .github/scripts/create_github_issues.py \
     --token YOUR_GITHUB_TOKEN \
     --json-file feature-requests-data.json \
     --dry-run
   ```

3. **Create the issues**:
   ```bash
   python .github/scripts/create_github_issues.py \
     --token YOUR_GITHUB_TOKEN \
     --json-file feature-requests-data.json
   ```

### Script Options

- `--token`: GitHub personal access token (required)
- `--repo`: Repository in format `owner/repo` (default: `markus41/nabip-association-ma`)
- `--json-file`: Path to JSON data file (default: `feature-requests-data.json`)
- `--dry-run`: Preview without creating issues

### Example Output

```
======================================================================
GitHub Issue Creator for NABIP Association Management
======================================================================
Repository: markus41/nabip-association-ma
Mode: LIVE
Feature Requests: 3
Total Sub-Issues: 36
======================================================================

Proceed with creating issues? (yes/no): yes

======================================================================
Creating Feature Request #1: [Feature]: Fix Critical Non-Functional Core Features
======================================================================
✓ Created issue #101: [Feature]: Fix Critical Non-Functional Core Features

Creating 7 sub-issues...
✓ Created issue #102: [Sub-Issue]: Fix Add Member Button
✓ Created issue #103: [Sub-Issue]: Fix New Campaign Creation
...
```

## Method 2: Using Bash Script with GitHub CLI

### Prerequisites

Install GitHub CLI:
```bash
# On macOS
brew install gh

# On Ubuntu/Debian
sudo apt install gh

# Login
gh auth login
```

### Usage

1. **Run in dry-run mode**:
   ```bash
   cd /home/runner/work/nabip-association-ma/nabip-association-ma
   ./.github/scripts/create-feature-requests.sh --dry-run
   ```

2. **Create the issues**:
   ```bash
   ./.github/scripts/create-feature-requests.sh
   ```

## Method 3: Manual Creation via GitHub Web UI

If automated scripts are not available, use the comprehensive documentation:

1. Open `FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md`
2. For each feature request:
   - Go to GitHub → Issues → New Issue
   - Use "Feature Request" template
   - Copy title, description, and details from the markdown
   - Add appropriate labels
3. For each sub-issue:
   - Create new issue
   - Copy sub-issue details
   - Link to parent feature request (e.g., "Part of #123")
   - Add agent label (e.g., `agent:feature-completion-specialist`)

## Post-Creation Steps

After creating the issues:

1. **Link Sub-Issues to Parent**
   - Edit each parent feature request
   - Add links to sub-issues in the description
   - GitHub will show them as a task list

2. **Create Project Board**
   - Create a new GitHub Project
   - Add all issues to the board
   - Organize by priority (Critical, High, Medium, Low)
   - Group by feature request

3. **Set Milestones**
   - Create milestone: "Q1 2025 - Core Fixes" (Feature Request #1)
   - Create milestone: "Q2 2025 - Chapter Management" (Feature Request #2)
   - Create milestone: "Q2 2025 - RBAC System" (Feature Request #3)

4. **Assign Teams/Developers**
   - Review agent assignments
   - Assign appropriate team members
   - Set up notification preferences

5. **Configure Automation**
   - Set up GitHub Actions for issue management
   - Configure auto-labeling based on agent assignments
   - Set up progress tracking automation

## Issue Labels Reference

### Priority Labels
- `priority:critical` - Blocking, must be fixed immediately
- `priority:high` - Important, should be done soon
- `priority:medium` - Nice to have
- `priority:low` - Future enhancement

### Type Labels
- `enhancement` - New feature or improvement
- `feature-request` - Parent feature request
- `sub-feature` - Child of a feature request
- `security` - Security-related issue
- `compliance` - GDPR/regulatory compliance
- `privacy` - Privacy-related issue

### Agent Labels
- `agent:administrative-workflow-agent`
- `agent:dashboard-analytics-engineer`
- `agent:data-management-export-agent`
- `agent:feature-completion-specialist`
- `agent:form-validation-architect`
- `agent:integration-api-specialist`
- `agent:navigation-accessibility-agent`
- `agent:notification-communication-agent`
- `agent:react-component-architect`

## Troubleshooting

### Rate Limiting
If you encounter rate limiting errors:
- The Python script includes delays between requests
- For large batches, consider running in multiple sessions
- GitHub API rate limit: 5000 requests/hour for authenticated users

### Authentication Errors
- Ensure your GitHub token has `repo` scope
- Check token hasn't expired
- Verify repository name is correct

### Script Errors
- Ensure Python 3.6+ is installed
- Install required packages: `pip install requests`
- Check JSON file path is correct

## Support

For questions or issues:
1. Review the `FEATURE_REQUESTS_AND_AGENT_ASSIGNMENTS.md` documentation
2. Check the `feature-requests-data.json` for structured data
3. Open an issue on the repository if you encounter problems

## License

These scripts and documentation are part of the NABIP Association Management System project and follow the same MIT license.
