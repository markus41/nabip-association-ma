/**
 * Bulk Operations Utilities
 *
 * Establishes scalable batch processing patterns to streamline multi-chapter workflows.
 * Implements batching (50 chapters at a time) with progress tracking and error recovery.
 *
 * Performance: Processes 50+ chapters without UI freeze via yielding to main thread
 * Best for: Large-scale chapter management operations with safety guarantees
 */

import type { Chapter } from '../types'
import type {
  BulkOperation,
  BulkOperationResult,
  BulkOperationError,
  BulkEditOptions,
  BulkDeleteOptions,
  ImpactAnalysis
} from './types'

export * from './types'

const BATCH_SIZE = 50
const YIELD_INTERVAL = 100 // ms between batches

/**
 * Execute bulk edit operation on multiple chapters
 * Processes in batches to avoid UI freeze
 */
export async function bulkEditChapters(
  chapters: Chapter[],
  chapterIds: string[],
  options: BulkEditOptions,
  onProgress?: (current: number, total: number) => void
): Promise<BulkOperationResult> {
  const errors: BulkOperationError[] = []
  const total = chapterIds.length
  let successCount = 0

  // Validate fields if requested
  if (options.validateFirst) {
    const validationErrors = validateBulkEdit(options.fields)
    if (validationErrors.length > 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: total,
        totalCount: total,
        errors: validationErrors.map(error => ({
          chapterId: '',
          chapterName: '',
          error
        })),
        message: 'Validation failed'
      }
    }
  }

  // Process in batches
  for (let i = 0; i < chapterIds.length; i += BATCH_SIZE) {
    const batch = chapterIds.slice(i, i + BATCH_SIZE)

    for (const chapterId of batch) {
      try {
        const chapter = chapters.find(c => c.id === chapterId)
        if (!chapter) {
          throw new Error('Chapter not found')
        }

        // Apply edits based on strategy
        applyBulkEdit(chapter, options.fields, options.strategy)
        successCount++
      } catch (error) {
        const chapter = chapters.find(c => c.id === chapterId)
        errors.push({
          chapterId,
          chapterName: chapter?.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Report progress
      onProgress?.(i + batch.indexOf(chapterId) + 1, total)
    }

    // Yield to main thread between batches
    if (i + BATCH_SIZE < chapterIds.length) {
      await new Promise(resolve => setTimeout(resolve, YIELD_INTERVAL))
    }
  }

  return {
    success: errors.length === 0,
    successCount,
    failureCount: errors.length,
    totalCount: total,
    errors,
    message: errors.length === 0
      ? `Successfully updated ${successCount} chapters`
      : `Updated ${successCount} chapters with ${errors.length} errors`
  }
}

/**
 * Apply bulk edit to a single chapter
 */
function applyBulkEdit(
  chapter: Chapter,
  fields: Record<string, any>,
  strategy: 'replace' | 'append' | 'clear'
): void {
  for (const [key, value] of Object.entries(fields)) {
    // Handle nested properties (e.g., socialMedia.facebook)
    const keys = key.split('.')

    if (keys.length === 1) {
      // Simple property
      if (strategy === 'clear') {
        (chapter as any)[key] = undefined
      } else {
        (chapter as any)[key] = value
      }
    } else {
      // Nested property
      let obj: any = chapter
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {}
        }
        obj = obj[keys[i]]
      }

      const finalKey = keys[keys.length - 1]
      if (strategy === 'clear') {
        obj[finalKey] = undefined
      } else {
        obj[finalKey] = value
      }
    }
  }
}

/**
 * Validate bulk edit fields
 */
function validateBulkEdit(fields: Record<string, any>): string[] {
  const errors: string[] = []

  for (const [key, value] of Object.entries(fields)) {
    // Validate URLs
    if (key.includes('Url') || key.includes('website')) {
      if (value && !isValidUrl(value)) {
        errors.push(`Invalid URL for ${key}: ${value}`)
      }
    }

    // Validate emails
    if (key.includes('email') || key.includes('Email')) {
      if (value && !isValidEmail(value)) {
        errors.push(`Invalid email for ${key}: ${value}`)
      }
    }
  }

  return errors
}

/**
 * Analyze impact of bulk delete operation
 */
