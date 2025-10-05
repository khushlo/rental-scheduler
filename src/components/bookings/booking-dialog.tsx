'use client';

import { useState, useEffect } from 'react';
import { Plus, X, UserPlus, MessageSquare, RefreshCw, Package } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  address?: string;
}

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

interface ItemAvailability {
  [itemIndex: number]: AvailabilityError | null;
}

interface Booking {
  id?: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventDate?: string;  // Optional event date
  totalAmount: number;
  advancePayment: number;
  status?: string;
  notes?: string;
  customerId: number;
  items: BookingItem[];
  customer?: Customer;
}

interface BookingDialogProps {
  mode: 'add' | 'edit';
  booking?: Booking;
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

export function BookingDialog({ mode, booking, onClose, onSuccess, isOpen }: BookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [itemAvailability, setItemAvailability] = useState<ItemAvailability>({});
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [expandedNotes, setExpandedNotes] = useState(new Set<number>());
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  
  // Customer form state
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    address: '',
    notes: ''
  });
  const [customerFormSubmitting, setCustomerFormSubmitting] = useState(false);
  const [customerFormError, setCustomerFormError] = useState<string | null>(null);
  
  // Product form state
  const [productFormData, setProductFormData] = useState({
    name: '',
    quantity: 1,
    rentPrice: 0,
    status: true
  });
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    startDate: booking?.startDate || new Date().toISOString().split('T')[0],
    endDate: booking?.endDate || new Date().toISOString().split('T')[0],
    startTime: booking?.startTime || '09:00',
    endTime: booking?.endTime || '17:00',
    eventDate: booking?.eventDate || '',  // Optional event date
    totalAmount: booking?.totalAmount || 0,
    advancePayment: booking?.advancePayment || 0,
    notes: booking?.notes || '',
    customerId: booking?.customerId || 0,
    items: booking?.items || []
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Set selected customer if in edit mode
  useEffect(() => {
    if (mode === 'edit' && booking?.customer) {
      setSelectedCustomer(booking.customer);
      setCustomerSearchTerm(booking.customer.name);
    }
  }, [mode, booking]);

  // Validate items when component loads in edit mode
  useEffect(() => {
    if (mode === 'edit' && formData.items.length > 0) {
      // Delay validation slightly to ensure products are loaded
      setTimeout(() => {
        validateAllItems();
      }, 1000);
    }
  }, [mode, products]);

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Set new timeout for debounced validation
    const newTimeout = setTimeout(() => {
      validateAllItems();
    }, 500);
    
    setValidationTimeout(newTimeout);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Set new timeout for debounced validation
    const newTimeout = setTimeout(() => {
      validateAllItems();
    }, 500);
    
    setValidationTimeout(newTimeout);
  };

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

  const checkItemAvailability = async (itemIndex: number, productId: number, quantity: number) => {
    if (!productId || !quantity || !formData.startDate || !formData.endDate) {
      setItemAvailability(prev => ({ ...prev, [itemIndex]: null }));
      return;
    }

    try {
      // Build URL with time parameters for enhanced availability checking
      const params = new URLSearchParams({
        productId: productId.toString(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        quantity: quantity.toString()
      });

      // Add time parameters for time-aware availability checking
      if (formData.startTime) {
        params.append('startTime', formData.startTime);
      }
      if (formData.endTime) {
        params.append('endTime', formData.endTime);
      }

      // Exclude current booking when editing
      if (mode === 'edit' && booking?.id) {
        params.append('excludeBookingId', booking.id.toString());
      }

      const response = await fetch(`/api/availability?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.available) {
          const conflictingBookings = data.conflictingBookings || [];
          setItemAvailability(prev => ({
            ...prev,
            [itemIndex]: {
              message: data.reason || 'Item not available for selected dates/times',
              conflictingBookings: conflictingBookings.map((booking: any) => ({
                id: booking.id,
                customer: booking.customer,
                quantity: booking.quantity,
                startTime: booking.startTime,
                endTime: booking.endTime
              }))
            }
          }));
        } else {
          setItemAvailability(prev => ({ ...prev, [itemIndex]: null }));
        }
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const validateAllItems = () => {
    formData.items.forEach((item, index) => {
      if (item.productId && item.quantity) {
        checkItemAvailability(index, item.productId, item.quantity);
      }
    });
  };

  const refreshAvailability = async () => {
    setIsRefreshing(true);
    // Clear existing availability errors
    setItemAvailability({});
    // Re-validate all items
    validateAllItems();
    // Add a small delay for better UX
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const searchCustomers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setCustomerSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/customers/search?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Customer search results:', data); // Debug log
        setCustomerSuggestions(data);
      } else {
        console.error('Customer search failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setCustomerSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSuggestions([]);
    }
    setIsSearching(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setCustomerSuggestions([]);
    setFormData(prev => ({ ...prev, customerId: customer.id }));
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setFormData(prev => ({ ...prev, customerId: 0 }));
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearchTerm(value);
    if (selectedCustomer) {
      clearCustomerSelection();
    }
    searchCustomers(value);
  };

  const hasNoteContent = (index: number): boolean => {
    return !!(formData.items[index]?.notes && formData.items[index].notes!.trim() !== '');
  };

  const handleProductAdded = () => {
    setShowAddProduct(false);
    fetchProducts(); // Refresh products list
  };

  const handleCustomerAdded = () => {
    setShowAddCustomer(false);
    // Optionally refresh customer suggestions or perform other actions
  };

  const handleCustomerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerFormSubmitting(true);
    setCustomerFormError(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerFormData.name.trim(),
          phone1: customerFormData.phone1.trim(),
          phone2: customerFormData.phone2.trim() || undefined,
          address: customerFormData.address.trim() || undefined,
          notes: customerFormData.notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setCustomerFormData({
          name: '',
          phone1: '',
          phone2: '',
          address: '',
          notes: ''
        });
        setShowAddCustomer(false);
        // Auto-select the newly created customer
        setSelectedCustomer(newCustomer);
        setCustomerSearchTerm(newCustomer.name);
      } else {
        const errorData = await response.json();
        setCustomerFormError(errorData.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setCustomerFormError('Failed to create customer. Please try again.');
    } finally {
      setCustomerFormSubmitting(false);
    }
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!productFormData.name.trim()) {
      setProductFormError('Product name is required');
      return;
    }
    if (productFormData.quantity < 0) {
      setProductFormError('Quantity must be non-negative');
      return;
    }
    if (productFormData.rentPrice < 0) {
      setProductFormError('Rent price must be non-negative');
      return;
    }

    setProductFormSubmitting(true);
    setProductFormError(null);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productFormData),
      });

      if (response.ok) {
        setProductFormData({
          name: '',
          quantity: 1,
          rentPrice: 0,
          status: true,
        });
        setShowAddProduct(false);
        fetchProducts(); // Refresh products list
      } else {
        const errorData = await response.json();
        setProductFormError(errorData.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setProductFormError('Failed to create product. Please try again.');
    } finally {
      setProductFormSubmitting(false);
    }
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

  const addBookingItem = () => {
    const newIndex = formData.items.length;
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

    // Clear any existing availability error for the new item
    setItemAvailability(prev => ({ ...prev, [newIndex]: null }));
  };

  const removeBookingItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));

    // Remove availability error for this item and reindex
    setItemAvailability(prev => {
      const newAvailability: ItemAvailability = {};
      Object.keys(prev).forEach(key => {
        const idx = parseInt(key);
        if (idx < index) {
          newAvailability[idx] = prev[idx];
        } else if (idx > index) {
          newAvailability[idx - 1] = prev[idx];
        }
      });
      return newAvailability;
    });
  };

  const updateBookingItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate subtotal when quantity or pricePerDay changes
      if (field === 'quantity' || field === 'pricePerDay') {
        // const days = Math.ceil((new Date(prev.endDate).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const days = 1; // Hardcoded to 1 day for time-aware bookings
        const autoCalculatedSubtotal = newItems[index].quantity * newItems[index].pricePerDay * days;
        newItems[index].subtotal = autoCalculatedSubtotal;
      }

      // Update product price when product is selected
      if (field === 'productId' && value > 0) {
        const selectedProduct = products.find(p => p.id === value);
        if (selectedProduct) {
          newItems[index].pricePerDay = selectedProduct.rentPrice;
          // const days = Math.ceil((new Date(prev.endDate).getTime() - new Date(prev.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
          const days = 1; // Hardcoded to 1 day for time-aware bookings
          newItems[index].subtotal = newItems[index].quantity * selectedProduct.rentPrice * days;
        }
      }

      return { ...prev, items: newItems };
    });

    // Check availability when productId or quantity changes
    if (field === 'productId' || field === 'quantity') {
      const item = formData.items[index];
      const newProductId = field === 'productId' ? value : item.productId;
      const newQuantity = field === 'quantity' ? value : item.quantity;
      
      if (newProductId && newQuantity) {
        checkItemAvailability(index, newProductId, newQuantity);
      }
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer && !customerSearchTerm.trim()) {
      setError('Please select or enter a customer name');
      return;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item to the booking');
      return;
    }

    // Check for availability errors
    const hasAvailabilityErrors = Object.values(itemAvailability).some(error => error !== null);
    if (hasAvailabilityErrors) {
      setError('Please resolve availability conflicts before submitting');
      return;
    }

    // Validate that all items have valid products and quantities
    const invalidItems = formData.items.some(item => !item.productId || item.quantity <= 0);
    if (invalidItems) {
      setError('Please select products and enter valid quantities for all items');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let customerId = selectedCustomer?.id || formData.customerId;

      // Create customer if not selected
      if (!selectedCustomer && customerSearchTerm.trim()) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: customerSearchTerm.trim(),
            phone1: 'N/A'
          })
        });

        if (customerResponse.ok) {
          const newCustomer = await customerResponse.json();
          customerId = newCustomer.id;
        } else {
          throw new Error('Failed to create customer');
        }
      }

      const bookingData = {
        ...formData,
        customerId,
        totalAmount: calculateTotal()
      };

      const url = mode === 'edit' ? `/api/bookings/${booking!.id}` : '/api/bookings';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} booking`);
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${mode} booking`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {mode === 'edit' ? 'Edit Booking' : 'Create New Booking'}
            </h2>
            {mode === 'edit' && booking && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Booking ID: #{booking.id}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Customer Section */}
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
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  />
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={clearCustomerSelection}
                      disabled={isSubmitting}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
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

          {/* Rental Period */}
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Rental Period</h3>
            </div>
            
            {/* Dates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
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
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
            </div>
            
            {/* Event Date Row */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Date <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                placeholder="Select event date if applicable"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Specify when the actual event/function will take place (if different from rental period)
              </p>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Rental Items</h3>
              <button
                type="button"
                onClick={refreshAvailability}
                disabled={isSubmitting || isRefreshing}
                className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh availability"
              >
                <RefreshCw 
                  size={16} 
                  className={`${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Product Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => updateBookingItem(index, 'productId', parseInt(e.target.value))}
                          disabled={isSubmitting}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-gray-100 disabled:opacity-50"
                        >
                          <option value={0}>Select a product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (₹{product.rentPrice}/day) - Stock: {product.quantity}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddProduct(true)}
                          disabled={isSubmitting}
                          className="inline-flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          title="Add new product"
                        >
                          <Package size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Availability Error Display */}
                    {itemAvailability[index] && (
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
                              <p>{itemAvailability[index]?.message}</p>
                              {itemAvailability[index]?.conflictingBookings.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-medium">Conflicting with bookings:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {itemAvailability[index]?.conflictingBookings.map((booking, bookingIndex) => (
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
                              // Allow empty state temporarily, will be validated on submit
                              updateBookingItem(index, 'quantity', 0);
                            } else {
                              const numValue = parseInt(value, 10);
                              if (!isNaN(numValue) && numValue >= 1) {
                                updateBookingItem(index, 'quantity', numValue);
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
                              // Allow empty state temporarily
                              updateBookingItem(index, 'pricePerDay', 0);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue >= 0) {
                                updateBookingItem(index, 'pricePerDay', numValue);
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
                              // Allow empty state temporarily
                              updateBookingItem(index, 'subtotal', 0);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue >= 0) {
                                updateBookingItem(index, 'subtotal', numValue);
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
                        onClick={() => removeBookingItem(index)}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                        title="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    {/* Item Notes - Expandable */}
                    {item.productId > 0 && (
                      <div>
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
                            <textarea
                              value={item.notes || ''}
                              onChange={(e) => updateBookingItem(index, 'notes', e.target.value)}
                              disabled={isSubmitting}
                              placeholder="Enter notes for this item..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBookingItem}
                disabled={isSubmitting}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Payment Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount || calculateTotal() || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      // Allow empty state temporarily
                      setFormData(prev => ({ ...prev, totalAmount: 0 }));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setFormData(prev => ({ ...prev, totalAmount: numValue }));
                      }
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Advance Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.advancePayment || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      // Allow empty state temporarily
                      setFormData(prev => ({ ...prev, advancePayment: 0 }));
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setFormData(prev => ({ ...prev, advancePayment: numValue }));
                      }
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Enter any additional notes for this booking..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
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
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Booking' : 'Create Booking'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add Product Dialog */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New Product
              </h3>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setProductFormError(null);
                  setProductFormData({ name: '', quantity: 1, rentPrice: 0, status: true });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProductFormSubmit} className="p-6 space-y-4">
              {productFormError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                  {productFormError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={productFormSubmitting}
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
                  value={productFormData.quantity}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  disabled={productFormSubmitting}
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
                  value={productFormData.rentPrice}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, rentPrice: parseFloat(e.target.value) || 0 }))}
                  disabled={productFormSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="productStatus"
                  checked={productFormData.status}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, status: e.target.checked }))}
                  disabled={productFormSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="productStatus" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setProductFormError(null);
                    setProductFormData({ name: '', quantity: 1, rentPrice: 0, status: true });
                  }}
                  disabled={productFormSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productFormSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {productFormSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New Customer
              </h3>
              <button
                onClick={() => {
                  setShowAddCustomer(false);
                  setCustomerFormError(null);
                  setCustomerFormData({ name: '', phone1: '', phone2: '', address: '', notes: '' });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCustomerFormSubmit} className="p-6 space-y-4">
              {customerFormError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                  {customerFormError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerFormData.name}
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={customerFormSubmitting}
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
                  value={customerFormData.phone1}
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone1: e.target.value }))}
                  disabled={customerFormSubmitting}
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
                  value={customerFormData.phone2}
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone2: e.target.value }))}
                  disabled={customerFormSubmitting}
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
                  value={customerFormData.address}
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={customerFormSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
                  placeholder="Enter address (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={customerFormData.notes}
                  onChange={(e) => setCustomerFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={customerFormSubmitting}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
                  rows={3}
                  placeholder="Enter any notes (optional)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false);
                    setCustomerFormError(null);
                    setCustomerFormData({ name: '', phone1: '', phone2: '', address: '', notes: '' });
                  }}
                  disabled={customerFormSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customerFormSubmitting || !customerFormData.name.trim() || !customerFormData.phone1.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {customerFormSubmitting ? (
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
        </div>
      )}
    </div>
  );
}