import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, Calculator, ArrowRight, Gauge, Clock, Zap } from 'lucide-react';
import { DataService } from '../services/supabaseService';
import { MHRCalculation } from '../types';

export const MHRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [mhrs, setMhrs] = useState<MHRCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMHRs();
  }, []);

  const loadMHRs = async () => {
    setLoading(true);
    try {
      const data = await DataService.getMHRs();
      setMhrs(data);
    } catch (error) {
      console.error("Failed to load MHR calculations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this machine rate?")) {
        // Mock delete since MHR is simple upsert in this demo
        setMhrs(prev => prev.filter(m => m.id !== id));
        alert('Record removed (Session Only).');
    }
  };

  const filteredMhrs = mhrs.filter(m => 
    m.machineName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-emerald-600" /> Machine Hour Rates
          </h1>
          <p className="text-slate-500">Zero-Based Costing library for production facilities.</p>
        </div>
        <button 
          onClick={() => navigate('/mhr/calculator')} 
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg transition-all active:scale-95 font-black uppercase text-xs tracking-widest"
        >
          <Plus className="w-4 h-4" /> New Machine Calc
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               placeholder="Search by machine name..." 
               className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
             />
           </div>
        </div>
        
        {loading ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="font-bold">Syncing Library...</span>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="p-5">Asset / Machine</th>
                <th className="p-5">Investment</th>
                <th className="p-5">Availability</th>
                <th className="p-5">MHR Result</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredMhrs.map(m => {
                const totalInvestment = m.purchasePrice + m.installationCost;
                const productiveHours = (m.shiftsPerDay * m.hoursPerShift * m.daysPerYear) * (m.efficiencyPercent / 100);
                // Rough ZBC visualization
                const rate = (totalInvestment / m.usefulLifeYears / productiveHours) * 3; 

                return (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-colors">
                    <td className="p-5">
                      <div className="font-black text-slate-800 dark:text-white text-base">{m.machineName}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-bold">
                        <Gauge className="w-3 h-3" /> {m.powerRatingKw} kW Power • {m.usefulLifeYears}Y Life
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-black text-slate-700 dark:text-slate-300">${totalInvestment.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total CapEx</div>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{Math.round(productiveHours)} hrs/yr</div>
                      <div className="text-[10px] text-emerald-500 font-black uppercase tracking-wide">{m.efficiencyPercent}% Net OEE</div>
                    </td>
                    <td className="p-5">
                       <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-xl font-black border border-emerald-100 dark:border-emerald-900/40">
                          ${rate.toFixed(2)}
                          <span className="text-[10px] font-bold ml-1 opacity-60">/HR</span>
                       </span>
                    </td>
                    <td className="p-5 text-right">
                       <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => navigate(`/mhr/calculator?id=${m.id}`)} 
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                            title="Edit"
                          >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => handleDelete(m.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete"
                          >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMhrs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500 italic flex flex-col items-center gap-3">
                    <Calculator className="w-16 h-16 text-slate-200" />
                    <span className="font-bold text-lg text-slate-400">Library Empty</span>
                    <p className="text-sm text-slate-500">Calculate your first hourly rate using the ZBC engine.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};