---
name: member-workflow
description: Guides implementation of member lifecycle workflows including registration, renewal, engagement tracking, and duplicate detection for 20,000+ members across national, state, and local NABIP chapters. Use when working on member onboarding, status changes, tier upgrades, or automated renewal processes.
---

# Member Workflow

Establish scalable member management processes to streamline operations across the NABIP association's multi-tier structure.

## When to Use

Activate this skill when:
- Implementing member registration workflows
- Building automated renewal reminder systems
- Creating duplicate member detection logic
- Designing member status change workflows (active → inactive, etc.)
- Implementing engagement scoring algorithms
- Building self-service member portals
- Working on membership tier transitions (Local → State → National)

## Member Lifecycle States

### Status Workflow
```
pending → active → inactive
    ↓         ↓         ↓
cancelled  suspended  expired
```

### State Transition Rules

1. **pending → active**
   - Payment confirmed
   - Profile completed
   - Email verified
   - Chapter assignment confirmed

2. **active → suspended**
   - Payment failure (grace period: 30 days)
   - Policy violation flagged
   - Admin action required

3. **active → inactive**
   - Membership not renewed after expiration
   - Member requested pause
   - Chapter transfer in progress

4. **inactive → active**
   - Renewal payment processed
   - Reactivation request approved
   - Chapter transfer completed

5. **Any → cancelled**
   - Member requested cancellation
   - Refund processed
   - Data retention policy applied

## Registration Workflow

```typescript
// Example: Member registration with validation
interface MemberRegistration {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  membershipInfo: {
    memberType: "national" | "state" | "local"
    chapterId: string
    referralSource?: string
  }
  paymentInfo: {
    amount: number
    paymentMethod: string
    transactionId: string
  }
}

async function registerMember(data: MemberRegistration) {
  // Step 1: Validate against duplicate detection
  const duplicateCheck = await checkDuplicateMember(data.personalInfo.email)
  if (duplicateCheck.exists) {
    return { success: false, error: "Member already exists", existingId: duplicateCheck.id }
  }

  // Step 2: Validate chapter hierarchy (local must have state parent, etc.)
  const chapterValid = await validateChapterAssignment(
    data.membershipInfo.chapterId,
    data.membershipInfo.memberType
  )
  if (!chapterValid) {
    return { success: false, error: "Invalid chapter assignment for member type" }
  }

  // Step 3: Create member record with 'pending' status
  const member = await createMemberRecord({
    ...data.personalInfo,
    ...data.membershipInfo,
    status: "pending",
    engagementScore: 0,
    joinedDate: new Date()
  })

  // Step 4: Process payment
  const payment = await processPayment(data.paymentInfo)
  if (!payment.success) {
    // Rollback member creation or mark as payment_failed
    await updateMemberStatus(member.id, "cancelled")
    return { success: false, error: "Payment failed" }
  }

  // Step 5: Send welcome email sequence
  await sendWelcomeEmail(member.email, {
    memberType: data.membershipInfo.memberType,
    chapterName: await getChapterName(data.membershipInfo.chapterId)
  })

  // Step 6: Activate membership
  await updateMemberStatus(member.id, "active")

  // Step 7: Calculate initial engagement score
  await calculateEngagementScore(member.id)

  return { success: true, memberId: member.id }
}
```

## Renewal Workflow

### Automated Renewal Reminders

```typescript
// Trigger points for renewal reminders
const RENEWAL_REMINDER_SCHEDULE = {
  firstReminder: 60, // days before expiration
  secondReminder: 30,
  thirdReminder: 14,
  finalReminder: 7,
  gracePeriodEnd: 30 // days after expiration
}

async function processRenewalReminders() {
  const today = new Date()

  // Find members approaching renewal
  const membersNeedingReminder = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.status, "active"),
        sql`DATE(renewal_date) - DATE(${today}) IN (60, 30, 14, 7)`
      )
    )

  for (const member of membersNeedingReminder) {
    const daysUntilRenewal = calculateDays(member.renewalDate, today)

    await sendRenewalEmail(member.email, {
      daysRemaining: daysUntilRenewal,
      renewalFee: calculateRenewalFee(member.memberType),
      renewalLink: generateRenewalLink(member.id)
    })

    // Log reminder sent
    await createActivityLog({
      memberId: member.id,
      action: "renewal_reminder_sent",
      metadata: { daysUntilRenewal }
    })
  }

  // Handle expired memberships
  const expiredMembers = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.status, "active"),
        sql`DATE(renewal_date) < DATE(${today})`
      )
    )

  for (const member of expiredMembers) {
    const daysExpired = calculateDays(today, member.renewalDate)

    if (daysExpired > RENEWAL_REMINDER_SCHEDULE.gracePeriodEnd) {
      // Move to inactive
      await updateMemberStatus(member.id, "inactive")
      await sendGracePeriodExpiredEmail(member.email)
    }
  }
}
```

