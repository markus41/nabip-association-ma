/**
 * Analytics Event Tracking System
 *
 * Establish comprehensive activity monitoring to support data-driven decision making
 * across member engagement, operational efficiency, and strategic planning initiatives.
 *
 * Best for: Organizations seeking measurable insights into member behavior and platform usage
 */

import { v4 as uuidv4 } from 'uuid'
import type { AnalyticsEvent, AnalyticsEventType } from './types'

/**
 * Generate unique session identifier for tracking user sessions
 * Session persists for duration of browser tab lifecycle
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('nabip_session_id')
  if (!sessionId) {
    sessionId = uuidv4()
    sessionStorage.setItem('nabip_session_id', sessionId)
  }
  return sessionId
}

/**
 * Core analytics event tracking interface
 * Captures user interactions with structured metadata for downstream analysis
 */
class AnalyticsTracker {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private isEnabled: boolean = true

  constructor() {
    this.sessionId = getSessionId()
    this.loadEventsFromStorage()
  }

  /**
   * Track analytics event with automatic enrichment
   * Adds session context, timestamps, and browser metadata
   */
  track(
    eventType: AnalyticsEventType,
    metadata: Record<string, any> = {},
    memberId?: string
  ): AnalyticsEvent {
    if (!this.isEnabled) {
      console.debug('[Analytics] Tracking disabled')
      return {} as AnalyticsEvent
    }

    const event: AnalyticsEvent = {
      id: uuidv4(),
      eventType,
      memberId,
      sessionId: this.sessionId,
      metadata,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      // IP address would be captured server-side in production
      ipAddress: undefined
    }

    this.events.push(event)
    this.persistEvents()

    // In production, this would send to Supabase via batch API
    this.sendToBackend([event])

    console.debug('[Analytics] Event tracked:', event)
    return event
  }

  /**
   * Track page view with navigation context
   */
  trackPageView(page: string, metadata: Record<string, any> = {}): void {
    this.track('page_view', {
      page,
      title: document.title,
      ...metadata
    })
  }

  /**
   * Track button click with element context
   */
  trackClick(
    elementLabel: string,
    elementType: string = 'button',
    metadata: Record<string, any> = {}
  ): void {
    this.track('button_click', {
      elementLabel,
      elementType,
      ...metadata
    })
  }

  /**
   * Track form submission with validation state
   */
  trackFormSubmission(
    formName: string,
    success: boolean,
    metadata: Record<string, any> = {}
  ): void {
    this.track('form_submission', {
      formName,
      success,
      ...metadata
    })
  }

  /**
   * Track event registration with ticket details
   */
  trackEventRegistration(
    eventId: string,
    eventName: string,
    ticketType: string,
    amount: number,
    memberId?: string
  ): void {
    this.track('event_registration', {
      eventId,
      eventName,
      ticketType,
      amount
    }, memberId)
  }

  /**
   * Track event check-in for attendance analytics
   */
  trackEventCheckIn(
    eventId: string,
    eventName: string,
    memberId?: string
  ): void {
    this.track('event_check_in', {
      eventId,
      eventName
    }, memberId)
  }

  /**
   * Track email engagement metrics
   */
  trackEmailOpen(campaignId: string, memberId?: string): void {
    this.track('email_open', { campaignId }, memberId)
  }

  trackEmailClick(campaignId: string, linkUrl: string, memberId?: string): void {
    this.track('email_click', { campaignId, linkUrl }, memberId)
  }

  /**
   * Track learning management system interactions
   */
  trackCourseEnrollment(courseId: string, courseName: string, memberId?: string): void {
    this.track('course_enrollment', { courseId, courseName }, memberId)
  }

  trackCourseCompletion(
    courseId: string,
    courseName: string,
    duration: number,
    memberId?: string
  ): void {
    this.track('course_completion', {
      courseId,
      courseName,
      duration
    }, memberId)
  }

  /**
   * Track authentication events
   */
  trackLogin(memberId: string, method: string = 'email'): void {
    this.track('login', { method }, memberId)
  }

  trackLogout(memberId?: string): void {
    this.track('logout', {}, memberId)
  }

  /**
   * Track member profile updates
   */
  trackMemberUpdate(
    memberId: string,
    fieldsUpdated: string[],
    updateType: 'profile' | 'preferences' | 'credentials'
  ): void {
    this.track('member_update', {
      fieldsUpdated,
      updateType,
      fieldCount: fieldsUpdated.length
    }, memberId)
  }

