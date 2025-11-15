/**
 * Export Test Utilities
 *
 * Test and demonstrate export functionality with sample data.
 * Use this to verify CSV, Excel, and PDF export work correctly.
 *
 * Best for: Development testing, integration verification, demo data generation
 */

import type { Chapter } from '../types'
import { exportChapters } from './index'
import { COLUMN_PRESETS } from './types'

/**
 * Generate sample chapter data for testing
 */
export function generateSampleChapters(count: number = 10): Chapter[] {
  const chapters: Chapter[] = []
  const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']
  const cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Chicago']

  // National chapter
  chapters.push({
    id: 'nat-1',
    name: 'NABIP National',
    type: 'national',
    memberCount: 20000,
    activeEventsCount: 50,
    revenueShare: 5000000,
    websiteUrl: 'https://nabip.org',
    contactEmail: 'info@nabip.org',
    phone: '555-0100',
    president: 'John Smith',
    established: '1990-01-01',
    description: 'National Association of Benefits and Insurance Professionals',
    meetingSchedule: 'Annual conference in June',
    socialMedia: {
      facebook: 'https://facebook.com/nabip',
      twitter: 'https://twitter.com/nabip',
      linkedin: 'https://linkedin.com/company/nabip'
    },
    leadership: [
      {
        id: 'l1',
        name: 'John Smith',
        role: 'President',
        email: 'john@nabip.org',
        phone: '555-0101'
      },
      {
        id: 'l2',
        name: 'Jane Doe',
        role: 'Vice President',
        email: 'jane@nabip.org'
      }
    ]
  })

  // State chapters
  for (let i = 0; i < Math.min(count - 1, 10); i++) {
    const state = states[i]
    chapters.push({
      id: `state-${i + 1}`,
      name: `NABIP ${state}`,
      type: 'state',
      parentChapterId: 'nat-1',
      state,
      memberCount: Math.floor(Math.random() * 2000) + 500,
      activeEventsCount: Math.floor(Math.random() * 10) + 2,
      revenueShare: Math.floor(Math.random() * 500000) + 50000,
      websiteUrl: `https://nabip-${state.toLowerCase()}.org`,
      contactEmail: `info@nabip-${state.toLowerCase()}.org`,
      phone: `555-${String(i + 200).padStart(4, '0')}`,
      president: `President ${i + 1}`,
      established: `${1990 + i}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`,
      description: `State chapter for ${state}`,
      meetingSchedule: 'Monthly meetings',
      region: i % 2 === 0 ? 'East' : 'West',
      socialMedia: {
        facebook: `https://facebook.com/nabip-${state.toLowerCase()}`
      },
      leadership: [
        {
          id: `l-state-${i}-1`,
          name: `President ${i + 1}`,
          role: 'President',
          email: `president@nabip-${state.toLowerCase()}.org`
        }
      ]
    })
  }

  // Local chapters
  if (count > 11) {
    for (let i = 0; i < Math.min(count - 11, 20); i++) {
      const stateIndex = i % states.length
      const state = states[stateIndex]
      const city = cities[i % cities.length]

      chapters.push({
        id: `local-${i + 1}`,
        name: `NABIP ${city}`,
        type: 'local',
        parentChapterId: `state-${stateIndex + 1}`,
        state,
        city,
        memberCount: Math.floor(Math.random() * 200) + 50,
        activeEventsCount: Math.floor(Math.random() * 5) + 1,
        revenueShare: Math.floor(Math.random() * 50000) + 10000,
        websiteUrl: `https://nabip-${city.toLowerCase().replace(' ', '')}.org`,
        contactEmail: `info@nabip-${city.toLowerCase().replace(' ', '')}.org`,
        phone: `555-${String(i + 300).padStart(4, '0')}`,
        president: `Local President ${i + 1}`,
        established: `${2000 + i}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`,
        description: `Local chapter for ${city}, ${state}`,
        meetingSchedule: 'Bi-weekly meetings',
        region: stateIndex % 2 === 0 ? 'Northeast' : 'Southwest',
        leadership: [
          {
            id: `l-local-${i}-1`,
            name: `Local President ${i + 1}`,
            role: 'President',
            email: `president@nabip-${city.toLowerCase().replace(' ', '')}.org`
          }
        ]
      })
    }
  }

  return chapters
}

