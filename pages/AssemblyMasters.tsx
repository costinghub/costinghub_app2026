
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, ClipboardList, Users, Layers } from 'lucide-react';
import { DataService } from '../services/mockSupabase';

interface Props {
  type: 'BOM' | 'LABOR' | 'OVERHEAD';
}

export const AssemblyMasters: React.FC<Props> = ({ type }) => {
  const [data, setData] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any>({});

  useEffect(() => {
    refresh();
  }, [type]);

  // Fix: Await async service calls in refresh
  const refresh = async () => {
    // Simulating fetching generic master data from generic mock handler
    setData(await DataService.getAssemblyMasters(type));
  };

  // Fix: Await async service calls in handleSave
  const handleSave = async () => {
    const item = { ...current, id: current.id || `${type.toLowerCase()}-${Date.now()}` };
    await DataService.saveAssemblyMaster(type, item);
    refresh();
    setIsEditing(false);
    setCurrent({});
  };

  const titles = {
    BOM: { title: 'Standard Parts Master', icon: ClipboardList, desc: 'Library of standard bought-out or manufactured items.' },
    LABOR: { title: 'Labor Rates Master', icon: Users, desc: 'Standard hourly rates for different skill levels.' },
    OVERHEAD: { title: 'Overhead Category Master', icon: Layers, desc: 'Standard overhead percentages by department.' }
  };

  const Config = titles[type];
  const Icon = Config.icon;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Icon className="w-8 h-8 text-primary-600"/> {Config.title}
          </h1>
          <p className="text-slate-500">{Config.desc}</p>
        </div>
        <button 
          onClick={() => { setIsEditing(true); setCurrent({}); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {isEditing && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg mb-6 animate-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 dark:text-white">Edit Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            
            {type === 'BOM' && (
              <>
                <input placeholder="Part Number" className="border p-2 rounded dark:bg-slate-700" value={current.itemNumber || ''} onChange={e => setCurrent({...current, itemNumber: e.target.value})} />
                <input placeholder="Description" className="border p-2 rounded dark:bg-slate-700" value={current.description || ''} onChange={e => setCurrent({...current, description: e.target.value})} />
                <input type="number" placeholder="Unit Cost ($)" className="border p-2 rounded dark:bg-slate-700" value={current.unitCost || ''} onChange={e => setCurrent({...current, unitCost: Number(e.target.value)})} />
              </>
            )}

            {type === 'LABOR' && (
              <>
                <input placeholder="Operation Name" className="border p-2 rounded dark:bg-slate-700" value={current.operationName || ''} onChange={e => setCurrent({...current, operationName: e.target.value})} />
                <select className="border p-2 rounded dark:bg-slate-700" value={current.skillLevel || 'SKILLED'} onChange={e => setCurrent({...current, skillLevel: e.target.value})}>
                    <option value="UNSKILLED">Unskilled</option>
                    <option value="SKILLED">Skilled</option>
                    <option value="EXPERT">Expert</option>
                </select>
                <input type="number" placeholder="Hourly Rate ($)" className="border p-2 rounded dark:bg-slate-700" value={current.hourlyRate || ''} onChange={e => setCurrent({...current, hourlyRate: Number(e.target.value)})} />
              </>
            )}

             {type === 'OVERHEAD' && (
              <>
                <input placeholder="Category Name" className="border p-2 rounded dark:bg-slate-700" value={current.name || ''} onChange={e => setCurrent({...current, name: e.target.value})} />
                <input type="number" placeholder="Default %" className="border p-2 rounded dark:bg-slate-700" value={current.percentage || ''} onChange={e => setCurrent({...current, percentage: Number(e.target.value)})} />
              </>
            )}

          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:bg-gray-100 rounded">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Save</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4">Name/ID</th>
              <th className="p-4">Details</th>
              <th className="p-4 text-right">Cost/Value</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="p-4 font-medium">
                    {type === 'BOM' ? item.itemNumber : (item.operationName || item.name)}
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {type === 'BOM' && item.description}
                  {type === 'LABOR' && item.skillLevel}
                  {type === 'OVERHEAD' && 'Applied on Prime Cost'}
                </td>
                <td className="p-4 text-right text-sm">
                   {type === 'BOM' && `$${item.unitCost}`}
                   {type === 'LABOR' && `$${item.hourlyRate}/hr`}
                   {type === 'OVERHEAD' && `${item.percentage}%`}
                </td>
                <td className="p-4 text-right"><button onClick={() => { setCurrent(item); setIsEditing(true); }} className="text-slate-400 hover:text-primary-600"><Edit2 className="w-4 h-4"/></button></td>
              </tr>
            ))}
             {data.length === 0 && (
                 <tr><td colSpan={4} className="p-6 text-center text-slate-400">No master data found. Add new items.</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
