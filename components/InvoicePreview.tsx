import React from 'react';
import { InvoiceData } from '../types';
import { Cake, Phone, Mail, MapPin } from 'lucide-react';

interface InvoicePreviewProps {
  data: InvoiceData;
  id?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, id = "invoice-preview" }) => {
  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount - data.discount;

  return (
    <div id={id} className="bg-white w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-lg p-8 md:p-12 text-gray-800 relative overflow-hidden">
      
      {/* Decorative Top Border */}
      <div 
        className="absolute top-0 left-0 w-full h-3" 
        style={{ backgroundColor: data.themeColor }}
      ></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-12 mt-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {data.logo ? (
               <img src={data.logo} alt="Company Logo" className="w-16 h-16 object-contain" />
            ) : (
               <div 
                 className="text-white p-2 rounded-lg"
                 style={{ backgroundColor: data.themeColor }}
               >
                 <Cake size={32} />
               </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{data.companyName}</h1>
          </div>
          <div className="ml-1 text-sm text-gray-500">
             <div className="whitespace-pre-line">{data.companyAddress}</div>
             <div className="mt-1">{data.companyEmail}</div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-light text-gray-300 tracking-widest uppercase">Invoice</h2>
          <p className="font-semibold text-gray-700 mt-2">#{data.invoiceNumber}</p>
          <div className="mt-4 text-sm text-gray-500 space-y-1">
             <div className="flex items-center justify-end gap-2">
                <span>Date:</span>
                <span className="font-medium text-gray-800">{data.date}</span>
             </div>
             <div className="flex items-center justify-end gap-2">
                <span>Due Date:</span>
                <span className="font-medium text-gray-800">{data.dueDate}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
          <div className="text-gray-700 font-medium text-lg">{data.customerName || 'Guest Customer'}</div>
          {data.customerAddress && (
            <div className="flex items-start gap-2 text-gray-600 text-sm mt-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>{data.customerAddress}</span>
            </div>
          )}
          {data.customerPhone && (
            <div className="flex items-center gap-2 text-gray-600 text-sm mt-2">
              <Phone size={16} />
              <span>{data.customerPhone}</span>
            </div>
          )}
        </div>
        <div className="text-right">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pay To</h3>
           <div className="text-gray-700 font-medium">{data.companyName}</div>
           <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{data.companyAddress}</div>
           <div className="text-sm text-gray-600 mt-2">{data.companyEmail}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider w-1/2">Description</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Price</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.items.map((item) => (
              <tr key={item.id}>
                <td className="py-4">
                  <div className="font-semibold text-gray-800">{item.description}</div>
                  {(item.flavor || item.weight) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.flavor && <span className="mr-3">Flavor: {item.flavor}</span>}
                      {item.weight && <span>Weight: {item.weight}</span>}
                    </div>
                  )}
                </td>
                <td className="py-4 text-right text-gray-600">${item.price.toFixed(2)}</td>
                <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right font-medium text-gray-800">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          {data.taxRate > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({data.taxRate}%)</span>
              <span className="font-medium">+${taxAmount.toFixed(2)}</span>
            </div>
          )}
          {data.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-medium">-${data.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-100">
            <span>Total</span>
            <span style={{ color: data.themeColor }}>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer / Notes */}
      {(data.notes) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes & Terms</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{data.notes}</p>
        </div>
      )}

      {/* Bottom Branding */}
      <div className="absolute bottom-0 left-0 w-full p-8 text-center">
        <p className="text-gray-400 text-xs">Thank you for your business!</p>
      </div>
    </div>
  );
};