export function analyzeBulkDeleteImpact(
  chapters: Chapter[],
  chapterIds: string[],
  members: { chapterId: string }[] = [],
  events: { chapterId: string }[] = []
): ImpactAnalysis {
  const warnings: string[] = []
  let childChaptersAffected = 0

  // Find child chapters
  const allChildChapterIds = new Set<string>()
  for (const chapterId of chapterIds) {
    const children = chapters.filter(c => c.parentChapterId === chapterId)
    childChaptersAffected += children.length
    children.forEach(child => allChildChapterIds.add(child.id))
  }

  if (childChaptersAffected > 0) {
    warnings.push(
      `${childChaptersAffected} child chapters will be orphaned. Consider enabling cascade delete.`
    )
  }

  // Count affected members
  const membersAffected = members.filter(m =>
    chapterIds.includes(m.chapterId) || allChildChapterIds.has(m.chapterId)
  ).length

  if (membersAffected > 0) {
    warnings.push(`${membersAffected} members will lose their chapter association.`)
  }

  // Count affected events
  const eventsAffected = events.filter(e =>
    chapterIds.includes(e.chapterId) || allChildChapterIds.has(e.chapterId)
  ).length

  if (eventsAffected > 0) {
    warnings.push(`${eventsAffected} events will lose their chapter association.`)
  }

  return {
    chaptersToDelete: chapterIds.length,
    childChaptersAffected,
    membersAffected,
    eventsAffected,
    warnings
  }
}

/**
 * Execute bulk delete operation
 */
export async function bulkDeleteChapters(
  chapters: Chapter[],
  chapterIds: string[],
  options: BulkDeleteOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<BulkOperationResult> {
  const errors: BulkOperationError[] = []
  const total = chapterIds.length
  let successCount = 0

  // Process in batches
  for (let i = 0; i < chapterIds.length; i += BATCH_SIZE) {
    const batch = chapterIds.slice(i, i + BATCH_SIZE)

    for (const chapterId of batch) {
      try {
        const chapter = chapters.find(c => c.id === chapterId)
        if (!chapter) {
          throw new Error('Chapter not found')
        }

        // Check for child chapters
        const hasChildren = chapters.some(c => c.parentChapterId === chapterId)
        if (hasChildren && !options.cascade) {
          throw new Error('Chapter has child chapters. Enable cascade delete to proceed.')
        }

        // Delete chapter (in real app, this would be a database operation)
        const index = chapters.findIndex(c => c.id === chapterId)
        if (index !== -1) {
          chapters.splice(index, 1)
          successCount++
        }

        // Cascade delete if enabled
        if (options.cascade) {
          const childrenToDelete = chapters.filter(c => c.parentChapterId === chapterId)
          for (const child of childrenToDelete) {
            const childIndex = chapters.findIndex(c => c.id === child.id)
            if (childIndex !== -1) {
              chapters.splice(childIndex, 1)
              successCount++
            }
          }
        }
      } catch (error) {
        const chapter = chapters.find(c => c.id === chapterId)
        errors.push({
          chapterId,
          chapterName: chapter?.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Report progress
      onProgress?.(i + batch.indexOf(chapterId) + 1, total)
    }

    // Yield to main thread between batches
    if (i + BATCH_SIZE < chapterIds.length) {
      await new Promise(resolve => setTimeout(resolve, YIELD_INTERVAL))
    }
  }

  return {
    success: errors.length === 0,
    successCount,
    failureCount: errors.length,
    totalCount: total,
    errors,
    message: errors.length === 0
      ? `Successfully deleted ${successCount} chapters`
      : `Deleted ${successCount} chapters with ${errors.length} errors`
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get formatted bulk operation summary
 */
export function formatBulkOperationSummary(result: BulkOperationResult): string {
  const lines: string[] = []

  lines.push(`Processed ${result.totalCount} chapters`)
  lines.push(`✓ ${result.successCount} successful`)

  if (result.failureCount > 0) {
    lines.push(`✗ ${result.failureCount} failed`)

    if (result.errors.length > 0) {
      lines.push('\nErrors:')
      result.errors.forEach(error => {
        lines.push(`  • ${error.chapterName}: ${error.error}`)
      })
    }
  }

  return lines.join('\n')
}
