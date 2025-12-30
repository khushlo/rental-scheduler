/**
 * Global API interceptor that handles 401 responses by redirecting to login
 * This utility should be used instead of direct fetch calls throughout the application
 */

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

interface ApiOptions extends RequestInit {
  // Extended options if needed
}

interface ApiResponse<T = any> extends Response {
  data?: T;
}

/**
 * Enhanced fetch wrapper that automatically handles 401 responses
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function apiCall(url: string, options: ApiOptions = {}): Promise<Response> {
  try {
    // Perform the fetch request
    const response = await fetch(url, {
      credentials: 'include', // Always include cookies for auth
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if we got a 401 Unauthorized response
    if (response.status === 401) {
      console.warn('API call returned 401, redirecting to login');
      
      // Only redirect if we're on the client side
      if (isClient) {
        // Clear any stored tokens/auth state
        localStorage.removeItem('auth-token');
        localStorage.removeItem('admin-auth-token');
        
        // Determine the current path to decide which login page to redirect to
        const currentPath = window.location.pathname;
        
        if (currentPath.startsWith('/admin')) {
          // Redirect to admin login
          window.location.href = '/admin/login';
        } else {
          // Redirect to regular login
          window.location.href = '/login';
        }
      }
      
      // Still return the response for the caller to handle if needed
      return response;
    }

    // Return the response for successful calls or other error codes
    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(url: string, options: ApiOptions = {}): Promise<Response> {
  return apiCall(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(url: string, data?: any, options: ApiOptions = {}): Promise<Response> {
  return apiCall(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(url: string, data?: any, options: ApiOptions = {}): Promise<Response> {
  return apiCall(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(url: string, options: ApiOptions = {}): Promise<Response> {
  return apiCall(url, { ...options, method: 'DELETE' });
}

/**
 * Helper to get JSON data from response with proper error handling
 */
export async function getJsonFromResponse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response');
  }
}

/**
 * Combined helper: make API call and parse JSON in one go
 */
export async function apiCallJson<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const response = await apiCall(url, options);
  return getJsonFromResponse<T>(response);
}

export default apiCall;