'use client';

import { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';

// Import the BookingDialog from add-booking-form.tsx
import { AddBookingForm } from './add-booking-form';

interface Customer {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  address?: string;
}

interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  productId: number;
  product: {
    id: number;
    name: string;
    pricePerDay: number;
  };
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  advancePayment?: number;
  status: string;
  notes?: string;
  customerId: number;
  customer: Customer;
  items: BookingItem[];
}

interface EditBookingFormProps {
  booking: Booking;
  onBookingUpdated: () => void;
}

export function EditBookingForm({ booking, onBookingUpdated }: EditBookingFormProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        <EditBookingDialog
          booking={booking}
          onClose={() => setIsOpen(false)}
          onSuccess={onBookingUpdated}
        />
      )}
    </>
  );
}

// Similar structure to AddBookingForm but for editing
import { X, UserPlus, MessageSquare, Plus } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  quantity: number;
  rentPrice: number;
  status: boolean;
}

interface BookingFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  advancePayment: number;
  notes?: string;
  customerId: number;
  items: {
    productId: number;
    quantity: number;
    pricePerDay: number;
    subtotal: number;
    notes?: string;
  }[];
}

interface EditBookingDialogProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

function EditBookingDialog({ booking, onClose, onSuccess }: EditBookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState(booking.customer.name);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(booking.customer);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    address: ''
  });
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<BookingFormData>({
    startDate: booking.startDate.split('T')[0],
    endDate: booking.endDate.split('T')[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    totalAmount: booking.totalAmount,
    advancePayment: booking.advancePayment || 0,
    notes: booking.notes || '',
    customerId: booking.customerId,
    items: booking.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      pricePerDay: item.pricePerDay,
      subtotal: item.subtotal,
      notes: item.notes || ''
    }))
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.status));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const searchCustomers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/customers/search?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerSuggestions(data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearchTerm(value);
    searchCustomers(value);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setCustomerSuggestions([]);
    setFormData(prev => ({ ...prev, customerId: customer.id }));
  };

  const toggleNoteExpansion = (index: number) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const hasNoteContent = (index: number) => {
    return formData.items[index]?.notes && formData.items[index].notes.trim() !== '';
  };

  const createNewCustomer = async () => {
    if (!newCustomerData.name.trim() || !newCustomerData.phone1.trim()) {
      setError('Customer name and primary phone number are required');
      return;
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerData.name.trim(),
          phone1: newCustomerData.phone1.trim(),
          phone2: newCustomerData.phone2.trim() || undefined,
          address: newCustomerData.address.trim() || undefined,
        }),
      });

      if (response.ok) {
        const customer = await response.json();
        selectCustomer(customer);
        setIsNewCustomerModalOpen(false);
        setNewCustomerData({ name: '', phone1: '', phone2: '', address: '' });
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setError('Failed to create customer. Please try again.');
    }
  };

  const addBookingItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: 0,
        quantity: 1,
        pricePerDay: 0,
        subtotal: 0,
        notes: ''
      }]
    }));
  };

  const updateBookingItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-calculate subtotal when quantity or pricePerDay changes, but preserve manual edits
      if (field === 'quantity' || field === 'pricePerDay') {
        const days = Math.ceil((new Date(prev.endDate).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const autoCalculatedSubtotal = newItems[index].quantity * newItems[index].pricePerDay * days;
        
        // Only auto-update if the current subtotal matches the previous auto-calculated value
        // This preserves manual subtotal edits
        const previousDays = Math.ceil((new Date(prev.endDate).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const previousAutoCalculated = (field === 'quantity' ? prev.items[index].quantity : newItems[index].quantity) * 
                                     (field === 'pricePerDay' ? prev.items[index].pricePerDay : newItems[index].pricePerDay) * 
                                     previousDays;
        
        if (Math.abs(prev.items[index].subtotal - previousAutoCalculated) < 0.01) {
          newItems[index].subtotal = autoCalculatedSubtotal;
        }
      }
      
      // Auto-update price when product is selected, but don't override manual pricing
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          // Only auto-set price if it's currently 0 (new item) or if user hasn't manually changed it
          if (newItems[index].pricePerDay === 0) {
            newItems[index].pricePerDay = product.rentPrice;
          }
          const days = Math.ceil((new Date(prev.endDate).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
          newItems[index].subtotal = newItems[index].quantity * newItems[index].pricePerDay * days;
        }
      }
      
      // Recalculate total
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      return { ...prev, items: newItems, totalAmount: total };
    });
  };

  const removeBookingItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      return { ...prev, items: newItems, totalAmount: total };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const bookingData = {
        id: booking.id,
        ...formData,
        customerId: selectedCustomer.id,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };

      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      setError('Failed to update booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Booking #{booking.id}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Customer and Rental Period Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    placeholder="Search customer"
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerModalOpen(true)}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                    title="Add New Customer"
                  >
                    <UserPlus size={16} />
                  </button>
                  {customerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full left-0">
                      {customerSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
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
                </div>
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
              </div>
            </div>

            {/* Rental Period */}
            <div className="space-y-4">
              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>
              </div>
              
              {/* Times Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Products Section */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Rental Items</h3>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateBookingItem(index, 'productId', parseInt(e.target.value))}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
                      >
                        <option value={0}>Select a product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} (₹{product.rentPrice}/day) - Stock: {product.quantity}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Quantity, Price/Day, and Subtotal Row */}
                    <div className="flex items-end gap-2">
                      <div className="flex-[0.3]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.quantity === 0 ? '' : item.quantity.toString()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^[0-9]+$/.test(value)) {
                              updateBookingItem(index, 'quantity', value === '' ? 0 : parseInt(value));
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updateBookingItem(index, 'quantity', 1);
                            }
                          }}
                          disabled={isSubmitting}
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
                        />
                      </div>
                      
                      <div className="flex-[0.3]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price/Day
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.]?[0-9]*"
                          value={item.pricePerDay === 0 ? '' : item.pricePerDay.toString()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              updateBookingItem(index, 'pricePerDay', value === '' ? 0 : parseFloat(value) || 0);
                            }
                          }}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
                          placeholder="Manual price"
                          title="Enter custom price per day (overrides product default)"
                        />
                      </div>
                      
                      <div className="flex-[0.4]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Subtotal
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.]?[0-9]*"
                          value={item.subtotal === 0 ? '' : item.subtotal.toString()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              updateBookingItem(index, 'subtotal', value === '' ? 0 : parseFloat(value) || 0);
                            }
                          }}
                          disabled={isSubmitting}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
                          placeholder="Manual subtotal"
                          title="Enter custom subtotal (overrides auto-calculated value)"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeBookingItem(index)}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                        title="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Item Notes - Expandable */}
                  {item.productId > 0 && (
                    <div className="mt-3">
                      {!expandedNotes.has(index) ? (
                        <button
                          type="button"
                          onClick={() => toggleNoteExpansion(index)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            hasNoteContent(index)
                              ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          disabled={isSubmitting}
                        >
                          <MessageSquare size={16} />
                          {hasNoteContent(index) ? 'Edit Note' : 'Add Note'}
                          {hasNoteContent(index) && (
                            <span className="text-xs font-medium">
                              ({item.notes?.length} chars)
                            </span>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Item Notes
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleNoteExpansion(index)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                              disabled={isSubmitting}
                              title="Collapse notes"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => updateBookingItem(index, 'notes', e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Any special notes for this item"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {formData.items.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No items added yet. Click "Add Item" to get started.
                </div>
              )}
              
              {/* Add Item Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={addBookingItem}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Booking Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="Any additional notes or special instructions"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Advance Payment
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    value={formData.advancePayment === 0 ? '' : formData.advancePayment.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFormData(prev => ({ ...prev, advancePayment: value === '' ? 0 : parseFloat(value) || 0 }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount
                  </label>
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      ₹{formData.totalAmount.toFixed(2)}
                    </div>
                    {formData.advancePayment > 0 && (
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        Remaining: ₹{(formData.totalAmount - formData.advancePayment).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.items.length === 0 || formData.items.some(item => item.productId === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>

      {/* New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New Customer
              </h3>
              <button
                onClick={() => {
                  setIsNewCustomerModalOpen(false);
                  setNewCustomerData({ name: '', phone1: '', phone2: '', address: '' });
                  setError(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newCustomerData.phone1}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter primary phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  value={newCustomerData.phone2}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter secondary phone number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter address (optional)"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomerModalOpen(false);
                  setNewCustomerData({ name: '', phone1: '', phone2: '', address: '' });
                  setError(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createNewCustomer}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}