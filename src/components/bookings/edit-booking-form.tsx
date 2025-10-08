'use client';

import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { BookingDialog } from './booking-dialog';

interface Customer {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  address?: string;
}

interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  productId: number;
  itemStartDate?: string | null;
  itemEndDate?: string | null;
  itemStartTime?: string | null;
  itemEndTime?: string | null;
  product: {
    id: number;
    name: string;
    pricePerDay: number;
  };
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventDate?: string;  // Optional event date
  totalAmount: number;
  advancePayment?: number;
  status: string;
  notes?: string;
  customerId: number;
  customer: Customer;
  items: BookingItem[];
}

interface EditBookingFormProps {
  booking: Booking;
  onBookingUpdated: () => void;
}

export function EditBookingForm({ booking, onBookingUpdated }: EditBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Transform booking data to match BookingDialog format
  const transformedBooking = {
    ...booking,
    advancePayment: booking.advancePayment || 0,
    startDate: booking.startDate.split('T')[0],
    endDate: booking.endDate.split('T')[0],
    eventDate: booking.eventDate ? booking.eventDate.split('T')[0] : '',  // Handle optional eventDate
    startTime: booking.startTime || '09:00',
    endTime: booking.endTime || '17:00',
    // Transform items to match the expected format
    items: booking.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      pricePerDay: item.pricePerDay,
      subtotal: item.subtotal,
      notes: item.notes || '',
      itemStartDate: item.itemStartDate ? item.itemStartDate.split('T')[0] : undefined,
      itemEndDate: item.itemEndDate ? item.itemEndDate.split('T')[0] : undefined,
      itemStartTime: item.itemStartTime || undefined,
      itemEndTime: item.itemEndTime || undefined,
      hasCustomTiming: !!(item.itemStartDate && item.itemEndDate && item.itemStartTime && item.itemEndTime)
    }))
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
        title="Edit Booking"
      >
        <Edit3 size={14} />
        Edit
      </button>

      {isOpen && (
        <BookingDialog
          mode="edit"
          booking={transformedBooking}
          isOpen={isOpen}
          onClose={handleClose}
          onSuccess={onBookingUpdated}
        />
      )}
    </>
  );
}