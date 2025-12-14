// Shared customers cache to prevent duplicate API calls across components

// Module-level cache for customers
let customersCache: any[] | null = null;
let customersFetchPromise: Promise<any[]> | null = null;

// Global fetch function with caching
export const fetchCustomersGlobal = async (): Promise<any[]> => {
  // Return cached data if available
  if (customersCache) {
    console.log('📦 Using cached customers');
    return customersCache;
  }

  // Return existing promise if fetch is in progress
  if (customersFetchPromise) {
    console.log('⏳ Waiting for existing customers fetch');
    return customersFetchPromise;
  }

  // Create new fetch promise
  customersFetchPromise = (async () => {
    console.log('🔄 Fetching customers from API...');
    const response = await fetch('/api/customers');
    if (response.ok) {
      const data = await response.json();
      customersCache = data; // Cache the result
      console.log('✅ Customers fetched and cached:', data.length);
      return data;
    }
    throw new Error('Failed to fetch customers');
  })();

  try {
    const result = await customersFetchPromise;
    return result;
  } catch (error) {
    // Reset promise on error so it can be retried
    customersFetchPromise = null;
    throw error;
  } finally {
    // Clear the promise after completion
    customersFetchPromise = null;
  }
};

// Function to clear cache (useful when customers are added/updated)
export const clearCustomersCache = () => {
  customersCache = null;
  customersFetchPromise = null;
  console.log('🗑️ Customers cache cleared');
};

// Function to update cache with new customer data
export const updateCustomersCache = (newCustomers: any[]) => {
  customersCache = newCustomers;
  console.log('🔄 Customers cache updated');
};