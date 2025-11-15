/**
 * Supabase Database Types
 *
 * Auto-generated type definitions for NABIP AMS database schema
 * Based on migrations in supabase/migrations/
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          job_title: string | null
          chapter_id: string | null
          membership_tier: 'standard' | 'premium' | 'lifetime'
          status: 'active' | 'inactive' | 'grace_period' | 'lapsed'
          join_date: string
          expiry_date: string
          renewal_date: string | null
          engagement_score: number
          address_street: string | null
          address_city: string | null
          address_state: string | null
          address_zip: string | null
          address_country: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['members']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['members']['Insert']>
      }
      chapters: {
        Row: {
          id: string
          name: string
          type: 'national' | 'state' | 'local'
          parent_chapter_id: string | null
          state_code: string | null
          city: string | null
          member_count: number
          description: string | null
          contact_email: string | null
          contact_phone: string | null
          website_url: string | null
          meeting_schedule: string | null
          is_active: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['chapters']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          type: 'conference' | 'webinar' | 'workshop' | 'networking' | 'social'
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          start_date: string
          end_date: string | null
          location_type: 'in-person' | 'virtual' | 'hybrid'
          venue_name: string | null
          venue_address: string | null
          virtual_link: string | null
          chapter_id: string | null
          capacity: number | null
          registered_count: number
          waitlist_count: number
          registration_deadline: string | null
          registration_fee: number | null
          is_members_only: boolean
          organizer_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          member_id: string | null
          type: 'membership_dues' | 'event_registration' | 'course_enrollment' | 'donation' | 'product_purchase'
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          payment_intent_id: string | null
          description: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      email_campaigns: {
        Row: {
          id: string
          name: string
          template_id: string
          subject: string
          preview_text: string | null
          from_name: string
          from_email: string
          reply_to: string | null
          segment_rules: Json | null
          estimated_recipients: number
          actual_recipients: number | null
          schedule_type: 'immediate' | 'scheduled' | 'recurring'
          scheduled_at: string | null
          timezone: string | null
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
          sent_at: string | null
          completed_at: string | null
          metrics: Json | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: Omit<Database['public']['Tables']['email_campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['email_campaigns']['Insert']>
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          duration_hours: number
          ce_credits: number | null
          instructor_name: string | null
          instructor_bio: string | null
          format: 'online' | 'in-person' | 'hybrid'
          price: number
          max_enrollment: number | null
          enrolled_count: number
          is_featured: boolean
          is_active: boolean
          start_date: string | null
          end_date: string | null
          syllabus: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
      }
      user_preferences: {
        Row: {
          id: string
          member_id: string
          user_id: string | null
          greeting_message: string | null
          theme: 'light' | 'dark' | 'auto'
          default_dashboard_view: string | null
          custom_settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>
      }
      dashboard_widgets: {
        Row: {
          id: string
          member_id: string
          widget_type: string
          title: string
          configuration: Json | null
          display_order: number
          is_visible: boolean
          size: 'small' | 'medium' | 'large' | 'full-width'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['dashboard_widgets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['dashboard_widgets']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          member_id: string
          type: 'system' | 'event' | 'membership' | 'communication' | 'payment'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          title: string
          message: string
          action_url: string | null
          is_read: boolean
          read_at: string | null
          expires_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          file_type: string
          file_size: number
          storage_path: string
          storage_url: string
          version: string
          is_public: boolean
          tags: string[] | null
          uploaded_by: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      chapter_metrics: {
        Row: {
          id: string
          chapter_id: string
          metric_date: string
          active_members: number
          new_members: number
          lapsed_members: number
          total_revenue: number
          events_held: number
          avg_event_attendance: number
          engagement_score: number
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['chapter_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chapter_metrics']['Insert']>
      }
      engagement_metrics: {
        Row: {
          id: string
          member_id: string
          metric_date: string
          email_opens: number
          email_clicks: number
          events_attended: number
          courses_completed: number
          logins: number
          engagement_score: number
          last_active_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['engagement_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['engagement_metrics']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          tags: string[] | null
          stripe_product_id: string | null
          active: boolean
          featured: boolean
          track_inventory: boolean
          inventory_quantity: number
          low_stock_threshold: number | null
          allow_backorder: boolean
          is_digital: boolean
          download_url: string | null
          access_duration_days: number | null
          image_url: string | null
          thumbnail_url: string | null
          gallery_urls: string[] | null
          slug: string | null
          meta_title: string | null
          meta_description: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      prices: {
        Row: {
          id: string
          product_id: string
          stripe_price_id: string | null
          unit_amount: number
          currency: string
          type: 'one_time' | 'recurring'
          billing_interval: 'day' | 'week' | 'month' | 'year' | null
          billing_interval_count: number | null
          trial_period_days: number | null
          member_tier: string | null
          is_member_only: boolean
          active: boolean
          nickname: string | null
          description: string | null
          compare_at_price: number | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['prices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prices']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_national_admin_member: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_state_admin_member: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_chapter_admin_member: {
        Args: { chapter_id: string }
        Returns: boolean
      }
      get_current_member_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_member_chapter_id: {
        Args: { target_member_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
