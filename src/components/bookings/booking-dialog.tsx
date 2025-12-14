"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, RefreshCw, FileText } from "lucide-react";
import { CustomerSelection } from "./dialog/customer-selection";
import { RentalPeriod } from "./dialog/rental-period";
import { BookingItemComponent } from "./dialog/booking-item";
import { AddCustomerForm } from "./dialog/add-customer-form";
import { AddProductForm } from "./dialog/add-product-form";
import { fetchProductsGlobal, clearProductsCache } from '@/lib/products-cache';
import { clearCustomersCache } from '@/lib/customers-cache';
import { PaymentInformation } from "./dialog/payment-information";
import { useAvailability } from "./dialog/use-availability";
import { useProductSearch } from "./dialog/use-product-search";

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

interface Configuration {
  id: number;
  configName: string;
  description: string | null;
  value: string | null;
  hasValue: boolean;
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

interface Booking {
  id?: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventDate?: string;
  totalAmount: number;
  advancePayment: number;
  status?: string;
  notes?: string;
  customerId: number;
  rowStatusCd?: "A" | "C" | "D" | "I" | "O"; // Row Status Code
  items: BookingItem[];
  customer?: Customer;
}

interface BookingDialogProps {
  mode: "add" | "edit";
  bookingId?: number; // Changed from booking object to just ID
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

export function BookingDialog({
  mode,
  bookingId,
  onClose,
  onSuccess,
  isOpen,
}: BookingDialogProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customer state
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [expandedNotes, setExpandedNotes] = useState(new Set<number>());
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    startDate: "", // Initialize empty to prevent hydration mismatch
    endDate: "", // Initialize empty to prevent hydration mismatch
    startTime: "09:00",
    endTime: "17:00",
    eventDate: "",
    totalAmount: 0,
    advancePayment: 0,
    notes: "",
    customerId: 0,
    rowStatusCd: "A" as "A" | "C" | "D" | "I" | "O",
    items: [] as BookingItem[],
  });

