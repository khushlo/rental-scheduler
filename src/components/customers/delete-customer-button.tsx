"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { apiDelete } from "@/lib/api-client";

interface Customer {
  id: number;
  name: string;
  phone1?: string;
  phone2?: string;
  address?: string;
  notes?: string;
  _count?: {
    bookings: number;
  };
}

interface DeleteCustomerButtonProps {
  customer: Customer;
  onCustomerDeleted: () => void;
}

export function DeleteCustomerButton({
  customer,
  onCustomerDeleted,
}: DeleteCustomerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{
    canDelete: boolean;
    activeBookingsCount: number;
    details: string;
  } | null>(null);

  const checkDeleteValidation = async () => {
    try {
      const response = await apiDelete(`/api/customers?id=${customer.id}`);

      const data = await response.json();

      if (!response.ok && response.status === 409) {
        // Conflict - customer has active bookings
        setValidationError({
          canDelete: false,
          activeBookingsCount: data.activeBookingsCount || 0,
          details: data.details || "Customer has active bookings",
        });
        return false;
      } else if (!response.ok) {
        throw new Error(data.error || "Failed to delete customer");
      }

      return true;
    } catch (error: any) {
      console.error("Error validating customer deletion:", error);
      setError(error.message || "Failed to validate customer deletion");
      return false;
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    setValidationError(null);

    const canDelete = await checkDeleteValidation();

    if (canDelete) {
      // If we got here, the customer was successfully deleted
      setIsOpen(false);
      onCustomerDeleted();
    }

    setIsSubmitting(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
    setValidationError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setError(null);
      setValidationError(null);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-1"
        title="Delete Customer"
      >
        <Trash2 size={14} />
        Delete
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  {validationError && !validationError.canDelete ? (
                    <AlertTriangle
                      size={20}
                      className="text-orange-600 dark:text-orange-400"
                    />
                  ) : (
                    <Trash2
                      size={20}
                      className="text-red-600 dark:text-red-400"
                    />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {validationError && !validationError.canDelete
                    ? "Cannot Delete Customer"
                    : "Delete Customer"}
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

              {validationError && !validationError.canDelete ? (
                <div className="mb-4">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 px-4 py-3 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={16}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="font-medium mb-1">
                          Customer cannot be deleted
                        </div>
                        <div className="text-sm">{validationError.details}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Customer:</strong> {customer.name}
                  </div>
                  {validationError.activeBookingsCount > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <strong>Active Bookings:</strong>{" "}
                      {validationError.activeBookingsCount}
                    </div>
                  )}
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    To delete this customer, please complete or cancel all their
                    active bookings first.
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to delete this customer? This action
                    cannot be undone.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm">
                      <div>
                        <strong>Name:</strong> {customer.name}
                      </div>
                      {customer.phone1 && (
                        <div>
                          <strong>Phone:</strong> {customer.phone1}
                        </div>
                      )}
                      {customer._count && (
                        <div className="mt-2 text-gray-600 dark:text-gray-400">
                          <strong>Total Bookings:</strong>{" "}
                          {customer._count.bookings}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {validationError && !validationError.canDelete
                  ? "Close"
                  : "Cancel"}
              </button>
              {(!validationError || validationError.canDelete) && (
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Deleting..." : "Delete Customer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
