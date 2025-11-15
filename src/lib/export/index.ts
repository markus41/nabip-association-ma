/**
 * Export Utilities - Main Entry Point
 *
 * Establishes unified export interface that streamlines data accessibility across all formats.
 * Coordinates CSV, Excel, and PDF export with filtering, validation, and progress tracking.
 *
 * Best for: Centralized export logic with consistent filtering and validation
 */

import type { Chapter } from '../types'
import type { ExportOptions, ExportResult, ExportProgress } from './types'
import { exportChaptersToCSV } from './csv-exporter'
import { exportChaptersToExcel } from './excel-exporter'
import { exportChaptersToPDF } from './pdf-exporter'

export * from './types'
export * from './csv-exporter'
export * from './excel-exporter'
export * from './pdf-exporter'

/**
 * Main export function - orchestrates all export formats
 * Applies filters, validates options, and delegates to format-specific exporters
 */
export async function exportChapters(
  chapters: Chapter[],
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  try {
    // Report progress: preparing
    onProgress?.({
      current: 0,
      total: 100,
      percentage: 0,
      status: 'preparing',
      message: 'Preparing export...'
    })

    // Apply filters
    const filteredChapters = applyFilters(chapters, options)

    // Validate we have data to export
    if (filteredChapters.length === 0) {
      throw new Error('No chapters match the selected filters')
    }

    // Report progress: processing
    onProgress?.({
      current: 50,
      total: 100,
      percentage: 50,
      status: 'processing',
      message: `Exporting ${filteredChapters.length} chapters...`
    })

    // Delegate to format-specific exporter
    switch (options.format) {
      case 'csv':
        exportChaptersToCSV(filteredChapters, options)
        break

      case 'xlsx':
        exportChaptersToExcel(filteredChapters, options)
        break

      case 'pdf':
        exportChaptersToPDF(filteredChapters, options)
        break

      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }

    // Report progress: complete
    onProgress?.({
      current: 100,
      total: 100,
      percentage: 100,
      status: 'complete',
      message: 'Export complete'
    })

    // Generate result filename
    const fileName = generateResultFileName(options, filteredChapters.length)

    return {
      success: true,
      fileName,
      rowCount: filteredChapters.length
    }
  } catch (error) {
    // Report progress: error
    onProgress?.({
      current: 0,
      total: 100,
      percentage: 0,
      status: 'error',
      message: error instanceof Error ? error.message : 'Export failed'
    })

    return {
      success: false,
      fileName: '',
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Apply filters to chapter list
 */
function applyFilters(chapters: Chapter[], options: ExportOptions): Chapter[] {
  let filtered = [...chapters]

  const { filters } = options

  if (!filters) return filtered

  // Filter by chapter type
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter(c => filters.types!.includes(c.type))
  }

  // Filter by state
  if (filters.states && filters.states.length > 0) {
    filtered = filtered.filter(c => c.state && filters.states!.includes(c.state))
  }

  // Filter by date range (established date)
  if (filters.dateRange) {
    const { start, end } = filters.dateRange

    if (start) {
      filtered = filtered.filter(c => {
        if (!c.established) return false
        return c.established >= start
      })
    }

    if (end) {
      filtered = filtered.filter(c => {
        if (!c.established) return false
        return c.established <= end
      })
    }
  }

  // Handle child chapters
  if (!options.includeChildChapters) {
    // Only include top-level chapters (no parent)
    filtered = filtered.filter(c => !c.parentChapterId)
  }

  return filtered
}

/**
 * Generate result filename for export result
 */
function generateResultFileName(
  options: ExportOptions,
  rowCount: number
): string {
  const base = options.fileName || 'chapter-export'
  const timestamp = options.timestamp
    ? `-${new Date().toISOString().split('T')[0]}`
    : ''
  const count = `-${rowCount}-chapters`

  return `${base}${timestamp}${count}.${options.format}`
}

/**
 * Get available export formats
 */
export function getAvailableFormats() {
  return [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values (Excel compatible)' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel spreadsheet' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format' }
  ] as const
}

/**
 * Validate export options before processing
 */
export function validateExportOptions(options: Partial<ExportOptions>): string[] {
  const errors: string[] = []

  if (!options.format) {
    errors.push('Export format is required')
  }

  if (!options.columns || options.columns.length === 0) {
    errors.push('At least one column must be selected')
  }

  if (options.columns && options.columns.length > 20) {
    errors.push('Maximum 20 columns allowed for export')
  }

  return errors
}
