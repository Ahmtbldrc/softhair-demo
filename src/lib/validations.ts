import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  price: z.number().min(0, { message: "Price must be greater than or equal to 0" }),
  status: z.boolean().default(true),
  branchId: z.number(),
  duration: z.number().min(5, { message: "Duration must be at least 5 minutes" }),
  subServiceIds: z.array(z.number()).nullable().default(null)
}); 