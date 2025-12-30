/**
 * Hydration-safe utilities to prevent server/client mismatches
 * These utilities ensure consistent rendering between server and client
 */

import { useState, useEffect } from 'react'

/**
 * Hook to safely handle client-only operations
 * Prevents hydration mismatches by ensuring operations only run on client
 */
export function useClientOnly() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}

/**
 * Hook to safely get current date/time on client
 * Prevents hydration mismatches from server/client time differences
 */
export function useCurrentDate(updateInterval?: number) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const isMounted = useClientOnly()

  useEffect(() => {
    if (!isMounted) return

    const updateDate = () => setCurrentDate(new Date())
    
    // Set initial date
    updateDate()
    
    // Set up interval if specified
    if (updateInterval && updateInterval > 0) {
      const interval = setInterval(updateDate, updateInterval)
      return () => clearInterval(interval)
    }
  }, [isMounted, updateInterval])

  return currentDate
}

/**
 * Safely format currency to prevent hydration mismatches
 */
export function useFormatCurrency() {
  const isMounted = useClientOnly()

  return (amount: number): string => {
    if (!isMounted) {
      // Return a basic format during SSR
      return `₹${amount.toFixed(2)}`
    }

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch {
      // Fallback if Intl fails
      return `₹${amount.toFixed(2)}`
    }
  }
}

/**
 * Safely format dates to prevent hydration mismatches
 */
export function useFormatDate() {
  const isMounted = useClientOnly()

  return (date: string | Date, format?: string): string => {
    if (!isMounted) {
      // Return ISO string during SSR for consistency
      return typeof date === 'string' ? date : date.toISOString().split('T')[0]
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      if (format) {
        // If a specific format is requested, try to use it
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        })
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      })
    } catch {
      // Fallback if date parsing fails
      return typeof date === 'string' ? date : date.toISOString().split('T')[0]
    }
  }
}

/**
 * Safely get current month/year for calculations
 * Uses UTC to ensure consistency between server and client
 */
export function getCurrentMonthYear() {
  const now = new Date()
  return {
    month: now.getUTCMonth(),
    year: now.getUTCFullYear()
  }
}