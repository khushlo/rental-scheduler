// Shared customers cache to prevent duplicate API calls across components

import { apiGet } from '@/lib/api-client';

// Module-level cache for customers - now tenant-aware
let customersCache: { [tenantId: number]: any[] } = {};
let customersFetchPromises: { [tenantId: number]: Promise<any[]> } = {};

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
export const fetchCustomersGlobal = async (): Promise<any[]> => {
  const tenantId = await getCurrentTenantId();
  
  if (!tenantId) {
    throw new Error('Unable to determine current tenant');
  }

  // Return cached data if available for this tenant
  if (customersCache[tenantId]) {
    console.log(`📦 Using cached customers for tenant ${tenantId}`);
    return customersCache[tenantId];
  }

  // Return existing promise if fetch is in progress for this tenant
  const existingPromise = customersFetchPromises[tenantId];
  if (existingPromise) {
    console.log(`⏳ Waiting for existing customers fetch for tenant ${tenantId}`);
    return existingPromise;
  }

  // Create new fetch promise for this tenant
  customersFetchPromises[tenantId] = (async () => {
    console.log(`🔄 Fetching customers from API for tenant ${tenantId}...`);
    const response = await apiGet('/api/customers');
    if (response.ok) {
      const data = await response.json();
      customersCache[tenantId] = data; // Cache the result for this tenant
      console.log(`✅ Customers fetched and cached for tenant ${tenantId}:`, data.length);
      return data;
    }
    throw new Error('Failed to fetch customers');
  })();

  try {
    const result = await customersFetchPromises[tenantId];
    return result;
  } catch (error) {
    // Reset promise on error so it can be retried
    delete customersFetchPromises[tenantId];
    throw error;
  } finally {
    // Clear the promise after completion
    delete customersFetchPromises[tenantId];
  }
};

// Function to clear cache for current tenant (useful when customers are added/updated)
export const clearCustomersCache = async () => {
  const tenantId = await getCurrentTenantId();
  if (tenantId) {
    delete customersCache[tenantId];
    delete customersFetchPromises[tenantId];
    console.log(`🗑️ Cleared customers cache for tenant ${tenantId}`);
  }
};

// Function to clear all caches (useful when switching tenants)
export const clearAllCustomersCache = () => {
  customersCache = {};
  customersFetchPromises = {};
  console.log('🗑️ All customers cache cleared');
};

// Function to update cache with new customer data for current tenant
export const updateCustomersCache = async (newCustomers: any[]) => {
  const tenantId = await getCurrentTenantId();
  if (tenantId) {
    customersCache[tenantId] = newCustomers;
    console.log(`🔄 Customers cache updated for tenant ${tenantId}`);
  }
};