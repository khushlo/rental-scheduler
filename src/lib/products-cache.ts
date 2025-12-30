// Shared products cache to prevent duplicate API calls across components

import { apiGet } from '@/lib/api-client';

// Module-level cache for products - now tenant-aware
let productsCache: { [tenantId: number]: any[] } = {};
let productsFetchPromises: { [tenantId: number]: Promise<any[]> } = {};

// Helper function to get current tenant ID from user session
const getCurrentTenantId = async (): Promise<number | null> => {
  try {
    const response = await apiGet('/api/auth/verify');
    if (response.ok) {
      const data = await response.json();
      return data.user?.tenantId || null;
    }
  } catch (error) {
    console.error('Failed to get current tenant ID:', error);
  }
  return null;
};

// Global fetch function with tenant-aware caching
export const fetchProductsGlobal = async (): Promise<any[]> => {
  const tenantId = await getCurrentTenantId();
  
  if (!tenantId) {
    throw new Error('Unable to determine current tenant');
  }

  // Return cached data if available for this tenant
  if (productsCache[tenantId]) {
    console.log(`📦 Using cached products for tenant ${tenantId}`);
    return productsCache[tenantId];
  }

  // Return existing promise if fetch is in progress for this tenant
  if (productsFetchPromises[tenantId]) {
    console.log(`⏳ Waiting for existing products fetch for tenant ${tenantId}`);
    return productsFetchPromises[tenantId];
  }

  // Create new fetch promise for this tenant
  productsFetchPromises[tenantId] = (async () => {
    console.log(`🔄 Fetching products from API for tenant ${tenantId}...`);
    const response = await apiGet('/api/products');
    if (response.ok) {
      const data = await response.json();
      const activeProducts = data.filter((product: any) => product.status);
      productsCache[tenantId] = activeProducts; // Cache the result for this tenant
      console.log(`✅ Products fetched and cached for tenant ${tenantId}:`, activeProducts.length);
      return activeProducts;
    }
    throw new Error('Failed to fetch products');
  })();

  try {
    const result = await productsFetchPromises[tenantId];
    return result;
  } catch (error) {
    // Reset promise on error so it can be retried
    delete productsFetchPromises[tenantId];
    throw error;
  } finally {
    // Clear the promise after completion
    delete productsFetchPromises[tenantId];
  }
};

// Function to clear cache for current tenant (useful when products are added/updated)
export const clearProductsCache = async () => {
  const tenantId = await getCurrentTenantId();
  if (tenantId) {
    delete productsCache[tenantId];
    delete productsFetchPromises[tenantId];
    console.log(`🗑️ Cleared products cache for tenant ${tenantId}`);
  }
};

// Function to clear all caches (useful when switching tenants)
export const clearAllProductsCache = () => {
  productsCache = {};
  productsFetchPromises = {};
  console.log('🗑️ All products cache cleared');
};

// Function to update cache with new product data
export const updateProductsCache = (newProducts: any[]) => {
  productsCache = newProducts;
  console.log('🔄 Products cache updated');
};