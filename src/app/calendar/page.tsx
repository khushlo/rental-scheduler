'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';
import { OrdersList } from '@/components/orders/orders-list';
import { Calendar, List, Filter } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  quantity: number;
  rentPrice: number;
  status: boolean;
}

// Module-level cache to prevent duplicate API calls across component instances
let productsCache: Product[] | null = null;
let productsFetchPromise: Promise<Product[]> | null = null;

// Global fetch function with module-level caching
const fetchProductsGlobal = async (): Promise<Product[]> => {
  // Return cached data if available
  if (productsCache) {
    return productsCache;
  }

  // Return existing promise if fetch is in progress
  if (productsFetchPromise) {
    return productsFetchPromise;
  }

  // Create new fetch promise
  productsFetchPromise = (async () => {
    console.log('🔄 Fetching products from API...');
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      const activeProducts = data.filter((product: Product) => product.status);
      productsCache = activeProducts; // Cache the result
      console.log('✅ Products fetched and cached:', activeProducts.length);
      return activeProducts;
    }
    throw new Error('Failed to fetch products');
  })();

  try {
    const result = await productsFetchPromise;
    return result;
  } catch (error) {
    // Reset promise on error so it can be retried
    productsFetchPromise = null;
    throw error;
  }
};

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [products, setProducts] = useState<Product[]>(productsCache || []);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const activeProducts = await fetchProductsGlobal();
        setProducts(activeProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have cached data
    if (!productsCache) {
      loadProducts();
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Product Filter */}
      <div className="mb-6 flex justify-center">
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Product
          </label>
          <select
            value={selectedProductId ?? ''}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Select a Product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Show All Items Toggle */}
      <div className="mb-6 flex justify-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllItems}
            onChange={(e) => {
              setShowAllItems(e.target.checked);
              if (e.target.checked) {
                setSelectedProductId(null); // Reset product filter when showing all items
              }
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Show All Items (Load all bookings)
          </span>
        </label>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="h-4 w-4" />
            List View
          </button>
        </div>
      </div>

      {/* Content */}
      {!showAllItems && !selectedProductId ? (
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Select a Product or Show All Items</p>
            <p className="text-sm">Choose a specific product to view its bookings, or check "Show All Items" to view everything</p>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView selectedProductId={selectedProductId} showAllItems={showAllItems} />
      ) : (
        <OrdersList selectedProductId={selectedProductId} showAllItems={showAllItems} />
      )}
    </div>
  );
}