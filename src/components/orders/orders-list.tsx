"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, List, Search, Filter } from "lucide-react";
import { BookingDialog } from "../bookings/booking-dialog";


interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  productId: number;
  itemStartDate?: string | null;
  itemEndDate?: string | null;
  itemStartTime?: string | null;
  itemEndTime?: string | null;
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
  eventDate?: string;
  totalAmount: number;
  advancePayment?: number;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  notes?: string;
  customerId: number;
  createdAt: string;
  items: BookingItem[];
  customer: {
    id: number;
    name: string;
    phone1: string;
    phone2?: string;
    address?: string;
  };
}

interface OrdersListProps {
  selectedProductId?: number | null;
  showAllItems: boolean;
}

export function OrdersList({ selectedProductId, showAllItems }: OrdersListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    "startDate" | "createdAt" | "totalAmount"
  >("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/bookings";
      if (!showAllItems && selectedProductId) {
        url += `?productId=${selectedProductId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [showAllItems, selectedProductId]);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (booking) =>
          booking.items.some((item) =>
            item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          booking.customer.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.customer.phone1
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.customer.address
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (booking) => booking.status === statusFilter?.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "startDate":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "totalAmount":
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditBooking = (booking: Booking) => {
    // Map the booking to match BookingDialog's expected interface
    const editBooking = {
      ...booking,
      advancePayment: booking.advancePayment || 0,
      eventDate: booking.eventDate || "",
      status: booking.status.toLowerCase(),
    };
    setEditingBooking(editBooking);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingBooking(null);
  };

  const handleBookingUpdated = () => {
    fetchBookings();
    handleCloseEditDialog();
  };

  const handleSortChange = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg shadow-sm border"
            style={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <div className="animate-pulse space-y-2">
              <div
                className="h-4 rounded w-1/2"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              ></div>
              <div
                className="h-3 rounded w-1/3"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              ></div>
              <div
                className="h-3 rounded w-1/4"
                style={{ backgroundColor: "hsl(var(--muted))" }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Orders List
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            View all your rental orders in a detailed list format
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="p-4 rounded-lg shadow-sm border"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter
                className="h-4 w-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              >
                <option value="ALL">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-sm"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Sort by:
              </span>
              <button
                onClick={() => handleSortChange("startDate")}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  sortBy === "startDate" ? "bg-blue-100 text-blue-700" : ""
                }`}
                style={
                  sortBy !== "startDate"
                    ? {
                        backgroundColor: "hsl(var(--muted))",
                        color: "hsl(var(--muted-foreground))",
                      }
                    : {}
                }
              >
                Date{" "}
                {sortBy === "startDate" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("totalAmount")}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  sortBy === "totalAmount" ? "bg-blue-100 text-blue-700" : ""
                }`}
                style={
                  sortBy !== "totalAmount"
                    ? {
                        backgroundColor: "hsl(var(--muted))",
                        color: "hsl(var(--muted-foreground))",
                      }
                    : {}
                }
              >
                Amount{" "}
                {sortBy === "totalAmount" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("createdAt")}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  sortBy === "createdAt" ? "bg-blue-100 text-blue-700" : ""
                }`}
                style={
                  sortBy !== "createdAt"
                    ? {
                        backgroundColor: "hsl(var(--muted))",
                        color: "hsl(var(--muted-foreground))",
                      }
                    : {}
                }
              >
                Created{" "}
                {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-4 text-sm"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Showing {filteredBookings.length} of {bookings.length} orders
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div
            className="p-8 rounded-lg shadow-sm border text-center"
            style={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
          >
            <List
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: "hsl(var(--foreground))" }}
            >
              No orders found
            </h3>
            <p style={{ color: "hsl(var(--foreground))" }}>
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              style={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
              }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {booking.items.length} item
                        {booking.items.length > 1 ? "s" : ""}
                      </h3>
                      <div className="mt-1 space-y-1">
                        {booking.items.slice(0, 3).map((item, index) => (
                          <div
                            key={index}
                            className="text-sm"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            {item.quantity}x {item.product.name}
                            {item.quantity > 1 && (
                              <span
                                className="text-xs ml-1"
                                style={{
                                  color: "hsl(var(--muted-foreground))",
                                }}
                              >
                                (₹{item.pricePerDay}/day each)
                              </span>
                            )}
                          </div>
                        ))}
                        {booking.items.length > 3 && (
                          <div
                            className="text-sm"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            +{booking.items.length - 3} more items
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p style={{ color: "hsl(var(--foreground))" }}>
                          {booking.customer.name}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "hsl(var(--foreground))" }}
                        >
                          {booking.customer.phone1}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span
                        className="font-medium"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        Rental Period:
                      </span>
                      <p
                        className="font-medium"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {format(parseISO(booking.startDate), "MMM dd, yyyy")} -{" "}
                        {format(parseISO(booking.endDate), "MMM dd, yyyy")}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        Time: {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <div>
                      <span
                        className="font-medium"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        Total Amount:
                      </span>
                      <p className="font-semibold text-green-600 text-lg">
                        ₹{booking.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div
                      className="mt-3 p-3 rounded-lg border"
                      style={{
                        backgroundColor: "hsl(var(--muted))",
                        borderColor: "hsl(var(--border))",
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        Notes:
                      </span>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {booking.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                  <button
                    onClick={() => handleEditBooking(booking)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Booking Dialog */}
      {editingBooking && (
        <BookingDialog
          mode="edit"
          bookingId={editingBooking.id}
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          onSuccess={handleBookingUpdated}
        />
      )}
    </div>
  );
}
