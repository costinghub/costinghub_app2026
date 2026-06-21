
import React, { useState, useMemo } from 'react';
import { motion } from "framer-motion";
import type { Calculation, DashboardPageProps } from '../types';
import { Button } from '../components/ui/Button';
import { SpeedFeedSandbox } from '../components/SpeedFeedSandbox';
import { MaterialMatrix } from '../components/MaterialMatrix';
import { Card } from '../components/ui/Card';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { DEFAULT_CALCULATION_IDS, CURRENCY_CONVERSION_RATES_TO_USD } from '../constants';
import { Calculator, Flame, Hammer } from 'lucide-react';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; description?: string }> = ({ title, value, icon, description }) => (
  <Card className="flex flex-col">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold text-text-secondary">{title}</h3>
        <p className="text-4xl font-bold text-text-primary mt-1">{value}</p>
      </div>
      <div className="p-3 bg-primary/10 rounded-lg text-primary">{icon}</div>
    </div>
    {description && <p className="text-sm text-text-muted mt-2 flex-grow">{description}</p>}
  </Card>
);

const WelcomeBanner: React.FC<{ userName: string; onCreateClick: () => void }> = ({ userName, onCreateClick }) => (
  <div className="p-6 sm:p-8 rounded-xl bg-gradient-to-r from-primary to-secondary-accent text-white shadow-2xl shadow-primary/20">
    <h2 className="text-2xl sm:text-3xl font-bold">Welcome back, {userName}!</h2>
    <p className="mt-2 opacity-90 text-sm sm:text-base">Ready to calculate your next project? Let's get started.</p>
    <Button onClick={onCreateClick} className="mt-6 !bg-white !text-primary hover:!bg-gray-100 !font-bold w-full sm:w-auto">
      Create New Calculation
    </Button>
  </div>
);

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

