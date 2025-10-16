export interface BookingItem {
  id: number;
  quantity: number;
  pricePerDay: number;
  subtotal: number;
  notes?: string;
  productId: number;
  itemStartDate?: string | null;
  itemEndDate?: string | null;
  itemStartTime?: string | null;
  itemEndTime?: string | null;
  product: {
    id: number;
    name: string;
    pricePerDay: number;
    category?: string;
  };
}

export interface Customer {
  id: number;
  name: string;
  phone1: string;
  phone2?: string;
  address?: string;
  email: string;
}

export interface Tenant {
  id: number;
  name: string;
  username?: string | null;
  storeName?: string | null;
  storeTagline?: string | null;
  storeAddress?: string | null;
  storePhone?: string | null;
  storeEmail?: string | null;
  storeWebsite?: string | null;
  storeLogo?: string | null;
  storeTheme?: string | null;
  storeCurrency?: string | null;
  storeTimezone?: string | null;
}

export interface Booking {
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
  tenantId: number;
  rowStatusCd?: 'A' | 'C' | 'D' | 'I' | 'O'; // Row Status Code
  items: BookingItem[];
  customer: Customer;
  tenant?: Tenant;
}

export interface InvoiceData {
  booking: Booking;
  invoiceNumber: string;
  invoiceDate: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeTagline?: string;
  advancePayment: number;
  totalAmount: number;
  pendingAmount: number;
  statusClass: string;
}