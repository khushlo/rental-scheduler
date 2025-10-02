import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatId(id: string | number): string {
  const idStr = id.toString();
  return idStr.padStart(3, '0');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function searchInIds(ids: (string | number)[], searchTerm: string): boolean {
  return ids.some(id => 
    formatId(id).toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export function calculateBookingStatus(
  startDate: string,
  endDate: string,
  cancelled?: boolean
): BookingStatus {
  if (cancelled) return 'cancelled';
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'active';
  return 'completed';
}

export function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'upcoming':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    case 'active':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    case 'completed':
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    case 'cancelled':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
  }
}

// Database status type for API routes
export type DbBookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Function for updating database booking statuses (used in API routes)
export function determineBookingStatus(
  startDate: string | Date,
  endDate: string | Date,
  currentStatus: string
): DbBookingStatus {
  // Don't change cancelled bookings
  if (currentStatus === 'CANCELLED') return 'CANCELLED';
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'CONFIRMED';
  if (now >= start && now <= end) return 'ACTIVE';
  return 'COMPLETED';
}

// Additional utility functions that might be useful
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

export function formatTime(time: string): string {
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
