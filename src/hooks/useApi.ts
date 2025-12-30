/**
 * Custom React hooks for API calls with automatic 401 handling
 */

import { useState, useCallback } from 'react';
import { apiCall, apiGet, apiPost, apiPut, apiDelete, getJsonFromResponse } from '@/lib/api-client';

export interface UseApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiOptions {
  immediate?: boolean; // Whether to call the API immediately on hook mount
}

/**
 * Hook for making API calls with state management
 * Automatically handles 401 redirects through the api-client
 */
export function useApi<T = any>(
  url: string,
  options: RequestInit = {},
  hookOptions: UseApiOptions = {}
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: hookOptions.immediate ?? false,
    error: null,
  });

  const execute = useCallback(async (overrideOptions?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall(url, { ...options, ...overrideOptions });
      
      if (response.ok) {
        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } else {
        const errorText = await response.text();
        const errorMessage = `API Error ${response.status}: ${errorText}`;
        setState({ data: null, loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [url, options]);

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

/**
 * Hook specifically for GET requests
 */
export function useApiGet<T = any>(url: string, options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: options.immediate ?? false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiGet(url);
      
      if (response.ok) {
        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } else {
        const errorText = await response.text();
        const errorMessage = `API Error ${response.status}: ${errorText}`;
        setState({ data: null, loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [url]);

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

/**
 * Hook for POST/PUT/DELETE mutations
 */
export function useApiMutation<TData = any, TVariables = any>(
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
) {
  const [state, setState] = useState<UseApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (url: string, variables?: TVariables, options?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let response: Response;
      
      switch (method) {
        case 'POST':
          response = await apiPost(url, variables, options);
          break;
        case 'PUT':
          response = await apiPut(url, variables, options);
          break;
        case 'DELETE':
          response = await apiDelete(url, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } else {
        const errorText = await response.text();
        const errorMessage = `API Error ${response.status}: ${errorText}`;
        setState({ data: null, loading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, [method]);

  return {
    ...state,
    mutate,
  };
}

/**
 * Simple hook that just wraps the API client functions for direct usage
 */
export function useApiClient() {
  return {
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    call: apiCall,
    getJson: getJsonFromResponse,
  };
}

/**
 * Hook for fetching data with automatic loading states and error handling
 * Good for simple data fetching scenarios
 */
export function useFetch<T = any>(url: string, immediate = false) {
  const { data, loading, error, execute } = useApiGet<T>(url, { immediate });
  
  return {
    data,
    loading,
    error,
    fetch: execute,
    refetch: execute,
  };
}