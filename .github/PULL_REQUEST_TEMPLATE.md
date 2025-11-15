## Description

<!-- Provide a brief description of the changes in this PR -->

**💡 New Contributor?** Welcome! This repository follows structured development practices:
- **Setup**: Run `pnpm install` and configure `.env.local` with Supabase credentials
- **Development**: Use `pnpm dev` for local testing
- **Building**: Run `pnpm build` to validate production build
- **Standards**: Follow Conventional Commits and TypeScript best practices

See [CONTRIBUTING.md](../.github/CONTRIBUTING.md) for complete guidelines.

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] New feature (member management, events, reporting, learning, etc.)
- [ ] Bug fix (authentication, data display, navigation issues)
- [ ] UI/UX improvement (styling, responsiveness, accessibility)
- [ ] Performance optimization (load times, caching, queries)
- [ ] Documentation update (README, CLAUDE.md, code comments)
- [ ] Authentication/Authorization (Supabase auth flows)
- [ ] Database changes (Supabase schema, queries, migrations)
- [ ] Configuration change (Next.js config, environment variables)
- [ ] Refactoring (restructuring without changing functionality)
- [ ] Dependencies (package updates, dependency changes)

## Related Issues

<!-- Link related issues using #issue_number -->

Closes #
Related to #

## Changes Made

<!-- List the specific changes in this PR -->

-
-
-

## Documentation Updates

<!-- If this PR changes functionality, have you updated the documentation? -->

- [ ] Updated CLAUDE.md (if architecture/workflow changes)
- [ ] Updated README.md (if setup/deployment changes)
- [ ] Added/updated code comments following Brookside BI style
- [ ] Updated environment variable documentation
- [ ] No documentation updates needed

## Screenshots

<!-- If applicable, add screenshots showing the changes -->

### Before


### After


## Testing Checklist

<!-- Mark completed items with an "x" -->

**Development Testing**:
- [ ] Tested locally with `pnpm dev`
- [ ] Production build succeeds (`pnpm build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings

**Authentication Testing**:
- [ ] Login flow works correctly
- [ ] Logout works correctly
- [ ] Protected routes redirect properly
- [ ] Session persistence works
- [ ] Signup flow works (if modified)

**Functionality Testing**:
- [ ] All new features work as expected
- [ ] Existing features not broken
- [ ] Data displays correctly
- [ ] Forms validate properly
- [ ] Error states handled gracefully

**UI/UX Testing**:
- [ ] Checked responsiveness (mobile, tablet, desktop)
- [ ] Dark mode rendering verified
- [ ] Sidebar navigation works
- [ ] Dashboard widgets display correctly
- [ ] Charts/visualizations render properly (if applicable)

**Database Testing** (if applicable):
- [ ] Supabase queries execute correctly
- [ ] Data mutations work as expected
- [ ] No data loss or corruption
- [ ] Proper error handling for database operations

## Supabase Integration

<!-- For Supabase-related changes -->

- [ ] Used `lib/supabase/server.ts` in Server Components/Actions
- [ ] Used `lib/supabase/client.ts` in Client Components
- [ ] Proper authentication checks implemented
- [ ] Database queries optimized
- [ ] Error handling implemented
- [ ] TypeScript types match database schema

## Accessibility

- [ ] Proper heading hierarchy maintained
- [ ] Alt text provided for images
- [ ] Links have descriptive text
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works
- [ ] Form inputs have proper labels
- [ ] ARIA attributes used appropriately

## Deployment Considerations

<!-- Any special considerations for deployment? -->

- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Requires environment variable changes (document in PR description)
- [ ] Requires Supabase migration (document steps)
- [ ] May affect existing routes/URLs (document redirects needed)
- [ ] Compatible with v0.app sync workflow
- [ ] Vercel deployment will succeed

## Environment Variables

<!-- If you added/changed environment variables, list them here -->

New or modified environment variables:
```
# Example:
# NEXT_PUBLIC_NEW_FEATURE_FLAG=true
```

## Vercel Preview

<!-- The Vercel bot will add a preview link automatically -->

Preview URL: <!-- Will be added by Vercel -->

## Checklist

- [ ] My code follows Brookside BI brand voice and style guidelines
- [ ] I have performed a self-review of my own changes
- [ ] I have commented my code where necessary (business value first)
- [ ] My changes generate no new warnings or errors
- [ ] I have tested in both development and production builds
- [ ] I have updated the documentation (if needed)
- [ ] Authentication flows work correctly (if modified)
- [ ] UI is responsive and accessible
- [ ] Supabase integration follows SSR patterns (if applicable)

## Additional Notes

<!-- Any additional information reviewers should know -->
