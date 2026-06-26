export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string | null
          id: string
          mother_id: string
          notes: string | null
          provider_id: string
          reminder_sent: boolean | null
          scheduled_at: string
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mother_id: string
          notes?: string | null
          provider_id: string
          reminder_sent?: boolean | null
          scheduled_at: string
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mother_id?: string
          notes?: string | null
          provider_id?: string
          reminder_sent?: boolean | null
          scheduled_at?: string
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "mothers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      care_documents: {
        Row: {
          created_at: string
          customer_user_id: string
          doc_type: string
          file_url: string | null
          id: string
          notes: string | null
          sensitive: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          doc_type: string
          file_url?: string | null
          id?: string
          notes?: string | null
          sensitive?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          doc_type?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          sensitive?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chw_alerts: {
        Row: {
          chw_id: string
          created_at: string
          id: string
          mother_id: string
          note: string | null
          resolved: boolean
          risk_type: string
        }
        Insert: {
          chw_id: string
          created_at?: string
          id?: string
          mother_id: string
          note?: string | null
          resolved?: boolean
          risk_type: string
        }
        Update: {
          chw_id?: string
          created_at?: string
          id?: string
          mother_id?: string
          note?: string | null
          resolved?: boolean
          risk_type?: string
        }
        Relationships: []
      }
      chw_mothers: {
        Row: {
          chw_id: string
          country: string | null
          created_at: string | null
          district: string | null
          due_date: string | null
          id: string
          last_visit_date: string | null
          mother_name: string
          phone: string | null
          referred: boolean | null
          risk_level: string | null
          total_visits: number | null
          village: string | null
        }
        Insert: {
          chw_id: string
          country?: string | null
          created_at?: string | null
          district?: string | null
          due_date?: string | null
          id?: string
          last_visit_date?: string | null
          mother_name: string
          phone?: string | null
          referred?: boolean | null
          risk_level?: string | null
          total_visits?: number | null
          village?: string | null
        }
        Update: {
          chw_id?: string
          country?: string | null
          created_at?: string | null
          district?: string | null
          due_date?: string | null
          id?: string
          last_visit_date?: string | null
          mother_name?: string
          phone?: string | null
          referred?: boolean | null
          risk_level?: string | null
          total_visits?: number | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chw_mothers_chw_id_fkey"
            columns: ["chw_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_seeds: {
        Row: {
          body_preview: string | null
          category: string | null
          country_scope: string | null
          created_at: string
          display_in_app: boolean
          id: string
          language: string | null
          life_stage: string | null
          notes: string | null
          record_type: string
          region_scope: string | null
          safety_flag: boolean
          status: string
          tags: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_preview?: string | null
          category?: string | null
          country_scope?: string | null
          created_at?: string
          display_in_app?: boolean
          id?: string
          language?: string | null
          life_stage?: string | null
          notes?: string | null
          record_type?: string
          region_scope?: string | null
          safety_flag?: boolean
          status: string
          tags?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_preview?: string | null
          category?: string | null
          country_scope?: string | null
          created_at?: string
          display_in_app?: boolean
          id?: string
          language?: string | null
          life_stage?: string | null
          notes?: string | null
          record_type?: string
          region_scope?: string | null
          safety_flag?: boolean
          status?: string
          tags?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      directory_resources: {
        Row: {
          category: string | null
          city_scope: string | null
          country: string | null
          created_at: string
          display_in_app: boolean
          display_section: string | null
          id: string
          language_support: string | null
          notes: string | null
          record_type: string
          region: string | null
          resource_name: string
          resource_type: string | null
          source_status: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city_scope?: string | null
          country?: string | null
          created_at?: string
          display_in_app?: boolean
          display_section?: string | null
          id?: string
          language_support?: string | null
          notes?: string | null
          record_type?: string
          region?: string | null
          resource_name: string
          resource_type?: string | null
          source_status?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city_scope?: string | null
          country?: string | null
          created_at?: string
          display_in_app?: boolean
          display_section?: string | null
          id?: string
          language_support?: string | null
          notes?: string | null
          record_type?: string
          region?: string | null
          resource_name?: string
          resource_type?: string | null
          source_status?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          created_at: string
          customer_user_id: string
          document_id: string
          follow_up_note: string | null
          granted_at: string
          id: string
          reviewed_at: string | null
          revoked_at: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          document_id: string
          follow_up_note?: string | null
          granted_at?: string
          id?: string
          reviewed_at?: string | null
          revoked_at?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          document_id?: string
          follow_up_note?: string | null
          granted_at?: string
          id?: string
          reviewed_at?: string | null
          revoked_at?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "care_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      guidance_content: {
        Row: {
          body: string | null
          category: string | null
          country: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          language: string | null
          reviewed_by: string | null
          title: string
          week_max: number | null
          week_min: number | null
        }
        Insert: {
          body?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          reviewed_by?: string | null
          title: string
          week_max?: number | null
          week_min?: number | null
        }
        Update: {
          body?: string | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          reviewed_by?: string | null
          title?: string
          week_max?: number | null
          week_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guidance_content_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          customer_display_name: string | null
          customer_user_id: string | null
          id: string
          language: string | null
          life_stage: string | null
          location: string | null
          need: string | null
          notes: string | null
          payment_preference: string | null
          source: string
          source_content_id: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_display_name?: string | null
          customer_user_id?: string | null
          id?: string
          language?: string | null
          life_stage?: string | null
          location?: string | null
          need?: string | null
          notes?: string | null
          payment_preference?: string | null
          source?: string
          source_content_id?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_display_name?: string | null
          customer_user_id?: string | null
          id?: string
          language?: string | null
          life_stage?: string | null
          location?: string | null
          need?: string | null
          notes?: string | null
          payment_preference?: string | null
          source?: string
          source_content_id?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_source_content_id_fkey"
            columns: ["source_content_id"]
            isOneToOne: false
            referencedRelation: "vendor_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      match_intakes: {
        Row: {
          city: string | null
          created_at: string
          extras: Json
          id: string
          language: string | null
          need: string | null
          payment: string | null
          stage: string | null
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          extras?: Json
          id?: string
          language?: string | null
          need?: string | null
          payment?: string | null
          stage?: string | null
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          extras?: Json
          id?: string
          language?: string | null
          need?: string | null
          payment?: string | null
          stage?: string | null
          updated_at?: string
          urgency?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mothers: {
        Row: {
          birth_prefs: string[] | null
          care_setting: string | null
          city: string | null
          country: string | null
          created_at: string | null
          cultural_other: string | null
          cultural_prefs: string[] | null
          dialect: string | null
          dietary_notes: string | null
          dietary_other: string | null
          dietary_prefs: string[] | null
          due_date: string | null
          full_name: string | null
          id: string
          is_first_pregnancy: boolean | null
          language: string | null
          language_other: string | null
          personalize_opt: string | null
          phone: string | null
          preferred_provider_id: string | null
          pregnancy_week: number | null
          region: string | null
          religious_pref: string | null
          secondary_language: string | null
          stage: string | null
          user_id: string
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          birth_prefs?: string[] | null
          care_setting?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          cultural_other?: string | null
          cultural_prefs?: string[] | null
          dialect?: string | null
          dietary_notes?: string | null
          dietary_other?: string | null
          dietary_prefs?: string[] | null
          due_date?: string | null
          full_name?: string | null
          id?: string
          is_first_pregnancy?: boolean | null
          language?: string | null
          language_other?: string | null
          personalize_opt?: string | null
          phone?: string | null
          preferred_provider_id?: string | null
          pregnancy_week?: number | null
          region?: string | null
          religious_pref?: string | null
          secondary_language?: string | null
          stage?: string | null
          user_id: string
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          birth_prefs?: string[] | null
          care_setting?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          cultural_other?: string | null
          cultural_prefs?: string[] | null
          dialect?: string | null
          dietary_notes?: string | null
          dietary_other?: string | null
          dietary_prefs?: string[] | null
          due_date?: string | null
          full_name?: string | null
          id?: string
          is_first_pregnancy?: boolean | null
          language?: string | null
          language_other?: string | null
          personalize_opt?: string | null
          phone?: string | null
          preferred_provider_id?: string | null
          pregnancy_week?: number | null
          region?: string | null
          religious_pref?: string | null
          secondary_language?: string | null
          stage?: string | null
          user_id?: string
          whatsapp_opt_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mothers_preferred_provider_id_fkey"
            columns: ["preferred_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mothers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_mad: number
          created_at: string
          id: string
          mother_city: string | null
          mother_id: string
          product_id: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_mad?: number
          created_at?: string
          id?: string
          mother_city?: string | null
          mother_id: string
          product_id: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_mad?: number
          created_at?: string
          id?: string
          mother_city?: string | null
          mother_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      passport_shares: {
        Row: {
          created_at: string
          customer_user_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scope: Json
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scope?: Json
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scope?: Json
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passport_shares_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          mother_id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          mother_id: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mother_id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          pregnancy_week_max: number | null
          pregnancy_week_min: number | null
          price_mad: number | null
          stock_count: number | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          pregnancy_week_max?: number | null
          pregnancy_week_min?: number | null
          price_mad?: number | null
          stock_count?: number | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          pregnancy_week_max?: number | null
          pregnancy_week_min?: number | null
          price_mad?: number | null
          stock_count?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean
          language: string | null
          language_chosen_at: string | null
          phone: string | null
          user_type: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          language?: string | null
          language_chosen_at?: string | null
          phone?: string | null
          user_type: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          language_chosen_at?: string | null
          phone?: string | null
          user_type?: string
        }
        Relationships: []
      }
      provider_leads: {
        Row: {
          birth_preference_tags: string[] | null
          business_name: string | null
          certification_source: string | null
          city: string | null
          converted_provider_id: string | null
          country: string | null
          created_at: string
          credential_text: string | null
          cultural_fit_tags: string[] | null
          display_in_app: boolean
          display_name: string | null
          doula_services: string[] | null
          fee_or_rate_public_text: string | null
          id: string
          internal_notes: string | null
          languages: string[] | null
          last_checked_at: string | null
          lead_ref: string | null
          outreach_status: string | null
          provider_type: string
          region: string | null
          service_area: string | null
          source_name: string | null
          source_type: string
          source_url: string | null
          specialties: string[] | null
          state_or_province: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          birth_preference_tags?: string[] | null
          business_name?: string | null
          certification_source?: string | null
          city?: string | null
          converted_provider_id?: string | null
          country?: string | null
          created_at?: string
          credential_text?: string | null
          cultural_fit_tags?: string[] | null
          display_in_app?: boolean
          display_name?: string | null
          doula_services?: string[] | null
          fee_or_rate_public_text?: string | null
          id?: string
          internal_notes?: string | null
          languages?: string[] | null
          last_checked_at?: string | null
          lead_ref?: string | null
          outreach_status?: string | null
          provider_type?: string
          region?: string | null
          service_area?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          specialties?: string[] | null
          state_or_province?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          birth_preference_tags?: string[] | null
          business_name?: string | null
          certification_source?: string | null
          city?: string | null
          converted_provider_id?: string | null
          country?: string | null
          created_at?: string
          credential_text?: string | null
          cultural_fit_tags?: string[] | null
          display_in_app?: boolean
          display_name?: string | null
          doula_services?: string[] | null
          fee_or_rate_public_text?: string | null
          id?: string
          internal_notes?: string | null
          languages?: string[] | null
          last_checked_at?: string | null
          lead_ref?: string | null
          outreach_status?: string | null
          provider_type?: string
          region?: string | null
          service_area?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          specialties?: string[] | null
          state_or_province?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_leads_converted_provider_id_fkey"
            columns: ["converted_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_targets: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          cultural_fit_tags: string | null
          display_in_app: boolean
          id: string
          language_focus: string | null
          notes: string | null
          priority: number | null
          recommended_source: string | null
          record_type: string
          region: string | null
          source_url: string | null
          specialty: string | null
          status: string | null
          target_count: number | null
          updated_at: string
          verification_tasks: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          cultural_fit_tags?: string | null
          display_in_app?: boolean
          id?: string
          language_focus?: string | null
          notes?: string | null
          priority?: number | null
          recommended_source?: string | null
          record_type?: string
          region?: string | null
          source_url?: string | null
          specialty?: string | null
          status?: string | null
          target_count?: number | null
          updated_at?: string
          verification_tasks?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          cultural_fit_tags?: string | null
          display_in_app?: boolean
          id?: string
          language_focus?: string | null
          notes?: string | null
          priority?: number | null
          recommended_source?: string | null
          record_type?: string
          region?: string | null
          source_url?: string | null
          specialty?: string | null
          status?: string | null
          target_count?: number | null
          updated_at?: string
          verification_tasks?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          accepting_patients: boolean | null
          avg_rating: number | null
          bio: string | null
          booking_url: string | null
          city: string | null
          clinic_address: string | null
          clinic_name: string | null
          consultation_fee_mad: number | null
          country: string | null
          created_at: string | null
          credentials: string | null
          email: string | null
          facebook: string | null
          full_name: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          license_number: string | null
          lng: number | null
          neighborhood: string | null
          phone: string | null
          rejection_reason: string | null
          review_count: number | null
          review_status: string
          services: string | null
          specialty: string | null
          user_id: string
          website: string | null
          years_in_practice: number | null
        }
        Insert: {
          accepting_patients?: boolean | null
          avg_rating?: number | null
          bio?: string | null
          booking_url?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee_mad?: number | null
          country?: string | null
          created_at?: string | null
          credentials?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          review_status?: string
          services?: string | null
          specialty?: string | null
          user_id: string
          website?: string | null
          years_in_practice?: number | null
        }
        Update: {
          accepting_patients?: boolean | null
          avg_rating?: number | null
          bio?: string | null
          booking_url?: string | null
          city?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_fee_mad?: number | null
          country?: string | null
          created_at?: string | null
          credentials?: string | null
          email?: string | null
          facebook?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          review_status?: string
          services?: string | null
          specialty?: string | null
          user_id?: string
          website?: string | null
          years_in_practice?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          customer_consent_share_completion: boolean
          customer_user_id: string
          documents_requested: Json
          follow_up_due: string | null
          from_vendor_id: string
          id: string
          notes: string | null
          permission_requested: boolean
          reason: string | null
          status: string
          to_category: string | null
          to_partner_name: string | null
          to_vendor_id: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          created_at?: string
          customer_consent_share_completion?: boolean
          customer_user_id: string
          documents_requested?: Json
          follow_up_due?: string | null
          from_vendor_id: string
          id?: string
          notes?: string | null
          permission_requested?: boolean
          reason?: string | null
          status?: string
          to_category?: string | null
          to_partner_name?: string | null
          to_vendor_id?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          created_at?: string
          customer_consent_share_completion?: boolean
          customer_user_id?: string
          documents_requested?: Json
          follow_up_due?: string | null
          from_vendor_id?: string
          id?: string
          notes?: string | null
          permission_requested?: boolean
          reason?: string | null
          status?: string
          to_category?: string | null
          to_partner_name?: string | null
          to_vendor_id?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_from_vendor_id_fkey"
            columns: ["from_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_vendor_id_fkey"
            columns: ["to_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_events: {
        Row: {
          agenda: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          date_status: string | null
          date_time_local: string | null
          display_in_app: boolean
          event_category_tags: string | null
          host_name: string | null
          host_type: string | null
          id: string
          is_featured: boolean
          languages: string | null
          life_stage_tags: string | null
          location_type: string | null
          long_description: string | null
          notes: string | null
          price_amount: number | null
          price_type: string | null
          record_type: string
          region: string | null
          registration_type: string | null
          registration_url: string | null
          short_description: string | null
          source_url: string | null
          speaker_slots: string | null
          status: string
          timezone: string | null
          title: string
          updated_at: string
          venue_name: string | null
          verification_status: string | null
        }
        Insert: {
          agenda?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_status?: string | null
          date_time_local?: string | null
          display_in_app?: boolean
          event_category_tags?: string | null
          host_name?: string | null
          host_type?: string | null
          id?: string
          is_featured?: boolean
          languages?: string | null
          life_stage_tags?: string | null
          location_type?: string | null
          long_description?: string | null
          notes?: string | null
          price_amount?: number | null
          price_type?: string | null
          record_type: string
          region?: string | null
          registration_type?: string | null
          registration_url?: string | null
          short_description?: string | null
          source_url?: string | null
          speaker_slots?: string | null
          status: string
          timezone?: string | null
          title: string
          updated_at?: string
          venue_name?: string | null
          verification_status?: string | null
        }
        Update: {
          agenda?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_status?: string | null
          date_time_local?: string | null
          display_in_app?: boolean
          event_category_tags?: string | null
          host_name?: string | null
          host_type?: string | null
          id?: string
          is_featured?: boolean
          languages?: string | null
          life_stage_tags?: string | null
          location_type?: string | null
          long_description?: string | null
          notes?: string | null
          price_amount?: number | null
          price_type?: string | null
          record_type?: string
          region?: string | null
          registration_type?: string | null
          registration_url?: string | null
          short_description?: string | null
          source_url?: string | null
          speaker_slots?: string | null
          status?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          venue_name?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      trusted_partners: {
        Row: {
          category: string
          created_at: string
          id: string
          languages: string[]
          location: string | null
          owner_vendor_id: string
          partner_name: string
          partner_vendor_id: string | null
          payment_options: string[]
          recommendation_note: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          languages?: string[]
          location?: string | null
          owner_vendor_id: string
          partner_name: string
          partner_vendor_id?: string | null
          payment_options?: string[]
          recommendation_note?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          languages?: string[]
          location?: string | null
          owner_vendor_id?: string
          partner_name?: string
          partner_vendor_id?: string | null
          payment_options?: string[]
          recommendation_note?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trusted_partners_owner_vendor_id_fkey"
            columns: ["owner_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_partners_partner_vendor_id_fkey"
            columns: ["partner_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_content: {
        Row: {
          agenda: Json | null
          body: string | null
          booking_clicks: number
          category: string | null
          completed_bookings: number
          content_type: string
          created_at: string
          cta_type: string | null
          cta_url: string | null
          event_at: string | null
          event_registrations: number
          event_sections: Json | null
          excerpt: string | null
          id: string
          language: string | null
          life_stage: string | null
          location: string | null
          map_embed_url: string | null
          media_url: string | null
          messages: number
          new_leads: number
          price_label: string | null
          profile_visits: number
          quote_requests: number
          referrals_generated: number
          related_service: string | null
          requires_review: boolean
          safety_note: string | null
          saves: number
          shop_clicks: number
          speakers: Json | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          vendor_id: string
          views: number
        }
        Insert: {
          agenda?: Json | null
          body?: string | null
          booking_clicks?: number
          category?: string | null
          completed_bookings?: number
          content_type?: string
          created_at?: string
          cta_type?: string | null
          cta_url?: string | null
          event_at?: string | null
          event_registrations?: number
          event_sections?: Json | null
          excerpt?: string | null
          id?: string
          language?: string | null
          life_stage?: string | null
          location?: string | null
          map_embed_url?: string | null
          media_url?: string | null
          messages?: number
          new_leads?: number
          price_label?: string | null
          profile_visits?: number
          quote_requests?: number
          referrals_generated?: number
          related_service?: string | null
          requires_review?: boolean
          safety_note?: string | null
          saves?: number
          shop_clicks?: number
          speakers?: Json | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          vendor_id: string
          views?: number
        }
        Update: {
          agenda?: Json | null
          body?: string | null
          booking_clicks?: number
          category?: string | null
          completed_bookings?: number
          content_type?: string
          created_at?: string
          cta_type?: string | null
          cta_url?: string | null
          event_at?: string | null
          event_registrations?: number
          event_sections?: Json | null
          excerpt?: string | null
          id?: string
          language?: string | null
          life_stage?: string | null
          location?: string | null
          map_embed_url?: string | null
          media_url?: string | null
          messages?: number
          new_leads?: number
          price_label?: string | null
          profile_visits?: number
          quote_requests?: number
          referrals_generated?: number
          related_service?: string | null
          requires_review?: boolean
          safety_note?: string | null
          saves?: number
          shop_clicks?: number
          speakers?: Json | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          vendor_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_content_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_content_saves: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_content_saves_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "vendor_content"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          avg_rating: number | null
          bio: string | null
          booking_url: string | null
          business_name: string | null
          category: string | null
          city: string | null
          commission_rate: number | null
          country: string | null
          created_at: string | null
          credentials: string | null
          description: string | null
          email: string | null
          facebook: string | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          linkedin: string | null
          logo_url: string | null
          neighborhood: string | null
          phone: string | null
          rejection_reason: string | null
          review_status: string
          secondary_website: string | null
          services: string | null
          user_id: string
          website: string | null
          years_in_practice: number | null
        }
        Insert: {
          address?: string | null
          avg_rating?: number | null
          bio?: string | null
          booking_url?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          credentials?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          linkedin?: string | null
          logo_url?: string | null
          neighborhood?: string | null
          phone?: string | null
          rejection_reason?: string | null
          review_status?: string
          secondary_website?: string | null
          services?: string | null
          user_id: string
          website?: string | null
          years_in_practice?: number | null
        }
        Update: {
          address?: string | null
          avg_rating?: number | null
          bio?: string | null
          booking_url?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          credentials?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          linkedin?: string | null
          logo_url?: string | null
          neighborhood?: string | null
          phone?: string | null
          rejection_reason?: string | null
          review_status?: string
          secondary_website?: string | null
          services?: string | null
          user_id?: string
          website?: string | null
          years_in_practice?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          action_notes: string | null
          blood_pressure: string | null
          chw_id: string
          concerns: string | null
          created_at: string
          duration_minutes: number | null
          feeling_scale: number | null
          fetal_heartbeat: string | null
          fundal_height_cm: number | null
          id: string
          medications: string | null
          mother_id: string
          next_visit_date: string | null
          oedema: string | null
          referral_destination: string | null
          referred: boolean
          services: Json
          updated_at: string
          visit_date: string
          visit_type: string
          weight_kg: number | null
        }
        Insert: {
          action_notes?: string | null
          blood_pressure?: string | null
          chw_id: string
          concerns?: string | null
          created_at?: string
          duration_minutes?: number | null
          feeling_scale?: number | null
          fetal_heartbeat?: string | null
          fundal_height_cm?: number | null
          id?: string
          medications?: string | null
          mother_id: string
          next_visit_date?: string | null
          oedema?: string | null
          referral_destination?: string | null
          referred?: boolean
          services?: Json
          updated_at?: string
          visit_date?: string
          visit_type?: string
          weight_kg?: number | null
        }
        Update: {
          action_notes?: string | null
          blood_pressure?: string | null
          chw_id?: string
          concerns?: string | null
          created_at?: string
          duration_minutes?: number | null
          feeling_scale?: number | null
          fetal_heartbeat?: string | null
          fundal_height_cm?: number | null
          id?: string
          medications?: string | null
          mother_id?: string
          next_visit_date?: string | null
          oedema?: string | null
          referral_destination?: string | null
          referred?: boolean
          services?: Json
          updated_at?: string
          visit_date?: string
          visit_type?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_vendor_owner: { Args: { _vendor_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
