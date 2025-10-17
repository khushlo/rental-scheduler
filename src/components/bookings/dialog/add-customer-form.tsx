'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AddCustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: any) => void;
}

export function AddCustomerForm({ isOpen, onClose, onCustomerAdded }: AddCustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone1: formData.phone1.trim(),
          phone2: formData.phone2.trim() || undefined,
          address: formData.address.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setFormData({
          name: '',
          phone1: '',
          phone2: '',
          address: '',
          notes: ''
        });
        onCustomerAdded(newCustomer);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData({ name: '', phone1: '', phone2: '', address: '', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  // Don't render during SSR
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add New Customer
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
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone1}
              onChange={(e) => setFormData(prev => ({ ...prev, phone1: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              placeholder="Enter primary phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secondary Phone
            </label>
            <input
              type="tel"
              value={formData.phone2}
              onChange={(e) => setFormData(prev => ({ ...prev, phone2: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              placeholder="Enter secondary phone number (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              placeholder="Enter address (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
              rows={3}
              placeholder="Enter any notes (optional)"
            />
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
              disabled={isSubmitting || !formData.name.trim() || !formData.phone1.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}