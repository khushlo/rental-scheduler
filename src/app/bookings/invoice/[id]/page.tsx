'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  productId: number;
  product: {
    id: number;
    name: string;
    pricePerDay: number;
    category?: string;
  };
}

interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventDate?: string;
  totalAmount: number;
  advancePayment?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customerId: number;
  items: BookingItem[];
  customer: {
    id: number;
    name: string;
    phone1: string;
    phone2?: string;
    address?: string;
    email: string;
  };
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const bookingId = params.id;

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        console.error('Failed to fetch booking');
        router.push('/bookings');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      router.push('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsPDF = async () => {
    if (!invoiceRef.current || !booking) return;

    let tempContainer: HTMLDivElement | null = null;
    
    try {
      setIsGeneratingPDF(true);
      
      // Create a temporary container with fixed dimensions for consistent PDF output
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.minHeight = '1123px'; // A4 height in pixels
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.padding = '40px';
      tempContainer.style.boxSizing = 'border-box';
      
      const invoiceNumber = `INV-${booking.id.toString().padStart(6, '0')}`;
      const invoiceDate = new Date().toLocaleDateString('en-IN');
      const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Rental Equipment & Services';
      const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Your Store Address';
      const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || 'Your Phone Number';
      const storeEmail = process.env.NEXT_PUBLIC_STORE_EMAIL || 'Your Email';
      const storeTagline = process.env.NEXT_PUBLIC_STORE_TAGLINE || 'Your Store Tagline';
      
      // Create customer-friendly filename
      const customerName = (booking.customer?.name || 'Unknown').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const fileName = `${customerName} - Invoice-${booking.id}.pdf`;
      
      const advancePayment = booking.advancePayment || 0;
      const totalAmount = booking.totalAmount || 0;
      const pendingAmount = totalAmount - advancePayment;
      
      const statusClass = 
        booking.status === 'confirmed' ? 'background-color: #dcfce7; color: #166534;' :
        booking.status === 'active' ? 'background-color: #fef3c7; color: #92400e;' :
        booking.status === 'cancelled' ? 'background-color: #fee2e2; color: #dc2626;' :
        'background-color: #dbeafe; color: #1d4ed8;';
      
      const productsHTML = (booking.items || []).map((item, index) => `
        <tr style="${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #1f2937;">${item.product?.name || 'Unknown Product'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${item.quantity || 0}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4b5563;">₹${(item.product?.pricePerDay || 0).toLocaleString()}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">₹${(item.subtotal || 0).toLocaleString()}</td>
        </tr>
      `).join('');
      
      tempContainer.innerHTML = `
        <div style="max-width: 714px; margin: 0 auto; background: white; color: #1f2937; line-height: 1.5;">
          <!-- Header -->
          <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${storeName}</h1>
            <p style="font-style: italic; color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">${storeTagline}</p>
            <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">${storeAddress}</p>
            <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">📞 ${storePhone} | ✉️ ${storeEmail}</p>
          </div>

          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
            <div style="flex: 1;">
              <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 16px 0;">INVOICE</h2>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;"><span style="font-weight: 600;">Invoice No:</span> ${invoiceNumber}</p>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;"><span style="font-weight: 600;">Date:</span> ${invoiceDate}</p>
            </div>
            <div style="flex: 1; text-align: right;">
              <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 8px 0; font-size: 16px;">Bill To:</h3>
              <p style="font-weight: 600; font-size: 16px; margin: 4px 0; color: #1f2937;">${booking.customer?.name || 'Unknown Customer'}</p>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">${booking.customer?.address || 'N/A'}</p>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">📞 ${booking.customer?.phone1 || 'N/A'}</p>
              ${booking.customer?.email && booking.customer.email !== booking.customer.phone1 ? 
                `<p style="color: #6b7280; margin: 4px 0; font-size: 14px;">✉️ ${booking.customer.email}</p>` : ''}
            </div>
          </div>

          <!-- Rental Details -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">📅 Rental Details</h3>
            <div style="margin-bottom: 12px;">
              <span style="font-weight: 600; color: #374151; font-size: 14px;">Rental Period:</span>
              <span style="color: #6b7280; margin-left: 8px; font-size: 14px;">
                From ${booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : 'N/A'} to ${booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div style="display: flex; gap: 32px;">
              <div>
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Status:</span>
                <span style="margin-left: 8px; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; ${statusClass}">
                  ${(booking.status || 'unknown').toUpperCase()}
                </span>
              </div>
              <div>
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Booking ID:</span>
                <span style="color: #6b7280; margin-left: 8px; font-size: 14px;">#${booking.id || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">📦 Products/Services</h3>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Item</th>
                    <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Rate (₹)</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHTML}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment Summary -->
          <div style="margin-bottom: 24px;">
            <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
              <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">💳 Payment Summary</h3>
              <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Subtotal:</span>
                <span style="font-weight: 600; font-size: 16px; color: #1f2937;">₹${totalAmount.toLocaleString()}</span>
              </div>
              <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Advance Paid:</span>
                <span style="font-weight: 600; color: #059669; font-size: 16px;">₹${advancePayment.toLocaleString()}</span>
              </div>
              <div style="border-top: 1px solid #d1d5db; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold; color: #1f2937; font-size: 18px;">Pending Amount:</span>
                  <span style="font-weight: bold; color: #dc2626; font-size: 20px;">₹${pendingAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px;">
            <p style="margin: 0;">Thank you for choosing ${storeName}! | For any queries, contact us at ${storePhone} or ${storeEmail}</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempContainer);
      
      // Wait a bit for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: Math.max(1123, tempContainer.scrollHeight + 80),
        scrollX: 0,
        scrollY: 0,
      });
      
      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate dimensions to fit the page properly
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const finalWidth = (imgWidth * 0.264583) * ratio;
      const finalHeight = (imgHeight * 0.264583) * ratio;
      
      // Center the content
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 10; // Small margin from top
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');
      
      // Simply save the PDF without auto-opening
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Cleanup
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    if (!invoiceRef.current || !booking) return;

    let tempContainer: HTMLDivElement | null = null;
    
    try {
      setIsSharing(true);
      
      // Create a temporary container with fixed dimensions for consistent PDF output
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.minHeight = '1123px'; // A4 height in pixels
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.padding = '40px';
      tempContainer.style.boxSizing = 'border-box';
      
      const invoiceNumber = `INV-${booking.id.toString().padStart(6, '0')}`;
      const invoiceDate = new Date().toLocaleDateString('en-IN');
      const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Rental Equipment & Services';
      const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Your Store Address';
      const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || 'Your Phone Number';
      const storeEmail = process.env.NEXT_PUBLIC_STORE_EMAIL || 'Your Email';
      
      const advancePayment = booking.advancePayment || 0;
      const totalAmount = booking.totalAmount || 0;
      const pendingAmount = totalAmount - advancePayment;
      
      // Create customer-friendly filename
      const customerName = (booking.customer?.name || 'Unknown').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const fileName = `${customerName} - Invoice-${booking.id}.pdf`;
      
      const statusClass = 
        booking.status === 'confirmed' ? 'background-color: #dcfce7; color: #166534;' :
        booking.status === 'active' ? 'background-color: #fef3c7; color: #92400e;' :
        booking.status === 'cancelled' ? 'background-color: #fee2e2; color: #dc2626;' :
        'background-color: #dbeafe; color: #1d4ed8;';
      
      const productsHTML = (booking.items || []).map((item, index) => `
        <tr style="${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #1f2937;">${item.product?.name || 'Unknown Product'}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${item.quantity || 0}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4b5563;">₹${(item.product?.pricePerDay || 0).toLocaleString()}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">₹${(item.subtotal || 0).toLocaleString()}</td>
        </tr>
      `).join('');
      
      tempContainer.innerHTML = `
        <div style="max-width: 714px; margin: 0 auto; background: white; color: #1f2937; line-height: 1.5;">
          <!-- Header -->
          <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${storeName}</h1>
            <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">${storeAddress}</p>
            <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">📞 ${storePhone} | ✉️ ${storeEmail}</p>
          </div>

          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
            <div style="flex: 1;">
              <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 16px 0;">INVOICE</h2>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;"><span style="font-weight: 600;">Invoice No:</span> ${invoiceNumber}</p>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;"><span style="font-weight: 600;">Date:</span> ${invoiceDate}</p>
            </div>
            <div style="flex: 1; text-align: right;">
              <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 8px 0; font-size: 16px;">Bill To:</h3>
              <p style="font-weight: 600; font-size: 16px; margin: 4px 0; color: #1f2937;">${booking.customer?.name || 'Unknown Customer'}</p>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">${booking.customer?.address || 'N/A'}</p>
              <p style="color: #6b7280; margin: 4px 0; font-size: 14px;">📞 ${booking.customer?.phone1 || 'N/A'}</p>
              ${booking.customer?.email && booking.customer.email !== booking.customer.phone1 ? 
                `<p style="color: #6b7280; margin: 4px 0; font-size: 14px;">✉️ ${booking.customer.email}</p>` : ''}
            </div>
          </div>

          <!-- Rental Details -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">📅 Rental Details</h3>
            <div style="margin-bottom: 12px;">
              <span style="font-weight: 600; color: #374151; font-size: 14px;">Rental Period:</span>
              <span style="color: #6b7280; margin-left: 8px; font-size: 14px;">
                From ${booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : 'N/A'} to ${booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div style="display: flex; gap: 32px;">
              <div>
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Status:</span>
                <span style="margin-left: 8px; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; ${statusClass}">
                  ${(booking.status || 'unknown').toUpperCase()}
                </span>
              </div>
              <div>
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Booking ID:</span>
                <span style="color: #6b7280; margin-left: 8px; font-size: 14px;">#${booking.id || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">📦 Products/Services</h3>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Item</th>
                    <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Rate (₹)</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHTML}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment Summary -->
          <div style="margin-bottom: 24px;">
            <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
              <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">💳 Payment Summary</h3>
              <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Subtotal:</span>
                <span style="font-weight: 600; font-size: 16px; color: #1f2937;">₹${totalAmount.toLocaleString()}</span>
              </div>
              <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Advance Paid:</span>
                <span style="font-weight: 600; color: #059669; font-size: 16px;">₹${advancePayment.toLocaleString()}</span>
              </div>
              <div style="border-top: 1px solid #d1d5db; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold; color: #1f2937; font-size: 18px;">Pending Amount:</span>
                  <span style="font-weight: bold; color: #dc2626; font-size: 20px;">₹${pendingAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px;">
            <p style="margin: 0;">Thank you for choosing ${storeName}! | For any queries, contact us at ${storePhone} or ${storeEmail}</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempContainer);
      
      // Wait a bit for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: Math.max(1123, tempContainer.scrollHeight + 80),
        scrollX: 0,
        scrollY: 0,
      });
      
      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate dimensions to fit the page properly
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const finalWidth = (imgWidth * 0.264583) * ratio;
      const finalHeight = (imgHeight * 0.264583) * ratio;
      
      // Center the content
      const xPos = (pdfWidth - finalWidth) / 2;
      const yPos = 10; // Small margin from top
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight, undefined, 'FAST');
      
      const pdfBlob = pdf.output('blob');
      
      // Create a downloadable URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Check if running on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Try Web Share API first (works on newer mobile browsers)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
          
          await navigator.share({
            title: `Invoice ${invoiceNumber} - ${storeName}`,
            text: `Invoice for ${booking.customer.name} - Total: ₹${booking.totalAmount.toLocaleString()}`,
            files: [file]
          });
          return;
        } catch (shareError) {
          console.log('Web Share API failed, falling back to download and open');
        }
      }
      
      // Fallback: Download and open PDF for manual sharing
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Auto-open the PDF after a short delay (to allow download to complete)
      setTimeout(() => {
        if (isMobile) {
          // On mobile, try to open the PDF directly
          try {
            window.open(pdfUrl, '_blank');
          } catch (error) {
            console.log('Could not auto-open PDF on mobile');
          }
          
          // Show helpful message for mobile users
          alert('📱 PDF downloaded and opened!\n\n💡 Tip: You can now use your device\'s share button to send this invoice via WhatsApp, Email, Telegram, or any other app.');
        } else {
          // On desktop, open PDF in new tab
          window.open(pdfUrl, '_blank');
          alert('� PDF downloaded and opened in new tab!\n\n💡 Tip: You can now save or share this PDF from the new tab.');
        }
      }, 500); // Small delay to ensure download starts first
      
      // Cleanup URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      alert('Error generating PDF for sharing. Please try again.');
    } finally {
      // Cleanup
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-4">The requested booking could not be found.</p>
          <button
            onClick={() => router.push('/bookings')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const invoiceDate = new Date().toLocaleDateString('en-IN');
  const invoiceNumber = `INV-${booking.id.toString().padStart(6, '0')}`;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Rental Equipment & Services';
  const storeAddress = process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Your Store Address';
  const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || 'Your Phone Number';
  const storeEmail = process.env.NEXT_PUBLIC_STORE_EMAIL || 'Your Email';
  
  const advancePayment = booking.advancePayment || 0;
  const totalAmount = booking.totalAmount || 0;
  const pendingAmount = totalAmount - advancePayment;

  const statusClass = 
    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
    booking.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
    'bg-blue-100 text-blue-800';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/bookings')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAsPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Save as PDF
            </button>
            
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              Share
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div ref={invoiceRef} className="p-4 sm:p-6 lg:p-8">
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
                  <span className="text-gray-600 text-sm sm:text-base">
                    From {booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : 'N/A'} to {booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
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
                          <div className="font-medium text-gray-800 text-xs sm:text-sm">{item.product?.name || 'Unknown Product'}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{item.quantity || 0}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">₹{(item.product?.pricePerDay || 0).toLocaleString()}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-medium text-xs sm:text-sm">₹{(item.subtotal || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}