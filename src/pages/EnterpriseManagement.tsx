
import React, { useState, useEffect } from 'react';
import { 
  Building2, UserPlus, CheckCircle, ShieldAlert, Layers, Users, CreditCard, 
  Lock, Stamp, AtSign, Plus, X, Shield, Hammer, Calculator, Box, Wrench, Globe, Edit2, Settings, ArrowRight, Trash2
} from 'lucide-react';
import { EnterpriseService, AuthService, PlanService } from '../services/mockSupabase';
import { Enterprise, ModuleType, UserRole, LicenseLimits, ApprovalRule } from '../types';

export const EnterpriseManagement: React.FC = () => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEnt, setEditingEnt] = useState<Enterprise | null>(null);
  
  // New Enterprise Form State
  const [newEnt, setNewEnt] = useState({
    name: '',
    domain: '',
    adminName: '',
    adminEmail: '',
    plan: 'PRO' as 'FREE' | 'PRO' | 'ENTERPRISE',
    modules: ['MACHINING', 'MHR'] as ModuleType[],
    licenses: {
      [UserRole.ENTERPRISE_ADMIN]: 1,
      [UserRole.COST_ENGINEER]: 5,
      [UserRole.APPROVER]: 2,
      [UserRole.VIEWER]: 10
    } as LicenseLimits
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnterprises = async () => {
        const data = await EnterpriseService.getEnterprises();
        setEnterprises(data || []);
    };
    fetchEnterprises();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Domain match check
    const emailParts = newEnt.adminEmail.split('@');
    if (emailParts.length < 2) {
      setError("Please enter a valid admin email.");
      return;
    }
    const emailDomain = emailParts[1];
    if (emailDomain !== newEnt.domain) {
      setError(`Domain mismatch! The Admin Email (@${emailDomain}) must match the Enterprise Domain (@${newEnt.domain}).`);
      return;
    }

    try {
      await EnterpriseService.createEnterprise(
        newEnt.name,
        newEnt.adminName,
        newEnt.adminEmail,
        newEnt.plan,
        newEnt.domain,
        newEnt.modules,
        newEnt.licenses,
        100 // Default max calculations
      );
      const data = await EnterpriseService.getEnterprises();
      setEnterprises(data || []);
      setIsCreating(false);
      setSuccessMsg(`Enterprise "${newEnt.name}" created successfully. You can now log in as ${newEnt.adminEmail}.`);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create enterprise');
    }
  };

  const resetForm = () => {
    setNewEnt({
      name: '', domain: '', adminName: '', adminEmail: '', plan: 'PRO',
      modules: ['MACHINING', 'MHR'],
      licenses: { [UserRole.ENTERPRISE_ADMIN]: 1, [UserRole.COST_ENGINEER]: 5, [UserRole.APPROVER]: 2, [UserRole.VIEWER]: 10 }
    });
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEnt) {
      try {
        await EnterpriseService.updateEnterprise(editingEnt);
        const data = await EnterpriseService.getEnterprises();
        setEnterprises(data || []);
        setEditingEnt(null);
        setSuccessMsg(`Enterprise "${editingEnt.name}" updated successfully.`);
      } catch (err: any) {
        setError(err.message || 'Failed to update enterprise');
      }
    }
  };

  const toggleModule = (mod: ModuleType, isEditMode = false) => {
    if (isEditMode && editingEnt) {
        setEditingEnt(prev => {
            if (!prev) return null;
            const current = prev.modules || [];
            const updated = current.includes(mod) ? current.filter(m => m !== mod) : [...current, mod];
            return { ...prev, modules: updated };
        });
    } else {
        setNewEnt(prev => ({
        ...prev,
        modules: prev.modules.includes(mod) 
            ? prev.modules.filter(m => m !== mod) 
            : [...prev.modules, mod]
        }));
    }
  };

  // Rule Management Logic for Edit Mode
  const addRule = () => {
    if (editingEnt) {
      setEditingEnt({
        ...editingEnt,
        approvalRules: [...(editingEnt.approvalRules || []), { doerEmail: '', approverEmail: '' }]
      });
    }
  };

  const removeRule = (index: number) => {
    if (editingEnt) {
      const newRules = [...(editingEnt.approvalRules || [])];
      newRules.splice(index, 1);
      setEditingEnt({ ...editingEnt, approvalRules: newRules });
    }
  };

  const updateRule = (index: number, field: keyof ApprovalRule, value: string) => {
    if (editingEnt) {
      const newRules = [...(editingEnt.approvalRules || [])];
      newRules[index] = { ...newRules[index], [field]: value };
      setEditingEnt({ ...editingEnt, approvalRules: newRules });
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === UserRole.COST_ENGINEER) return 'User';
    return role.split('_').pop() || role;
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary-600" /> Enterprise Console
          </h1>
          <p className="text-slate-500">Manage organizational governance, licenses, and domains.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-500/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Enterprise
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 font-medium animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5" /> {successMsg}
            <button onClick={() => setSuccessMsg(null)} className="ml-auto hover:bg-green-100 p-1 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-6">
        {enterprises.map(ent => (
          <div key={ent.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center font-bold text-xl">
                    {ent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors">{ent.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                       <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border dark:border-slate-600">
                         <Globe className="w-3 h-3" /> @{ent.domain}
                       </span>
                       <span className={`px-2 py-0.5 rounded-full font-bold border ${
                         ent.plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-primary-50 text-primary-700 border-primary-100'
                       }`}>
                         {ent.plan}
                       </span>
                    </div>
                  </div>
                </div>
                <button 
                    onClick={() => setEditingEnt(ent)} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary-600 px-4 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors border border-gray-200 hover:border-primary-200 dark:bg-slate-700 dark:border-slate-600"
                >
                    <Edit2 className="w-4 h-4" /> Manage Enterprise
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <Shield className="w-3.5 h-3.5" /> Licenses
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Admins</span>
                        <span className="font-bold dark:text-slate-300">{ent.licenses[UserRole.ENTERPRISE_ADMIN]}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Users</span>
                        <span className="font-bold dark:text-slate-300">{ent.licenses[UserRole.COST_ENGINEER]}</span>
                      </div>
                   </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <Layers className="w-3.5 h-3.5" /> Modules
                   </div>
                   <div className="flex flex-wrap gap-1">
                      {(ent.modules || []).map(m => (
                        <span key={m} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-[9px] font-bold border dark:border-slate-700">{m}</span>
                      ))}
                   </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <Stamp className="w-3.5 h-3.5" /> Workflow
                   </div>
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Review Required</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ent.approvalRequired ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                          {ent.approvalRequired ? 'YES' : 'NO'}
                        </span>
                      </div>
                      {ent.approvalRequired && ent.approvalRules && ent.approvalRules.length > 0 && (
                        <div className="text-[10px] text-slate-500">
                          {ent.approvalRules.length} Mapping Rules Active
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <AtSign className="w-3.5 h-3.5" /> Primary Admin
                   </div>
                   <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate font-medium">
                      {ent.adminEmail}
                   </div>
                </div>
             </div>
          </div>
        ))}

        {enterprises.length === 0 && (
          <div className="p-20 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No Enterprises Found</h3>
            <p className="text-slate-500 mt-1">Create an enterprise organization to start allocating licenses.</p>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
             <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b z-10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-600" /> Provision New Enterprise
                </h3>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleCreate} className="p-8 space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                    <ShieldAlert className="w-5 h-5" /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Org Name</label>
                      <input required className="w-full border rounded-xl p-3 dark:bg-slate-900" placeholder="e.g. Acme Corp" value={newEnt.name} onChange={e => setNewEnt({...newEnt, name: e.target.value})} />
                   </div>
                   <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Domain (Restricted)</label>
                      <input required className="w-full border rounded-xl p-3 dark:bg-slate-900 font-mono" placeholder="acme.com" value={newEnt.domain} onChange={e => setNewEnt({...newEnt, domain: e.target.value.toLowerCase().trim()})} />
                   </div>
                   <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Name</label>
                      <input required className="w-full border rounded-xl p-3 dark:bg-slate-900" value={newEnt.adminName} onChange={e => setNewEnt({...newEnt, adminName: e.target.value})} />
                   </div>
                   <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Email (Must match domain)</label>
                      <input required type="email" className="w-full border rounded-xl p-3 dark:bg-slate-900 font-mono" value={newEnt.adminEmail} onChange={e => setNewEnt({...newEnt, adminEmail: e.target.value.toLowerCase().trim()})} />
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Plan & Capabilities</label>
                  <div className="flex gap-4">
                    {['FREE', 'PRO', 'ENTERPRISE'].map(p => (
                      <button key={p} type="button" onClick={() => setNewEnt({...newEnt, plan: p as any})} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${newEnt.plan === p ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-100 dark:border-slate-700 text-slate-400'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {(['MACHINING', 'MHR', 'CASTING', 'ASSEMBLY'] as ModuleType[]).map(m => (
                       <button key={m} type="button" onClick={() => toggleModule(m)} className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${newEnt.modules.includes(m) ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-100 text-slate-400'}`}>
                         {m}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">License Allocation</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[UserRole.ENTERPRISE_ADMIN, UserRole.COST_ENGINEER, UserRole.APPROVER, UserRole.VIEWER].map(role => (
                       <div key={role} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getRoleLabel(role)}</label>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full bg-transparent font-bold text-lg focus:outline-none" 
                            value={newEnt.licenses[role] || 0}
                            onChange={e => setNewEnt({
                              ...newEnt, 
                              licenses: { ...newEnt.licenses, [role]: parseInt(e.target.value) || 0 }
                            })}
                          />
                       </div>
                     ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2.5 text-slate-500 font-bold">Cancel</button>
                  <button type="submit" className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 active:scale-95 transition-all">Launch Enterprise</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* EDIT / MANAGE MODAL */}
      {editingEnt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
             <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b z-10 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-600" /> Manage Enterprise: {editingEnt.name}
                </h3>
                <button onClick={() => setEditingEnt(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleUpdate} className="p-8 space-y-8">
                
                {/* General Info (Read-Only Criticals) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Org Name</label>
                      <input className="w-full border rounded-lg p-2 dark:bg-slate-800 font-bold" value={editingEnt.name} onChange={e => setEditingEnt({...editingEnt, name: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Domain (Locked)</label>
                      <input disabled className="w-full border rounded-lg p-2 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-mono" value={editingEnt.domain} />
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Email (Locked)</label>
                      <input disabled className="w-full border rounded-lg p-2 dark:bg-slate-800 text-slate-500 cursor-not-allowed font-mono" value={editingEnt.adminEmail} />
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Plan & Modules</label>
                  <div className="flex gap-4">
                    {['FREE', 'PRO', 'ENTERPRISE'].map(p => (
                      <button key={p} type="button" onClick={() => setEditingEnt({...editingEnt, plan: p as any})} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${editingEnt.plan === p ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-100 dark:border-slate-700 text-slate-400'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {(['MACHINING', 'MHR', 'CASTING', 'ASSEMBLY'] as ModuleType[]).map(m => (
                       <button key={m} type="button" onClick={() => toggleModule(m, true)} className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${editingEnt.modules.includes(m) ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-100 text-slate-400'}`}>
                         {m}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">License Allocation</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[UserRole.ENTERPRISE_ADMIN, UserRole.COST_ENGINEER, UserRole.APPROVER, UserRole.VIEWER].map(role => (
                       <div key={role} className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{getRoleLabel(role)}</label>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full bg-transparent font-bold text-lg focus:outline-none" 
                            value={editingEnt.licenses[role] || 0}
                            onChange={e => setEditingEnt({
                              ...editingEnt, 
                              licenses: { ...editingEnt.licenses, [role]: parseInt(e.target.value) || 0 }
                            })}
                          />
                       </div>
                     ))}
                  </div>
                </div>

                {/* Workflow Governance - Dynamic List */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between p-4 border rounded-xl dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <div>
                            <div className="font-bold text-slate-800 dark:text-white">Mandatory Review Workflow</div>
                            <div className="text-xs text-slate-500">Lock calculations until signed by an Approver.</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setEditingEnt({...editingEnt, approvalRequired: !editingEnt.approvalRequired})}
                            className={`w-12 h-6 rounded-full relative transition-colors ${editingEnt.approvalRequired ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${editingEnt.approvalRequired ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                    
                    {editingEnt.approvalRequired && (
                        <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Doer to Approver Mapping</label>
                            
                            <div className="space-y-2">
                                {(!editingEnt.approvalRules || editingEnt.approvalRules.length === 0) && (
                                    <div className="text-center text-xs text-slate-400 py-2 italic">No mappings defined. Add a rule below.</div>
                                )}
                                
                                {(editingEnt.approvalRules || []).map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="flex-1 relative">
                                            <input 
                                                className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 font-mono"
                                                placeholder={`doer@${editingEnt.domain}`}
                                                value={rule.doerEmail}
                                                onChange={(e) => updateRule(idx, 'doerEmail', e.target.value)}
                                            />
                                            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">D</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="flex-1 relative">
                                            <input 
                                                className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm dark:bg-slate-800 dark:border-slate-600 font-mono"
                                                placeholder={`approver@${editingEnt.domain}`}
                                                value={rule.approverEmail}
                                                onChange={(e) => updateRule(idx, 'approverEmail', e.target.value)}
                                            />
                                            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">A</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeRule(idx)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button 
                                type="button" 
                                onClick={addRule}
                                className="mt-3 w-full py-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-3 h-3" /> Add Approval Link
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700">
                  <button type="button" onClick={() => setEditingEnt(null)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                  <button type="submit" className="px-8 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg active:scale-95 transition-all">Save Changes</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
