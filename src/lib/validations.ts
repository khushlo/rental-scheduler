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
  rentPrice: z.number().min(0, "Rent price must be non-negative").default(0),
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
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").default("09:00"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").default("17:00"),
  eventDate: z.date().optional().nullable(),  // Optional event date, can be null or undefined
  totalAmount: z.number().min(0, "Total amount must be positive"),
  advancePayment: z.number().min(0, "Advance payment must be non-negative").default(0),
  notes: z.string().optional(),
  customerId: CustomerIdSchema,
  items: z.array(BookingItemSchema).min(1, "At least one item is required"),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be on or after start date",
  path: ["endDate"],
}).refine((data) => {
  // If same date, ensure end time is after start time
  if (data.startDate.toDateString() === data.endDate.toDateString()) {
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes > startTotalMinutes;
  }
  return true;
}, {
  message: "End time must be after start time for same-day bookings",
  path: ["endTime"],
})

// Search and filter schemas
export const BookingSearchSchema = z.object({
  bookingId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  customerName: z.string().optional(),
  productId: z.number().int().positive().optional(),
  productName: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export const IdLookupSchema = z.object({
  id: IdSchema,
  type: z.enum(["booking", "customer", "product"]),
})

// Availability check schema
export const AvailabilityCheckSchema = z.object({
  productId: ProductIdSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
}).refine((data) => {
  // If times are provided, both must be provided
  if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) {
    return false;
  }
  return true;
}, {
  message: "Both start time and end time must be provided when using time-based checking",
  path: ["endTime"],
}).refine((data) => {
  // Validate date range
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: "End date must be equal to or after start date",
  path: ["endDate"],
}).refine((data) => {
  // If same date and times provided, validate time range
  if (data.startDate === data.endDate && data.startTime && data.endTime) {
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes > startTotalMinutes;
  }
  return true;
}, {
  message: "End time must be after start time for same-day availability checks",
  path: ["endTime"],
})

export type Product = z.infer<typeof ProductSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type BookingItem = z.infer<typeof BookingItemSchema>
export type Booking = z.infer<typeof BookingSchema>
export type BookingSearch = z.infer<typeof BookingSearchSchema>
export type IdLookup = z.infer<typeof IdLookupSchema>
export type AvailabilityCheck = z.infer<typeof AvailabilityCheckSchema>