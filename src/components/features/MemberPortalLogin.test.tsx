/**
 * MemberPortalLogin Component Test Suite
 *
 * Comprehensive tests validating accessibility compliance, user interactions,
 * form validation, and authentication workflows.
 *
 * Coverage Areas:
 * - WCAG 2.1 AA accessibility requirements
 * - Keyboard navigation and screen reader support
 * - Form validation and error handling
 * - Authentication state management
 * - User interaction patterns
 * - Loading and success states
 *
 * @module MemberPortalLogin.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberPortalLogin } from './MemberPortalLogin'
import type { Member } from '@/lib/types'

// ============================================================================
// Test Setup and Mocks
// ============================================================================

const mockMember: Member = {
  id: 'test-member-001',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  memberType: 'individual',
  status: 'active',
  chapterId: 'test-chapter',
  joinedDate: '2023-01-01',
  expiryDate: '2024-12-31',
  engagementScore: 85
}

const defaultProps = {
  onLoginSuccess: vi.fn(),
  onForgotPassword: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// Accessibility Tests (WCAG 2.1 AA Compliance)
// ============================================================================

describe('MemberPortalLogin - Accessibility', () => {
  it('should have proper heading hierarchy', () => {
    render(<MemberPortalLogin {...defaultProps} />)

    const heading = screen.getByRole('heading', { name: /member portal login/i })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('DIV') // CardTitle uses div with proper semantics
  })

  it('should have accessible form with proper labels', () => {
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)

    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should mark required fields with aria-required', () => {
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)

    expect(emailInput).toHaveAttribute('aria-required', 'true')
    expect(passwordInput).toHaveAttribute('aria-required', 'true')
  })

  it('should associate error messages with inputs via aria-describedby', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email address/i)
      const emailError = screen.getByText(/email address is required/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(emailInput).toHaveAttribute('aria-describedby')
      expect(emailError).toHaveAttribute('role', 'alert')
    })
  })

  it('should provide accessible button labels for show/hide password', () => {
    render(<MemberPortalLogin {...defaultProps} />)

    const toggleButton = screen.getByLabelText(/show password/i)
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('type', 'button')
  })

  it('should have accessible checkbox with proper label association', () => {
    render(<MemberPortalLogin {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox', { name: /remember me/i })
    expect(checkbox).toBeInTheDocument()
  })

  it('should announce loading state to screen readers', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPass123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/authenticating/i)).toBeInTheDocument()
    })
  })

  it('should announce success state with proper ARIA live region', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(mockMember)

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPass123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const successAlert = screen.getByRole('status')
      expect(successAlert).toHaveAttribute('aria-live', 'polite')
      expect(successAlert).toHaveTextContent(/authentication successful/i)
    })
  })
})

// ============================================================================
// Form Validation Tests
// ============================================================================

describe('MemberPortalLogin - Form Validation', () => {
  it('should show validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur

    // Submit to trigger validation
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('should validate password minimum length', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const passwordInput = screen.getByLabelText(/^password/i)
    await user.type(passwordInput, 'short')
    await user.tab()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('should clear validation errors when input is corrected', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Submit with empty email
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
    })

    // Correct the email
    await user.type(emailInput, 'valid@example.com')
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/email address is required/i)).not.toBeInTheDocument()
    })
  })

  it('should accept valid email and password', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(mockMember)

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'ValidPassword123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'ValidPassword123', false)
    })
  })
})

// ============================================================================
// User Interaction Tests
// ============================================================================

describe('MemberPortalLogin - User Interactions', () => {
  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement
    const toggleButton = screen.getByLabelText(/show password/i)

    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('should handle remember me checkbox', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(mockMember)

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    const checkbox = screen.getByRole('checkbox', { name: /remember me/i })
    await user.click(checkbox)

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'ValidPassword123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockAuth).toHaveBeenCalledWith('test@example.com', 'ValidPassword123', true)
    })
  })

  it('should handle forgot password click with valid email', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'test@example.com')

    const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i })
    await user.click(forgotPasswordButton)

    expect(defaultProps.onForgotPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('should show validation error when forgot password clicked without email', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const forgotPasswordButton = screen.getByRole('button', { name: /forgot password/i })
    await user.click(forgotPasswordButton)

    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument()
    })

    expect(defaultProps.onForgotPassword).not.toHaveBeenCalled()
  })

  it('should disable inputs during authentication', async () => {
    const user = userEvent.setup()
    const slowAuth = vi.fn(() => new Promise(resolve => setTimeout(() => resolve(mockMember), 1000)))

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={slowAuth}
      />
    )

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'ValidPassword123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeDisabled()
      expect(screen.getByLabelText(/^password/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /authenticating/i })).toBeDisabled()
    })
  })
})

// ============================================================================
// Authentication Flow Tests
// ============================================================================

describe('MemberPortalLogin - Authentication Flow', () => {
  it('should call onLoginSuccess after successful authentication', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(mockMember)

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'ValidPassword123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(defaultProps.onLoginSuccess).toHaveBeenCalledWith(mockMember)
    }, { timeout: 2000 })
  })

  it('should show error message on authentication failure', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(null)

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'WrongPassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toHaveTextContent(/invalid email or password/i)
    })

    expect(defaultProps.onLoginSuccess).not.toHaveBeenCalled()
  })

  it('should use custom error message when provided', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(null)
    const customMessage = 'Custom authentication error message'

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
        customErrorMessage={customMessage}
      />
    )

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'WrongPassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(customMessage)).toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockRejectedValue(new Error('Network error'))

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'ValidPassword123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to authentication service/i)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// Keyboard Navigation Tests
// ============================================================================

describe('MemberPortalLogin - Keyboard Navigation', () => {
  it('should support tab navigation through form fields', async () => {
    const user = userEvent.setup()
    render(<MemberPortalLogin {...defaultProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const checkbox = screen.getByRole('checkbox', { name: /remember me/i })
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/show password/i)).toHaveFocus()

    await user.tab()
    expect(checkbox).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /forgot password/i })).toHaveFocus()

    await user.tab()
    expect(submitButton).toHaveFocus()
  })

  it('should submit form on Enter key', async () => {
    const user = userEvent.setup()
    const mockAuth = vi.fn().mockResolvedValue(mockMember)

    render(
      <MemberPortalLogin
        {...defaultProps}
        authenticateUser={mockAuth}
      />
    )

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPassword123{Enter}')

    await waitFor(() => {
      expect(mockAuth).toHaveBeenCalled()
    })
  })
})
