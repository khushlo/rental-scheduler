'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Package, MessageSquare, Clock } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  quantity: number;
  rentPrice: number;
  status: boolean;
}

interface BookingItem {
  productId: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  itemStartDate?: string;
  itemEndDate?: string;
  itemStartTime?: string;
  itemEndTime?: string;
  hasCustomTiming?: boolean;
}

interface AvailabilityError {
  message: string;
  conflictingBookings: {
    id: number;
    customer: string;
    quantity: number;
    startTime?: string;
    endTime?: string;
  }[];
}

interface BookingItemComponentProps {
  item: BookingItem;
  index: number;
  products: Product[];
  availabilityError: AvailabilityError | null;
  productSearchTerm: string;
  productSuggestions: Product[];
  showProductDropdown: boolean;
  expandedNotes: boolean;
  isSubmitting: boolean;
  onItemUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onProductSearch: (value: string) => void;
  onProductSelect: (product: Product) => void;
  onClearProduct: () => void;
  onToggleNotes: () => void;
  onToggleCustomTiming: () => void;
  onShowAddProduct: () => void;
}

export function BookingItemComponent({
  item,
  index,
  products,
  availabilityError,
  productSearchTerm,
  productSuggestions,
  showProductDropdown,
  expandedNotes,
  isSubmitting,
  onItemUpdate,
  onRemove,
  onProductSearch,
  onProductSelect,
  onClearProduct,
  onToggleNotes,
  onToggleCustomTiming,
  onShowAddProduct
}: BookingItemComponentProps) {
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const hasNoteContent = item.notes && item.notes.trim().length > 0;

  return (
    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="grid grid-cols-1 gap-4">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div 
              className="flex-1 relative"
              ref={productDropdownRef}
            >
              <input
                type="text"
                value={productSearchTerm || ''}
                onChange={(e) => onProductSearch(e.target.value)}
                placeholder="Search for a product..."
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
              />
              
              {/* Product Search Results Dropdown */}
              {showProductDropdown && productSuggestions && productSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {productSuggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onProductSelect(product)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none first:rounded-t-lg last:rounded-b-lg block"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        ₹{product.rentPrice}/day • Stock: {product.quantity}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Clear Product Selection Button */}
              {(item.productId > 0 || (productSearchTerm && productSearchTerm.length > 0)) && (
                <button
                  type="button"
                  onClick={onClearProduct}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onShowAddProduct}
              disabled={isSubmitting}
              className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Add new product"
            >
              <Package size={16} />
            </button>
          </div>
        </div>
        
        {/* Availability Error Display */}
        {availabilityError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Item Not Available
                </h3>
                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                  <p>{availabilityError.message}</p>
                  {availabilityError.conflictingBookings.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Conflicting with bookings:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {availabilityError.conflictingBookings.map((booking, bookingIndex) => (
                          <span 
                            key={bookingIndex} 
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-600"
                          >
                            #{booking.id} ({booking.customer} - {booking.quantity} units
                            {booking.startTime && booking.endTime && 
                              ` @ ${booking.startTime}-${booking.endTime}`
                            })
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Quantity, Price/Day, and Subtotal Row */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={item.quantity || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  onItemUpdate('quantity', 0);
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 1) {
                    onItemUpdate('quantity', numValue);
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price/Day <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={item.pricePerDay || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  onItemUpdate('pricePerDay', 0);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    onItemUpdate('pricePerDay', numValue);
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subtotal
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={item.subtotal || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  onItemUpdate('subtotal', 0);
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    onItemUpdate('subtotal', numValue);
                  }
                }
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              title="Enter custom subtotal (overrides auto-calculated value)"
            />
          </div>
          
          <button
            type="button"
            onClick={onRemove}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded disabled:opacity-50 flex items-center justify-center flex-shrink-0"
            title="Remove item"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Item Notes and Custom Timing Buttons */}
        <div className="space-y-3">
          {/* Buttons Row */}
          <div className="flex items-center gap-3">
            {/* Add Note Button */}
            <button
              type="button"
              onClick={onToggleNotes}
              className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                hasNoteContent
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              disabled={isSubmitting}
            >
              <MessageSquare size={16} />
              {hasNoteContent ? 'Edit Note' : 'Add Note'}
              {hasNoteContent && (
                <span className="text-xs font-medium">
                  ({item.notes?.length} chars)
                </span>
              )}
            </button>
            
            {/* Custom Timing Button */}
            <button
              type="button"
              onClick={onToggleCustomTiming}
              className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                item.hasCustomTiming
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              disabled={isSubmitting}
            >
              <Clock size={16} />
              {item.hasCustomTiming ? 'Remove Custom Timing' : 'Set Custom Timing'}
            </button>
          </div>
          
          {/* Expanded Notes Section */}
          {expandedNotes && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Item Notes
                </label>
                <button
                  type="button"
                  onClick={onToggleNotes}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                  disabled={isSubmitting}
                  title="Collapse notes"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={item.notes || ''}
                onChange={(e) => onItemUpdate('notes', e.target.value)}
                disabled={isSubmitting}
                placeholder="Enter notes for this item..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>
        
        {/* Custom Timing Fields */}
        {item.hasCustomTiming && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
              Custom Timing for This Item
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={item.itemStartDate || ''}
                  onChange={(e) => onItemUpdate('itemStartDate', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-blue-900/30 dark:text-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={item.itemStartTime || ''}
                  onChange={(e) => onItemUpdate('itemStartTime', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-blue-900/30 dark:text-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={item.itemEndDate || ''}
                  onChange={(e) => onItemUpdate('itemEndDate', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-blue-900/30 dark:text-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={item.itemEndTime || ''}
                  onChange={(e) => onItemUpdate('itemEndTime', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-blue-900/30 dark:text-blue-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}