import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PlanComparisonModal } from '../components/PlanComparisonModal';
import type { User, SubscriptionPlan } from '../types';

import { localDb } from '../services/localDbService';

interface SubscriptionPageProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (updates: Partial<User>) => Promise<void>;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onBack, onUpdateUser }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Check if current user subscription date is completed/expired
  useEffect(() => {
    if (user.subscription_expires_on && user.plan_name && user.plan_name.toLowerCase() !== 'free') {
      const expiry = new Date(user.subscription_expires_on);
      if (expiry < new Date()) {
        // Expiry date completed, move back to Free plan
        onUpdateUser({
          plan_name: 'Free',
          calculation_limit: 10,
          subscription_expires_on: null,
          subscription_status: 'expired'
        }).then(() => {
          setErrorMessage('Your subscription has completed and expired. You have been transferred back to the Free plan.');
        }).catch(err => console.error(err));
      }
    }
  }, [user, onUpdateUser]);

  // Listen for direct live Payhip success callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payhipStatus = params.get('payhip') || params.get('payment') || params.get('status');
    const paramPlan = params.get('plan') || params.get('plan_name');
    
    if ((payhipStatus === 'success' || payhipStatus === 'completed') && paramPlan) {
      const isPro = paramPlan.toLowerCase().includes('pro') || paramPlan.toLowerCase().includes('professional');
      const isEnterprise = paramPlan.toLowerCase().includes('enterprise');
      const targetLimit = isEnterprise ? -1 : isPro ? 100 : 10;
      
      const now = new Date();
      now.setMonth(now.getMonth() + 1); // Extend for 1 monthly period
      
      onUpdateUser({
        plan_name: paramPlan,
        calculation_limit: targetLimit,
        subscription_expires_on: now.toISOString(),
        subscription_status: 'active'
      }).then(() => {
        setSuccessMsg(`Live Redirect Upgraded! Congratulations, your account has been successfully upgraded to the "${paramPlan}" plan via global Payhip gateway.`);
        // Remove parameters securely
        try {
          window.history.replaceState({}, '', window.location.pathname);
        } catch (e) {}
      }).catch(err => {
        console.error('Failed to update live user plan via redirect:', err);
        setErrorMessage('Failed to automatically activate upgraded subscription. Please contact administration.');
      });
    }
  }, [onUpdateUser]);

  // Load available plans created/configured by Super Admin
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const data = await localDb.getAll<SubscriptionPlan>('subscription_plans');
        
        // Let's seed a dynamic Free plan if there are no plans in database to give a fallback
        if (!data || data.length === 0) {
          const fallbackPlans: SubscriptionPlan[] = [
            {
              id: 'free_tier_id',
              name: 'Free',
              calculation_limit: 10,
              prices: { USD: { price: 0 }, INR: { price: 0 } },
              period: 'monthly',
              is_custom_price: false,
              features: ['10 calculations/month', 'Basic standard tool database', 'PDF summary exports'],
              cta: 'Get Started',
              most_popular: false
            },
            {
              id: 'pro_tier_id',
              name: 'Professional Pro',
              calculation_limit: 100,
              prices: { USD: { price: 29 }, INR: { price: 2400 } },
              period: 'monthly',
              is_custom_price: false,
              features: ['100 calculations/month', 'Full materials master override', 'Enterprise multi-user controls', 'Priority email support'],
              cta: 'Subscribe Pro',
              most_popular: true,
              payment_link: ''
            }
          ];
          setPlans(fallbackPlans);
        } else {
          // Sort plans by price
          setPlans(data);
        }
      } catch (e) {
        console.error('Error fetching subscription plans:', e);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setCheckoutPlan(plan);
    setIsSimulatingPayment(true);
    setErrorMessage(null);
    setSuccessMsg(null);

    // If there is a payment link, open it in a new window/tab safely as requested
    if (plan.payment_link) {
      try {
        window.open(plan.payment_link, '_blank', 'noreferrer,noopener');
      } catch (err) {
        console.warn('Iframe blocked popup, running inline simulation.');
      }
    }
  };

  const handleSimulationSuccess = async () => {
    if (!checkoutPlan) return;

    // Calculate dynamic expiration date based on plan period
    let expiresAt: string | null = null;
    const now = new Date();
    if (checkoutPlan.period === 'monthly') {
      now.setMonth(now.getMonth() + 1);
      expiresAt = now.toISOString();
    } else if (checkoutPlan.period === 'yearly') {
      now.setFullYear(now.getFullYear() + 1);
      expiresAt = now.toISOString();
    } else {
      // Lifetime / infinite length
      expiresAt = null;
    }

    try {
      await onUpdateUser({
        plan_name: checkoutPlan.name,
        calculation_limit: checkoutPlan.calculation_limit,
        subscription_expires_on: expiresAt,
        subscription_status: 'active'
      });
      setSuccessMsg(`Congratulations! Your payment for "${checkoutPlan.name}" was successful, and your plan is now active.`);
      setIsSimulatingPayment(false);
      setCheckoutPlan(null);
    } catch (e) {
      setErrorMessage('Could not activate plan. Please try again.');
    }
  };

  const handleSimulationFailure = () => {
    setErrorMessage(`Payment failed or cancelled for "${checkoutPlan?.name}". Your subscription remains in its current state.`);
    setIsSimulatingPayment(false);
    setCheckoutPlan(null);
  };

  const usagePercentage = user.calculation_limit === -1 
    ? 0 
    : Math.min(100, (user.calculations_created_this_period / user.calculation_limit) * 100);

  // Check if plan matches current active user plan
  const isCurrentPlan = (plan: SubscriptionPlan) => {
    const activeName = user.plan_name || 'Free';
    return activeName.toLowerCase() === plan.name.toLowerCase();
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 animate-fade-in space-y-8">
      <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={onBack}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">Manage Subscription</h1>
            <p className="text-sm font-medium text-text-secondary">Track usage, active quotas and subscribe to plans</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-bold flex gap-2 items-center text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          {successMsg}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold flex gap-2 items-center text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {errorMessage}
        </div>
      )}

      {/* User usage and current status dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Current Subscription Details</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-text-primary uppercase tracking-tight">
                  {user.plan_name || 'Free'}
                </p>
                <p className="text-xs text-text-secondary">Current plan tier</p>
              </div>
              <span className="text-xs font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
                Active
              </span>
            </div>
            {user.subscription_expires_on && (
              <div className="border-t border-border/50 pt-3 text-xs font-bold text-text-secondary">
                Expires on: <span className="text-text-primary">{new Date(user.subscription_expires_on).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">Calculations quota usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-black text-text-primary tracking-tighter">
                {user.calculations_created_this_period}
                <span className="text-sm font-normal text-text-secondary ml-1">
                  / {user.calculation_limit === -1 ? 'Unlimited' : user.calculation_limit}
                </span>
              </span>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Used Calcs</span>
            </div>
            <div className="w-full bg-background h-2.5 rounded-full overflow-hidden border border-border">
              <div 
                className={`h-full transition-all duration-700 ease-out ${usagePercentage > 90 ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${user.calculation_limit === -1 ? 0 : usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Plans grid loaded from database/super admin */}
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Available Subscription Plans</h2>
            <p className="text-xs text-text-secondary">Select any of the curated packages designed to expand your limits.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowComparison(true)}>View Comparison</Button>
        </div>

        {showComparison && <PlanComparisonModal plans={plans} onClose={() => setShowComparison(false)} />}

        {loadingPlans ? (
          <div className="p-12 text-center text-text-muted font-bold">Loading active plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const current = isCurrentPlan(plan);
              
              return (
                <div 
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-xl p-6 sm:p-8 transition-all bg-surface border ${
                    current 
                      ? 'border-green-500/50 ring-2 ring-green-500/20 bg-green-500/5' 
                      : plan.most_popular 
                        ? 'border-primary shadow-glow-primary scale-[1.01]' 
                        : 'border-border hover:border-border/80'
                  }`}
                >
                  {plan.most_popular && !current && (
                    <span className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      Popular Choice
                    </span>
                  )}
                  {current && (
                    <span className="absolute top-0 right-6 -translate-y-1/2 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      Active Plan
                    </span>
                  )}

                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <h4 className="text-lg font-black text-text-primary uppercase tracking-tight">
                        {plan.name}
                      </h4>
                      <span className="text-[10px] font-bold text-text-secondary uppercase">
                        {plan.period}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="py-2 mb-4 border-t border-b border-border/40">
                      {plan.is_custom_price ? (
                        <div className="text-xl font-black text-text-primary uppercase tracking-tight">Custom price</div>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(plan.prices || {}).map(([cur, data]: [string, any]) => (
                            <div key={cur} className="flex items-baseline gap-1 text-text-primary">
                              <span className="text-2xl font-black">
                                {cur === 'INR' ? '₹' : cur === 'USD' ? '$' : ''}{data.price}
                              </span>
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                {cur}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-text-secondary mb-4">
                      Calculation limit: <strong className="text-text-primary">{plan.calculation_limit === -1 ? 'Unlimited' : `${plan.calculation_limit} / period`}</strong>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {(plan.features || []).map((feat, i) => (
                        <li key={i} className="flex gap-2 items-start text-xs text-text-secondary font-medium">
                          <svg className="h-4 w-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Activation Button */}
                  <Button
                    disabled={current}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full font-black uppercase tracking-widest text-[11px] py-3 rounded-lg ${
                      current 
                        ? 'bg-zinc-800 text-text-muted border border-border cursor-not-allowed font-bold' 
                        : plan.most_popular
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-glow-primary'
                          : 'bg-background hover:bg-surface border border-border text-text-primary'
                    }`}
                  >
                    {current ? 'Your Current Plan' : (plan.cta || 'Subscribe')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded payment overlay simulator */}
      {isSimulatingPayment && checkoutPlan && (
        <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <Card className="max-w-md w-full p-6 sm:p-8 space-y-6 border border-border shadow-2xl">
            <div className="text-center space-y-2">
              <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded ${checkoutPlan.payment_link ? 'bg-green-500/10 text-green-500 animate-pulse' : 'bg-primary/10 text-primary'}`}>
                {checkoutPlan.payment_link ? 'Live Payhip Gateway Active' : 'Sandbox Gateway Mode'}
              </span>
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Checkout Redirection</h3>
              <p className="text-xs text-text-secondary font-medium">
                We are launching the secure payment flow for the plan: <strong className="text-text-primary">"{checkoutPlan.name}"</strong>.
              </p>
            </div>

            {checkoutPlan.payment_link ? (
              <div className="space-y-4">
                <div className="bg-background/50 p-4 rounded-xl border border-border/80 text-xs font-mono break-all text-text-secondary">
                  <span className="font-bold text-text-primary block mb-1">Live Payhip Checkout Link:</span>
                  <a 
                    href={checkoutPlan.payment_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-bold text-center block py-1"
                  >
                    {checkoutPlan.payment_link}
                  </a>
                </div>
                
                <Button 
                  onClick={() => {
                    try { window.open(checkoutPlan.payment_link!, '_blank', 'noopener,noreferrer'); } catch(e) {}
                  }}
                  className="w-full bg-primary text-white hover:bg-primary-hover font-bold uppercase tracking-wider text-xs py-3 rounded-lg shadow-glow-primary flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Go to Live Payhip Secure Checkout
                </Button>

                <div className="bg-primary/5 p-4 rounded-xl text-[11px] font-medium border border-primary/20 leading-relaxed text-text-secondary">
                  <span className="font-bold text-text-primary block mb-1">💡 Live Payhip Gateway Guide:</span>
                  Set up your success/redirect URL in your Payhip product settings to:
                  <code className="block bg-background p-1.5 rounded mt-1 text-[10px] select-all border border-border">
                    {window.location.origin}/subscription?payhip=success&plan={encodeURIComponent(checkoutPlan.name)}
                  </code>
                  This will trigger instant dynamic account upgrades when shoppers complete a purchase.
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl text-xs font-medium">
                Notice: No payment gateway link has been pasted for this plan yet. Direct checkout will fallback to sandbox.
              </div>
            )}

            <div className="space-y-2 text-center text-xs text-text-secondary bg-surface p-4 rounded-xl border border-border">
              <span className="font-bold text-text-primary block mb-1">Payment Gateway Status</span>
              Please indicate the payment result manually if checkout is complete, or for sandbox simulation:
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleSimulationSuccess} 
                className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider text-xs py-2.5"
              >
                ✔ Success (Activate)
              </Button>
              <Button 
                onClick={handleSimulationFailure} 
                variant="danger" 
                className="font-bold uppercase tracking-wider text-xs py-2.5"
              >
                ✘ Fail / Cancel
              </Button>
            </div>

            <div className="flex justify-center pt-2 border-t border-border">
              <button 
                onClick={() => setIsSimulatingPayment(false)}
                className="text-xs text-text-muted hover:text-text-primary font-bold underline transition-colors"
              >
                Cancel, go back
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
