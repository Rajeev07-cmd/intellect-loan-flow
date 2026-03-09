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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          business_description: string | null
          cibil_score: number | null
          cin: string | null
          company_email: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          credit_officer_decision: string | null
          default_probability: number | null
          final_status: string | null
          id: string
          incorporation_year: string | null
          interest_rate: string | null
          loan_amount: number
          manager_decision: string | null
          promoter_group: string | null
          recommendation: string | null
          registered_address: string | null
          risk_category: string | null
          risk_score: number | null
          sector: string
          status: string
          suggested_limit: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_description?: string | null
          cibil_score?: number | null
          cin?: string | null
          company_email?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          credit_officer_decision?: string | null
          default_probability?: number | null
          final_status?: string | null
          id?: string
          incorporation_year?: string | null
          interest_rate?: string | null
          loan_amount: number
          manager_decision?: string | null
          promoter_group?: string | null
          recommendation?: string | null
          registered_address?: string | null
          risk_category?: string | null
          risk_score?: number | null
          sector: string
          status?: string
          suggested_limit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_description?: string | null
          cibil_score?: number | null
          cin?: string | null
          company_email?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          credit_officer_decision?: string | null
          default_probability?: number | null
          final_status?: string | null
          id?: string
          incorporation_year?: string | null
          interest_rate?: string | null
          loan_amount?: number
          manager_decision?: string | null
          promoter_group?: string | null
          recommendation?: string | null
          registered_address?: string | null
          risk_category?: string | null
          risk_score?: number | null
          sector?: string
          status?: string
          suggested_limit?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          application_id: string | null
          created_at: string
          event_description: string
          event_type: string
          id: string
          user_name: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          user_name?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      cam_reports: {
        Row: {
          application_id: string
          company_overview: string | null
          created_at: string
          financial_analysis: string | null
          id: string
          interest_rate: string | null
          recommendation: string | null
          risk_analysis: string | null
          suggested_loan_limit: string | null
        }
        Insert: {
          application_id: string
          company_overview?: string | null
          created_at?: string
          financial_analysis?: string | null
          id?: string
          interest_rate?: string | null
          recommendation?: string | null
          risk_analysis?: string | null
          suggested_loan_limit?: string | null
        }
        Update: {
          application_id?: string
          company_overview?: string | null
          created_at?: string
          financial_analysis?: string | null
          id?: string
          interest_rate?: string | null
          recommendation?: string | null
          risk_analysis?: string | null
          suggested_loan_limit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cam_reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extracted_fields: {
        Row: {
          application_id: string
          confidence_score: number | null
          coordinates: Json | null
          created_at: string
          document_id: string
          field_name: string
          field_value: string | null
          id: string
          is_manually_verified: boolean | null
          page_number: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          confidence_score?: number | null
          coordinates?: Json | null
          created_at?: string
          document_id: string
          field_name: string
          field_value?: string | null
          id?: string
          is_manually_verified?: boolean | null
          page_number?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          confidence_score?: number | null
          coordinates?: Json | null
          created_at?: string
          document_id?: string
          field_name?: string
          field_value?: string | null
          id?: string
          is_manually_verified?: boolean | null
          page_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extracted_fields_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extracted_fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          created_at: string
          document_name: string
          document_type: string
          file_path: string
          file_size: string | null
          file_url: string | null
          id: string
          user_id: string | null
          verification_status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_name: string
          document_type: string
          file_path: string
          file_size?: string | null
          file_url?: string | null
          id?: string
          user_id?: string | null
          verification_status?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          file_path?: string
          file_size?: string | null
          file_url?: string | null
          id?: string
          user_id?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_features: {
        Row: {
          application_id: string
          collateral_score: number | null
          created_at: string
          debt_ratio: number | null
          id: string
          interest_coverage_ratio: number | null
          litigation_count: number | null
          profit_margin: number | null
          revenue_growth: number | null
          sector_risk: number | null
        }
        Insert: {
          application_id: string
          collateral_score?: number | null
          created_at?: string
          debt_ratio?: number | null
          id?: string
          interest_coverage_ratio?: number | null
          litigation_count?: number | null
          profit_margin?: number | null
          revenue_growth?: number | null
          sector_risk?: number | null
        }
        Update: {
          application_id?: string
          collateral_score?: number | null
          created_at?: string
          debt_ratio?: number | null
          id?: string
          interest_coverage_ratio?: number | null
          litigation_count?: number | null
          profit_margin?: number | null
          revenue_growth?: number | null
          sector_risk?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_features_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          application_id: string | null
          created_at: string
          description: string
          id: string
          is_read: boolean
          notification_type: string | null
          role: string | null
          severity: string
          title: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_read?: boolean
          notification_type?: string | null
          role?: string | null
          severity?: string
          title: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean
          notification_type?: string | null
          role?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      risk_results: {
        Row: {
          application_id: string
          created_at: string
          default_probability: number | null
          explanation: Json | null
          id: string
          risk_category: string | null
          risk_score: number | null
        }
        Insert: {
          application_id: string
          created_at?: string
          default_probability?: number | null
          explanation?: Json | null
          id?: string
          risk_category?: string | null
          risk_score?: number | null
        }
        Update: {
          application_id?: string
          created_at?: string
          default_probability?: number | null
          explanation?: Json | null
          id?: string
          risk_category?: string | null
          risk_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_results_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_status: {
        Row: {
          application_id: string
          current_stage: string
          id: string
          stage_history: Json | null
          updated_at: string
        }
        Insert: {
          application_id: string
          current_stage?: string
          id?: string
          stage_history?: Json | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          current_stage?: string
          id?: string
          stage_history?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_status_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "credit_officer" | "manager" | "admin"
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
    Enums: {
      app_role: ["credit_officer", "manager", "admin"],
    },
  },
} as const
