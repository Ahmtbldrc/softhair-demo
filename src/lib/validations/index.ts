import { z } from 'zod'

// Customer Schema
export const customerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters')
})

// Reservation Schema
export const reservationSchema = z.object({
  serviceId: z.number().positive(),
  staffId: z.number().positive(),
  branchId: z.number().positive(),
  start: z.date(),
  end: z.date(),
  customer: customerSchema
})

// Staff Schema
export const staffSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  image: z.string().optional(),
  status: z.boolean(),
  services: z.array(z.object({
    service: z.object({
      id: z.number(),
      name: z.string()
    })
  })),
  weeklyHours: z.record(z.array(z.object({
    start: z.string(),
    end: z.string()
  })))
})

// Service Schema
export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  status: z.boolean(),
  branchId: z.number().positive(),
  duration: z.number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(180, 'Duration cannot exceed 180 minutes')
    .multipleOf(5, 'Duration must be in increments of 5 minutes')
})

// Branch Schema
export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  status: z.boolean()
}) 