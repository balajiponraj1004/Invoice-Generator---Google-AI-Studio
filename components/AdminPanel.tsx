import React, { useState } from 'react';
import { AppSettings, Product } from '../types';
import { Building, Palette, Upload, Plus, Trash2, Save, ShoppingBag } from 'lucide-react';

interface AdminPanelProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ settings, onUpdate, onClose }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    flavor: '',
    weight: ''
  });

  const updateField = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    
    const product: Product = {
      id: crypto.randomUUID(),
      name: newProduct.name,
      price: Number(newProduct.price),
      flavor: newProduct.flavor || '',
      weight: newProduct.weight || ''
    };

    updateField('products', [...localSettings.products, product]);
    setNewProduct({ name: '', price: 0, flavor: '', weight: '' });
  };

  const removeProduct = (id: string) => {
    updateField('products', localSettings.products.filter(p => p.id !== id));
  };

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center pb-6 border-b border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
           <p className="text-gray-500 text-sm">Configure your company profile and menu.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Branding & Company Info */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Building size={18} /> Company Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
                <input
                  type="text"
                  value={localSettings.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={localSettings.companyEmail}
                  onChange={(e) => updateField('companyEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <textarea
                  value={localSettings.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Palette size={18} /> Branding
            </h3>
            <div className="flex gap-6">
               <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={localSettings.themeColor}
                      onChange={(e) => updateField('themeColor', e.target.value)}
                      className="h-10 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Logo</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="admin-logo-upload"
                    />
                    <label 
                      htmlFor="admin-logo-upload"
                      className="flex flex-col items-center justify-center gap-1 w-full h-20 px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Upload size={16} /> 
                      {localSettings.logo ? 'Change Logo' : 'Upload Logo'}
                    </label>
                  </div>
                  {localSettings.logo && (
                    <button 
                      onClick={() => updateField('logo', '')}
                      className="text-[10px] text-red-500 mt-2 hover:underline w-full text-center"
                    >
                      Remove Logo
                    </button>
                  )}
               </div>
            </div>
            {localSettings.logo && (
               <div className="flex justify-center p-2 bg-white rounded border border-gray-200">
                  <img src={localSettings.logo} alt="Preview" className="h-12 object-contain" />
               </div>
            )}
          </div>
        </div>

        {/* Right Column: Menu / Products */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col h-full">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingBag size={18} /> Menu Items
              </h3>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                {localSettings.products.length} Items
              </span>
           </div>

           {/* Add Product Form */}
           <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 shadow-sm">
              <div className="grid grid-cols-12 gap-2 mb-2">
                 <div className="col-span-6">
                    <input 
                      placeholder="Item Name" 
                      className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    />
                 </div>
                 <div className="col-span-3">
                    <input 
                      placeholder="Price" 
                      type="number"
                      className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                      value={newProduct.price || ''}
                      onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div className="col-span-3">
                    <input 
                      placeholder="Flavor" 
                      className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                      value={newProduct.flavor}
                      onChange={e => setNewProduct({...newProduct, flavor: e.target.value})}
                    />
                 </div>
              </div>
              <button 
                onClick={addProduct}
                disabled={!newProduct.name || !newProduct.price}
                className="w-full py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-1"
              >
                <Plus size={14} /> Add to Menu
              </button>
           </div>

           {/* Product List */}
           <div className="flex-grow overflow-y-auto pr-1 space-y-2 max-h-[400px]">
              {localSettings.products.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm italic">
                   No items in menu yet.
                </div>
              ) : (
                localSettings.products.map(product => (
                  <div key={product.id} className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                     <div>
                        <div className="font-medium text-sm text-gray-800">{product.name}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                           <span>${product.price.toFixed(2)}</span>
                           {product.flavor && <span className="border-l border-gray-300 pl-2">{product.flavor}</span>}
                           {product.weight && <span className="border-l border-gray-300 pl-2">{product.weight}</span>}
                        </div>
                     </div>
                     <button 
                       onClick={() => removeProduct(product.id)}
                       className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};