import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { User, Calculation } from '../types';
import { localDb } from '../services/localDbService';
import { supabase } from '../services/supabaseClient';

interface EnterprisePageProps {
  user: User;
}

export const EnterprisePage: React.FC<EnterprisePageProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const calculateUserStats = (userId: string) => {
    const userCalcs = calculations.filter(c => c.user_id === userId);
    const approved = userCalcs.filter(c => c.approval_status === 'approved').length;
    return { total: userCalcs.length, approved };
  };

  const fetchEnterpriseData = async () => {
    try {
      const uData = await localDb.getAll<User>('profiles');
      setUsers(uData.filter(u => u.enterprise_id === user.enterprise_id || (user.role === 'enterprise_admin' && !u.enterprise_id))); // simplifying for demo

      const cData = await localDb.getAll<Calculation>('calculations');
      setCalculations(cData.filter(c => !c.is_hidden));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterpriseData();
  }, [user]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete user?')) return;
    try {
      await localDb.delete('profiles', id);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPass = prompt('Enter new password:');
    if (!newPass) return;
    try {
      const u = users.find(u => u.id === id);
      if (u) {
        await localDb.upsert('profiles', {...u, password: newPass});
        alert('Password reset!');
      }
    } catch (e) {
      console.error(e);
    }
  };

    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const pOverride = newUserPassword || 'Password123!';
            let finalUserId = 'user_' + Date.now().toString();
            try {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: newUserEmail,
                    password: pOverride,
                    options: {
                        data: {
                            name: newUserName,
                            full_name: newUserName,
                            role: 'enterprise_user',
                        }
                    }
                });
                if (authError) {
                    console.warn("Supabase Auth sign up yielded error: ", authError.message);
                }
                if (authData && authData.user) {
                    finalUserId = authData.user.id;
                }
            } catch (err) {
                console.warn("Supabase Auth registration yielded warning during enterprise user creation: ", err);
            }

            const body = {
                id: finalUserId,
                name: newUserName,
                email: newUserEmail,
                password: pOverride,
                role: 'enterprise_user',
                enterprise_id: user.enterprise_id || 'ent_' + user.id,
                plan_name: 'Enterprise',
                subscription_status: 'active',
                calculation_limit: 500,
                calculations_created_this_period: 0
            } as User;

            await localDb.upsert('profiles', body);
            setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
            fetchEnterpriseData();
        } catch(e) {
            console.error(e);
        }
    };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8 animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-text-primary">Enterprise Dashboard</h1>
           <p className="text-text-secondary mt-1">Manage users and oversee calculations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Add User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                    <Input label="Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                    <Input label="Email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                    <Input label="Password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                    <Button type="submit">Add User</Button>
                </form>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">User Management</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {users.map(u => {
                    const stats = calculateUserStats(u.id);
                    return (
                        <div key={u.id} className="p-4 border border-border rounded-lg bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div>
                                <p className="font-semibold text-text-primary">{u.name} <span className="text-xs text-text-muted">({u.role})</span></p>
                                <p className="text-sm text-text-secondary">{u.email}</p>
                                <div className="text-xs mt-2 text-text-muted">
                                    Calculations: {stats.total} created • {stats.approved} approved
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 sm:mt-0">
                                <Button variant="secondary" size="sm" onClick={() => handleResetPassword(u.id)}>Reset Pass</Button>
                                {u.id !== user.id && (
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
        </div>

        <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Calculation Approvals</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {calculations.map(c => {
                    const creator = users.find(u => u.id === c.user_id)?.name || 'Unknown';
                    return (
                        <div key={c.id} className="p-4 border border-border rounded-lg bg-background flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-text-primary">{c.name}</p>
                                <p className="text-xs text-text-secondary">By {creator} • Status: <span className="uppercase font-bold">{c.approval_status || 'pending'}</span></p>
                            </div>
                            {c.approval_status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={async () => {
                                        await localDb.upsert('calculations', { ...c, approval_status: 'approved' });
                                        fetchEnterpriseData();
                                    }}>Approve</Button>
                                    <Button variant="danger" size="sm" onClick={async () => {
                                        await localDb.upsert('calculations', { ...c, approval_status: 'rejected' });
                                        fetchEnterpriseData();
                                    }}>Reject</Button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </Card>
      </div>
    </div>
  );
};
