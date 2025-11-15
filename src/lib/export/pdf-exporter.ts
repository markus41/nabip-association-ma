/**
 * PDF Exporter
 *
 * Establishes professional PDF report generation patterns with auto-pagination,
 * branded headers/footers, and structured table layouts.
 *
 * Features: Professional layout, auto-pagination, page numbers, timestamps
 * Best for: Stakeholder reports, board presentations, formal documentation
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Chapter } from '../types'
import type { ExportOptions } from './types'
import { CHAPTER_COLUMNS } from './types'

/**
 * Export chapters to PDF format with professional layout
 */
export function exportChaptersToPDF(
  chapters: Chapter[],
  options: ExportOptions
): void {
  const { columns, fileName, timestamp = true } = options

  // Create PDF document (portrait, letter size)
  const doc = new jsPDF({
    orientation: 'landscape', // Better for tables with many columns
    unit: 'mm',
    format: 'a4'
  })

  // Add report header
  addReportHeader(doc, chapters.length)

  // Build table data
  const headers = columns.map(col => CHAPTER_COLUMNS[col]?.label || col)
  const rows = buildTableRows(chapters, columns)

  // Add table with auto-pagination
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [37, 99, 235], // Blue-600
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Gray-50
    },
    columnStyles: buildColumnStyles(columns),
    didDrawPage: (data) => {
      addPageFooter(doc, data.pageNumber)
    }
  })

  // Generate filename
  const finalFileName = generateFileName(fileName, timestamp, chapters.length)

  // Save PDF
  doc.save(finalFileName)
}

/**
 * Add report header with title and metadata
 */
function addReportHeader(doc: jsPDF, chapterCount: number): void {
  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('NABIP Chapter Export Report', 14, 15)

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
  doc.text(`Total Chapters: ${chapterCount}`, 14, 28)

  // Optional: Add logo placeholder
  // doc.text('[LOGO]', 260, 15)

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 32, 283, 32)
}

/**
 * Add page footer with page number and timestamp
 */
function addPageFooter(doc: jsPDF, pageNumber: number): void {
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(128, 128, 128)

  // Page number (centered)
  doc.text(
    `Page ${pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Export date (right-aligned)
  doc.text(
    `Exported: ${new Date().toLocaleDateString()}`,
    pageWidth - 14,
    pageHeight - 10,
    { align: 'right' }
  )

  // Reset color
  doc.setTextColor(0, 0, 0)
}

/**
 * Build table rows from chapters
 */
function buildTableRows(chapters: Chapter[], columns: string[]): any[][] {
  return chapters.map(chapter => {
    return columns.map(col => {
      const columnDef = CHAPTER_COLUMNS[col]
      if (!columnDef) return ''

      // Use custom formatter if available
      if (columnDef.format) {
        return columnDef.format(null, chapter)
      }

      // Extract value
      const value = getNestedValue(chapter, col)
      return formatPDFValue(value, columnDef.type)
    })
  })
}

/**
 * Build column styles for better table formatting
 */
function buildColumnStyles(columns: string[]): Record<number, any> {
  const styles: Record<number, any> = {}

  columns.forEach((col, index) => {
    const columnDef = CHAPTER_COLUMNS[col]
    if (!columnDef) return

    // Set alignment based on type
    if (columnDef.type === 'number') {
      styles[index] = { halign: 'right' }
    }
  })

  return styles
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
 * Format value for PDF display
 */
function formatPDFValue(value: any, type: string): string {
  if (value == null || value === undefined) return ''

  switch (type) {
    case 'number':
      return String(value)

    case 'date':
      return value instanceof Date
        ? value.toLocaleDateString()
        : String(value)

    case 'array':
      if (Array.isArray(value)) {
        // Truncate long arrays for PDF
        return value.length > 3
          ? `${value.slice(0, 3).join(', ')}... (+${value.length - 3} more)`
          : value.join(', ')
      }
      return String(value)

    case 'object':
      return typeof value === 'object' ? JSON.stringify(value) : String(value)

    default:
      // Truncate very long strings for PDF
      const stringValue = String(value)
      return stringValue.length > 50
        ? `${stringValue.substring(0, 47)}...`
        : stringValue
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

  return `${base}${timestamp}${count}.pdf`
}
