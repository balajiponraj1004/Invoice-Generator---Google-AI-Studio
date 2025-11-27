import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, Product } from '../types';
import { Building, Palette, Upload, Plus, Trash2, Save, ShoppingBag, Wand2, Image as ImageIcon, FileText, X, Cloud, Info, Table, FolderOpen, CheckSquare, Square } from 'lucide-react';
import { parseMenuSource } from '../services/geminiService';
import { saveDirectoryHandle, getDirectoryHandle } from '../services/fileSystem';

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
  
  // AI Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Folder State
  const [folderName, setFolderName] = useState<string | null>(null);

  useEffect(() => {
    const checkFolder = async () => {
        try {
            const handle = await getDirectoryHandle();
            if (handle) {
                setFolderName(handle.name);
            }
        } catch (e) {
            console.error("Error loading folder handle", e);
        }
    };
    checkFolder();
  }, []);

  const updateField = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress and Resize Image before saving to localStorage
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Use smaller dimensions to ensure it fits in localStorage
          const maxWidth = 300;
          const maxHeight = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          if (ctx) {
              // Fill white background to handle transparency
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
          }
          
          // Convert to base64 with lower quality to save space
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          // Check size (approx 500KB safety limit)
          if (compressedBase64.length > 500000) {
              alert("The logo image is still too large even after compression. Please upload a simpler or smaller image file.");
              return;
          }

          updateField('logo', compressedBase64);
        };
        img.src = event.target?.result as string;
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

  const handleAiImport = async (input: string | File) => {
    if (!process.env.API_KEY) {
        alert("API Key missing. Cannot use AI features.");
        return;
    }

    setIsImporting(true);
    try {
        let payload: string | { data: string; mimeType: string };

        if (input instanceof File) {
            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data url prefix (e.g. "data:image/jpeg;base64,")
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(input);
            });
            payload = { data: base64Data, mimeType: input.type };
        } else {
            payload = input;
        }

        const extractedProducts = await parseMenuSource(payload);
        
        if (extractedProducts && extractedProducts.length > 0) {
            updateField('products', [...localSettings.products, ...extractedProducts]);
            setImportText('');
            setShowImport(false);
        } else {
            alert("No items could be extracted.");
        }
    } catch (e) {
        console.error("Import failed", e);
        alert("Failed to import menu items. Please try again.");
    } finally {
        setIsImporting(false);
    }
  };

  const triggerImageUpload = () => {
      fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleAiImport(file);
      }
      // Reset input
      e.target.value = '';
  };

  const handleSetFolder = async () => {
    try {
        if (!window.showDirectoryPicker) {
            alert("Your browser does not support picking a default folder. Please use Chrome or Edge on a desktop.");
            return;
        }
        
        const handle = await window.showDirectoryPicker();
        await saveDirectoryHandle(handle);
        setFolderName(handle.name);
        alert(`Default save folder set to: ${handle.name}`);
    } catch (err: any) {
        if (err.name === 'AbortError') return;
        
        // Handle Cross-Origin / Iframe Security Errors
        if (err.name === 'SecurityError' || (err.message && err.message.includes('Cross origin sub frames'))) {
             alert("Folder selection is disabled in this preview environment due to browser security restrictions.\n\nPlease open this application in a new standalone window or tab to use this feature.");
        } else {
             console.error("Directory picker error:", err);
             alert("Could not set folder: " + err.message);
        }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center pb-6 border-b border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Admin Settings</h2>
           <p className="text-gray-500 text-sm">Configure your company profile, branding, and integrations.</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={localSettings.companyEmail}
                  onChange={(e) => updateField('companyEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <textarea
                  value={localSettings.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  value={localSettings.defaultTaxRate ?? 0}
                  onChange={(e) => updateField('defaultTaxRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
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
                      className="h-10 w-full rounded border border-gray-300 cursor-pointer bg-white"
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

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-4">
             <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                <Cloud size={18} /> Google Integrations
             </h3>
             <div className="space-y-3">
                <div>
                   <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-blue-700">Google Client ID</label>
                      <div className="group relative">
                         <Info size={14} className="text-blue-400 cursor-help"/>
                         <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-10">
                            Create a project in Google Cloud Console, enable Drive & Sheets API, and create an OAuth 2.0 Client ID for Web Application.
                         </div>
                      </div>
                   </div>
                   <input
                     type="text"
                     placeholder="e.g. 123...apps.googleusercontent.com"
                     value={localSettings.googleDriveClientId || ''}
                     onChange={(e) => updateField('googleDriveClientId', e.target.value)}
                     className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-blue-700 mb-1">
                      <div className="flex items-center gap-1">
                        <Table size={12}/> Google Sheet ID (for Exports)
                      </div>
                   </label>
                   <input
                     type="text"
                     placeholder="Auto-generated if empty"
                     value={localSettings.googleSheetsId || ''}
                     onChange={(e) => updateField('googleSheetsId', e.target.value)}
                     className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white text-gray-900"
                   />
                   <p className="text-[10px] text-blue-600 mt-1">Leave empty to auto-create "Cake Dudes Invoices" sheet.</p>
                </div>
                
                {/* Auto Export Toggle */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={() => updateField('autoExportToSheet', !localSettings.autoExportToSheet)}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${localSettings.autoExportToSheet ? 'text-green-700' : 'text-gray-500'}`}
                    >
                        {localSettings.autoExportToSheet ? <CheckSquare size={18} /> : <Square size={18} />}
                        Auto-export to Sheet on Save
                    </button>
                </div>
             </div>
          </div>
          
          {/* Local File System Section */}
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 space-y-4">
             <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                <FolderOpen size={18} /> Local Storage
             </h3>
             <div className="space-y-2">
                 <p className="text-xs text-orange-700">
                     Select a default local folder to bypass the save prompt. (Chrome/Edge only)
                 </p>
                 <div className="flex items-center gap-3">
                     <button
                        onClick={handleSetFolder}
                        className="px-3 py-1.5 bg-white border border-orange-200 text-orange-700 text-xs rounded-md shadow-sm hover:bg-orange-100 transition-colors"
                     >
                        {folderName ? 'Change Folder' : 'Set Default Folder'}
                     </button>
                     {folderName && (
                        <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                            Current: {folderName}
                        </span>
                     )}
                 </div>
             </div>
          </div>
        </div>

        {/* Right Column: Menu / Products */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col h-full">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingBag size={18} /> Menu Items
              </h3>
              <div className="flex items-center gap-2">
                 <button
                    onClick={() => setShowImport(!showImport)}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-all ${showImport ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                 >
                    {showImport ? <X size={14}/> : <Wand2 size={14} />}
                    {showImport ? 'Close' : 'Import AI'}
                 </button>
                 <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {localSettings.products.length}
                 </span>
              </div>
           </div>
            
           {/* AI Import Section */}
           {showImport && (
               <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4 animate-in fade-in zoom-in-95">
                   <h4 className="text-sm font-semibold text-purple-800 mb-2">Import Menu via AI</h4>
                   <p className="text-xs text-purple-600 mb-3">
                       Paste a text list of items or upload an image of your menu.
                   </p>
                   
                   <textarea
                       className="w-full text-sm p-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-300 outline-none mb-3 bg-white text-gray-900"
                       rows={3}
                       placeholder="e.g. Vanilla Cake $45, Chocolate Truffle $55..."
                       value={importText}
                       onChange={(e) => setImportText(e.target.value)}
                   ></textarea>
                   
                   <div className="flex gap-2">
                       <button
                           onClick={() => handleAiImport(importText)}
                           disabled={!importText.trim() || isImporting}
                           className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center gap-1"
                       >
                           {isImporting ? <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full"></span> : <FileText size={14} />}
                           Import Text
                       </button>
                       <button
                           onClick={triggerImageUpload}
                           disabled={isImporting}
                           className="flex-1 bg-white text-purple-700 border border-purple-200 text-xs py-1.5 rounded hover:bg-purple-100 disabled:opacity-50 flex justify-center items-center gap-1"
                       >
                           {isImporting ? <span className="animate-spin w-3 h-3 border-2 border-purple-700/30 border-t-purple-700 rounded-full"></span> : <ImageIcon size={14} />}
                           Upload Image
                       </button>
                       <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           accept="image/*"
                           onChange={handleImageFileChange}
                       />
                   </div>
               </div>
           )}

           {/* Manual Add Product Form */}
           <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 shadow-sm">
              <div className="grid grid-cols-12 gap-2 mb-2">
                 <div className="col-span-6">
                    <input 
                      placeholder="Item Name" 
                      className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-white text-gray-900"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    />
                 </div>
                 <div className="col-span-3">
                    <input 
                      placeholder="Price" 
                      type="number"
                      className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-white text-gray-900"
                      value={newProduct.price || ''}
                      onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div className="col-span-3">
                    <input 
                      placeholder="Flavor" 
                      className="w-full text-sm border-b border-gray-200 focus:border-blue-500 outline-none py-1 bg-white text-gray-900"
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