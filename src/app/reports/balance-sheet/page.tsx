"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface BalanceSheetData {
  financialYear: string;
  totalRevenue: number;
  totalAdvanceReceived: number;
  pendingPayments: number;
  totalBookings: number;
  completedBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    bookings: number;
    advance: number;
  }>;
}

const FINANCIAL_YEARS = [
  {
    value: "2026-27",
    label: "2026-27",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
  },
  {
    value: "2025-26",
    label: "2025-26",
    startDate: "2025-04-01",
    endDate: "2026-03-31",
  },
  {
    value: "2024-25",
    label: "2024-25",
    startDate: "2024-04-01",
    endDate: "2025-03-31",
  },
  {
    value: "2023-24",
    label: "2023-24",
    startDate: "2023-04-01",
    endDate: "2024-03-31",
  },
  {
    value: "2022-23",
    label: "2022-23",
    startDate: "2022-04-01",
    endDate: "2023-03-31",
  },
];

export default function BalanceSheetPage() {
  const [selectedYear, setSelectedYear] = useState("2026-27");
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceSheet = async (year: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiGet(`/api/reports/balance-sheet?year=${year}`);
      if (!response.ok) {
        throw new Error("Failed to fetch balance sheet data");
      }
      const data = await response.json();
      setBalanceSheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet(selectedYear);
  }, [selectedYear]);

  const downloadReport = () => {
    if (!balanceSheet) return;

    // Create CSV content
    const csvContent = [
      ["Balance Sheet Report", balanceSheet.financialYear],
      [""],
      ["Summary"],
      ["Total Revenue", balanceSheet.totalRevenue],
      ["Total Advance Received", balanceSheet.totalAdvanceReceived],
      ["Pending Payments", balanceSheet.pendingPayments],
      ["Total Bookings", balanceSheet.totalBookings],
      ["Completed Bookings", balanceSheet.completedBookings],
      ["Active Bookings", balanceSheet.activeBookings],
      ["Upcoming Bookings", balanceSheet.upcomingBookings],
      [""],
      ["Monthly Breakdown"],
      ["Month", "Revenue", "Bookings", "Advance"],
      ...balanceSheet.monthlyBreakdown.map((month) => [
        month.month,
        month.revenue,
        month.bookings,
        month.advance,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `balance-sheet-${balanceSheet.financialYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Balance Sheet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Financial overview and analysis for the selected financial year
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Financial Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {FINANCIAL_YEARS.map((year) => (
              <option key={year.value} value={year.value}>
                FY {year.label}
              </option>
            ))}
          </select>

          {/* Download Button */}
          <button
            onClick={downloadReport}
            disabled={!balanceSheet || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading balance sheet...
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {balanceSheet && !loading && (
        <>
          {/* Empty State Message */}
          {balanceSheet.totalBookings === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    No bookings found for FY {balanceSheet.financialYear}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">
                    There are no bookings in the selected financial year. The
                    balance sheet will show zero values.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{balanceSheet.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Advance Received
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{balanceSheet.totalAdvanceReceived.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{balanceSheet.pendingPayments.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {balanceSheet.totalBookings}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Booking Status */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Booking Status Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="text-2xl font-bold text-green-600">
                  {balanceSheet.completedBookings}
                </h3>
                <p className="text-green-600 text-sm">Completed Bookings</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-600">
                  {balanceSheet.activeBookings}
                </h3>
                <p className="text-blue-600 text-sm">Active Bookings</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h3 className="text-2xl font-bold text-orange-600">
                  {balanceSheet.upcomingBookings}
                </h3>
                <p className="text-orange-600 text-sm">Upcoming Bookings</p>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Monthly Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Month
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Bookings
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Advance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {balanceSheet.monthlyBreakdown.map((month, index) => (
                    <tr
                      key={month.month}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {month.month}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        ₹{month.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        {month.bookings}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        ₹{month.advance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