  // Initialize on client side to prevent hydration mismatch
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
  }, []);

  // Custom hooks
  const {
    itemAvailability,
    checkItemAvailability,
    validateAllItems,
    refreshAvailability: refreshAvailabilityHook,
    clearItemAvailability,
    reindexAvailability,
  } = useAvailability({
    formData,
    excludeBookingId: mode === "edit" ? bookingId : undefined,
  });

  const {
    productSearchTerms,
    productSuggestions,
    showProductDropdown,
    handleProductSearch,
    selectProduct,
    clearProductSelection,
    initializeProductSearchTerms,
    reindexProductSearch,
  } = useProductSearch();

  // Fetch products only when dialog is open
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchConfigurations();

      // Fetch booking details if in edit mode
      if (mode === "edit" && bookingId) {
        fetchBookingDetails();
      } else {
        setIsLoading(false);
      }
    }
  }, [isOpen, mode, bookingId]);

  // Reset initialization flag when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen]);

  // Initialize product search terms when products are loaded
  useEffect(() => {
    if (
      isOpen &&
      mode === "edit" &&
      formData.items.length > 0 &&
      products.length > 0 &&
      !hasInitialized
    ) {
      initializeProductSearchTerms(formData.items, products);
      setHasInitialized(true);
    }
  }, [
    isOpen,
    mode,
    products,
    hasInitialized,
    formData.items,
    initializeProductSearchTerms,
  ]);

  // Validate items only once after initialization
  useEffect(() => {
    if (
      hasInitialized &&
      isOpen &&
      mode === "edit" &&
      formData.items.length > 0
    ) {
      const hasValidItems = formData.items.some((item) => item.productId > 0);
      if (hasValidItems) {
        setTimeout(() => {
          validateAllItems();
        }, 1000);
      }
    }
  }, [hasInitialized, isOpen, mode, formData.items, validateAllItems]);

  // Auto-add default notes for new bookings if configured
  useEffect(() => {
    if (
      mode === "add" &&
      configurations.length > 0 &&
      !formData.notes.trim() // Only add if notes are empty
    ) {
      const addDefaultNotesConfig = configurations.find(
        (config) => config.configName === "AddDefaultNotes"
      );

      // Check if AddDefaultNotes is configured and set to true
      if (
        addDefaultNotesConfig &&
        (addDefaultNotesConfig.value === "true" || addDefaultNotesConfig.value === "1")
      ) {
        addDefaultNotes();
      }
    }
  }, [mode, configurations, formData.notes]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProductsGlobal();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfigurations = async () => {
    try {
      const response = await fetch("/api/configurations");
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    }
  };

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const bookingData = await response.json();
        setBooking(bookingData);

        // Update form data with fetched booking details
        // Convert date objects to YYYY-MM-DD format for HTML date inputs
        const formatDateForInput = (dateString: string | Date) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        setFormData({
          startDate: formatDateForInput(bookingData.startDate),
          endDate: formatDateForInput(bookingData.endDate),
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          eventDate: bookingData.eventDate
            ? formatDateForInput(bookingData.eventDate)
            : "",
          totalAmount: bookingData.totalAmount,
          advancePayment: bookingData.advancePayment || 0,
          notes: bookingData.notes || "",
          customerId: bookingData.customerId,
          rowStatusCd: bookingData.rowStatusCd || "A",
          items: bookingData.items || [],
        });

        // Set customer information
        if (bookingData.customer) {
          setSelectedCustomer(bookingData.customer);
          setCustomerSearchTerm(bookingData.customer.name);
        }
      } else {
        setError("Failed to fetch booking details");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setError("Failed to fetch booking details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Trigger availability check for all items
    setTimeout(() => validateAllItems(), 500);
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Trigger availability check for all items
    setTimeout(() => validateAllItems(), 500);
  };

  const handleCustomerSearchChange = (term: string) => {
    setCustomerSearchTerm(term);
    if (selectedCustomer) {
      setSelectedCustomer(null);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
  };

  const handleCustomerAdded = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
  };

  const handleProductAdded = () => {
    clearProductsCache(); // Clear cache so fresh data is fetched
    fetchProducts(); // Refresh products list
  };

  const addBookingItem = () => {
    const newIndex = formData.items.length;
    setFormData((prev) => {
      const newItems = [
        ...prev.items,
        {
          productId: 0,
          quantity: 1,
          pricePerDay: 0,
          subtotal: 0,
          notes: "",
        },
      ];

      // Recalculate total amount
      const newTotalAmount = newItems.reduce(
        (total, item) => total + item.subtotal,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalAmount: newTotalAmount,
      };
    });
    clearItemAvailability(newIndex);
  };

  const removeBookingItem = (index: number) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);

      // Recalculate total amount
      const newTotalAmount = newItems.reduce(
        (total, item) => total + item.subtotal,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalAmount: newTotalAmount,
      };
    });

    reindexAvailability(index);
    reindexProductSearch(index);
  };

  const updateBookingItem = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-calculate subtotal when quantity or pricePerDay changes
      if (field === "quantity" || field === "pricePerDay") {
        const autoCalculatedSubtotal =
          newItems[index].quantity * newItems[index].pricePerDay;
        newItems[index].subtotal = autoCalculatedSubtotal;
      }

      // Update product price when product is selected
      if (field === "productId" && value > 0) {
        const selectedProduct = products.find((p) => p.id === value);
        if (selectedProduct) {
          newItems[index].pricePerDay = selectedProduct.rentPrice;
          newItems[index].subtotal =
            newItems[index].quantity * selectedProduct.rentPrice;
        }
      }

      // Calculate new total amount from all item subtotals
      const newTotalAmount = newItems.reduce(
        (total, item) => total + item.subtotal,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalAmount: newTotalAmount, // Update total amount automatically
      };
    });

    // Check availability when productId or quantity changes
    if (field === "productId" || field === "quantity") {
      const item = formData.items[index];
      const newProductId = field === "productId" ? value : item.productId;
      const newQuantity = field === "quantity" ? value : item.quantity;

      if (newProductId > 0 && newQuantity > 0) {
        checkItemAvailability(index, newProductId, newQuantity);
      } else {
        clearItemAvailability(index);
      }
    }
  };

  const toggleNoteExpansion = (index: number) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleCustomTiming = (index: number) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const currentItem = { ...newItems[index] };

      if (currentItem.hasCustomTiming) {
        currentItem.hasCustomTiming = false;
        currentItem.itemStartDate = undefined;
        currentItem.itemEndDate = undefined;
        currentItem.itemStartTime = undefined;
        currentItem.itemEndTime = undefined;
      } else {
        currentItem.hasCustomTiming = true;
        currentItem.itemStartDate = prev.startDate;
        currentItem.itemEndDate = prev.endDate;
        currentItem.itemStartTime = prev.startTime;
        currentItem.itemEndTime = prev.endTime;
      }

      newItems[index] = currentItem;
      return { ...prev, items: newItems };
    });
  };

  const refreshAvailability = () => {
    setIsRefreshing(true);
    refreshAvailabilityHook();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const addDefaultNotes = () => {
    const bookingNotesConfig = configurations.find(
      (config) => config.configName === "BookingNotes"
    );

    if (bookingNotesConfig && bookingNotesConfig.value) {
      setFormData((prev) => {
        const currentNotes = prev.notes || "";
        const defaultNotes = bookingNotesConfig.value || "";

        // Append default notes with proper spacing
        const updatedNotes = currentNotes
          ? `${currentNotes}\n${defaultNotes}`
          : defaultNotes;

        return { ...prev, notes: updatedNotes };
      });
    }
  };

  const calculateTotal = () => {
    return formData.totalAmount === undefined || formData.totalAmount === 0
      ? formData.items.reduce((total, item) => total + item.subtotal, 0)
      : formData.totalAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer && !customerSearchTerm.trim()) {
      setError("Please select or enter a customer name");
      return;
    }

    if (formData.items.length === 0) {
      setError("Please add at least one item to the booking");
      return;
    }

    // Check for availability errors
    const hasAvailabilityErrors = Object.values(itemAvailability).some(
      (error) => error !== null
    );
    if (hasAvailabilityErrors) {
      setError("Please resolve availability conflicts before submitting");
      return;
    }

    // Validate that all items have valid products and quantities
    const invalidItems = formData.items.some(
      (item) => !item.productId || item.quantity <= 0
    );
    if (invalidItems) {
      setError(
        "Please select products and enter valid quantities for all items"
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let customerId = selectedCustomer?.id || formData.customerId;

      // Create customer if not selected
      if (!selectedCustomer && customerSearchTerm.trim()) {
        const customerResponse = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: customerSearchTerm.trim(),
            phone1: "N/A",
          }),
        });

        if (customerResponse.ok) {
          const newCustomer = await customerResponse.json();
          customerId = newCustomer.id;
          // Clear customers cache since a new customer was created
          clearCustomersCache();
        } else {
          throw new Error("Failed to create customer");
        }
      }

      const bookingData = {
        ...formData,
        customerId,
        totalAmount: calculateTotal(),
      };

      const url =
        mode === "edit" ? `/api/bookings/${bookingId}` : "/api/bookings";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} booking`);
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : `Failed to ${mode} booking`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Don't render during SSR
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border"
        style={{
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          borderColor: "hsl(var(--border))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {mode === "edit" ? "Edit Booking" : "Create New Booking"}
            </h2>
            {mode === "edit" && bookingId && (
              <p
                className="text-sm mt-1"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Booking ID: #{bookingId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || isLoading}
            className="disabled:opacity-50 hover:opacity-75"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
            </div>
            <p
              className="mt-4 text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Loading booking details...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-100px)]"
          >
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Customer Section */}
            <CustomerSelection
              selectedCustomer={selectedCustomer}
              customerSearchTerm={customerSearchTerm}
              onCustomerSearchChange={handleCustomerSearchChange}
              onCustomerSelect={handleCustomerSelect}
              onClearSelection={clearCustomerSelection}
              onShowAddCustomer={() => setShowAddCustomer(true)}
              isSubmitting={isSubmitting}
            />

            {/* Rental Period */}
            <RentalPeriod
              formData={formData}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              onEventDateChange={(value) =>
                setFormData((prev) => ({ ...prev, eventDate: value }))
              }
              isSubmitting={isSubmitting}
            />

            {/* Products Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Rental Items
                </h3>
                <button
                  type="button"
                  onClick={refreshAvailability}
                  disabled={isSubmitting || isRefreshing}
                  className="inline-flex items-center p-2 text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  title="Refresh availability"
                >
                  <RefreshCw
                    size={16}
                    className={`${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <BookingItemComponent
                    key={index}
                    item={item}
                    index={index}
                    products={products}
                    availabilityError={itemAvailability[index]}
                    productSearchTerm={productSearchTerms[index] || ""}
                    productSuggestions={productSuggestions[index] || []}
                    showProductDropdown={showProductDropdown[index] || false}
                    expandedNotes={expandedNotes.has(index)}
                    isSubmitting={isSubmitting}
                    onItemUpdate={(field, value) =>
                      updateBookingItem(index, field, value)
                    }
                    onRemove={() => removeBookingItem(index)}
                    onProductSearch={(value) =>
                      handleProductSearch(value, index)
                    }
                    onProductSelect={(product) => {
                      const selectedProd = selectProduct(product, index);
                      updateBookingItem(index, "productId", selectedProd.id);
                    }}
                    onClearProduct={() => {
                      clearProductSelection(index);
                      updateBookingItem(index, "productId", 0);
                    }}
                    onToggleNotes={() => toggleNoteExpansion(index)}
                    onToggleCustomTiming={() => toggleCustomTiming(index)}
                    onShowAddProduct={() => setShowAddProduct(true)}
                  />
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
            <PaymentInformation
              totalAmount={formData.totalAmount}
              advancePayment={formData.advancePayment}
              calculatedTotal={calculateTotal()}
              onTotalAmountChange={(amount) =>
                setFormData((prev) => ({ ...prev, totalAmount: amount }))
              }
              onAdvancePaymentChange={(amount) =>
                setFormData((prev) => ({ ...prev, advancePayment: amount }))
              }
              isSubmitting={isSubmitting}
            />

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <button
                  type="button"
                  onClick={addDefaultNotes}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                  title="Add default booking notes"
                >
                  <FileText size={12} />
                  Add default notes
                </button>
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                disabled={isSubmitting}
                placeholder="Enter any additional notes for this booking..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 resize-none"
                rows={3}
              />
            </div>

            {/* Status Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Booking Status
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rowStatusCd === "C"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rowStatusCd: e.target.checked ? "C" : "A",
                      }))
                    }
                    disabled={isSubmitting}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mark as Completed
                  </span>
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.rowStatusCd === "C" ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      ● Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div
              className="flex justify-end gap-3 pt-4 border-t"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors border"
                style={{
                  color: "hsl(var(--foreground))",
                  backgroundColor: "hsl(var(--secondary))",
                  borderColor: "hsl(var(--border))",
                }}
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
                    {mode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : mode === "edit" ? (
                  "Update Booking"
                ) : (
                  "Create Booking"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Product Dialog */}
      <AddProductForm
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductAdded={handleProductAdded}
      />

      {/* Add Customer Dialog */}
      <AddCustomerForm
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={handleCustomerAdded}
      />
    </div>,
    document.body
  );
}
