/**
 * Excel Exporter (Demo Mode)
 *
 * This is a stub implementation for the demo. In production, this would use xlsx
 * for professional Excel export with formatted headers and multiple sheets.
 *
 * Features: Multiple sheets, formatted headers, auto-width columns, frozen header row
 * Best for: Professional reports, data analysis, stakeholder presentations
 */

import type { Chapter } from '../types'
import type { ExportOptions } from './types'

export function exportChaptersToExcel(
  chapters: Chapter[],
  options: ExportOptions
): void {
  console.warn('Excel export is not available in demo mode')
  alert('Excel export requires the xlsx package. This feature is disabled in demo mode.')
}
