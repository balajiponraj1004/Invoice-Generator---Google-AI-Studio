import React, { useState, useRef } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { AIAssistantModal } from './components/AIAssistantModal';
import { InvoiceData, DEFAULT_INVOICE } from './types';
import { parseOrderWithGemini } from './services/geminiService';
import { Printer, Download, Github } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(DEFAULT_INVOICE);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleAiAnalyze = async (text: string) => {
    setIsProcessingAi(true);
    try {
      const parsedData = await parseOrderWithGemini(text);
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
        // Wait for images to load if any (though we use SVGs mostly)
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
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
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">C</div>
               <span className="font-bold text-xl tracking-tight text-gray-800">Cake Dudes <span className="text-gray-400 font-normal text-sm">Invoice Gen</span></span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/balajiponraj1004/CakeDudesInvoiceGenerator.git" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900">
                <Github size={20} />
              </a>
              <div className="h-6 w-px bg-gray-200"></div>
              <button onClick={handlePrint} className="p-2 text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Print">
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
                        Download PDF
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Editor */}
          <div className="space-y-6 print:hidden">
             <InvoiceForm 
               data={invoiceData} 
               onChange={setInvoiceData} 
               onOpenAI={() => setIsAiModalOpen(true)}
               isProcessing={isProcessingAi}
             />
             
             <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <h4 className="font-semibold mb-1">Tip</h4>
                <p>Try the <strong>AI Autofill</strong> button to paste a messy order from WhatsApp or Email. The AI will format it for you!</p>
             </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-24 overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/5 bg-gray-500/5">
             {/* Wrapper to scale down the preview on smaller screens if needed */}
             <div className="overflow-x-auto pb-4 lg:pb-0">
                <div className="min-w-[700px] lg:min-w-0 transform origin-top-left lg:transform-none">
                    <InvoicePreview data={invoiceData} />
                </div>
             </div>
          </div>

        </div>
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