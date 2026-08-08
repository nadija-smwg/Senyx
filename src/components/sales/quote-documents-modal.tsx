'use client';

import { useState } from 'react';
import { DocumentList } from '@/components/shared/document-list';
import { FileText, X } from 'lucide-react';

export function QuoteDocumentsModal({ quoteId }: { quoteId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
        title="View Attachments"
      >
        <FileText className="w-3 h-3" /> Attachments
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 text-card-foreground w-full max-w-4xl rounded-xl shadow-xl border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Quote Attachments
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <DocumentList 
            ownerType="quote" 
            ownerId={quoteId} 
            title="Quote Documents & PDFs" 
            description="Upload quote PDFs or supplementary documentation." 
          />
        </div>
      </div>
    </div>
  );
}
