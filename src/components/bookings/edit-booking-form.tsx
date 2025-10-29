"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { BookingDialog } from "./booking-dialog";

interface EditBookingFormProps {
  bookingId: number;
  onBookingUpdated: () => void;
}

export function EditBookingForm({
  bookingId,
  onBookingUpdated,
}: EditBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
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
          bookingId={bookingId}
          isOpen={isOpen}
          onClose={handleClose}
          onSuccess={onBookingUpdated}
        />
      )}
    </>
  );
}