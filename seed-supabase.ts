import {
  generateMembers,
  generateChapters,
  generateEvents,
  generateCourses,
  generateCampaigns,
  generateTransactions,
  generateEnrollments,
  generateReports
} from './src/lib/data-utils'

// Generate demo data
console.log('Generating demo data...')

const chapters = generateChapters()
const members = generateMembers(1000)
const events = generateEvents(50)
const courses = generateCourses(20)
const campaigns = generateCampaigns(15)
const transactions = generateTransactions(500)
const enrollments = generateEnrollments(200, courses.map(c => c.id))
const reports = generateReports(25)

// Helper function to escape SQL strings
function escapeSQLString(str: string | undefined): string {
  if (!str) return 'NULL'
  return `'${str.replace(/'/g, "''")}'`
}

// Helper to format UUID or generate SQL for UUID generation
function formatId(id: string): string {
  // Since we're using string IDs from the generator, we'll use gen_random_uuid() in Supabase
  // and track mapping separately, or we can use the id as a reference field
  return 'gen_random_uuid()'
}

console.log('=== CHAPTERS SQL ===')
console.log('-- Inserting National Chapter')
const nationalChapter = chapters.find(c => c.type === 'national')!
console.log(`
INSERT INTO chapters (
  name, type, parent_chapter_id, state, city, region,
  member_count, active_events_count, website_url, contact_email,
  phone, president, established, description, meeting_schedule
) VALUES (
  ${escapeSQLString(nationalChapter.name)},
  'national',
  NULL,
  NULL,
  NULL,
  ${escapeSQLString(nationalChapter.region)},
  ${nationalChapter.memberCount},
  ${nationalChapter.activeEventsCount},
  ${escapeSQLString(nationalChapter.websiteUrl)},
  ${escapeSQLString(nationalChapter.contactEmail)},
  ${escapeSQLString(nationalChapter.phone)},
  ${escapeSQLString(nationalChapter.president)},
  ${escapeSQLString(nationalChapter.established)},
  ${escapeSQLString(nationalChapter.description)},
  ${escapeSQLString(nationalChapter.meetingSchedule)}
) RETURNING id;
`)

console.log('\n-- Inserting State Chapters')
const stateChapters = chapters.filter(c => c.type === 'state')
stateChapters.slice(0, 5).forEach(chapter => {
  console.log(`
-- ${chapter.name}
INSERT INTO chapters (
  name, type, parent_chapter_id, state, city, region,
  member_count, active_events_count, website_url, contact_email,
  phone, president, established, description, meeting_schedule
) VALUES (
  ${escapeSQLString(chapter.name)},
  'state',
  (SELECT id FROM chapters WHERE type = 'national' LIMIT 1),
  ${escapeSQLString(chapter.state)},
  NULL,
  ${escapeSQLString(chapter.region)},
  ${chapter.memberCount},
  ${chapter.activeEventsCount},
  ${escapeSQLString(chapter.websiteUrl)},
  ${escapeSQLString(chapter.contactEmail)},
  ${escapeSQLString(chapter.phone)},
  ${escapeSQLString(chapter.president)},
  ${escapeSQLString(chapter.established)},
  ${escapeSQLString(chapter.description)},
  ${escapeSQLString(chapter.meetingSchedule)}
);
`)
})

console.log('\n=== MEMBERS SQL (Sample) ===')
members.slice(0, 10).forEach(member => {
  console.log(`
INSERT INTO members (
  email, first_name, last_name, member_type, status,
  joined_date, expiry_date, phone, company, job_title,
  engagement_score
) VALUES (
  ${escapeSQLString(member.email)},
  ${escapeSQLString(member.firstName)},
  ${escapeSQLString(member.lastName)},
  '${member.memberType}',
  '${member.status}',
  ${escapeSQLString(member.joinedDate)},
  ${escapeSQLString(member.expiryDate)},
  ${escapeSQLString(member.phone)},
  ${escapeSQLString(member.company)},
  ${escapeSQLString(member.jobTitle)},
  ${member.engagementScore}
);
`)
})

console.log('\n=== Summary ===')
console.log(`Chapters: ${chapters.length} (1 national, ${stateChapters.length} state, ${chapters.length - stateChapters.length - 1} local)`)
console.log(`Members: ${members.length}`)
console.log(`Events: ${events.length}`)
console.log(`Courses: ${courses.length}`)
console.log(`Campaigns: ${campaigns.length}`)
console.log(`Transactions: ${transactions.length}`)
console.log(`Enrollments: ${enrollments.length}`)
console.log(`Reports: ${reports.length}`)
