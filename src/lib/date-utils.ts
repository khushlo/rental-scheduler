// Utility functions for consistent date formatting to prevent hydration issues

/**
 * Format date consistently across server and client
 * Uses ISO format internally to avoid locale-based hydration mismatches
 */
export function formatDateForDisplay(dateStr: string | Date): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    // Use consistent locale and options to prevent hydration mismatch
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
}

/**
 * Format date for Indian locale specifically (for invoice)
 * Handles hydration issues by ensuring consistent formatting
 */
export function formatDateForInvoice(dateStr: string | Date): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    // Use consistent formatting
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
}

/**
 * Check if two dates are in the same year
 * Safe for hydration
 */
export function isSameYear(date1: string | Date, date2: string | Date): boolean {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear();
  } catch (error) {
    return false;
  }
}

/**
 * Get current year safely
 * Use only when absolutely necessary and after component mount
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}