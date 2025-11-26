export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  weight?: string;
  flavor?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  flavor?: string;
  weight?: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  logo: string;
  themeColor: string;
  products: Product[];
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  
  // Company Details (Sender) - Populated from Settings
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

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Cake Dudes',
  companyAddress: '123 Sugar Lane\nSweet City, CA 90210',
  companyEmail: 'contact@cakedudes.com',
  logo: '',
  themeColor: '#ec4899',
  products: [
    { id: '1', name: 'Vanilla Bean Cake', price: 45.00, flavor: 'Vanilla', weight: '1kg' },
    { id: '2', name: 'Chocolate Truffle', price: 55.00, flavor: 'Chocolate', weight: '1kg' },
    { id: '3', name: 'Red Velvet', price: 50.00, flavor: 'Red Velvet', weight: '1kg' },
    { id: '4', name: 'Custom Cupcakes (Dozen)', price: 30.00, flavor: 'Assorted', weight: '12 pack' }
  ]
};

export const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  
  // These will be overwritten by AppSettings on load
  companyName: DEFAULT_SETTINGS.companyName,
  companyAddress: DEFAULT_SETTINGS.companyAddress,
  companyEmail: DEFAULT_SETTINGS.companyEmail,
  logo: DEFAULT_SETTINGS.logo,
  themeColor: DEFAULT_SETTINGS.themeColor,
  
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