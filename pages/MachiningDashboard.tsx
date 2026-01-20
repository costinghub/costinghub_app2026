import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, Clock, CheckCircle, XCircle, Box, Wrench, Cpu, Layers, ArrowRight } from 'lucide-react';
import { DataService, AuthService } from '../services/mockSupabase';
import { MachiningCostSheet, UserRole, CalcStatus } from '../types';

const StatusBadge = ({ status, comments }: { status: CalcStatus, comments?: string }) => {
  const map: Record<CalcStatus, { label: string, color: string, icon: any }> = {
    DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
    PENDING_APPROVAL: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    FINAL: { label: 'Final', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle }
  };
  const cfg = map[status] || map.DRAFT;
  const Icon = cfg.icon;
  
  return (
    <div className="relative group cursor-help">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
        <Icon className="w-3 h-3" /> {cfg.label}
      </span>
      {comments && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <div className="font-bold mb-1 border-b border-slate-600 pb-1">Approver Comments:</div>
          {comments}
        </div>
      )}
    </div>
  );
};

export const MachiningDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<MachiningCostSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = AuthService.getCurrentUser();
  const isViewer = user?.role === UserRole.VIEWER;

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    setLoading(true);
    try {
      const data = await DataService.getMachining();
      setSheets(data);
    } catch (error) {
      console.error("Failed to load machining sheets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this calculation?")) {
      await DataService.deleteMachining(id);
      loadSheets();
    }
  };

  const filteredSheets = sheets.filter(s => 
    s.partName.toLowerCase().includes(search.toLowerCase()) || 
    s.partNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Machining Estimations</h1>
          <p className="text-slate-500">Manage organizational cost calculations.</p>
        </div>
        {!isViewer && (
          <button onClick={() => navigate('/machining/calculator')} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> New Estimate
          </button>
        )}
      </div>

      {/* Master Data Quick Access */}
      <div>
         <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Master Data Management</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigate('/machining/materials')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><Box className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Materials</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/machining/tools')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Wrench className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Tools</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/machining/machines')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><Cpu className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Machines</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
            <button onClick={() => navigate('/machining/processes')} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-primary-500 transition-all group">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Layers className="w-5 h-5" /></div>
                  <span className="font-bold text-sm dark:text-white">Processes</span>
               </div>
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
            </button>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input placeholder="Search part name or number..." className="w-full pl-9 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" value={search} onChange={e => setSearch(e.target.value)} />
           </div>
        </div>
        
        {loading ? (
          <div className="p-20 text-center text-slate-400">Loading estimates...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-900 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Calculation</th>
                <th className="p-4">Part Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Modified</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredSheets.map(sheet => (
                <tr key={sheet.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 group">
                  <td className="p-4 font-mono text-sm">{sheet.calculationNumber || 'DRAFT'}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 dark:text-white">{sheet.partName || 'Untitled'}</div>
                    <div className="text-xs text-slate-500">{sheet.partNumber}</div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={sheet.status} comments={sheet.approvalComments} />
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(sheet.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                     <div className="flex justify-end gap-2">
                       <button onClick={() => navigate(`/machining/reports?id=${sheet.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600" title="View"><Eye className="w-4 h-4" /></button>
                       {!isViewer && sheet.status !== 'APPROVED' && (
                          <button onClick={() => navigate(`/machining/calculator?id=${sheet.id}`)} className="p-1.5 text-slate-400 hover:text-primary-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                       )}
                       {!isViewer && (
                          <button onClick={() => handleDelete(sheet.id)} className="p-1.5 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                       )}
                     </div>
                  </td>
                </tr>
              ))}
              {filteredSheets.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400">No matching calculations found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
