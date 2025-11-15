# Contributing to NABIP Association Management

Thank you for your interest in contributing to the NABIP Association Management platform! We welcome contributions from the community to help improve our platform.

## 🚀 Quick Start

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/YOUR_ORG/nabip-association-ma.git
cd nabip-association-ma

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser (Vite default port).

## 📋 Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)

## 🎯 Ways to Contribute

### Code

- **Fix bugs** - Help resolve issues in the application
- **Add features** - Implement new functionality for member management, events, or reporting
- **Improve UI/UX** - Enhance the user interface and experience
- **Optimize performance** - Improve load times and responsiveness
- **Write tests** - Add unit, integration, or end-to-end tests

### Documentation

- **Update documentation** - Keep CLAUDE.md and README.md current
- **Add code examples** - Provide practical examples for common tasks
- **Improve onboarding** - Make it easier for new contributors to get started
- **Document workflows** - Explain business processes and data flows

### Infrastructure

- **Improve CI/CD** - Enhance automation workflows
- **Add tests** - Improve test coverage and reliability
- **Enhance integrations** - Improve Supabase, Vercel, or v0.app workflows
- **Optimize builds** - Improve build times and deployment processes

### Community

- **Answer questions** - Help others in GitHub Discussions
- **Review pull requests** - Provide feedback on contributions
- **Report bugs** - Help identify issues in the application
- **Share feedback** - Suggest improvements and new features

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher
- **npm**: Latest version (npm install -g npm)
- **Git**: For version control
- **Text Editor**: VS Code recommended (with TypeScript and Tailwind CSS extensions)
- **Supabase Account**: For authentication and database features

### First-Time Setup

1. **Fork the repository**

   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/ams-alpha-1.2.git
   cd ams-alpha-1.2
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start development server**

   ```bash
   npm dev
   ```

   Open http://localhost:3000 in your browser.

### Environment Configuration

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

See the [CLAUDE.md](../CLAUDE.md) file for complete environment setup instructions.

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Create a feature branch
git checkout -b feat/add-member-export

# Or a fix branch
git checkout -b fix/authentication-redirect
```

**Branch Naming Convention**:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `style/` - UI/styling changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks
- `perf/` - Performance improvements

### 2. Make Changes

#### Working with Vite & React

- Server Components by default (no 'use client')
- Client Components only when needed (interactivity, hooks, browser APIs)
- Use Server Actions for data mutations
- Follow the existing route group structure

#### Working with Supabase

- Use `lib/supabase/server.ts` in Server Components and Server Actions
- Use `lib/supabase/client.ts` in Client Components
- Follow the SSR authentication patterns
- Test authentication flows thoroughly

#### Working with UI Components

- Use shadcn/ui components from `components/ui/`
- Follow Tailwind CSS patterns
- Ensure responsive design (mobile, tablet, desktop)
- Test dark mode compatibility

### 3. Test Your Changes

```bash
# Run development server
npm dev

# Build for production
npm build

# Run linting
npm lint

# Run type checking
npm type-check  # if configured
```

### 4. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git add .
git commit -m "feat(members): add CSV export functionality"
git commit -m "fix(auth): resolve redirect loop on login"
git commit -m "docs: update contributing guidelines"
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Formatting, styling changes
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `perf` - Performance improvements

**Commit Message Format** (Brookside BI Style):
```
feat(members): Streamline member export with CSV download capability

Establish scalable export functionality to support multi-department reporting needs.
Designed for organizations managing large member databases across multiple chapters.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 5. Push and Create Pull Request

```bash
# Push your branch
git push origin feat/add-member-export

# Create pull request on GitHub
```

