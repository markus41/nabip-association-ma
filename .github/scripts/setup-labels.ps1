# GitHub Labels Setup for NABIP AMS
# Establishes comprehensive labeling system to streamline issue and PR management workflows

Write-Host "🏷️  Setting up GitHub labels for NABIP AMS..." -ForegroundColor Cyan

# Function to create or update label
function Set-GitHubLabel {
    param(
        [string]$Name,
        [string]$Description,
        [string]$Color
    )

    $existingLabel = gh label list --json name | ConvertFrom-Json | Where-Object { $_.name -eq $Name }

    if ($existingLabel) {
        Write-Host "Updating: $Name" -ForegroundColor Yellow
        gh label edit $Name --description $Description --color $Color
    } else {
        Write-Host "Creating: $Name" -ForegroundColor Green
        gh label create $Name --description $Description --color $Color
    }
}

Write-Host ""
Write-Host "📏 Creating Size Labels..." -ForegroundColor Cyan
Set-GitHubLabel "size:small" "Small change (<50 lines modified)" "0e8a16"
Set-GitHubLabel "size:medium" "Medium change (50-200 lines modified)" "fbca04"
Set-GitHubLabel "size:large" "Large change (200-500 lines modified)" "ff9800"
Set-GitHubLabel "size:extra-large" "Extra large change (>500 lines modified)" "d93f0b"

Write-Host ""
Write-Host "🏷️  Creating Type Labels..." -ForegroundColor Cyan
Set-GitHubLabel "type:bug" "Defect or error requiring correction" "d73a4a"
Set-GitHubLabel "type:feature" "New capability or enhancement request" "a2eeef"
Set-GitHubLabel "type:docs" "Documentation updates or improvements" "0075ca"
Set-GitHubLabel "type:question" "Request for information or clarification" "d876e3"
Set-GitHubLabel "type:enhancement" "Improvement to existing functionality" "84b6eb"
Set-GitHubLabel "bug-fix" "Pull request that fixes a bug" "d73a4a"
Set-GitHubLabel "refactor" "Code restructuring without changing functionality" "fbca04"
Set-GitHubLabel "dependencies" "Dependency updates or package management" "0366d6"

Write-Host ""
Write-Host "⚡ Creating Priority Labels..." -ForegroundColor Cyan
Set-GitHubLabel "priority:critical" "Critical priority - immediate attention required" "b60205"
Set-GitHubLabel "priority:high" "High priority - address in current sprint" "d93f0b"
Set-GitHubLabel "priority:medium" "Medium priority - schedule for upcoming sprint" "fbca04"
Set-GitHubLabel "priority:low" "Low priority - address when capacity allows" "0e8a16"

Write-Host ""
Write-Host "🎯 Creating Complexity Labels..." -ForegroundColor Cyan
Set-GitHubLabel "complexity:trivial" "Trivial complexity - quick fix or simple change" "c5def5"
Set-GitHubLabel "complexity:simple" "Simple complexity - straightforward implementation" "bfdadc"
Set-GitHubLabel "complexity:moderate" "Moderate complexity - requires planning and testing" "fef2c0"
Set-GitHubLabel "complexity:complex" "Complex - extensive design and implementation effort" "f9d0c4"

Write-Host ""
Write-Host "📍 Creating Area Labels..." -ForegroundColor Cyan
Set-GitHubLabel "area:vitepress" "VitePress documentation framework" "5319e7"
Set-GitHubLabel "area:documentation" "Documentation content and structure" "0075ca"
Set-GitHubLabel "area:infrastructure" "Infrastructure, deployment, and hosting" "1d76db"
Set-GitHubLabel "area:ci-cd" "CI/CD workflows and automation" "000000"
Set-GitHubLabel "area:mcp" "Model Context Protocol server integration" "7057ff"
Set-GitHubLabel "area:integrations" "Third-party integrations (Notion, Monday, etc.)" "0e8a16"
Set-GitHubLabel "area:auth" "Authentication and authorization" "d73a4a"
Set-GitHubLabel "area:database" "Database schema, queries, and data management" "c5def5"
Set-GitHubLabel "area:ui" "User interface components and styling" "e99695"
Set-GitHubLabel "area:api" "API routes and server actions" "fbca04"
Set-GitHubLabel "area:members" "Member management features" "1d76db"
Set-GitHubLabel "area:chapters" "Chapter management features" "5319e7"
Set-GitHubLabel "area:events" "Event coordination features" "0e8a16"
Set-GitHubLabel "area:finance" "Financial tracking and reporting" "d4c5f9"
Set-GitHubLabel "area:learning" "Learning resources and REBC workflows" "bfdadc"

