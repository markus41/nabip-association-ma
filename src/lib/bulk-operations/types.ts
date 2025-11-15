/**
 * Bulk Operations Types
 *
 * Establishes scalable bulk operation patterns to streamline multi-chapter workflows.
 * Supports batch processing with progress tracking and error handling.
 *
 * Best for: Enterprise-grade bulk operations with safety checks and validation
 */

import type { Chapter } from '../types'

export type BulkOperationType = 'edit' | 'delete' | 'export' | 'email' | 'tag' | 'status'

export interface BulkOperation {
  type: BulkOperationType
  chapterIds: string[]
  payload?: Record<string, any>
  onProgress?: (current: number, total: number) => void
  onComplete?: (result: BulkOperationResult) => void
  onError?: (error: Error) => void
}

export interface BulkOperationResult {
  success: boolean
  successCount: number
  failureCount: number
  totalCount: number
  errors: BulkOperationError[]
  message: string
}

export interface BulkOperationError {
  chapterId: string
  chapterName: string
  error: string
}

export interface BulkEditOptions {
  fields: Record<string, any>
  strategy: 'replace' | 'append' | 'clear'
  validateFirst?: boolean
}

export interface BulkDeleteOptions {
  cascade?: boolean
  confirmationText?: string
}

export interface ImpactAnalysis {
  chaptersToDelete: number
  childChaptersAffected: number
  membersAffected: number
  eventsAffected: number
  warnings: string[]
}

// Editable chapter fields for bulk operations
export const BULK_EDITABLE_FIELDS = {
  // Basic info
  description: {
    key: 'description',
    label: 'Description',
    type: 'text',
    strategy: ['replace', 'clear']
  },
  websiteUrl: {
    key: 'websiteUrl',
    label: 'Website URL',
    type: 'url',
    strategy: ['replace', 'clear']
  },
  contactEmail: {
    key: 'contactEmail',
    label: 'Contact Email',
    type: 'email',
    strategy: ['replace', 'clear']
  },
  phone: {
    key: 'phone',
    label: 'Phone',
    type: 'tel',
    strategy: ['replace', 'clear']
  },
  president: {
    key: 'president',
    label: 'President',
    type: 'text',
    strategy: ['replace', 'clear']
  },
  meetingSchedule: {
    key: 'meetingSchedule',
    label: 'Meeting Schedule',
    type: 'text',
    strategy: ['replace', 'clear']
  },

  // Location
  region: {
    key: 'region',
    label: 'Region',
    type: 'text',
    strategy: ['replace', 'clear']
  },

  // Social media
  'socialMedia.facebook': {
    key: 'socialMedia.facebook',
    label: 'Facebook URL',
    type: 'url',
    strategy: ['replace', 'clear']
  },
  'socialMedia.twitter': {
    key: 'socialMedia.twitter',
    label: 'Twitter URL',
    type: 'url',
    strategy: ['replace', 'clear']
  },
  'socialMedia.linkedin': {
    key: 'socialMedia.linkedin',
    label: 'LinkedIn URL',
    type: 'url',
    strategy: ['replace', 'clear']
  }
} as const

export type BulkEditableField = keyof typeof BULK_EDITABLE_FIELDS
