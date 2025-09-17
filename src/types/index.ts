// src/types/index.ts
import { Database } from './database.types'

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert']
export type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update']

export type Card = Database['public']['Tables']['cards']['Row']
export type CardInsert = Database['public']['Tables']['cards']['Insert']
export type CardUpdate = Database['public']['Tables']['cards']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Category = Database['public']['Tables']['categories']['Row']

// Transaction types
export type TransactionType = 'income' | 'expense'
export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type TransactionSource = 'web' | 'shortcut' | 'api' | 'import'

// Card types
export type CardType = 'credit' | 'debit'
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'other'

// API Key response for client
export interface ApiKeyResponse {
  id: string
  name: string
  created_at: string | null
  last_used_at: string | null
  revoked_at: string | null
  expires_at: string | null
}

export interface CreateApiKeyResponse {
  token: string // This will be "keyId.plainToken"
  api_key: ApiKeyResponse
}