'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DataGrid, Column } from '@/components/ui/data-grid';
import { AddCustomerForm } from './add-customer-form';
import { EditCustomerForm } from './edit-customer-form';
import { DeleteCustomerButton } from './delete-customer-button';
import { formatId } from '@/lib/utils';

interface Customer {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bookings: number;
  };
}

export function CustomersDataGrid() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'id',
      header: 'Customer ID',
      width: '18%',
      render: (customer) => (
        <code className="text-sm bg-gray-100 px-3 py-2 rounded font-mono">
          {formatId(customer.id)}
        </code>
      )
    },
    {
      key: 'name',
      header: 'Customer Name',
      width: '22%',
      render: (customer) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-700">{customer.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-500">{customer.phone1}</div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone Numbers',
      width: '1/4',
      render: (customer) => (
        <div className="text-sm">
          <div className="text-black font-medium">{customer.phone1}</div>
          {customer.phone2 && (
            <div className="text-gray-600 dark:text-gray-500">{customer.phone2}</div>
          )}
        </div>
      )
    },
    {
      key: 'address',
      header: 'Address',
      width: '1/5',
      render: (customer) => (
        <span className="text-sm text-black truncate max-w-xs block">
          {customer.address || '-'}
        </span>
      )
    },
    {
      key: 'bookings',
      header: 'Bookings',
      width: '1/8',
      render: (customer) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black">
          {customer._count?.bookings || 0}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      width: '1/6',
      render: (customer) => (
        <div className="text-sm text-black">
          {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '1/8',
      render: (customer) => (
        <div className="flex items-center space-x-2">
          <EditCustomerForm 
            customer={customer} 
            onCustomerUpdated={fetchCustomers}
          />
          <DeleteCustomerButton 
            customer={customer} 
            onCustomerDeleted={fetchCustomers}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-gray-100">Customers</h1>
          <p className="text-gray-800 dark:text-gray-400">Manage your customer database and contact information</p>
        </div>
        <AddCustomerForm onCustomerAdded={fetchCustomers} />
      </div>

      <DataGrid
        data={customers}
        columns={columns}
        pageSize={50}
        searchPlaceholder="Search by Customer ID, name, phone, or address..."
        loading={loading}
        emptyMessage="No customers found. Add your first customer to get started."
      />
    </div>
  );
}