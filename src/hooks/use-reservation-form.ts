import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const reservationSchema = z.object({
  serviceId: z.number().positive("Please select a service"),
  staffId: z.number().positive("Please select a staff member"),
  start: z.date(),
  customer: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional()
  })
})

export type ReservationFormData = z.infer<typeof reservationSchema>

export function useReservationForm() {
  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    mode: "onSubmit",
    defaultValues: {
      serviceId: 0,
      staffId: 0,
      start: new Date(),
      customer: {
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      }
    }
  })

  return form
} 