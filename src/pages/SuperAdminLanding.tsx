
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, ShieldCheck, ArrowRight } from 'lucide-react';

export const SuperAdminLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      
      {/* Top Left Logo Branding */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
        <div className="flex flex-col justify-center">
          <div className="text-xl font-bold leading-none">
            <span className="text-slate-900 dark:text-white">Costing</span>
            <span className="text-purple-600 dark:text-purple-400">Hub</span>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-200/30 dark:bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 dark:bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="text-center mb-12 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary-100 border border-primary-200 text-primary-700 dark:bg-primary-900/50 dark:border-primary-700/50 dark:text-primary-300 text-sm font-medium mb-4">
          <ShieldCheck className="w-4 h-4" /> Super Administrator Access
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Welcome, Admin</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
          Manage the CostingHub platform or access user-level calculators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
        {/* Card 1: Admin Console */}
        <div 
          onClick={() => navigate('/enterprises')}
          className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 hover:border-primary-500 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 flex flex-col items-center text-center neon-hover"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 transition-colors">
            <Building2 className="w-10 h-10 text-primary-600 dark:text-primary-400 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Admin View</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Manage Enterprises, Licenses, Feature Toggles, and Subscription enforcement.
          </p>
          <div className="mt-auto flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-white">
            Enter Admin Console <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: User View */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 hover:border-purple-500 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/20 flex flex-col items-center text-center neon-hover"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
            <LayoutDashboard className="w-10 h-10 text-purple-600 dark:text-purple-400 group-hover:text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">User View</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Access Cost Calculators, Reports, and Masters as a standard user.
          </p>
          <div className="mt-auto flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium group-hover:text-purple-700 dark:group-hover:text-white">
            Launch Application <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="mt-12 text-slate-500 text-sm z-10">
        <p>System Version 2.4.0 • Managed by CostingHub</p>
      </div>
    </div>
  );
};
