'use client';

import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Share2, Calendar, User, Package, DollarSign, MapPin, Phone, Mail } from 'lucide-react';

interface BookingInvoiceProps {
  booking: {
    id: number;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    advancePayment?: number;
    notes?: string;
    createdAt: string;
    customer: {
      id: number;
      name: string;
      phone1: string;
      phone2?: string;
      address?: string;
    };
    items: Array<{
      id: number;
      quantity: number;
      pricePerDay: number;
      subtotal: number;
      notes?: string;
      product: {
        id: number;
        name: string;
        pricePerDay: number;
        category?: string;
      };
    }>;
  };
  onClose?: () => void;
}

export function BookingInvoice({ booking, onClose }: BookingInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Rental Store';
  const storeTagline = process.env.NEXT_PUBLIC_STORE_TAGLINE || 'Rental Equipment & Services';
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculate derived values
  const advancePayment = booking.advancePayment || 0;
  const pendingAmount = booking.totalAmount - advancePayment;
  const invoiceNumber = `INV-${booking.id.toString().padStart(6, '0')}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN');

  // PDF export handler
  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // WhatsApp share handler - Generate PDF and share
  const handleWhatsAppShare = async () => {
    if (!invoiceRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // Generate PDF
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');
      
      // Create a temporary file URL
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      
      // Check if the Web Share API is available and supports files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], `Invoice-${invoiceNumber}.pdf`, { type: 'application/pdf' })] })) {
        // Use Web Share API to share the PDF file
        const file = new File([pdfBlob], `Invoice-${invoiceNumber}.pdf`, { type: 'application/pdf' });
        
        await navigator.share({
          title: `Invoice ${invoiceNumber} - ${storeName}`,
          text: `Invoice for ${booking.customer.name} - Total: ₹${booking.totalAmount.toLocaleString()}`,
          files: [file]
        });
      } else {
        // Fallback: Open WhatsApp Web with a message and prompt user to share the downloaded PDF
        const customerPhone = booking.customer.phone1.replace(/[^0-9]/g, '');
        const formattedPhone = customerPhone.startsWith('91') ? customerPhone : `91${customerPhone}`;
        
        const message = `*${storeName} - Invoice*\n\n` +
          `Invoice No: ${invoiceNumber}\n` +
          `Date: ${invoiceDate}\n` +
          `Customer: ${booking.customer.name}\n` +
          `Rental Period: ${new Date(booking.startDate).toLocaleDateString('en-IN')} to ${new Date(booking.endDate).toLocaleDateString('en-IN')}\n` +
          `Total Amount: ₹${booking.totalAmount.toLocaleString()}\n` +
          `Advance Paid: ₹${advancePayment.toLocaleString()}\n` +
          `Pending: ₹${pendingAmount.toLocaleString()}\n\n` +
          `PDF invoice has been downloaded. Please attach it to this chat.\n\n` +
          `Thank you for choosing ${storeName}!`;

        // Download the PDF file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Open WhatsApp with message
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Show user instruction
        alert('PDF invoice has been downloaded! Please attach it to the WhatsApp chat that just opened.');
      }
      
      // Clean up the temporary URL
      URL.revokeObjectURL(pdfUrl);
      
    } catch (error) {
      console.error('Error generating PDF for WhatsApp:', error);
      alert('Error generating PDF for WhatsApp. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-auto">
        {/* Header with Actions */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Invoice</h2>
            <p className="text-blue-100">{invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200"
            >
              <Share2 className={`h-4 w-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
              {isGeneratingPDF ? 'Generating PDF...' : 'WhatsApp'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="p-6 bg-white text-black">
          {/* Compact Header */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"></div>
            <div className="relative text-center py-4 px-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {storeName}
              </h1>
              <p className="text-gray-600 text-sm font-medium">{storeTagline}</p>
              <div className="w-20 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>

          {/* Compact Invoice Header Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h2 className="text-sm font-bold mb-2 text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Invoice Details
              </h2>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice No:</span>
                  <span className="font-semibold text-blue-600">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-semibold">#{booking.id}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
              <h2 className="text-sm font-bold mb-2 text-gray-800 flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                Customer Details
              </h2>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-semibold text-sm">{booking.customer.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="font-medium">{booking.customer.phone1}</span>
                </div>
                {booking.customer.phone2 && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <span className="font-medium">{booking.customer.phone2}</span>
                  </div>
                )}
                {booking.customer.address && (
                  <div className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                    <span className="font-medium text-xs leading-tight">{booking.customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Rental Period - Single Line */}
          <div className="mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-3 text-white">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-bold">Rental Period:</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-white/20 rounded px-2 py-1">
                    <span className="font-medium">Start:</span> {new Date(booking.startDate).toLocaleDateString('en-IN')} at {booking.startTime}
                  </span>
                  <span className="bg-white/20 rounded px-2 py-1">
                    <span className="font-medium">End:</span> {new Date(booking.endDate).toLocaleDateString('en-IN')} at {booking.endTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Items Table */}
          <div className="mb-4">
            <h2 className="text-sm font-bold mb-3 text-gray-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              Rental Items
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-gray-700">Item Description</th>
                    <th className="px-3 py-2 text-center font-bold text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-right font-bold text-gray-700">Rate/Day</th>
                    <th className="px-3 py-2 text-right font-bold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.items.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{item.product.name}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-0.5 leading-tight">{item.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full font-semibold text-xs">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        ₹{item.pricePerDay.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">
                        ₹{item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compact Payment Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {booking.notes && (
              <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                <h2 className="text-sm font-bold mb-2 text-gray-800">Notes</h2>
                <p className="text-gray-700 text-xs leading-relaxed">{booking.notes}</p>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <h2 className="text-sm font-bold mb-3 text-gray-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Payment Summary
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white rounded text-xs">
                  <span className="font-semibold text-gray-700">Total Amount:</span>
                  <span className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-100 rounded text-xs">
                  <span className="font-semibold text-green-700">Advance Paid:</span>
                  <span className="font-bold text-green-600">₹{advancePayment.toLocaleString()}</span>
                </div>
                <div className="border-t border-dashed border-gray-300 pt-2">
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-red-100 to-orange-100 rounded border-l-4 border-red-400">
                    <span className="font-bold text-sm text-red-700">Pending:</span>
                    <span className="font-bold text-lg text-red-600">₹{pendingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="text-center pt-3 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-3">
              <h3 className="text-sm font-bold mb-1">Thank You for Choosing {storeName}!</h3>
              <p className="text-xs text-blue-100">We appreciate your business and look forward to serving you again. This is a digitally generated invoice. No physical signature required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}