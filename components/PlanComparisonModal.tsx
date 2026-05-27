import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { SubscriptionPlan } from '../types';

interface PlanComparisonModalProps {
  plans: SubscriptionPlan[];
  onClose: () => void;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({ plans, onClose }) => {
  // Get all unique features
  const allFeatures = Array.from(new Set(plans.flatMap(p => p.features || [])));

  return (
    <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <Card className="max-w-5xl w-full p-6 sm:p-8 space-y-6 border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Plan Comparison</h2>
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-text-secondary font-black">
              <tr>
                <th className="p-4 border-b border-border">Feature</th>
                {plans.map(plan => (
                  <th key={plan.id} className="p-4 border-b border-border">{plan.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-text-primary">
              <tr>
                <td className="p-4 border-b border-border font-bold">Calculation Limit</td>
                {plans.map(plan => (
                    <td key={plan.id} className="p-4 border-b border-border">
                        {plan.calculation_limit === -1 ? 'Unlimited' : `${plan.calculation_limit}`}
                    </td>
                ))}
              </tr>
              {allFeatures.map(feature => (
                <tr key={feature}>
                  <td className="p-4 border-b border-border">{feature}</td>
                  {plans.map(plan => (
                    <td key={plan.id} className="p-4 border-b border-border text-center">
                      {plan.features?.includes(feature) ? (
                        <svg className="h-5 w-5 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
