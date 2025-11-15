---
name: event-management
description: Guides event lifecycle implementation including registration, capacity management, waitlists, QR code check-in, virtual/hybrid events, and post-event analytics for NABIP conferences, webinars, workshops, and networking events. Use when building event creation workflows, attendee management, or event performance tracking.
---

# Event Management

Streamline event operations to improve attendee experience and drive measurable outcomes across in-person, virtual, and hybrid NABIP events.

## When to Use

Activate this skill when:
- Creating event registration workflows
- Implementing capacity and waitlist management
- Building QR code check-in systems
- Designing virtual/hybrid event support
- Creating multi-tier pricing (early bird, member, non-member)
- Implementing post-event analytics and feedback
- Working on event calendar and scheduling
- Building event communication workflows (confirmations, reminders)

## Event Types

### NABIP Event Categories
1. **Conferences**: Multi-day, large-scale events (500+ attendees)
2. **Webinars**: Online-only educational sessions (100-300 attendees)
3. **Workshops**: Hands-on training sessions (25-75 attendees)
4. **Networking**: Social and professional connection events (50-200 attendees)
5. **Chapter Meetings**: Local/state gatherings (15-50 attendees)

## Event Lifecycle States

```
draft → published → registration_open → registration_closed → in_progress → completed → archived
```

### State Transition Rules

1. **draft → published**: Event details finalized, ready for announcement
2. **published → registration_open**: Registration portal activated
3. **registration_open → registration_closed**: Registration deadline reached OR capacity filled
4. **registration_closed → in_progress**: Event start date/time reached
5. **in_progress → completed**: Event end date/time reached
6. **completed → archived**: Post-event tasks finished (30 days after completion)

## Event Data Model

```typescript
interface Event {
  id: string
  title: string
  description: string
  eventType: "conference" | "webinar" | "workshop" | "networking" | "chapter_meeting"
  deliveryMode: "in_person" | "virtual" | "hybrid"
  status: "draft" | "published" | "registration_open" | "registration_closed" | "in_progress" | "completed" | "archived"

  // Scheduling
  startDate: Date
  endDate: Date
  timezone: string
  registrationOpenDate: Date
  registrationCloseDate: Date

  // Capacity
  capacity: number
  currentRegistrations: number
  waitlistEnabled: boolean
  waitlistCapacity?: number

  // Location (for in-person/hybrid)
  venueName?: string
  venueAddress?: string
  venueCity?: string
  venueState?: string
  venueZip?: string

  // Virtual (for virtual/hybrid)
  virtualPlatform?: "zoom" | "teams" | "webex" | "custom"
  virtualMeetingUrl?: string
  virtualAccessCode?: string

  // Pricing
  pricingTiers: EventPricingTier[]

  // Organizer
  organizerId: string
  chapterId: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

interface EventPricingTier {
  id: string
  eventId: string
  name: string // "Early Bird", "Member", "Non-Member", "Student"
  price: number
  currency: string
  validFrom?: Date
  validUntil?: Date
  memberTypesEligible?: string[] // ["national", "state", "local"]
  maxQuantity?: number
}

interface EventRegistration {
  id: string
  eventId: string
  memberId: string
  status: "pending" | "confirmed" | "cancelled" | "waitlisted" | "attended" | "no_show"
  pricingTierId: string
  amountPaid: number
  paymentStatus: "pending" | "completed" | "refunded" | "failed"
  registrationDate: Date
  cancellationDate?: Date
  checkInTime?: Date
  checkInMethod?: "qr_code" | "manual" | "self_service"

  // Attendee info (for non-members)
  guestName?: string
  guestEmail?: string
  guestPhone?: string

  // Dietary/accessibility
  dietaryRequirements?: string
  accessibilityNeeds?: string
  specialRequests?: string
}
```

## Registration Workflow

### Event Registration Process

