"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  isWithinInterval,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { fetchBookingsGlobal } from "@/lib/bookings-cache";

interface BookingItem {
  id: string;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  product: {
    id: string;
    name: string;
    pricePerDay: number;
  };
}

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
  items: BookingItem[];
  customer: {
    name: string;
  };
}

interface CalendarDay {
  date: Date;
  bookings: Booking[];
  isCurrentMonth: boolean;
}

interface CalendarViewProps {
  selectedProductId?: number | null;
  showAllItems: boolean;
}

export function CalendarView({ selectedProductId, showAllItems }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Initialize date on client side only to prevent hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await fetchBookingsGlobal(selectedProductId, showAllItems);
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedProductId, showAllItems]);
  if (!currentDate) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getBookingsForDate = (date: Date): Booking[] => {
    return bookings.filter((booking) => {
      const startDate = parseISO(booking.startDate);
      const endDate = parseISO(booking.endDate);

      return (
        isWithinInterval(date, { start: startDate, end: endDate }) ||
        isSameDay(date, startDate) ||
        isSameDay(date, endDate)
      );
    });
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700";
      case "CONFIRMED":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700";
      case "ACTIVE":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700";
      case "COMPLETED":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600";
      case "CANCELLED":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(
      direction === "next"
        ? addMonths(currentDate, 1)
        : subMonths(currentDate, 1)
    );
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  const selectedDayBookings = selectedDay
    ? getBookingsForDate(selectedDay)
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendar View
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your rental bookings in a calendar format
          </p>
        </div>
        <button
          onClick={goToToday}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <CalendarIcon className="h-4 w-4" />
          Today
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {format(currentDate, "MMMM yyyy")}
              </h2>

              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayBookings = getBookingsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDay(day)}
                    className={`
                      min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${
                        !isCurrentMonth
                          ? "bg-gray-50 dark:bg-gray-800 text-gray-400"
                          : "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      }
                      ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                          : ""
                      }
                      ${
                        isTodayDate && isCurrentMonth
                          ? "bg-yellow-50 dark:bg-yellow-900/20"
                          : ""
                      }
                    `}
                  >
                    <div
                      className={`
                      text-sm font-medium mb-1
                      ${
                        isTodayDate && isCurrentMonth
                          ? "text-yellow-700 dark:text-yellow-400"
                          : ""
                      }
                      ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-100"
                      }
                    `}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => {
                        // Calculate display text based on product selection
                        let displayText, titleText;
                        if (selectedProductId) {
                          // Show quantity for selected product only
                          const selectedProductItems = booking.items.filter(item => 
                            item.product.id == selectedProductId || item.product.id == selectedProductId.toString()
                          );
                          const totalQuantity = selectedProductItems.reduce((sum, item) => sum + item.quantity, 0);
                          const productName = selectedProductItems[0]?.product.name || 'Unknown Product';
                          displayText = `${totalQuantity}x`;
                          titleText = `${totalQuantity}x ${productName} - ${booking.customer.name}`;
                        } else {
                          // Show total items count
                          displayText = `${booking.items.length} item${booking.items.length > 1 ? "s" : ""}`;
                          titleText = `${booking.items.length} item${booking.items.length > 1 ? "s" : ""} - ${booking.customer.name}`;
                        }
                        
                        return (
                          <div
                            key={booking.id}
                            className={`
                              text-xs p-1 rounded border truncate
                              ${getStatusColor(booking.status)}
                            `}
                            title={titleText}
                          >
                            {displayText}
                          </div>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Selected Day Details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {selectedDay
                ? format(selectedDay, "MMMM d, yyyy")
                : "Select a day"}
            </h3>

            {selectedDay && selectedDayBookings.length > 0 ? (
              <div className="space-y-3">
                {selectedDayBookings.map((booking) => {
                  // Calculate display information based on product selection
                  let headerText, itemsToShow;
                  if (selectedProductId) {
                    // Show only the selected product items
                    const selectedProductItems = booking.items.filter(item => 
                      item.product.id == selectedProductId || item.product.id == selectedProductId.toString()
                    );
                    const totalQuantity = selectedProductItems.reduce((sum, item) => sum + item.quantity, 0);
                    const productName = selectedProductItems[0]?.product.name || 'Unknown Product';
                    headerText = `${totalQuantity}x ${productName}`;
                    itemsToShow = selectedProductItems;
                  } else {
                    // Show all items
                    headerText = `${booking.items.length} item${booking.items.length > 1 ? "s" : ""}`;
                    itemsToShow = booking.items;
                  }
                  
                  return (
                    <div
                      key={booking.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {headerText}
                        </h4>
                        <span
                          className={`
                          text-xs px-2 py-1 rounded-full font-medium
                          ${getStatusColor(booking.status)}
                        `}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="mb-2 space-y-1">
                        {itemsToShow.map((item, index) => (
                          <div
                            key={index}
                            className="text-xs text-gray-900 dark:text-gray-100"
                          >
                            {item.quantity}x {item.product.name} (₹
                            {item.pricePerDay}/day)
                          </div>
                        ))}
                      </div>

                    <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {booking.customer.name}
                    </p>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      {format(parseISO(booking.startDate), "MMM d")} -{" "}
                      {format(parseISO(booking.endDate), "MMM d")}
                    </p>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      {booking.startTime} - {booking.endTime}
                    </p>

                    <p className="text-sm font-medium text-green-600">
                      ₹{booking.totalAmount.toFixed(2)}
                    </p>

                    {booking.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                        {booking.notes}
                      </p>
                    )}
                    </div>
                  );
                })}
              </div>
            ) : selectedDay ? (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                No bookings for this day
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Click on a day to see booking details
              </p>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Status Legend
              </h4>
              <div className="space-y-2">
                {[
                  { status: "PENDING", label: "Pending" },
                  { status: "CONFIRMED", label: "Confirmed" },
                  { status: "ACTIVE", label: "Active" },
                  { status: "COMPLETED", label: "Completed" },
                  { status: "CANCELLED", label: "Cancelled" },
                ].map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded border ${getStatusColor(
                        status as Booking["status"]
                      )}`}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
