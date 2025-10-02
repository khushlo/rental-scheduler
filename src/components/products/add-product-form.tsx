'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddProductFormProps {
  onProductAdded: () => void;
}

interface ProductFormData {
  name: string;
  quantity: number;
  rentPrice: number;
  status: boolean;
}

interface ProductFormErrors {
  name?: string;
  quantity?: string;
  rentPrice?: string;
  status?: string;
}

export function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    quantity: 1,
    rentPrice: 0,
    status: true,
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: ProductFormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.quantity < 0) newErrors.quantity = 'Quantity must be non-negative';
    if (formData.rentPrice <= 0) newErrors.rentPrice = 'Rent price must be positive';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          quantity: 1,
          rentPrice: 0,
          status: true,
        });
        setIsOpen(false);
        onProductAdded();
      } else {
        const errorData = await response.json();
        console.error('Failed to create product:', errorData);
      }
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Product
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
        
        {/* Modal content */}
        <div className="relative inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full mx-4">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value, 10) || 0)}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.quantity ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                    placeholder="Enter quantity available"
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                </div>

                {/* Rent Price */}
                <div>
                  <label htmlFor="rentPrice" className="block text-sm font-medium text-gray-700">
                    Rent Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="rentPrice"
                    min="0"
                    step="0.01"
                    value={formData.rentPrice}
                    onChange={(e) => handleInputChange('rentPrice', parseFloat(e.target.value) || 0)}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.rentPrice ? 'border-red-300' : 'border-gray-300'
                    } px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm`}
                    placeholder="Enter rent price per day"
                  />
                  {errors.rentPrice && <p className="mt-1 text-sm text-red-600">{errors.rentPrice}</p>}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-2 space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="true"
                        checked={formData.status === true}
                        onChange={() => handleInputChange('status', true)}
                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                    <label className="inline-flex items-center ml-4">
                      <input
                        type="radio"
                        value="false"
                        checked={formData.status === false}
                        onChange={() => handleInputChange('status', false)}
                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                      />
                      <span className="ml-2 text-sm text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}