```typescript
async function registerForEvent(
  eventId: string,
  memberId: string,
  pricingTierId: string,
  additionalInfo?: {
    dietaryRequirements?: string
    accessibilityNeeds?: string
    specialRequests?: string
  }
) {
  // Step 1: Validate event availability
  const event = await getEvent(eventId)
  if (event.status !== "registration_open") {
    throw new Error("Registration is not currently open for this event")
  }

  // Step 2: Check capacity
  if (event.currentRegistrations >= event.capacity) {
    if (event.waitlistEnabled && event.waitlistCapacity) {
      return addToWaitlist(eventId, memberId)
    }
    throw new Error("Event is at full capacity")
  }

  // Step 3: Validate pricing tier eligibility
  const member = await getMember(memberId)
  const pricingTier = event.pricingTiers.find(pt => pt.id === pricingTierId)

  if (!pricingTier) {
    throw new Error("Invalid pricing tier")
  }

  if (pricingTier.memberTypesEligible) {
    if (!pricingTier.memberTypesEligible.includes(member.memberType)) {
      throw new Error("You are not eligible for this pricing tier")
    }
  }

  // Step 4: Check for duplicate registration
  const existingRegistration = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.memberId, memberId),
        ne(eventRegistrations.status, "cancelled")
      )
    )
    .limit(1)

  if (existingRegistration.length > 0) {
    throw new Error("You are already registered for this event")
  }

  // Step 5: Create registration record
  const registration = await db
    .insert(eventRegistrations)
    .values({
      eventId,
      memberId,
      pricingTierId,
      status: "pending",
      amountPaid: pricingTier.price,
      paymentStatus: "pending",
      registrationDate: new Date(),
      ...additionalInfo
    })
    .returning()

  // Step 6: Process payment
  const payment = await processEventPayment(
    registration[0].id,
    pricingTier.price,
    memberId
  )

  if (!payment.success) {
    // Mark registration as failed
    await db
      .update(eventRegistrations)
      .set({ paymentStatus: "failed" })
      .where(eq(eventRegistrations.id, registration[0].id))

    throw new Error("Payment processing failed")
  }

  // Step 7: Confirm registration
  await db
    .update(eventRegistrations)
    .set({
      status: "confirmed",
      paymentStatus: "completed"
    })
    .where(eq(eventRegistrations.id, registration[0].id))

  // Step 8: Update event capacity
  await db
    .update(events)
    .set({
      currentRegistrations: sql`${events.currentRegistrations} + 1`
    })
    .where(eq(events.id, eventId))

  // Step 9: Send confirmation email
  await sendEventConfirmationEmail(member.email, {
    eventTitle: event.title,
    startDate: event.startDate,
    location: event.deliveryMode === "in_person" ? event.venueName : "Virtual",
    confirmationCode: registration[0].id,
    amount: pricingTier.price
  })

  // Step 10: Add to calendar (generate .ics file)
  const calendarInvite = generateCalendarInvite(event, registration[0])
  await emailCalendarInvite(member.email, calendarInvite)

  return registration[0]
}
```

## Waitlist Management

```typescript
async function addToWaitlist(eventId: string, memberId: string) {
  const event = await getEvent(eventId)

  if (!event.waitlistEnabled) {
    throw new Error("Waitlist is not available for this event")
  }

  const waitlistCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, "waitlisted")
      )
    )

  if (waitlistCount[0].count >= (event.waitlistCapacity || 0)) {
    throw new Error("Waitlist is full")
  }

  const registration = await db
    .insert(eventRegistrations)
    .values({
      eventId,
      memberId,
      status: "waitlisted",
      registrationDate: new Date()
    })
    .returning()

  await sendWaitlistEmail(memberId, event)

  return registration[0]
}

async function promoteFromWaitlist(eventId: string, count: number = 1) {
  // Get waitlisted registrations in order
  const waitlisted = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, "waitlisted")
      )
    )
    .orderBy(asc(eventRegistrations.registrationDate))
    .limit(count)

  for (const registration of waitlisted) {
    // Update status to pending (requires payment)
    await db
      .update(eventRegistrations)
      .set({ status: "pending" })
      .where(eq(eventRegistrations.id, registration.id))

    // Send promotion email with payment link
    const member = await getMember(registration.memberId)
    await sendWaitlistPromotionEmail(member.email, {
      eventId,
      registrationId: registration.id,
      paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    })
  }
}
```

## QR Code Check-In System

```typescript
import { QRCodeSVG } from "qrcode.react"

// Generate unique QR code for each registration
function generateCheckInQR(registrationId: string): string {
  const checkInData = {
    registrationId,
    timestamp: Date.now(),
    signature: generateHMAC(registrationId) // Security verification
  }

  return JSON.stringify(checkInData)
}

// Render QR code in confirmation email
export function RegistrationQRCode({ registrationId }: { registrationId: string }) {
  const qrData = generateCheckInQR(registrationId)

  return (
    <div className="flex flex-col items-center gap-4">
      <QRCodeSVG
        value={qrData}
        size={200}
        level="H"
        includeMargin
      />
      <p className="text-sm text-muted-foreground">
        Show this QR code at event check-in
      </p>
      <p className="text-xs text-muted-foreground font-mono">
        Confirmation: {registrationId.slice(0, 8).toUpperCase()}
      </p>
    </div>
  )
}

// Check-in scanning endpoint
async function processCheckIn(scannedData: string) {
  const checkInData = JSON.parse(scannedData)

  // Verify signature
  if (!verifyHMAC(checkInData.registrationId, checkInData.signature)) {
    throw new Error("Invalid QR code")
  }

  // Verify registration exists
  const registration = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.id, checkInData.registrationId))
    .limit(1)

  if (!registration.length) {
    throw new Error("Registration not found")
  }

  if (registration[0].status !== "confirmed") {
    throw new Error(`Registration status: ${registration[0].status}`)
  }

  // Mark as attended
  await db
    .update(eventRegistrations)
    .set({
      status: "attended",
      checkInTime: new Date(),
      checkInMethod: "qr_code"
    })
    .where(eq(eventRegistrations.id, checkInData.registrationId))

  return {
    success: true,
    attendeeName: registration[0].guestName || (await getMember(registration[0].memberId)).name
  }
}
```

