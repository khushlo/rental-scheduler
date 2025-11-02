import { InvoiceData, BookingItem } from './types';
import { formatTimeTo12Hour } from './utils';

interface PDFTemplateProps {
  invoiceData: InvoiceData;
}

export const generatePDFTemplate = ({ invoiceData }: PDFTemplateProps): string => {
  const { booking, invoiceNumber, invoiceDate, storeName, storeAddress, storePhone, storeEmail, storeTagline, advancePayment, totalAmount, pendingAmount, statusClass } = invoiceData;

  // Generate products HTML
  const productsHTML = (booking.items || []).map((item: BookingItem, index: number) => {
    const hasCustomTiming = item.itemStartDate && item.itemEndDate && item.itemStartTime && item.itemEndTime;
    const customTimingHTML = hasCustomTiming ? `
      <div style="font-size: 10px; color: #ffffff; margin-top: 4px; padding: 4px 8px; background-color: #2563eb; border-radius: 6px; display: inline-block; font-weight: 600;">
        Custom: ${new Date(item.itemStartDate!).toLocaleDateString()} ${formatTimeTo12Hour(item.itemStartTime!)} to ${new Date(item.itemEndDate!).toLocaleDateString()} ${formatTimeTo12Hour(item.itemEndTime!)}
      </div>
    ` : '';
    
    return `
      <tr style="${index % 2 === 0 ? 'background-color: #f9fafb;' : ''}">
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #1f2937;">
          <div>
            ${item.product?.name || 'Unknown Product'}
            ${item.notes ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${item.notes}</div>` : ''}
            ${customTimingHTML}
          </div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${item.quantity || 0}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #4b5563;">₹${(item.pricePerDay || 0).toLocaleString()}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">₹${(item.subtotal || 0).toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="max-width: 714px; margin: 0 auto; background: white; color: #1f2937; line-height: 1.5;">
      <!-- Header -->
      <div style="background: linear-gradient(to right, #eff6ff, #f3e8ff); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${storeName}</h1>
        ${storeTagline ? `<p style="font-style: italic; color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">${storeTagline}</p>` : ''}
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
            From ${booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-IN') : 'N/A'} at <span style="background-color: #2563eb; color: #ffffff; padding: 4px 8px; border-radius: 6px; font-weight: 600;">${formatTimeTo12Hour(booking.startTime)}</span> to ${booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-IN') : 'N/A'} at <span style="background-color: #2563eb; color: #ffffff; padding: 4px 8px; border-radius: 6px; font-weight: 600;">${formatTimeTo12Hour(booking.endTime)}</span>
          </span>
        </div>
        ${booking.eventDate ? `
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #374151; font-size: 14px;">Event Date:</span>
          <span style="color: #6b7280; margin-left: 8px; font-size: 14px;">${new Date(booking.eventDate).toLocaleDateString('en-IN')}</span>
        </div>` : ''}
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

      ${booking.notes ? `
      <!-- Booking Notes -->
      <div style="margin-bottom: 24px;">
        <div style="background-color: #fef7e3; border-radius: 8px; padding: 20px; border: 1px solid #f59e0b;">
          <h3 style="font-weight: 600; color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">📝 Booking Notes</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${booking.notes}</p>
        </div>
      </div>` : ''}

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
};