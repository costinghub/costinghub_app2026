import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Eye, Beaker, Database, Flame, Layers, Settings, ArrowRight } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Foundry Calculations</h1>
          <p className="text-slate-500">Manage Green Sand Casting estimations.</p>
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

      {/* Master Data Quick Access */}
      <div>
         <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Foundry Master Data</h2>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button onClick={() => navigate('/casting/masters/grade')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><Beaker className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Grades</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/moulding')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Database className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Moulding</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/melting')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><Flame className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Melting</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/fettling')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Layers className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Fettling</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/casting/masters/consumables')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group shadow-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-600 rounded-lg"><Settings className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Constants</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
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
                <th className="p-5">Calc #</th>
                <th className="p-5">Part Details</th>
                <th className="p-5 text-center">Net Weight</th>
                <th className="p-5 text-center">Yield</th>
                <th className="p-5">Modified</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {sheets.map(sheet => (
                <tr key={sheet.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 group transition-colors">
                  <td className="p-5 font-mono text-sm font-bold text-slate-600 dark:text-slate-400">{sheet.calcNumber || 'DRAFT'}</td>
                  <td className="p-5">
                    <div className="font-black text-slate-800 dark:text-white">{sheet.partName || 'Untitled'}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{sheet.customer || 'Internal'}</div>
                  </td>
                  <td className="p-5 text-center font-bold dark:text-slate-300">{sheet.netWeight} <span className="text-[10px] font-normal text-slate-400">kg</span></td>
                  <td className="p-5 text-center">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black ${sheet.yieldPercent > 70 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {sheet.yieldPercent}%
                     </span>
                  </td>
                  <td className="p-5 text-xs text-slate-500 font-medium">{new Date(sheet.updatedAt).toLocaleDateString()}</td>
                  <td className="p-5 text-right">
                    <button onClick={() => navigate(`/casting/calculator?id=${sheet.id}`)} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-all inline-flex items-center gap-1 font-bold text-sm">
                      <Eye className="w-4 h-4" /> Open
                    </button>
                  </td>
                </tr>
              ))}
               {sheets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-500 flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 mb-2 text-slate-200" />
                    <span className="font-bold text-lg text-slate-400">No Casting Estimates Yet</span>
                    <p className="text-sm text-slate-500 max-w-xs">Start a Zero-Based Costing for your casting projects.</p>
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