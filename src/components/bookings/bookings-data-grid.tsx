'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, X, Eye, Search } from 'lucide-react';
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
  totalAmount: number;
  advancePayment?: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerId: number;
  items: BookingItem[];
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom mobile card renderer for bookings
  const renderBookingCard = (booking: Booking, index: number) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      {/* Header with ID and Status */}
      <div className="flex items-center justify-between">
        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
          {formatId(booking.id)}
        </code>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      {/* Customer Info */}
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{booking.customer.name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{booking.customer.phone1}</div>
      </div>

      {/* Rental Period */}
      <div className="text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {format(new Date(booking.startDate), 'MMM dd, yyyy')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {booking.startTime} - {booking.endTime}
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Products ({booking.items.length} item{booking.items.length > 1 ? 's' : ''})
        </div>
        <div className="space-y-1">
          {booking.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-900 dark:text-gray-100">
                {item.quantity}x {item.product.name}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                ₹{item.pricePerDay}/day
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total Amount */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
        <span className="font-medium text-green-600 text-lg">
          ₹{booking.totalAmount.toFixed(2)}
        </span>
        <div className="flex items-center space-x-2">
          <EditBookingForm 
            booking={booking} 
            onBookingUpdated={fetchBookings}
          />
          <DeleteBookingButton 
            booking={booking} 
            onBookingDeleted={fetchBookings}
          />
        </div>
      </div>
    </div>
  );

  const columns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking ID',
      width: '15%',
      render: (booking) => (
        <code className="text-sm bg-gray-100 px-3 py-2 rounded font-mono">
          {formatId(booking.id)}
        </code>
      )
    },
    {
      key: 'items',
      header: 'Products',
      width: '30%',
      render: (booking) => (
        <div className="space-y-2">
          <div className="font-medium text-gray-900 dark:text-gray-700 mb-1">
            {booking.items.length} item{booking.items.length > 1 ? 's' : ''}
          </div>
          <div className="space-y-2">
            {booking.items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-900 dark:text-gray-700">
                    {item.quantity}x {item.product.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-700">
                    ₹{item.pricePerDay}/day
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '18%',
      render: (booking) => (
        <div className="space-y-2">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-700">{booking.customer.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-500">{booking.customer.phone1}</div>
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
          <div className="text-sm font-medium text-gray-900 dark:text-gray-700">
            {format(new Date(booking.startDate), 'MMM dd, yyyy')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-600">
            {booking.startTime} - {booking.endTime}
          </div>
          <div className="text-sm text-gray-900 dark:text-gray-700">
            to {format(new Date(booking.endDate), 'MMM dd, yyyy')}
          </div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      width: '12%',
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
      width: '8%',
      render: (booking) => (
        <div className="flex items-center space-x-2">
          <EditBookingForm 
            booking={booking} 
            onBookingUpdated={fetchBookings}
          />
          <DeleteBookingButton 
            booking={booking} 
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage rental bookings and schedules</p>
        </div>
        <AddBookingForm onBookingAdded={fetchBookings} />
      </div>

      <DataGrid
        data={bookings}
        columns={columns}
        pageSize={50}
        searchPlaceholder="Search by Booking ID, Customer ID, Product ID, names, or status..."
        loading={loading}
        emptyMessage="No bookings found. Create your first booking to get started."
        renderCard={renderBookingCard}
      />
    </div>
  );
}