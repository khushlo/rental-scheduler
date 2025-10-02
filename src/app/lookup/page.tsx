'use client';

import { useState } from 'react';
import { IdSearch, IdDetails, IdRelationships } from '@/components/ui/id-details';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface LookupResult {
  data: any;
  type: 'booking' | 'customer' | 'product';
  id: string;
  error?: string;
}

export default function IdLookupPage() {
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<LookupResult[]>([]);

  const handleLookup = async (id: string, type: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/lookup?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`);
      
      if (response.ok) {
        const data = await response.json();
        const newResult: LookupResult = {
          data,
          type: type as any,
          id
        };
        setResult(newResult);
        
        // Add to history (keep last 10)
        setHistory(prev => [newResult, ...prev.slice(0, 9)]);
      } else {
        const errorData = await response.json();
        setResult({
          data: null,
          type: type as any,
          id,
          error: errorData.error || 'Not found'
        });
      }
    } catch (error) {
      setResult({
        data: null,
        type: type as any,
        id,
        error: 'Failed to lookup record'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResultDetails = (result: LookupResult) => {
    if (result.error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1">{result.error}</p>
        </div>
      );
    }

    if (!result.data) return null;

    return (
      <div className="space-y-6">
        {/* Success indicator */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Record Found</span>
          </div>
        </div>

        {/* ID Details */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {result.type} Details
            </h2>
            <IdDetails
              id={result.id}
              type={result.type}
              data={result.data}
            />
          </div>

          {/* Main Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Basic Information</h3>
              {result.type === 'booking' && (
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Status:</span> {result.data.status}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Start Date:</span> {new Date(result.data.startDate).toLocaleDateString()}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">End Date:</span> {new Date(result.data.endDate).toLocaleDateString()}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Total Amount:</span> ${result.data.totalAmount}</p>
                  {result.data.notes && (
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Notes:</span> {result.data.notes}</p>
                  )}
                </div>
              )}
              
              {result.type === 'customer' && (
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {result.data.name}</p>
                  <p><span className="font-medium">Email:</span> {result.data.email}</p>
                  {result.data.phone && (
                    <p><span className="font-medium">Phone:</span> {result.data.phone}</p>
                  )}
                  {result.data.address && (
                    <p><span className="font-medium">Address:</span> {result.data.address}</p>
                  )}
                  {result.data.notes && (
                    <p><span className="font-medium">Notes:</span> {result.data.notes}</p>
                  )}
                </div>
              )}
              
              {result.type === 'product' && (
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {result.data.name}</p>
                  {result.data.description && (
                    <p><span className="font-medium">Description:</span> {result.data.description}</p>
                  )}
                  {result.data.category && (
                    <p><span className="font-medium">Category:</span> {result.data.category}</p>
                  )}
                  <p><span className="font-medium">Price per Day:</span> ${result.data.pricePerDay}</p>
                  <p><span className="font-medium">Stock:</span> {result.data.stock}</p>
                  <p><span className="font-medium">Active:</span> {result.data.isActive ? 'Yes' : 'No'}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Created:</span> {new Date(result.data.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Updated:</span> {new Date(result.data.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Relationships */}
            <div>
              <IdRelationships 
                data={result.data} 
                type={result.type} 
                onLookup={handleLookup}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ID Lookup</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Search for bookings, customers, and products by their unique IDs
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <IdSearch onSearch={handleLookup} loading={loading} />
      </div>

      {/* Results */}
      {result && (
        <div>
          {renderResultDetails(result)}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Lookups</h2>
          <div className="space-y-2">
            {history.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setResult(item)}
              >
                <div className="flex items-center gap-3">
                  <IdDetails 
                    id={item.id} 
                    type={item.type} 
                    data={item.data}
                  />
                  {item.error && (
                    <span className="text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {item.error}
                    </span>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Again
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}