// Fix: Removed userPlan from props as calculation_limit is now directly on the User object
export const DashboardPage: React.FC<DashboardPageProps> = ({ user, calculations, onNavigate, onEdit, onDelete, onViewResults, onUpgrade, isSuperAdmin, theme, activeModule = 'machining' }) => {
  const [calculationToDelete, setCalculationToDelete] = useState<Calculation | null>(null);

  const handleDeleteClick = (calc: Calculation) => {
    setCalculationToDelete(calc);
  };

  const confirmDelete = () => {
    if (calculationToDelete) {
      onDelete(calculationToDelete.id);
      setCalculationToDelete(null);
    }
  };

  // Fix: Use calculation_limit from user object instead of separate plan object
  const calculationLimit = user.calculation_limit ?? 5; 
  const lifetimeCount = user.calculations_created_this_period || 0;
  const isLimitReached = !isSuperAdmin && calculationLimit !== -1 && lifetimeCount >= calculationLimit;
  
  const handleLaunchCalculator = (type: 'machining' | 'casting' | 'forging') => {
    if (isLimitReached) {
      onUpgrade();
    } else {
      if (type === 'casting') {
        onNavigate('castingCalculator');
      } else if (type === 'forging') {
        onNavigate('forgingCalculator');
      } else {
        onNavigate('calculator'); // Default: Machining
      }
    }
  };
  
    const summaryStats = useMemo(() => {
        const finalCalculations = calculations.filter(c => c.status === 'final' && c.results);
        const totalFinal = finalCalculations.length;
        const totalDraft = calculations.length - totalFinal;

        const totalCostUSD = finalCalculations.reduce((acc, curr) => {
            const rate = CURRENCY_CONVERSION_RATES_TO_USD[curr.inputs.currency || 'USD'] || 1;
            const costInUSD = (curr.results?.costPerPart || 0) * rate;
            return acc + costInUSD;
        }, 0);

        const averageCost = totalFinal > 0 ? totalCostUSD / totalFinal : 0;


        return {
            totalCalculations: calculations.length,
            averageCost,
            statusBreakdown: {
                final: totalFinal,
                draft: totalDraft,
            }
        };
    }, [calculations]);
    
    const statusDoughnutData = useMemo(() => {
        return {
            labels: ['Final', 'Drafts'],
            datasets: [{
                data: [summaryStats.statusBreakdown.final, summaryStats.statusBreakdown.draft],
                backgroundColor: [
                    'rgba(139, 92, 246, 0.7)', // Primary color
                    'rgba(107, 114, 128, 0.5)'  // Gray / text-muted
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(107, 114, 128, 1)'
                ],
                borderWidth: 1,
            }]
        };
    }, [summaryStats]);
    
    const chartOptions = useMemo(() => {
      const textColor = theme === 'light' ? '#6B7280' : '#A0A0A0';
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right' as const,
            labels: {
              color: textColor
            }
          }
        }
      }
    }, [theme]);
    
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (baseId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(baseId)) {
        next.delete(baseId);
      } else {
        next.add(baseId);
      }
      return next;
    });
  };

  const groupedCalculations = useMemo(() => {
    const groups: { [baseId: string]: Calculation[] } = {};
    
    // Filter out hidden calculations
    const activeCalculations = calculations.filter(c => !c.is_hidden);
    
    activeCalculations.forEach(calc => {
      const baseId = calc.parent_id || calc.id;
      if (!groups[baseId]) {
        groups[baseId] = [];
      }
      groups[baseId].push(calc);
    });
    
    const list = Object.keys(groups).map(baseId => {
      const items = [...groups[baseId]].sort((a, b) => {
        const revA = a.revision_number || 0;
        const revB = b.revision_number || 0;
        if (revA !== revB) return revB - revA; // newest revision first
        return new Date(b.inputs.createdAt).getTime() - new Date(a.inputs.createdAt).getTime();
      });
      return {
        baseId,
        latest: items[0],
        history: items.slice(1),
        all: items,
      };
    });
    
    return list.sort((a, b) => 
      new Date(b.latest.inputs.createdAt).getTime() - new Date(a.latest.inputs.createdAt).getTime()
    );
  }, [calculations]);

  const filteredGroupedCalculations = useMemo(() => {
    return groupedCalculations.filter(group => {
      const type = group.latest.calculatorType || 'machining';
      return type === (activeModule || 'machining');
    });
  }, [groupedCalculations, activeModule]);

  const filterTitle = useMemo(() => {
    return {
      machining: "Machining Calculations",
      casting: "Casting Calculations",
      forging: "Forging Calculations"
    }[activeModule || 'machining'];
  }, [activeModule]);

  return (
    <div className="w-full mx-auto space-y-8 animate-fade-in pb-20">
       {calculationToDelete && (
        <ConfirmationModal
          title="Delete Calculation"
          message={`Are you sure you want to delete the calculation for part "${calculationToDelete.inputs.partNumber}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setCalculationToDelete(null)}
        />
      )}
      
      <WelcomeBanner userName={user.name || 'there'} onCreateClick={() => handleLaunchCalculator('machining')} />

      {/* Quick Workspace Launchpad */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Process Estimators
            </h2>
            <p className="text-xs text-text-secondary">
              Select standard or specialized casting / forging engines to calculate process cycles, scrap recovery, and tooling amortization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 max-w-xl mx-auto gap-6">
          
          {/* Card 1: Machining */}
          {activeModule === 'machining' && (
            <div
              id="launchpad-machining-card"
              className="group relative flex flex-col justify-between bg-surface border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:-translate-y-1.5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] dark:bg-emerald-400/[0.01] rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/[0.05] transition-all duration-300" />
              
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 scale-100 group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 tracking-wider border border-emerald-200/50 dark:border-emerald-900/30">
                    Subtractive
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Machining Calculator
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Estimate precision milling, turning, and drilling cycle runs, multi-stage shearing setups, tools degradation, and labor cost structures.
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Milling & Turning</span>
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Cycle Feed (Vc)</span>
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Carbide Tooling</span>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => handleLaunchCalculator('machining')}
                  className="w-full !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-semibold py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Launch Machining</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* Card 2: Casting */}
          {activeModule === 'casting' && (
            <div
              id="launchpad-casting-card"
              className="group relative flex flex-col justify-between bg-surface border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:-translate-y-1.5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] dark:bg-indigo-400/[0.01] rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/[0.05] transition-all duration-300" />
              
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 scale-100 group-hover:scale-110 transition-transform duration-300">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 tracking-wider border border-indigo-200/50 dark:border-indigo-900/30">
                    Foundry
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Casting Calculator
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Analyze raw material melt rate loss, casting mold cycle times, core binders consumption weights, returned scrap, and mold amortizations.
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Sand & Die Cast</span>
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Melt Loss</span>
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Mold Amortization</span>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => handleLaunchCalculator('casting')}
                  className="w-full !bg-indigo-600 hover:!bg-indigo-700 !text-white !font-semibold py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Launch Casting</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* Card 3: Forging */}
          {activeModule === 'forging' && (
            <div
              id="launchpad-forging-card"
              className="group relative flex flex-col justify-between bg-surface border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-rose-500/40 dark:hover:border-rose-500/30 hover:-translate-y-1.5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] dark:bg-rose-400/[0.01] rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/[0.05] transition-all duration-300" />
              
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400 border border-rose-100/50 scale-100 group-hover:scale-110 transition-transform duration-300">
                    <Hammer className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 tracking-wider border border-rose-200/50 dark:border-rose-900/30">
                    Deformative
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-text-primary group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Forging Calculator
                </h3>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  Estimate slot furnace heating costs, shearing blade rate values, hot-press impact cycles, trim flashes recovery, and forging die tooling sets.
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Hot & Cold Forge</span>
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Trim Recovery</span>
                  <span className="text-[10px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded text-text-muted border border-border/40">Die Tool Amortization</span>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => handleLaunchCalculator('forging')}
                  className="w-full !bg-rose-600 hover:!bg-rose-700 !text-white !font-semibold py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Launch Forging</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Summary & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCard 
            title="Total Calculations" 
            value={String(summaryStats.totalCalculations)} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <Card>
              <h3 className="text-lg font-semibold text-text-secondary mb-4">Status Breakdown</h3>
              <div className="h-32">
                  {summaryStats.totalCalculations > 0 ? (
                      <Doughnut data={statusDoughnutData} options={chartOptions} />
                  ) : (<p className="text-center text-text-muted">No data yet.</p>)}
              </div>
          </Card>
      </div>
      
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary">{filterTitle}</h2>
            <p className="text-xs text-text-secondary mt-1">Review, revise, or view analysis records from prior estimations.</p>
          </div>
          
          {/* Filtering tabs */}
          
        </div>

        {calculations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">You haven't created any calculations yet.</p>
          </div>
        ) : filteredGroupedCalculations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">No calculations found matching this selection.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Part Image</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Calc. No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Part Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Process</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cost/Part</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {filteredGroupedCalculations.map((group, index) => {
                    const calc = group.latest;
                    const hasHistory = group.history.length > 0;
                    const isExpanded = expandedGroups.has(group.baseId);
                    const isShowcase = DEFAULT_CALCULATION_IDS.has(calc.inputs.original_id!);
                    const pType = calc.calculatorType || 'machining';
                    return (
                      <React.Fragment key={group.baseId}>
                        <motion.tr 
                          className="transition-colors hover:bg-slate-50/50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)", scale: 1.002 }}
                          transition={{ duration: 0.3, delay: 0.02 * index }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
                                  {calc.inputs.partImage ? (
                                      <img className="h-full w-full object-cover" src={calc.inputs.partImage} alt="Part" />
                                  ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                  )}
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                            <div className="flex items-center space-x-2">
                              {hasHistory && (
                                <button 
                                  onClick={() => toggleGroup(group.baseId)} 
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-700 transition-all focus:outline-none"
                                  title="Toggle Revisions"
                                >
                                  <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                              <span>{calc.inputs.calculationNumber}</span>
                              {hasHistory && (
                                <span className="text-xxs bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-100/50">
                                  +{group.history.length} revs
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{calc.inputs.partName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {pType === 'casting' ? (
                              <span className="px-2.5 py-0.5 inline-flex text-xxs font-bold uppercase rounded-lg bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40">
                                Casting
                              </span>
                            ) : pType === 'forging' ? (
                              <span className="px-2.5 py-0.5 inline-flex text-xxs font-bold uppercase rounded-lg bg-rose-50 dark:bg-rose-950/45 text-rose-700 dark:text-rose-400 border border-rose-100/60 dark:border-rose-900/40">
                                Forging
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 inline-flex text-xxs font-bold uppercase rounded-lg bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/40">
                                Machining
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{new Date(calc.inputs.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                calc.status === 'final' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {calc.status === 'final' ? 'Final' : 'Draft'}
                              </span>
                              {isShowcase && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Showcase</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">{formatDuration(calc.duration_seconds)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                            {calc.status === 'final' && calc.results ? new Intl.NumberFormat('en-US', { style: 'currency', currency: calc.inputs.currency || 'USD' }).format(calc.results.costPerPart) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Button variant="secondary" onClick={() => onViewResults(calc)} disabled={calc.status === 'draft'}>View</Button>
                            <Button variant="secondary" onClick={() => onEdit(calc)}>Edit</Button>
                            <Button variant="secondary" onClick={() => handleDeleteClick(calc)} className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400">Delete</Button>
                          </td>
                        </motion.tr>
                        
                        {hasHistory && isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-900/10">
                            <td colSpan={9} className="px-8 py-3 bg-slate-50/30 dark:bg-transparent border-l-4 border-indigo-500">
                              <div className="pl-4 pr-2 py-2 space-y-3">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Revision History (Previous Versions)</span>
                                </div>
                                <div className="overflow-hidden border border-slate-200/60 dark:border-slate-800/80 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/40">
                                      <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Calc. No.</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Date</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Status</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Duration</th>
                                        <th className="px-4 py-2 text-left font-semibold text-slate-500 dark:text-slate-400">Cost/Part</th>
                                        <th className="px-4 py-2 text-right font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {group.history.map(prevCalc => (
                                        <tr key={prevCalc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                          <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-200">{prevCalc.inputs.calculationNumber}</td>
                                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{new Date(prevCalc.inputs.createdAt).toLocaleDateString()}</td>
                                          <td className="px-4 py-2.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${
                                              prevCalc.status === 'final' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                                            }`}>
                                              {prevCalc.status === 'final' ? 'Final' : 'Draft'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 font-mono">{formatDuration(prevCalc.duration_seconds)}</td>
                                          <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100 font-semibold">
                                            {prevCalc.status === 'final' && prevCalc.results ? new Intl.NumberFormat('en-US', { style: 'currency', currency: prevCalc.inputs.currency || 'USD' }).format(prevCalc.results.costPerPart) : 'N/A'}
                                          </td>
                                          <td className="px-4 py-2.5 text-right space-x-2">
                                            <button onClick={() => onViewResults(prevCalc)} disabled={prevCalc.status === 'draft'} className="text-primary hover:underline text-xs disabled:opacity-50 font-bold">View</button>
                                            <button onClick={() => onEdit(prevCalc)} className="text-indigo-600 hover:underline text-xs font-bold">Edit</button>
                                            <button onClick={() => handleDeleteClick(prevCalc)} className="text-red-600 hover:underline text-xs font-bold">Delete</button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden space-y-4">
              {filteredGroupedCalculations.map((group, index) => {
                const calc = group.latest;
                const hasHistory = group.history.length > 0;
                const isExpanded = expandedGroups.has(group.baseId);
                const isShowcase = DEFAULT_CALCULATION_IDS.has(calc.inputs.original_id!);
                return (
                  <motion.div 
                    key={group.baseId} 
                    className="bg-background/50 border border-border rounded-lg p-4 space-y-3 transition-colors hover:border-slate-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(249, 250, 251, 1)" }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden">
                                {calc.inputs.partImage ? (
                                    <img className="h-full w-full object-cover" src={calc.inputs.partImage} alt="Part" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-semibold text-text-primary text-base">{calc.inputs.partName}</h4>
                                    {calc.calculatorType === 'casting' ? (
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30">Casting</span>
                                    ) : calc.calculatorType === 'forging' ? (
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-50 dark:bg-rose-950/45 text-rose-600 dark:text-rose-400 border border-rose-100/30">Forging</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30">Machining</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-xs text-text-secondary">#{calc.inputs.calculationNumber}</p>
                                    {hasHistory && (
                                      <span className="text-xxs bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded font-semibold border border-indigo-100/55">
                                        +{group.history.length} revs
                                      </span>
                                    )}
                                  </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                             <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                calc.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {calc.status === 'final' ? 'Final' : 'Draft'}
                              </span>
                              {isShowcase && <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Showcase</span>}
                        </div>
                    </div>
                    
                    <div className="flex flex-col justify-between text-sm border-t border-border pt-2 gap-1.5">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Date:</span>
                          <span className="text-text-primary font-medium">{new Date(calc.inputs.createdAt).toLocaleDateString()}</span>
                        </div>
                        {calc.duration_seconds !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Time spent:</span>
                            <span className="text-text-primary font-mono">{formatDuration(calc.duration_seconds)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Cost/Part:</span>
                          <span className="font-bold text-primary">{calc.status === 'final' && calc.results ? new Intl.NumberFormat('en-US', { style: 'currency', currency: calc.inputs.currency || 'USD' }).format(calc.results.costPerPart) : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                        <Button variant="secondary" onClick={() => onViewResults(calc)} disabled={calc.status === 'draft'} className="text-xs justify-center">View</Button>
                        <Button variant="secondary" onClick={() => onEdit(calc)} className="text-xs justify-center">Edit</Button>
                        <Button variant="secondary" onClick={() => handleDeleteClick(calc)} className="text-xs justify-center text-red-600 border-red-300 hover:bg-red-50 font-bold">Delete</Button>
                    </div>

                    {hasHistory && (
                      <div className="pt-2 border-t border-border/60">
                        <button 
                          onClick={() => toggleGroup(group.baseId)} 
                          className="w-full flex justify-between items-center text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors focus:outline-none"
                        >
                          <span className="font-semibold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isExpanded ? "Hide Revision History" : `Show Revision History (${group.history.length})`}
                          </span>
                          <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isExpanded && (
                          <div className="space-y-3 mt-3 pl-3 border-l-2 border-indigo-500/80 bg-slate-50/30 dark:bg-slate-950/10 p-2 rounded-r-lg">
                            {group.history.map(prevCalc => (
                              <div key={prevCalc.id} className="p-2.5 border border-slate-200/50 dark:border-slate-800/80 rounded bg-white dark:bg-slate-900 space-y-2 text-xs text-text-secondary animate-fade-in">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-950 dark:text-slate-100">{prevCalc.inputs.calculationNumber}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xxs font-semibold ${prevCalc.status === 'final' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'}`}>
                                    {prevCalc.status === 'final' ? 'Final' : 'Draft'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xxs text-text-muted">
                                  <span>Date: {new Date(prevCalc.inputs.createdAt).toLocaleDateString()}</span>
                                  <span>Time: {formatDuration(prevCalc.duration_seconds)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <span className="font-bold text-primary">{prevCalc.status === 'final' && prevCalc.results ? new Intl.NumberFormat('en-US', { style: 'currency', currency: prevCalc.inputs.currency || 'USD' }).format(prevCalc.results.costPerPart) : 'N/A'}</span>
                                  <div className="flex space-x-1.5">
                                    <button onClick={() => onViewResults(prevCalc)} disabled={prevCalc.status === 'draft'} className="text-primary hover:underline font-bold text-xs disabled:opacity-50">View</button>
                                    <button onClick={() => onEdit(prevCalc)} className="text-indigo-600 hover:underline font-bold text-xs">Edit</button>
                                    <button onClick={() => handleDeleteClick(prevCalc)} className="text-red-500 hover:underline font-bold text-xs">Delete</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </Card>
      
      {/* Parallel Sandbox/Matrix */}
      {activeModule === 'machining' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <SpeedFeedSandbox />
          <MaterialMatrix />
        </div>
      )}
    </div>
  );
};
