
import React, { useState, useEffect } from 'react';
import { Shield, Hammer, Calculator, Box, Wrench, CheckCircle2, Save, Info, ChevronDown, ChevronRight, Activity, Zap, Layers } from 'lucide-react';
import { PlanService, AuthService } from '../services/supabaseService';
import { ModuleType } from '../types';

type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

interface FeatureDef {
  id: string;
  label: string;
  description: string;
  icon?: any;
}

const MODULE_FEATURES: Record<ModuleType, FeatureDef[]> = {
  'MACHINING': [
    { id: 'BASIC_CALC', label: 'Basic Calculation', description: 'Standard cycle time and material costing.' },
    { id: 'REPORTS', label: 'Advanced Reports', description: 'PDF Export and detailed formatting.' },
    { id: 'AI_TOOLS', label: 'AI Process Suggestion', description: 'Gemini-powered operation planning.' },
    { id: 'BATCH_ESTIMATION', label: 'Batch Estimation', description: 'Mass upload and cost sheet generation.' },
  ],
  'MHR': [
    { id: 'BASIC_CALC', label: 'ZBC Calculator', description: 'Machine Hour Rate from first principles.' },
    { id: 'ANALYTICS', label: 'Cost Analytics', description: 'Breakdown charts and trend analysis.' },
    { id: 'POWER_ANALYSIS', label: 'Power Analysis', description: 'Detailed utility cost impact study.' },
  ],
  'CASTING': [
    { id: 'BASIC_CALC', label: 'Foundry Costing', description: 'Melting and Molding cost estimation.' },
    { id: 'MASTERS', label: 'Foundry Masters', description: 'Grade, Furnace, and Box management.' },
    { id: 'CORE_MGMT', label: 'Core Management', description: 'Multiple core process integration.' },
  ],
  'ASSEMBLY': [
    { id: 'BASIC_CALC', label: 'Assembly Costing', description: 'Prime cost aggregation.' },
    { id: 'BOM_MGMT', label: 'BOM Management', description: 'Detailed Bill of Materials tracking.' },
    { id: 'LABOR_MASTERS', label: 'Labor Masters', description: 'Skill-based labor rate management.' },
  ],
  'ADMIN': [
    { id: 'DATA_BACKUP', label: 'Data Backup & Restore', description: 'Export and import platform data via XML.' },
    { id: 'SETTINGS_ADVANCED', label: 'Advanced System Settings', description: 'Configuration of system sequence and prefixes.' },
  ]
};

const MODULE_INFO: Record<ModuleType, { label: string; icon: any; color: string }> = {
  'MACHINING': { label: 'Machining', icon: Hammer, color: 'text-blue-500' },
  'MHR': { label: 'MHR Calc', icon: Calculator, color: 'text-emerald-500' },
  'CASTING': { label: 'Casting', icon: Box, color: 'text-orange-500' },
  'ASSEMBLY': { label: 'Assembly', icon: Wrench, color: 'text-purple-500' },
  'ADMIN': { label: 'Admin & System', icon: Shield, color: 'text-slate-500' }
};

const PLANS: { id: PlanType; label: string; color: string; badge: string }[] = [
  { id: 'FREE', label: 'Free Plan', color: 'bg-slate-100 text-slate-700 border-slate-200', badge: 'bg-slate-500' },
  { id: 'PRO', label: 'Pro Plan', color: 'bg-primary-100 text-primary-700 border-primary-200', badge: 'bg-primary-600' },
  { id: 'ENTERPRISE', label: 'Enterprise Plan', color: 'bg-purple-100 text-purple-700 border-purple-200', badge: 'bg-purple-600' },
];

