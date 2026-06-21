import React, { useState } from 'react';
import type { LandingPageProps } from '../types';
import { 
  Calculator, 
  Cpu, 
  BarChart2, 
  Database, 
  Clock, 
  Zap, 
  ChevronRight, 
  Gauge,
  HelpCircle,
  Sparkles,
  Layers,
  Settings,
  Flame,
  Wrench,
  Activity,
  Hammer,
  ShieldCheck
} from 'lucide-react';

interface MaterialSnippet {
  name: string;
  category: string;
  density: number; // g/cm³
  machinability: number; // %
  hardness: string;
  baseVc: number; // m/min
  coolant: string;
  wearFactor: string;
  colorClass: string;
  badgeClass: string;
}

const MATERIAL_PRESETS: MaterialSnippet[] = [
  {
    name: "Aluminum 6061-T6",
    category: "Non-Ferrous",
    density: 2.70,
    machinability: 100,
    hardness: "95 HB",
    baseVc: 350,
    coolant: "Soluble Oil / Mist",
    wearFactor: "Very Low",
    colorClass: "from-emerald-500/20 to-teal-500/5 border-emerald-500/30",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
  },
  {
    name: "Stainless Steel 304",
    category: "Stainless Steel",
    density: 8.00,
    machinability: 45,
    hardness: "170 HB",
    baseVc: 110,
    coolant: "High concentration oil",
    wearFactor: "High (Work-Hardening)",
    colorClass: "from-blue-500/20 to-indigo-500/5 border-blue-500/30",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
  },
  {
    name: "Titanium Grade 5 (Ti-6Al-4V)",
    category: "Superalloys",
    density: 4.43,
    machinability: 22,
    hardness: "340 HB",
    baseVc: 55,
    coolant: "High Pressure Coolant",
    wearFactor: "Extreme",
    colorClass: "from-purple-500/20 to-pink-500/5 border-purple-500/30",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
  },
  {
    name: "Carbon Steel 1018",
    category: "Low Carbon Steel",
    density: 7.87,
    machinability: 70,
    hardness: "125 HB",
    baseVc: 210,
    coolant: "Emulsion / Flood",
    wearFactor: "Moderate",
    colorClass: "from-amber-500/20 to-orange-500/5 border-amber-500/30",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
  },
  {
    name: "Yellow Brass C360",
    category: "Copper Alloys",
    density: 8.50,
    machinability: 120,
    hardness: "80 HB",
    baseVc: 400,
    coolant: "Dry / Light Mist",
    wearFactor: "Minimal",
    colorClass: "from-rose-500/20 to-orange-500/5 border-rose-500/30",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
  }
];

const FORGING_TYPES = [
  { id: 'Closed Die Forging', name: 'Closed Die Forging', icon: Hammer, color: 'rose', description: 'Matched dies for high precision and complexity.' },
  { id: 'Open Die Forging', name: 'Open Die Forging', icon: Activity, color: 'amber', description: 'Flat or simple dies for large, robust components.' },
  { id: 'Ring Rolling', name: 'Ring Rolling', icon: Layers, color: 'blue', description: 'Specialized process for seamless circular rings.' },
  { id: 'Warm/Cold Forging', name: 'Warm/Cold Forging', icon: Zap, color: 'emerald', description: 'Near-net shape with superior surface finish.' },
];

