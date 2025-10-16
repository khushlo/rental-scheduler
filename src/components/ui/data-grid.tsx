'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  mobileRender?: (item: T, index: number) => React.ReactNode;
}

export interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  filters?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  cardView?: boolean;
  renderCard?: (item: T, index: number) => React.ReactNode;
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 50,
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  loading = false,
  emptyMessage = "No data available",
  cardView = false,
  renderCard
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter data based on search term
  const filteredData = onSearch ? data : (searchTerm ? data.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  }) : data);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700"
            />
          </div>
        </div>
        
        {filters && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
                showFilters 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300" 
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && filters && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {filters}
        </div>
      )}

      {/* Data Display */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Mobile Card View */}
        {isMobile || cardView ? (
          <div className="space-y-3 p-3 sm:p-4">
            {currentData.length === 0 ? (
              <div className="text-center text-gray-700 dark:text-gray-300 py-8">
                {emptyMessage}
              </div>
            ) : (
              currentData.map((item, rowIndex) => (
                <div key={rowIndex}>
                  {renderCard ? (
                    renderCard(item, startIndex + rowIndex)
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm space-y-2">
                      {columns.map((column, colIndex) => (
                        <div key={String(column.key) + colIndex} className="flex justify-between items-start gap-2">
                          <div className="font-medium text-gray-700 dark:text-gray-300 text-sm min-w-0 flex-shrink-0">
                            {column.header}:
                          </div>
                          <div className="text-gray-900 dark:text-gray-100 text-sm text-right flex-1 min-w-0">
                            {column.mobileRender || column.render 
                              ? (column.mobileRender || column.render)!(item, startIndex + rowIndex)
                              : String(item[column.key] || '-')
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={String(column.key) + index}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ 
                        width: column.width || undefined,
                        color: 'hsl(var(--muted-foreground))'
                      }}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" 
                     style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                {currentData.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={columns.length}
                      className="px-4 py-8 text-center"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, rowIndex) => (
                    <tr key={rowIndex} className=""
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
                        }}>
                      {columns.map((column, colIndex) => (
                        <td key={String(column.key) + colIndex} 
                            className="px-4 py-4 whitespace-nowrap text-sm"
                            style={{ 
                              color: 'hsl(var(--foreground))',
                              borderTopColor: 'hsl(var(--border))'
                            }}>
                          {column.render 
                            ? column.render(item, startIndex + rowIndex)
                            : String(item[column.key] || '-')
                          }
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Mobile optimized */}
      {filteredData.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center px-3 sm:px-0">
          <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
            Showing {startIndex + 1} to {endIndex} of {filteredData.length} results
            {searchTerm && ` (filtered from ${data.length} total)`}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 overflow-x-auto">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 min-w-0">
                {renderPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
                    disabled={typeof page === 'string'}
                    className={cn(
                      "px-2 sm:px-3 py-1 text-sm rounded flex-shrink-0 min-w-[32px] sm:min-w-[36px]",
                      typeof page === 'string'
                        ? "text-gray-400 dark:text-gray-500 cursor-default"
                        : currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}