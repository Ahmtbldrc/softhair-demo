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
      staff: {
        Row: {
          id: number
          firstName: string
          lastName: string
          email: string
          username: string
          image: string | null
          status: boolean
          weeklyHours: WeeklyHours
          userId: string
          branchId: number
          password: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          firstName: string
          lastName: string
          email: string
          username: string
          image?: string | null
          status?: boolean
          weeklyHours?: WeeklyHours
          userId: string
          branchId: number
          password: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          firstName?: string
          lastName?: string
          email?: string
          username?: string
          image?: string | null
          status?: boolean
          weeklyHours?: WeeklyHours
          userId?: string
          branchId?: number
          password?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      services: {
        Row: {
          id: number
          name: string
          price: number
          duration: number
          status: boolean
          branchId: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          price: number
          duration: number
          status?: boolean
          branchId: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          price?: number
          duration?: number
          status?: boolean
          branchId?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      branches: {
        Row: {
          id: number
          name: string
          status: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          status?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          status?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      reservations: {
        Row: {
          id: number
          serviceId: number
          staffId: number
          branchId: number
          start: string
          end: string
          customer: Json
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          serviceId: number
          staffId: number
          branchId: number
          start: string
          end: string
          customer: Json
          status?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          serviceId?: number
          staffId?: number
          branchId?: number
          start?: string
          end?: string
          customer?: Json
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      staff_services: {
        Row: {
          id: number
          staffId: number
          serviceId: number
          created_at: string
        }
        Insert: {
          id?: number
          staffId: number
          serviceId: number
          created_at?: string
        }
        Update: {
          id?: number
          staffId?: number
          serviceId?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Table types
export type StaffTable = Tables<'staff'>
export type Service = Tables<'services'>
export type Branch = Tables<'branches'>
export type Reservation = Tables<'reservations'>
export type StaffServiceTable = Tables<'staff_services'>

// Custom types that extend database types
export interface TimeSlot {
  start: string
  end: string
}

export interface WeeklyHours {
  SUN: TimeSlot[]
  MON: TimeSlot[]
  TUE: TimeSlot[]
  WED: TimeSlot[]
  THU: TimeSlot[]
  FRI: TimeSlot[]
  SAT: TimeSlot[]
}

export interface StaffServiceWithDetails {
  service: {
    id: number
    name: string
  }
}

export interface Staff extends StaffTable {
  password: string
  userId: string
  branchId: number
}

export interface StaffWithServices extends Staff {
  services: StaffServiceWithDetails[]
  weeklyHours: WeeklyHours
  created_at: string
  updated_at: string | null
  languages: string[]
}

export interface StaffFormData extends Omit<Staff, 'id' | 'userId' | 'created_at' | 'updated_at'> {
  services: number[]
  weeklyHours: WeeklyHours
}

export interface ReservationWithDetails extends Omit<Reservation, 'customer'> {
  customer: {
    id: number
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  service: {
    id: number
    name: string
    price: number
  }
  staff: {
    id: number
    firstName: string
    lastName: string
    email: string
  }
}

export interface ServiceWithBranch extends Service {
  branch: Branch
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user'
}

export enum AnalyticPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
} 