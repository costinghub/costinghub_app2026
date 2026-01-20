
import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, PieChart, AlertTriangle, X } from 'lucide-react';
import { AuthService } from '../services/supabaseService';
import { User, UserRole } from '../types';

export const UserManagement: React.FC = () => {
  const [team, setTeam] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.COST_ENGINEER });
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{role: UserRole, used: number, total: number}[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const members = await AuthService.getTeam();
    setTeam(members);
    const liveUsage = await AuthService.getLicenseUsage();
    setUsage(liveUsage);
  };

  const handleAdd = async () => {
    setError(null);
    const canAdd = await AuthService.canAddUser(newUser.role as UserRole);
    if (!canAdd) {
      setError(`License limit reached for ${getRoleLabel(newUser.role as UserRole)}. Contact Admin to upgrade.`);
      return;
    }

    try {
      const user: User = {
        id: `u-${Date.now()}`,
        name: newUser.name,
        email: newUser.email.toLowerCase().trim(),
        role: newUser.role as UserRole,
        plan: 'FREE' // Will be updated by organization sync
      };
      await AuthService.addTeamMember(user);
      await refreshData();
      setIsAdding(false);
      setNewUser({ name: '', email: '', role: UserRole.COST_ENGINEER });
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      await AuthService.deleteTeamMember(userId);
      await refreshData();
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === UserRole.COST_ENGINEER) return 'User';
    return role.replace('_', ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  return (
    <div className="max-w-6xl mx-auto">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Team Management</h1>
          <p className="text-slate-500">Manage users and permissions for your organization.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-primary-700 shadow-lg shadow-primary-500/20 font-bold transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
         {usage.map((stat) => {
           const pct = stat.total > 0 ? Math.min(100, (stat.used / stat.total) * 100) : 0;
           const isFull = stat.total > 0 && stat.used >= stat.total;
           const label = stat.role === UserRole.COST_ENGINEER ? 'USERS' : stat.role.split('_').pop() + 'S';
           
           return (
             <div key={stat.role} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                   <span className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-primary-600'}`}>{stat.used} / {stat.total}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                   <div className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-primary-600'}`} style={{ width: `${pct}%` }}></div>
                </div>
             </div>
           )
         })}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl mb-10 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg dark:text-white">Invite New Team Member</h3>
            <button onClick={() => {setIsAdding(false); setError(null);}} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
              <input className="w-full border rounded-xl p-3 dark:bg-slate-900" placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <input type="email" className="w-full border rounded-xl p-3 dark:bg-slate-900 font-mono" placeholder="user@company.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Platform Role</label>
              <select className="w-full border rounded-xl p-3 dark:bg-slate-900" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                <option value={UserRole.COST_ENGINEER}>User</option>
                <option value={UserRole.APPROVER}>Approver</option>
                <option value={UserRole.VIEWER}>Viewer</option>
                <option value={UserRole.ENTERPRISE_ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-700">
            <button onClick={() => {setIsAdding(false); setError(null);}} className="px-6 py-2.5 text-slate-500 font-bold">Cancel</button>
            <button 
              onClick={handleAdd} 
              disabled={!newUser.email || !newUser.name}
              className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
            >
              Add to Team
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
             <tr>
               <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Details</th>
               <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role Type</th>
               <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Status</th>
               <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {team.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 group">
                <td className="p-5">
                  <div className="font-bold text-slate-800 dark:text-white">{user.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                </td>
                <td className="p-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    user.role === UserRole.ENTERPRISE_ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    user.role === UserRole.APPROVER ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {user.role === UserRole.ENTERPRISE_ADMIN && <Shield className="w-3 h-3" />}
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="p-5">
                  <span className="text-green-600 text-xs font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 
                    ACTIVE
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button 
                    onClick={() => handleDelete(user.id)} 
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
