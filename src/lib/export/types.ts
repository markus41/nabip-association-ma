/**
 * Export Types and Interfaces
 *
 * Establishes scalable export patterns that streamline data workflows across chapter management.
 * Supports CSV, Excel, and PDF export formats with comprehensive filtering and customization.
 *
 * Best for: Enterprise-grade data export functionality with multi-format support
 */

import type { Chapter, ChapterType } from '../types'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  columns: string[]
  filters?: ExportFilters
  includeChildChapters?: boolean
  flattenHierarchy?: boolean
  includeContactDetails?: boolean
  includeSocialMedia?: boolean
  fileName?: string
  timestamp?: boolean
}

export interface ExportFilters {
  types?: ChapterType[]
  states?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
}

export interface ExportProgress {
  current: number
  total: number
  percentage: number
  status: 'preparing' | 'processing' | 'complete' | 'error'
  message?: string
}

export interface ExportResult {
  success: boolean
  fileName: string
  rowCount: number
  error?: string
}

export interface ColumnDefinition {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'array' | 'object'
  format?: (value: any, chapter: Chapter) => string
  exportable?: boolean
  width?: number
}

// Available chapter columns for export
export const CHAPTER_COLUMNS: Record<string, ColumnDefinition> = {
  id: {
    key: 'id',
    label: 'ID',
    type: 'string',
    exportable: true,
    width: 100
  },
  name: {
    key: 'name',
    label: 'Name',
    type: 'string',
    exportable: true,
    width: 200
  },
  type: {
    key: 'type',
    label: 'Type',
    type: 'string',
    exportable: true,
    width: 100
  },
  parentChapterId: {
    key: 'parentChapterId',
    label: 'Parent Chapter ID',
    type: 'string',
    exportable: true,
    width: 150
  },
  state: {
    key: 'state',
    label: 'State',
    type: 'string',
    exportable: true,
    width: 100
  },
  city: {
    key: 'city',
    label: 'City',
    type: 'string',
    exportable: true,
    width: 150
  },
  region: {
    key: 'region',
    label: 'Region',
    type: 'string',
    exportable: true,
    width: 100
  },
  memberCount: {
    key: 'memberCount',
    label: 'Member Count',
    type: 'number',
    exportable: true,
    width: 120
  },
  activeEventsCount: {
    key: 'activeEventsCount',
    label: 'Active Events',
    type: 'number',
    exportable: true,
    width: 120
  },
  revenueShare: {
    key: 'revenueShare',
    label: 'Revenue Share',
    type: 'number',
    format: (value) => value ? `$${value.toLocaleString()}` : '',
    exportable: true,
    width: 120
  },
  websiteUrl: {
    key: 'websiteUrl',
    label: 'Website',
    type: 'string',
    exportable: true,
    width: 200
  },
  contactEmail: {
    key: 'contactEmail',
    label: 'Contact Email',
    type: 'string',
    exportable: true,
    width: 200
  },
  phone: {
    key: 'phone',
    label: 'Phone',
    type: 'string',
    exportable: true,
    width: 150
  },
  president: {
    key: 'president',
    label: 'President',
    type: 'string',
    exportable: true,
    width: 150
  },
  established: {
    key: 'established',
    label: 'Established',
    type: 'date',
    exportable: true,
    width: 120
  },
  description: {
    key: 'description',
    label: 'Description',
    type: 'string',
    exportable: true,
    width: 300
  },
  meetingSchedule: {
    key: 'meetingSchedule',
    label: 'Meeting Schedule',
    type: 'string',
    exportable: true,
    width: 200
  },
  facebook: {
    key: 'socialMedia.facebook',
    label: 'Facebook',
    type: 'string',
    format: (_, chapter) => chapter.socialMedia?.facebook || '',
    exportable: true,
    width: 200
  },
  twitter: {
    key: 'socialMedia.twitter',
    label: 'Twitter',
    type: 'string',
    format: (_, chapter) => chapter.socialMedia?.twitter || '',
    exportable: true,
    width: 200
  },
  linkedin: {
    key: 'socialMedia.linkedin',
    label: 'LinkedIn',
    type: 'string',
    format: (_, chapter) => chapter.socialMedia?.linkedin || '',
    exportable: true,
    width: 200
  },
  leadership: {
    key: 'leadership',
    label: 'Leadership Team',
    type: 'array',
    format: (_, chapter) => chapter.leadership?.map(l => `${l.name} (${l.role})`).join('; ') || '',
    exportable: true,
    width: 300
  }
}

// Preset column layouts
export const COLUMN_PRESETS = {
  minimal: ['name', 'type', 'memberCount', 'activeEventsCount'],
  contact: ['name', 'contactEmail', 'phone', 'president'],
  analytics: ['name', 'memberCount', 'activeEventsCount', 'revenueShare'],
  full: Object.keys(CHAPTER_COLUMNS)
}
