import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

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

export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled';

export function calculateBookingStatus(
  startDate: string | Date,
  endDate: string | Date,
  cancelled?: boolean,
  rowStatusCd?: string
): BookingStatus {
  if (cancelled) return 'cancelled';
  
  // If rowStatusCd is 'C' (Completed), return completed regardless of date logic
  if (rowStatusCd === 'C') return 'completed';
  
  const now = new Date();
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  
  // Calculate days difference between start date and current date
  const timeDiff = start.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Apply the new status logic:
  // IF start date > current date + 5 days then 'Confirmed'
  if (daysDiff > 5) return 'confirmed';
  
  // IF current date - 4 days <= start date <= current date + 5 days Then 'Active'
  if (daysDiff >= -4 && daysDiff <= 5) return 'active';
  
  // IF current date - 4 days > start date then 'Completed' OR if rowStatusCd = 'C'
  if (daysDiff < -4) return 'completed';
  
  return 'completed'; // fallback
}

export function getBookingStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'text-blue-600 bg-blue-50 dark:text-blue-600';
    case 'active':
      return 'text-green-600 bg-green-50 dark:text-green-600';
    case 'completed':
      return 'text-gray-600 bg-gray-50 dark:text-gray-600';
    case 'cancelled':
      return 'text-red-600 bg-red-50 dark:text-red-600';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-600';
  }
}

// Row Status Code utilities
export type RowStatusCode = 'A' | 'C' | 'D' | 'I' | 'O';

export function getRowStatusInfo(statusCd?: RowStatusCode): { label: string; color: string; icon: string } {
  switch (statusCd) {
    case 'C':
      return { 
        label: 'Completed', 
        color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
        icon: '✓'
      };
    case 'D':
      return { 
        label: 'Deleted', 
        color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
        icon: '✗'
      };
    case 'I':
      return { 
        label: 'Inactive', 
        color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20',
        icon: '◯'
      };
    case 'O':
      return { 
        label: 'Obsolete', 
        color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
        icon: '⚠'
      };
    case 'A':
    default:
      return { 
        label: 'Active', 
        color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
        icon: '●'
      };
  }
}

// Utility functions
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Safe date formatting function to prevent hydration mismatches
// This function should be used in client components that might cause SSR/CSR differences
export function safeFormatDate(
  dateString: string,
  formatStr: string = "dd MMM, yyyy",
  isMounted: boolean = true
): string {
  if (!isMounted) return dateString; // Return raw string during SSR
  try {
    return format(new Date(dateString), formatStr);
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
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

export function combineDateTime(date: string | Date, time: string): Date {
  // Utility function to combine date and time into a full DateTime object
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
}

export function formatDateTimeRange(startDate: string | Date, endDate: string | Date, startTime?: string, endTime?: string): string {
  // Format a date/time range for display
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const startDateStr = formatDate(start);
  const endDateStr = formatDate(end);
  
  if (startTime && endTime) {
    const startTimeStr = formatTime(startTime);
    const endTimeStr = formatTime(endTime);
    
    if (startDateStr === endDateStr) {
      // Same day
      return `${startDateStr} ${startTimeStr} - ${endTimeStr}`;
    } else {
      // Different days
      return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
    }
  } else {
    // Date only
    if (startDateStr === endDateStr) {
      return startDateStr;
    } else {
      return `${startDateStr} - ${endDateStr}`;
    }
  }
}

export function checkTimeOverlap(
  start1: Date, end1: Date,
  start2: Date, end2: Date
): boolean {
  // Check if two time periods overlap
  // Two periods overlap if: start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
}
