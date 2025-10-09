'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, X, Eye, Search, FileText } from 'lucide-react';
import { DataGrid, Column } from '@/components/ui/data-grid';
import { AddBookingForm } from './add-booking-form';
import { EditBookingForm } from './edit-booking-form';
import { DeleteBookingButton } from './delete-booking-button';
import { formatId, searchInIds, calculateBookingStatus, getBookingStatusColor, type BookingStatus } from '@/lib/utils';

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
  eventDate?: string;  // Optional event date
  totalAmount: number;
  advancePayment?: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerId: number;
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
  const router = useRouter();

  // Function to navigate to invoice page
  const handleGenerateInvoice = (booking: Booking) => {
    const invoiceId = booking.originalBookingId || booking.id;
    router.push(`/bookings/invoice/${invoiceId}`);
  };

  // Helper function to format custom timing
  const formatCustomTiming = (item: BookingItem): string => {
    if (!item.itemStartDate || !item.itemEndDate) return '';
    
    const startDate = format(new Date(item.itemStartDate), 'dd MMM, yyyy');
    const endDate = format(new Date(item.itemEndDate), 'dd MMM, yyyy');
    const startTime = item.itemStartTime || '';
    const endTime = item.itemEndTime || '';
    
    if (startDate === endDate) {
      return `${startDate} ${startTime}-${endTime}`;
    } else {
      return `${startDate} ${startTime} - ${endDate} ${endTime}`;
    }
  };

  // Helper function to separate items by timing type
  const separateItemsByTiming = (items: BookingItem[]) => {
    const regularItems = items.filter(item => !item.itemStartDate && !item.itemEndDate);
    const customTimingItems = items.filter(item => item.itemStartDate || item.itemEndDate);
    return { regularItems, customTimingItems };
  };

  // Helper function to create separate booking entries for custom timing items
  const createSeparateBookingEntries = (bookings: Booking[]): Booking[] => {
    const separatedEntries: Booking[] = [];

    bookings.forEach(booking => {
      const { regularItems, customTimingItems } = separateItemsByTiming(booking.items);

      // Create entry for custom timing items (if any)
      if (customTimingItems.length > 0) {
        customTimingItems.forEach(customItem => {
          const customStartDate = customItem.itemStartDate || booking.startDate;
          const customEndDate = customItem.itemEndDate || booking.endDate;
          
          // Create individual entry for each custom timing item
          const customBookingEntry: Booking = {
            ...booking,
            id: booking.id + 0.1 + (customItem.id / 10000), // Unique ID for sorting
            startDate: customStartDate,
            endDate: customEndDate,
            startTime: customItem.itemStartTime || booking.startTime,
            endTime: customItem.itemEndTime || booking.endTime,
            items: [customItem], // Only this custom timing item
            totalAmount: customItem.subtotal, // Use item's subtotal
            // Calculate status based on custom timing dates
            status: calculateBookingStatus(customStartDate, customEndDate, booking.status === 'cancelled'),
            // Add a flag to identify this as a custom timing entry
            isCustomTimingEntry: true,
            originalBookingId: booking.id
          };
          separatedEntries.push(customBookingEntry as Booking);
        });
      }

      // Create entry for regular items (if any)
      if (regularItems.length > 0) {
        const regularBookingEntry: Booking = {
          ...booking,
          items: regularItems,
          totalAmount: regularItems.reduce((sum, item) => sum + item.subtotal, 0),
          // Recalculate status for regular items too, in case original was incorrect
          status: calculateBookingStatus(booking.startDate, booking.endDate, booking.status === 'cancelled'),
          // Add a flag to identify this as a regular entry
          isCustomTimingEntry: false,
          originalBookingId: booking.id
        };
        separatedEntries.push(regularBookingEntry);
      }
    });

    // Sort by start date (ascending) so custom timing items appear in correct chronological order
    return separatedEntries.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  // Custom search function for bookings
  const searchBookings = (bookings: Booking[], searchTerm: string): Booking[] => {
    if (!searchTerm.trim()) return bookings;
    
    const searchLower = searchTerm.toLowerCase();
    console.log('Searching for:', searchLower);
    
    return bookings.filter(booking => {
      console.log('Checking booking:', booking.id, 'Customer:', booking.customer?.name);
      
      // Search in booking ID (formatted)
      if (formatId(booking.id).toLowerCase().includes(searchLower)) {
        console.log('Found match in booking ID');
        return true;
      }
      
      // Search in customer data
      if (booking.customer?.name?.toLowerCase().includes(searchLower)) {
        console.log('Found match in customer name');
        return true;
      }
      if (booking.customer?.phone1?.toLowerCase().includes(searchLower)) {
        console.log('Found match in customer phone1');
        return true;
      }
      if (booking.customer?.phone2?.toLowerCase().includes(searchLower)) {
        console.log('Found match in customer phone2');
        return true;
      }
      if (booking.customer?.email?.toLowerCase().includes(searchLower)) {
        console.log('Found match in customer email');
        return true;
      }
      if (booking.customer?.address?.toLowerCase().includes(searchLower)) {
        console.log('Found match in customer address');
        return true;
      }
      
      // Search in product names and categories
      if (booking.items.some(item => 
        item.product.name.toLowerCase().includes(searchLower) ||
        item.product.category?.toLowerCase().includes(searchLower)
      )) return true;
      
      // Search in custom timing dates (if any)
      if (booking.items.some(item => {
        if (item.itemStartDate && format(new Date(item.itemStartDate), 'dd MMM, yyyy').toLowerCase().includes(searchLower)) return true;
        if (item.itemEndDate && format(new Date(item.itemEndDate), 'dd MMM, yyyy').toLowerCase().includes(searchLower)) return true;
        if (item.itemStartTime && item.itemStartTime.includes(searchLower)) return true;
        if (item.itemEndTime && item.itemEndTime.includes(searchLower)) return true;
        return false;
      })) return true;
      
      // Search in status
      if (booking.status.toLowerCase().includes(searchLower)) return true;
      
      // Search in notes
      if (booking.notes?.toLowerCase().includes(searchLower)) return true;
      
      // Search in dates (formatted)
      if (format(new Date(booking.startDate), 'dd MMM, yyyy').toLowerCase().includes(searchLower)) return true;
      if (format(new Date(booking.endDate), 'dd MMM, yyyy').toLowerCase().includes(searchLower)) return true;
      if (booking.eventDate && format(new Date(booking.eventDate), 'dd MMM, yyyy').toLowerCase().includes(searchLower)) return true;
      
      // Search in times
      if (booking.startTime.includes(searchLower)) return true;
      if (booking.endTime.includes(searchLower)) return true;
      
      // Search in amounts (as string)
      if (booking.totalAmount.toString().includes(searchLower)) return true;
      if (booking.advancePayment?.toString().includes(searchLower)) return true;
      
      return false;
    });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setOriginalBookings(data); // Store original data
        const separatedData = createSeparateBookingEntries(data);
        setBookings(separatedData);
        setFilteredBookings(separatedData);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
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
    
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 ${
        isCustomEntry 
          ? 'bg-blue-50 border-blue-200 dark:border-blue-700' 
          : 'bg-white dark:bg-gray-800'
      }`}>
        {/* Header with ID, Status and Entry Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <code className="text-sm px-2 py-1 rounded font-mono"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              {formatId(booking.originalBookingId || booking.id)}
            </code>
            {isCustomEntry && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                Custom Timing
              </span>
            )}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        {/* Customer Info */}
        <div>
          <div className={`font-medium ${isCustomEntry ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
            {booking.customer.name}
          </div>
          <div className={`text-sm ${isCustomEntry ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {booking.customer.phone1}
          </div>
        </div>

        {/* Rental Period */}
        <div className="text-sm">
          <div className={`font-medium ${isCustomEntry ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
            {format(new Date(booking.startDate), 'dd MMM, yyyy')} - {format(new Date(booking.endDate), 'dd MMM, yyyy')}
          </div>
          <div className={`${isCustomEntry ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {booking.startTime} - {booking.endTime}
          </div>
          {booking.eventDate && (
            <div className="text-blue-600 dark:text-blue-400 font-medium mt-1">
              Event: {format(new Date(booking.eventDate), 'dd MMM, yyyy')}
            </div>
          )}
        </div>

        {/* Products */}
        <div>
          <div className={`text-sm font-medium mb-1 ${isCustomEntry ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
            Items ({booking.items.length})
          </div>
          <div className="space-y-1">
            {booking.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className={`${isCustomEntry ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                  {item.quantity}x {item.product.name}
                </span>
                <span className={`${isCustomEntry ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  ₹{item.pricePerDay}/day
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
          <span className="font-medium text-green-600 dark:text-green-400 text-lg">
            ₹{booking.totalAmount.toFixed(2)}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleGenerateInvoice(booking)}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
              title="Generate Invoice"
            >
              <FileText className="h-4 w-4" />
            </button>
            <EditBookingForm 
              booking={{
                ...booking,
                id: booking.originalBookingId || booking.id,
                // Find original booking to get all items
                items: originalBookings.find(b => b.id === (booking.originalBookingId || booking.id))?.items || booking.items
              }} 
              onBookingUpdated={fetchBookings}
            />
            <DeleteBookingButton 
              booking={{
                ...booking,
                id: booking.originalBookingId || booking.id
              }} 
              onBookingDeleted={fetchBookings}
            />
          </div>
        </div>
      </div>
    );
  };

  const columns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking ID',
      width: '15%',
      render: (booking) => (
        <div className="flex items-center gap-2">
          <code className="text-sm px-3 py-2 rounded font-mono" 
                style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            {formatId(booking.originalBookingId || booking.id)}
          </code>
          {booking.isCustomTimingEntry && (
            <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
              Custom
            </span>
          )}
        </div>
      )
    },
    {
      key: 'items',
      header: 'Products',
      width: '25%',
      render: (booking) => {
        const isCustomEntry = booking.isCustomTimingEntry;
        
        return (
          <div className={`space-y-2 ${isCustomEntry ? 'p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700' : ''}`}>
            <div className={`font-medium text-sm mb-1`} 
                 style={{ color: isCustomEntry ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
              {isCustomEntry ? 'Custom Timing' : 'Regular Items'} ({booking.items.length})
            </div>
            <div className="space-y-1">
              {booking.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm" 
                         style={{ color: isCustomEntry ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                      {item.quantity}x {item.product.name}
                    </div>
                    <div className="text-xs" 
                         style={{ color: isCustomEntry ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                      ₹{item.pricePerDay}/day
                    </div>
                  </div>
                  {isCustomEntry && (item.itemStartDate || item.itemEndDate) && (
                    <div className="text-xs text-blue-600 font-mono">
                      {formatCustomTiming(item)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '15%',
      render: (booking) => (
        <div className="space-y-2">
          <div>
            <div className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{booking.customer.name}</div>
            <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{booking.customer.phone1}</div>
          </div>
        </div>
      )
    },
    {
      key: 'dates',
      header: 'Rental Period',
      width: '15%',
      render: (booking) => (
        <div>
          <div className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
            {format(new Date(booking.startDate), 'dd MMM, yyyy')}
          </div>
          <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {booking.startTime} - {booking.endTime}
          </div>
          <div className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
            to {format(new Date(booking.endDate), 'dd MMM, yyyy')}
          </div>
        </div>
      )
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      width: '12%',
      render: (booking) => (
        <div>
          {booking.eventDate ? (
            <div className="text-sm font-medium text-blue-600">
              {format(new Date(booking.eventDate), 'dd MMM, yyyy')}
            </div>
          ) : (
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Not set
            </div>
          )}
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      width: '10%',
      render: (booking) => (
        <span className="font-medium text-green-600">
          ₹{booking.totalAmount.toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (booking) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '12%',
      render: (booking) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleGenerateInvoice(booking)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            title="Generate Invoice"
          >
            <FileText className="h-4 w-4" />
          </button>
          <EditBookingForm 
            booking={{
              ...booking,
              id: booking.originalBookingId || booking.id,
              // Find original booking to get all items
              items: originalBookings.find(b => b.id === (booking.originalBookingId || booking.id))?.items || booking.items
            }} 
            onBookingUpdated={fetchBookings}
          />
          <DeleteBookingButton 
            booking={{
              ...booking,
              id: booking.originalBookingId || booking.id
            }} 
            onBookingDeleted={fetchBookings}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Bookings</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Manage rental bookings and schedules</p>
        </div>
        <AddBookingForm onBookingAdded={fetchBookings} />
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