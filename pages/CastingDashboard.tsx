import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Eye, Beaker, Database, Flame, Layers, Settings, ArrowRight, Activity, Wrench } from 'lucide-react';
import { DataService, AuthService } from '../services/supabaseService';
import { CastingCostSheet, UserRole } from '../types';

export const CastingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<CastingCostSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const user = AuthService.getCurrentUser();
  const isViewer = user?.role === UserRole.VIEWER;

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    setLoading(true);
    try {
      const data = await DataService.getCasting();
      setSheets(data);
    } catch (error) {
      console.error("Failed to load casting sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Foundry Calculation Library</h1>
          <p className="text-slate-500">Zero-Based Costing for Green Sand Casting.</p>
        </div>
        {!isViewer && (
          <button 
            onClick={() => navigate('/casting/calculator')}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 shadow-lg font-bold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Costing
          </button>
        )}
      </div>

      {/* Master Data Quick Access Panel */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
         <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Management Console
         </h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <button onClick={() => navigate('/casting/masters/grade')} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Beaker className="w-5 h-5" /></div>
                  <div className="text-left">
                    <span className="block font-black text-xs text-slate-800 dark:text-white">Grades</span>
                    <span className="text-[10px] text-slate-400">Chemistry</span>
                  </div>
               </div>
               <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/moulding')} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><Database className="w-5 h-5" /></div>
                  <div className="text-left">
                    <span className="block font-black text-xs text-slate-800 dark:text-white">Moulding</span>
                    <span className="text-[10px] text-slate-400">Line Config</span>
                  </div>
               </div>
               <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/melting')} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-lg"><Flame className="w-5 h-5" /></div>
                  <div className="text-left">
                    <span className="block font-black text-xs text-slate-800 dark:text-white">Melting</span>
                    <span className="text-[10px] text-slate-400">Furnaces</span>
                  </div>
               </div>
               <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/fettling')} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Layers className="w-5 h-5" /></div>
                  <div className="text-left">
                    <span className="block font-black text-xs text-slate-800 dark:text-white">Fettling</span>
                    <span className="text-[10px] text-slate-400">Labor Rates</span>
                  </div>
               </div>
               <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/consumables')} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg"><Settings className="w-5 h-5" /></div>
                  <div className="text-left">
                    <span className="block font-black text-xs text-slate-800 dark:text-white">Globals</span>
                    <span className="text-[10px] text-slate-400">Sand/Energy</span>
                  </div>
               </div>
               <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input placeholder="Search part name..." className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
           </div>
        </div>
        
        {loading ? (
          <div className="p-20 text-center text-slate-400">Loading casting estimates...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="p-5">Calculation #</th>
                <th className="p-5">Component Details</th>
                <th className="p-5 text-center">Net Wt.</th>
                <th className="p-5 text-center">Process Yield</th>
                <th className="p-5">Modified Date</th>
                <th className="p-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {sheets.map(sheet => (
                <tr key={sheet.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-colors">
                  <td className="p-5 font-mono text-sm font-bold text-slate-600 dark:text-slate-400">{sheet.calcNumber || 'DRAFT'}</td>
                  <td className="p-5">
                    <div className="font-black text-slate-800 dark:text-white">{sheet.partName || 'Untitled'}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{sheet.customer || 'Internal Org'}</div>
                  </td>
                  <td className="p-5 text-center font-bold dark:text-slate-300">{sheet.netWeight} <span className="text-[10px] font-normal text-slate-400">kg</span></td>
                  <td className="p-5 text-center">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${sheet.yieldPercent > 70 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {sheet.yieldPercent}%
                     </span>
                  </td>
                  <td className="p-5 text-xs text-slate-500 font-medium">{new Date(sheet.updatedAt).toLocaleDateString()}</td>
                  <td className="p-5 text-right">
                    <button onClick={() => navigate(`/casting/calculator?id=${sheet.id}`)} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-all inline-flex items-center gap-1 font-bold text-sm">
                      <Eye className="w-4 h-4" /> Open Estimate
                    </button>
                  </td>
                </tr>
              ))}
               {sheets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-500 flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 mb-2 text-slate-200" />
                    <span className="font-bold text-lg text-slate-400">No Casting Estimates Yet</span>
                    <p className="text-sm text-slate-500 max-w-xs">Start a ZBC calculation for your foundry projects.</p>
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