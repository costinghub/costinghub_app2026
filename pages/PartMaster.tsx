
import React, { useEffect, useState } from 'react';
import { Package, Eye } from 'lucide-react';
import { DataService } from '../services/mockSupabase';
import { MachiningCostSheet } from '../types';
import { useNavigate } from 'react-router-dom';

export const PartMaster: React.FC = () => {
  const [parts, setParts] = useState<MachiningCostSheet[]>([]);
  const navigate = useNavigate();

  // Fix: Correctly handle asynchronous DataService.getMachining call in useEffect
  useEffect(() => {
    const load = async () => {
      setParts(await DataService.getMachining());
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <Package className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Part Master</h1>
          <p className="text-slate-500">Registry of all costed components.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parts.map(part => (
          <div key={part.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{part.partNumber || 'N/A'}</h3>
                <p className="text-sm text-slate-500">{part.partName}</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Material</span>
                 <span className="font-medium dark:text-gray-300">{part.materialId}</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Finished Wt.</span>
                 <span className="font-medium dark:text-gray-300">{part.finishedWeight} kg</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/machining')} 
              className="w-full py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> View Cost Sheet
            </button>
          </div>
        ))}
        {parts.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300">
            No parts found. Create a Machining Cost Sheet to populate this master.
          </div>
        )}
      </div>
    </div>
  );
};
