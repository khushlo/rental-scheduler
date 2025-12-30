"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { clearCustomersCache } from "@/lib/customers-cache";
import { useApiMutation } from "@/hooks/useApi";

interface AddCustomerFormProps {
  onCustomerAdded: () => void;
}

export function AddCustomerForm({ onCustomerAdded }: AddCustomerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone1: "",
    phone2: "",
    address: "",
    notes: "",
  });

  const {
    mutate: createCustomer,
    loading: isSubmitting,
    error,
  } = useApiMutation("POST");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCustomer("/api/customers", {
        name: formData.name.trim(),
        phone1: formData.phone1.trim(),
        phone2: formData.phone2.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      // Clear customers cache since a new customer was created
      clearCustomersCache();
      setFormData({
        name: "",
        phone1: "",
        phone2: "",
        address: "",
        notes: "",
      });
      setIsOpen(false);
      onCustomerAdded();
    } catch (error) {
      console.error("Error creating customer:", error);
      // Error is handled by the useApiMutation hook
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setFormData({
        name: "",
        phone1: "",
        phone2: "",
        address: "",
        notes: "",
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Plus size={16} />
        Add Customer
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Add New Customer
              </h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label
                  htmlFor="phone1"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Primary Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone1"
                  name="phone1"
                  value={formData.phone1}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  placeholder="Enter primary phone number"
                />
              </div>

              <div>
                <label
                  htmlFor="phone2"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  id="phone2"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  placeholder="Enter secondary phone number (optional)"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
                  placeholder="Enter any additional notes"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.name.trim() ||
                    !formData.phone1.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
