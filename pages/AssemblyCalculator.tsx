
import React, { useState } from 'react';
import { Save, Plus, Trash2, Box, Users, Truck, Package, Layers, Lock } from 'lucide-react';
import { DataService, AuthService } from '../services/mockSupabase';
import { AssemblyCostSheet, AssemblyBOMItem, AssemblyLaborOp } from '../types';
import { SaveSuccessModal } from '../components/SaveSuccessModal';

export const AssemblyCalculator: React.FC = () => {
  const [saveModal, setSaveModal] = useState({ isOpen: false, calcNumber: '', revision: '' });
  
  // Access Control
  const canUseBOM = AuthService.hasFeatureAccess('ASSEMBLY', 'BOM_MGMT');
  const canUseLabor = AuthService.hasFeatureAccess('ASSEMBLY', 'LABOR_MASTERS');

  const [sheet, setSheet] = useState<AssemblyCostSheet>({
    id: `asm-${Date.now()}`,
    calcNumber: '',
    revision: 'Rev 0',
    assemblyName: '',
    assemblyNumber: '',
    customer: '',
    batchSize: 1,
    bom: [],
    labor: [],
    packagingCost: 0,
    logisticsCost: 0,
    overheadPercent: 15,
    profitPercent: 10,
    updatedAt: new Date()
  });

  // --- Actions ---

  const addBOMItem = () => {
    if (!canUseBOM) return;
    const newItem: AssemblyBOMItem = {
      id: `bom-${Date.now()}`,
      itemNumber: '',
      description: '',
      type: 'BOUGHT_OUT',
      qty: 1,
      unitCost: 0
    };
    setSheet(prev => ({ ...prev, bom: [...prev.bom, newItem] }));
  };

  const removeBOMItem = (id: string) => {
    setSheet(prev => ({ ...prev, bom: prev.bom.filter(item => item.id !== id) }));
  };

  const updateBOMItem = (id: string, field: keyof AssemblyBOMItem, value: any) => {
    setSheet(prev => ({
      ...prev,
      bom: prev.bom.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addLaborOp = () => {
    if (!canUseLabor) return;
    const newOp: AssemblyLaborOp = {
      id: `op-${Date.now()}`,
      operationName: '',
      skillLevel: 'SKILLED',
      hours: 1,
      hourlyRate: 20
    };
    setSheet(prev => ({ ...prev, labor: [...prev.labor, newOp] }));
  };

  const removeLaborOp = (id: string) => {
    setSheet(prev => ({ ...prev, labor: prev.labor.filter(item => item.id !== id) }));
  };

  const updateLaborOp = (id: string, field: keyof AssemblyLaborOp, value: any) => {
    setSheet(prev => ({
      ...prev,
      labor: prev.labor.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // --- Calculations ---

  const calculate = () => {
    const totalMaterial = sheet.bom.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);
    const totalLabor = sheet.labor.reduce((sum, item) => sum + (item.hours * item.hourlyRate), 0);
    
    const primeCost = totalMaterial + totalLabor + sheet.packagingCost + sheet.logisticsCost;
    const overheads = primeCost * (sheet.overheadPercent / 100);
    const totalCost = primeCost + overheads;
    const profit = totalCost * (sheet.profitPercent / 100);
    const sellingPrice = totalCost + profit;

    return { totalMaterial, totalLabor, overheads, profit, sellingPrice };
  };

  const totals = calculate();

  // Fix: Await async service calls in handleSave
  const handleSave = async () => {
    const saved = await DataService.saveAssembly(sheet);
    setSheet(saved);
    setSaveModal({ isOpen: true, calcNumber: saved.calcNumber, revision: saved.revision || 'Rev 0' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <SaveSuccessModal 
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({...saveModal, isOpen: false})}
        calcNumber={saveModal.calcNumber}
        revision={saveModal.revision}
        type="Assembly Cost Sheet"
      />

      {/* Left Column: Inputs */}
      <div className="flex-1 space-y-6 overflow-y-auto pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assembly Cost Calculator</h1>
            <p className="text-slate-500">BOM aggregation and labor integration.</p>
          </div>
        </div>

        {/* 1. Header Info */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" /> Assembly Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Input label="Assembly Name" val={sheet.assemblyName} onChange={v => setSheet(s => ({...s, assemblyName: v}))} type="text" />
             <Input label="Assembly Number" val={sheet.assemblyNumber} onChange={v => setSheet(s => ({...s, assemblyNumber: v}))} type="text" />
             <Input label="Batch Size" val={sheet.batchSize} onChange={v => setSheet(s => ({...s, batchSize: Number(v)}))} type="number" />
          </div>
        </div>

        {/* 2. Bill of Materials - Plan Restriction */}
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden ${!canUseBOM ? 'opacity-75' : ''}`}>
           {!canUseBOM && (
             <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 max-w-xs">
                 <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                 <p className="font-bold text-slate-800 dark:text-white text-sm">BOM Management Restricted</p>
                 <p className="text-xs text-slate-500 mt-1">Detailed Bill of Materials management is available on Enterprise plans.</p>
               </div>
             </div>
           )}
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-500" /> Bill of Materials (BOM)
              </h3>
              <button onClick={addBOMItem} disabled={!canUseBOM} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-primary-200 disabled:opacity-50">
                <Plus className="w-3 h-3" /> Add Item
              </button>
           </div>
           
           <div className="space-y-2">
             <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase px-2">
               <div className="col-span-3">Item / Part No</div>
               <div className="col-span-3">Description</div>
               <div className="col-span-2">Type</div>
               <div className="col-span-1 text-center">Qty</div>
               <div className="col-span-2 text-center">Unit Cost</div>
               <div className="col-span-1"></div>
             </div>
             {sheet.bom.length === 0 && <div className="text-center text-slate-400 py-4 text-sm">No items in BOM.</div>}
             {sheet.bom.map(item => (
               <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-slate-900 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="col-span-3"><input className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" placeholder="Part No" value={item.itemNumber} onChange={e => updateBOMItem(item.id, 'itemNumber', e.target.value)} /></div>
                  <div className="col-span-3"><input className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" placeholder="Desc" value={item.description} onChange={e => updateBOMItem(item.id, 'description', e.target.value)} /></div>
                  <div className="col-span-2">
                    <select className="w-full bg-transparent text-xs" value={item.type} onChange={e => updateBOMItem(item.id, 'type', e.target.value)}>
                      <option value="BOUGHT_OUT">Bought Out</option>
                      <option value="MANUFACTURED">Manufactured</option>
                      <option value="HARDWARE">Hardware</option>
                    </select>
                  </div>
                  <div className="col-span-1"><input type="number" className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" value={item.qty} onChange={e => updateBOMItem(item.id, 'qty', Number(e.target.value))} /></div>
                  <div className="col-span-2"><input type="number" className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" value={item.unitCost} onChange={e => updateBOMItem(item.id, 'unitCost', Number(e.target.value))} /></div>
                  <div className="col-span-1 text-right"><button onClick={() => removeBOMItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>
               </div>
             ))}
           </div>
        </div>

        {/* 3. Labor Operations - Plan Restriction */}
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden ${!canUseLabor ? 'opacity-75' : ''}`}>
           {!canUseLabor && (
             <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 max-w-xs">
                 <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                 <p className="font-bold text-slate-800 dark:text-white text-sm">Labor Masters Restricted</p>
                 <p className="text-xs text-slate-500 mt-1">Detailed labor planning and rate integration is available on Enterprise plans.</p>
               </div>
             </div>
           )}
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Labor Operations
              </h3>
              <button onClick={addLaborOp} disabled={!canUseLabor} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-primary-200 disabled:opacity-50">
                <Plus className="w-3 h-3" /> Add Operation
              </button>
           </div>

           <div className="space-y-2">
             <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase px-2">
               <div className="col-span-5">Operation</div>
               <div className="col-span-2">Skill</div>
               <div className="col-span-2 text-center">Hours</div>
               <div className="col-span-2 text-center">Rate ($/hr)</div>
               <div className="col-span-1"></div>
             </div>
             {sheet.labor.map(op => (
                <div key={op.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-slate-900 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="col-span-5"><input className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" placeholder="Op Name" value={op.operationName} onChange={e => updateLaborOp(op.id, 'operationName', e.target.value)} /></div>
                  <div className="col-span-2">
                    <select className="w-full bg-transparent text-xs" value={op.skillLevel} onChange={e => updateLaborOp(op.id, 'skillLevel', e.target.value)}>
                      <option value="UNSKILLED">Unskilled</option>
                      <option value="SKILLED">Skilled</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>
                  <div className="col-span-2"><input type="number" className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" value={op.hours} onChange={e => updateLaborOp(op.id, 'hours', Number(e.target.value))} /></div>
                  <div className="col-span-2"><input type="number" className="w-full text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 text-sm" value={op.hourlyRate} onChange={e => updateLaborOp(op.id, 'hourlyRate', Number(e.target.value))} /></div>
                  <div className="col-span-1 text-right"><button onClick={() => removeLaborOp(op.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>
               </div>
             ))}
           </div>
        </div>
        
        {/* 4. Overheads & Logistics */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" /> Overheads & Packaging
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Input label="Packaging Cost ($)" val={sheet.packagingCost} onChange={v => setSheet(s => ({...s, packagingCost: Number(v)}))} type="number" />
             <Input label="Logistics ($)" val={sheet.logisticsCost} onChange={v => setSheet(s => ({...s, logisticsCost: Number(v)}))} type="number" />
             <Input label="Overhead %" val={sheet.overheadPercent} onChange={v => setSheet(s => ({...s, overheadPercent: Number(v)}))} type="number" />
             <Input label="Profit %" val={sheet.profitPercent} onChange={v => setSheet(s => ({...s, profitPercent: Number(v)}))} type="number" />
          </div>
        </div>

      </div>

      {/* Right Column: Sticky Summary */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="sticky top-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Cost Summary</h2>
           
           <div className="space-y-3 mb-6">
             <SummaryRow label="Total Material" val={totals.totalMaterial} />
             <SummaryRow label="Total Labor" val={totals.totalLabor} />
             <SummaryRow label="Pack & Logistics" val={sheet.packagingCost + sheet.logisticsCost} />
             <div className="border-t border-dashed my-2"></div>
             <SummaryRow label="Overheads" val={totals.overheads} />
             <SummaryRow label="Profit" val={totals.profit} color="text-green-600" />
           </div>

           <div className="bg-slate-900 text-white p-4 rounded-lg text-center mb-4">
             <div className="text-xs text-slate-400 uppercase">Total Unit Cost</div>
             <div className="text-3xl font-bold">${totals.sellingPrice.toFixed(2)}</div>
           </div>

           <button onClick={handleSave} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 neon-hover">
             <Save className="w-5 h-5" /> Save Calculation
           </button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, type, val, onChange }: any) => (
  <div>
    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</label>
    <input 
      type={type} 
      value={val} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 border rounded dark:bg-slate-700 dark:border-slate-600 text-sm focus:ring-2 focus:ring-primary-500"
    />
  </div>
);

const SummaryRow = ({ label, val, color }: any) => (
  <div className="flex justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium ${color || 'text-slate-800 dark:text-white'}`}>${val.toFixed(2)}</span>
  </div>
);