const CASTING_TYPES = [
  { id: 'Sand Casting', name: 'Sand Casting', icon: Flame, color: 'orange', description: 'Silica-sand molds for all sizes.' },
  { id: 'HPDC', name: 'HPDC (High Pressure)', icon: Cpu, color: 'indigo', description: 'High-speed injection for precision parts.' },
  { id: 'LPDC', name: 'LPDC (Low Pressure)', icon: ShieldCheck, color: 'blue', description: 'Controlled filling for safety parts.' },
  { id: 'GDC', name: 'GDC (Gravity Die)', icon: Database, color: 'slate', description: 'Gravity metallic mold structural casting.' },
  { id: 'Investment Casting', name: 'Investment Casting', icon: Sparkles, color: 'teal', description: 'Lost-wax process for intricate detail.' },
  { id: 'Shell Moulding', name: 'Shell Moulding', icon: Layers, color: 'amber', description: 'High-precision resin sand shell molds.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigate, 
  user,
  session,
  calculationsCount = 0,
  materialsCount = 0,
  machinesCount = 0,
  processesCount = 0,
  toolsCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'machining' | 'casting' | 'forging'>('machining');
  const isPaidUser = (user.plan_name || 'Free').toLowerCase() !== 'free';
  const isEnterprise = (user.plan_name || 'Free').toLowerCase().includes('enterprise');
  const avatarUrl = session?.user?.user_metadata?.avatar_url;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16 text-left">
      
      <div className="flex flex-col gap-0.5 items-start">
          <h1 className="text-2xl font-bold tracking-wide text-text-primary">
            Costing<span className="text-primary font-extrabold ml-1">Hub</span>
          </h1>
          <p className="text-xs text-text-muted font-semibold tracking-normal mt-0.5">All Costs. One Hub.</p>
      </div>

      {/* High-Contrast Colorful Gradient Sub-Header Greeting */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 text-white p-6 rounded-xl text-left flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden shadow-lg border border-indigo-500/30">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-pink-500/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-spin-slow" />
            CostingHub Intelligent Office
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome, {user.name || 'System User'}!
          </h1>
          <p className="text-sm text-indigo-100 max-w-xl leading-relaxed">
            All machining rates, inventory costs, and raw materials integrated in one brilliant, high-fidelity office launcher. Calculate and optimize your margins instantly.
          </p>
        </div>
        
        {/* Real-time Enterprise Info Ribbon */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono relative z-10">
          <div className="bg-black/20 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-lg text-left">
            <span className="text-indigo-200 uppercase text-[9px] font-bold block mb-0.5">Tenant Profile</span>
            <span className="text-white font-extrabold text-sm">{user.companyName || 'Personal Workspace'}</span>
          </div>
          <div className="bg-black/20 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-lg text-left">
            <span className="text-indigo-200 uppercase text-[9px] font-bold block mb-0.5">Service Rate SLA</span>
            <span className="text-yellow-300 font-extrabold text-sm flex items-center gap-1">
              🏆 {user.plan_name || 'Essential'}
            </span>
          </div>
          <div className="bg-black/20 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-lg text-left">
            <span className="text-indigo-200 uppercase text-[9px] font-bold block mb-0.5">Time Capsule</span>
            <span className="text-white font-bold flex items-center gap-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 text-pink-300" /> UTC
            </span>
          </div>
        </div>
      </div>


      {/* Primary Grid Layout */}
      {/* Action Launchpad Grid */}
      <div className="bg-surface border border-border/80 p-5 rounded-xl shadow-sm relative overflow-hidden w-full text-left">
          {/* Ambient accent background blur */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-4 mb-6">
            <h2 className="text-sm font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              Module Launchpad
            </h2>
            
            <div className="flex bg-background p-1 rounded-xl border border-border">
              {(['machining', 'casting', 'forging'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                    activeTab === tab 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeTab === 'machining' && (
                <button 
                  id="btn-launch-machining"
                  onClick={() => onNavigate('calculator')}
                  className="group relative p-6 bg-gradient-to-br from-emerald-500/10 to-transparent hover:from-emerald-500 hover:to-teal-600 border border-emerald-500/30 hover:border-emerald-600 rounded-2xl text-left transition-all duration-300 select-none cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 col-span-full md:col-span-2"
                >
                  <div className="p-3 bg-emerald-500/10 group-hover:bg-white/20 rounded-xl max-w-max text-emerald-600 dark:text-emerald-400 group-hover:text-white mb-8">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-emerald-950 group-hover:text-white transition-colors">
                      Machining Precision Costing
                    </h3>
                    <p className="text-xs text-text-secondary group-hover:text-white/80 transition-colors mt-2 leading-relaxed max-w-md">
                      Detailed cycle time modeling for CNC vertical and horizontal milling, turning centers, and multi-axis drilling operations.
                    </p>
                    <div className="mt-4 flex items-center text-xs font-black text-emerald-600 group-hover:text-white uppercase tracking-widest">
                      Launch Module <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )}

              {activeTab === 'forging' && FORGING_TYPES.map((type) => (
                <button 
                  key={type.id}
                  id={`btn-launch-forging-${type.id}`}
                  onClick={() => {
                    localStorage.setItem('costinghub_initial_forging_type', type.id);
                    onNavigate('forgingCalculator');
                  }}
                  className="group relative p-5 bg-gradient-to-br from-rose-500/10 to-transparent hover:from-rose-500 hover:to-pink-600 border border-rose-500/30 hover:border-rose-600 rounded-xl text-left transition-all duration-300 select-none cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-2.5 bg-rose-500/10 group-hover:bg-white/20 rounded-lg max-w-max text-rose-600 dark:text-rose-400 group-hover:text-white mb-6">
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-rose-955 group-hover:text-white transition-colors uppercase tracking-tight">
                      {type.name}
                    </h3>
                    <p className="text-[10px] text-text-secondary group-hover:text-white/80 transition-colors mt-1.5 leading-normal font-medium">
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}

              {activeTab === 'casting' && CASTING_TYPES.map((type) => (
                <button 
                  key={type.id}
                  id={`btn-launch-casting-${type.id}`}
                  onClick={() => {
                    localStorage.setItem('costinghub_initial_casting_type', type.id);
                    onNavigate('castingCalculator');
                  }}
                  className="group relative p-5 bg-gradient-to-br from-indigo-500/10 to-transparent hover:from-indigo-600 hover:to-purple-700 border border-indigo-500/30 hover:border-indigo-600 rounded-xl text-left transition-all duration-300 select-none cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-2.5 bg-indigo-500/10 group-hover:bg-white/20 rounded-lg max-w-max text-indigo-600 dark:text-indigo-400 group-hover:text-white mb-6">
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-indigo-955 group-hover:text-white transition-colors uppercase tracking-tight">
                      {type.name}
                    </h3>
                    <p className="text-[10px] text-text-secondary group-hover:text-white/80 transition-colors mt-1.5 leading-normal font-medium">
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}
          </div>
      </div>

          <div className="mt-12 pt-8 border-t border-border/50 bg-surface/30 -mx-6 px-6 pb-8">
             <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center font-bold text-3xl text-primary overflow-hidden border-2 border-primary/10 shadow-md group transition-all">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                    <span>{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-surface flex items-center justify-center shadow-sm" title="Active Session">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-text-primary">{user.name || user.email}</h3>
                                {isPaidUser && <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />}
                            </div>
                            <p className="text-sm text-text-muted font-medium mb-3 flex items-center gap-2">
                                <span className="p-1 bg-background rounded-md"><Database className="w-3.5 h-3.5" /></span>
                                {user.companyName || 'Personal Manufacturing Workspace'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter mb-0.5">Tier Status</span>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider shadow-xs ${
                                        (user.plan_name || 'Free').toLowerCase().includes('enterprise')
                                            ? 'bg-purple-600 text-white shadow-purple-500/20'
                                            : (user.plan_name || 'Free').toLowerCase().includes('pro')
                                                ? 'bg-blue-600 text-white shadow-blue-500/20'
                                                : 'bg-primary text-white shadow-primary/20'
                                    }`}>
                                        {user.plan_name || 'Free'}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-border/50 mx-1" />
                                <div className="flex flex-col border-l border-border/0 pl-0">
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter mb-0.5">Calculations</span>
                                    <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-primary" />
                                        {calculationsCount} Recorded
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => onNavigate('settings')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-background hover:bg-background dark:hover:bg-background/80 border border-border rounded-xl text-xs font-bold font-mono transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group"
                        >
                            <Settings className="w-4 h-4 text-text-secondary group-hover:rotate-90 transition-transform duration-500" />
                            WORKSPACE SETTINGS
                        </button>
                        <button 
                            onClick={() => onNavigate('subscription')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white border border-primary/30 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            MANAGE SUBSCRIPTION
                        </button>
                    </div>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-2 opacity-30 select-none">
                    <div className="w-2 h-2 bg-text-muted rounded-full" />
                    <span className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Precision Engineered by CostingHub</span>
                    <div className="w-2 h-2 bg-text-muted rounded-full" />
                </div>
             </div>
          </div>
    </div>
  );
};
