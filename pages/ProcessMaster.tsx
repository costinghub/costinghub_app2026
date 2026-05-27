
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Flame, Layers, Search, Wrench, ShieldCheck, Truck, Save, X, Hammer, FileText, Activity, Calculator, Info } from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { Process, MachiningStrategy } from '../types';

// --- Detail View Modal ---
const ProcessDetailsModal: React.FC<{ process: Process; onClose: () => void }> = ({ process, onClose }) => {
  if (!process) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-start">
          <div>
             <div className="flex items-center gap-2 mb-1">
               <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                 {process.category.replace('_', ' ')}
               </span>
               {process.strategy && (
                 <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                   {process.strategy}
                 </span>
               )}
             </div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white">{process.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           
           {/* Rate Card */}
           <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Standard Rate</span>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  ${process.defaultRate.toFixed(2)}
                  <span className="text-sm font-normal text-emerald-600 dark:text-emerald-400 ml-1">/ {process.unit}</span>
                </div>
              </div>
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-200">
                <DollarIcon className="w-6 h-6" />
              </div>
           </div>

           {/* Formula Box */}
           <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" /> Cost Calculation Logic
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-700 dark:text-slate-300 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-10">
                   <FileText className="w-16 h-16" />
                 </div>
                 <div className="mb-3">
                   <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Formula</span>
                   <div className="font-semibold text-blue-700 dark:text-blue-400">
                     {process.calculationFormula || 'Standard Rate * Quantity'}
                   </div>
                 </div>
                 <div>
                   <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Required Parameters</span>
                   <div className="flex flex-wrap gap-2">
                      {process.requiredParameters ? (
                        process.requiredParameters.split(',').map((param, i) => (
                          <span key={i} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-xs">
                            {param.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">None specified</span>
                      )}
                   </div>
                 </div>
              </div>
           </div>

           {/* Description */}
           {process.description && (
             <div className="space-y-1">
               <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 <Info className="w-4 h-4 text-slate-400" /> Description
               </h4>
               <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded border border-gray-100 dark:border-slate-700">
                 {process.description}
               </p>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 text-right">
           <button onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

// Icon Helper
const DollarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export const ProcessMaster: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingProcess, setViewingProcess] = useState<Process | null>(null);
  const [activeTab, setActiveTab] = useState<'METAL' | 'SURFACE'>('METAL');
  const [current, setCurrent] = useState<Partial<Process>>({});
  const [search, setSearch] = useState('');

  // Added missing await in useEffect
  useEffect(() => {
    const load = async () => {
      setProcesses(await DataService.getProcesses());
    };
    load();
  }, []);

  // Fixed handleSave to be async and await DataService calls
  const handleSave = async () => {
    if (!current.name || !current.category) return;
    const toSave = { 
      ...current, 
      id: current.id || `proc-${Date.now()}`,
      defaultRate: Number(current.defaultRate) || 0
    } as Process;
    await DataService.saveProcess(toSave);
    setProcesses(await DataService.getProcesses());
    setIsEditing(false);
    setCurrent({});
  };

  // Fixed handleDelete to be async and await deleteProcess method
  const handleDelete = async (id: string) => {
    if(confirm('Delete this process?')) {
      await DataService.deleteProcess(id);
      setProcesses(await DataService.getProcesses());
    }
  };

  // Filter Logic
  const filtered = processes.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  
  const metalRemovalProcesses = filtered.filter(p => ['MACHINING', 'WELDING'].includes(p.category));
  const surfaceTreatmentProcesses = filtered.filter(p => !['MACHINING', 'WELDING'].includes(p.category));

  const getIcon = (cat: string) => {
    if (cat === 'HEAT_TREATMENT') return <Flame className="w-4 h-4 text-orange-500" />;
    if (cat === 'SURFACE_FINISH') return <Layers className="w-4 h-4 text-purple-500" />;
    if (cat === 'QUALITY') return <ShieldCheck className="w-4 h-4 text-green-500" />;
    if (cat === 'LOGISTICS') return <Truck className="w-4 h-4 text-blue-500" />;
    if (cat === 'MACHINING') return <Hammer className="w-4 h-4 text-slate-600" />;
    return <Wrench className="w-4 h-4 text-slate-500" />;
  };

  const handleAddMetal = () => {
    setCurrent({ category: 'MACHINING', unit: 'HR' });
    setIsEditing(true);
  };

  const handleAddTreatment = () => {
    setCurrent({ category: 'HEAT_TREATMENT', unit: 'KG' });
    setIsEditing(true);
  };

  const TableSection = ({ title, items, onAdd, icon: Icon }: any) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
           <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200">{title}</h3>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">{items.length}</span>
           </div>
           <button 
             onClick={onAdd}
             className="text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
           >
             <Plus className="w-3 h-3" /> Add Process
           </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 w-[25%]">Process Operation</th>
              <th className="px-6 py-3 w-[20%]">Strategy / Category</th>
              <th className="px-6 py-3 w-[25%]">Parameters & Formula</th>
              <th className="px-6 py-3 w-[15%] text-right">Standard Rate</th>
              <th className="px-6 py-3 w-[15%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {items.map((p: Process) => (
              <tr 
                key={p.id} 
                onClick={() => setViewingProcess(p)}
                className="hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4 align-top">
                  <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {p.name}
                    <Info className="w-3 h-3 text-slate-300 group-hover:text-blue-400" />
                  </div>
                  {p.description && <div className="text-xs text-slate-500 mt-1">{p.description}</div>}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1 items-start">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {getIcon(p.category)}
                      {p.category.replace('_', ' ')}
                    </span>
                    {p.strategy && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-mono">
                        {p.strategy}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                   <div className="space-y-1.5">
                      {p.requiredParameters && (
                        <div className="flex items-start gap-1.5 text-xs">
                           <Activity className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                           <span className="text-slate-600 dark:text-slate-300">
                             <span className="font-semibold text-slate-500 dark:text-slate-400">Inputs:</span> {p.requiredParameters}
                           </span>
                        </div>
                      )}
                      {p.calculationFormula && (
                        <div className="flex items-start gap-1.5 text-xs">
                           <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                           <span className="text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                             {p.calculationFormula}
                           </span>
                        </div>
                      )}
                      {!p.requiredParameters && !p.calculationFormula && <span className="text-xs text-slate-400 italic">Click to add details</span>}
                   </div>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <div className="font-bold text-slate-800 dark:text-white">${p.defaultRate.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">per {p.unit}</div>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <div onClick={(e) => e.stopPropagation()} className="flex justify-end gap-1">
                    <button 
                      onClick={() => { setCurrent(p); setIsEditing(true); }} 
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">No processes defined in this section.</td></tr>
            )}
          </tbody>
        </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Details Modal */}
      {viewingProcess && (
        <ProcessDetailsModal 
          process={viewingProcess} 
          onClose={() => setViewingProcess(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="w-8 h-8 text-primary-600" /> Process Master
          </h1>
          <p className="text-slate-500">Manage standard rates, formulas, and parameters for manufacturing processes.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
           <input 
             placeholder="Search processes..." 
             className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg mb-6 w-fit">
        <button 
          onClick={() => setActiveTab('METAL')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'METAL' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <Hammer className="w-4 h-4" /> Metal Removal
        </button>
        <button 
          onClick={() => setActiveTab('SURFACE')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'SURFACE' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <Layers className="w-4 h-4" /> Surface Treatment
        </button>
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg mb-8 animate-in slide-in-from-top-4 relative z-10">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
             <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
               {current.id ? <Edit2 className="w-5 h-5 text-primary-500"/> : <Plus className="w-5 h-5 text-primary-500"/>}
               {current.id ? 'Edit Process' : 'New Process'}
             </h3>
             <button onClick={() => setIsEditing(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Process Name / Description</label>
               <input 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-primary-500" 
                 value={current.name || ''} 
                 onChange={e => setCurrent({...current, name: e.target.value})} 
                 placeholder="e.g. Face Milling Standard" 
                 autoFocus
               />
            </div>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
               <select 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                 value={current.category} 
                 onChange={e => setCurrent({...current, category: e.target.value as any})}
               >
                 <optgroup label="Metal Removal">
                    <option value="MACHINING">Machining Strategy</option>
                    <option value="WELDING">Welding / Fabrication</option>
                 </optgroup>
                 <optgroup label="Surface Treatment">
                    <option value="HEAT_TREATMENT">Heat Treatment</option>
                    <option value="SURFACE_FINISH">Surface Finish</option>
                    <option value="QUALITY">Quality / Inspection</option>
                    <option value="LOGISTICS">Logistics</option>
                    <option value="OTHER">Other</option>
                 </optgroup>
               </select>
            </div>

            {/* Dynamic Strategy Dropdown for Machining */}
            {current.category === 'MACHINING' && (
              <div>
                 <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Applicable Strategy</label>
                 <select 
                   className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white border-blue-200 bg-blue-50 dark:bg-blue-900/20" 
                   value={current.strategy || ''} 
                   onChange={e => setCurrent({...current, strategy: e.target.value as MachiningStrategy})}
                 >
                   <option value="">-- General / None --</option>
                   <optgroup label="Milling">
                      <option value="FACE_MILLING">Face Milling</option>
                      <option value="POCKET_MILLING">Pocket Milling</option>
                      <option value="SLOT_MILLING">Slot Milling</option>
                      <option value="PROFILE_MILLING">Profile Milling</option>
                   </optgroup>
                   <optgroup label="Turning">
                      <option value="OD_TURNING">OD Turning</option>
                      <option value="FACING_TURNING">Facing</option>
                      <option value="BORING">Boring (ID)</option>
                      <option value="PARTING">Parting / Grooving</option>
                   </optgroup>
                   <optgroup label="Hole Making">
                      <option value="DRILLING">Drilling</option>
                      <option value="TAPPING">Tapping</option>
                      <option value="REAMING">Reaming</option>
                   </optgroup>
                   <optgroup label="Others">
                      <option value="SURFACE_GRINDING">Grinding</option>
                      <option value="EDM">EDM</option>
                      <option value="GEAR_HOBBING">Gear Hobbing</option>
                      <option value="HONING">Honing</option>
                   </optgroup>
                 </select>
              </div>
            )}

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Unit</label>
               <select 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                 value={current.unit} 
                 onChange={e => setCurrent({...current, unit: e.target.value as any})}
               >
                 <option value="HR">Per Hour (Machine/Labor)</option>
                 <option value="KG">Per Kg (Weight)</option>
                 <option value="UNIT">Per Unit (Count)</option>
                 <option value="M2">Per Sq. Meter (Area)</option>
                 <option value="BATCH">Per Batch</option>
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Rate ($)</label>
               <input 
                 type="number" 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-medium" 
                 value={current.defaultRate || ''} 
                 onChange={e => setCurrent({...current, defaultRate: Number(e.target.value)})} 
               />
            </div>
            
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Standard Specs</label>
               <input 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                 value={current.description || ''} 
                 onChange={e => setCurrent({...current, description: e.target.value})} 
                 placeholder="e.g. Standard Roughness Ra 1.6, General Tolerance +/- 0.1mm" 
               />
            </div>

            {/* Formula & Params */}
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Calculation Formula (Display)</label>
               <input 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm" 
                 value={current.calculationFormula || ''} 
                 onChange={e => setCurrent({...current, calculationFormula: e.target.value})} 
                 placeholder="e.g. (Cycle Time / 60) * Machine Rate" 
               />
            </div>
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Parameters</label>
               <input 
                 className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                 value={current.requiredParameters || ''} 
                 onChange={e => setCurrent({...current, requiredParameters: e.target.value})} 
                 placeholder="e.g. Cycle Time, Machine Rate, Batch Size" 
               />
            </div>

            {/* Information Block */}
            <div className="md:col-span-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 flex gap-3">
               <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
               <div className="text-xs text-blue-800 dark:text-blue-300">
                 <p className="font-bold mb-1">How to define formulas:</p>
                 <ul className="list-disc pl-4 space-y-1">
                   <li><strong>Formula:</strong> Write the mathematical logic used to derive the cost. This is for display and transparency purposes (e.g., <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Weight * Rate</code>).</li>
                   <li><strong>Parameters:</strong> List the variables needed from the user or system to calculate this cost, separated by commas (e.g., <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Net Weight, Batch Qty</code>).</li>
                 </ul>
               </div>
            </div>

          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg font-medium">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium shadow-sm">
              <Save className="w-4 h-4" /> Save Process
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: Metal Removing Processes */}
      {activeTab === 'METAL' && (
        <TableSection 
          title="Metal Removing & Welding" 
          items={metalRemovalProcesses} 
          onAdd={handleAddMetal} 
          icon={Hammer} 
        />
      )}

      {/* SECTION 2: Surface Treatment */}
      {activeTab === 'SURFACE' && (
        <TableSection 
          title="Surface Treatment & Secondary Processes" 
          items={surfaceTreatmentProcesses} 
          onAdd={handleAddTreatment} 
          icon={Layers} 
        />
      )}

    </div>
  );
};
