import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Save, Box, Flame, Container, Beaker, Wrench, Layers, Droplets, Trash2, ArrowLeft, Settings, ShieldCheck } from 'lucide-react';
import { DataService } from '../services/supabaseService';
import { CastingGrade, MouldingBox, MeltingFurnace, ChemicalElement, FettlingProcess, FoundryConsumables } from '../types';

type TabType = 'ELEMENTS' | 'GRADES' | 'MOULDING' | 'MELTING' | 'FETTLING' | 'CONSUMABLES';

export const CastingMasters: React.FC<{ type?: string }> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('GRADES');
  const [data, setData] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<FoundryConsumables | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any>({});

  useEffect(() => {
    // Exact path-to-tab mapping to support direct sidebar navigation
    if (location.pathname.endsWith('/grade')) setActiveTab('GRADES');
    else if (location.pathname.endsWith('/moulding')) setActiveTab('MOULDING');
    else if (location.pathname.endsWith('/melting')) setActiveTab('MELTING');
    else if (location.pathname.endsWith('/fettling')) setActiveTab('FETTLING');
    else if (location.pathname.endsWith('/consumables')) setActiveTab('CONSUMABLES');
    else if (location.pathname.endsWith('/elements')) setActiveTab('ELEMENTS');
  }, [location.pathname]);

  useEffect(() => {
    refresh();
  }, [activeTab]);

  const refresh = async () => {
    setLoading(true);
    setIsEditing(false);
    try {
        switch (activeTab) {
            case 'ELEMENTS': setData(await DataService.getCastingElements()); break;
            case 'GRADES': setData(await DataService.getCastingGrades()); break;
            case 'MOULDING': setData(await DataService.getMouldingBoxes()); break;
            case 'MELTING': setData(await DataService.getMeltingFurnaces()); break;
            case 'FETTLING': setData(await DataService.getFettlingProcesses()); break;
            case 'CONSUMABLES': setConsumables(await DataService.getFoundryConsumables()); break;
        }
    } catch (err) {
        console.error("Master Load Failed:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'CONSUMABLES') {
      if (consumables) await DataService.saveFoundryConsumables(consumables);
      alert('Global rates updated successfully.');
      return;
    }

    const item = { ...current, id: current.id || `${activeTab.toLowerCase()}-${Date.now()}` };
    
    if (activeTab === 'ELEMENTS') await DataService.saveCastingElement(item);
    else if (activeTab === 'GRADES') await DataService.saveCastingGrade(item);
    else if (activeTab === 'MOULDING') await DataService.saveMouldingBox(item);
    else if (activeTab === 'MELTING') await DataService.saveMeltingFurnace(item);
    else if (activeTab === 'FETTLING') await DataService.saveFettlingProcess(item);
    
    refresh();
    setIsEditing(false);
    setCurrent({});
  };

  const tabs: {id: TabType, label: string, icon: any, path: string}[] = [
    { id: 'GRADES', label: 'Casting Grades', icon: Beaker, path: '/casting/masters/grade' },
    { id: 'MOULDING', label: 'Box Library', icon: Container, path: '/casting/masters/moulding' },
    { id: 'MELTING', label: 'Furnace Config', icon: Flame, path: '/casting/masters/melting' },
    { id: 'FETTLING', label: 'Fettling Rates', icon: Layers, path: '/casting/masters/fettling' },
    { id: 'ELEMENTS', label: 'Elements', icon: Droplets, path: '/casting/masters/elements' },
    { id: 'CONSUMABLES', label: 'Global Constants', icon: Settings, path: '/casting/masters/consumables' },
  ];

  const handleTabChange = (tabId: TabType, path: string) => {
    setActiveTab(tabId);
    navigate(path);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
             <Box className="w-8 h-8 text-primary-600"/> Foundry Master Data
          </h1>
          <p className="text-slate-500">Global parameters for green sand casting operations.</p>
        </div>
        
        {activeTab !== 'CONSUMABLES' && !isEditing && (
          <button 
            onClick={() => { setIsEditing(true); setCurrent({}); }}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 shadow-lg font-bold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Master Record
          </button>
        )}
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-4 custom-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id, t.path)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${
              activeTab === t.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-md dark:bg-primary-600 dark:border-primary-600' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-gray-100 dark:border-slate-700 hover:border-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'CONSUMABLES' && consumables ? (
         <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm animate-in fade-in">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-8 flex items-center gap-2 border-b pb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Organization Foundry Baselines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-800">
                  <label className="block text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest mb-3">Fresh Sand Cost</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-orange-900 dark:text-orange-200 mr-1">$</span>
                    <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-xl font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500" value={consumables.sandCostPerKg} onChange={e => setConsumables({...consumables, sandCostPerKg: Number(e.target.value)})} />
                    <span className="text-xs text-slate-400 ml-2 font-bold">/kg</span>
                  </div>
               </div>
               <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800">
                  <label className="block text-[10px] font-black text-purple-800 dark:text-purple-400 uppercase tracking-widest mb-3">Binder/Additive</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-purple-900 dark:text-purple-200 mr-1">$</span>
                    <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-xl font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500" value={consumables.binderCostPerKg} onChange={e => setConsumables({...consumables, binderCostPerKg: Number(e.target.value)})} />
                    <span className="text-xs text-slate-400 ml-2 font-bold">/kg</span>
                  </div>
               </div>
               <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-800">
                  <label className="block text-[10px] font-black text-yellow-800 dark:text-yellow-400 uppercase tracking-widest mb-3">Energy Unit Rate</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mr-1">$</span>
                    <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-xl font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-yellow-500" value={consumables.energyCostPerKwh} onChange={e => setConsumables({...consumables, energyCostPerKwh: Number(e.target.value)})} />
                    <span className="text-xs text-slate-400 ml-2 font-bold">/kWh</span>
                  </div>
               </div>
               <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <label className="block text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-3">Foundry Manpower</label>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-blue-900 dark:text-blue-200 mr-1">$</span>
                    <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 border rounded-xl p-3 text-xl font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500" value={consumables.laborRatePerHr} onChange={e => setConsumables({...consumables, laborRatePerHr: Number(e.target.value)})} />
                    <span className="text-xs text-slate-400 ml-2 font-bold">/hr</span>
                  </div>
               </div>
            </div>
            <div className="mt-10 flex justify-end">
               <button onClick={handleSave} className="bg-slate-900 dark:bg-primary-600 text-white px-10 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-[1.02] transition-all">
                 <Save className="w-5 h-5" /> Sync Global Constants
               </button>
            </div>
         </div>
      ) : (
        <>
          {isEditing && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-primary-100 dark:border-slate-700 shadow-2xl mb-8 animate-in slide-in-from-top-4">
              <h3 className="font-black text-lg dark:text-white mb-6 flex items-center gap-3 border-b pb-4">
                 {current.id ? <Edit2 className="w-5 h-5 text-primary-500" /> : <Plus className="w-5 h-5 text-primary-500" />}
                 {current.id ? 'Modify' : 'Create'} {activeTab.replace('_', ' ')} Entry
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Standard Identifier</label>
                  <input className="w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white dark:border-slate-600 font-bold" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})} placeholder="e.g. Grey Iron 250..." />
                </div>

                {activeTab === 'ELEMENTS' && (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Chemical Symbol</label>
                        <input className="w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white dark:border-slate-600 font-mono" value={current.symbol || ''} onChange={e => setCurrent({...current, symbol: e.target.value.toUpperCase()})} placeholder="e.g. Si, Mg" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Market Rate ($/kg)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white dark:border-slate-600" value={current.ratePerKg || ''} onChange={e => setCurrent({...current, ratePerKg: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Elemental Purity (%)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white dark:border-slate-600" value={current.purity || ''} onChange={e => setCurrent({...current, purity: Number(e.target.value)})} />
                    </div>
                  </>
                )}
                
                {activeTab === 'GRADES' && (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Base Liquid Cost ($/kg)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white dark:border-slate-600" value={current.baseRate || ''} onChange={e => setCurrent({...current, baseRate: Number(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Typical Composition</label>
                        <input className="w-full border p-3 rounded-xl dark:bg-slate-700 dark:text-white dark:border-slate-600" value={current.chemicalComposition || ''} onChange={e => setCurrent({...current, chemicalComposition: e.target.value})} placeholder="e.g. C: 3.2%, Si: 2.1%..." />
                    </div>
                  </>
                )}

                {activeTab === 'MOULDING' && (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">L (mm)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.length || ''} onChange={e => setCurrent({...current, length: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">W (mm)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.width || ''} onChange={e => setCurrent({...current, width: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">H (mm)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.height || ''} onChange={e => setCurrent({...current, height: Number(e.target.value)})} />
                    </div>
                  </>
                )}

                {activeTab === 'MELTING' && (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Efficiency (kWh/kg)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.energyPerKg || ''} onChange={e => setCurrent({...current, energyPerKg: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Consumables ($/kg Melt)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.consumableRate || ''} onChange={e => setCurrent({...current, consumableRate: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Melting Loss (%)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.meltingLossPercent || ''} onChange={e => setCurrent({...current, meltingLossPercent: Number(e.target.value)})} />
                    </div>
                  </>
                )}

                {activeTab === 'FETTLING' && (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Strategy</label>
                        <select className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.unit || 'KG'} onChange={e => setCurrent({...current, unit: e.target.value})}>
                          <option value="KG">Weight (Per Kg)</option>
                          <option value="PC">Piece (Per Unit)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Man-Machine Rate ($/hr)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.hourlyRate || ''} onChange={e => setCurrent({...current, hourlyRate: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Capacity (Units/hr)</label>
                        <input type="number" className="w-full border p-3 rounded-xl dark:bg-slate-700" value={current.capacityPerHr || ''} onChange={e => setCurrent({...current, capacityPerHr: Number(e.target.value)})} />
                    </div>
                  </>
                )}

              </div>
              <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700">
                <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all">Discard</button>
                <button onClick={handleSave} className="px-10 py-2.5 bg-primary-600 text-white rounded-xl font-black shadow-lg hover:bg-primary-700">Save Master Record</button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-5">Entity Name</th>
                  <th className="p-5">Configuration / Rate</th>
                  {activeTab === 'MOULDING' && <th className="p-5 text-center">Envelope</th>}
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {data.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-colors">
                    <td className="p-5">
                        <div className="font-black text-slate-800 dark:text-white text-base">{item.name}</div>
                        {activeTab === 'ELEMENTS' && <div className="text-xs font-mono font-bold text-primary-600">{item.symbol} Alloying</div>}
                    </td>
                    <td className="p-5 text-sm text-slate-500">
                      {activeTab === 'ELEMENTS' && <span className="font-bold text-slate-700 dark:text-slate-300">${item.ratePerKg}/kg</span>}
                      {activeTab === 'GRADES' && <span className="font-bold text-slate-700 dark:text-slate-300">${item.baseRate}/kg Melt</span>}
                      {activeTab === 'MOULDING' && <span className="font-bold text-slate-700 dark:text-slate-300">Sand Wt: {item.sandWeight}kg</span>}
                      {activeTab === 'MELTING' && <span className="font-bold text-slate-700 dark:text-slate-300">{item.energyPerKg} kWh/kg</span>}
                      {activeTab === 'FETTLING' && <span className="font-bold text-slate-700 dark:text-slate-300">${(item.hourlyRate / item.capacityPerHr).toFixed(4)}/{item.unit}</span>}
                    </td>
                    {activeTab === 'MOULDING' && <td className="p-5 text-xs text-center font-mono font-bold text-slate-400">{item.length}x{item.width}x{item.height}</td>}
                    <td className="p-5 text-right">
                       <div className="flex justify-end gap-2">
                          <button onClick={() => { setCurrent(item); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => { if(confirm('Permanently delete record?')) refresh(); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                       </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && !loading && (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-400 italic">No master records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};