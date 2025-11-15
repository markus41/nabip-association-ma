# Check Documentation Links

Comprehensive link validation for all documentation.

## Task

Scan all documentation for broken, redirected, or problematic links:

### 1. Extract Links

- Scan all `docs/**/*.md` files
- Extract markdown links: `[text](url)`
- Extract HTML links: `<a href="url">`
- Extract image references: `![alt](image-path)`
- Extract link references: `[text]: url`

### 2. Categorize Links

Separate into categories:

- **Internal links**: Relative paths within docs/
- **Internal anchors**: Links to headings (#section)
- **External links**: HTTP/HTTPS URLs
- **Asset references**: Images, files in docs/public/
- **Repository links**: GitHub URLs to this repo

### 3. Validate Internal Links

- Check relative paths exist
- Verify files are in correct location
- Check for case sensitivity issues (important for GitHub Pages)
- Validate that linked files are not in .gitignore

### 4. Validate Anchors

- Extract all headings from target files
- Convert headings to URL slugs (lowercase, hyphens)
- Check anchor links match actual headings
- Flag broken fragment identifiers

### 5. Validate Assets

- Check images exist in `docs/public/`
- Verify paths are correct
- Check for orphaned assets (in public/ but not referenced)
- Validate file extensions

### 6. Validate External Links (Optional)

- Check HTTP status codes
- Identify redirects (301, 302)
- Flag 404 errors
- Flag timeout/unreachable URLs
- Respect rate limits
- Skip localhost, 127.0.0.1, example.com

### 7. Link Quality Analysis

- Flag bare URLs (should use link syntax)
- Check for "click here" or "read more" link text
- Identify deprecated URLs
- Flag HTTP links (suggest HTTPS)
- Check for link rot patterns

## Output Format

```markdown
## 🔗 Link Validation Report

**Scan Date**: YYYY-MM-DD HH:MM
**Files Scanned**: X
**Total Links**: Y

### Summary
- ✅ Valid Links: A (B%)
- ❌ Broken Links: C
- ⚠️ Redirects: D
- ℹ️ Warnings: E

### Link Health Score: X/100

---

### ❌ Broken Links (Priority: Critical)

| File | Line | Link | Type | Issue |
|------|------|------|------|-------|
| docs/guide/intro.md | 15 | /guide/missing.md | Internal | File not found |
| docs/architecture.md | 42 | #nonexistent | Anchor | Heading doesn't exist |
| docs/api/index.md | 8 | /public/img/missing.png | Asset | Image not found |

### ⚠️ Redirects (Update Recommended)

| File | Line | Current URL | Redirects To | Status |
|------|------|-------------|--------------|--------|
| docs/guide/setup.md | 25 | http://example.com/old | https://example.com/new | 301 |

### ℹ️ Warnings

| File | Line | Link | Issue | Suggestion |
|------|------|------|-------|------------|
| docs/intro.md | 10 | http://site.com | HTTP link | Use HTTPS |
| docs/guide.md | 5 | [click here](url) | Poor link text | Use descriptive text |

### 🗑️ Orphaned Assets

Assets in `docs/public/` not referenced anywhere:
- /public/images/old-logo.png
- /public/diagrams/unused-diagram.svg

### 📊 Link Statistics

**By Type**:
- Internal: X
- External: Y
- Assets: Z
- Anchors: A

**By File**:
| File | Total Links | Broken | Valid |
|------|-------------|--------|-------|
| docs/guide/intro.md | 15 | 0 | 15 |
| docs/architecture.md | 23 | 2 | 21 |

**External Domains** (Top 5):
- github.com: X links
- vitepress.dev: Y links
- example.com: Z links

### 🔧 Auto-Fix Available

These issues can be auto-fixed:
1. Update redirected URLs (D links)
2. Convert HTTP → HTTPS (E links)
3. Fix simple path issues (F links)

Run `/check-links --fix` to apply automatic fixes.

### ✅ Positive Findings
- All critical navigation links are valid
- No broken asset references
- Good link text usage (95%)
- Mostly HTTPS links

### 📋 Recommendations

**High Priority**:
1. Fix broken internal links in architecture.md
2. Update redirected external URLs
3. Remove or use orphaned assets

**Medium Priority**:
1. Convert HTTP links to HTTPS
2. Improve "click here" link text
3. Add alt text to images without it

**Low Priority**:
1. Consider caching external link checks
2. Set up automated link monitoring

---

**Next Steps**: Fix critical broken links before deployment
