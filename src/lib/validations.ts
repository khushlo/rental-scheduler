import { z } from "zod"

// ID validation schemas
export const IdSchema = z.number().int().positive("ID must be a positive integer")
export const OptionalIdSchema = z.number().int().positive().optional()

// Entity ID schemas
export const BookingIdSchema = z.number().int().positive("Booking ID must be a positive integer")
export const CustomerIdSchema = z.number().int().positive("Customer ID must be a positive integer")
export const ProductIdSchema = z.number().int().positive("Product ID must be a positive integer")

export const ProductSchema = z.object({
  id: OptionalIdSchema,
  name: z.string().min(1, "Product name is required"),
  quantity: z.number().min(0, "Quantity must be non-negative").default(1),
  rentPrice: z.number().min(0, "Rent price must be positive"),
  status: z.boolean().default(true),
})

export const CustomerSchema = z.object({
  id: OptionalIdSchema,
  name: z.string().min(1, "Customer name is required"),
  phone1: z.string().min(1, "Primary phone number is required"),
  phone2: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const BookingItemSchema = z.object({
  id: OptionalIdSchema,
  productId: ProductIdSchema,
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
  pricePerDay: z.number().min(0, "Price must be positive"),
  subtotal: z.number().min(0, "Subtotal must be positive").optional(),
  notes: z.string().optional(),
})

export const BookingSchema = z.object({
  id: OptionalIdSchema,
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string().default("09:00"),
  endTime: z.string().default("17:00"),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  advancePayment: z.number().min(0, "Advance payment must be non-negative").default(0),
  notes: z.string().optional(),
  customerId: CustomerIdSchema,
  items: z.array(BookingItemSchema).min(1, "At least one item is required"),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Search and filter schemas
export const BookingSearchSchema = z.object({
  bookingId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  customerName: z.string().optional(),
  productId: z.number().int().positive().optional(),
  productName: z.string().optional(),
  status: z.enum(["CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export const IdLookupSchema = z.object({
  id: IdSchema,
  type: z.enum(["booking", "customer", "product"]),
})

export type Product = z.infer<typeof ProductSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type BookingItem = z.infer<typeof BookingItemSchema>
export type Booking = z.infer<typeof BookingSchema>
export type BookingSearch = z.infer<typeof BookingSearchSchema>
export type IdLookup = z.infer<typeof IdLookupSchema>