
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, FileSpreadsheet, ArrowLeft, Settings, Type, Image as ImageIcon, Layout, X } from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { MachiningCostSheet } from '../types';

interface ReportConfig {
  title: string;
  preparedBy: string;
  approvedBy: string;
  notes: string;
  disclaimer: string;
  showMaterial: boolean;
  showOps: boolean;
  showSummary: boolean;
  showCommercials: boolean; 
  logoUrl: string;
  companyName: string;
}

const DEFAULT_CONFIG: ReportConfig = {
  title: 'Cost Estimation Report',
  preparedBy: 'CostingHub',
  approvedBy: '',
  notes: 'This estimate is based on standard cycle time calculations and generic MHR rates. Material prices are subject to market fluctuation.',
  disclaimer: 'Confidential Document. Do not distribute without permission.',
  showMaterial: true,
  showOps: true,
  showSummary: true,
  showCommercials: true,
  logoUrl: '',
  companyName: 'CostingHub Enterprise'
};

export const MachiningReports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const [sheet, setSheet] = useState<MachiningCostSheet | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadSheet = async () => {
      setLoading(true);
      if (id) {
        try {
          const all = await DataService.getMachining();
          const found = all.find(s => s.id === id);
          if (found) setSheet(found);
        } catch (err) {
          console.error("Error loading report:", err);
        }
      }
      setLoading(false);
    };
    loadSheet();
  }, [id]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500">Generating Report Preview...</div>;
  if (!sheet) return <div className="p-8 text-center text-red-500">Report not found. <button onClick={() => navigate('/machining')} className="underline">Go Back</button></div>;

  const materialCost = (sheet.rawMaterialWeight * sheet.materialRate) - ((sheet.rawMaterialWeight - sheet.finishedWeight) * sheet.scrapRate);
  const GENERIC_MHR = 65.00; 

  let totalProcessingCost = 0;
  
  const setupCosts = (sheet.setups || []).map(setup => {
      const setupCostPerPart = (setup.setupTimeHr * GENERIC_MHR) / sheet.batchSize;
      
      const opsTime = setup.operations.reduce((acc, op) => acc + op.cycleTimeMin, 0);
      const handlingTime = setup.loadingTimeMin + setup.unloadingTimeMin + (setup.toolChangeTimeSec / 60);
      const totalCycleTime = (opsTime + handlingTime) / (setup.efficiencyPercent / 100);
      const runCostPerPart = (totalCycleTime / 60) * GENERIC_MHR;
      
      const setupTotal = setupCostPerPart + runCostPerPart;
      totalProcessingCost += setupTotal;

      return {
          id: setup.id,
          name: setup.name,
          setupCostPerPart,
          runCostPerPart,
          totalCycleTime,
          setupTotal
      };
  });

  const secondaryCost = (sheet.secondaryProcesses || []).reduce((sum, p) => sum + p.totalCost, 0);
  const overheads = (materialCost + totalProcessingCost + secondaryCost) * (sheet.adminOverheadPercent / 100);
  const totalMfgCost = materialCost + totalProcessingCost + secondaryCost + overheads;
  const profit = totalMfgCost * (sheet.profitPercent / 100);
  const unitCost = totalMfgCost + profit;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900">
      
      {/* Sidebar Settings */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 border-l border-gray-200 dark:border-slate-700 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Settings className="w-4 h-4" /> Report Settings
            </h3>
            <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
         </div>
         <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
            <div className="space-y-3">
               <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><Layout className="w-3 h-3" /> Sections</h4>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={config.showMaterial} onChange={e => setConfig({...config, showMaterial: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm dark:text-slate-300">Material Cost</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={config.showOps} onChange={e => setConfig({...config, showOps: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm dark:text-slate-300">Operations Detail</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={config.showSummary} onChange={e => setConfig({...config, showSummary: e.target.checked})} className="rounded text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm dark:text-slate-300">Cost Summary</span>
               </label>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><Type className="w-3 h-3" /> Text Content</h4>
               <div>
                  <label className="block text-xs text-slate-500 mb-1">Report Title</label>
                  <input className="w-full border rounded p-2 text-sm dark:bg-slate-700 dark:border-slate-600" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs text-slate-500 mb-1">Company Name</label>
                  <input className="w-full border rounded p-2 text-sm dark:bg-slate-700 dark:border-slate-600" value={config.companyName} onChange={e => setConfig({...config, companyName: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs text-slate-500 mb-1">Prepared By</label>
                  <input className="w-full border rounded p-2 text-sm dark:bg-slate-700 dark:border-slate-600" value={config.preparedBy} onChange={e => setConfig({...config, preparedBy: e.target.value})} />
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
         <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 print:hidden shrink-0">
            <button onClick={() => navigate('/machining')} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <div className="flex gap-3">
               <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold transition-all">
                  <Settings className="w-4 h-4" /> Customize
               </button>
               <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-lg transition-all">
                  <Printer className="w-4 h-4" /> Print PDF
               </button>
            </div>
         </div>

         {/* Report Preview */}
         <div className="flex-1 overflow-y-auto p-4 md:p-12 print:p-0 bg-gray-50 dark:bg-slate-900 print:bg-white">
            <div className="max-w-[850px] mx-auto bg-white p-12 shadow-2xl min-h-[1100px] border border-gray-200 print:shadow-none print:border-none print:p-8">
               
               <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                  <div>
                    {config.logoUrl ? <img src={config.logoUrl} className="h-16 mb-4" alt="Logo" /> : <div className="text-3xl font-black mb-1">{config.companyName}</div>}
                    <div className="text-sm text-slate-500">Precision Manufacturing Estimations</div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-bold uppercase tracking-tighter text-slate-900">{config.title}</h1>
                    <div className="text-sm mt-2">
                       <p className="font-bold"># {sheet.calculationNumber}</p>
                       <p className="text-slate-500">{new Date(sheet.updatedAt).toLocaleDateString()}</p>
                       <p className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block">{sheet.revision}</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-12 mb-12">
                  <div>
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Project Details</h3>
                     <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100">
                           <tr><td className="py-1.5 text-slate-500">Part Name</td><td className="py-1.5 font-bold">{sheet.partName}</td></tr>
                           <tr><td className="py-1.5 text-slate-500">Part Number</td><td className="py-1.5 font-bold">{sheet.partNumber}</td></tr>
                           <tr><td className="py-1.5 text-slate-500">Batch Quantity</td><td className="py-1.5 font-bold">{sheet.batchSize} units</td></tr>
                           <tr><td className="py-1.5 text-slate-500">Material</td><td className="py-1.5 font-bold">{sheet.materialId}</td></tr>
                        </tbody>
                     </table>
                  </div>
                  <div>
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prepared For</h3>
                     <div className="text-sm">
                        <p className="font-bold text-lg">{sheet.customerId || 'Standard Customer'}</p>
                        <p className="text-slate-500 mt-2 italic text-xs">Validity: 30 Days from date of report.</p>
                     </div>
                  </div>
               </div>

               {config.showMaterial && (
                  <div className="mb-10">
                     <h3 className="text-sm font-bold bg-slate-900 text-white px-3 py-1 mb-4">1. Raw Material Calculation</h3>
                     <table className="w-full text-sm">
                        <thead className="border-b-2 border-slate-200">
                           <tr className="text-left font-bold text-slate-400 text-[10px] uppercase">
                              <th className="py-2">Parameter</th>
                              <th className="py-2">Value</th>
                              <th className="py-2 text-right">Calculation Result</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           <tr><td className="py-2">Raw Material Weight</td><td className="py-2">{sheet.rawMaterialWeight} kg</td><td className="py-2 text-right">--</td></tr>
                           <tr><td className="py-2">Finished Weight</td><td className="py-2">{sheet.finishedWeight} kg</td><td className="py-2 text-right">Scrap: {(sheet.rawMaterialWeight - sheet.finishedWeight).toFixed(2)} kg</td></tr>
                           <tr><td className="py-2">Material Rate</td><td className="py-2">${sheet.materialRate}/kg</td><td className="py-2 text-right font-bold">${materialCost.toFixed(2)}</td></tr>
                        </tbody>
                     </table>
                  </div>
               )}

               <div className="mb-10 page-break">
                  <h3 className="text-sm font-bold bg-slate-900 text-white px-3 py-1 mb-4">2. Processing & Operations</h3>
                  <table className="w-full text-xs">
                     <thead className="border-b-2 border-slate-200">
                        <tr className="text-left font-bold text-slate-400 uppercase">
                           <th className="py-2">Setup / Op</th>
                           <th className="py-2">Strategy</th>
                           <th className="py-2 text-right">Cycle Time</th>
                           <th className="py-2 text-right">Allocated Cost</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {sheet.setups.map((setup, sIdx) => (
                           <React.Fragment key={setup.id}>
                              <tr className="bg-slate-50 font-bold">
                                 <td className="py-3 px-2">Setup {sIdx + 1} - {setup.name}</td>
                                 <td className="py-3">--</td>
                                 <td className="py-3 text-right">--</td>
                                 <td className="py-3 text-right">${setupCosts[sIdx].setupTotal.toFixed(2)}</td>
                              </tr>
                              {setup.operations.map(op => (
                                 <tr key={op.id}>
                                    <td className="py-2 pl-6">{op.name}</td>
                                    <td className="py-2 text-slate-500 italic">{op.strategy}</td>
                                    <td className="py-2 text-right">{op.cycleTimeMin} min</td>
                                    <td className="py-2 text-right text-slate-400">incl. in setup</td>
                                 </tr>
                              ))}
                           </React.Fragment>
                        ))}
                     </tbody>
                     <tfoot className="border-t-2 border-slate-900">
                        <tr className="font-bold">
                           <td colSpan={3} className="py-4">Total Processing Cost (Unit)</td>
                           <td className="py-4 text-right">${totalProcessingCost.toFixed(2)}</td>
                        </tr>
                     </tfoot>
                  </table>
               </div>

               <div className="mt-12 pt-12 border-t-2 border-slate-100">
                  <div className="flex justify-end">
                     <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Material Cost</span>
                           <span className="font-bold">${materialCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Processing Cost</span>
                           <span className="font-bold">${totalProcessingCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-500">Overheads</span>
                           <span className="font-bold">${overheads.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-black">
                           <span>UNIT COST</span>
                           <span className="text-primary-700">${unitCost.toFixed(2)}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-20 grid grid-cols-2 gap-20">
                  <div className="border-t border-slate-900 pt-4">
                     <div className="text-xs font-bold uppercase text-slate-400">Prepared By</div>
                     <div className="mt-2 font-bold">{config.preparedBy}</div>
                  </div>
                  <div className="border-t border-slate-900 pt-4">
                     <div className="text-xs font-bold uppercase text-slate-400">Reviewer / Approver</div>
                     <div className="mt-2 h-8"></div>
                  </div>
               </div>

               <div className="mt-20 text-[10px] text-slate-400 text-center leading-relaxed">
                  {config.notes}
                  <div className="mt-4 font-bold">{config.disclaimer}</div>
               </div>

            </div>
         </div>
      </div>
    </div>
  );
};