See [Pull Request Process](#pull-request-process) for details.

## 📝 Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Define proper types for props, state, and API responses
- Avoid `any` types - use `unknown` if type is truly unknown
- Use **type inference** where possible
- Add JSDoc comments for public APIs

Example:
```typescript
/**
 * Establish member data retrieval to support scalable reporting across chapters.
 *
 * Best for: Organizations managing multi-chapter member databases
 *
 * @param chapterId - Unique identifier for the chapter
 * @returns Promise resolving to member data array
 */
export async function getMembersByChapter(chapterId: string): Promise<Member[]> {
  // Implementation
}
```

### React/Vite

- Use **functional components** with TypeScript
- Leverage **React 19** features appropriately
- Follow **component-based** architecture patterns
- Use proper **loading** and **error** states
- Implement **accessibility** (ARIA labels, keyboard navigation, semantic HTML)

### Tailwind CSS

- Use **Tailwind utility classes**
- Follow existing design system patterns
- Ensure **responsive design** (mobile-first)
- Test **dark mode** compatibility
- Use CSS variables from theme

### Supabase

- Use **Server Client** for Server Components/Actions
- Use **Browser Client** for Client Components
- Handle **authentication** properly
- Implement **proper error handling**
- Use **TypeScript types** for database schemas

### Brand Voice (Brookside BI)

Follow Brookside BI brand guidelines in code comments:

```typescript
// ❌ Avoid
// Initialize database connection

// ✅ Prefer
// Establish scalable data access layer to support multi-team operations
```

See [CLAUDE.md](../CLAUDE.md#writing-style-brookside-bi-brand-voice) for complete guidelines.

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] Application builds successfully (`npm build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Authentication flows work correctly
- [ ] UI is responsive and accessible
- [ ] Documentation is updated (if needed)
- [ ] Commit messages follow Conventional Commits
- [ ] Branch is up to date with `main`
- [ ] No secrets or credentials committed

### Creating a Pull Request

1. **Push your branch** to your fork
2. **Navigate to the repository** on GitHub
3. **Click "New Pull Request"**
4. **Fill out the template** completely
5. **Link related issues** (e.g., "Closes #123")
6. **Request review** from maintainers

### PR Title Format

Follow Conventional Commits:

```
feat(members): Streamline member export with CSV download
fix(auth): Resolve redirect loop on login page
docs: Update contributing guidelines for Vite patterns
```

### What Happens Next

1. **Automated Checks** run (build, lint, type-check)
2. **Vercel Preview Deploy** - Review your changes live
3. **Maintainer Review** - We aim to review within 48 hours
4. **Address Feedback** - Make requested changes
5. **Approval & Merge** - Once approved, we'll merge your PR

### After Merge

- Your contribution will be included in the next deployment
- You'll be added to our contributors list
- Thank you for making NABIP AMS better! 🎉

**Deployment**: Production deployments are managed independently and can be triggered via:
- Vercel CLI: `vercel --prod`
- GitHub Actions workflows
- Your preferred CI/CD pipeline

## 📄 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** - Check if it's already reported
2. **Check discussions** - It might be a question, not a bug
3. **Test on latest version** - Ensure you're using the latest code

### Creating an Issue

We have templates for different types of issues:

- **🐛 Bug Report** - Application errors, broken features
- **✨ Feature Request** - New features or improvements
- **📚 Documentation Request** - Missing or incomplete docs
- **🔒 Security Issue** - Security vulnerabilities (see SECURITY.md)
- **⚡ Performance** - Performance issues
- **♿ Accessibility** - Accessibility improvements
- **❓ Question** - General questions

**Choose the appropriate template** and fill it out completely.

### Issue Etiquette

- Be respectful and constructive
- Provide as much detail as possible
- Include steps to reproduce (for bugs)
- Follow up on questions from maintainers
- Close the issue if resolved
- Thank contributors who help

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community discussions
- **Pull Requests** - Code and documentation contributions

### Getting Help

- **Documentation** - Check [CLAUDE.md](../CLAUDE.md) for project guidance
- **README** - See [README.md](../README.md) for overview
- **Discussions** - Ask questions in GitHub Discussions
- **Maintainers** - Tag maintainers in issues for urgent matters

## 🎓 Resources

### Documentation

- [CLAUDE.md](../CLAUDE.md) - Complete project documentation
- [README.md](../README.md) - Project overview
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)

### Tools & Technologies

- [React Documentation](https://react.dev/)
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Conventional Commits](https://www.conventionalcommits.org/)

## 📞 Contact

- **Email**: Consultations@BrooksideBI.com
- **Phone**: +1 209 487 2047

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to NABIP AMS!** Your contributions help organizations streamline association management and drive measurable outcomes across the benefits and insurance industry. 🚀
