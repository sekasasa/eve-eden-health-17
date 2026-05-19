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
      mothers: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          dietary_notes: string | null
          due_date: string | null
          full_name: string | null
          id: string
          is_first_pregnancy: boolean | null
          language: string | null
          phone: string | null
          preferred_provider_id: string | null
          pregnancy_week: number | null
          religious_pref: string | null
          user_id: string
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          dietary_notes?: string | null
          due_date?: string | null
          full_name?: string | null
          id?: string
          is_first_pregnancy?: boolean | null
          language?: string | null
          phone?: string | null
          preferred_provider_id?: string | null
          pregnancy_week?: number | null
          religious_pref?: string | null
          user_id: string
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          dietary_notes?: string | null
          due_date?: string | null
          full_name?: string | null
          id?: string
          is_first_pregnancy?: boolean | null
          language?: string | null
          phone?: string | null
          preferred_provider_id?: string | null
          pregnancy_week?: number | null
          religious_pref?: string | null
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
          language: string | null
          phone: string | null
          user_type: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          phone?: string | null
          user_type: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          phone?: string | null
          user_type?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          accepting_patients: boolean | null
          avg_rating: number | null
          bio: string | null
          city: string | null
          clinic_name: string | null
          consultation_fee_mad: number | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          review_count: number | null
          specialty: string | null
          user_id: string
        }
        Insert: {
          accepting_patients?: boolean | null
          avg_rating?: number | null
          bio?: string | null
          city?: string | null
          clinic_name?: string | null
          consultation_fee_mad?: number | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          review_count?: number | null
          specialty?: string | null
          user_id: string
        }
        Update: {
          accepting_patients?: boolean | null
          avg_rating?: number | null
          bio?: string | null
          city?: string | null
          clinic_name?: string | null
          consultation_fee_mad?: number | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          review_count?: number | null
          specialty?: string | null
          user_id?: string
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
      vendors: {
        Row: {
          business_name: string | null
          category: string | null
          city: string | null
          commission_rate: number | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          user_id: string
        }
        Insert: {
          business_name?: string | null
          category?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          user_id: string
        }
        Update: {
          business_name?: string | null
          category?: string | null
          city?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          user_id?: string
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
