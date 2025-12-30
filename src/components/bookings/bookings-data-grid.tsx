"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle } from "lucide-react";
import { DataGrid, Column } from "@/components/ui/data-grid";
import { AddBookingForm } from "./add-booking-form";
import { EditBookingForm } from "./edit-booking-form";
import { DeleteBookingButton } from "./delete-booking-button";
import { apiGet, apiPut } from "@/lib/api-client";

import {
  formatId,
  calculateBookingStatus,
  safeCalculateBookingStatus,
  getBookingStatusColor,
  safeFormatDate,
  type BookingStatus,
} from "@/lib/utils";

interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  productId: number;
  // Individual item timing (optional - if null, uses booking's timing)
  itemStartDate?: string;
  itemEndDate?: string;
  itemStartTime?: string;
  itemEndTime?: string;
  product: {
    id: number;
    name: string;
    pricePerDay: number;
    category?: string;
  };
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventDate?: string; // Optional event date
  totalAmount: number;
  advancePayment?: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerId: number;
  rowStatusCd?: "A" | "C" | "D" | "I" | "O"; // Row Status Code
  items: BookingItem[];
  // Additional properties for separated entries
  isCustomTimingEntry?: boolean;
  originalBookingId?: number;
  customer: {
    id: number;
    name: string;
    phone1: string;
    phone2?: string;
    address?: string;
    email: string; // Make required with default value from API
  };
}

