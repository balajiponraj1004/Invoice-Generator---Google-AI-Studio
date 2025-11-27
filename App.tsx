
import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AdminPanel } from './components/AdminPanel';
import { InvoiceData, DEFAULT_INVOICE, AppSettings, DEFAULT_SETTINGS } from './types';
import { parseOrderWithGemini } from './services/geminiService';
import { getDirectoryHandle, verifyPermission } from './services/fileSystem';
import { Printer, Download, Github, Settings as SettingsIcon, LayoutDashboard, FileText, Cloud, Save, Share2, Table } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

declare global {
  interface Window {
    google: any;
    showSaveFilePicker?: (options?: any) => Promise<any>;
    showDirectoryPicker?: () => Promise<any>;
  }
}

// Dynamic script loader for Google APIs
const loadGoogleScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<'invoice' | 'admin'>('invoice');
  
  // Load settings from local storage with robust merging strategy
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem('invoice-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge parsed settings with defaults to ensure new fields (like googleDriveClientId) exist
            // This prevents the app from resetting if the schema changes
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
        return DEFAULT_SETTINGS;
    } catch (e) {
        console.error("Failed to load settings from localStorage", e);
        return DEFAULT_SETTINGS;
    }
  });

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    ...DEFAULT_INVOICE,
    // Initialize with current settings
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail,
    logo: settings.logo,
    themeColor: settings.themeColor,
    taxRate: settings.defaultTaxRate || 0,
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isExportingToSheet, setIsExportingToSheet] = useState(false);
  const [defaultDirHandle, setDefaultDirHandle] = useState<any>(null);

  // --- Effects ---
  
  // Load default directory handle on mount
  useEffect(() => {
    const loadHandle = async () => {
        try {
            const handle = await getDirectoryHandle();
            if (handle) setDefaultDirHandle(handle);
        } catch (e) {
            console.error("Failed to load dir handle", e);
        }
    };
    loadHandle();
  }, []);

  // Save settings to local storage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('invoice-settings', JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings to localStorage. Quota likely exceeded.", e);
        // We only alert if the logo is present, as that's the likely culprit
        if (settings.logo) {
             alert("Warning: Settings could not be saved locally because the logo file is too large. Please upload a smaller logo in the Admin panel.");
        }
    }
  }, [settings]);

  // Sync Global Settings to Current Invoice (Live Update)
  // This ensures that when Admin settings change, the Invoice reflects them immediately
  useEffect(() => {
    setInvoiceData(prev => ({
      ...prev,
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyEmail: settings.companyEmail,
      logo: settings.logo,
      themeColor: settings.themeColor,
      taxRate: settings.defaultTaxRate || 0,
    }));
  }, [settings]);

  // --- Handlers ---

  const handleAiAnalyze = async (text: string) => {
    setIsProcessingAi(true);
    try {
      // Pass menu items to AI for better matching
      const parsedData = await parseOrderWithGemini(text, settings.products);
      setInvoiceData(prev => ({
        ...prev,
        ...parsedData,
        items: parsedData.items ? [...parsedData.items] : prev.items
      }));
      setIsAiModalOpen(false);
    } catch (error) {
      alert("Failed to parse order. Please try again.");
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    const element = document.getElementById('invoice-preview');
    if (!element) return null;

    // Use a high scale for better quality
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const handleSaveLocally = async () => {
    setIsGeneratingPdf(true);
    let saveSuccess = false;
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
        const blob = await generatePdfBlob();
        if (!blob) throw new Error("Could not generate PDF canvas.");

        const filename = `Invoice_${invoiceData.invoiceNumber}.pdf`;

        // Strategy 1: Use Default Directory Handle if available
        if (defaultDirHandle) {
            try {
                // Verify permission
                const hasPerm = await verifyPermission(defaultDirHandle, true);
                if (hasPerm) {
                    const fileHandle = await defaultDirHandle.getFileHandle(filename, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    saveSuccess = true;
                    // Don't return yet, need to check auto-export
                } else {
                    // Fallback if permission denied
                    throw new Error("Permission denied");
                }
            } catch (err) {
                console.warn("Direct save failed, falling back to picker/download", err);
                // Fallback to picker logic below
            }
        }

        // Strategy 2: File System Access API (Picker) - Only if Strategy 1 failed or didn't exist
        if (!saveSuccess && window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PDF File',
                        accept: { 'application/pdf': ['.pdf'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                saveSuccess = true;
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    setIsGeneratingPdf(false);
                    return; // User cancelled
                }
                // Silently fall back to strategy 3 for security/iframe errors
                console.warn("File picker failed, falling back to download:", err);
            }
        }

        // Strategy 3: Standard Download Fallback
        if (!saveSuccess) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            saveSuccess = true;
        }
        
        // --- Auto Export Trigger ---
        if (saveSuccess && settings.autoExportToSheet && settings.googleDriveClientId) {
             // We call export seamlessly, errors handled inside
             await handleExportToSheet(true); 
        }
        
    } catch (err) {
        console.error("PDF Generation failed", err);
        alert("Could not generate PDF.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const initGoogleClient = async (scope: string) => {
     if (!settings.googleDriveClientId) {
         throw new Error("Missing Client ID");
     }
     await Promise.all([
        loadGoogleScript('https://accounts.google.com/gsi/client'),
        loadGoogleScript('https://apis.google.com/js/api.js'),
    ]);
    
    return new Promise<string>((resolve, reject) => {
        // We use a simplified token request here. 
        // In a real app, manage token expiration and prompt=consent logic better.
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: settings.googleDriveClientId,
            scope: scope,
            callback: (response: any) => {
                if (response.error !== undefined) {
                    reject(response);
                }
                resolve(response.access_token);
            },
        });
        // This will prompt the user if they haven't authorized yet or token is expired
        tokenClient.requestAccessToken(); 
    });
  };

  const handleSaveToDrive = async () => {
    if (!settings.googleDriveClientId) {
        alert("Please configure your Google Client ID in the Admin Panel.");
        setView('admin');
        return;
    }

    setIsUploadingToDrive(true);
    try {
        const accessToken = await initGoogleClient('https://www.googleapis.com/auth/drive.file');
        await uploadFileToDrive(accessToken);
    } catch (error) {
        console.error("Drive Auth Error", error);
        alert("Failed to connect to Google Drive.");
    } finally {
        setIsUploadingToDrive(false);
    }
  };

  const uploadFileToDrive = async (accessToken: string) => {
      try {
        const blob = await generatePdfBlob();
        if (!blob) throw new Error("Failed to generate PDF");

        const metadata = {
            name: `Invoice_${invoiceData.invoiceNumber}.pdf`,
            mimeType: 'application/pdf',
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
        });

        const data = await response.json();
        if (data.id) {
            alert("Invoice saved to Google Drive successfully!");
        } else {
            throw new Error("Upload failed");
        }
      } catch (e) {
          console.error(e);
          alert("Error uploading to Drive.");
      }
  };

  const handleExportToSheet = async (isAuto = false) => {
     if (!settings.googleDriveClientId) {
        if (!isAuto) {
            alert("Please configure your Google Client ID in the Admin Panel.");
            setView('admin');
        }
        return;
     }

     setIsExportingToSheet(true);
     try {
        const accessToken = await initGoogleClient('https://www.googleapis.com/auth/spreadsheets');
        
        let spreadsheetId = settings.googleSheetsId;

        // If no sheet ID saved, create one
        if (!spreadsheetId) {
            const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    properties: { title: 'Cake Dudes Invoices' }
                })
            });
            const sheetData = await createResponse.json();
            spreadsheetId = sheetData.spreadsheetId;
            
            // Save this ID for future use
            const newSettings = { ...settings, googleSheetsId: spreadsheetId };
            setSettings(newSettings);
            
            // Add Header Row
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [['Invoice Number', 'Date', 'Customer Name', 'Phone', 'Address', 'Items', 'Total Amount', 'Status']]
                })
            });
        }

        // Prepare Row Data
        const totalAmount = invoiceData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) * (1 + invoiceData.taxRate/100) - invoiceData.discount;
        const itemSummary = invoiceData.items.map(i => `${i.quantity}x ${i.description}`).join(', ');
        
        const rowData = [
            invoiceData.invoiceNumber,
            invoiceData.date,
            invoiceData.customerName,
            invoiceData.customerPhone,
            invoiceData.customerAddress,
            itemSummary,
            totalAmount.toFixed(2),
            invoiceData.status
        ];

        // Append Row
        const appendResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [rowData]
            })
        });

        if (appendResponse.ok) {
            if (!isAuto) alert("Order exported to Google Sheet successfully!");
            else console.log("Auto-exported to Sheet");
        } else {
            throw new Error("Failed to append row");
        }

     } catch (e) {
         console.error(e);
         if (!isAuto) alert("Failed to export to Google Sheet. Check console for details.");
     } finally {
         setIsExportingToSheet(false);
     }
  };

  const handleWhatsAppShare = () => {
    const total = invoiceData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) * (1 + invoiceData.taxRate/100) - invoiceData.discount;
    const itemsList = invoiceData.items.map(i => `- ${i.quantity}x ${i.description}`).join('\n');
    
    const message = `*Invoice #${invoiceData.invoiceNumber}*
Date: ${invoiceData.date}
Customer: ${invoiceData.customerName}

*Items:*
${itemsList}

*Total: $${total.toFixed(2)}*

Thank you for your business!
${settings.companyName}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-100">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
               <div 
                 className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold transition-colors"
                 style={{ backgroundColor: settings.themeColor }}
               >
                 {settings.companyName.charAt(0) || 'C'}
               </div>
               <span className="font-bold text-xl tracking-tight text-gray-800 hidden sm:block">{settings.companyName || 'Invoice Gen'}</span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Tab Switcher */}
              <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setView('invoice')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'invoice' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <FileText size={16} /> Generator
                </button>
                <button
                  onClick={() => setView('admin')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'admin' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <SettingsIcon size={16} /> Admin
                </button>
              </div>

              <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

              <a href="https://github.com/balajiponraj1004/CakeDudesInvoiceGenerator.git" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 hidden sm:block">
                <Github size={20} />
              </a>
              
              {view === 'invoice' && (
                <div className="flex items-center gap-2">
                   <button onClick={handleWhatsAppShare} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Share via WhatsApp">
                      <Share2 size={20} />
                   </button>
                   <button onClick={handlePrint} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block" title="Print">
                      <Printer size={20} />
                   </button>
                   
                   <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                   <button 
                        onClick={() => handleExportToSheet(false)} 
                        disabled={isExportingToSheet}
                        className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        title="Export to Google Sheet"
                      >
                         {isExportingToSheet ? <span className="animate-spin w-4 h-4 border-2 border-green-700/30 border-t-green-700 rounded-full"></span> : <Table size={16} />}
                         <span className="hidden lg:inline">Sheet</span>
                   </button>

                   <button 
                        onClick={handleSaveToDrive} 
                        disabled={isUploadingToDrive || isGeneratingPdf}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        title="Save to Google Drive"
                      >
                         {isUploadingToDrive ? <span className="animate-spin w-4 h-4 border-2 border-blue-700/30 border-t-blue-700 rounded-full"></span> : <Cloud size={16} />}
                         <span className="hidden lg:inline">Drive</span>
                   </button>
                   
                   <button 
                        onClick={handleSaveLocally} 
                        disabled={isGeneratingPdf || isUploadingToDrive}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        {isGeneratingPdf ? 'Saving...' : (
                            <>
                                <Save size={16} />
                                <span className="hidden sm:inline">Save PDF</span>
                            </>
                        )}
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tab Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 print:hidden">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('invoice')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${view === 'invoice' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <FileText size={16} /> Generator
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${view === 'admin' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <SettingsIcon size={16} /> Admin
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {view === 'admin' ? (
          <div className="max-w-4xl mx-auto">
             <AdminPanel 
                settings={settings} 
                onUpdate={setSettings} 
                onClose={() => setView('invoice')} 
             />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Editor */}
            <div className="space-y-6 print:hidden">
              <InvoiceForm 
                data={invoiceData} 
                menuItems={settings.products}
                onChange={setInvoiceData} 
                onOpenAI={() => setIsAiModalOpen(true)}
                isProcessing={isProcessingAi}
              />
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-3">
                  <LayoutDashboard className="shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="font-semibold mb-1">Tip</h4>
                    <p>Go to the <strong>Admin</strong> tab to customize your logo, colors, and menu items. AI will match orders to your menu automatically!</p>
                  </div>
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:sticky lg:top-24 overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 bg-gray-500/5">
              <div className="overflow-x-auto pb-4 lg:pb-0">
                  <div className="min-w-[700px] lg:min-w-0 transform origin-top-left lg:transform-none">
                      <InvoicePreview data={invoiceData} />
                  </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <AIAssistantModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onAnalyze={handleAiAnalyze}
        isProcessing={isProcessingAi}
      />
    </div>
  );
};

export default App;