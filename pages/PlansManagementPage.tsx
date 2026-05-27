import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { SubscriptionPlan, User } from '../types';
import { localDb } from '../services/localDbService';
import { v4 as uuid } from 'uuid';
import { SUPER_ADMIN_EMAILS, DEFAULT_FREE_PLAN } from '../constants';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PlanEditModal } from '../components/PlanEditModal';
import { PlanPreviewModal } from '../components/PlanPreviewModal';

interface PlansManagementPageProps {
  onBack: () => void;
  user: User;
}

export const PlansManagementPage: React.FC<PlansManagementPageProps> = ({ onBack, user }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setIsEditModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    const init = async () => {
        try {
            setLoading(true);
            const [plansData, usersData] = await Promise.all([
              localDb.getAll<SubscriptionPlan>('subscription_plans'),
              localDb.getAll<User>('profiles')
            ]);
            
            setPlans(plansData || []);
            setUsers(usersData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    init();
  }, []);

  const getSubscribedUsersForPlan = (planName: string) => {
    return users.filter(u => u.plan_name === planName);
  };

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());

  const handleInitializeDefaultPlans = async () => {
    try {
        await localDb.upsert('subscription_plans', DEFAULT_FREE_PLAN);
        const data = await localDb.getAll<SubscriptionPlan>('subscription_plans');
        setPlans(data || []);
    } catch (e: any) {
        console.error(e);
        if (e.code === '42501') {
            alert("Permissions error: You do not have permission to manage subscription plans.");
        } else {
            alert("An error occurred while initializing plans.");
        }
    }
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handlePreviewPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsPreviewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedPlan) {
      try {
        await localDb.delete('subscription_plans', selectedPlan.id);
        setPlans(plans.filter((p) => p.id !== selectedPlan.id));
      } catch (e: any) {
         console.error(e);
         if (e.code === '42501') {
             alert("Permissions error: You do not have permission to delete this plan.");
         } else {
             alert("An error occurred while deleting the plan.");
         }
      }
    }
    setIsDeleteModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSavePlan = async (plan: SubscriptionPlan) => {
    try {
        if (plan.id) {
           const updated = await localDb.upsert('subscription_plans', plan);
           setPlans(plans.map(p => p.id === updated.id ? updated : p));
        } else {
           const newPlan = { ...plan, id: uuid() };
           const saved = await localDb.upsert('subscription_plans', newPlan);
           setPlans([...plans, saved]);
        }
        setIsEditModalOpen(false);
    } catch (e: any) {
         console.error(e);
         if (e.code === '42501') {
             alert("Permissions error: You do not have permission to manage this plan.");
         } else {
             alert("An error occurred while saving the plan.");
         }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border">
            <div className="flex items-center space-x-4">
                <Button variant="secondary" onClick={onBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </Button>
                <div>
                   <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">Subscription Plans</h1>
                   <p className="text-sm font-medium text-text-secondary">Manage available plans, limits and pricing.</p>
                </div>
            </div>
            <Button onClick={handleAddPlan} className="shadow-glow-primary">
                Add New Plan
            </Button>
        </div>

        <Card className="overflow-hidden">
            {loading ? (
                <div className="p-8 text-center text-text-muted">Loading plans...</div>
            ) : plans.length === 0 ? (
                <div className="p-8 text-center text-text-muted">
                    No plans found. 
                    {isSuperAdmin && <Button onClick={handleInitializeDefaultPlans} className="ml-4">Initialize Default Plans</Button>}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border">
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Plan Name</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Limit (Per Period)</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Price</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Period</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.id} className="border-b border-border hover:bg-surface/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-text-primary">{plan.name}</div>
                                        {plan.most_popular && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase ml-2">Popular</span>}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-text-secondary">
                                        {plan.calculation_limit === -1 ? 'Unlimited' : plan.calculation_limit}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-text-secondary">
                                        {plan.is_custom_price ? 'Custom' : (
                                           Object.entries(plan.prices || {}).map(([currency, data]: [string, any]) => (
                                                <div key={currency}>{data.price} {currency}</div>
                                           ))
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-text-secondary capitalize">
                                        {plan.period}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="secondary" onClick={() => handlePreviewPlan(plan)} className="mr-2">Preview</Button>
                                        <Button variant="secondary" onClick={() => handleEditPlan(plan)} className="mr-2">Edit</Button>
                                        <Button variant="danger" onClick={() => handleDeletePlan(plan)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>

        {isEditModalOpen && (
           <PlanEditModal 
             plan={selectedPlan}
             onClose={() => setIsEditModalOpen(false)}
             onSave={handleSavePlan}
           />
        )}

        {isPreviewModalOpen && (
           <PlanPreviewModal 
             plan={selectedPlan}
             onClose={() => {
               setIsPreviewModalOpen(false);
               setSelectedPlan(null);
             }}
           />
        )}
        
        {isDeleteModalOpen && (
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Plan"
                message={
                    <div>
                        <p className="mb-2">Are you sure you want to delete the plan "{selectedPlan?.name}"?</p>
                        {getSubscribedUsersForPlan(selectedPlan?.name || '').length > 0 && (
                            <div className="text-red-500 text-sm mt-2">
                                <p className="font-bold">Warning: The following users are on this plan:</p>
                                <ul className="list-disc pl-5">
                                    {getSubscribedUsersForPlan(selectedPlan?.name || '').map(u => <li key={u.id}>{u.email}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                }
                confirmText="Delete Plan"
                cancelText="Cancel"
            />
        )}
    </div>
  );
};
