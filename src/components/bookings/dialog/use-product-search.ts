'use client';

import { useState, useCallback, useRef } from 'react';
import { apiGet } from '@/lib/api-client';

interface Product {
  id: number;
  name: string;
  quantity: number;
  rentPrice: number;
  status: boolean;
}

export function useProductSearch() {
  const [productSearchTerms, setProductSearchTerms] = useState<{[itemIndex: number]: string}>({});
  const [productSuggestions, setProductSuggestions] = useState<{[itemIndex: number]: Product[]}>({});
  const [showProductDropdown, setShowProductDropdown] = useState<{[itemIndex: number]: boolean}>({});
  const productDropdownRefs = useRef<{[itemIndex: number]: HTMLDivElement | null}>({});

  const searchProducts = useCallback(async (searchTerm: string, itemIndex: number) => {
    if (searchTerm.length < 2) {
      setProductSuggestions(prev => ({ ...prev, [itemIndex]: [] }));
      setShowProductDropdown(prev => ({ ...prev, [itemIndex]: false }));
      return;
    }

    try {
      const response = await apiGet(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const allProducts = await response.json();
        const filtered = allProducts.filter((product: Product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.status
        );
        setProductSuggestions(prev => ({ ...prev, [itemIndex]: filtered }));
        setShowProductDropdown(prev => ({ ...prev, [itemIndex]: true }));
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  }, []);

  const selectProduct = useCallback((product: Product, itemIndex: number) => {
    setProductSearchTerms(prev => ({ ...prev, [itemIndex]: product.name }));
    setShowProductDropdown(prev => ({ ...prev, [itemIndex]: false }));
    return product;
  }, []);

  const clearProductSelection = useCallback((itemIndex: number) => {
    setProductSearchTerms(prev => ({ ...prev, [itemIndex]: '' }));
    setShowProductDropdown(prev => ({ ...prev, [itemIndex]: false }));
  }, []);

  const handleProductSearch = useCallback((value: string, itemIndex: number) => {
    setProductSearchTerms(prev => ({ ...prev, [itemIndex]: value }));
    searchProducts(value, itemIndex);
  }, [searchProducts]);

  const initializeProductSearchTerms = useCallback((items: any[], products: Product[]) => {
    const searchTerms: {[itemIndex: number]: string} = {};
    
    items.forEach((item, index) => {
      if (item.productId > 0) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          searchTerms[index] = product.name;
        }
      }
    });
    setProductSearchTerms(searchTerms);
  }, []);

  const reindexProductSearch = useCallback((removedIndex: number) => {
    // Clean up product search states when an item is removed
    setProductSearchTerms(prev => {
      const newTerms: {[itemIndex: number]: string} = {};
      Object.keys(prev).forEach(key => {
        const idx = parseInt(key);
        if (idx < removedIndex) {
          newTerms[idx] = prev[idx];
        } else if (idx > removedIndex) {
          newTerms[idx - 1] = prev[idx];
        }
      });
      return newTerms;
    });

    setProductSuggestions(prev => {
      const newSuggestions: {[itemIndex: number]: Product[]} = {};
      Object.keys(prev).forEach(key => {
        const idx = parseInt(key);
        if (idx < removedIndex) {
          newSuggestions[idx] = prev[idx];
        } else if (idx > removedIndex) {
          newSuggestions[idx - 1] = prev[idx];
        }
      });
      return newSuggestions;
    });

    setShowProductDropdown(prev => {
      const newDropdown: {[itemIndex: number]: boolean} = {};
      Object.keys(prev).forEach(key => {
        const idx = parseInt(key);
        if (idx < removedIndex) {
          newDropdown[idx] = prev[idx];
        } else if (idx > removedIndex) {
          newDropdown[idx - 1] = prev[idx];
        }
      });
      return newDropdown;
    });
  }, []);

  return {
    productSearchTerms,
    productSuggestions,
    showProductDropdown,
    productDropdownRefs,
    handleProductSearch,
    selectProduct,
    clearProductSelection,
    initializeProductSearchTerms,
    reindexProductSearch
  };
}