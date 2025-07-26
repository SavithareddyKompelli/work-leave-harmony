import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          auth_id: string
          email: string
          full_name: string
          employee_id: string
          role: 'employee' | 'manager' | 'admin'
          employment_type: 'full_time' | 'intern' | 'trainee'
          department: string | null
          manager_id: string | null
          join_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          auth_id: string
          email: string
          full_name: string
          employee_id: string
          role?: 'employee' | 'manager' | 'admin'
          employment_type?: 'full_time' | 'intern' | 'trainee'
          department?: string
          manager_id?: string
          join_date: string
        }
      }
      leave_applications: {
        Row: {
          id: string
          user_id: string
          leave_type: 'sick' | 'casual' | 'vacation' | 'academic' | 'comp_off'
          start_date: string
          end_date: string
          total_days: number
          reason: string
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          applied_at: string
          approved_by: string | null
          approved_at: string | null
          rejected_reason: string | null
          cancelled_at: string | null
          documents: any
          is_emergency: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          leave_type: 'sick' | 'casual' | 'vacation' | 'academic' | 'comp_off'
          start_date: string
          end_date: string
          total_days: number
          reason: string
          is_emergency?: boolean
          documents?: any
        }
      }
      leave_balances: {
        Row: {
          id: string
          user_id: string
          leave_type: 'sick' | 'casual' | 'vacation' | 'academic' | 'comp_off'
          year: number
          opening_balance: number
          accrued: number
          used: number
          carried_forward: number
          lop_days: number
          current_balance: number
          created_at: string
          updated_at: string
        }
      }
    }
  }
}