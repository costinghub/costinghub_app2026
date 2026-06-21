
import React, { useState } from 'react';
import type { QuoteModalProps } from '../types';
import { Button } from './ui/Button';
import { ResultsDisplay } from './ResultsDisplay';

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value);
  } catch (e) {
    return `$${value.toFixed(2)}`;
  }
};

const DEFAULT_TERMS = "This quote is valid for 30 days.\nPayment terms: Net 30 upon receipt of invoice.\nDelivery: FOB Shipping Point, freight costs to be borne by the customer.\nAll work is performed to industry-standard tolerances unless otherwise specified on the drawing.";

export const QuoteModal: React.FC<QuoteModalProps> = ({ calculation, user, onClose, materials }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [billTo, setBillTo] = useState(calculation.inputs.customerName || '');
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [isExporting, setIsExporting] = useState(false);

  if (!calculation.results) return null;

  const { inputs, results } = calculation;
  const currency = inputs.currency || 'USD';

  const materialObj = materials?.find(m => m.id === inputs.materialType);
  const materialGradeLabel = materialObj ? materialObj.name : inputs.materialType;

  const handlePrint = () => {
    window.print();
  };
  
  const handleExportPDF = () => {
    if (!window.html2pdf) {
        alert("PDF export is currently unavailable.");
        return;
    }
    
    setIsExporting(true);
    
    // Wait for the UI layout to update for PDF exporting (changing textareas to divs and applying styles)
    setTimeout(() => {
        const element = document.getElementById('quote-document-body');
        
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     `Quote_${inputs.calculationNumber}.pdf`,
            image:        { type: 'jpeg', quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false);
        }).catch((err: any) => {
            console.error("PDF Export error:", err);
            setIsExporting(false);
        });
    }, 150);
  };
  
  const userAddressComponents = [
      user.address_line1,
      user.city,
      user.state ? `${user.state} ${user.postal_code || ''}` : user.postal_code,
      user.country
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in pb-16 md:pb-4">
      {isExporting && (
        <style>{`
          #quote-document-body {
            background-color: white !important;
            color: #111827 !important;
          }
          #quote-document-body * {
            color: #111827 !important;
          }
          #quote-document-body .text-text-primary {
            color: #111827 !important;
          }
          #quote-document-body .text-text-secondary,
          #quote-document-body .printable-text-secondary,
          #quote-document-body .text-slate-500,
          #quote-document-body .text-slate-600,
          #quote-document-body .text-slate-400,
          #quote-document-body .text-gray-500,
          #quote-document-body .text-gray-600,
          #quote-document-body .text-gray-400,
          #quote-document-body th,
          #quote-document-body td {
            color: #111827 !important;
          }
          #quote-document-body .text-text-muted {
            color: #111827 !important;
          }
          #quote-document-body .text-primary {
            color: #6d28d9 !important;
          }
          #quote-document-body .text-green-600,
          #quote-document-body .text-green-400 {
            color: #047857 !important;
          }
          #quote-document-body .bg-green-600 {
            background-color: #047857 !important;
          }
          #quote-document-body .bg-green-600 * {
            color: white !important;
          }
          #quote-document-body .bg-background\\/50 {
            background-color: #f3f4f6 !important;
          }
          #quote-document-body .bg-surface {
            background-color: white !important;
          }
          #quote-document-body .bg-primary\\/5 {
            background-color: #f3f4f6 !important;
          }
          #quote-document-body .border,
          #quote-document-body .border-border,
          #quote-document-body .border-border\\/50,
          #quote-document-body .border-border\\/60,
          #quote-document-body .divide-border\\/40,
          #quote-document-body .divide-border\\/50 {
            border-color: #d1d5db !important;
          }
          #quote-document-body .divide-y > * + * {
            border-color: #d1d5db !important;
          }
          .page-break-before {
            page-break-before: always !important;
          }
        `}</style>
      )}
      
      <div id="quote-modal-content" className="bg-surface printable-bg-surface w-full max-w-4xl h-full md:h-[90vh] flex flex-col rounded-lg shadow-2xl border border-border printable-border overflow-hidden">
        {/* Header and Actions */}
        <div className="flex justify-between items-center p-4 border-b border-border printable-border no-print bg-surface z-10 shrink-0">
            <h2 className="text-xl font-bold text-primary">Quote Generator</h2>
            <div className="flex items-center space-x-2 md:space-x-4">
                <Button variant="secondary" size="sm" onClick={handlePrint} disabled={isExporting} className="hidden md:flex">
                    Print Quote
                </Button>
                <Button onClick={handleExportPDF} size="sm" disabled={isExporting} className="flex items-center space-x-2">
                    {isExporting ? (
                       <span>Exporting...</span>
                    ) : (
                       <>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         <span>Export PDF</span>
                       </>
                    )}
                </Button>
                <button onClick={onClose} className="text-text-muted hover:text-text-primary ml-2 p-1 rounded-md hover:bg-background/20" disabled={isExporting}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Quote Body */}
        <div id="quote-document-body" className={`p-6 md:p-8 printable-text-primary ${isExporting ? 'bg-white text-black h-max overflow-visible relative' : 'flex-1 overflow-y-auto'}`}>
            {/* Quote Header */}
            <div className="flex justify-between items-start mb-8 border-b border-border printable-border pb-6">
                {/* User / Vendor Information (Left) */}
                <div className="flex flex-col space-y-1">
                    {user.company_logo_url && (
                        <div className="h-16 w-auto mb-2">
                            <img src={user.company_logo_url} alt="Company Logo" className="max-h-full object-contain" />
                        </div>
                    )}
                    <h1 className="text-xl font-bold printable-text-primary uppercase tracking-wide">{user.companyName || (user as any).company_name || user.name}</h1>
                    
                    {/* User Address Block */}
                    <div className="text-sm text-text-secondary printable-text-secondary leading-snug">
                        {userAddressComponents.map((line, idx) => (
                            <p key={idx}>{line}</p>
                        ))}
                    </div>
                    {/* Account Email */}
                    <p className="text-xs text-text-secondary printable-text-secondary mt-1">{user.email}</p>
                    {user.phone && <p className="text-xs text-text-secondary printable-text-secondary">{user.phone_country_code} {user.phone}</p>}
                </div>

                {/* Branding & Document Type (Right) */}
                <div className="text-right">
                    <div className="flex flex-col items-end mb-4">
                        <h2 className="text-2xl font-bold text-primary">CostingHub</h2>
                        <p className="text-xs text-text-muted printable-text-secondary italic">All Costs. One Hub.</p>
                    </div>
                    <h2 className="text-4xl font-bold text-text-primary printable-text-primary tracking-tight">QUOTE</h2>
                </div>
            </div>

            {/* Quote Meta Data */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                 <div className="w-full md:w-1/2">
                    <h3 className="text-xs font-bold text-text-secondary printable-text-secondary uppercase tracking-wider mb-1">Bill To</h3>
                    {isExporting ? (
                      <div className="text-text-primary printable-text-primary whitespace-pre-wrap leading-relaxed min-h-[96px]">{billTo}</div>
                    ) : (
                      <>
                        <textarea
                            className="w-full p-2 bg-background/50 border border-border rounded-md text-text-primary printable-text-primary no-print resize-none"
                            value={billTo}
                            onChange={(e) => setBillTo(e.target.value)}
                            rows={4}
                            placeholder="Client Name&#10;Client Address&#10;City, State, Zip"
                        />
                        <div className="hidden print:block text-text-primary printable-text-primary whitespace-pre-wrap leading-relaxed">{billTo}</div>
                      </>
                    )}
                </div>
                
                <div className="w-full md:w-1/3 text-left md:text-right space-y-1">
                    <div className="flex justify-between">
                        <span className="font-semibold text-text-secondary printable-text-secondary">Quote #:</span>
                        <span className="font-bold text-text-primary printable-text-primary">{inputs.calculationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-text-secondary printable-text-secondary">Date:</span>
                        <span className="text-text-primary printable-text-primary">{new Date(inputs.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-text-secondary printable-text-secondary">Prepared By:</span>
                        <span className="text-text-primary printable-text-primary">{user.name || user.email}</span>
                    </div>
                </div>
            </div>

            {/* Product Image */}
            {inputs.partImage && (
                <div className="mb-8 flex justify-center">
                    <div className="border border-border printable-border p-2 rounded-lg bg-surface printable-bg-surface overflow-hidden flex items-center justify-center max-w-[200px] max-h-[150px]">
                        <img src={inputs.partImage} alt="Part" className="w-full h-full object-contain" />
                    </div>
                </div>
            )}

            {/* Order Details */}
            <div className="border border-border printable-border rounded-lg mb-6 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-background/50 printable-bg-surface border-b border-border printable-border font-bold text-sm text-text-primary">Order Overview</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Product Info */}
                <div className="p-4 border-b md:border-b-0 md:border-r border-border printable-border">
                    <h4 className="text-xs font-bold text-text-secondary printable-text-secondary uppercase tracking-wider mb-2">Part Details</h4>
                    <div className="space-y-1 text-sm text-text-primary printable-text-primary">
                      <p><span className="font-semibold text-text-secondary printable-text-secondary">Name:</span> {inputs.partName}</p>
                      <p><span className="font-semibold text-text-secondary printable-text-secondary">Number:</span> {inputs.partNumber}</p>
                      <p><span className="font-semibold text-text-secondary printable-text-secondary">Material Grade:</span> {inputs.materialCategory} {materialGradeLabel ? `/ ${materialGradeLabel}` : ''}</p>
                      <p><span className="font-semibold text-text-secondary printable-text-secondary">Process:</span> {inputs.rawMaterialProcess}</p>
                    </div>
                </div>
                {/* Financial Info */}
                <div className="p-4">
                  <h4 className="text-xs font-bold text-text-secondary printable-text-secondary uppercase tracking-wider mb-2">Pricing</h4>
                    <div className="space-y-1 text-sm text-text-primary printable-text-primary">
                      <div className="flex justify-between">
                        <span className="font-semibold text-text-secondary printable-text-secondary">Unit Price:</span>
                        <span>{formatCurrency(results.costPerPart, currency)}</span>
                      </div>
                    </div>
                </div>
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div className="mt-12 border-t border-border printable-border pt-6 break-inside-avoid">
                <h3 className="text-sm font-bold text-text-secondary printable-text-secondary uppercase tracking-wider mb-2">Terms & Conditions</h3>
                {isExporting ? (
                    <div className="text-xs text-text-secondary printable-text-secondary whitespace-pre-wrap leading-relaxed">{terms}</div>
                ) : (
                    <>
                        <textarea
                            className="w-full p-2 bg-background/50 border border-border rounded-md text-sm text-text-secondary printable-text-primary no-print resize-y"
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            rows={4}
                        />
                        <div className="hidden print:block text-xs text-text-secondary printable-text-secondary whitespace-pre-wrap leading-relaxed">{terms}</div>
                    </>
                )}
            </div>

            {/* Breakdown Toggle */}
            <div className="mt-8 pt-4 border-t border-border printable-border page-break-before">
                 {!isExporting && (
                   <div className="flex items-center no-print mb-4">
                      <input 
                          id="show-breakdown" 
                          type="checkbox" 
                          checked={showBreakdown} 
                          onChange={(e) => setShowBreakdown(e.target.checked)}
                          className="h-4 w-4 text-primary bg-surface border-border rounded focus:ring-primary cursor-pointer" 
                      />
                      <label htmlFor="show-breakdown" className="ml-2 text-sm text-text-secondary printable-text-secondary cursor-pointer font-medium">Include Detailed Cost Breakdown</label>
                   </div>
                 )}
                 {showBreakdown && (
                    <div className="animate-fade-in print:block results-breakdown-container">
                        <h3 className="text-lg font-bold text-primary mb-4">Internal Cost Breakdown</h3>
                        <ResultsDisplay results={results} currency={currency} markups={inputs.markups} batchVolume={inputs.batchVolume} isPdfMode={true} />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-text-muted printable-text-secondary border-t border-border printable-border pt-4 -mb-4">
                <p>Thank you for your business! Prices are in {currency}.</p>
                <p className="mt-1 italic">Generated by CostingHub</p>
            </div>
        </div>
      </div>
    </div>
  );
};
