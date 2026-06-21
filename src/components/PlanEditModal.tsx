import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { SubscriptionPlan } from '../types';

interface PlanEditModalProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (plan: SubscriptionPlan) => void;
}

export const PlanEditModal: React.FC<PlanEditModalProps> = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    calculation_limit: 10,
    period: 'monthly',
    prices: { USD: { price: 0 } },
    features: ['Basic calculations'],
    is_custom_price: false,
    cta: 'Select Plan',
    most_popular: false,
    payment_link: ''
  });

  const [featuresText, setFeaturesText] = useState('Basic calculations');
  const [usdPrice, setUsdPrice] = useState('0');
  const [inrPrice, setInrPrice] = useState('0');

  useEffect(() => {
    if (plan) {
      setFormData(plan);
      setFeaturesText(plan.features?.join('\n') || '');
      setUsdPrice(plan.prices?.USD?.price?.toString() || '0');
      setInrPrice(plan.prices?.INR?.price?.toString() || '0');
    }
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPlan = {
      ...formData,
      features: featuresText.split('\n').map(f => f.trim()).filter(f => f),
      prices: {
          USD: { price: parseFloat(usdPrice) || 0 },
          INR: { price: parseFloat(inrPrice) || 0 }
      }
    } as SubscriptionPlan;
    onSave(updatedPlan);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-border mt-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-6">
          {plan ? 'Edit Plan' : 'Create New Plan'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Plan Name</label>
                <Input 
                  required
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Pro Plan" 
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Calculation Limit</label>
                    <Input 
                      type="number" 
                      required
                      value={formData.calculation_limit === undefined || formData.calculation_limit === null || isNaN(formData.calculation_limit) ? '' : formData.calculation_limit} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, calculation_limit: isNaN(val) ? 0 : val});
                      }} 
                    />
                    <p className="text-[10px] text-text-muted">-1 for unlimited</p>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Period</label>
                    <select
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none"
                        value={formData.period || 'monthly'}
                        onChange={e => setFormData({...formData, period: e.target.value as any})}
                    >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Price (USD)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={usdPrice} 
                      onChange={e => setUsdPrice(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Price (INR)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={inrPrice} 
                      onChange={e => setInrPrice(e.target.value)} 
                    />
                </div>
            </div>
            
            <div className="space-y-2 flex items-center gap-2 mt-4">
                <input 
                  type="checkbox"
                  checked={formData.is_custom_price || false}
                  onChange={e => setFormData({...formData, is_custom_price: e.target.checked})}
                  className="rounded border-border text-primary focus:ring-primary bg-background"
                />
                <label className="text-sm font-bold text-text-primary">Is Custom Price?</label>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">CTA Text</label>
                <Input 
                  value={formData.cta || ''} 
                  onChange={e => setFormData({...formData, cta: e.target.value})} 
                  placeholder="e.g. Subscribe Now"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Payment Link</label>
                <Input 
                  value={formData.payment_link || ''} 
                  onChange={e => setFormData({...formData, payment_link: e.target.value})} 
                  placeholder="e.g. https://instamojo.com/@username/pay"
                />
                <p className="text-[10px] text-text-muted">Users clicking CTA will be redirected to this checkout gateway.</p>
            </div>
            
            <div className="space-y-2 flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={formData.most_popular || false}
                  onChange={e => setFormData({...formData, most_popular: e.target.checked})}
                  className="rounded border-border text-primary focus:ring-primary bg-background"
                />
                <label className="text-sm font-bold text-text-primary">Mark as Most Popular</label>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Features (One per line)</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-y"
                  value={featuresText} 
                  onChange={e => setFeaturesText(e.target.value)} 
                  placeholder="Unlimited storage&#10;Priority support"
                />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-border">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Plan</Button>
            </div>
        </form>
      </div>
    </div>
  );
};
