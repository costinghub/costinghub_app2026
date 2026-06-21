
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import type { UserEditModalProps, User } from '../types';

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onSave, onClose }) => {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [planName, setPlanName] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState('');
    const [calculationLimit, setCalculationLimit] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setName(user.name);
        setCompanyName(user.company_name || '');
        setPlanName(user.plan_name || 'Free');
        setSubscriptionStatus(user.subscription_status || 'active');
        setCalculationLimit(user.calculation_limit || 0); // Need to get calculation limit if it's there
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        const updates: Partial<User> = {
            name: name,
            companyName: companyName,
            plan_name: planName,
            subscription_status: subscriptionStatus,
            calculation_limit: calculationLimit
        };
        try {
            await onSave(user.id, updates);
        } catch (error) {
            console.error("Failed to save user updates", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <Card className="max-w-lg w-full relative my-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-xl font-bold text-primary mb-2 tracking-tight">Edit User Settings</h2>
                <p className="text-sm text-text-secondary mb-6">{user.email}</p>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Full Legal Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        <Input 
                            label="Operating Company"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Subscription Plan"
                            value={planName}
                            onChange={e => setPlanName(e.target.value)}
                            options={[
                                { value: 'Free', label: 'Free' },
                                { value: 'Professional', label: 'Professional' },
                                { value: 'Enterprise', label: 'Enterprise' },
                            ]}
                        />
                         <Select 
                            label="Status"
                            value={subscriptionStatus}
                            onChange={e => setSubscriptionStatus(e.target.value)}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'expired', label: 'Expired' },
                                { value: 'banned', label: 'Banned' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                    </div>
                    
                    <Input 
                        label="Calculation Limit (-1 for unlimited)"
                        type="number"
                        value={calculationLimit.toString()}
                        onChange={e => setCalculationLimit(parseInt(e.target.value))}
                    />
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