export const PlanFeatureManagement: React.FC = () => {
  const [activeModules, setActiveModules] = useState<Record<string, ModuleType[]>>({});
  const [subFeatures, setSubFeatures] = useState<Record<string, Record<string, string[]>>>({});
  const [expandedModule, setExpandedModule] = useState<ModuleType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
        try {
            const [modules, subs] = await Promise.all([
                PlanService.getPlanFeatures(),
                PlanService.getPlanSubFeatures()
            ]);
            
            // If data is empty, set all features to TRUE for the FREE plan by default
            const initialModules = modules || { FREE: ['MACHINING', 'MHR', 'CASTING', 'ASSEMBLY'] };
            const initialSubs = subs || { FREE: { MACHINING: ['BASIC_CALC', 'REPORTS', 'AI_TOOLS', 'BATCH_ESTIMATION'], MHR: ['BASIC_CALC', 'ANALYTICS', 'POWER_ANALYSIS'], CASTING: ['BASIC_CALC', 'MASTERS', 'CORE_MGMT'], ASSEMBLY: ['BASIC_CALC', 'BOM_MGMT', 'LABOR_MASTERS'] } };

            setActiveModules(initialModules);
            setSubFeatures(initialSubs);
        } catch (err) {
            console.error("Failed to load plan features", err);
        }
    };
    loadPlans();
  }, []);

  const toggleModule = (plan: PlanType, module: ModuleType) => {
    setActiveModules(prev => {
      const current = prev[plan] || [];
      const updated = current.includes(module) ? current.filter(m => m !== module) : [...current, module];
      return { ...prev, [plan]: updated };
    });
  };

  const toggleSubFeature = (plan: PlanType, module: ModuleType, featureId: string) => {
    setSubFeatures(prev => {
      const planMap = prev[plan] || {};
      const moduleList = planMap[module] || [];
      const updatedList = moduleList.includes(featureId) 
        ? moduleList.filter(f => f !== featureId) 
        : [...moduleList, featureId];
      
      return {
        ...prev,
        [plan]: {
          ...planMap,
          [module]: updatedList
        }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
        await Promise.all([
            PlanService.savePlanFeatures(activeModules),
            PlanService.savePlanSubFeatures(subFeatures)
        ]);
        
        await AuthService.refreshPlanContext();
        
        setMessage({ text: 'Global Plan Settings Saved Successfully!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
    } catch (err) {
        setMessage({ text: 'Failed to save settings. Please try again.', type: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-purple-600" /> Plan & Feature Console
          </h1>
          <p className="text-slate-500">Manage modular access and granular feature flags per subscription tier.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 font-bold neon-hover"
        >
          {isSaving ? <span className="animate-pulse flex items-center gap-2"><Zap className="w-4 h-4 animate-bounce" /> Syncing...</span> : <><Save className="w-5 h-5" /> Update All Plans</>}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 mb-4 px-6">
        <div className="col-span-4 text-xs font-bold text-slate-400 uppercase tracking-widest self-end pb-2">Module / Capability</div>
        {PLANS.map(plan => (
          <div key={plan.id} className="col-span-2 text-center">
             <div className={`px-3 py-2 rounded-t-xl font-bold text-sm ${plan.color} border-x border-t`}>
               {plan.label}
             </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {(Object.keys(MODULE_FEATURES) as ModuleType[]).map(moduleKey => {
          const info = MODULE_INFO[moduleKey];
          const isExpanded = expandedModule === moduleKey;
          const features = MODULE_FEATURES[moduleKey];

          return (
            <div key={moduleKey} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className={`grid grid-cols-12 gap-4 items-center p-4 ${isExpanded ? 'bg-gray-50 dark:bg-slate-900/50' : ''}`}>
                <div className="col-span-4 flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedModule(isExpanded ? null : moduleKey)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-slate-700 ${info.color}`}>
                    <info.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white leading-tight">{info.label} Module</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Global Access</div>
                  </div>
                </div>
                
                {PLANS.map(plan => {
                  const isActive = (activeModules[plan.id] || []).includes(moduleKey);
                  return (
                    <div key={plan.id} className="col-span-2 flex justify-center">
                      <button 
                        onClick={() => toggleModule(plan.id, moduleKey)}
                        className={`w-28 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          isActive 
                            ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 text-slate-400'
                        }`}
                      >
                        {isActive ? 'Module Enabled' : 'Disabled'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                  <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {features.map(feature => (
                      <div key={feature.id} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <div className="col-span-4 pl-12">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{feature.label}</div>
                          <div className="text-xs text-slate-500 leading-tight">{feature.description}</div>
                        </div>
                        
                        {PLANS.map(plan => {
                          const isModuleOn = (activeModules[plan.id] || []).includes(moduleKey);
                          const isEnabled = (subFeatures[plan.id]?.[moduleKey] || []).includes(feature.id);
                          
                          return (
                            <div key={plan.id} className="col-span-2 flex justify-center">
                              <button 
                                disabled={!isModuleOn}
                                onClick={() => toggleSubFeature(plan.id, moduleKey, feature.id)}
                                className={`relative group flex items-center justify-center p-1 rounded-full transition-all ${
                                  !isModuleOn ? 'opacity-20 grayscale cursor-not-allowed' : ''
                                }`}
                                title={!isModuleOn ? 'Parent Module Disabled' : ''}
                              >
                                <div className={`w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                   <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'left-7' : 'left-1.5'}`} />
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-900/30 p-3 px-6 text-[10px] text-slate-400 italic">
                    Note: Sub-features only function if the parent module is enabled for that plan.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl flex gap-4 shadow-sm">
          <Zap className="w-6 h-6 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-bold mb-1">Instant Enforcement</p>
            <p>Changes saved here are applied globally in real-time. Existing user sessions will reflect new feature flags immediately after save.</p>
          </div>
        </div>
        <div className="p-6 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-2xl flex gap-4 shadow-sm">
          <Layers className="w-6 h-6 text-orange-600 shrink-0" />
          <div className="text-sm text-orange-800 dark:text-blue-300">
            <p className="font-bold mb-1">Monetization Strategy</p>
            <p>Use these toggles to differentiate tiers. For example, reserve AI-powered process suggestions and batch estimation for the ENTERPRISE tier only.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