/**
 * Test CSV export with sample data
 */
export async function testCSVExport() {
  console.log('Testing CSV export...')

  const chapters = generateSampleChapters(25)

  const result = await exportChapters(chapters, {
    format: 'csv',
    columns: COLUMN_PRESETS.minimal,
    timestamp: true,
    fileName: 'test-chapters'
  })

  console.log('CSV Export Result:', result)
  return result
}

/**
 * Test Excel export with sample data
 */
export async function testExcelExport() {
  console.log('Testing Excel export...')

  const chapters = generateSampleChapters(25)

  const result = await exportChapters(chapters, {
    format: 'xlsx',
    columns: COLUMN_PRESETS.full,
    timestamp: true,
    fileName: 'test-chapters'
  })

  console.log('Excel Export Result:', result)
  return result
}

/**
 * Test PDF export with sample data
 */
export async function testPDFExport() {
  console.log('Testing PDF export...')

  const chapters = generateSampleChapters(25)

  const result = await exportChapters(chapters, {
    format: 'pdf',
    columns: COLUMN_PRESETS.analytics,
    timestamp: true,
    fileName: 'test-chapters'
  })

  console.log('PDF Export Result:', result)
  return result
}

/**
 * Test export with filters
 */
export async function testFilteredExport() {
  console.log('Testing filtered export...')

  const chapters = generateSampleChapters(50)

  const result = await exportChapters(chapters, {
    format: 'csv',
    columns: COLUMN_PRESETS.contact,
    filters: {
      types: ['state'],
      states: ['CA', 'TX', 'NY']
    },
    includeChildChapters: false,
    timestamp: true,
    fileName: 'filtered-chapters'
  })

  console.log('Filtered Export Result:', result)
  return result
}

/**
 * Test large dataset export (performance test)
 */
export async function testLargeExport() {
  console.log('Testing large dataset export (500+ chapters)...')

  const chapters = generateSampleChapters(500)

  const startTime = performance.now()

  const result = await exportChapters(chapters, {
    format: 'csv',
    columns: COLUMN_PRESETS.minimal,
    timestamp: true,
    fileName: 'large-export'
  })

  const endTime = performance.now()
  const duration = (endTime - startTime) / 1000

  console.log(`Large Export Result: ${result.rowCount} chapters in ${duration.toFixed(2)}s`)
  console.log(`Performance: ${(result.rowCount / duration).toFixed(0)} chapters/second`)

  return result
}

/**
 * Run all export tests
 */
export async function runAllExportTests() {
  console.log('Running all export tests...\n')

  const tests = [
    { name: 'CSV Export', fn: testCSVExport },
    { name: 'Excel Export', fn: testExcelExport },
    { name: 'PDF Export', fn: testPDFExport },
    { name: 'Filtered Export', fn: testFilteredExport },
    { name: 'Large Dataset Export', fn: testLargeExport }
  ]

  for (const test of tests) {
    console.log(`\n=== ${test.name} ===`)
    try {
      await test.fn()
      console.log(`✓ ${test.name} passed`)
    } catch (error) {
      console.error(`✗ ${test.name} failed:`, error)
    }
  }

  console.log('\n=== All tests complete ===')
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).exportTests = {
    testCSVExport,
    testExcelExport,
    testPDFExport,
    testFilteredExport,
    testLargeExport,
    runAllExportTests,
    generateSampleChapters
  }

  console.log('Export tests available via window.exportTests')
  console.log('Try: window.exportTests.runAllExportTests()')
}
