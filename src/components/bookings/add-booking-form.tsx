'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { BookingDialog } from './booking-dialog';

interface AddBookingFormProps {
  onBookingAdded: () => void;
}

export function AddBookingForm({ onBookingAdded }: AddBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Plus size={16} />
        New Booking
      </button>

      <BookingDialog
        mode="add"
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={onBookingAdded}
      />
    </>
  );
}

