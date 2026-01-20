
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText } from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { AssemblyCostSheet } from '../types';

export const AssemblyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<AssemblyCostSheet[]>([]);

  // Fix: Await async service calls in useEffect
  useEffect(() => {
    const loadSheets = async () => {
      setSheets(await DataService.getAssembly());
    };
    loadSheets();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assembly Cost Dashboard</h1>
          <p className="text-slate-500">Manage your product assembly estimations.</p>
        </div>
        <button 
          onClick={() => navigate('/assembly/calculator')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New Calculation
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input placeholder="Search assembly name or number..." className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
           </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4">Calc #</th>
              <th className="p-4">Assembly Name</th>
              <th className="p-4 text-center">Batch Size</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {sheets.map(sheet => (
              <tr key={sheet.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="p-4 font-mono text-sm">{sheet.calcNumber || 'DRAFT'}</td>
                <td className="p-4 font-medium">
                    <div className="text-slate-800 dark:text-white">{sheet.assemblyName || 'Untitled'}</div>
                    <div className="text-xs text-slate-500">{sheet.assemblyNumber}</div>
                </td>
                <td className="p-4 text-sm text-slate-500 text-center">{sheet.batchSize}</td>
                <td className="p-4 text-sm text-slate-500">{new Date(sheet.updatedAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <button onClick={() => navigate('/assembly/calculator')} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Open</button>
                </td>
              </tr>
            ))}
             {sheets.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <FileText className="w-12 h-12 mb-2 text-slate-300" />
                  No assembly calculations found. Start a new one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
