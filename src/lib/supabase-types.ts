
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
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          name: string
          sku: string
          category_id: string | null
          description: string | null
          quantity: number
          unit: string
          price: number
          reorder_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku: string
          category_id?: string | null
          description?: string | null
          quantity: number
          unit: string
          price: number
          reorder_level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          category_id?: string | null
          description?: string | null
          quantity?: number
          unit?: string
          price?: number
          reorder_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: "ADMIN" | "PHARMACIST" | "CASHIER"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: "ADMIN" | "PHARMACIST" | "CASHIER"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: "ADMIN" | "PHARMACIST" | "CASHIER"
          created_at?: string
          updated_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          inventory_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          inventory_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          inventory_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          cashier_id: string | null
          total_amount: number
          payment_method: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cashier_id?: string | null
          total_amount: number
          payment_method: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cashier_id?: string | null
          total_amount?: number
          payment_method?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
