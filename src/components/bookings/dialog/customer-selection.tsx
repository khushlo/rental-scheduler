'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  address?: string;
}

interface CustomerSelectionProps {
  selectedCustomer: Customer | null;
  customerSearchTerm: string;
  onCustomerSearchChange: (term: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  onClearSelection: () => void;
  onShowAddCustomer: () => void;
  isSubmitting: boolean;
}

export function CustomerSelection({
  selectedCustomer,
  customerSearchTerm,
  onCustomerSearchChange,
  onCustomerSelect,
  onClearSelection,
  onShowAddCustomer,
  isSubmitting
}: CustomerSelectionProps) {
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced customer search
  useEffect(() => {
    if (customerSearchTerm.length >= 2 && !selectedCustomer) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/customers/search?q=${encodeURIComponent(customerSearchTerm)}`);
          if (response.ok) {
            const suggestions = await response.json();
            setCustomerSuggestions(suggestions);
          }
        } catch (error) {
          console.error('Error searching customers:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setCustomerSuggestions([]);
    }
  }, [customerSearchTerm, selectedCustomer]);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Customer Information</h3>
      </div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search for existing customer or enter new customer name"
              value={customerSearchTerm}
              onChange={(e) => onCustomerSearchChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
            />
            {selectedCustomer && (
              <button
                type="button"
                onClick={onClearSelection}
                disabled={isSubmitting}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onShowAddCustomer}
            disabled={isSubmitting}
            className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Add new customer"
          >
            <UserPlus size={16} />
          </button>
        </div>

        {/* Customer Search Results */}
        {isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg top-full left-0">
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              Searching...
            </div>
          </div>
        )}
        {!isSearching && customerSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full left-0">
            {customerSuggestions.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onCustomerSelect(customer)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{customer.phone1}</div>
                {customer.phone2 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{customer.phone2}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {!isSearching && customerSearchTerm.length >= 2 && customerSuggestions.length === 0 && !selectedCustomer && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg top-full left-0">
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              No customers found. A new customer will be created with this name.
            </div>
          </div>
        )}
      </div>
      {selectedCustomer && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="font-medium text-blue-900 dark:text-blue-100">{selectedCustomer.name}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">{selectedCustomer.phone1}</div>
          {selectedCustomer.phone2 && (
            <div className="text-sm text-blue-700 dark:text-blue-300">{selectedCustomer.phone2}</div>
          )}
          {selectedCustomer.address && (
            <div className="text-sm text-blue-700 dark:text-blue-300">{selectedCustomer.address}</div>
          )}
        </div>
      )}
    </div>
  );
}