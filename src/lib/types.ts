import { Database } from "./database.types";

export interface TimeSlot {
  start: string;
  end: string;
}

export interface WeeklyHours {
  [key: string]: {
    start: string
    end: string
  }[]
}

// Form Types Data
export type CustomerFormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export type ReservationFormData = {
  serviceId: number
  staffId: number
  branchId: number
  start: Date
  end: Date
  customer: CustomerFormData
}

// API Response Types
export type ApiResponse<T> = {
  data?: T
  error?: string
}

// Chart Types
export enum AnalyticType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly"
}

export type ChartData = {
  name: string
  value: number
  color?: string
}

export enum Roles {
  ADMIN = "admin",
  STAFF = "staff",
  USER = "user"
}

export interface ServiceType {
  id: number;
  name: string;
  service: {
    id: number;
    name: string;
  };
}

export interface StaffType {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  userId: string;
  status: boolean;
  image: string;
  services: ServiceType[];
  weeklyHours: WeeklyHours;
  languages: string[]
}

export interface ServiceDetails {
  id: number;
  name: string;
  price: number;
  status: boolean;
  branchId: number;
  duration?: number;
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

export interface StaffWithServices extends Omit<Staff, 'weeklyHours'> {
  services: StaffServiceWithDetails[]
  weeklyHours: WeeklyHours
  created_at: string
  updated_at: string | null
  languages: string[]
}

export interface StaffFormData extends Omit<Staff, 'id' | 'userId' | 'created_at' | 'updated_at' | 'weeklyHours'> {
  services: number[]
  weeklyHours: WeeklyHours
}

export interface ReservationWithDetails extends Omit<Reservation, 'customer'> {
  customer: {
    id: number
    name: string
    surname: string
    email: string
    phone: string
    gender: string
  }
  service: {
    id: number
    name: string
    price: number
    duration: number
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

export interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  image?: string | null
} 