## Virtual/Hybrid Event Support

```typescript
interface VirtualEventSession {
  id: string
  eventId: string
  sessionName: string
  startTime: Date
  endTime: Date
  platform: "zoom" | "teams" | "webex" | "custom"
  meetingUrl: string
  meetingId?: string
  passcode?: string
  hostId: string
  recordingEnabled: boolean
  recordingUrl?: string
}

async function sendVirtualEventAccess(registrationId: string) {
  const registration = await getRegistration(registrationId)
  const event = await getEvent(registration.eventId)
  const member = await getMember(registration.memberId)

  if (event.deliveryMode === "in_person") {
    throw new Error("This is not a virtual event")
  }

  // Generate unique access link (with tracking)
  const accessToken = generateAccessToken(registrationId)
  const trackableUrl = `${event.virtualMeetingUrl}?ref=${accessToken}`

  await sendEmail({
    to: member.email,
    subject: `Virtual Access: ${event.title}`,
    template: "virtual-event-access",
    data: {
      eventTitle: event.title,
      startDate: event.startDate,
      platform: event.virtualPlatform,
      meetingUrl: trackableUrl,
      accessCode: event.virtualAccessCode,
      instructions: getVirtualPlatformInstructions(event.virtualPlatform)
    }
  })

  // Send reminder 1 hour before
  await scheduleReminder(registrationId, {
    sendAt: new Date(event.startDate.getTime() - 60 * 60 * 1000),
    template: "virtual-event-reminder",
    includeAccessLink: true
  })
}
```

## Post-Event Analytics

```typescript
interface EventPerformanceMetrics {
  totalRegistrations: number
  totalAttendees: number
  attendanceRate: number
  noShowRate: number
  cancellationRate: number
  totalRevenue: number
  revenueByTier: Record<string, number>
  averageTicketPrice: number
  capacityUtilization: number
  waitlistPromotions: number
  checkInMethods: Record<string, number>
  feedbackAverageRating?: number
  feedbackResponseRate?: number
}

async function calculateEventMetrics(eventId: string): Promise<EventPerformanceMetrics> {
  const event = await getEvent(eventId)
  const registrations = await db
    .select()
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId))

  const totalRegistrations = registrations.length
  const totalAttendees = registrations.filter(r => r.status === "attended").length
  const noShows = registrations.filter(r => r.status === "no_show").length
  const cancelled = registrations.filter(r => r.status === "cancelled").length

  const totalRevenue = registrations
    .filter(r => r.paymentStatus === "completed")
    .reduce((sum, r) => sum + r.amountPaid, 0)

  return {
    totalRegistrations,
    totalAttendees,
    attendanceRate: (totalAttendees / totalRegistrations) * 100,
    noShowRate: (noShows / totalRegistrations) * 100,
    cancellationRate: (cancelled / totalRegistrations) * 100,
    totalRevenue,
    revenueByTier: calculateRevenueByTier(registrations),
    averageTicketPrice: totalRevenue / totalRegistrations,
    capacityUtilization: (totalRegistrations / event.capacity) * 100,
    waitlistPromotions: registrations.filter(r =>
      r.status === "confirmed" && r.promotedFromWaitlist
    ).length,
    checkInMethods: countCheckInMethods(registrations)
  }
}

// Automated post-event survey
async function sendPostEventSurvey(eventId: string) {
  const attendees = await db
    .select()
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, "attended")
      )
    )

  for (const attendee of attendees) {
    const member = await getMember(attendee.memberId)
    const surveyToken = generateSurveyToken(attendee.id)

    await sendEmail({
      to: member.email,
      subject: "How was your experience?",
      template: "post-event-survey",
      data: {
        eventTitle: (await getEvent(eventId)).title,
        surveyUrl: `https://ams.nabip.org/surveys/${surveyToken}`
      }
    })
  }
}
```

## Integration with Other Skills

- Use with `supabase-schema-validator` for event data models
- Combine with `component-generator` for event UI
- Works with `analytics-helper` for performance metrics
- Supports `member-workflow` for attendee management

---

**Best for**: Developers building event management features including registration, check-in, virtual event delivery, and post-event analytics for the NABIP AMS.
