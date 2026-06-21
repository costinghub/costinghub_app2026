import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hammer, Calculator, Box, Wrench, ArrowRight, TrendingUp, MessageSquare, Lock, Loader2 } from 'lucide-react';
import { AuthService, DataService } from '../services/supabaseService';

const ModuleCard = ({ title, desc, icon: Icon, path, color, enabled }: any) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => enabled && navigate(path)}
      className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all group flex flex-col h-full relative overflow-hidden ${enabled ? 'cursor-pointer hover:shadow-md neon-hover' : 'opacity-60 grayscale cursor-not-allowed'}`}
    >
      {!enabled && (
        <div className="absolute top-3 right-3 bg-gray-100 dark:bg-slate-700 p-1.5 rounded-full">
           <Lock className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 ${enabled ? 'group-hover:scale-110 transition-transform' : ''}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">{desc}</p>
      <div className={`flex items-center text-sm font-medium ${enabled ? 'text-primary-600 group-hover:gap-2 transition-all mt-auto' : 'text-slate-400 mt-auto'}`}>
        {enabled ? <>Open <ArrowRight className="w-4 h-4 ml-1" /></> : 'Module Locked'}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({ createdThisMonth: 0, pendingApproval: 0, totalSavings: 0 });
  const [loading, setLoading] = useState(true);
  const [planTick, setPlanTick] = useState(0); // Force re-render on global feature changes
  
  const hasMachining = AuthService.hasModuleAccess('MACHINING');
  const hasMHR = AuthService.hasModuleAccess('MHR');
  const hasCasting = AuthService.hasModuleAccess('CASTING');
  const hasAssembly = AuthService.hasModuleAccess('ASSEMBLY');

  useEffect(() => {
    const handlePlanUpdate = () => setPlanTick(t => t + 1);
    window.addEventListener('ch-plan-updated', handlePlanUpdate);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const data = await DataService.getGlobalMetrics();
            setMetrics(data);
        } catch (e) {
            console.error("Dashboard Metrics Failed:", e);
        } finally {
            setLoading(false);
        }
    };
    fetchMetrics();

    return () => window.removeEventListener('ch-plan-updated', handlePlanUpdate);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to CostingHub</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Select a module to begin your estimation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg neon-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-2 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-sm font-medium bg-white/10 px-2 py-1 rounded">This Month</span>
          </div>
          <div className="text-3xl font-bold mb-1 flex items-center gap-2">
            {loading ? <Loader2 className="w-6 h-6 animate-spin opacity-50" /> : metrics.createdThisMonth}
          </div>
          <div className="text-primary-100 text-sm">Calculations Created</div>
        </div>
         <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm neon-hover">
          <div className="text-sm text-slate-500 mb-1 font-bold uppercase tracking-widest text-[10px]">Pending Approvals</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-200" /> : metrics.pendingApproval}
          </div>
          <div className={`text-xs font-medium ${metrics.pendingApproval > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
            {metrics.pendingApproval > 0 ? 'Requires attention' : 'All cleared'}
          </div>
        </div>
         <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm neon-hover">
          <div className="text-sm text-slate-500 mb-1 font-bold uppercase tracking-widest text-[10px]">Total Savings Identified</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
             {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-200" /> : `$${(metrics.totalSavings / 1000).toFixed(1)}k`}
          </div>
          <div className="text-xs text-green-500 font-medium">Efficiency Gains (ZBC)</div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Calculators & Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ModuleCard 
          title="Machining Cost Calculator" 
          desc="Detailed cycle time, material, and operational cost analysis."
          icon={Hammer}
          path="/machining"
          color="bg-blue-500"
          enabled={hasMachining}
        />
        <ModuleCard 
          title="Machine Hour Rate Calculator" 
          desc="Zero-Based Costing (ZBC) for Machine Hour Rates."
          icon={Calculator}
          path="/mhr"
          color="bg-emerald-500"
          enabled={hasMHR}
        />
        <ModuleCard 
          title="Green Sand Casting Cost Calculator" 
          desc="Estimate casting costs including melting, molding, and fettling."
          icon={Box}
          path="/casting"
          color="bg-orange-500"
          enabled={hasCasting}
        />
        <ModuleCard 
          title="Assembly Cost Calculator" 
          desc="BOM aggregation and labor integration."
          icon={Wrench}
          path="/assembly"
          color="bg-purple-500"
          enabled={hasAssembly}
        />
         <ModuleCard 
          title="Feedback" 
          desc="Share your experience or report bugs."
          icon={MessageSquare}
          path="/feedback"
          color="bg-pink-500"
          enabled={true}
        />
      </div>
    </div>
  );
};