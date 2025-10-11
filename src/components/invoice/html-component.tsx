import React from 'react';
import { InvoiceData, BookingItem } from './types';
import { formatTimeTo12Hour, generateHTMLStatusClass } from './utils';

interface InvoiceHTMLComponentProps {
  invoiceData: InvoiceData;
}

export const InvoiceHTMLComponent: React.FC<InvoiceHTMLComponentProps> = ({ invoiceData }) => {
  const { booking, invoiceNumber, invoiceDate, storeName, storeAddress, storePhone, storeEmail, advancePayment, totalAmount, pendingAmount } = invoiceData;
  
  const statusClass = generateHTMLStatusClass(booking.status);

  return (
    <>
      {/* Header */}
      <div className="relative mb-6 sm:mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"></div>
        <div className="relative text-center py-4 sm:py-6 px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{storeName}</h1>
          <p className="text-xs sm:text-sm text-gray-600">{storeAddress}</p>
          <p className="text-xs sm:text-sm text-gray-600">📞 {storePhone} | ✉️ {storeEmail}</p>
        </div>
      </div>

      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">INVOICE</h2>
          <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Invoice No:</span> {invoiceNumber}</p>
          <p className="text-sm text-gray-600"><span className="font-medium">Date:</span> {invoiceDate}</p>
        </div>
        <div className="text-left sm:text-right flex-1">
          <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Bill To:</h3>
          <p className="font-medium text-base sm:text-lg text-gray-800">{booking.customer?.name || 'Unknown Customer'}</p>
          <p className="text-sm text-gray-600">{booking.customer?.address || 'N/A'}</p>
          <p className="text-sm text-gray-600">📞 {booking.customer?.phone1 || 'N/A'}</p>
          {booking.customer?.email && booking.customer.email !== booking.customer.phone1 && (
            <p className="text-sm text-gray-600">✉️ {booking.customer.email}</p>
          )}
        </div>
      </div>

      {/* Rental Details */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
          📅 Rental Details
        </h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="font-medium text-gray-700 text-sm sm:text-base min-w-[120px]">Rental Period:</span>
            <div className="text-gray-600 text-sm sm:text-base">
              From {booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : 'N/A'} at <span className="bg-blue-600 text-white px-2 py-1 rounded-md font-semibold">{formatTimeTo12Hour(booking.startTime)}</span> to {booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-IN') : 'N/A'} at <span className="bg-blue-600 text-white px-2 py-1 rounded-md font-semibold">{formatTimeTo12Hour(booking.endTime)}</span>
            </div>
          </div>
          {booking.eventDate && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="font-medium text-gray-700 text-sm sm:text-base min-w-[120px]">Event Date:</span>
              <div className="text-gray-600 text-sm sm:text-base">
                {new Date(booking.eventDate).toLocaleDateString('en-IN')}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="font-medium text-gray-700 text-sm sm:text-base">Status:</span>
              <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${statusClass}`}>
                {(booking.status || 'unknown').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="font-medium text-gray-700 text-sm sm:text-base">Booking ID:</span>
              <span className="text-gray-600 text-sm sm:text-base">#{booking.id || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="mb-6 sm:mb-8">
        <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
          📦 Products/Services
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 text-xs sm:text-sm">Item</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center font-semibold text-gray-700 text-xs sm:text-sm">Qty</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-gray-700 text-xs sm:text-sm">Rate (₹)</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-gray-700 text-xs sm:text-sm">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(booking.items || []).map((item: BookingItem, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div>
                      <div className="font-medium text-gray-800 text-xs sm:text-sm">{item.product?.name || 'Unknown Product'}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-600 mt-1">{item.notes}</div>
                      )}
                      {/* Custom timing information for individual items */}
                      {item.itemStartDate && item.itemEndDate && item.itemStartTime && item.itemEndTime && (
                        <div className="text-[10px] text-white mt-1 font-semibold">
                          <span className="bg-blue-600 px-2 py-1 rounded-md">
                            Custom: {new Date(item.itemStartDate).toLocaleDateString()} {formatTimeTo12Hour(item.itemStartTime)} to {new Date(item.itemEndDate).toLocaleDateString()} {formatTimeTo12Hour(item.itemEndTime)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-800 text-center text-xs sm:text-sm">{item.quantity || 0}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-800 text-right text-xs sm:text-sm">₹{(item.product?.pricePerDay || 0).toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-800 text-right font-medium text-xs sm:text-sm">₹{(item.subtotal || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Notes */}
      {booking.notes && (
        <div className="mb-6 sm:mb-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
              📝 Booking Notes
            </h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{booking.notes}</p>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
            💳 Payment Summary
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm sm:text-base">Subtotal:</span>
              <span className="font-medium text-base sm:text-lg text-gray-800">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm sm:text-base">Advance Paid:</span>
              <span className="font-medium text-green-600 text-base sm:text-lg">₹{advancePayment.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 sm:pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-bold text-lg sm:text-xl">Pending Amount:</span>
                <span className="text-red-600 font-bold text-lg sm:text-xl">₹{pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 text-center text-gray-500">
        <p className="text-xs sm:text-sm">Thank you for choosing {storeName}! | For any queries, contact us at {storePhone} or {storeEmail}</p>
      </div>
    </>
  );
};