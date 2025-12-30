"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { apiDelete } from "@/lib/api-client";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
  };
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  notes?: string;
  rowStatusCd?: "A" | "C" | "D" | "I" | "O"; // Row Status Code
  customer: Customer;
  items: BookingItem[];
}

import { formatDateForDisplay } from "@/lib/date-utils";

interface DeleteBookingButtonProps {
  booking: Booking;
  onBookingDeleted: () => void;
}

export function DeleteBookingButton({
  booking,
  onBookingDeleted,
}: DeleteBookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDelete = async () => {
    try {
      const response = await apiDelete(`/api/bookings/${booking.id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete booking");
      }

      return true;
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      setError(error.message || "Failed to delete booking");
      return false;
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    const deleteSuccess = await performDelete();

    if (deleteSuccess) {
      // Booking was successfully deleted
      setIsOpen(false);
      onBookingDeleted();
    }

    setIsSubmitting(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setError(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateForDisplay(dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1"
        title="Delete Booking"
      >
        <Trash2 size={14} />
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Trash2
                    size={20}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Delete Booking
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete this booking? This action
                  cannot be undone.
                </p>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Booking ID:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        #{booking.id}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Customer:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {booking.customer.name}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Email:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {booking.customer.email}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Status:
                      </span>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Start Date:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {formatDate(booking.startDate)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        End Date:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {formatDate(booking.endDate)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Time:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Total Amount:
                      </span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300 font-semibold">
                        ₹{booking.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Items */}
                {booking.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Rental Items:
                    </div>
                    <div className="space-y-2">
                      {booking.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <div className="text-gray-700 dark:text-gray-300">
                            {item.quantity}x {item.product.name}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            ₹{item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {booking.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Notes:
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {booking.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Deleting..." : "Delete Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
