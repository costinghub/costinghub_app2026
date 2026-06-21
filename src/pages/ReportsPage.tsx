import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import type { User, Calculation, MaterialMasterItem } from '../types';
import { localDb } from '../services/localDbService';
import { 
  BarChart2, 
  Settings2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Lightbulb, 
  Percent, 
  DollarSign, 
  Target, 
  Gauge, 
  Zap, 
  ArrowRight, 
  Activity, 
  Database,
  Layers,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';

interface ReportsPageProps {
  user: User;
  onEdit: (calculation: Calculation) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ user, onEdit }) => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard view toggle: 'overview' | 'gap-analysis'
  const [activeTab, setActiveTab] = useState<'overview' | 'gap-analysis'>('gap-analysis');

  // Selected calculation for Gap Analysis
  const [selectedCalcId, setSelectedCalcId] = useState<string>('sandbox-demo');

  // Sandbox optimization sliders state
  const [targetOee, setTargetOee] = useState<number>(85); // %
  const [setupTimeReduction, setSetupTimeReduction] = useState<number>(40); // %
  const [batchVolumeMultiplier, setBatchVolumeMultiplier] = useState<number>(2); // Multiplier

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [data, matData] = await Promise.all([
          localDb.getAll<Calculation>('calculations'),
          localDb.getAll<MaterialMasterItem>('materials')
        ]);
        
        // Filter calculations
        let availableCalculations: Calculation[] = [];
        if (user.role === 'enterprise_admin' || user.email === 'designersworldcbe@gmail.com') {
          availableCalculations = data.filter(c => !c.is_hidden);
        } else {
          availableCalculations = data.filter(c => c.user_id === user.id && !c.is_hidden);
        }
        
        setCalculations(availableCalculations);
        setMaterials(matData);
        
        // If there are real calculations, default the gap selection to the first one
        if (availableCalculations.length > 0) {
          setSelectedCalcId(availableCalculations[0].id);
        } else {
          setSelectedCalcId('sandbox-demo');
        }
      } catch (e) {
        console.error("Failed to load reports data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user]);

  const materialMap = useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach(m => map.set(m.id, m.name));
    return map;
  }, [materials]);

  // Totalized Metrics for Overview tab
  const totalQuoteValue = useMemo(() => {
    return calculations.reduce((sum, c) => sum + (c.results?.totalCost || 0), 0);
  }, [calculations]);

  const totalProfit = useMemo(() => {
    return calculations.reduce((sum, c) => {
      const profitPerPart = c.results?.markupCosts?.profit || 0;
      const batchVolume = c.inputs?.batchVolume || 1;
      return sum + (profitPerPart * batchVolume);
    }, 0);
  }, [calculations]);

  const totalTime = useMemo(() => {
    return calculations.reduce((sum, c) => sum + (c.results?.totalCuttingTimeMin || 0), 0);
  }, [calculations]);

  const formatValue = (val: number) => {
    return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // High-fidelity sandbox fallback calculation so that the user gets immediate, beautifully-rendered charts
  const sandboxDemoCalculation = useMemo<Calculation>(() => {
    return {
      id: 'sandbox-demo',
      name: 'Part CNC-449-Alpha (Sandboxed Demo)',
      status: 'final',
      user_id: user.id,
      created_at: new Date().toISOString(),
      inputs: {
        id: 'sandbox-input',
        calculationNumber: 'Q-2026-0042',
        partNumber: 'CNC-M-449',
        partName: 'Turbine Rotor Flange Alpha',
        customerName: 'AeroSpace Dynamics Inc.',
        revision: 'B-4',
        createdAt: new Date().toISOString(),
        annualVolume: 1200,
        batchVolume: 50,
        unitSystem: 'Metric',
        region: 'US-East',
        currency: 'USD',
        materialCategory: 'S - Superalloys & Titanium',
        materialType: 'Titanium Grade 5',
        rawMaterialProcess: 'Billet',
        billetShape: 'Cylinder',
        rawMaterialWeightKg: 12.4,
        finishedPartWeightKg: 4.8,
        partSurfaceAreaM2: 0.18,
        materialCostPerKg: 48.00,
        materialDensityGcm3: 4.43,
        transportCostPerKg: 2.25,
        heatTreatmentCostPerKg: 3.50,
        surfaceTreatments: [],
        setups: [
          {
            id: 'demo-setup-1',
            name: 'OP 10: Face Milling & Turn Outer Profile',
            timePerSetupMin: 45,
            toolChangeTimeSec: 15,
            efficiency: 72,
            machineId: 'm1',
            machineType: '5-Axis CNC Milling Center',
            operations: [
              { id: 'op1', processName: 'Face Milling', parameters: { feed: 240, speed: 1800 }, toolName: 'Carbide End Mill D20' },
              { id: 'op2', processName: 'Turning', parameters: { feed: 150, speed: 1200 }, toolName: 'Roughing Insert CNMG' }
            ]
          }
        ],
        markups: {
          general: 8,
          admin: 5,
          sales: 4,
          miscellaneous: 2,
          packing: 3,
          transport: 4,
          profit: 15,
          duty: 0
        }
      },
      results: {
        rawMaterialWeightKg: 12.4,
        finishedPartWeightKg: 4.8,
        totalMaterialCostPerKg: 48.0,
        rawMaterialPartCost: 595.20,
        materialCost: 654.72,
        surfaceTreatmentCost: 0,
        operationTimeBreakdown: [
          { id: 'op1', processName: 'Face Milling', timeMin: 28.5 },
          { id: 'op2', processName: 'Turning', timeMin: 14.8 }
        ],
        totalCuttingTimeMin: 43.3,
        totalSetupTimeMin: 45.0,
        totalToolChangeTimeMin: 2.5,
        cycleTimePerPartMin: 43.3,
        totalMachineTimeHours: 2.15,
        machiningCost: 195.0, // Based on $90/hr
        toolCost: 32.5,
        markupCosts: {
          general: 68.2,
          admin: 42.6,
          sales: 34.1,
          miscellaneous: 17.0,
          packing: 25.6,
          transport: 34.1,
          profit: 127.8,
          duty: 0
        },
        totalCost: 1142.62,
        costPerPart: 1142.62
      }
    };
  }, [user]);

  // Combined selector calculation
  const activeCalc = useMemo<Calculation>(() => {
    if (selectedCalcId === 'sandbox-demo') {
      return sandboxDemoCalculation;
    }
    const found = calculations.find(c => c.id === selectedCalcId);
    return found || sandboxDemoCalculation;
  }, [selectedCalcId, calculations, sandboxDemoCalculation]);

  // Extract variables for Gap Analysis from active calculation
  const gapMetrics = useMemo(() => {
    const inputs = activeCalc.inputs;
    const results = activeCalc.results;
    const calcType = activeCalc.calculatorType || 'machining';

    if (!results) {
      return {
        calcType,
        setupTimeMin: 0,
        cuttingTimeMin: 0,
        efficiencyCurrent: 70,
        materialYieldRate: 100,
        setupRatio: 0,
        costPerPart: 0,
        materialCost: 0,
        manufacturingCost: 0,
        toolingCost: 0,
        annualVolume: 1,
        batchVolume: 1
      };
    }

    let setupTimeMin = 0;
    let cuttingTimeMin = 0;
    let efficiencyCurrent = 70;
    let materialYieldRate = 100;
    let setupRatio = 0;
    const costPerPart = results.costPerPart || 0;
    let materialCost = 0;
    let manufacturingCost = 0;
    let toolingCost = 0;
    const batchVolume = inputs.batchVolume || 1;
    const annualVolume = inputs.annualVolume || 1;

    if (calcType === 'casting') {
      efficiencyCurrent = inputs.yieldRate ? Math.round(inputs.yieldRate * 100) : 75;
      materialYieldRate = inputs.yieldRate ? Math.round(inputs.yieldRate * 100) : 75;
      materialCost = results.netMaterialCostPerPart || results.rawMaterialPartCost || 0;
      
      // Manufacturing = melting + molding + pouring + fettling
      manufacturingCost = (results.meltingCostPerPart || 0) + 
                          (results.moldingCostPerPart || 0) + 
                          (results.pouringCostPerPart || 0) + 
                          (results.fettlingCostPerPart || 0);
      toolingCost = results.toolingAmortizedCostPerPart || 0;
      
      setupRatio = toolingCost > 0 && costPerPart > 0 ? (toolingCost / costPerPart) * 100 : 8;
    } else if (calcType === 'forging') {
      efficiencyCurrent = inputs.yieldRate ? Math.round(inputs.yieldRate * 100) : 80;
      materialYieldRate = inputs.yieldRate ? Math.round(inputs.yieldRate * 100) : 80;
      materialCost = results.netMaterialCostPerPart || results.rawMaterialBilletCost || 0;
      
      // Manufacturing = heating + shearing + press + trimming
      manufacturingCost = (results.heatingCostPerPart || 0) + 
                          (results.shearingCostPerPart || 0) + 
                          (results.forgingPressCostPerPart || 0) + 
                          (results.trimmingCostPerPart || 0);
      toolingCost = results.toolingAmortizedCostPerPart || 0;
      
      setupRatio = toolingCost > 0 && costPerPart > 0 ? (toolingCost / costPerPart) * 100 : 12;
    } else {
      // Machining default
      setupTimeMin = results.totalSetupTimeMin || 0;
      cuttingTimeMin = results.totalCuttingTimeMin || 0;
      efficiencyCurrent = inputs.setups?.[0]?.efficiency || 70;
      
      if (inputs.rawMaterialWeightKg && inputs.finishedPartWeightKg) {
        materialYieldRate = Math.round((inputs.finishedPartWeightKg / inputs.rawMaterialWeightKg) * 100);
      }
      
      const totalBatchRunTimeMin = (cuttingTimeMin * batchVolume) + setupTimeMin;
      setupRatio = totalBatchRunTimeMin > 0 ? (setupTimeMin / totalBatchRunTimeMin) * 100 : 0;
      
      materialCost = results.materialCost || 0;
      manufacturingCost = results.machiningCost || 0;
      toolingCost = results.toolCost || results.toolingAmortizedCostPerPart || 0;
    }

    return {
      calcType,
      setupTimeMin,
      cuttingTimeMin,
      efficiencyCurrent,
      materialYieldRate,
      setupRatio,
      costPerPart,
      materialCost,
      manufacturingCost,
      toolingCost,
      annualVolume,
      batchVolume
    };
  }, [activeCalc]);


  // Live Optimized calculations based on Sandbox controls
  const optimizedResults = useMemo(() => {
    const { 
      calcType,
      costPerPart, 
      materialCost, 
      manufacturingCost, 
      toolingCost,
      efficiencyCurrent, 
      annualVolume,
      batchVolume,
    } = gapMetrics;

    // 1. Efficiency optimization effect on Manufacturing Cost
    // If efficiency target is higher, manufacturing cost drops
    const efficiencyImprovementRatio = efficiencyCurrent > 0 ? (efficiencyCurrent / targetOee) : 1;
    // Cap at a realistic limit
    const newManufacturingCost = manufacturingCost * Math.max(0.4, efficiencyImprovementRatio);

    // 2. Setup/Scrap reduction factor
    const setupReductionMultiplier = (100 - setupTimeReduction) / 100;

    // 3. Batch volume amortization effect (Scale savings)
    const optBatchSize = batchVolume * batchVolumeMultiplier;
    // Setup/Die tooling cost scales down across larger batch run
    const newToolingCost = (toolingCost * setupReductionMultiplier) / batchVolumeMultiplier;

    // Other costs (markups etc.)
    const otherCosts = Math.max(costPerPart - materialCost - manufacturingCost - toolingCost, 0);
    // Bullet bulk scale savings on materials (up to 3%)
    const materialScaleSavings = Math.max(0.97, 1 - (batchVolumeMultiplier - 1) * 0.005);
    const newMaterialCost = materialCost * materialScaleSavings;

    // Optimized cost sum
    const optimizedCost = Math.max(newMaterialCost + newManufacturingCost + newToolingCost + otherCosts, costPerPart * 0.35);
    const savingsPerPart = Math.max(costPerPart - optimizedCost, 0);
    const totalAnnualSavings = savingsPerPart * annualVolume;

    return {
      optimizedCost,
      savingsPerPart,
      totalAnnualSavings,
      efficiencyCurrent,
      targetOee,
      optBatchSize
    };
  }, [gapMetrics, targetOee, setupTimeReduction, batchVolumeMultiplier]);


  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="p-3 bg-primary/10 rounded-full text-primary animate-pulse mb-3">
          <Activity className="w-8 h-8 spin" />
        </div>
        <p className="text-text-secondary text-sm font-bold font-mono">Synthesizing Cost Gaps & Simulating Results...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 animate-fade-in space-y-6 text-left">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            System Metrics & Gap Optimizer
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Evaluate machinery cycle efficiencies, identify overhead anomalies, and simulate potential cost optimization paths.
          </p>
        </div>

        {/* Dynamic Action Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/85 p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> System Runs & Logs
          </button>
          <button
            onClick={() => setActiveTab('gap-analysis')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gap-analysis'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Target className="w-4 h-4" /> Cost & Gap Optimizer
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-indigo-500/10 p-5 rounded-xl shadow-xs text-left relative overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Cumulative Designs</span>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono flex items-baseline gap-1.5">
                {calculations.length} <span className="text-xs text-text-muted font-bold">RUNS</span>
              </p>
            </div>

            <div className="bg-surface border border-emerald-500/10 p-5 rounded-xl shadow-xs text-left relative overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Gross Estimations</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {formatValue(totalQuoteValue)}
              </p>
            </div>

            <div className="bg-surface border border-pink-500/10 p-5 rounded-xl shadow-xs text-left relative overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Accumulated Profits</span>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1 font-mono">
                {formatValue(totalProfit)}
              </p>
            </div>

            <div className="bg-surface border border-amber-500/10 p-5 rounded-xl shadow-xs text-left relative overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Operational Machine Hours</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-orange-400 mt-1 font-mono">
                {(totalTime / 60).toFixed(1)} <span className="text-xs text-text-muted font-bold">HRS</span>
              </p>
            </div>
          </div>

          {/* Table list */}
          <Card className="p-5 border border-border overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-500" /> Saved Design History
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/80 text-[11px] uppercase tracking-wider text-text-muted font-bold">
                    <th className="py-2.5 px-3">Part Name / Info</th>
                    <th className="py-2.5 px-3">Part Code</th>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Batch Vol</th>
                    <th className="py-2.5 px-3">Material Master</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Rev</th>
                    <th className="py-2.5 px-3 text-right">Logged At</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border/40">
                  {calculations.map(c => (
                    <tr 
                      key={c.id} 
                      className="hover:bg-primary/5 transition cursor-pointer" 
                      onClick={() => onEdit(c)}
                    >
                      <td className="py-3 px-3">
                        <span className="font-bold text-text-primary block">{c.inputs.partName}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-text-secondary">{c.inputs.partNumber}</td>
                      <td className="py-3 px-3 text-text-secondary font-medium">{c.inputs.customerName}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">
                        ${c.results?.costPerPart?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-text-secondary">{c.inputs.batchVolume}</td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 dark:bg-slate-800 border border-border/50 rounded px-1.5 py-0.5 text-[10px] text-text-secondary font-mono">
                          {materialMap.get(c.inputs.materialType) || c.inputs.materialType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] uppercase font-bold text-indigo-500">
                        {c.calculatorType || 'machining'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-600 font-bold">{c.inputs.revision}</td>
                      <td className="py-3 px-3 text-right font-mono text-text-muted text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {calculations.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-text-muted font-mono">
                        No calculations logged yet. Use the "Cost & Gap Optimizer" tab to explore dynamic simulation models.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* RENDER TAB 2: INTERACTIVE MACHINERY GAP ANALYSIS */}
      {activeTab === 'gap-analysis' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Active Calculation Selector Strip */}
          <div className="bg-gradient-to-r from-indigo-50 via-indigo-50/10 to-transparent dark:from-indigo-950/10 border border-indigo-500/15 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                <Settings2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-300 block tracking-wider">
                  Select Design to Diagnose & Optimize
                </span>
                <p className="text-xs text-text-secondary">
                  Simulating cost reduction opportunities and efficiency gains based on this design's parameters.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                id="gap-calculation-selector"
                value={selectedCalcId}
                onChange={(e) => {
                  setSelectedCalcId(e.target.value);
                  const isDemo = e.target.value === 'sandbox-demo';
                  const source = isDemo ? sandboxDemoCalculation : calculations.find(c => c.id === e.target.value);
                  if (source) {
                    const originalEfficiency = source.calculatorType === 'casting' || source.calculatorType === 'forging' 
                      ? (source.inputs?.yieldRate ? Math.round(source.inputs.yieldRate * 100) : 75)
                      : (source.inputs?.setups?.[0]?.efficiency || 70);
                    setTargetOee(Math.min(95, Math.max(80, originalEfficiency + 10)));
                  }
                }}
                className="bg-background border border-indigo-500/20 text-text-primary px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-600 transition shadow-xs max-w-xs"
              >
                <option value="sandbox-demo">🔩 Demo: Turbine Rotor Flange (Machining)</option>
                {calculations.map(c => (
                  <option key={c.id} value={c.id}>
                    📦 {c.inputs.partName} ({c.calculatorType || 'machining'})
                  </option>
                ))}
              </select>
              
              {selectedCalcId === 'sandbox-demo' && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded font-bold uppercase select-none font-mono">
                  Sandbox Demo Code
                </span>
              )}
            </div>
          </div>

          {/* Split Screen Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 4 cols: Current Diagnostic & Gap Meters */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <Card className="p-5 border border-border shadow-xs">
                <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest border-b border-border/50 pb-2 mb-4 flex items-center gap-1.5">
                  <Gauge className="w-4.5 h-4.5 text-indigo-600" />
                  Baseline Diagnostics
                </h3>

                <div className="space-y-4">
                  
                  {/* Performance Gap OEE Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-text-primary">
                      <span>
                        {gapMetrics.calcType === 'casting' ? 'Casting Scrap Yield Rate' : 
                         gapMetrics.calcType === 'forging' ? 'Forging Material Yield Rate' : 
                         'Operational Efficiency (OEE)'}
                      </span>
                      <span className="font-mono text-indigo-600">{gapMetrics.efficiencyCurrent}%</span>
                    </div>
                    {/* Multi-tier progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${gapMetrics.efficiencyCurrent}%` }} 
                        className="bg-indigo-500 h-full rounded-l-full" 
                      />
                      <div 
                        style={{ width: `${Math.max(0, 85 - gapMetrics.efficiencyCurrent)}%` }} 
                        className="bg-indigo-500/15 h-full" 
                        title="Ideal Standard Target"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-muted font-mono">
                      <span>Baseline ({gapMetrics.efficiencyCurrent}%)</span>
                      <span className="text-indigo-600 font-bold">Optimal Target (85%)</span>
                    </div>
                  </div>

                  {/* Setup overhead ratio parameter */}
                  <div className="space-y-1.5 border-t border-border/50 pt-3">
                    <div className="flex justify-between text-xs font-bold text-text-primary">
                      <span>
                        {gapMetrics.calcType === 'casting' ? 'Pattern Tooling Cost Ratio' : 
                         gapMetrics.calcType === 'forging' ? 'Die Tooling Cost Ratio' : 
                         'Setup Time Unit Overhead'}
                      </span>
                      <span className="font-mono text-amber-600">{gapMetrics.setupRatio.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, gapMetrics.setupRatio)}%` }} 
                        className={`h-full rounded-full ${gapMetrics.setupRatio > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      />
                    </div>
                  </div>

                  {/* Material Utilization yield rate */}
                  <div className="space-y-1.5 border-t border-border/50 pt-3">
                    <div className="flex justify-between text-xs font-bold text-text-primary">
                      <span>Material Volumetric Yield</span>
                      <span className="font-mono text-emerald-600">{gapMetrics.materialYieldRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${gapMetrics.materialYieldRate}%` }} 
                        className="bg-emerald-500 h-full rounded-full" 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-muted font-mono">
                      <span>Scrap raw parts ({100 - gapMetrics.materialYieldRate}%)</span>
                      <span>Product Net Weight</span>
                    </div>
                  </div>

                  {/* Base statistics summary */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl space-y-2 text-xs border border-border/60">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Current Unit Price:</span>
                      <strong className="text-text-primary font-mono">${gapMetrics.costPerPart.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Material Cost Unit:</span>
                      <strong className="text-text-primary font-mono">${gapMetrics.materialCost.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Base Process Cost:</span>
                      <strong className="text-text-primary font-mono">${gapMetrics.manufacturingCost.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-1.5 mt-1">
                      <span className="text-text-secondary">Logged Batch Size:</span>
                      <strong className="text-text-primary font-mono">{gapMetrics.batchVolume} units</strong>
                    </div>
                  </div>

                </div>
              </Card>
            </div>

            {/* Right 8 cols: GAPs & Recommendations playbook plus slide optimizer */}
            <div className="lg:col-span-8 space-y-6 text-left">
              
              {/* Strategic Rec Playbook */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Recommended Cost Optimization Guidelines
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Playbook Cards configured dynamically based on math type */}
                  {gapMetrics.calcType === 'casting' ? (
                    <>
                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            ⚙️ Pouring Control
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Cycle Rate & Melt Heat Regulation</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Fine tune melting temperatures to eliminate shrinkage porosity and minimize scrap pouring waste.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Savings Rate: Up to -15% Scrap Reduction
                        </span>
                      </div>
                      
                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            ⚡ Mold Catalysis
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Inorganic Core Binder Ratio</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Optimize furan or inorganic binders to increase gas escape speeds and reduce casting defects risks.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Efficiency Factor: +15% Gas Escape Rate
                        </span>
                      </div>

                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            📈 Pattern Amortization
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Durable Mold Quantities</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Leverage high pattern shot limit specifications over more batch runs to amortize custom tooling quickly.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Tool Scaling Factor: 2x volume = 0.5x tooling cost
                        </span>
                      </div>
                    </>
                  ) : gapMetrics.calcType === 'forging' ? (
                    <>
                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            ⚙️ Thermal Scale Control
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Billet Induction Pre-heating</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Adjust fuel-to-air induction balances in preheating ovens to inhibit scale carbon oxidation issues.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Savings Rate: Range -10% Scale Loss Weight
                        </span>
                      </div>

                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            ⚡ Forge Lifespan
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Strike Die Calibration and Lube</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Ensure constant hot-die lubricating spray to reduce mechanical stress friction and protect dies.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Die Life Gain: +20% Forge Hammer Runs
                        </span>
                      </div>

                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            📈 Heavy Presses
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Amortize Die Machining Setups</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Avoid short production intervals to limit high machinery downtime and expensive die installation rates.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Dime Scale: Optimal batch runs dilute die setups
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            ⚙️ SMED Strategy
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Fixture Modularization & Plates</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Introduce quick-change block magnetic clamps to eliminate lengthy structural setups before cutting.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Overhead Saved: -60% setup minutes target
                        </span>
                      </div>

                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            ⚡ Velocity Upgrade
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Carbide Tooling Coating Inserts</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Employ premium titanium carbide coated drills to safely increase material grinding feed.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Feed Rate Gain: +25% metal removal velocity
                        </span>
                      </div>

                      <div className="bg-surface border border-indigo-500/10 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block">
                            📈 EOQ Run Sizes
                          </span>
                          <h4 className="font-bold text-sm text-text-primary mt-2">Economic Batch Quantities</h4>
                          <p className="text-xs text-text-secondary mt-1">
                            Increase minimum production quantities to spread setup times.
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-3 block">
                          Amortization: Lowers machining overhead per unit
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* LIVE SIMULATOR SLIDERS - POWER PANEL */}
              <div className="bg-slate-900 border border-indigo-500/20 text-white p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-4">
                  <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Target Cost Optimization Simulator
                  </h3>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 px-2.5 py-0.5 rounded-full font-bold">
                    PREDICTIVE MODEL
                  </span>
                </div>

                <p className="text-xs text-indigo-200 mb-5 leading-relaxed">
                  Toggle target operational sliders below to instantly examine potential business impact on annual margins, unit pricing reductions, and compound savings.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 select-none">
                  
                  {/* Slider 1 - Target OEE / Yield */}
                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-200 font-semibold">Target Efficiency Ratio</span>
                      <span className="font-mono text-indigo-300 font-black">{targetOee}%</span>
                    </div>
                    <input 
                      type="range"
                      min="65"
                      max="98"
                      value={targetOee}
                      onChange={(e) => setTargetOee(Number(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer h-1 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-indigo-200/60 font-mono">
                      <span>Current ({gapMetrics.efficiencyCurrent}%)</span>
                      <span>Target (98%)</span>
                    </div>
                  </div>

                  {/* Slider 2 - Setup / Scrap reduction */}
                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-200 font-semibold">Setup Cost Reduction</span>
                      <span className="font-mono text-indigo-300 font-black">{setupTimeReduction}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="90"
                      value={setupTimeReduction}
                      onChange={(e) => setSetupTimeReduction(Number(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer h-1 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-indigo-200/60 font-mono">
                      <span>Standard setup</span>
                      <span>-90% Reduction</span>
                    </div>
                  </div>

                  {/* Slider 3 - Batch Multiplier */}
                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-200 font-semibold">Process Batch Run Size</span>
                      <span className="font-mono text-indigo-300 font-black">{batchVolumeMultiplier}x ({optimizedResults.optBatchSize} units)</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={batchVolumeMultiplier}
                      onChange={(e) => setBatchVolumeMultiplier(Number(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer h-1 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-indigo-200/60 font-mono">
                      <span>Standard size</span>
                      <span>10x Batch run</span>
                    </div>
                  </div>

                </div>

                {/* Simulated Results Board Grid */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  
                  <div className="text-left border-r border-white/10 pr-2">
                    <span className="text-indigo-200 text-[10px] block font-mono">Unoptimized Cost</span>
                    <span className="text-lg lg:text-xl font-mono text-slate-350 block mt-1 font-semibold">
                      ${gapMetrics.costPerPart.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-left border-r border-white/10 pr-2">
                    <span className="text-emerald-400 text-[10px] block font-mono">Optimized Estimate</span>
                    <span className="text-lg lg:text-xl font-mono text-emerald-400 block mt-1 font-bold">
                      ${optimizedResults.optimizedCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-left border-r border-white/10 pr-2">
                    <span className="text-yellow-400 text-[10px] block font-mono">Savings Per Part</span>
                    <span className="text-lg lg:text-xl font-mono text-yellow-300 block mt-1 font-bold">
                      -${optimizedResults.savingsPerPart.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-indigo-200 text-[10px] block font-mono">Projected Annual Saved</span>
                    <span className="text-lg lg:text-xl font-mono text-emerald-400 block mt-1 font-bold">
                      +${optimizedResults.totalAnnualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                </div>

                <div className="mt-4 flex justify-between items-center text-[10px] text-indigo-200/80">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-indigo-300" /> Output derived from standardized should-cost optimization metrics.
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setTargetOee(85);
                      setSetupTimeReduction(40);
                      setBatchVolumeMultiplier(2);
                    }}
                    className="text-white hover:underline cursor-pointer font-bold"
                  >
                    Reset Defaults
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

