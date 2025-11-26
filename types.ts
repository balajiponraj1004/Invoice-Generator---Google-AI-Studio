export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  weight?: string;
  flavor?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  
  // Company Details (Sender)
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  logo?: string; // Base64 string or URL
  themeColor: string; // Hex color code

  // Customer Details (Recipient)
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  
  items: LineItem[];
  notes: string;
  taxRate: number; // Percentage
  discount: number; // Fixed amount
  status: 'DRAFT' | 'PAID' | 'PENDING';
}

export const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  
  companyName: 'Cake Dudes',
  companyAddress: '123 Sugar Lane\nSweet City, CA 90210',
  companyEmail: 'contact@cakedudes.com',
  logo: '',
  themeColor: '#ec4899', // Default Tailwind brand-500 color
  
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  items: [
    {
      id: '1',
      description: 'Custom Birthday Cake',
      quantity: 1,
      price: 50.00,
      flavor: 'Vanilla Bean',
      weight: '1kg'
    }
  ],
  notes: 'Thank you for choosing Cake Dudes!',
  taxRate: 0,
  discount: 0,
  status: 'DRAFT'
};