  /**
   * Track payment completion for revenue analytics
   */
  trackPaymentCompleted(
    transactionId: string,
    amount: number,
    paymentMethod: string,
    memberId?: string
  ): void {
    this.track('payment_completed', {
      transactionId,
      amount,
      paymentMethod
    }, memberId)
  }

  /**
   * Track search behavior for UX optimization
   */
  trackSearch(query: string, resultCount: number, filters?: Record<string, any>): void {
    this.track('search', {
      query,
      resultCount,
      filters
    })
  }

  /**
   * Track filter application for understanding user preferences
   */
  trackFilterApplied(filterType: string, filterValue: any, context: string): void {
    this.track('filter_applied', {
      filterType,
      filterValue,
      context
    })
  }

  /**
   * Track data exports for compliance and audit
   */
  trackExport(exportType: string, recordCount: number, format: string): void {
    this.track('export_data', {
      exportType,
      recordCount,
      format
    })
  }

  /**
   * Track custom events with flexible metadata
   */
  trackCustom(eventName: string, metadata: Record<string, any> = {}, memberId?: string): void {
    this.track('custom', {
      customEventName: eventName,
      ...metadata
    }, memberId)
  }

  /**
   * Retrieve all tracked events for analysis
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Filter events by criteria
   */
  getEventsByType(eventType: AnalyticsEventType): AnalyticsEvent[] {
    return this.events.filter(e => e.eventType === eventType)
  }

  getEventsByMember(memberId: string): AnalyticsEvent[] {
    return this.events.filter(e => e.memberId === memberId)
  }

  getEventsByDateRange(startDate: Date, endDate: Date): AnalyticsEvent[] {
    return this.events.filter(e => {
      const eventDate = new Date(e.timestamp)
      return eventDate >= startDate && eventDate <= endDate
    })
  }

  /**
   * Clear all tracked events (for testing/privacy)
   */
  clearEvents(): void {
    this.events = []
    this.persistEvents()
    console.info('[Analytics] All events cleared')
  }

  /**
   * Enable or disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.info(`[Analytics] Tracking ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Persist events to localStorage for client-side storage
   * In production, would batch-send to Supabase
   */
  private persistEvents(): void {
    try {
      const recentEvents = this.events.slice(-1000) // Keep last 1000 events
      localStorage.setItem('nabip_analytics_events', JSON.stringify(recentEvents))
    } catch (error) {
      console.error('[Analytics] Failed to persist events:', error)
    }
  }

  /**
   * Load events from localStorage on initialization
   */
  private loadEventsFromStorage(): void {
    try {
      const stored = localStorage.getItem('nabip_analytics_events')
      if (stored) {
        this.events = JSON.parse(stored)
        console.info(`[Analytics] Loaded ${this.events.length} events from storage`)
      }
    } catch (error) {
      console.error('[Analytics] Failed to load events:', error)
      this.events = []
    }
  }

  /**
   * Send events to backend (Supabase in production)
   * Currently mock implementation for development
   */
  private async sendToBackend(events: AnalyticsEvent[]): Promise<void> {
    // In production, batch insert to Supabase:
    // const { error } = await supabase.from('analytics_events').insert(events)

    // Mock implementation - log to console
    if (import.meta.env.DEV) {
      console.debug('[Analytics] Would send to backend:', events.length, 'events')
    }
  }

  /**
   * Generate analytics summary for reporting
   */
  getSummary(dateRange?: { start: Date; end: Date }): {
    totalEvents: number
    eventsByType: Record<AnalyticsEventType, number>
    uniqueMembers: number
    uniqueSessions: number
  } {
    const eventsToAnalyze = dateRange
      ? this.getEventsByDateRange(dateRange.start, dateRange.end)
      : this.events

    const eventsByType = eventsToAnalyze.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1
      return acc
    }, {} as Record<AnalyticsEventType, number>)

    const uniqueMembers = new Set(
      eventsToAnalyze.filter(e => e.memberId).map(e => e.memberId)
    ).size

    const uniqueSessions = new Set(
      eventsToAnalyze.map(e => e.sessionId)
    ).size

    return {
      totalEvents: eventsToAnalyze.length,
      eventsByType,
      uniqueMembers,
      uniqueSessions
    }
  }
}

// Singleton instance for global access
export const analyticsTracker = new AnalyticsTracker()

// Export for advanced use cases
export { AnalyticsTracker }
