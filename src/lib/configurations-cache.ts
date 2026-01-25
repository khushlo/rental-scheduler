// Shared configurations cache to prevent duplicate API calls across components

import { apiGet } from '@/lib/api-client';

// Module-level cache for configurations - now tenant-aware
let configurationsCache: { [tenantId: number]: any[] } = {};
let configurationsFetchPromises: { [tenantId: number]: Promise<any[]> } = {};

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
export const fetchConfigurationsGlobal = async (): Promise<any[]> => {
  const tenantId = await getCurrentTenantId();
  
  if (!tenantId) {
    throw new Error('Unable to determine current tenant');
  }

  // Return cached data if available for this tenant
  if (configurationsCache[tenantId]) {
    console.log(`📦 Using cached configurations for tenant ${tenantId}`);
    return configurationsCache[tenantId];
  }

  // Return existing promise if already in progress for this tenant
  if (tenantId in configurationsFetchPromises) {
    console.log(`⏳ Waiting for ongoing configurations fetch for tenant ${tenantId}`);
    return configurationsFetchPromises[tenantId];
  }

  // Create new fetch promise for this tenant
  configurationsFetchPromises[tenantId] = (async () => {
    const response = await apiGet('/api/configurations');
    
    if (!response.ok) {
      throw new Error('Failed to fetch configurations');
    }
    
    const data = await response.json();
    configurationsCache[tenantId] = data;
    console.log(`✅ Configurations cached for tenant ${tenantId}`);
    return data;
  })();

  try {
    const result = await configurationsFetchPromises[tenantId];
    return result;
  } catch (error) {
    // Reset promise on error so it can be retried
    delete configurationsFetchPromises[tenantId];
    throw error;
  } finally {
    // Clear the promise after completion
    delete configurationsFetchPromises[tenantId];
  }
};

// Function to clear cache for current tenant (useful when configurations are added/updated)
export const clearConfigurationsCache = async () => {
  const tenantId = await getCurrentTenantId();
  if (tenantId) {
    delete configurationsCache[tenantId];
    delete configurationsFetchPromises[tenantId];
    console.log(`🗑️ Cleared configurations cache for tenant ${tenantId}`);
  }
};

// Function to clear all caches (useful when switching tenants)
export const clearAllConfigurationsCache = () => {
  configurationsCache = {};
  configurationsFetchPromises = {};
  console.log('🗑️ All configurations cache cleared');
};

// Function to update cache with new configuration data for current tenant
export const updateConfigurationsCache = async (newConfigurations: any[]) => {
  const tenantId = await getCurrentTenantId();
  if (tenantId) {
    configurationsCache[tenantId] = newConfigurations;
    console.log(`🔄 Configurations cache updated for tenant ${tenantId}`);
  }
};

// Function to get a specific configuration value by name
export const getConfigValue = async (configName: string): Promise<string | null> => {
  try {
    const configurations = await fetchConfigurationsGlobal();
    const config = configurations.find(c => c.configName === configName);
    return config?.value || null;
  } catch (error) {
    console.error(`Failed to get config value for ${configName}:`, error);
    return null;
  }
};

// Function to get multiple configuration values by names
export const getConfigValues = async (configNames: string[]): Promise<{ [key: string]: string | null }> => {
  try {
    const configurations = await fetchConfigurationsGlobal();
    const result: { [key: string]: string | null } = {};
    
    configNames.forEach(name => {
      const config = configurations.find(c => c.configName === name);
      result[name] = config?.value || null;
    });
    
    return result;
  } catch (error) {
    console.error(`Failed to get config values:`, error);
    const result: { [key: string]: string | null } = {};
    configNames.forEach(name => {
      result[name] = null;
    });
    return result;
  }
};