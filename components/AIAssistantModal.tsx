import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (text: string) => void;
  isProcessing: boolean;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, onAnalyze, isProcessing }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 transition-all">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="animate-pulse" />
            <h3 className="text-lg font-bold">AI Order Parser</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            Paste a customer order message (Email, WhatsApp, DM) below. Our AI will automatically extract the customer details and cake specifications for the invoice.
          </p>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Hi! I need a 2kg Chocolate Truffle cake for Sarah's birthday on Oct 25th. Please deliver to 123 Maple St. Contact: 555-0123."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none mb-4 text-sm"
          />

          {!process.env.API_KEY && (
             <div className="mb-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-xs">
                <AlertCircle size={16} />
                <span>API Key missing. AI features will not work.</span>
             </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onAnalyze(text)}
              disabled={!text.trim() || isProcessing || !process.env.API_KEY}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                'Auto-Fill Invoice'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};