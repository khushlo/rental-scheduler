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
  delayInHours: number;
  status: boolean;
}

interface ProductFormErrors {
  name?: string;
  quantity?: string;
  rentPrice?: string;
  delayInHours?: string;
  status?: string;
}

export function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [continuousAdd, setContinuousAdd] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    quantity: 1,
    rentPrice: 0,
    delayInHours: 0,
    status: true,
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: ProductFormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.quantity < 0) newErrors.quantity = 'Quantity must be non-negative';
    if (formData.rentPrice < 0) newErrors.rentPrice = 'Rent price must be non-negative';
    if (formData.delayInHours < 0) newErrors.delayInHours = 'Delay hours must be non-negative';
    
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
          delayInHours: 0,
          status: true,
        });
        
        // Close modal only if continuous add is not checked
        if (!continuousAdd) {
          setIsOpen(false);
        }
        
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

  const handleClose = () => {
    setIsOpen(false);
    setContinuousAdd(false); // Reset continuous add when manually closing
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
          onClick={handleClose}
        ></div>
        
        {/* Modal content */}
        <div className="relative inline-block align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full mx-4">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Product</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                </div>

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="0"
                    value={formData.quantity || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('quantity', 0);
                      } else {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue) && numValue >= 0) {
                          handleInputChange('quantity', numValue);
                        }
                      }
                    }}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.quantity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter quantity available"
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>}
                </div>

                {/* Rent Price */}
                <div>
                  <label htmlFor="rentPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rent Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="rentPrice"
                    min="0"
                    step="0.01"
                    value={formData.rentPrice || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('rentPrice', 0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue >= 0) {
                          handleInputChange('rentPrice', numValue);
                        }
                      }
                    }}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.rentPrice ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Enter rent price per day"
                  />
                  {errors.rentPrice && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rentPrice}</p>}
                </div>

                {/* Delay Hours */}
                <div>
                  <label htmlFor="delayInHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Delay Hours
                  </label>
                  <input
                    type="number"
                    id="delayInHours"
                    min="0"
                    value={formData.delayInHours || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('delayInHours', 0);
                      } else {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue) && numValue >= 0) {
                          handleInputChange('delayInHours', numValue);
                        }
                      }
                    }}
                    className={`mt-1 block w-full rounded-md border ${
                      errors.delayInHours ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    placeholder="Hours to wait before next booking (optional)"
                  />
                  {errors.delayInHours && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.delayInHours}</p>}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <div className="mt-2 space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="true"
                        checked={formData.status === true}
                        onChange={() => handleInputChange('status', true)}
                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                    <label className="inline-flex items-center ml-4">
                      <input
                        type="radio"
                        value="false"
                        checked={formData.status === false}
                        onChange={() => handleInputChange('status', false)}
                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Continuous Add */}
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={continuousAdd}
                      onChange={(e) => setContinuousAdd(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Continuous add (keep form open)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 dark:bg-blue-500 text-base font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
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