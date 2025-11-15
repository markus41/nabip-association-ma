/**
 * Excel Exporter
 *
 * Establishes professional Excel export patterns with formatted headers, multiple sheets,
 * and auto-sized columns to improve data accessibility across enterprise operations.
 *
 * Features: Multiple sheets, formatted headers, auto-width columns, frozen header row
 * Best for: Professional reports, data analysis, stakeholder presentations
 */

import * as XLSX from 'xlsx'
import type { Chapter, ChapterLeader } from '../types'
import type { ExportOptions } from './types'
import { CHAPTER_COLUMNS } from './types'

/**
 * Export chapters to Excel format with multiple sheets and formatting
 */
export function exportChaptersToExcel(
  chapters: Chapter[],
  options: ExportOptions
): void {
  const { columns, fileName, timestamp = true } = options

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Add main chapters sheet
  addChaptersSheet(workbook, chapters, columns)

  // Add leadership sheet if leadership data exists
  if (chapters.some(c => c.leadership && c.leadership.length > 0)) {
    addLeadershipSheet(workbook, chapters)
  }

  // Add summary statistics sheet
  addSummarySheet(workbook, chapters)

  // Generate filename
  const finalFileName = generateFileName(fileName, timestamp, chapters.length)

  // Write file
  XLSX.writeFile(workbook, finalFileName)
}

/**
 * Add main chapters data sheet
 */
function addChaptersSheet(
  workbook: XLSX.WorkBook,
  chapters: Chapter[],
  columns: string[]
): void {
  // Build data array with headers
  const data: any[][] = []

  // Add headers
  const headers = columns.map(col => CHAPTER_COLUMNS[col]?.label || col)
  data.push(headers)

  // Add chapter rows
  for (const chapter of chapters) {
    const row = columns.map(col => {
      const columnDef = CHAPTER_COLUMNS[col]
      if (!columnDef) return ''

      // Use custom formatter if available
      if (columnDef.format) {
        return columnDef.format(null, chapter)
      }

      // Extract value
      const value = getNestedValue(chapter, col)
      return formatExcelValue(value, columnDef.type)
    })

    data.push(row)
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  // Set column widths
  const columnWidths = columns.map(col => ({
    wch: CHAPTER_COLUMNS[col]?.width ? CHAPTER_COLUMNS[col].width! / 8 : 15
  }))
  worksheet['!cols'] = columnWidths

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chapters')
}

/**
 * Add leadership team sheet
 */
function addLeadershipSheet(workbook: XLSX.WorkBook, chapters: Chapter[]): void {
  const data: any[][] = []

  // Headers
  data.push(['Chapter', 'Leader Name', 'Role', 'Email', 'Phone'])

  // Extract all leaders
  for (const chapter of chapters) {
    if (chapter.leadership) {
      for (const leader of chapter.leadership) {
        data.push([
          chapter.name,
          leader.name,
          leader.role,
          leader.email || '',
          leader.phone || ''
        ])
      }
    }
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Chapter
    { wch: 20 }, // Name
    { wch: 20 }, // Role
    { wch: 25 }, // Email
    { wch: 15 }  // Phone
  ]

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leadership Team')
}

/**
 * Add summary statistics sheet
 */
function addSummarySheet(workbook: XLSX.WorkBook, chapters: Chapter[]): void {
  const data: any[][] = []

  // Calculate statistics
  const totalChapters = chapters.length
  const nationalChapters = chapters.filter(c => c.type === 'national').length
  const stateChapters = chapters.filter(c => c.type === 'state').length
  const localChapters = chapters.filter(c => c.type === 'local').length
  const totalMembers = chapters.reduce((sum, c) => sum + c.memberCount, 0)
  const totalEvents = chapters.reduce((sum, c) => sum + c.activeEventsCount, 0)
  const totalRevenue = chapters.reduce((sum, c) => sum + (c.revenueShare || 0), 0)

  // Build summary
  data.push(['Chapter Export Summary'])
  data.push([]) // Empty row
  data.push(['Generated:', new Date().toLocaleString()])
  data.push(['Total Chapters:', totalChapters])
  data.push([])
  data.push(['Breakdown by Type:'])
  data.push(['National Chapters:', nationalChapters])
  data.push(['State Chapters:', stateChapters])
  data.push(['Local Chapters:', localChapters])
  data.push([])
  data.push(['Aggregate Metrics:'])
  data.push(['Total Members:', totalMembers])
  data.push(['Total Active Events:', totalEvents])
  data.push(['Total Revenue Share:', `$${totalRevenue.toLocaleString()}`])
  data.push([])
  data.push(['Average Members per Chapter:', Math.round(totalMembers / totalChapters)])
  data.push(['Average Events per Chapter:', (totalEvents / totalChapters).toFixed(1)])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  // Set column widths
  worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary')
}

/**
 * Extract nested property value from object
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value == null) return undefined
    value = value[key]
  }

  return value
}

/**
 * Format value for Excel based on type
 */
function formatExcelValue(value: any, type: string): any {
  if (value == null || value === undefined) return ''

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0

    case 'date':
      return value instanceof Date ? value : new Date(value)

    case 'array':
      return Array.isArray(value) ? value.join('; ') : String(value)

    case 'object':
      return typeof value === 'object' ? JSON.stringify(value) : String(value)

    default:
      return String(value)
  }
}

/**
 * Generate filename with timestamp and metadata
 */
function generateFileName(
  baseName: string | undefined,
  includeTimestamp: boolean,
  rowCount: number
): string {
  const base = baseName || 'chapter-export'
  const timestamp = includeTimestamp
    ? `-${new Date().toISOString().split('T')[0]}`
    : ''
  const count = `-${rowCount}-chapters`

  return `${base}${timestamp}${count}.xlsx`
}
