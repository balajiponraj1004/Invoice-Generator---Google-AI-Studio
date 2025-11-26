import React from 'react';
import { InvoiceData, LineItem, Product } from '../types';
import { Plus, Trash2, Wand2, ShoppingBag } from 'lucide-react';

interface InvoiceFormProps {
  data: InvoiceData;
  menuItems: Product[];
  onChange: (data: InvoiceData) => void;
  onOpenAI: () => void;
  isProcessing: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, menuItems, onChange, onOpenAI, isProcessing }) => {

  const updateField = (field: keyof InvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateField('items', newItems);
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      price: 0,
      flavor: '',
      weight: ''
    };
    updateField('items', [...data.items, newItem]);
  };

  const addFromMenu = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    if (!productId) return;

    const product = menuItems.find(p => p.id === productId);
    if (product) {
      const newItem: LineItem = {
        id: crypto.randomUUID(),
        description: product.name,
        quantity: 1,
        price: product.price,
        flavor: product.flavor || '',
        weight: product.weight || ''
      };
      updateField('items', [...data.items, newItem]);
    }
    // Reset select
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    updateField('items', data.items.filter(item => item.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
        <button
          onClick={onOpenAI}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
        >
          <Wand2 size={18} />
          {isProcessing ? 'Thinking...' : 'AI Autofill'}
        </button>
      </div>

      {/* Invoice Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
          <input
            type="text"
            value={data.invoiceNumber}
            onChange={(e) => updateField('invoiceNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Customer Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={data.customerName}
            onChange={(e) => updateField('customerName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={data.customerPhone}
            onChange={(e) => updateField('customerPhone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          <input
            type="text"
            placeholder="Address"
            value={data.customerAddress}
            onChange={(e) => updateField('customerAddress', e.target.value)}
            className="w-full md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Order Items</h3>
          
          <div className="flex items-center gap-2">
             {menuItems.length > 0 && (
                <div className="relative">
                   <select 
                     onChange={addFromMenu} 
                     className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer hover:bg-gray-100"
                     defaultValue=""
                   >
                      <option value="" disabled>Select from Menu...</option>
                      {menuItems.map(p => (
                         <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                   </select>
                   <ShoppingBag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
             )}
             <button
              onClick={addItem}
              className="text-sm font-medium hover:opacity-80 flex items-center gap-1 text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <Plus size={16} /> Add Custom
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.items.length === 0 && (
             <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm">
                No items added yet.
             </div>
          )}
          {data.items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-3 rounded-lg border border-gray-100 relative group transition-all hover:shadow-sm hover:border-gray-200">
              <div className="col-span-12 md:col-span-4">
                <input
                  type="text"
                  placeholder="Description (e.g. Chocolate Cake)"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 focus:border-brand-500 outline-none px-1 py-1"
                />
                <div className="flex gap-2 mt-2">
                   <input
                    type="text"
                    placeholder="Flavor"
                    value={item.flavor}
                    onChange={(e) => handleItemChange(item.id, 'flavor', e.target.value)}
                    className="w-1/2 text-xs bg-white border border-gray-200 rounded px-2 py-1"
                  />
                   <input
                    type="text"
                    placeholder="Weight"
                    value={item.weight}
                    onChange={(e) => handleItemChange(item.id, 'weight', e.target.value)}
                    className="w-1/2 text-xs bg-white border border-gray-200 rounded px-2 py-1"
                  />
                </div>
              </div>
              <div className="col-span-4 md:col-span-3">
                 <label className="text-xs text-gray-400 block md:hidden">Price</label>
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent border-b border-gray-300 focus:border-brand-500 outline-none px-1 py-1 text-right"
                />
              </div>
              <div className="col-span-3 md:col-span-2">
                 <label className="text-xs text-gray-400 block md:hidden">Qty</label>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                  className="w-full bg-transparent border-b border-gray-300 focus:border-brand-500 outline-none px-1 py-1 text-center"
                />
              </div>
              <div className="col-span-4 md:col-span-2 text-right font-medium text-gray-700 flex items-center justify-end h-full pt-1">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <div className="col-span-1 flex justify-center pt-2">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
          <textarea
            value={data.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
          />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Tax Rate (%)</span>
            <input
              type="number"
              value={data.taxRate}
              onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Discount ($)</span>
            <input
              type="number"
              value={data.discount}
              onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};