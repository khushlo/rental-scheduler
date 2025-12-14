// Shared products cache to prevent duplicate API calls across components

// Module-level cache for products
let productsCache: any[] | null = null;
let productsFetchPromise: Promise<any[]> | null = null;

// Global fetch function with caching
export const fetchProductsGlobal = async (): Promise<any[]> => {
  // Return cached data if available
  if (productsCache) {
    console.log('📦 Using cached products');
    return productsCache;
  }

  // Return existing promise if fetch is in progress
  if (productsFetchPromise) {
    console.log('⏳ Waiting for existing products fetch');
    return productsFetchPromise;
  }

  // Create new fetch promise
  productsFetchPromise = (async () => {
    console.log('🔄 Fetching products from API...');
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      const activeProducts = data.filter((product: any) => product.status);
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
  } finally {
    // Clear the promise after completion
    productsFetchPromise = null;
  }
};

// Function to clear cache (useful when products are added/updated)
export const clearProductsCache = () => {
  productsCache = null;
  productsFetchPromise = null;
  console.log('🗑️ Products cache cleared');
};

// Function to update cache with new product data
export const updateProductsCache = (newProducts: any[]) => {
  productsCache = newProducts;
  console.log('🔄 Products cache updated');
};