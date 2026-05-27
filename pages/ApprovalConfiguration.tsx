
import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Plus, Trash2, Save, History, BarChart, CheckCircle, XCircle, ArrowRight, User } from 'lucide-react';
import { EnterpriseService, DataService } from '../services/mockSupabase';
import { Enterprise, ApprovalRule } from '../types';

export const ApprovalConfiguration: React.FC = () => {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [success, setSuccess] = useState<string | null>(null);

  // Load configuration and data asynchronously in useEffect
  useEffect(() => {
    const load = async () => {
        // Added comment: properly await getCurrentEnterprise from EnterpriseService
        const currentEnt = await EnterpriseService.getCurrentEnterprise();
        if (currentEnt) {
          setEnterprise(currentEnt);
        }

        // Added comment: properly await getMachining from DataService
        const allSheets = await DataService.getMachining(); 
        
        // Stats
        setStats({
          // Added comment: properly use results from awaited sheets
          pending: allSheets.filter(s => s.status === 'PENDING_APPROVAL').length,
          approved: allSheets.filter(s => s.status === 'APPROVED').length,
          rejected: allSheets.filter(s => s.status === 'REJECTED').length
        });

        // History Table
        const historyData = allSheets
          .filter(s => ['APPROVED', 'REJECTED', 'FINAL'].includes(s.status))
          .map(s => ({
            id: s.id,
            date: s.updatedAt,
            part: s.partName,
            doer: s.requestedBy || 'Unknown',
            status: s.status,
            comments: s.approvalComments || '-'
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setHistory(historyData);
    };
    load();
  }, []);

  const handleSave = () => {
    if (enterprise) {
      EnterpriseService.updateEnterprise(enterprise);
      setSuccess('Workflow configuration saved successfully.');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const addRule = () => {
    if (enterprise) {
      setEnterprise({
        ...enterprise,
        approvalRules: [...(enterprise.approvalRules || []), { doerEmail: '', approverEmail: '' }]
      });
    }
  };

  const removeRule = (index: number) => {
    if (enterprise) {
      const newRules = [...(enterprise.approvalRules || [])];
      newRules.splice(index, 1);
      setEnterprise({ ...enterprise, approvalRules: newRules });
    }
  };

  const updateRule = (index: number, field: keyof ApprovalRule, value: string) => {
    if (enterprise) {
      const newRules = [...(enterprise.approvalRules || [])];
      newRules[index] = { ...newRules[index], [field]: value };
      setEnterprise({ ...enterprise, approvalRules: newRules });
    }
  };

  if (!enterprise) return <div className="p-8 text-center text-slate-500">Loading Enterprise Configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-primary-600" /> Approval Workflow Configuration
          </h1>
          <p className="text-slate-500">Manage review policies, designate approvers, and audit sign-offs.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
        >
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 font-medium animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5" /> {success}
        </div>
      )}

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
             <History className="w-6 h-6" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pending}</div>
             <div className="text-xs text-slate-500 uppercase tracking-wide font-bold">Pending Reviews</div>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="p-3 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
             <CheckCircle className="w-6 h-6" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.approved}</div>
             <div className="text-xs text-slate-500 uppercase tracking-wide font-bold">Approved (All Time)</div>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
             <XCircle className="w-6 h-6" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.rejected}</div>
             <div className="text-xs text-slate-500 uppercase tracking-wide font-bold">Rejected (All Time)</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Configuration Column */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                   <Shield className="w-5 h-5 text-primary-600" /> Policy Configuration
                 </h3>
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Mandatory Review</span>
                    <button 
                      onClick={() => setEnterprise({...enterprise, approvalRequired: !enterprise.approvalRequired})}
                      className={`w-12 h-6 rounded-full relative transition-colors ${enterprise.approvalRequired ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enterprise.approvalRequired ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
              </div>
              
              <div className="p-6">
                 {enterprise.approvalRequired ? (
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <p className="text-sm text-slate-500 max-w-md">
                           Define specific routing rules. Cost calculations created by a "Doer" will be locked until approved by the mapped "Approver".
                         </p>
                         <button onClick={addRule} className="text-xs flex items-center gap-1 text-primary-600 font-bold hover:bg-primary-50 px-3 py-1.5 rounded transition-colors">
                           <Plus className="w-3 h-3" /> Add Mapping
                         </button>
                      </div>

                      <div className="space-y-3">
                        {(!enterprise.approvalRules || enterprise.approvalRules.length === 0) && (
                           <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-slate-400 text-sm">
                             No specific rules defined.
                           </div>
                        )}
                        {enterprise.approvalRules.map((rule, idx) => (
                           <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 animate-in slide-in-from-left-2">
                              <div className="flex-1">
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Requester (Doer)</label>
                                 <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 font-mono"
                                      placeholder={`user@${enterprise.domain}`}
                                      value={rule.doerEmail}
                                      onChange={(e) => updateRule(idx, 'doerEmail', e.target.value)}
                                    />
                                 </div>
                              </div>
                              <div className="pt-5 text-slate-300"><ArrowRight className="w-5 h-5" /></div>
                              <div className="flex-1">
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Designated Approver</label>
                                 <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input 
                                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 font-mono"
                                      placeholder={`approver@${enterprise.domain}`}
                                      value={rule.approverEmail}
                                      onChange={(e) => updateRule(idx, 'approverEmail', e.target.value)}
                                    />
                                 </div>
                              </div>
                              <div className="pt-5">
                                <button onClick={() => removeRule(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                 ) : (
                   <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <h4 className="text-slate-400 font-medium">Approval Workflow Disabled</h4>
                      <p className="text-sm text-slate-400 mt-1">Users can finalize costs without review.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* History Column */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden h-fit">
           <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart className="w-5 h-5 text-slate-500" /> Approval Log
              </h3>
           </div>
           <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-white dark:bg-slate-800 text-slate-500 border-b border-gray-100 dark:border-slate-700 sticky top-0">
                    <tr>
                       <th className="p-3 font-medium">Details</th>
                       <th className="p-3 font-medium text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {history.length === 0 && (
                       <tr><td colSpan={2} className="p-6 text-center text-slate-400 text-xs">No history found.</td></tr>
                    )}
                    {history.map((item: any) => (
                       <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="p-3">
                             <div className="font-bold text-slate-700 dark:text-white">{item.part}</div>
                             <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3" /> {item.doer}
                             </div>
                             <div className="text-[10px] text-slate-400 mt-1">{new Date(item.date).toLocaleDateString()}</div>
                          </td>
                          <td className="p-3 text-right align-top">
                             <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                               item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                             }`}>
                               {item.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
};
