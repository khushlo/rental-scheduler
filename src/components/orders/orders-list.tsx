'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, List, Search, Filter } from 'lucide-react';

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
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  items: BookingItem[];
  customer: {
    name: string;
    email: string;
  };
}

export function OrdersList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'startDate' | 'createdAt' | 'totalAmount'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [bookings, searchTerm, statusFilter, sortBy, sortOrder]);

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

  const applyFiltersAndSort = () => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(booking =>
        booking.items.some(item => 
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSortChange = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
          <h1 className="text-2xl font-bold text-black dark:text-white">Orders List</h1>
          <p className="text-black dark:text-gray-400">View all your rental orders in a detailed list format</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-black">Sort by:</span>
              <button
                onClick={() => handleSortChange('startDate')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  sortBy === 'startDate' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Date {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('totalAmount')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  sortBy === 'totalAmount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Amount {sortBy === 'totalAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('createdAt')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-black">
          Showing {filteredBookings.length} of {bookings.length} orders
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No orders found</h3>
            <p className="text-black">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-black">
                        {booking.items.length} item{booking.items.length > 1 ? 's' : ''}
                      </h3>
                      <div className="mt-1 space-y-1">
                        {booking.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="text-sm text-black">
                            {item.quantity}x {item.product.name}
                            {item.quantity > 1 && (
                              <span className="text-xs text-gray-600 ml-1">
                                (₹{item.pricePerDay}/day each)
                              </span>
                            )}
                          </div>
                        ))}
                        {booking.items.length > 3 && (
                          <div className="text-sm text-gray-600">
                            +{booking.items.length - 3} more items
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-black">{booking.customer.name}</p>
                        <p className="text-sm text-black">{booking.customer.email}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-black font-medium">Rental Period:</span>
                      <p className="font-medium text-black">
                        {format(parseISO(booking.startDate), 'MMM dd, yyyy')} - {format(parseISO(booking.endDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-black">
                        Time: {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <div>
                      <span className="text-black font-medium">Total Amount:</span>
                      <p className="font-semibold text-green-600 text-lg">₹{booking.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-3 p-3 bg-gray-200 rounded-lg border border-gray-200">
                      <span className="text-sm text-black font-medium">Notes:</span>
                      <p className="text-sm text-black mt-1">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}