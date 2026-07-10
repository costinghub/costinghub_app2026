
import React, { useState, useEffect } from 'react';
import type { ResultsPageProps } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { QuoteModal } from '../components/QuoteModal';
import { Printer, FileText, Loader2 } from 'lucide-react';

export const ResultsPage: React.FC<ResultsPageProps> = ({ calculation, onBack, user, materials }) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P to Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!window.html2pdf) {
      alert("PDF export is currently unavailable.");
      return;
    }

    setIsPdfExporting(true);

    setTimeout(() => {
      const element = document.getElementById('results-statement-pdf-content');
      if (!element) {
        setIsPdfExporting(false);
        return;
      }

      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Calculation_Report_${calculation?.inputs.partNumber || 'Job'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsPdfExporting(false);
      }).catch((err: any) => {
        console.error("PDF Export error:", err);
        setIsPdfExporting(false);
      });
    }, 150);
  };

  if (!calculation || !calculation.results) {
    return (
       <div className="w-full max-w-4xl mx-auto animate-fade-in">
         <div className="mb-6">
            <Button variant="secondary" onClick={onBack}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Calculations
            </Button>
         </div>
         <Card className="text-center">
           <h1 className="text-2xl font-bold text-primary mb-4">No Results Available</h1>
           <p className="text-text-secondary mb-6">
            {
              !calculation
                ? "The selected calculation could not be loaded."
                : "This is a draft calculation and does not have any results yet. Please edit the calculation and finalize it to see the results."
            }
           </p>
         </Card>
      </div>
    );
  }
  
  const currency = calculation.inputs.currency || 'USD';

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in relative">
        <div className="mb-6 flex justify-between items-center no-print flex-wrap gap-4">
            <Button variant="secondary" onClick={onBack} className="shadow-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </Button>

            <div className="flex items-center gap-2">
                <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="shadow-xs border border-border bg-surface text-text-primary hover:bg-background/80"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                </Button>

                <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    disabled={isPdfExporting}
                    className="shadow-xs border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                >
                    {isPdfExporting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Exporting PDF...
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4 mr-2" />
                            Export PDF
                        </>
                    )}
                </Button>

                <Button onClick={() => setIsQuoteModalOpen(true)} className="shadow-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Quote
                </Button>
            </div>
        </div>
        
        <div id="results-statement-pdf-content" className="space-y-4">
            <div className="mb-4 bg-surface shadow rounded-lg p-4 flex justify-between items-center border border-border results-header">
                 <div>
                    <h1 className="text-3xl font-bold text-primary">Results Statement</h1>
                    <p className="text-text-secondary">Part: {calculation.inputs.partName} | No: {calculation.inputs.partNumber}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(calculation.results.costPerPart)}</p>
                    <p className="text-text-secondary uppercase text-[10px] font-black tracking-widest leading-none">Net Unit Cost</p>
                 </div>
            </div>
            
            <Card>
                <ResultsDisplay 
                  results={calculation.results} 
                  currency={currency} 
                  markups={calculation.inputs.markups}
                  batchVolume={calculation.inputs.batchVolume}
                  isPdfMode={isPdfExporting}
                />
            </Card>
        </div>

        {isQuoteModalOpen && (
            <QuoteModal
                calculation={calculation}
                user={user}
                onClose={() => setIsQuoteModalOpen(false)}
                materials={materials}
            />
        )}
    </div>
  );
};