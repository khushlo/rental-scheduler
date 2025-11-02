"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";

import { formatDateForDisplay } from "@/lib/date-utils";

interface DeleteProductButtonProps {
  product: {
    id: number;
    name: string;
  };
  onProductDeleted: () => void;
}

interface ActiveBooking {
  id: number;
  customerName: string;
  status: string;
  startDate: string;
  endDate: string;
}

export function DeleteProductButton({
  product,
  onProductDeleted,
}: DeleteProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [showActiveBookings, setShowActiveBookings] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products?id=${product.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setIsOpen(false);
        onProductDeleted();
      } else {
        // Handle case where product has active bookings
        if (response.status === 400 && data.activeBookings) {
          setActiveBookings(data.activeBookings);
          setShowActiveBookings(true);
        } else {
          console.error("Failed to delete product:", data.error);
          alert("Failed to delete product: " + data.error);
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowActiveBookings(false);
    setActiveBookings([]);
  };

  if (showActiveBookings) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={handleClose}
          ></div>

          {/* Modal content */}
          <div className="relative inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full mx-4">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Cannot Delete Product
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  This product cannot be deleted because it has active, pending,
                  or confirmed bookings:
                </p>

                <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-48 overflow-y-auto">
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="mb-2 last:mb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Booking #{booking.id} - {booking.customerName}
                          </p>
                          <p className="text-xs text-red-600">
                            Status: {booking.status}
                          </p>
                          <p className="text-xs text-red-600">
                            {formatDateForDisplay(booking.startDate)} -{" "}
                            {formatDateForDisplay(booking.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-600 mt-3">
                  Please wait for these bookings to be completed or cancelled
                  before deleting this product.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
        title="Delete Product"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>

        {/* Modal content */}
        <div className="relative inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full mx-4">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Product
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete{" "}
                <strong>"{product.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone. The product will be permanently
                removed from your inventory.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
