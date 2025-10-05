'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

const reportNavigation = [
  {
    name: 'Balance Sheet',
    href: '/reports/balance-sheet',
    icon: DollarSign,
    description: 'View financial position and balance sheet for different financial years',
  },
  {
    name: 'Revenue Report',
    href: '/reports/revenue',
    icon: TrendingUp,
    description: 'Analyze revenue trends and patterns',
    disabled: true,
  },
  {
    name: 'Product Performance',
    href: '/reports/products',
    icon: BarChart3,
    description: 'Track product rental performance and utilization',
    disabled: true,
  },
];

export default function ReportsPage() {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Generate and view financial and operational reports for your rental business
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportNavigation.map((report) => {
          const Icon = report.icon;
          const isDisabled = report.disabled;
          
          return (
            <div
              key={report.name}
              className={cn(
                "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all",
                isDisabled 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer"
              )}
            >
              {isDisabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-400">
                        {report.name}
                      </h3>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {report.description}
                  </p>
                </div>
              ) : (
                <Link href={report.href} className="block space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {report.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {report.description}
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Generate Report
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">1</h3>
            <p className="text-green-600 dark:text-green-400 text-sm">Available Reports</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">2</h3>
            <p className="text-blue-600 dark:text-blue-400 text-sm">Coming Soon</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">FY 2025-26</h3>
            <p className="text-purple-600 dark:text-purple-400 text-sm">Current Financial Year</p>
          </div>
        </div>
      </div>
    </div>
  );
}