"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { apiPost } from "@/lib/api-client";

interface AddProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductForm({
  isOpen,
  onClose,
  onProductAdded,
}: AddProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    rentPrice: 0,
    delayInHours: 0,
    status: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (formData.quantity < 0) {
      setError("Quantity must be non-negative");
      return;
    }
    if (formData.rentPrice < 0) {
      setError("Rent price must be non-negative");
      return;
    }
    if (formData.delayInHours < 0) {
      setError("Delay hours must be non-negative");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiPost("/api/products", formData);

      if (response.ok) {
        setFormData({
          name: "",
          quantity: 1,
          rentPrice: 0,
          delayInHours: 0,
          status: true,
        });
        onProductAdded();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create product");
      }
    } catch (error: any) {
      console.error("Error creating product:", error);
      if (error.status === 401) {
        // Handled by API client
        return;
      }
      setError(error.error || "Failed to create product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({
      name: "",
      quantity: 1,
      rentPrice: 0,
      delayInHours: 0,
      status: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  // Don't render during SSR
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add New Product
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              value={formData.quantity || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setFormData((prev) => ({ ...prev, quantity: 0 }));
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setFormData((prev) => ({ ...prev, quantity: numValue }));
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rent Price (₹/day)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.rentPrice || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setFormData((prev) => ({ ...prev, rentPrice: 0 }));
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setFormData((prev) => ({ ...prev, rentPrice: numValue }));
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delay Hours
            </label>
            <input
              type="number"
              min="0"
              value={formData.delayInHours || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setFormData((prev) => ({ ...prev, delayInHours: 0 }));
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setFormData((prev) => ({
                      ...prev,
                      delayInHours: numValue,
                    }));
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              placeholder="Hours to wait before next booking (optional)"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="productStatus"
              checked={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.checked }))
              }
              disabled={isSubmitting}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
            />
            <label
              htmlFor="productStatus"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
