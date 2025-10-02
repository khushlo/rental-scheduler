'use client';

import { useState } from 'react';
import { Search, Copy, Eye, ExternalLink, Calendar, Package, User } from 'lucide-react';
import { formatId, copyToClipboard } from '@/lib/utils';

interface IdDetailsProps {
  id: number | string;
  type: 'booking' | 'customer' | 'product';
  data?: any;
  onLookup?: (id: number | string, type: string) => void;
}

export function IdDetails({ id, type, data, onLookup }: IdDetailsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'customer':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'product':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getColorClass()}`}>
      {getIcon()}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide">
          {type}
        </span>
        <code className="text-sm font-mono bg-white/50 dark:bg-gray-900/50 px-2 py-1 rounded">
          {formatId(id, 12)}
        </code>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-white/50 dark:hover:bg-gray-900/50 rounded"
            title={`Copy ${type} ID`}
          >
            {copied ? (
              <span className="text-green-600 text-xs">✓</span>
            ) : (
              <Copy size={12} />
            )}
          </button>
          {onLookup && (
            <button
              onClick={() => onLookup(id, type)}
              className="p-1 hover:bg-white/50 dark:hover:bg-gray-900/50 rounded"
              title={`View ${type} details`}
            >
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>
      {data && (
        <div className="ml-2 text-xs">
          {type === 'booking' && data.customer?.name && (
            <span>• {data.customer.name}</span>
          )}
          {type === 'customer' && data.name && (
            <span>• {data.name}</span>
          )}
          {type === 'product' && data.name && (
            <span>• {data.name}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface IdSearchProps {
  onSearch: (id: string, type: string) => void;
  loading?: boolean;
}

export function IdSearch({ onSearch, loading }: IdSearchProps) {
  const [searchId, setSearchId] = useState('');
  const [searchType, setSearchType] = useState<'booking' | 'customer' | 'product'>('booking');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      onSearch(searchId.trim(), searchType);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Enter ID to lookup..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </div>
      <select
        value={searchType}
        onChange={(e) => setSearchType(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      >
        <option value="booking">Booking</option>
        <option value="customer">Customer</option>
        <option value="product">Product</option>
      </select>
      <button
        type="submit"
        disabled={loading || !searchId.trim()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Looking up...' : 'Lookup'}
      </button>
    </form>
  );
}

interface IdRelationshipsProps {
  data: any;
  type: 'booking' | 'customer' | 'product';
  onLookup?: (id: string, type: string) => void;
}

export function IdRelationships({ data, type, onLookup }: IdRelationshipsProps) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Related Records</h3>
      
      {type === 'booking' && (
        <div className="space-y-3">
          {/* Customer */}
          {data.customer && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Customer</h4>
              <IdDetails
                id={data.customer.id}
                type="customer"
                data={data.customer}
                onLookup={onLookup}
              />
            </div>
          )}
          
          {/* Products */}
          {data.items && data.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Products ({data.items.length})</h4>
              <div className="flex flex-wrap gap-2">
                {data.items.map((item: any) => (
                  <IdDetails
                    key={item.id}
                    id={item.product.id}
                    type="product"
                    data={item.product}
                    onLookup={onLookup}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {type === 'customer' && (
        <div className="space-y-3">
          {/* Recent Bookings */}
          {data.bookings && data.bookings.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Bookings ({data.bookings.length})</h4>
              <div className="space-y-2">
                {data.bookings.slice(0, 5).map((booking: any) => (
                  <IdDetails
                    key={booking.id}
                    id={booking.id}
                    type="booking"
                    data={booking}
                    onLookup={onLookup}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {type === 'product' && (
        <div className="space-y-3">
          {/* Active Bookings */}
          {data.bookingItems && data.bookingItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Active Bookings ({data.bookingItems.length})</h4>
              <div className="space-y-2">
                {data.bookingItems.slice(0, 5).map((item: any) => (
                  <IdDetails
                    key={item.id}
                    id={item.booking.id}
                    type="booking"
                    data={item.booking}
                    onLookup={onLookup}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}