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
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          monthly_income: number | null
          monthly_expenses: number | null
          savings_goal: number | null
          main_expense_categories: string[] | null
          currency: string | null
          language: string | null
          timezone: string | null
          is_onboarded: boolean | null
          notifications_enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          monthly_income?: number | null
          monthly_expenses?: number | null
          savings_goal?: number | null
          main_expense_categories?: string[] | null
          currency?: string | null
          language?: string | null
          timezone?: string | null
          is_onboarded?: boolean | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          monthly_income?: number | null
          monthly_expenses?: number | null
          savings_goal?: number | null
          main_expense_categories?: string[] | null
          currency?: string | null
          language?: string | null
          timezone?: string | null
          is_onboarded?: boolean | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          created_at: string | null
          last_used_at: string | null
          revoked_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          key_hash: string
          created_at?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          created_at?: string | null
          last_used_at?: string | null
          revoked_at?: string | null
          expires_at?: string | null
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          name: string
          card_type: string
          brand: string
          color: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          card_type: string
          brand: string
          color?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          card_type?: string
          brand?: string
          color?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          card_id: string | null
          type: string
          amount: number
          category: string
          description: string | null
          transaction_date: string
          is_recurring: boolean | null
          recurring_frequency: string | null
          tags: string[] | null
          source: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          card_id?: string | null
          type: string
          amount: number
          category: string
          description?: string | null
          transaction_date?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          tags?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string | null
          type?: string
          amount?: number
          category?: string
          description?: string | null
          transaction_date?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          tags?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: string
          icon: string | null
          color: string | null
          is_system: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          icon?: string | null
          color?: string | null
          is_system?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          icon?: string | null
          color?: string | null
          is_system?: boolean | null
          created_at?: string | null
        }
      }
    }
    Views: {
      user_stats: {
        Row: {
          user_id: string | null
          full_name: string | null
          total_transactions: number | null
          total_expenses_count: number | null
          total_income_count: number | null
          total_expenses_amount: number | null
          total_income_amount: number | null
          active_cards_count: number | null
        }
      }
      monthly_summary: {
        Row: {
          user_id: string | null
          month: string | null
          transaction_count: number | null
          expenses: number | null
          income: number | null
          net: number | null
        }
      }
    }
    Functions: {
      validate_api_key: {
        Args: {
          token_hash: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}