export function BookingsDataGrid() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [originalBookings, setOriginalBookings] = useState<Booking[]>([]); // Store original data for search
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [showCompletedBookings, setShowCompletedBookings] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasFetchedInitially = useRef(false);
  const fetchingRef = useRef(false);
  const router = useRouter();

  // Ensure component is mounted on client side to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to navigate to invoice page
  const handleGenerateInvoice = (booking: Booking) => {
    const invoiceId = booking.originalBookingId || booking.id;
    router.push(`/bookings/invoice/${invoiceId}`);
  };

  // Function to handle phone call
  const handlePhoneCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, "_self");
  };

  // Function to handle WhatsApp
  const handleWhatsApp = (phoneNumber: string) => {
    // Remove any non-digit characters and format for WhatsApp
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  // Helper function to format custom timing
  const formatCustomTiming = (item: BookingItem): string => {
    if (!item.itemStartDate || !item.itemEndDate) return "";

    const startDate = safeFormatDate(
      item.itemStartDate,
      "dd MMM, yyyy",
      isMounted
    );
    const endDate = safeFormatDate(item.itemEndDate, "dd MMM, yyyy", isMounted);
    const startTime = item.itemStartTime || "";
    const endTime = item.itemEndTime || "";

    if (startDate === endDate) {
      return `${startDate} ${startTime}-${endTime}`;
    } else {
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }
  };

  // Helper function to separate items by timing type
  const separateItemsByTiming = (items: BookingItem[]) => {
    const regularItems = items.filter(
      (item) => !item.itemStartDate && !item.itemEndDate
    );
    const customTimingItems = items.filter(
      (item) => item.itemStartDate || item.itemEndDate
    );
    return { regularItems, customTimingItems };
  };

  // Helper function to create separate booking entries for custom timing items
  const createSeparateBookingEntries = (bookings: Booking[]): Booking[] => {
    const separatedEntries: Booking[] = [];

    bookings.forEach((booking) => {
      const { regularItems, customTimingItems } = separateItemsByTiming(
        booking.items
      );

      // Create entry for custom timing items (if any)
      if (customTimingItems.length > 0) {
        customTimingItems.forEach((customItem) => {
          const customStartDate = customItem.itemStartDate || booking.startDate;
          const customEndDate = customItem.itemEndDate || booking.endDate;

          // Create individual entry for each custom timing item
          const customBookingEntry: Booking = {
            ...booking,
            id: booking.id + 0.1 + customItem.id / 10000, // Unique ID for sorting
            startDate: customStartDate,
            endDate: customEndDate,
            startTime: customItem.itemStartTime || booking.startTime,
            endTime: customItem.itemEndTime || booking.endTime,
            items: [customItem], // Only this custom timing item
            totalAmount: customItem.subtotal, // Use item's subtotal
            // Calculate status based on custom timing dates
            status:
              safeCalculateBookingStatus(
                customStartDate,
                customEndDate,
                booking.status === "cancelled",
                booking.rowStatusCd,
                isMounted
              ) || booking.status, // Fallback to existing status during SSR
            // Add a flag to identify this as a custom timing entry
            isCustomTimingEntry: true,
            originalBookingId: booking.id,
          };
          separatedEntries.push(customBookingEntry as Booking);
        });
      }

      // Create entry for regular items (if any)
      if (regularItems.length > 0) {
        const regularBookingEntry: Booking = {
          ...booking,
          items: regularItems,
          totalAmount: regularItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
          ),
          // Recalculate status for regular items too, in case original was incorrect
          status:
            safeCalculateBookingStatus(
              booking.startDate,
              booking.endDate,
              booking.status === "cancelled",
              booking.rowStatusCd,
              isMounted
            ) || booking.status, // Fallback to existing status during SSR
          // Add a flag to identify this as a regular entry
          isCustomTimingEntry: false,
          originalBookingId: booking.id,
        };
        separatedEntries.push(regularBookingEntry);
      }
    });

    // Sort by start date (ascending) so custom timing items appear in correct chronological order
    return separatedEntries.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  };

  // Custom search function for bookings
  const searchBookings = (
    bookings: Booking[],
    searchTerm: string
  ): Booking[] => {
    if (!searchTerm.trim()) return bookings;

    const searchLower = searchTerm.toLowerCase();

    return bookings.filter((booking) => {
      // Search in booking ID (formatted)
      if (formatId(booking.id).toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in customer data
      if (booking.customer?.name?.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (booking.customer?.phone1?.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (booking.customer?.phone2?.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (booking.customer?.email?.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (booking.customer?.address?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in product names and categories
      if (
        booking.items.some(
          (item) =>
            item.product.name.toLowerCase().includes(searchLower) ||
            item.product.category?.toLowerCase().includes(searchLower)
        )
      )
        return true;

      // Search in custom timing dates (if any)
      if (
        booking.items.some((item) => {
          if (
            item.itemStartDate &&
            safeFormatDate(item.itemStartDate, "dd MMM, yyyy", isMounted)
              .toLowerCase()
              .includes(searchLower)
          )
            return true;
          if (
            item.itemEndDate &&
            safeFormatDate(item.itemEndDate, "dd MMM, yyyy", isMounted)
              .toLowerCase()
              .includes(searchLower)
          )
            return true;
          if (item.itemStartTime && item.itemStartTime.includes(searchLower))
            return true;
          if (item.itemEndTime && item.itemEndTime.includes(searchLower))
            return true;
          return false;
        })
      )
        return true;

      // Search in status
      if (booking.status.toLowerCase().includes(searchLower)) return true;

      // Search in notes
      if (booking.notes?.toLowerCase().includes(searchLower)) return true;

      // Search in dates (formatted)
      if (
        safeFormatDate(booking.startDate, "dd MMM, yyyy", isMounted)
          .toLowerCase()
          .includes(searchLower)
      )
        return true;
      if (
        safeFormatDate(booking.endDate, "dd MMM, yyyy", isMounted)
          .toLowerCase()
          .includes(searchLower)
      )
        return true;
      if (
        booking.eventDate &&
        safeFormatDate(booking.eventDate, "dd MMM, yyyy", isMounted)
          .toLowerCase()
          .includes(searchLower)
      )
        return true;

      // Search in times
      if (booking.startTime.includes(searchLower)) return true;
      if (booking.endTime.includes(searchLower)) return true;

      // Search in amounts (as string)
      if (booking.totalAmount.toString().includes(searchLower)) return true;
      if (booking.advancePayment?.toString().includes(searchLower)) return true;

      return false;
    });
  };

  // Initial fetch on mount only
  useEffect(() => {
    if (!hasFetchedInitially.current) {
      hasFetchedInitially.current = true;
      fetchBookings();
    }
  }, []);

  // Refetch when completed bookings toggle changes (after initial mount)
  useEffect(() => {
    if (hasFetchedInitially.current) {
      console.log("Toggle changed, refetching...");
      fetchBookings();
    }
  }, [showCompletedBookings]);

  const fetchBookings = async () => {
    // Prevent concurrent calls
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      console.log("Fetching bookings using shared cache...");

      // Use shared cache with showAllItems=true to get all bookings
      const response = await apiGet("/api/bookings");
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data = await response.json();

      // Filter bookings based on rowStatusCd
      const filteredData = data.filter((booking: Booking) => {
        if (showCompletedBookings) {
          // Show both Active (A) and Completed (C) bookings
          return booking.rowStatusCd === "A" || booking.rowStatusCd === "C";
        } else {
          // Show only Active (A) bookings
          return booking.rowStatusCd === "A" || !booking.rowStatusCd; // Include bookings without rowStatusCd for backward compatibility
        }
      });

      setOriginalBookings(filteredData); // Store filtered data
      const separatedData = createSeparateBookingEntries(filteredData);
      setBookings(separatedData);
      setFilteredBookings(separatedData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleMarkAsCompleted = async (bookingId: number) => {
    try {
      setUpdatingStatusId(bookingId);

      // First get the current booking data
      const fetchResponse = await apiGet(`/api/bookings/${bookingId}`);
      if (!fetchResponse.ok) {
        console.error("Failed to fetch booking data");
        return;
      }

      const bookingData = await fetchResponse.json();

      // Update the booking with the completed status
      const response = await apiPut(`/api/bookings/${bookingId}`, {
        ...bookingData,
        statusCd: "C", // Set status to Completed
      });

      if (response.ok) {
        // Refresh bookings to show updated status
        await fetchBookings();
      } else {
        console.error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // If no search term, show all separated entries
      const separatedData = createSeparateBookingEntries(originalBookings);
      setFilteredBookings(separatedData);
    } else {
      // Search in original bookings first, then separate the results
      const filteredOriginal = searchBookings(originalBookings, searchTerm);
      const separatedFiltered = createSeparateBookingEntries(filteredOriginal);
      setFilteredBookings(separatedFiltered);
    }
  };

  // Custom mobile card renderer for bookings
  const renderBookingCard = (booking: Booking, index: number) => {
    const isCustomEntry = booking.isCustomTimingEntry;
    const bookingId = booking.originalBookingId || booking.id;
    const isCompleted = booking.rowStatusCd === "C";
    const isUpdating = updatingStatusId === bookingId;

    const cardContent = (
      <div
        className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 ${
          isCustomEntry
            ? "bg-blue-50 border-blue-200 dark:border-blue-700"
            : "bg-white dark:bg-gray-800"
        }`}
      >
        {/* Header with ID, Status and Entry Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <code
              className="text-sm px-2 py-1 rounded font-mono"
              style={{
                backgroundColor: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {formatId(booking.originalBookingId || booking.id)}
            </code>
            {isCustomEntry && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                Custom Timing
              </span>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(
              booking.status
            )}`}
          >
            {booking.status}
          </span>
        </div>

        {/* Customer Info */}
        <div>
          <div
            className={`font-medium ${
              isCustomEntry
                ? "text-blue-900 dark:text-blue-100"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {booking.customer.name}
          </div>
          <div
            className={`text-sm flex items-center gap-2 ${
              isCustomEntry
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <span>{booking.customer.phone1}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePhoneCall(booking.customer.phone1)}
                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                title="Call customer"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleWhatsApp(booking.customer.phone1)}
                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                title="WhatsApp customer"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Rental Period */}
        <div className="text-sm">
          <div
            className={`font-medium ${
              isCustomEntry
                ? "text-blue-900 dark:text-blue-100"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {safeFormatDate(booking.startDate, "dd MMM, yyyy", isMounted)} -{" "}
            {safeFormatDate(booking.endDate, "dd MMM, yyyy", isMounted)}
          </div>
          <div
            className={`${
              isCustomEntry
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {booking.startTime} - {booking.endTime}
          </div>
          {booking.eventDate && (
            <div className="text-blue-600 dark:text-blue-400 font-medium mt-1">
              Event:{" "}
              {safeFormatDate(booking.eventDate, "dd MMM, yyyy", isMounted)}
            </div>
          )}
        </div>

        {/* Products */}
        <div>
          <div
            className={`text-sm font-medium mb-1 ${
              isCustomEntry
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Items ({booking.items.length})
          </div>
          <div className="space-y-1">
            {booking.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span
                  className={`${
                    isCustomEntry
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {item.quantity}x {item.product.name}
                </span>
                <span
                  className={`${
                    isCustomEntry
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  ₹{item.pricePerDay}/day
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col">
            <span className="font-medium text-green-600 dark:text-green-400 text-lg">
              ₹{booking.totalAmount.toFixed(2)}
            </span>
            <span className="text-xs text-red-500 dark:text-gray-400">
              ₹
              {(booking.totalAmount - (booking.advancePayment || 0)).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleGenerateInvoice(booking)}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
              title="Generate Invoice"
            >
              <FileText className="h-4 w-4" />
            </button>
            {/* Mark as Completed button - only show for non-completed bookings */}
            {!isCompleted && (
              <button
                onClick={() => handleMarkAsCompleted(bookingId)}
                disabled={isUpdating}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Mark as Completed"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </button>
            )}
            <EditBookingForm
              bookingId={booking.originalBookingId || booking.id}
              onBookingUpdated={fetchBookings}
            />
            <DeleteBookingButton
              booking={{
                ...booking,
                id: booking.originalBookingId || booking.id,
              }}
              onBookingDeleted={fetchBookings}
            />
          </div>
        </div>
      </div>
    );

    // Return card content without swipe functionality
    return cardContent;
  };

  const columns: Column<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      width: "5%",
      render: (booking) => (
        <div className="flex items-center gap-2">
          <code
            className="text-sm px-3 py-2 rounded font-mono"
            style={{
              backgroundColor: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {formatId(booking.originalBookingId || booking.id)}
          </code>
          {booking.isCustomTimingEntry && (
            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
              Custom
            </span>
          )}
        </div>
      ),
    },
    {
      key: "items",
      header: "Products",
      width: "25%",
      render: (booking) => {
        const isCustomEntry = booking.isCustomTimingEntry;

        return (
          <div
            className={`space-y-2 ${
              isCustomEntry
                ? "p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700"
                : ""
            }`}
          >
            <div
              className={`font-medium text-sm mb-1`}
              style={{
                color: isCustomEntry
                  ? "hsl(var(--primary))"
                  : "hsl(var(--foreground))",
              }}
            >
              {isCustomEntry ? "Custom Timing" : "Regular Items"} (
              {booking.items.length})
            </div>
            <div className="space-y-1">
              {booking.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div
                      className="text-sm"
                      style={{
                        color: isCustomEntry
                          ? "hsl(var(--primary))"
                          : "hsl(var(--foreground))",
                      }}
                    >
                      {item.quantity}x {item.product.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{
                        color: isCustomEntry
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted-foreground))",
                      }}
                    >
                      ₹{item.pricePerDay}/day
                    </div>
                  </div>
                  {isCustomEntry &&
                    (item.itemStartDate || item.itemEndDate) && (
                      <div className="text-xs text-blue-600 font-mono">
                        {formatCustomTiming(item)}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: "customer",
      header: "Customer",
      width: "10%",
      render: (booking) => (
        <div className="space-y-2">
          <div>
            <div
              className="font-medium"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {booking.customer.name}
            </div>
            <div
              className="text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {booking.customer.phone1}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Rental Period",
      width: "15%",
      render: (booking) => (
        <div>
          <div
            className="text-sm font-medium"
            style={{ color: "hsl(var(--foreground))" }}
          >
            {safeFormatDate(booking.startDate, "dd MMM, yyyy", isMounted)}
          </div>
          <div
            className="text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {booking.startTime} - {booking.endTime}
          </div>
          <div className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
            to {safeFormatDate(booking.endDate, "dd MMM, yyyy", isMounted)}
          </div>
        </div>
      ),
    },
    {
      key: "eventDate",
      header: "Event Date",
      width: "10%",
      render: (booking) => (
        <div>
          {booking.eventDate ? (
            <div className="text-sm font-medium text-blue-600">
              {safeFormatDate(booking.eventDate, "dd MMM, yyyy", isMounted)}
            </div>
          ) : (
            <div
              className="text-xs"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Not set
            </div>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      width: "8%",
      render: (booking) => {
        const pendingAmount =
          booking.totalAmount - (booking.advancePayment || 0);
        return (
          <div className="space-y-1">
            <span className="font-medium text-green-600">
              ₹{booking.totalAmount.toFixed(2)}
            </span>
            <div className="text-xs text-gray-500">
              Pending: ₹{pendingAmount.toFixed(2)}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Booking Status",
      width: "8%",
      render: (booking) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(
            booking.status
          )}`}
        >
          {booking.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "12%",
      render: (booking) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleGenerateInvoice(booking)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            title="Generate Invoice"
          >
            <FileText className="h-4 w-4" />
          </button>
          {/* Mark as Completed button - only show for non-completed bookings */}
          {booking.rowStatusCd !== "C" && (
            <button
              onClick={() =>
                handleMarkAsCompleted(booking.originalBookingId || booking.id)
              }
              disabled={
                updatingStatusId === (booking.originalBookingId || booking.id)
              }
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark as Completed"
            >
              {updatingStatusId ===
              (booking.originalBookingId || booking.id) ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </button>
          )}
          <EditBookingForm
            bookingId={booking.originalBookingId || booking.id}
            onBookingUpdated={fetchBookings}
          />
          <DeleteBookingButton
            booking={{
              ...booking,
              id: booking.originalBookingId || booking.id,
            }}
            onBookingDeleted={fetchBookings}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Bookings
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Manage rental bookings and schedules
          </p>
        </div>
        <AddBookingForm onBookingAdded={fetchBookings} />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCompletedBookings(!showCompletedBookings)}
            className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showCompletedBookings
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            <CheckCircle size={16} />
            <span className="hidden sm:inline">
              {showCompletedBookings
                ? "Hide Completed Bookings"
                : "Load Completed Bookings"}
            </span>
            <span className="sm:hidden">
              {showCompletedBookings ? "Hide Completed" : "Show Completed"}
            </span>
          </button>

          <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            {showCompletedBookings ? "Active & Completed" : "Active Only"}{" "}
            bookings
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {filteredBookings.length} bookings
        </div>
      </div>

      <DataGrid
        data={filteredBookings}
        columns={columns}
        pageSize={50}
        searchPlaceholder="Search by Booking ID, Customer Name, Product names, Status, or any details..."
        onSearch={handleSearch}
        loading={loading}
        emptyMessage="No bookings found. Create your first booking to get started."
        renderCard={renderBookingCard}
      />
    </div>
  );
}
