
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Box, Flame, RefreshCw, Layers, Lock, Grip, Layout, ArrowRight } from 'lucide-react';
import { DataService, AuthService } from '../services/mockSupabase';
import { CastingCostSheet, CastingGrade, MouldingBox, MeltingFurnace, CastingCore, SelectedProcess, FettlingProcess, FoundryConsumables } from '../types';
import { SaveSuccessModal } from '../components/SaveSuccessModal';

export const CastingCalculator: React.FC = () => {
  // Masters
  const [grades, setGrades] = useState<CastingGrade[]>([]);
  const [boxes, setBoxes] = useState<MouldingBox[]>([]);
  const [furnaces, setFurnaces] = useState<MeltingFurnace[]>([]);
  const [fettlingOptions, setFettlingOptions] = useState<FettlingProcess[]>([]);
  const [consumables, setConsumables] = useState<FoundryConsumables | null>(null);
  
  const [saveModal, setSaveModal] = useState({ isOpen: false, calcNumber: '', revision: '' });

  // Access Control
  const canUseCoreMgmt = AuthService.hasFeatureAccess('CASTING', 'CORE_MGMT');

  // Sheet State
  const [sheet, setSheet] = useState<CastingCostSheet>({
    id: `cast-${Date.now()}`,
    calcNumber: '',
    revision: 'Rev 0',
    partName: '',
    customer: '',
    gradeId: '',
    
    // Dims
    partLength: 0,
    partWidth: 0,
    partHeight: 0,
    safetyMargin: 25, // mm

    netWeight: 0,
    grossWeight: 0,
    yieldPercent: 65, // Default Yield

    returnCreditRate: 0.35, 
    furnaceId: '',
    energyRate: 0.12, 
    mouldingBoxId: '',
    cavities: 1,
    
    sandCost: 0.05, 
    binderCost: 0.50,
    
    cores: [],
    
    // Now using detailed processes instead of flat rates
    fettlingProcesses: [], 
    
    // Legacy fields kept for compatibility but not used in new logic if processes exist
    rejectionPercent: 5,
    overheadPercent: 15,
    profitPercent: 10,
    updatedAt: new Date()
  });

  // Fix: Await async service calls in useEffect
  useEffect(() => {
    const loadData = async () => {
      // Fixed: Added missing methods for Casting to DataService in mockSupabase.ts
      setGrades(await DataService.getCastingGrades());
      setBoxes(await DataService.getMouldingBoxes());
      setFurnaces(await DataService.getMeltingFurnaces());
      setFettlingOptions(await DataService.getFettlingProcesses());
      
      const cons = await DataService.getFoundryConsumables();
      setConsumables(cons);
      
      // Initialize sheet rates from global masters if new
      if (sheet.calcNumber === '') {
          setSheet(prev => ({
              ...prev,
              sandCost: cons.sandCostPerKg,
              binderCost: cons.binderCostPerKg,
              energyRate: cons.energyCostPerKwh,
              // Removed non-existent property fettlingLaborRate
          }));
      }
    };
    loadData();
  }, []);

  // Update Gross Weight when Net Weight or Yield changes
  useEffect(() => {
    if (sheet.yieldPercent > 0) {
        setSheet(prev => ({...prev, grossWeight: Number((prev.netWeight / (prev.yieldPercent / 100)).toFixed(2))}));
    }
  }, [sheet.netWeight, sheet.yieldPercent]);

  // Auto-Calculate Cavities based on dimensions
  useEffect(() => {
    const box = boxes.find(b => b.id === sheet.mouldingBoxId);
    if (box && sheet.partLength > 0 && sheet.partWidth > 0) {
        const gap = sheet.safetyMargin || 25;
        // Simple Rectangular Packing
        const effL = sheet.partLength + gap;
        const effW = sheet.partWidth + gap;
        
        // Check orientation 1
        const cols1 = Math.floor(box.length / effL);
        const rows1 = Math.floor(box.width / effW);
        const total1 = Math.max(1, cols1 * rows1);

        // Check orientation 2 (Rotated)
        const cols2 = Math.floor(box.length / effW);
        const rows2 = Math.floor(box.width / effL);
        const total2 = Math.max(1, cols2 * rows2);

        // Choose best orientation
        setSheet(prev => ({...prev, cavities: Math.max(total1, total2)}));
    }
  }, [sheet.mouldingBoxId, sheet.partLength, sheet.partWidth, sheet.safetyMargin, boxes]);

  // --- Calculations ---

  const calculate = () => {
    const grade = grades.find(g => g.id === sheet.gradeId);
    const box = boxes.find(b => b.id === sheet.mouldingBoxId);
    const furnace = furnaces.find(f => f.id === sheet.furnaceId);

    // 1. Metal Cost (Zero Based)
    const baseMetalRate = grade ? grade.baseRate : 0;
    const meltingLoss = furnace ? (furnace.meltingLossPercent / 100) * sheet.grossWeight : 0;
    const inputMetalWeight = sheet.grossWeight + meltingLoss; // To get Gross out, we need to put in Gross + Loss
    
    const chargeMixCost = inputMetalWeight * baseMetalRate; // Cost of total input metal
    const energyCost = furnace ? inputMetalWeight * furnace.energyPerKg * sheet.energyRate : 0;
    const consumablesCost = furnace ? inputMetalWeight * furnace.consumableRate : 0;
    
    const returnsWeight = Math.max(0, sheet.grossWeight - sheet.netWeight); // Gates, risers, etc.
    const returnsCredit = returnsWeight * sheet.returnCreditRate;

    const totalMetalCost = chargeMixCost + energyCost + consumablesCost - returnsCredit;

    // 2. Moulding Cost
    let mouldingCostPerPart = 0;
    if (box && sheet.cavities > 0) {
      // Sand Cost Calculation (Sand + Binder)
      const sandCostTotal = box.sandWeight * (sheet.sandCost + sheet.binderCost);
      const processCost = (1 / box.productionRate) * (box.machineRate + box.manpowerRate);
      const totalMouldCost = sandCostTotal + processCost;
      mouldingCostPerPart = totalMouldCost / sheet.cavities;
    }

    // 3. Core Cost
    let totalCoreCost = 0;
    sheet.cores.forEach(core => {
      const sandVal = core.weight * (sheet.sandCost + sheet.binderCost); // Simplified core sand cost
      const processVal = (1 / core.productionRate) * core.machineRate;
      totalCoreCost += (sandVal + processVal);
    });

    // 4. Finishing (Detailed Process Logic)
    let finishingCost = 0;
    if (sheet.fettlingProcesses && sheet.fettlingProcesses.length > 0) {
       finishingCost = sheet.fettlingProcesses.reduce((acc, p) => acc + p.totalCost, 0);
    } else {
       // Legacy Fallback (keeping for reference, but should use fettlingProcesses)
       finishingCost = 0;
    }

    // 5. Total & Markups
    const subTotal = totalMetalCost + mouldingCostPerPart + totalCoreCost + finishingCost;
    const costAfterRejection = subTotal / (1 - (sheet.rejectionPercent / 100)); // Standard formula: Cost / Yield_Good
    const rejectionCost = costAfterRejection - subTotal;

    const overheads = costAfterRejection * (sheet.overheadPercent / 100);
    const profit = (costAfterRejection + overheads) * (sheet.profitPercent / 100);
    const finalPrice = costAfterRejection + overheads + profit;

    return {
      chargeMixCost,
      meltingConversion: energyCost + consumablesCost,
      returnsCredit,
      totalMetalCost,
      mouldingCostPerPart,
      totalCoreCost,
      finishingCost,
      rejectionCost,
      overheads,
      profit,
      finalPrice,
      meltingLossWeight: meltingLoss
    };
  };

  const results = calculate();

  const handleCoreAdd = () => {
    if (!canUseCoreMgmt) return;
    const newCore: CastingCore = {
      id: Date.now().toString(),
      name: 'Main Core',
      weight: 0.5,
      sandCost: (sheet.sandCost + sheet.binderCost), // Pre-fill
      productionRate: 20,
      machineRate: 10
    };
    setSheet(prev => ({ ...prev, cores: [...prev.cores, newCore] }));
  };

  const handleAddFettling = () => {
    const newProc: SelectedProcess = {
        id: `fp-${Date.now()}`,
        processId: '',
        name: '',
        category: 'FETTLING',
        unit: 'KG',
        rate: 0,
        quantity: sheet.netWeight,
        totalCost: 0
    };
    setSheet(prev => ({ ...prev, fettlingProcesses: [...(prev.fettlingProcesses || []), newProc] }));
  };

  const updateFettling = (id: string, field: keyof SelectedProcess, val: any) => {
    setSheet(prev => {
        const updated = prev.fettlingProcesses.map(p => {
            if (p.id !== id) return p;
            
            const newData = { ...p, [field]: val };
            
            // Auto-fill from master
            if (field === 'processId') {
                const master = fettlingOptions.find(m => m.id === val);
                if (master) {
                    newData.name = master.name;
                    newData.unit = master.unit;
                    // Calculate Rate per Unit based on hourly rate and capacity
                    const costPerUnit = master.hourlyRate / master.capacityPerHr;
                    newData.rate = Number(costPerUnit.toFixed(4));
                    
                    if (master.unit === 'KG') newData.quantity = prev.netWeight;
                    else newData.quantity = 1; 
                }
            }
            
            newData.totalCost = (newData.rate || 0) * (newData.quantity || 0);
            return newData;
        });
        return { ...prev, fettlingProcesses: updated };
    });
  };

  const updateCore = (id: string, field: keyof CastingCore, val: any) => {
    setSheet(prev => ({
      ...prev,
      cores: prev.cores.map(c => c.id === id ? { ...c, [field]: val } : c)
    }));
  };

  const removeCore = (id: string) => {
    setSheet(prev => ({ ...prev, cores: prev.cores.filter(c => c.id !== id) }));
  };

  const removeFettling = (id: string) => {
    setSheet(prev => ({ ...prev, fettlingProcesses: prev.fettlingProcesses.filter(p => p.id !== id) }));
  };

  const saveSheet = async () => {
    const saved = await DataService.saveCasting(sheet);
    setSheet(saved);
    setSaveModal({ isOpen: true, calcNumber: saved.calcNumber, revision: saved.revision || 'Rev 0' });
  };

  const currentBox = boxes.find(b => b.id === sheet.mouldingBoxId);

  // --- Schematic Visual ---
  const renderSchematic = () => {
    if (!currentBox || sheet.partLength <= 0) return null;
    const scale = 200 / Math.max(currentBox.length, currentBox.width);
    const boxW = currentBox.length * scale;
    const boxH = currentBox.width * scale;
    const partW = sheet.partLength * scale;
    const partH = sheet.partWidth * scale;
    
    const cavities = [];
    for(let i=0; i<sheet.cavities; i++) {
        cavities.push(<div key={i} style={{width: partW, height: partH}} className="bg-primary-500 border border-white opacity-80 rounded-sm flex items-center justify-center text-[8px] text-white font-bold">{i+1}</div>);
    }

    return (
        <div className="flex flex-col items-center">
            <div 
                style={{width: boxW, height: boxH}} 
                className="border-4 border-slate-700 bg-slate-200 dark:bg-slate-700 dark:border-slate-500 relative flex flex-wrap gap-1 content-start p-1 justify-center items-center"
            >
                {cavities}
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">
                Box: {currentBox.length}x{currentBox.width} <br/>
                Part: {sheet.partLength}x{sheet.partWidth}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <SaveSuccessModal 
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({...saveModal, isOpen: false})}
        calcNumber={saveModal.calcNumber}
        revision={saveModal.revision}
        type="Casting Cost Sheet"
      />

      {/* Main Input Area */}
      <div className="flex-1 space-y-6 overflow-y-auto pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Green Sand Casting Costing</h1>
            <p className="text-slate-500">Zero-Based Cost Estimation for Foundry</p>
          </div>
        </div>

        {/* 1. Part & Yield */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-primary-600" /> Part & Yield
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Input label="Part Name" val={sheet.partName} onChange={v => setSheet(s => ({...s, partName: v}))} type="text" />
            <Input label="Net Weight (kg)" val={sheet.netWeight} onChange={v => setSheet(s => ({...s, netWeight: Number(v)}))} type="number" />
            
            <div>
               <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Target Yield %</label>
               <div className="flex items-center">
                  <input type="number" value={sheet.yieldPercent} onChange={e => setSheet(s => ({...s, yieldPercent: Number(e.target.value)}))} className="w-full px-2 py-1.5 border rounded-l dark:bg-slate-700 dark:border-slate-600 text-sm focus:ring-2 focus:ring-primary-500" />
                  <div className="bg-gray-100 dark:bg-slate-600 px-3 py-1.5 border-y border-r rounded-r text-sm text-slate-500 dark:text-slate-300">%</div>
               </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
               <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Gross Weight</div>
               <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{sheet.grossWeight} kg</div>
            </div>
          </div>
        </div>

        {/* 2. Mold Planning & Cavities */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600" /> Mold Planning & Cavities
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Select Moulding Box</label>
                    <select className="w-full border rounded p-2 dark:bg-slate-700 dark:border-slate-600" value={sheet.mouldingBoxId} onChange={e => setSheet(s => ({...s, mouldingBoxId: e.target.value}))}>
                        <option value="">Select Box Size...</option>
                        {boxes.map(b => <option key={b.id} value={b.id}>{b.name} ({b.length}x{b.width}x{b.height})</option>)}
                    </select>
                </div>
                <Input label="Safety Margin (mm)" val={sheet.safetyMargin} onChange={v => setSheet(s => ({...s, safetyMargin: Number(v)}))} type="number" />
                
                <div className="col-span-3 border-t border-dashed dark:border-slate-700 my-2"></div>
                
                <Input label="Part Length (mm)" val={sheet.partLength} onChange={v => setSheet(s => ({...s, partLength: Number(v)}))} type="number" />
                <Input label="Part Width (mm)" val={sheet.partWidth} onChange={v => setSheet(s => ({...s, partWidth: Number(v)}))} type="number" />
                <Input label="Part Height (mm)" val={sheet.partHeight} onChange={v => setSheet(s => ({...s, partHeight: Number(v)}))} type="number" />
                
                <div className="col-span-3 mt-2 flex items-center gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <Grip className="w-6 h-6 text-indigo-500" />
                    <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-300 font-bold uppercase">Optimized Cavities</div>
                        <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{sheet.cavities} <span className="text-sm font-normal">per mould</span></div>
                    </div>
                </div>
             </div>
             
             {/* Schematic */}
             <div className="lg:col-span-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                {sheet.mouldingBoxId && sheet.partLength > 0 ? renderSchematic() : (
                    <div className="text-center text-xs text-slate-400">Select Box & Enter Dims<br/>to see layout</div>
                )}
             </div>
          </div>
        </div>

        {/* 3. Melting & Metal */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" /> Metal & Melting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Grade</label>
               <select className="w-full border rounded p-2 dark:bg-slate-700 dark:border-slate-600" value={sheet.gradeId} onChange={e => setSheet(s => ({...s, gradeId: e.target.value}))}>
                 <option value="">Select Grade...</option>
                 {grades.map(g => <option key={g.id} value={g.id}>{g.name} (${g.baseRate}/kg)</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Furnace</label>
               <select className="w-full border rounded p-2 dark:bg-slate-700 dark:border-slate-600" value={sheet.furnaceId} onChange={e => setSheet(s => ({...s, furnaceId: e.target.value}))}>
                 <option value="">Select Furnace...</option>
                 {furnaces.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
             </div>
             <Input label="Energy Rate ($/kWh)" val={sheet.energyRate} onChange={v => setSheet(s => ({...s, energyRate: Number(v)}))} type="number" />
             <Input label="Return Credit ($/kg)" val={sheet.returnCreditRate} onChange={v => setSheet(s => ({...s, returnCreditRate: Number(v)}))} type="number" />
          </div>
        </div>

        {/* 4. Core Making */}
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden ${!canUseCoreMgmt ? 'opacity-75' : ''}`}>
           {!canUseCoreMgmt && (
             <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 max-w-xs">
                 <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                 <p className="font-bold text-slate-800 dark:text-white text-sm">Core Management Restricted</p>
                 <p className="text-xs text-slate-500 mt-1">Foundry cores with specific weights and rates are available on Enterprise plans.</p>
               </div>
             </div>
           )}
           <div className="flex justify-between mb-4">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-yellow-600" /> Core Making
             </h3>
             <button onClick={handleCoreAdd} disabled={!canUseCoreMgmt} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-primary-200 disabled:opacity-50">
               <Plus className="w-3 h-3" /> Add Core
             </button>
           </div>
           
           <div className="space-y-3">
             {sheet.cores.map((core, idx) => (
               <div key={core.id} className="grid grid-cols-6 gap-2 items-center bg-gray-50 dark:bg-slate-900 p-3 rounded">
                 <div className="col-span-1"><input className="w-full bg-transparent border-none text-sm font-medium" value={core.name} onChange={e => updateCore(core.id, 'name', e.target.value)} /></div>
                 <div><Input label="Wt(kg)" val={core.weight} onChange={v => updateCore(core.id, 'weight', Number(v))} type="number" /></div>
                 <div><Input label="Matl Cost($)" val={core.sandCost} onChange={v => updateCore(core.id, 'sandCost', Number(v))} type="number" /></div>
                 <div><Input label="Cores/hr" val={core.productionRate} onChange={v => updateCore(core.id, 'productionRate', Number(v))} type="number" /></div>
                 <div><Input label="Mach Rate($)" val={core.machineRate} onChange={v => updateCore(core.id, 'machineRate', Number(v))} type="number" /></div>
                 <div className="text-right"><button onClick={() => removeCore(core.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
               </div>
             ))}
             {sheet.cores.length === 0 && <div className="text-center text-slate-400 text-sm py-2">No cores added.</div>}
           </div>
        </div>

        {/* 5. Finishing (Fettling) - Upgraded */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
           <div className="flex justify-between mb-4">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-600" /> Fettling & Post-Processing
             </h3>
             <button onClick={handleAddFettling} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-200">
               <Plus className="w-3 h-3" /> Add Process
             </button>
           </div>
           
           <div className="space-y-3">
             <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <div className="col-span-4">Operation</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2">Cost/Unit</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
             </div>
             {(sheet.fettlingProcesses || []).map((proc, idx) => (
               <div key={proc.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-slate-900 p-2 rounded">
                 <div className="col-span-4">
                    <select 
                      className="w-full bg-transparent text-sm border-none focus:ring-0 dark:text-white"
                      value={proc.processId}
                      onChange={e => updateFettling(proc.id, 'processId', e.target.value)}
                    >
                       <option value="">Select Process...</option>
                       {fettlingOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                 </div>
                 <div className="col-span-2 text-xs text-slate-500 uppercase">{proc.unit}</div>
                 <div className="col-span-2"><input type="number" className="w-full bg-transparent border-b text-sm" value={proc.rate} onChange={e => updateFettling(proc.id, 'rate', Number(e.target.value))} /></div>
                 <div className="col-span-2"><input type="number" className="w-full bg-transparent border-b text-sm" value={proc.quantity} onChange={e => updateFettling(proc.id, 'quantity', Number(e.target.value))} /></div>
                 <div className="col-span-2 flex justify-end items-center gap-2">
                    <span className="font-bold text-sm">${proc.totalCost.toFixed(2)}</span>
                    <button onClick={() => removeFettling(proc.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                 </div>
               </div>
             ))}
             {(!sheet.fettlingProcesses || sheet.fettlingProcesses.length === 0) && (
                <div className="text-center text-slate-400 text-sm py-2">No finishing processes added.</div>
             )}
           </div>
        </div>
      </div>

      {/* Sticky Summary Sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="sticky top-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Cost Summary</h2>
           
           <div className="space-y-3 mb-6">
             <SummaryRow label="Metal" val={results.totalMetalCost} />
             <SummaryRow label="Moulding" val={results.mouldingCostPerPart} />
             <SummaryRow label="Cores" val={results.totalCoreCost} />
             <SummaryRow label="Finishing" val={results.finishingCost} />
             <div className="border-t border-dashed my-2"></div>
             <SummaryRow label="Rejection Cost" val={results.rejectionCost} color="text-red-500" />
             <SummaryRow label="Overheads" val={results.overheads} />
             <SummaryRow label="Profit" val={results.profit} color="text-green-600" />
           </div>

           <div className="bg-slate-900 text-white p-4 rounded-lg text-center mb-4">
             <div className="text-xs text-slate-400 uppercase">Total Cost Per Casting</div>
             <div className="text-3xl font-bold">${results.finalPrice.toFixed(2)}</div>
           </div>

           <button onClick={saveSheet} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 neon-hover">
             <Save className="w-5 h-5" /> Save Sheet
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
