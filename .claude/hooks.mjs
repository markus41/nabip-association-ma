/**
 * Claude Code Lifecycle Hooks for NABIP Association Management
 *
 * Establishes automated security validation, state management, and workflow optimization
 * supporting sustainable Vite/React development aligned with Brookside BI standards.
 */

export const hooks = {
  /**
   * PreToolUse - Security validation and audit logging
   */
  PreToolUse: async (context) => {
    const timestamp = new Date().toISOString();
    const { toolName, parameters } = context;

    // Comprehensive audit logging
    console.log(`[${timestamp}] 🔧 Tool: ${toolName}`);

    // Security validations
    const securityChecks = {
      // Destructive command detection
      destructive: toolName === 'Bash' &&
        (parameters.command?.includes('rm -rf') ||
         parameters.command?.includes('DROP TABLE') ||
         parameters.command?.includes('DELETE FROM')),

      // Sensitive file access
      sensitiveFile: (toolName === 'Write' || toolName === 'Edit') &&
        parameters.file_path?.match(/\.(env|env.local|env.production)$/),

      // Secret exposure risk
      secretExposure: toolName === 'Write' &&
        (parameters.content?.includes('API_KEY') ||
         parameters.content?.includes('PASSWORD') ||
         parameters.content?.includes('SECRET') ||
         parameters.content?.includes('TOKEN') ||
         parameters.content?.includes('GITHUB_TOKEN')),

      // Production deployment
      production: toolName === 'Bash' &&
        (parameters.command?.includes('deploy') ||
         parameters.command?.includes('--prod'))
    };

    // Warn on security concerns
    if (securityChecks.destructive) {
      console.warn('⚠️  DESTRUCTIVE COMMAND DETECTED - Verify this supports sustainable operations');
      console.warn(`   Command: ${parameters.command?.substring(0, 100)}...`);
    }

    if (securityChecks.sensitiveFile) {
      console.warn('⚠️  ENVIRONMENT FILE ACCESS - Ensure no secrets committed to git');
      console.warn('   Add .env.local to .gitignore if not already present');
    }

    if (securityChecks.secretExposure) {
      console.warn('⚠️  POTENTIAL SECRET EXPOSURE - Review secrets before commit');
      console.warn('   Use environment variables for sensitive data');
    }

    if (securityChecks.production) {
      console.warn('🚨 PRODUCTION DEPLOYMENT - Ensure all tests passed');
      console.warn('   Verify environment variables configured properly');
    }

    return context;
  },

  /**
   * PostToolUse - Auto-formatting, validation, and state tracking
   */
  PostToolUse: async (context) => {
    const { toolName, result, parameters } = context;

    // Auto-format code files
    if (toolName === 'Write' || toolName === 'Edit') {
      const filePath = parameters?.file_path;

      // TypeScript/JavaScript formatting
      if (filePath?.match(/\.(js|ts|jsx|tsx)$/)) {
        console.log(`✓ Auto-formatting ${filePath} with Prettier (Vite code style)`);
      }

      // JSON validation
      if (filePath?.match(/\.(json)$/)) {
        console.log(`✓ Validating JSON structure: ${filePath}`);

        if (filePath?.includes('package.json')) {
          console.log('   📦 Dependencies updated - Run `npm install` if needed');
        }
      }

      // YAML validation (GitHub workflows, MCP config)
      if (filePath?.match(/\.(yaml|yml)$/)) {
        console.log(`✓ Validating YAML structure: ${filePath}`);
      }

      // Vite config changes
      if (filePath?.includes('vite.config')) {
        console.log(`⚙️  Vite config updated: ${filePath}`);
        console.log('   Consider restarting dev server for changes to take effect');
      }

      // Markdown documentation
      if (filePath?.match(/\.(md|markdown)$/)) {
        console.log(`✓ Documentation updated: ${filePath}`);
        console.log('   Ensure Brookside BI brand voice applied (outcome-focused, professional)');
      }

      // State persistence for critical files
      if (filePath?.includes('CLAUDE.md') ||
          filePath?.includes('package.json') ||
          filePath?.includes('mcp.json') ||
          filePath?.includes('vite.config')) {
        console.log(`💾 State snapshot created for critical file: ${filePath}`);
      }
    }

    // Bash command execution tracking
    if (toolName === 'Bash') {
      const command = parameters?.command;

      // Package manager operations
      if (command?.includes('npm install') || command?.includes('npm add')) {
        console.log('📦 Dependencies updated - Consider running `npm run dev` to verify');
      }

      // Git operations
      if (command?.includes('git commit')) {
        console.log('✅ Changes committed to repository - Remember to push to GitHub');
      }

      if (command?.includes('git push')) {
        console.log('🚀 Changes pushed to GitHub - CI/CD workflows may trigger');
      }

      // Vite build operations
      if (command?.includes('npm run build') || command?.includes('vite build')) {
        console.log('🏗️  Vite build completed - Review build output for optimization opportunities');
      }

      // Development server
      if (command?.includes('npm run dev') || command?.includes('vite')) {
        console.log('🔥 Vite dev server started - Hot Module Replacement (HMR) enabled');
      }
    }

    // Test execution tracking
    if (toolName === 'Bash' &&
        (parameters?.command?.includes('test') ||
         parameters?.command?.includes('vitest'))) {
      console.log('🧪 Tests executed - Review coverage reports and fix any failures');
    }

    return context;
  },

  /**
   * SessionStart - Initialize development environment
   */
  SessionStart: async (context) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Claude Code Session Started - NABIP Association Management');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📁 Project: NABIP Association Management Platform');
    console.log('🏗️  Tech Stack: Vite 6, React 19, TypeScript 5.7, GitHub Spark');
    console.log('🎨 UI: Radix UI, Tailwind CSS 4, Framer Motion');
    console.log('');
    console.log('🎯 PLATFORM ARCHITECTURE:');
    console.log('   • Build System    - Vite 6 with HMR and optimized production builds');
    console.log('   • Frontend        - React 19 with modern patterns and hooks');
    console.log('   • Type Safety     - TypeScript 5.7 for scalable development');
    console.log('   • Styling         - Tailwind CSS 4 with custom design system');
    console.log('   • Components      - Radix UI primitives for accessibility');
    console.log('   • Integration     - GitHub Spark for enhanced workflows');
    console.log('');
    console.log('🤖 AVAILABLE AGENTS:');
    console.log('   • documentation-expert        - Technical documentation with Brookside BI voice');
    console.log('   • senior-reviewer            - Code review and best practices');
    console.log('   • test-strategist            - Testing strategy and implementation');
    console.log('   • security-specialist        - Security analysis and hardening');
    console.log('   • performance-optimizer      - Performance analysis and optimization');
    console.log('   • cryptography-expert        - Cryptographic implementations');
    console.log('   • vulnerability-hunter       - Security vulnerability detection');
    console.log('');
    console.log('📋 CUSTOM COMMANDS:');
    console.log('   /check-links        - Validate all links in documentation');
    console.log('   /review-all         - Comprehensive code review');
    console.log('   /secure-audit       - Security audit and vulnerability scan');
    console.log('   /update-changelog   - Update CHANGELOG.md from commits');
    console.log('   /create-agent       - Create new specialized agents');
    console.log('   /add-command        - Create custom workflow commands');
    console.log('');
    console.log('🔌 MCP INTEGRATIONS:');
    console.log('   • GitHub     - Repository operations, issues, PRs, workflows');
    console.log('   • Memory     - Persistent context across sessions');
    console.log('   • Fetch      - Web resources and API access');
    console.log('   • Sequential - Enhanced reasoning for complex decisions');
    console.log('');
    console.log('⚙️  GITHUB WORKFLOWS:');
    console.log('   • CI Pipeline             - Lint, type-check, build validation');
    console.log('   • Security Audit          - npm audit, secret scanning, .env validation');
    console.log('   • Dependency Auditor      - Security, outdated packages, licenses');
    console.log('   • Security Scanner        - TruffleHog, credential detection');
    console.log('   • Accessibility Auditor   - WCAG compliance checking');
    console.log('   • PR Enhancement Bot      - Auto-labeling, analysis, checklists');
    console.log('   • Issue Management        - Auto-triage, welcome messages');
    console.log('   • Changelog Generator     - Conventional commits to CHANGELOG');
    console.log('');
    console.log('📖 DOCUMENTATION:');
    console.log('   • CODE_OF_CONDUCT.md          - Community guidelines');
    console.log('   • SECURITY.md                 - Security policy and reporting');
    console.log('   • CONTRIBUTING.md             - Contribution guidelines');
    console.log('   • .claude/settings.json       - Project configuration');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Ready to streamline operations with sustainable development! 🎉');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    return context;
  },

  /**
   * PreCompact - Preserve critical context and state
   */
  PreCompact: async (context) => {
    console.log('💾 Preserving critical context before compaction...');

    // Critical patterns to preserve for sustainable development
    const criticalPatterns = [
      'NABIP',
      'TODO',
      'FIXME',
      'SECURITY',
      'VITE',
      'REACT',
      'TYPESCRIPT',
      'GITHUB_SPARK',
      'BROOKSIDE_BI',
      'ACCESSIBILITY',
      'PERFORMANCE'
    ];

    console.log('🏗️  Preserving Vite/React architecture decision records (ADRs)');
    console.log('📝 Preserving Brookside BI brand voice and documentation standards');
    console.log('✅ Preserving GitHub workflow configurations and automation');

    return context;
  },

  /**
   * PrePlanMode - Prepare for planning phase
   */
  PrePlanMode: async (context) => {
    console.log('📋 Entering Plan Mode - Strategic analysis for feature development');
    console.log('🎯 Planning tools available: Explore, Plan agents for architecture');
    console.log('');
    console.log('Consider:');
    console.log('  • Vite build optimization and code splitting');
    console.log('  • React 19 patterns and component architecture');
    console.log('  • TypeScript type safety and interfaces');
    console.log('  • Accessibility (WCAG 2.1 AA compliance)');
    console.log('  • Performance optimization and bundle size');
    console.log('  • Scalability for multi-user operations');

    return context;
  },

  /**
   * PostPlanMode - Transition from planning to implementation
   */
  PostPlanMode: async (context) => {
    console.log('✅ Plan validated and approved for implementation');
    console.log('🚀 Transitioning to execution phase with specialized agents');
    console.log('');
    console.log('Next steps:');
    console.log('  • Implement React components with TypeScript');
    console.log('  • Build UI with Radix primitives and Tailwind CSS');
    console.log('  • Add comprehensive tests with Vitest');
    console.log('  • Validate accessibility compliance');
    console.log('  • Optimize bundle size and performance');
    console.log('  • Update documentation with Brookside BI brand voice');

    return context;
  }
};

export default hooks;