## Duplicate Detection

### Smart Matching Algorithm

```typescript
interface DuplicateCheckResult {
  exists: boolean
  confidence: "high" | "medium" | "low"
  matchedRecords: Array<{
    id: string
    matchReason: string[]
    similarity: number
  }>
}

async function checkDuplicateMember(email: string, name?: string): Promise<DuplicateCheckResult> {
  const matches: any[] = []

  // Exact email match (highest confidence)
  const emailMatch = await db
    .select()
    .from(members)
    .where(eq(members.email, email.toLowerCase()))
    .limit(1)

  if (emailMatch.length > 0) {
    return {
      exists: true,
      confidence: "high",
      matchedRecords: [{
        id: emailMatch[0].id,
        matchReason: ["exact_email_match"],
        similarity: 1.0
      }]
    }
  }

  // Fuzzy name matching if provided
  if (name) {
    const nameMatches = await db
      .select()
      .from(members)
      .where(sql`SIMILARITY(${members.name}, ${name}) > 0.7`)
      .limit(5)

    for (const match of nameMatches) {
      matches.push({
        id: match.id,
        matchReason: ["similar_name"],
        similarity: calculateStringSimilarity(name, match.name)
      })
    }
  }

  // Phone number matching (if available in future)
  // Additional matching logic...

  return {
    exists: matches.length > 0,
    confidence: matches.length > 0 ? "medium" : "low",
    matchedRecords: matches
  }
}
```

## Engagement Scoring

### Scoring Algorithm

```typescript
interface EngagementFactors {
  eventAttendance: number       // 0-30 points
  emailInteraction: number      // 0-20 points
  courseCompletion: number      // 0-25 points
  communityParticipation: number // 0-15 points
  paymentHistory: number        // 0-10 points
}

async function calculateEngagementScore(memberId: string): Promise<number> {
  const factors = await gatherEngagementData(memberId)

  const score = {
    events: Math.min(factors.eventsAttended * 5, 30),
    emails: Math.min(factors.emailClickRate * 20, 20),
    courses: Math.min(factors.coursesCompleted * 12.5, 25),
    community: Math.min(factors.forumPosts * 3, 15),
    payment: factors.onTimePayments ? 10 : 0
  }

  const totalScore = Object.values(score).reduce((sum, val) => sum + val, 0)

  // Update member record
  await db
    .update(members)
    .set({
      engagementScore: Math.round(totalScore),
      lastEngagementCalculation: new Date()
    })
    .where(eq(members.id, memberId))

  return totalScore
}

// Run engagement calculation weekly
async function scheduleEngagementUpdates() {
  const activeMembers = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.status, "active"))

  for (const member of activeMembers) {
    await calculateEngagementScore(member.id)
  }
}
```

## Self-Service Portal Features

### Member Portal Capabilities
1. **Profile Management**: Update contact info, preferences
2. **Renewal Management**: View renewal date, process payment
3. **Event Registration**: Browse and register for events
4. **Course Enrollment**: Access learning management
5. **Chapter Transfer**: Request chapter changes
6. **Communication Preferences**: Email/notification settings
7. **Engagement Dashboard**: View personal engagement score

## Common Workflows

### Tier Upgrade (Local → State)
```typescript
async function upgradeMemberTier(memberId: string, newTier: "state" | "national") {
  // Validate upgrade eligibility
  const member = await getMember(memberId)
  if (member.memberType === newTier) {
    throw new Error("Already at requested tier")
  }

  // Calculate price difference
  const upgradeFeeDiff = calculateTierUpgradeFee(member.memberType, newTier)

  // Process additional payment if needed
  if (upgradeFeeDiff > 0) {
    const payment = await processUpgradePayment(memberId, upgradeFeeDiff)
    if (!payment.success) {
      throw new Error("Upgrade payment failed")
    }
  }

  // Update member tier
  await db
    .update(members)
    .set({
      memberType: newTier,
      tierUpgradeDate: new Date()
    })
    .where(eq(members.id, memberId))

  // Send confirmation email
  await sendTierUpgradeEmail(member.email, newTier)

  // Log activity
  await createActivityLog({
    memberId,
    action: "tier_upgraded",
    metadata: { fromTier: member.memberType, toTier: newTier }
  })
}
```

## Integration with Other Skills

- Use with `supabase-schema-validator` for database design
- Combine with `component-generator` for member portal UI
- Works with `analytics-helper` for engagement reports

---

**Best for**: Developers implementing member lifecycle management, automated workflows, and self-service features for the NABIP AMS.
