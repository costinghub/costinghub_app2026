import React from 'react';
import { Button } from './ui/Button';
import type { SubscriptionPlan } from '../types';

interface PlanPreviewModalProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
}

export const PlanPreviewModal: React.FC<PlanPreviewModalProps> = ({ plan, onClose }) => {
  if (!plan) return null;

  const features = plan.features && plan.features.length > 0 
    ? plan.features 
    : ['Basic calculations', 'Standard tools library access', 'CSV report export'];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-surface rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-border mt-10 max-h-[90vh] overflow-y-auto"
        id="plan-preview-modal"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border/60 mb-6">
          <div>
            <span className="text-[10px] font-black tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-1 rounded">Live Simulator</span>
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight mt-1">
              Pricing Card Preview
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Outer Layout explaining the view */}
        <p className="text-xs text-text-secondary font-medium mb-6">
          This is a pixel-perfect preview of how the <strong className="text-text-primary">"{plan.name}"</strong> plan card will render for end-users on your subscription checkout and upgrade widgets:
        </p>

        {/* Pricing Card Simulation Container */}
        <div className="flex justify-center p-4 sm:p-8 bg-background/40 rounded-2xl border border-border/50 mb-6 justify-items-center">
          <div className={`relative flex flex-col justify-between w-full max-w-sm rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
            plan.most_popular 
              ? 'bg-surface border-2 border-primary shadow-glow-primary scale-[1.02]' 
              : 'bg-surface border border-border shadow-md hover:border-border/80'
          }`}>
            
            {/* "Most Popular" Badge Ribbon */}
            {plan.most_popular && (
              <span className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Most Popular
              </span>
            )}

            <div>
              {/* Plan Title & Badge */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                    {plan.name || 'Unnamed Plan'}
                  </h3>
                  <p className="text-xs text-text-muted font-medium mt-1">Period: <span className="capitalize text-text-secondary font-bold">{plan.period}</span></p>
                </div>
                <div className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] px-2.5 py-1 rounded font-black uppercase tracking-wider">
                  {plan.calculation_limit === -1 ? 'Unlimited' : `${plan.calculation_limit} Calcs`}
                </div>
              </div>

              {/* Pricing Blocks */}
              <div className="border-t border-b border-border/40 py-4 my-4">
                {plan.is_custom_price ? (
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-text-primary tracking-tighter uppercase">Custom Pricing</span>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Administration</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Primary Currencies Displayed beautifully */}
                    {Object.entries(plan.prices || {}).map(([currency, opt]: [string, { price: number }]) => (
                      <div key={currency} className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-text-primary tracking-tighter">
                          {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : ''}{opt.price}
                        </span>
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                          {currency} / {plan.period === 'lifetime' ? 'once' : plan.period === 'yearly' ? 'yr' : 'mo'}
                        </span>
                      </div>
                    ))}
                    {(!plan.prices || Object.keys(plan.prices).length === 0) && (
                      <div className="text-3xl font-black text-text-primary tracking-tighter">Free</div>
                    )}
                  </div>
                )}
              </div>

              {/* Target Users / Limits Details */}
              <div className="text-xs text-text-secondary mb-6 font-medium bg-background/30 p-3 rounded-lg border border-border/50">
                <span className="font-bold text-text-primary">Billing Cycle Rules: </span>
                Quota of <span className="text-primary font-black">{plan.calculation_limit === -1 ? 'unlimited' : `${plan.calculation_limit}`} calculates</span> refreshes every {plan.period === 'lifetime' ? 'cycle' : plan.period === 'yearly' ? 'year' : 'month'}.
              </div>

              {/* Included Features List */}
              <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">What's Included:</p>
                <ul className="space-y-2.5">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <svg className="h-5 w-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Simulated CTA Action */}
            <Button 
              className={`w-full py-3.5 font-black uppercase tracking-widest text-xs rounded-xl shadow-md transition-transform active:scale-[0.98] ${
                plan.most_popular 
                  ? 'bg-primary text-white hover:bg-primary-hover shadow-glow-primary' 
                  : 'bg-background hover:bg-surface border-2 border-border text-text-primary hover:border-border-hover'
              }`}
              onClick={() => alert(`This CTA simulated: "${plan.cta || 'Select Plan'}"`)}
            >
              {plan.cta || 'Select Plan'}
            </Button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="font-bold border border-border"
          >
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
