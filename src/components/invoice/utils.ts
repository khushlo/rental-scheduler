import { InvoiceData } from './types';

// Helper function to format time to 12-hour format with AM/PM
export const formatTimeTo12Hour = (time24: string): string => {
  if (!time24) return 'N/A';
  
  try {
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const minute = minutes || '00';
    
    if (hour24 === 0) {
      return `12:${minute} AM`;
    } else if (hour24 === 12) {
      return `12:${minute} PM`;
    } else if (hour24 < 12) {
      return `${hour24}:${minute} AM`;
    } else {
      return `${hour24 - 12}:${minute} PM`;
    }
  } catch (error) {
    return time24; // Return original if parsing fails
  }
};

// Generate invoice data from booking with tenant store information
export const generateInvoiceData = (booking: any, tenant?: any): InvoiceData => {
  const invoiceNumber = `INV-${booking.id.toString().padStart(6, '0')}`;
  const invoiceDate = new Date().toLocaleDateString('en-IN');
  
  // Use tenant-specific store details if available, otherwise fallback to environment variables
  const storeName = tenant?.storeName || 'Rental Equipment & Services';
  const storeAddress = tenant?.storeAddress ||  'Your Store Address';
  const storePhone = tenant?.storePhone || 'Your Phone Number';
  const storeEmail = tenant?.storeEmail || 'Your Email';
  const storeTagline = tenant?.storeTagline || 'Your Store Tagline';
  
  const advancePayment = booking.advancePayment || 0;
  const totalAmount = booking.totalAmount || 0;
  const pendingAmount = totalAmount - advancePayment;
  
  const statusClass = 
    booking.status === 'confirmed' ? 'background-color: #dcfce7; color: #166534;' :
    booking.status === 'active' ? 'background-color: #fef3c7; color: #92400e;' :
    booking.status === 'cancelled' ? 'background-color: #fee2e2; color: #dc2626;' :
    'background-color: #dbeafe; color: #1d4ed8;';

  return {
    booking,
    invoiceNumber,
    invoiceDate,
    storeName,
    storeAddress,
    storePhone,
    storeEmail,
    storeTagline,
    advancePayment,
    totalAmount,
    pendingAmount,
    statusClass
  };
};

// Generate CSS status class for HTML components
export const generateHTMLStatusClass = (status: string): string => {
  return status === 'confirmed' ? 'bg-green-100 text-green-800' :
    status === 'active' ? 'bg-yellow-100 text-yellow-800' :
    status === 'cancelled' ? 'bg-red-100 text-red-800' :
    'bg-blue-100 text-blue-800';
};

// Generate filename for PDF
export const generatePDFFilename = (booking: any): string => {
  const customerName = (booking.customer?.name || 'Unknown').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return `${customerName} - Invoice-${booking.id}.pdf`;
};