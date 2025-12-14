// Shared bookings cache to prevent duplicate API calls across components

// Module-level cache for bookings
const bookingsCache = new Map<string, any[]>();
const bookingsFetchPromises = new Map<string, Promise<any[]>>();

// Global fetch function with caching
export const fetchBookingsGlobal = async (selectedProductId?: number | null, showAllItems?: boolean): Promise<any[]> => {
  // Create cache key based on parameters
  const cacheKey = showAllItems ? 'all' : (selectedProductId ? `product-${selectedProductId}` : 'none');
  
  // Return cached data if available
  if (bookingsCache.has(cacheKey)) {
    console.log(`📦 Using cached bookings for: ${cacheKey}`);
    return bookingsCache.get(cacheKey)!;
  }

  // Return existing promise if fetch is in progress
  if (bookingsFetchPromises.has(cacheKey)) {
    console.log(`⏳ Waiting for existing fetch: ${cacheKey}`);
    return bookingsFetchPromises.get(cacheKey)!;
  }

  // Only fetch if showAllItems is true OR a specific product is selected
  if (!showAllItems && !selectedProductId) {
    return [];
  }

  // Create new fetch promise
  const fetchPromise = (async () => {
    console.log(`🔄 Fetching bookings for: ${cacheKey}`);
    let url = "/api/bookings";
    
    if (!showAllItems && selectedProductId) {
      url += `?productId=${selectedProductId}`;
    }
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      bookingsCache.set(cacheKey, data); // Cache the result
      console.log(`✅ Bookings cached for: ${cacheKey}, count: ${data.length}`);
      return data;
    }
    throw new Error('Failed to fetch bookings');
  })();

  bookingsFetchPromises.set(cacheKey, fetchPromise);

  try {
    const result = await fetchPromise;
    bookingsFetchPromises.delete(cacheKey); // Clean up promise
    return result;
  } catch (error) {
    bookingsFetchPromises.delete(cacheKey); // Clean up promise on error
    throw error;
  }
};

// Function to clear cache (useful for refreshing data)
export const clearBookingsCache = (cacheKey?: string) => {
  if (cacheKey) {
    bookingsCache.delete(cacheKey);
    bookingsFetchPromises.delete(cacheKey);
  } else {
    bookingsCache.clear();
    bookingsFetchPromises.clear();
  }
};