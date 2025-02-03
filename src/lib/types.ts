import { StaffWithServices, ServiceWithBranch, ReservationWithDetails, UserRole, AnalyticPeriod } from './database.types'

export type {
  StaffWithServices as Staff,
  ServiceWithBranch as Service,
  ReservationWithDetails as Reservation
}

export {
  UserRole,
  AnalyticPeriod
}

// Helper Types
export interface TimeSlot {
  start: string;
  end: string;
}

export interface WeeklyHours {
  SUN: TimeSlot[];
  MON: TimeSlot[];
  TUE: TimeSlot[];
  WED: TimeSlot[];
  THU: TimeSlot[];
  FRI: TimeSlot[];
  SAT: TimeSlot[];
}

// Form Types
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