Write-Host ""
Write-Host "📊 Creating Status Labels..." -ForegroundColor Cyan
Set-GitHubLabel "status:triage" "Awaiting triage and classification" "fbca04"
Set-GitHubLabel "status:ready" "Ready for development - fully specified" "0e8a16"
Set-GitHubLabel "status:in-progress" "Currently being worked on" "1d76db"
Set-GitHubLabel "status:blocked" "Blocked by external dependency or issue" "d93f0b"
Set-GitHubLabel "status:review" "Under review - awaiting feedback" "fbca04"
Set-GitHubLabel "status:needs-info" "Requires additional information" "d876e3"

Write-Host ""
Write-Host "🔒 Creating Security Labels..." -ForegroundColor Cyan
Set-GitHubLabel "security" "Security-related issue or enhancement" "b60205"
Set-GitHubLabel "security:critical" "Critical security vulnerability - immediate action required" "b60205"
Set-GitHubLabel "security:high" "High severity security issue" "d93f0b"
Set-GitHubLabel "security:medium" "Medium severity security concern" "fbca04"
Set-GitHubLabel "security:low" "Low severity security improvement" "0e8a16"
Set-GitHubLabel "vulnerability" "Known security vulnerability requiring remediation" "d73a4a"

Write-Host ""
Write-Host "♿ Creating Accessibility Labels..." -ForegroundColor Cyan
Set-GitHubLabel "accessibility" "Accessibility improvements for inclusive experience" "5319e7"
Set-GitHubLabel "a11y" "WCAG compliance and accessibility standards" "5319e7"
Set-GitHubLabel "wcag" "Web Content Accessibility Guidelines compliance" "0075ca"

Write-Host ""
Write-Host "📦 Creating Category Labels..." -ForegroundColor Cyan
Set-GitHubLabel "documentation" "Documentation changes and improvements" "0075ca"
Set-GitHubLabel "ci-cd" "Continuous integration and deployment workflows" "000000"
Set-GitHubLabel "configuration" "Configuration file changes" "fef2c0"
Set-GitHubLabel "components" "UI component updates" "e99695"
Set-GitHubLabel "assets" "Static assets (images, icons, media)" "bfd4f2"

Write-Host ""
Write-Host "🏷️  Creating Process Labels..." -ForegroundColor Cyan
Set-GitHubLabel "enhancement" "New feature or improvement" "a2eeef"
Set-GitHubLabel "stale" "No recent activity - may be closed if inactive" "ffffff"
Set-GitHubLabel "duplicate" "Duplicate of existing issue or PR" "cfd3d7"
Set-GitHubLabel "wontfix" "Will not be addressed - not aligned with roadmap" "ffffff"
Set-GitHubLabel "good first issue" "Suitable for new contributors" "7057ff"
Set-GitHubLabel "help wanted" "Community contributions welcome" "008672"
Set-GitHubLabel "breaking change" "Breaking change requiring major version bump" "b60205"

Write-Host ""
Write-Host "⚖️  Creating Compliance Labels..." -ForegroundColor Cyan
Set-GitHubLabel "license-compliance" "License compliance and attribution" "fbca04"
Set-GitHubLabel "gdpr" "GDPR compliance and data privacy" "0e8a16"
Set-GitHubLabel "pii" "Contains or relates to personally identifiable information" "d93f0b"

Write-Host ""
Write-Host "🤖 Creating Automation Labels..." -ForegroundColor Cyan
Set-GitHubLabel "automated" "Created or managed by automation" "ededed"
Set-GitHubLabel "bot" "Bot-generated content" "ededed"
Set-GitHubLabel "needs-review" "Requires manual review from maintainer" "fbca04"
Set-GitHubLabel "auto-merge" "Safe for automated merge" "0e8a16"

Write-Host ""
Write-Host "✅ All labels created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
$labelCount = (gh label list --json name | ConvertFrom-Json).Count
Write-Host "$labelCount labels established to streamline workflow management" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review labels in GitHub repository settings"
Write-Host "  2. Update .github/labeler.yml for auto-labeling"
Write-Host "  3. Configure CODEOWNERS for area-based assignments"
Write-Host "  4. Train team on label usage and conventions"
