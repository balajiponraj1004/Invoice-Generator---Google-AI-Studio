import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AdminPanel } from './components/AdminPanel';
import { InvoiceData, DEFAULT_INVOICE, AppSettings, DEFAULT_SETTINGS } from './types';
import { parseOrderWithGemini } from './services/geminiService';
import { Printer, Download, Github, Settings as SettingsIcon, LayoutDashboard, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<'invoice' | 'admin'>('invoice');
  
  // Load settings from local storage or default
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('invoice-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    ...DEFAULT_INVOICE,
    // Initialize with current settings
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail,
    logo: settings.logo,
    themeColor: settings.themeColor,
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- Effects ---

  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('invoice-settings', JSON.stringify(settings));
  }, [settings]);

  // Sync Global Settings to Current Invoice (Live Update)
  useEffect(() => {
    setInvoiceData(prev => ({
      ...prev,
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyEmail: settings.companyEmail,
      logo: settings.logo,
      themeColor: settings.themeColor,
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

  const handleDownloadPdf = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    setIsGeneratingPdf(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render

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
        pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
    } catch (err) {
        console.error("PDF Generation failed", err);
        alert("Could not generate PDF.");
    } finally {
        setIsGeneratingPdf(false);
    }
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
               <span className="font-bold text-xl tracking-tight text-gray-800">{settings.companyName || 'Invoice Gen'}</span>
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

              <a href="https://github.com/balajiponraj1004/CakeDudesInvoiceGenerator.git" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900">
                <Github size={20} />
              </a>
              
              {view === 'invoice' && (
                <>
                  <button onClick={handlePrint} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                    <Printer size={20} />
                  </button>
                  <button 
                    onClick={handleDownloadPdf} 
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    {isGeneratingPdf ? 'Saving...' : (
                        <>
                            <Download size={16} />
                            <span className="hidden sm:inline">PDF</span>
                        </>
                    )}
                  </button>
                </>
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