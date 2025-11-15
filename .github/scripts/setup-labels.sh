#!/bin/bash

# GitHub Labels Setup for NABIP AMS
# Establishes comprehensive labeling system to streamline issue and PR management workflows

set -e

echo "🏷️  Setting up GitHub labels for NABIP AMS..."

# Function to create or update label
create_label() {
  local name=$1
  local description=$2
  local color=$3

  if gh label list | grep -q "^${name}"; then
    echo "Updating: ${name}"
    gh label edit "${name}" --description "${description}" --color "${color}"
  else
    echo "Creating: ${name}"
    gh label create "${name}" --description "${description}" --color "${color}"
  fi
}

echo ""
echo "📏 Creating Size Labels..."
create_label "size:small" "Small change (<50 lines modified)" "0e8a16"
create_label "size:medium" "Medium change (50-200 lines modified)" "fbca04"
create_label "size:large" "Large change (200-500 lines modified)" "ff9800"
create_label "size:extra-large" "Extra large change (>500 lines modified)" "d93f0b"

echo ""
echo "🏷️  Creating Type Labels..."
create_label "type:bug" "Defect or error requiring correction" "d73a4a"
create_label "type:feature" "New capability or enhancement request" "a2eeef"
create_label "type:docs" "Documentation updates or improvements" "0075ca"
create_label "type:question" "Request for information or clarification" "d876e3"
create_label "type:enhancement" "Improvement to existing functionality" "84b6eb"
create_label "bug-fix" "Pull request that fixes a bug" "d73a4a"
create_label "refactor" "Code restructuring without changing functionality" "fbca04"
create_label "dependencies" "Dependency updates or package management" "0366d6"

echo ""
echo "⚡ Creating Priority Labels..."
create_label "priority:critical" "Critical priority - immediate attention required" "b60205"
create_label "priority:high" "High priority - address in current sprint" "d93f0b"
create_label "priority:medium" "Medium priority - schedule for upcoming sprint" "fbca04"
create_label "priority:low" "Low priority - address when capacity allows" "0e8a16"

echo ""
echo "🎯 Creating Complexity Labels..."
create_label "complexity:trivial" "Trivial complexity - quick fix or simple change" "c5def5"
create_label "complexity:simple" "Simple complexity - straightforward implementation" "bfdadc"
create_label "complexity:moderate" "Moderate complexity - requires planning and testing" "fef2c0"
create_label "complexity:complex" "Complex - extensive design and implementation effort" "f9d0c4"

echo ""
echo "📍 Creating Area Labels..."
create_label "area:vitepress" "VitePress documentation framework" "5319e7"
create_label "area:documentation" "Documentation content and structure" "0075ca"
create_label "area:infrastructure" "Infrastructure, deployment, and hosting" "1d76db"
create_label "area:ci-cd" "CI/CD workflows and automation" "000000"
create_label "area:mcp" "Model Context Protocol server integration" "7057ff"
create_label "area:integrations" "Third-party integrations (Notion, Monday, etc.)" "0e8a16"
create_label "area:auth" "Authentication and authorization" "d73a4a"
create_label "area:database" "Database schema, queries, and data management" "c5def5"
create_label "area:ui" "User interface components and styling" "e99695"
create_label "area:api" "API routes and server actions" "fbca04"
create_label "area:members" "Member management features" "1d76db"
create_label "area:chapters" "Chapter management features" "5319e7"
create_label "area:events" "Event coordination features" "0e8a16"
create_label "area:finance" "Financial tracking and reporting" "d4c5f9"
create_label "area:learning" "Learning resources and REBC workflows" "bfdadc"

echo ""
echo "📊 Creating Status Labels..."
create_label "status:triage" "Awaiting triage and classification" "fbca04"
create_label "status:ready" "Ready for development - fully specified" "0e8a16"
create_label "status:in-progress" "Currently being worked on" "1d76db"
create_label "status:blocked" "Blocked by external dependency or issue" "d93f0b"
create_label "status:review" "Under review - awaiting feedback" "fbca04"
create_label "status:needs-info" "Requires additional information" "d876e3"

echo ""
echo "🔒 Creating Security Labels..."
create_label "security" "Security-related issue or enhancement" "b60205"
create_label "security:critical" "Critical security vulnerability - immediate action required" "b60205"
create_label "security:high" "High severity security issue" "d93f0b"
create_label "security:medium" "Medium severity security concern" "fbca04"
create_label "security:low" "Low severity security improvement" "0e8a16"
create_label "vulnerability" "Known security vulnerability requiring remediation" "d73a4a"

echo ""
echo "♿ Creating Accessibility Labels..."
create_label "accessibility" "Accessibility improvements for inclusive experience" "5319e7"
create_label "a11y" "WCAG compliance and accessibility standards" "5319e7"
create_label "wcag" "Web Content Accessibility Guidelines compliance" "0075ca"

echo ""
echo "📦 Creating Category Labels..."
create_label "documentation" "Documentation changes and improvements" "0075ca"
create_label "ci-cd" "Continuous integration and deployment workflows" "000000"
create_label "configuration" "Configuration file changes" "fef2c0"
create_label "components" "UI component updates" "e99695"
create_label "assets" "Static assets (images, icons, media)" "bfd4f2"

echo ""
echo "🏷️  Creating Process Labels..."
create_label "enhancement" "New feature or improvement" "a2eeef"
create_label "stale" "No recent activity - may be closed if inactive" "ffffff"
create_label "duplicate" "Duplicate of existing issue or PR" "cfd3d7"
create_label "wontfix" "Will not be addressed - not aligned with roadmap" "ffffff"
create_label "good first issue" "Suitable for new contributors" "7057ff"
create_label "help wanted" "Community contributions welcome" "008672"
create_label "breaking change" "Breaking change requiring major version bump" "b60205"

echo ""
echo "⚖️  Creating Compliance Labels..."
create_label "license-compliance" "License compliance and attribution" "fbca04"
create_label "gdpr" "GDPR compliance and data privacy" "0e8a16"
create_label "pii" "Contains or relates to personally identifiable information" "d93f0b"

echo ""
echo "🤖 Creating Automation Labels..."
create_label "automated" "Created or managed by automation" "ededed"
create_label "bot" "Bot-generated content" "ededed"
create_label "needs-review" "Requires manual review from maintainer" "fbca04"
create_label "auto-merge" "Safe for automated merge" "0e8a16"

echo ""
echo "✅ All labels created successfully!"
echo ""
echo "📊 Summary:"
gh label list | wc -l
echo "labels established to streamline workflow management"
echo ""
echo "🎯 Next steps:"
echo "  1. Review labels in GitHub repository settings"
echo "  2. Update .github/labeler.yml for auto-labeling"
echo "  3. Configure CODEOWNERS for area-based assignments"
echo "  4. Train team on label usage and conventions"
