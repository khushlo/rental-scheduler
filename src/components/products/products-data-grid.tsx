"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DataGrid, Column } from "@/components/ui/data-grid";
import { AddProductForm } from "./add-product-form";
import { EditProductForm } from "./edit-product-form";
import { DeleteProductButton } from "./delete-product-button";
import { formatId } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  quantity: number;
  rentPrice: number;
  delayInHours: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ProductsDataGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "id",
      header: "Product ID",
      width: "20%",
      render: (product) => (
        <code
          className="text-sm px-3 py-2 rounded font-mono"
          style={{
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {formatId(product.id)}
        </code>
      ),
    },
    {
      key: "name",
      header: "Product Name",
      width: "35%",
      render: (product) => (
        <div
          className="font-medium"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {product.name}
        </div>
      ),
      mobileRender: (product) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {product.name}
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      width: "15%",
      render: (product) => (
        <div className="text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              product.quantity > 5
                ? "bg-green-100 text-green-800"
                : product.quantity > 0
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {product.quantity}
          </span>
        </div>
      ),
    },
    {
      key: "rentPrice",
      header: "Rent Price",
      width: "18%",
      render: (product) => (
        <span className="font-medium text-green-600">
          ₹{product.rentPrice.toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "15%",
      render: (product) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.status
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.status ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "17%",
      render: (product) => (
        <div className="flex items-center space-x-2">
          <EditProductForm product={product} onProductUpdated={fetchProducts} />
          <DeleteProductButton
            product={product}
            onProductDeleted={fetchProducts}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Products
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Manage your rental products and inventory
          </p>
        </div>
        <AddProductForm onProductAdded={fetchProducts} />
      </div>

      <DataGrid
        data={products}
        columns={columns}
        pageSize={50}
        searchPlaceholder="Search by Product ID, name..."
        loading={loading}
        emptyMessage="No products found. Add your first product to get started."
      />
    </div>
  );
}
