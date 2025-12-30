'use client';

import { useState, useCallback, useRef } from 'react';
import { apiGet } from '@/lib/api-client';

interface AvailabilityError {
  message: string;
  conflictingBookings: {
    id: number;
    customer: string;
    quantity: number;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
  }[];
}

interface ItemAvailability {
  [itemIndex: number]: AvailabilityError | null;
}

interface BookingItem {
  productId: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  itemStartDate?: string;
  itemEndDate?: string;
  itemStartTime?: string;
  itemEndTime?: string;
  hasCustomTiming?: boolean;
}

interface UseAvailabilityProps {
  formData: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    items: BookingItem[];
  };
  excludeBookingId?: number;
}

export function useAvailability({ formData, excludeBookingId }: UseAvailabilityProps) {
  const [itemAvailability, setItemAvailability] = useState<ItemAvailability>({});
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  const checkItemAvailability = useCallback(async (itemIndex: number, productId: number, quantity: number) => {
    if (productId <= 0 || quantity <= 0) {
      setItemAvailability(prev => ({ ...prev, [itemIndex]: null }));
      return;
    }

    try {
      const item = formData.items[itemIndex];
      
      // Determine effective dates and times for this item
      const effectiveStartDate = item?.itemStartDate || formData.startDate;
      const effectiveEndDate = item?.itemEndDate || formData.endDate;
      const effectiveStartTime = item?.itemStartTime || formData.startTime;
      const effectiveEndTime = item?.itemEndTime || formData.endTime;

      const params = new URLSearchParams({
        productId: productId.toString(),
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        startTime: effectiveStartTime,
        endTime: effectiveEndTime,
        quantity: quantity.toString(),
      });

      if (excludeBookingId) {
        params.append('excludeBookingId', excludeBookingId.toString());
      }

      const response = await apiGet(`/api/availability?${params}`);
      const data = await response.json();

      if (!data.available) {
        setItemAvailability(prev => ({
          ...prev,
          [itemIndex]: {
            message: data.reason || 'Item not available',
            conflictingBookings: data.conflictingBookings || []
          }
        }));
      } else {
        setItemAvailability(prev => ({ ...prev, [itemIndex]: null }));
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setItemAvailability(prev => ({
        ...prev,
        [itemIndex]: {
          message: 'Error checking availability',
          conflictingBookings: []
        }
      }));
    }
  }, [formData, excludeBookingId]);

  const validateAllItems = useCallback(() => {
    formData.items.forEach((item, index) => {
      if (item.productId > 0 && item.quantity > 0) {
        checkItemAvailability(index, item.productId, item.quantity);
      }
    });
  }, [formData.items, checkItemAvailability]);

  const debouncedValidateItem = useCallback((itemIndex: number, productId: number, quantity: number) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const timeoutId = setTimeout(() => {
      checkItemAvailability(itemIndex, productId, quantity);
    }, 500);

    setValidationTimeout(timeoutId);
  }, [validationTimeout, checkItemAvailability]);

  const refreshAvailability = useCallback(() => {
    validateAllItems();
  }, [validateAllItems]);

  const clearItemAvailability = useCallback((itemIndex: number) => {
    setItemAvailability(prev => ({ ...prev, [itemIndex]: null }));
  }, []);

  const reindexAvailability = useCallback((removedIndex: number) => {
    setItemAvailability(prev => {
      const newAvailability: ItemAvailability = {};
      Object.keys(prev).forEach(key => {
        const idx = parseInt(key);
        if (idx < removedIndex) {
          newAvailability[idx] = prev[idx];
        } else if (idx > removedIndex) {
          newAvailability[idx - 1] = prev[idx];
        }
      });
      return newAvailability;
    });
  }, []);

  return {
    itemAvailability,
    checkItemAvailability: debouncedValidateItem,
    validateAllItems,
    refreshAvailability,
    clearItemAvailability,
    reindexAvailability
  };
}