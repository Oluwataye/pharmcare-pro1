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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          error_message: string | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          status: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      data_retention_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_cleanup_at: string | null
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_cleanup_at?: string | null
          retention_days: number
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_cleanup_at?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          created_at: string
          export_url: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          export_url?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          export_url?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          batch_number: string | null
          category: string
          created_at: string
          expiry_date: string | null
          id: string
          last_updated_at: string
          last_updated_by: string | null
          manufacturer: string | null
          name: string
          price: number
          quantity: number
          reorder_level: number
          sku: string
          unit: string
        }
        Insert: {
          batch_number?: string | null
          category: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          manufacturer?: string | null
          name: string
          price: number
          quantity?: number
          reorder_level?: number
          sku: string
          unit: string
        }
        Update: {
          batch_number?: string | null
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          manufacturer?: string | null
          name?: string
          price?: number
          quantity?: number
          reorder_level?: number
          sku?: string
          unit?: string
        }
        Relationships: []
      }
      print_analytics: {
        Row: {
          cashier_id: string | null
          cashier_name: string | null
          created_at: string
          customer_name: string | null
          error_message: string | null
          error_type: string | null
          id: string
          is_reprint: boolean
          print_duration_ms: number | null
          print_status: string
          receipt_id: string | null
          sale_id: string | null
          sale_type: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string
          customer_name?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          is_reprint?: boolean
          print_duration_ms?: number | null
          print_status: string
          receipt_id?: string | null
          sale_id?: string | null
          sale_type?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string
          customer_name?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          is_reprint?: boolean
          print_duration_ms?: number | null
          print_status?: string
          receipt_id?: string | null
          sale_id?: string | null
          sale_type?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_analytics_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_analytics_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempts: number
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          attempts?: number
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action?: string
          attempts?: number
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string
          id: string
          receipt_data: Json
          sale_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receipt_data: Json
          sale_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receipt_data?: Json
          sale_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_address: string | null
          business_name: string | null
          cashier_email: string | null
          cashier_id: string | null
          cashier_name: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          id: string
          sale_type: string
          status: string
          total: number
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          business_address?: string | null
          business_name?: string | null
          cashier_email?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          sale_type?: string
          status?: string
          total: number
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          business_address?: string | null
          business_name?: string | null
          cashier_email?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          sale_type?: string
          status?: string
          total?: number
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          is_wholesale: boolean | null
          price: number
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          is_wholesale?: boolean | null
          price: number
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          is_wholesale?: boolean | null
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          print_show_address: boolean | null
          print_show_email: boolean | null
          print_show_footer: boolean | null
          print_show_logo: boolean | null
          print_show_phone: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          print_show_address?: boolean | null
          print_show_email?: boolean | null
          print_show_footer?: boolean | null
          print_show_logo?: boolean | null
          print_show_phone?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          print_show_address?: boolean | null
          print_show_email?: boolean | null
          print_show_footer?: boolean | null
          print_show_logo?: boolean | null
          print_show_phone?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_user_data: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_expired_data: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_error_message?: string
          p_event_type: Database["public"]["Enums"]["audit_event_type"]
          p_ip_address?: string
          p_resource_id?: string
          p_resource_type?: string
          p_status?: string
          p_user_agent?: string
          p_user_email: string
          p_user_id: string
          p_user_role: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "SUPER_ADMIN" | "PHARMACIST" | "CASHIER"
      audit_event_type:
        | "LOGIN_SUCCESS"
        | "LOGIN_FAILED"
        | "LOGOUT"
        | "UNAUTHORIZED_ACCESS"
        | "USER_CREATED"
        | "USER_DELETED"
        | "USER_UPDATED"
        | "ROLE_CHANGED"
        | "PASSWORD_RESET"
        | "PASSWORD_CHANGED"
        | "SETTINGS_UPDATED"
        | "DATA_EXPORTED"
        | "DATA_DELETED"
        | "SALE_COMPLETED"
        | "INVENTORY_UPDATED"
        | "BULK_UPLOAD"
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
      app_role: ["SUPER_ADMIN", "PHARMACIST", "CASHIER"],
      audit_event_type: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "LOGOUT",
        "UNAUTHORIZED_ACCESS",
        "USER_CREATED",
        "USER_DELETED",
        "USER_UPDATED",
        "ROLE_CHANGED",
        "PASSWORD_RESET",
        "PASSWORD_CHANGED",
        "SETTINGS_UPDATED",
        "DATA_EXPORTED",
        "DATA_DELETED",
        "SALE_COMPLETED",
        "INVENTORY_UPDATED",
        "BULK_UPLOAD",
      ],
    },
  },
} as const
