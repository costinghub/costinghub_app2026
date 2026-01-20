import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Save, FileText, Settings, Box, X, Wrench, Edit2, Play, Layers, Calculator, CheckCircle, Send, Plus, Trash2, MessageSquare, ArrowRight, Gauge, DollarSign, Activity, AlertCircle, Cpu, ExternalLink } from 'lucide-react';
import { MachiningCostSheet, Operation, MachiningMaterial, Tool, Machine, SelectedProcess, MachiningSetup, UserRole, ToolType, MachiningStrategy, CostProfile } from '../types';
import { DataService, AuthService, EnterpriseService } from '../services/supabaseService';
import { suggestProcessPlan } from '../services/geminiService';
import { SaveSuccessModal } from '../components/SaveSuccessModal';

// --- Helper Components ---

interface OperationRowProps {
  op: Operation;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

const OperationRow: React.FC<OperationRowProps> = ({ op, idx, onEdit, onDelete, isReadOnly }) => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all group shadow-sm hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-600">
        {idx + 1}
      </div>
      <div>
        <div className="font-bold text-slate-800 dark:text-white text-base">{op.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
           <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{op.strategy.replace('_', ' ')}</span>
           <span className="flex items-center gap-1"><Play className="w-3 h-3 text-slate-400"/> Cycle: {op.cycleTimeMin.toFixed(2)} min</span>
        </div>
      </div>
    </div>
    {!isReadOnly && (
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )}
  </div>
);

// --- 3-Column Operation Modal ---

interface OpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (op: Operation) => void;
  initialOp?: Operation;
  setupMachine?: Machine; 
  tools: Tool[];
  isReadOnly?: boolean;
}

