/**
 * MemberPortalLoginSkeleton Component
 *
 * Establish loading state representation that matches the final login form layout.
 * Provides visual continuity during authentication service initialization.
 *
 * Best for: Async loading scenarios where authentication services require
 * network requests or configuration before rendering the login form
 *
 * @module MemberPortalLoginSkeleton
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * Props interface for MemberPortalLoginSkeleton component
 */
export interface MemberPortalLoginSkeletonProps {
  /**
   * Optional CSS class name for container customization
   */
  className?: string
}

/**
 * MemberPortalLoginSkeleton Component
 *
 * Loading state component that matches the structure and layout of
 * MemberPortalLogin to provide seamless visual transitions.
 */
export function MemberPortalLoginSkeleton({ className }: MemberPortalLoginSkeletonProps) {
  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <Card className="shadow-lg">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={24} weight="duotone" className="text-primary" />
          </div>
          <CardTitle className="text-2xl">Member Portal Login</CardTitle>
          <CardDescription>
            Access your NABIP membership account securely
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-5">
            {/* Email Input Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <Skeleton className="h-9 w-full" /> {/* Input */}
            </div>

            {/* Password Input Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" /> {/* Label */}
              <Skeleton className="h-9 w-full" /> {/* Input */}
            </div>

            {/* Remember Me and Forgot Password Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" /> {/* Checkbox */}
                <Skeleton className="h-4 w-24" /> {/* Label */}
              </div>
              <Skeleton className="h-4 w-28" /> {/* Forgot Password Link */}
            </div>

            {/* Submit Button Skeleton */}
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Help Text Skeleton */}
          <div className="mt-6 flex justify-center">
            <Skeleton className="h-4 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