const OperationModal: React.FC<OpModalProps> = ({ isOpen, onClose, onSave, initialOp, setupMachine, tools, isReadOnly }) => {
  const [op, setOp] = useState<Operation>(initialOp || {
    id: '', name: '', strategy: 'FACE_MILLING', machineId: setupMachine?.id || '', 
    toolParams: {}, drawingParams: {}, setupTimeMin: 15, cycleTimeMin: 0, rejectionRate: 0
  });

  const machineCat = setupMachine?.category || 'MILLING';
  const showMilling = machineCat === 'MILLING' || machineCat === 'HMC' || machineCat === 'VMC';
  const showTurning = machineCat === 'TURNING' || machineCat === 'VTL';
  const showGrinding = machineCat === 'GRINDING';

  const isTurningStrategy = op.strategy.includes('TURNING') || op.strategy === 'PARTING' || op.strategy === 'GROOVING' || op.strategy === 'BORING';
  const isDrillingStrategy = op.strategy.includes('DRILLING') || op.strategy === 'TAPPING' || op.strategy === 'REAMING';

  useEffect(() => {
    if (isOpen && !isReadOnly && op.toolParams?.toolId) {
        const tool = tools.find(t => t.id === op.toolParams.toolId);
        if (!tool) return;
        const diameter = op.toolParams.diameter || tool.diameter || 10;
        const Vc = op.cuttingSpeed || 0; 
        let newRpm = 0;
        if (diameter > 0) newRpm = Math.round((Vc * 1000) / (Math.PI * diameter));
        let newFeed = 0;
        if (op.strategy.includes('MILLING') || op.strategy === 'SURFACE_GRINDING') {
            const z = tool.flutes || tool.numberOfInserts || 2;
            const fz = op.feedPerTooth || 0;
            newFeed = Math.round(newRpm * z * fz);
        } else {
            const fn = op.feedPerRev || 0;
            newFeed = Math.round(newRpm * fn);
        }
        if (newRpm !== op.rpm || newFeed !== op.feedRate) {
            setOp(prev => ({ ...prev, rpm: newRpm, feedRate: newFeed }));
        }
    }
  }, [op.cuttingSpeed, op.feedPerTooth, op.feedPerRev, op.toolParams.toolId, op.strategy, isOpen, isReadOnly]);

  useEffect(() => {
    if (isOpen && !isReadOnly) {
       let cycleTime = 0;
       const params = op.drawingParams;
       const feed = Number(op.feedRate) || 0; 
       if (feed > 0) {
          if (isDrillingStrategy) {
             const depth = Number(params.depthOfCut) || 0;
             cycleTime = depth / feed;
          } else {
             const len = Number(params.lengthOfCut) || 0;
             const passes = Number(params.numberPasses) || 1;
             cycleTime = (len / feed) * passes;
          }
       }
       if (cycleTime > 0) setOp(prev => ({ ...prev, cycleTimeMin: Number((cycleTime * 1.2).toFixed(3)) }));
    }
  }, [op.drawingParams, op.feedRate, op.strategy, isOpen, isReadOnly]);

  const handleToolSelect = (toolId: string) => {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;
      setOp(prev => ({
          ...prev,
          toolParams: { toolId: tool.id, toolName: tool.name, diameter: tool.diameter, flutes: tool.flutes || tool.numberOfInserts },
          cuttingSpeed: tool.defaultCuttingSpeed,
          feedPerTooth: tool.defaultFeedPerTooth,
          feedPerRev: tool.defaultFeedPerRev
      }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 rounded-t-2xl">
           <div>
             <h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings className="w-6 h-6 text-primary-600" /> Operation Setup</h3>
             <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">Machine: <span className="font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-white">{setupMachine?.name || 'Generic Machine'}</span></p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className={`flex-1 overflow-hidden ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
           <div className="grid grid-cols-1 lg:grid-cols-3 h-full divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-slate-700">
              <div className="p-6 space-y-6 overflow-y-auto">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Layers className="w-4 h-4" /> 1. Strategy & Tool</h4>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Strategy</label>
                    <select className="w-full border-2 border-primary-100 dark:border-slate-700 p-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:border-primary-500 transition-all font-medium" value={op.strategy} onChange={e => setOp({...op, strategy: e.target.value as any})}>
                        {(showMilling || !setupMachine) && (
                            <optgroup label="Milling">
                                <option value="FACE_MILLING">Face Milling</option>
                                <option value="POCKET_MILLING">Pocket Milling</option>
                                <option value="PROFILE_MILLING">Profile Milling</option>
                                <option value="SLOT_MILLING">Slotting</option>
                                <option value="CHAMFER_MILLING">Chamfering</option>
                            </optgroup>
                        )}
                        {(showTurning || !setupMachine) && (
                            <optgroup label="Turning">
                                <option value="FACING_TURNING">Facing</option>
                                <option value="OD_TURNING">OD Turning</option>
                                <option value="GROOVING">Grooving</option>
                                <option value="PARTING">Parting Off</option>
                                <option value="THREAD_TURNING">Threading</option>
                                <option value="BORING">Boring</option>
                            </optgroup>
                        )}
                        <optgroup label="Hole Making">
                            <option value="DRILLING">Drilling</option>
                            <option value="TAPPING">Tapping</option>
                            <option value="REAMING">Reaming</option>
                        </optgroup>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Op Name</label>
                    <input className="w-full border p-3 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={op.name} onChange={e => setOp({...op, name: e.target.value})} placeholder="e.g. Roughing Top" />
                 </div>
                 <div className="border-t border-dashed dark:border-slate-700 pt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tool Selection</label>
                    <select className="w-full border p-3 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white mb-2" onChange={(e) => handleToolSelect(e.target.value)} value={op.toolParams.toolId || ''}>
                        <option value="">Select Tool...</option>
                        {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Activity className="w-4 h-4" /> 2. Parameters</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-blue-600 mb-1">Vc (m/min)</label>
                        <input type="number" className="w-full border border-blue-200 dark:border-blue-800 p-2.5 rounded-lg dark:bg-slate-800 dark:text-white font-mono" value={op.cuttingSpeed || ''} onChange={e => setOp({...op, cuttingSpeed: Number(e.target.value)})} />
                    </div>
                    {op.strategy.includes('MILLING') ? (
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">fz (mm/z)</label>
                            <input type="number" step="0.01" className="w-full border p-2.5 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono" value={op.feedPerTooth || ''} onChange={e => setOp({...op, feedPerTooth: Number(e.target.value)})} />
                        </div>
                    ) : (
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">fn (mm/rev)</label>
                            <input type="number" step="0.01" className="w-full border p-2.5 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono" value={op.feedPerRev || ''} onChange={e => setOp({...op, feedPerRev: Number(e.target.value)})} />
                        </div>
                    )}
                 </div>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Box className="w-4 h-4" /> 3. Geometry</h4>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cut Length</label>
                            <input type="number" className="w-full border p-2.5 rounded-lg dark:bg-slate-800 dark:text-white" value={op.drawingParams.lengthOfCut || ''} onChange={e => setOp({...op, drawingParams: {...op.drawingParams, lengthOfCut: Number(e.target.value)}})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Passes</label>
                            <input type="number" className="w-full border p-2.5 rounded-lg dark:bg-slate-800 dark:text-white" value={op.drawingParams.numberPasses || 1} onChange={e => setOp({...op, drawingParams: {...op.drawingParams, numberPasses: Number(e.target.value)}})} />
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-2xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div>
                 <div className="text-xs text-slate-500 font-bold uppercase">Cycle Time</div>
                 <div className="text-3xl font-bold text-slate-800 dark:text-white">{op.cycleTimeMin} <span className="text-sm font-normal">min</span></div>
              </div>
           </div>
           <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold">Cancel</button>
              {!isReadOnly && <button onClick={() => onSave(op)} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg">Save Operation</button>}
           </div>
        </div>
      </div>
    </div>
  );
};

export const Machining: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const user = AuthService.getCurrentUser();
  const [enterprise, setEnterprise] = useState<any>(null);
  const isViewer = user?.role === UserRole.VIEWER;
  const isReadOnly = isViewer;

  const [materials, setMaterials] = useState<MachiningMaterial[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]); 
  const [costProfiles, setCostProfiles] = useState<CostProfile[]>([]);
  
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [editingOpSetupId, setEditingOpSetupId] = useState<string | null>(null);
  const [editingOp, setEditingOp] = useState<Operation | undefined>(undefined);
  const [saveModal, setSaveModal] = useState({ isOpen: false, calcNumber: '', revision: '' });

  const [sheet, setSheet] = useState<MachiningCostSheet>({
    id: `mach-${Date.now()}`,
    calculationNumber: '',
    revision: 'Rev 0',
    partNumber: '',
    partName: '',
    materialId: '',
    rawMaterialWeight: 0,
    finishedWeight: 0,
    materialRate: 5.5,
    scrapRate: 0.5,
    setups: [], 
    secondaryProcesses: [], 
    generalOverheadPercent: 5,
    adminOverheadPercent: 10,
    salesOverheadPercent: 5,
    rejectionPercent: 2,
    profitPercent: 20,
    batchSize: 100,
    status: 'DRAFT',
    updatedAt: new Date()
  });

  useEffect(() => {
    const load = async () => {
      const [mats, tls, macs, procs, profs, ent] = await Promise.all([
        DataService.getMaterials(),
        DataService.getTools(),
        DataService.getMachines(),
        DataService.getProcesses(),
        DataService.getCostProfiles(),
        EnterpriseService.getCurrentEnterprise()
      ]);
      setMaterials(mats); setTools(tls); setMachines(macs); setAllProcesses(procs); setCostProfiles(profs); setEnterprise(ent);

      if (id) {
         const list = await DataService.getMachining();
         const existing = list.find(s => s.id === id);
         if (existing) setSheet(existing);
      }
    };
    load();
  }, [id]);

  const handleAddSetup = () => {
    if (isReadOnly) return;
    const nextSeq = sheet.setups.length + 1;
    setSheet(prev => ({ ...prev, setups: [...prev.setups, {
      id: `setup-${Date.now()}`,
      sequence: nextSeq,
      name: `Setup ${nextSeq}`,
      machineCategory: 'MILLING',
      setupTimeHr: 0.5,
      loadingTimeMin: 0.5,
      unloadingTimeMin: 0.5,
      toolChangeTimeSec: 10,
      efficiencyPercent: 85,
      operations: []
    }] }));
  };

  const handleSaveOp = (op: Operation) => {
    if (!editingOpSetupId || isReadOnly) return;
    setSheet(prev => ({
       ...prev,
       setups: prev.setups.map(s => {
          if (s.id !== editingOpSetupId) return s;
          let newOps = [...s.operations];
          if (op.id) newOps = newOps.map(o => o.id === op.id ? op : o);
          else newOps.push({ ...op, id: `op-${Date.now()}` });
          return { ...s, operations: newOps };
       })
    }));
    setIsOpModalOpen(false);
  };

  const handleSave = async (status: any = 'DRAFT') => {
    if (isViewer) return;
    const finalStatus = status === 'REQUEST_APPROVAL' ? 'PENDING_APPROVAL' : status;
    const saved = await DataService.saveMachining({ ...sheet, status: finalStatus, requestedBy: user?.email, updatedAt: new Date() });
    setSheet(saved);
    setSaveModal({ isOpen: true, calcNumber: saved.calculationNumber, revision: saved.revision || '0' });
  };

  const totals = (() => {
    const materialCost = (sheet.rawMaterialWeight * sheet.materialRate) - ((sheet.rawMaterialWeight - sheet.finishedWeight) * sheet.scrapRate);
    let processingCost = 0;
    const activeProfile = costProfiles.find(p => p.isDefault) || costProfiles[0];
    sheet.setups.forEach(setup => {
       const mhr = (setup.machineId && activeProfile?.machineCosts?.[setup.machineId]) || 65;
       const opsTime = setup.operations.reduce((acc, op) => acc + op.cycleTimeMin, 0);
       const handlingTime = setup.loadingTimeMin + setup.unloadingTimeMin + (setup.toolChangeTimeSec / 60);
       const eff = setup.efficiencyPercent > 0 ? (setup.efficiencyPercent / 100) : 1;
       processingCost += ((setup.setupTimeHr * mhr) / (sheet.batchSize || 1)) + (((opsTime + handlingTime) / eff / 60) * mhr);
    });
    const secondaryCost = sheet.secondaryProcesses.reduce((sum, p) => sum + p.totalCost, 0);
    const mfgCost = materialCost + processingCost + secondaryCost;
    const overheads = mfgCost * ((sheet.generalOverheadPercent + sheet.adminOverheadPercent + sheet.salesOverheadPercent) / 100);
    const rejection = mfgCost * (sheet.rejectionPercent / 100);
    const totalCost = mfgCost + overheads + rejection;
    const profit = totalCost * (sheet.profitPercent / 100);
    return { materialCost, processingCost, secondaryCost, finalPrice: totalCost + profit, profit };
  })();

  return (
    <div className="max-w-[1600px] mx-auto pb-20 px-4">
      <SaveSuccessModal isOpen={saveModal.isOpen} onClose={() => setSaveModal({...saveModal, isOpen: false})} calcNumber={saveModal.calcNumber} revision={saveModal.revision} type="Machining Cost Sheet" />
      {isOpModalOpen && (
        <OperationModal 
           isOpen={isOpModalOpen} 
           onClose={() => setIsOpModalOpen(false)} 
           onSave={handleSaveOp} 
           initialOp={editingOp}
           setupMachine={machines.find(m => m.id === sheet.setups.find(s => s.id === editingOpSetupId)?.machineId)}
           tools={tools}
           isReadOnly={isReadOnly}
        />
      )}
      <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
             <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm sticky top-6">
                <h3 className="font-bold text-sm uppercase text-slate-400 mb-4 flex items-center gap-2"><Box className="w-4 h-4" /> Part Data</h3>
                <div className={`space-y-4 ${isViewer ? 'pointer-events-none' : ''}`}>
                  <Input label="Part Name" value={sheet.partName} onChange={v => setSheet({...sheet, partName: v})} />
                  <Input label="Part Number" value={sheet.partNumber} onChange={v => setSheet({...sheet, partNumber: v})} />
                  <div className="grid grid-cols-2 gap-3">
                     <Input label="Batch Qty" type="number" value={sheet.batchSize} onChange={v => setSheet({...sheet, batchSize: Number(v)})} />
                     <Input label="Mat. Rate" type="number" value={sheet.materialRate} onChange={v => setSheet({...sheet, materialRate: Number(v)})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-gray-200">
                     <Input label="Raw Wt (kg)" type="number" value={sheet.rawMaterialWeight} onChange={v => setSheet({...sheet, rawMaterialWeight: Number(v)})} />
                     <Input label="Fin. Wt (kg)" type="number" value={sheet.finishedWeight} onChange={v => setSheet({...sheet, finishedWeight: Number(v)})} />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Master Links</h4>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => navigate('/machining/materials')} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-primary-50 transition-colors">
                         <Box className="w-3 h-3 text-orange-500" /> Materials
                      </button>
                      <button onClick={() => navigate('/machining/tools')} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-primary-50 transition-colors">
                         <Wrench className="w-3 h-3 text-blue-500" /> Tools
                      </button>
                      <button onClick={() => navigate('/machining/machines')} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-primary-50 transition-colors">
                         <Cpu className="w-3 h-3 text-emerald-500" /> Machines
                      </button>
                      <button onClick={() => navigate('/machining/processes')} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-primary-50 transition-colors">
                         <Layers className="w-3 h-3 text-purple-500" /> Processes
                      </button>
                   </div>
                </div>
             </div>
          </div>
          <div className="col-span-12 lg:col-span-9">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3"><Wrench className="w-8 h-8 text-primary-600" /> Process Plan</h1>
                {!isViewer && <button onClick={handleAddSetup} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 shadow-lg">Add Setup</button>}
             </div>
             <div className="space-y-8">
                {sheet.setups.map((setup, idx) => (
                   <div key={setup.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b flex flex-col gap-4">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">Setup {(idx + 1) * 10}</span>
                                <input disabled={isViewer} className="bg-transparent font-bold text-lg text-slate-700 dark:text-white focus:outline-none border-b border-transparent focus:border-primary-500 w-64" value={setup.name} onChange={e => {
                                    const newSetups = [...sheet.setups]; newSetups[idx].name = e.target.value; setSheet({...sheet, setups: newSetups});
                                }} />
                            </div>
                            <div className="flex items-center gap-3">
                                <select disabled={isViewer} className="bg-white dark:bg-slate-800 border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 max-w-[200px]" value={setup.machineId || ''} onChange={e => {
                                    const newSetups = [...sheet.setups]; newSetups[idx].machineId = e.target.value; setSheet({...sheet, setups: newSetups});
                                }}>
                                    <option value="">Select Machine...</option>
                                    {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                {!isViewer && <button onClick={() => setSheet({...sheet, setups: sheet.setups.filter(s => s.id !== setup.id)})} className="text-slate-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>}
                            </div>
                         </div>
                      </div>
                      <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                         {setup.operations.map((op, oIdx) => (
                            <OperationRow key={op.id} op={op} idx={oIdx} onEdit={() => { setEditingOpSetupId(setup.id); setEditingOp(op); setIsOpModalOpen(true); }} onDelete={() => setSheet({...sheet, setups: sheet.setups.map(s => s.id === setup.id ? { ...s, operations: s.operations.filter(o => o.id !== op.id) } : s)})} isReadOnly={isViewer} />
                         ))}
                         {!isViewer && <button onClick={() => { setEditingOpSetupId(setup.id); setEditingOp(undefined); setIsOpModalOpen(true); }} className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-slate-500 font-bold hover:text-primary-600 transition-all flex items-center justify-center gap-2 mt-4"><Plus className="w-5 h-5" /> Add Operation</button>}
                      </div>
                   </div>
                ))}
             </div>
             <div className="mt-12 bg-slate-900 dark:bg-slate-800 p-8 rounded-3xl text-white flex flex-col md:flex-row gap-8 items-center shadow-2xl">
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-6">
                   <div><div className="text-[10px] font-bold text-slate-500 uppercase">Material</div><div className="text-xl font-bold">${totals.materialCost.toFixed(2)}</div></div>
                   <div><div className="text-[10px] font-bold text-slate-500 uppercase">Processing</div><div className="text-xl font-bold">${totals.processingCost.toFixed(2)}</div></div>
                   <div><div className="text-[10px] font-bold text-slate-500 uppercase">Net Profit</div><div className="text-xl font-bold text-emerald-400">${totals.profit.toFixed(2)}</div></div>
                </div>
                <div className="shrink-0 text-center md:text-right">
                   <div className="text-xs font-bold text-slate-400 uppercase mb-1">Final Price</div>
                   <div className="text-5xl font-black mb-6">${totals.finalPrice.toFixed(2)}</div>
                   {!isViewer && <div className="flex gap-3"><button onClick={() => handleSave('DRAFT')} className="px-6 py-2 bg-slate-800 rounded-xl font-bold text-sm">Save Draft</button><button onClick={() => handleSave('REQUEST_APPROVAL')} className="px-8 py-3 bg-primary-600 rounded-xl font-bold">Request Approval</button></div>}
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>
    <input type={type} className="w-full border rounded-lg px-3 py-2 text-sm font-medium dark:bg-slate-700 dark:text-white" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);
