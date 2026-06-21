import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Hammer, Layers, ShieldCheck, TrendingUp, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import type { CastingInput, SurfaceTreatment, Markups, User, Calculation, View, RegionCost, RegionCurrencyMap } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { calculateCastingCosts } from '../services/castingCalculationService';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const uuid = () => `id_cast_${Math.random().toString(36).substring(2, 9)}`;

// --- Cast Materials Presets ---
interface CastMaterialPreset {
  name: string;
  category: 'Ferrous' | 'Non-Ferrous';
  density: number; // g/cm³
  costPerKg: number; // USD
}

const CAST_MATERIAL_PRESETS: CastMaterialPreset[] = [
  { name: 'Grey Iron (Class 30)', category: 'Ferrous', density: 7.20, costPerKg: 2.30 },
  { name: 'Ductile Iron (65-45-12)', category: 'Ferrous', density: 7.10, costPerKg: 2.65 },
  { name: 'Cast Carbon Steel', category: 'Ferrous', density: 7.82, costPerKg: 3.40 },
  { name: 'Cast Stainless Steel (316)', category: 'Ferrous', density: 8.00, costPerKg: 6.80 },
  { name: 'Cast Aluminum (A356)', category: 'Non-Ferrous', density: 2.68, costPerKg: 4.50 },
  { name: 'Cast Bronze (C954)', category: 'Non-Ferrous', density: 7.45, costPerKg: 8.20 },
  { name: 'Cast Magnesium (AZ91D)', category: 'Non-Ferrous', density: 1.81, costPerKg: 5.90 },
];

const CASTING_PROCESSES = [
  { name: 'Sand Casting', defaultYield: 60, defaultPatternCost: 1500, defaultPatternLife: 5000, defaultMoldingTime: 5.0, defaultMeltingCost: 0.35 },
  { name: 'Pressure Die Casting', defaultYield: 85, defaultPatternCost: 38000, defaultPatternLife: 100000, defaultMoldingTime: 0.5, defaultMeltingCost: 0.45 },
  { name: 'Investment Casting', defaultYield: 50, defaultPatternCost: 8500, defaultPatternLife: 20000, defaultMoldingTime: 12.0, defaultMeltingCost: 0.55 },
  { name: 'Permanent Mold', defaultYield: 72, defaultPatternCost: 14000, defaultPatternLife: 30000, defaultMoldingTime: 2.5, defaultMeltingCost: 0.40 },
];

const INITIAL_CASTING_INPUT: CastingInput = {
  id: '',
  calculationNumber: '',
  partNumber: '',
  partName: '',
  customerName: '',
  revision: 'A',
  createdAt: '',
  annualVolume: 1000,
  batchVolume: 100,
  unitSystem: 'Metric',
  region: 'USA',
  currency: 'USD',
  materialCategory: 'Ferrous',
  materialType: 'Grey Iron (Class 30)',
  rawMaterialWeightKg: 0,
  finishedPartWeightKg: 1.2,
  materialCostPerKg: 2.30,
  materialDensityGcm3: 7.20,
  castingProcess: 'Sand Casting',
  yieldRate: 60,
  scrapReturnValuePercent: 45,
  scrapReturnRate: 95,
  patternCost: 1500,
  patternLifeShots: 5000,
  coresUsed: false,
  coreWeightKg: 0.2,
  coreMaterialCostPerKg: 0.90,
  coreBinderCostPerKg: 0.40,
  meltingCostPerKg: 0.35,
  moldingCycleTimeMin: 5.0,
  moldingHourlyRate: 50,
  pouringTimeSec: 20,
  pouringHourlyRate: 45,
  fettlingTimeMin: 8,
  fettlingHourlyRate: 40,
  inspectionCostPerPart: 1.25,
  heatTreatmentCostPerPart: 0,
  partSurfaceAreaM2: 0.045,
  surfaceTreatments: [],
  markups: {
    general: 5,
    admin: 3,
    sales: 2,
    miscellaneous: 0,
    packing: 3,
    transport: 4,
    duty: 0,
    profit: 15,
  },
};

interface CastingCalculatorPageProps {
  user: User;
  onSave: (calc: Calculation) => void;
  onSaveDraft: (calc: Calculation) => void;
  onBack: () => void;
  existingCalculation?: Calculation | null;
  theme?: string;
  onNavigate: (view: View) => void;
  materials?: any[];
  regionCosts?: RegionCost[];
  regionCurrencyMap?: RegionCurrencyMap[];
}

export const CastingCalculatorPage: React.FC<CastingCalculatorPageProps> = ({
  user,
  onSave,
  onSaveDraft,
  onBack,
  existingCalculation,
  onNavigate
}) => {
  const [formData, setFormData] = useState<CastingInput>(() => {
    if (existingCalculation && existingCalculation.calculatorType === 'casting') {
      return { ...INITIAL_CASTING_INPUT, ...existingCalculation.inputs } as CastingInput;
    }
    return {
      ...INITIAL_CASTING_INPUT,
      id: uuid(),
      calculationNumber: `EST-CAST-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isCoresOpen, setIsCoresOpen] = useState(formData.coresUsed);

  const startTimeRef = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Measure time on page
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set save status to unsaved when formData changes
  useEffect(() => {
    setSaveStatus('unsaved');
  }, [formData]);

  // Handle simple input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['annualVolume', 'batchVolume', 'finishedPartWeightKg', 'partSurfaceAreaM2'].includes(name)
        ? (parseFloat(value) || 0)
        : value,
    }));
  };

  // Preset Alloy handler
  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialName = e.target.value;
    const preset = CAST_MATERIAL_PRESETS.find(m => m.name === materialName);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        materialType: preset.name,
        materialCategory: preset.category,
        materialDensityGcm3: preset.density,
        materialCostPerKg: preset.costPerKg,
      }));
    }
  };

  // Preset Casting Process handler
  const handleProcessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const processName = e.target.value as any;
    const preset = CASTING_PROCESSES.find(p => p.name === processName);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        castingProcess: processName,
        yieldRate: preset.defaultYield,
        patternCost: preset.defaultPatternCost,
        patternLifeShots: preset.defaultPatternLife,
        moldingCycleTimeMin: preset.defaultMoldingTime,
        meltingCostPerKg: preset.defaultMeltingCost,
      }));
    }
  };

  // Nested markups sliders
  const handleMarkupChange = (name: keyof Markups, value: number) => {
    setFormData(prev => ({
      ...prev,
      markups: {
        ...prev.markups,
        [name]: value,
      },
    }));
  };

  // Surface treatment helpers
  const addSurfaceTreatment = () => {
    const newTreatment: SurfaceTreatment = {
      id: `treatment_${Math.random().toString(36).substring(2, 9)}`,
      name: 'Powder Coating',
      cost: 4.5,
      unit: 'per_kg',
    };
    setFormData(prev => ({
      ...prev,
      surfaceTreatments: [...(prev.surfaceTreatments || []), newTreatment],
    }));
  };

  const removeSurfaceTreatment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      surfaceTreatments: (prev.surfaceTreatments || []).filter(t => t.id !== id),
    }));
  };

  const updateSurfaceTreatment = (id: string, field: keyof SurfaceTreatment, value: any) => {
    setFormData(prev => ({
      ...prev,
      surfaceTreatments: (prev.surfaceTreatments || []).map(t =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  // Core checkbox handler
  const handleCoresToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsCoresOpen(checked);
    setFormData(prev => ({
      ...prev,
      coresUsed: checked,
      coreWeightKg: checked ? prev.coreWeightKg || 0.2 : 0,
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.partNumber.trim()) newErrors.partNumber = 'Part Number is required';
    if (!formData.partName.trim()) newErrors.partName = 'Part Name is required';
    if (formData.finishedPartWeightKg <= 0) newErrors.finishedPartWeightKg = 'Must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate results on-the-fly using the memoized helper
  const castingResults = useMemo(() => {
    return calculateCastingCosts(formData);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSaveStatus('saving');
      const calcObj: Calculation = {
        id: formData.id,
        name: formData.partName,
        inputs: formData,
        results: castingResults,
        status: 'final',
        user_id: user.id || '00000000-0000-0000-0000-000000000000',
        created_at: existingCalculation ? (existingCalculation.created_at || formData.createdAt) : formData.createdAt,
        duration_seconds: (existingCalculation?.duration_seconds || 0) + elapsedSeconds,
        calculatorType: 'casting',
      };
      onSave(calcObj);
      setSaveStatus('saved');
    }
  };

  const handleSaveDraftClick = () => {
    setSaveStatus('saving');
    const calcObj: Calculation = {
      id: formData.id,
      name: formData.partName || 'Unnamed Casting Job',
      inputs: formData,
      results: castingResults,
      status: 'draft',
      user_id: user.id || '00000000-0000-0000-0000-000000000000',
      created_at: existingCalculation ? (existingCalculation.created_at || formData.createdAt) : formData.createdAt,
      duration_seconds: (existingCalculation?.duration_seconds || 0) + elapsedSeconds,
      calculatorType: 'casting',
    };
    onSaveDraft(calcObj);
    setSaveStatus('saved');
  };

  // Helpers for currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(val);
  };

  // Chart setup
  const pieChartData = useMemo(() => {
    const netMat = castingResults.netMaterialCostPerPart;
    const melt = castingResults.meltingCostPerPart;
    const mold = castingResults.moldingCostPerPart;
    const pour = castingResults.pouringCostPerPart;
    const core = castingResults.coreCostPerPart;
    const fettling = castingResults.fettlingCostPerPart;
    const tool = castingResults.toolingAmortizedCostPerPart;
    const surf = castingResults.surfaceTreatmentCost / (formData.batchVolume || 1);
    
    // Add markups split
    const markupsSum = Object.values(castingResults.markupCosts).reduce((a, b) => a + b, 0) / (formData.batchVolume || 1);

    const labels = [
      'Net Metal Material',
      'Melting Power',
      'Molding Op',
      'Pouring Op',
      ...(core > 0 ? ['Sand Core Prep'] : []),
      'Fettling & Finishing',
      'Mold Amortization',
      ...(surf > 0 ? ['Surface Treatment'] : []),
      'Markups/Margins',
    ];

    const data = [
      netMat,
      melt,
      mold,
      pour,
      ...(core > 0 ? [core] : []),
      fettling,
      tool,
      ...(surf > 0 ? [surf] : []),
      markupsSum,
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#4f46e5', // Indigo
            '#ef4444', // Red
            '#10b981', // Emerald
            '#f59e0b', // Amber
            ...(core > 0 ? ['#06b6d4'] : []), // Cyan
            '#ec4899', // Pink
            '#8b5cf6', // Violet
            ...(surf > 0 ? ['#14b8a6'] : []), // Teal
            '#64748b', // Slate
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [castingResults, formData.batchVolume]);

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11 },
          color: '#475569',
        },
      },
      datalabels: {
        display: false,
      },
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen text-left">
      {/* Dynamic Navigation Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xxs font-black tracking-widest uppercase px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-500/20">
              Foundry Costing Module
            </span>
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Casting Cost Estimator</h1>
          <p className="text-sm text-text-muted">
            Physics-driven melt yield coefficients & mold amortization modeling.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onBack}>
            ← Back to calculations
          </Button>
          <Button type="button" onClick={() => onNavigate('calculator')} variant="outline">
            Switch to Machining Costing
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Input Panels */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Sec 1: Job Info */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                Job & Production Info
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Calculation ID"
                  name="calculationNumber"
                  value={formData.calculationNumber}
                  onChange={handleInputChange}
                  disabled
                />
                <Input
                  label="Part Number"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleInputChange}
                  error={errors.partNumber}
                />
                <Input
                  label="Part Name"
                  name="partName"
                  value={formData.partName}
                  onChange={handleInputChange}
                  error={errors.partName}
                />
                <Input
                  label="Customer Name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                />
                <Input
                  label="Revision"
                  name="revision"
                  value={formData.revision}
                  onChange={handleInputChange}
                />
                <Input
                  label="Batch Production Volume"
                  name="batchVolume"
                  type="number"
                  value={formData.batchVolume}
                  onChange={handleInputChange}
                />
              </div>
            </Card>

            {/* Sec 2: Casting Alloy & Material Specification */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                Cast Alloy & Material Specs
              </h2>
              
              <div className="bg-background/40 border border-border p-4 rounded-xl mb-6">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Select Predefined Cast Alloy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                    value={formData.materialType}
                    onChange={handleMaterialChange}
                  >
                    {CAST_MATERIAL_PRESETS.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-4 items-center text-xs font-mono bg-surface border border-dashed border-border px-4 py-2.5 rounded-lg">
                    <div>
                      <span className="text-text-muted uppercase text-[9px] block">Base Density</span>
                      <strong className="text-text-primary text-sm">{formData.materialDensityGcm3} g/cm³</strong>
                    </div>
                    <div className="w-px h-8 bg-border border-l border-dashed" />
                    <div>
                      <span className="text-text-muted uppercase text-[9px] block">Estimated Base Cost</span>
                      <strong className="text-text-primary text-sm">${formData.materialCostPerKg}/kg</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Finished Part Weight"
                  name="finishedPartWeightKg"
                  type="number"
                  step="any"
                  value={formData.finishedPartWeightKg}
                  onChange={handleInputChange}
                  error={errors.finishedPartWeightKg}
                  unit="kg"
                />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-secondary">Yield Rate (%)</label>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    value={formData.yieldRate}
                    onChange={(e) => handleMarkupChange('general', formData.markups.general)} // trigger dummy update
                    onInput={(e: any) => setFormData(prev => ({ ...prev, yieldRate: parseFloat(e.target.value) || 60 }))}
                    className="w-full h-1.5 bg-background rounded-lg cursor-pointer accent-indigo-600 mt-3"
                  />
                  <div className="flex justify-between text-xs font-mono text-text-secondary mt-1">
                    <span>20% (Low Yield)</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formData.yieldRate}%</span>
                    <span>95% (High Yield)</span>
                  </div>
                </div>

                <div className="bg-indigo-50/20 border border-indigo-100 dark:border-indigo-500/10 p-3 rounded-lg text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">Calculated Poured Liquid Metal</span>
                    <span className="font-mono font-black text-sm text-text-primary">
                      {castingResults.pouredWeightKg.toFixed(3)} kg
                    </span>
                    <span className="block text-[9px] text-text-secondary mt-1">
                      Includes gating, risers, & cooling scrap weight ({castingResults.scrapWeightKg.toFixed(2)} kg)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Sec 3: Casting Process & Molding */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-indigo-500" />
                Casting Process & Tooling Amortization
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Casting Process Type"
                  name="castingProcess"
                  value={formData.castingProcess}
                  onChange={handleProcessChange}
                >
                  {CASTING_PROCESSES.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </Select>

                <div className="bg-background/40 border border-border p-4.5 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-text-muted block">Process Characteristics</span>
                    <p className="text-xs text-text-primary font-medium mt-1 leading-relaxed">
                      {formData.castingProcess === 'Sand Casting' && 'Excellent for low volumes & large ferrous parts.'}
                      {formData.castingProcess === 'Pressure Die Casting' && 'Ultra-high dimensional accuracy, perfect for light alloys.'}
                      {formData.castingProcess === 'Investment Casting' && 'Complex net-shapes & highest aesthetic grade.'}
                      {formData.castingProcess === 'Permanent Mold' && 'Excellent reuse die potential with medium capital.'}
                    </p>
                  </div>
                </div>

                <Input
                  label="Pattern / Die Tooling Cost ($)"
                  name="patternCost"
                  type="number"
                  value={formData.patternCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, patternCost: parseFloat(e.target.value) || 0 }))}
                  unit="USD"
                />

                <Input
                  label="Pattern Tool Life (Shots)"
                  name="patternLifeShots"
                  type="number"
                  value={formData.patternLifeShots}
                  onChange={(e) => setFormData(prev => ({ ...prev, patternLifeShots: parseInt(e.target.value) || 1 }))}
                  unit="cycles"
                />
              </div>

              {/* Cores Setup Expansion */}
              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <input
                    id="cores-toggle-check"
                    type="checkbox"
                    checked={formData.coresUsed}
                    onChange={handleCoresToggle}
                    className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="cores-toggle-check" className="text-sm font-bold text-text-primary cursor-pointer select-none">
                    Requires Sand Cores (For Internal Cavities)
                  </label>
                </div>

                {isCoresOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 bg-background/30 border border-border/80 p-4 rounded-xl animate-fade-in">
                    <Input
                      label="Core Sand Weight"
                      name="coreWeightKg"
                      type="number"
                      step="any"
                      value={formData.coreWeightKg}
                      onChange={(e) => setFormData(prev => ({ ...prev, coreWeightKg: parseFloat(e.target.value) || 0 }))}
                      unit="kg"
                    />
                    <Input
                      label="Core Material Base Rate"
                      name="coreMaterialCostPerKg"
                      type="number"
                      step="any"
                      value={formData.coreMaterialCostPerKg}
                      onChange={(e) => setFormData(prev => ({ ...prev, coreMaterialCostPerKg: parseFloat(e.target.value) || 0 }))}
                      unit="$/kg"
                    />
                    <Input
                      label="Core Binder Additive Cost"
                      name="coreBinderCostPerKg"
                      type="number"
                      step="any"
                      value={formData.coreBinderCostPerKg}
                      onChange={(e) => setFormData(prev => ({ ...prev, coreBinderCostPerKg: parseFloat(e.target.value) || 0 }))}
                      unit="$/kg"
                    />
                    <div className="flex items-end text-xs font-mono pb-2.5">
                      <div className="bg-indigo-50/10 border border-indigo-200/20 px-3 py-2 rounded">
                        <span className="text-[10px] uppercase text-indigo-400 block font-bold">Total Core Cost</span>
                        <strong className="text-sm text-text-primary">
                          {formatCurrency(castingResults.coreCostPerPart)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Sec 4: Operational Casting Routings & Rates */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Casting Operational Cycle Times & Rates
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    1. Melting energy
                  </h3>
                  <Input
                    label="Melting Cost / Kg poured"
                    name="meltingCostPerKg"
                    type="number"
                    step="any"
                    value={formData.meltingCostPerKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, meltingCostPerKg: parseFloat(e.target.value) || 0 }))}
                    unit="$/kg"
                  />
                </div>

                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    2. molding
                  </h3>
                  <Input
                    label="Molding Cycle Time"
                    name="moldingCycleTimeMin"
                    type="number"
                    step="any"
                    value={formData.moldingCycleTimeMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, moldingCycleTimeMin: parseFloat(e.target.value) || 0 }))}
                    unit="min"
                  />
                  <Input
                    label="Molding Station Rate"
                    name="moldingHourlyRate"
                    type="number"
                    value={formData.moldingHourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, moldingHourlyRate: parseFloat(e.target.value) || 0 }))}
                    unit="$/hr"
                  />
                </div>

                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    3. pouring
                  </h3>
                  <Input
                    label="Pouring Cycle Time"
                    name="pouringTimeSec"
                    type="number"
                    value={formData.pouringTimeSec}
                    onChange={(e) => setFormData(prev => ({ ...prev, pouringTimeSec: parseFloat(e.target.value) || 0 }))}
                    unit="sec"
                  />
                  <Input
                    label="Pouring Team Rate"
                    name="pouringHourlyRate"
                    type="number"
                    value={formData.pouringHourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, pouringHourlyRate: parseFloat(e.target.value) || 0 }))}
                    unit="$/hr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    4. fettling / shakeout
                  </h3>
                  <Input
                    label="Fettling & Grinding"
                    name="fettlingTimeMin"
                    type="number"
                    step="any"
                    value={formData.fettlingTimeMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, fettlingTimeMin: parseFloat(e.target.value) || 0 }))}
                    unit="min"
                  />
                  <Input
                    label="Fettling Direct Rate"
                    name="fettlingHourlyRate"
                    type="number"
                    value={formData.fettlingHourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, fettlingHourlyRate: parseFloat(e.target.value) || 0 }))}
                    unit="$/hr"
                  />
                </div>

                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    5. inspection
                  </h3>
                  <Input
                    label="Inspection Audit Cost"
                    name="inspectionCostPerPart"
                    type="number"
                    step="any"
                    value={formData.inspectionCostPerPart}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectionCostPerPart: parseFloat(e.target.value) || 0 }))}
                    unit="$/part"
                  />
                </div>

                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    6. post-treatment
                  </h3>
                  <Input
                    label="Stress Relief / Heat Treat"
                    name="heatTreatmentCostPerPart"
                    type="number"
                    step="any"
                    value={formData.heatTreatmentCostPerPart}
                    onChange={(e) => setFormData(prev => ({ ...prev, heatTreatmentCostPerPart: parseFloat(e.target.value) || 0 }))}
                    unit="$/part"
                  />
                </div>
              </div>
            </Card>

            {/* Sec 5: Surface Treatments */}
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  Post-Casting Surface Treatments
                </h2>
                <Button type="button" variant="secondary" onClick={addSurfaceTreatment}>
                  + Add Post-Treatment
                </Button>
              </div>

              {(formData.surfaceTreatments || []).length > 0 ? (
                <div className="space-y-4">
                  {(formData.surfaceTreatments || []).map((t) => (
                    <div key={t.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-background/30 p-4 rounded-xl border border-border items-end">
                      <Input
                        label="Treatment Name"
                        value={t.name}
                        onChange={(e) => updateSurfaceTreatment(t.id, 'name', e.target.value)}
                      />
                      <Input
                        label="Unit Cost ($)"
                        type="number"
                        step="any"
                        value={t.cost}
                        onChange={(e) => updateSurfaceTreatment(t.id, 'cost', parseFloat(e.target.value) || 0)}
                      />
                      <Select
                        label="Based On"
                        value={t.unit}
                        onChange={(e) => updateSurfaceTreatment(t.id, 'unit', e.target.value)}
                      >
                        <option value="per_kg">Per kg finished part</option>
                        <option value="per_area">Per surface area (m²)</option>
                      </Select>
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-xs font-mono bg-indigo-50/10 px-2 py-1.5 rounded text-text-primary">
                          Sub: {formatCurrency(t.unit === 'per_kg' ? (t.cost * formData.finishedPartWeightKg) : (t.cost * formData.partSurfaceAreaM2))}
                        </span>
                        <Button type="button" variant="secondary" onClick={() => removeSurfaceTreatment(t.id)} className="text-red-500 hover:bg-red-500/10 !px-3 !py-1">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-text-muted py-6 bg-background/10 rounded-xl border border-dashed border-border text-sm">
                  No surface treatments applied to raw castings.
                </p>
              )}
            </Card>

            {/* Sec 6: Markups */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Applied Markups & Margins (%)
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Slider Helper */}
                  {Object.entries({
                    general: 'General Admin Charge',
                    admin: 'Corporate Admin',
                    sales: 'Sales & Commissions',
                    miscellaneous: 'Misc. Safety Contingency',
                    packing: 'Crate & Cargo Packing',
                    transport: 'Freight Delivery Transport',
                    duty: 'Import Custom Duties',
                    profit: 'Foundry ROI Profit Margin',
                  }).map(([key, label]) => (
                    <div key={key} className="space-y-1 bg-background/30 p-3.5 rounded-lg border border-border">
                      <div className="flex justify-between text-xs font-bold text-text-primary">
                        <span>{label}</span>
                        <span className="text-indigo-600 font-mono">{(formData.markups as any)[key]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(formData.markups as any)[key]}
                        onChange={(e) => handleMarkupChange(key as keyof Markups, parseFloat(e.target.value) || 0)}
                        className="w-full h-1.5 cursor-pointer accent-indigo-600 bg-background rounded-lg mt-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column - Cost Results Summary Panel */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* Visualizer card */}
            <Card className="!p-0 overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 relative">
              <div className="p-5">
                <span className="text-[10px] font-black uppercase text-indigo-600 block mb-0.5 tracking-wider">Casting Scheme</span>
                <h3 className="font-bold text-base text-text-primary">Cross-section blueprint</h3>
              </div>
              <div className="h-44 bg-slate-900 flex justify-center items-center relative select-none">
                {/* Simulated foundry casting scheme */}
                <svg width="220" height="130" viewBox="0 0 220 130" className="opacity-90">
                  <rect x="20" y="30" width="180" height="80" rx="4" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3,3" />
                  <text x="110" y="20" fill="#a5b4fc" fontSize="9" textAnchor="middle" fontFamily="monospace">FOUNDRY MOLD SAND</text>
                  
                  {/* Poured shape */}
                  <path d="M70,50 L150,50 L150,90 L70,90 Z" fill="#4338ca" stroke="#818cf8" strokeWidth="2" />
                  
                  {/* Gate / Riser */}
                  <rect x="50" y="36" width="12" height="15" fill="#f59e0b" />
                  <rect x="158" y="36" width="12" height="15" fill="#f25f5c" />
                  
                  <text x="56" y="28" fill="#f59e0b" fontSize="8" textAnchor="middle">Gate</text>
                  <text x="164" y="28" fill="#f25f5c" fontSize="8" textAnchor="middle">Riser</text>
                  <text x="110" y="75" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">Cast Part Alloy</text>
                </svg>
              </div>
            </Card>

            {/* Main Cost Breakup Display */}
            <Card>
              <h2 className="text-xl font-bold text-primary border-b border-border pb-3 mb-4">
                Part Cost Breakup
              </h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Liquid Alloy Weight Used</span>
                  <span className="font-mono text-text-primary font-bold">
                    {castingResults.pouredWeightKg.toFixed(3)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Net Alloy Cost</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(castingResults.netMaterialCostPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Melt / Molding / Pouring</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(castingResults.meltingCostPerPart + castingResults.moldingCostPerPart + castingResults.pouringCostPerPart)}
                  </span>
                </div>
                {formData.coresUsed && (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50 col-span-2">
                    <span className="text-text-secondary">Sand Core Fabrication</span>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(castingResults.coreCostPerPart)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Fettling & Clean-up</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(castingResults.fettlingCostPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Mold & Die Amortization</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(castingResults.toolingAmortizedCostPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Surface Post-Treatment</span>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(castingResults.surfaceTreatmentCost / (formData.batchVolume || 1))}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 px-3 rounded-lg bg-indigo-50/10 border-t-2 border-indigo-500 mt-2">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">Total Unit Cost</span>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-lg">
                    {formatCurrency(castingResults.costPerPart)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Pie Chart Display */}
            <Card>
              <h3 className="font-bold text-sm text-text-muted uppercase tracking-wider mb-4">Cost Share Share Distribution</h3>
              <div className="h-60 relative flex justify-center items-center">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </Card>

            {/* Total Batch summary */}
            <Card className="!p-0 overflow-hidden border-2 border-primary/20">
              <div className="p-4 text-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">Batch volume totals</span>
                <h3 className="text-2xl font-black text-primary mt-1">
                  {formatCurrency(castingResults.totalCost)}
                </h3>
                <p className="text-xxs text-text-muted uppercase mt-0.5 font-bold">
                  for {formData.batchVolume} parts
                </p>
              </div>
            </Card>

          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border z-20 sm:static sm:bg-transparent sm:border-0 sm:p-0 flex justify-end items-center space-x-4 shadow-2xl sm:shadow-none">
          <div className="flex items-center space-x-3 mr-auto text-xs text-text-muted font-mono">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-primary animate-pulse" />
            <span>Time on Estimation: {elapsedSeconds}s</span>
            <span> | Status: {saveStatus === 'saved' ? '✓ Saved' : 'Drafting...'}</span>
          </div>

          <Button type="button" variant="secondary" onClick={handleSaveDraftClick}>
            Save Draft
          </Button>
          <Button type="submit" className="shadow-glow-primary bg-indigo-600 text-white hover:bg-indigo-700">
            Calculate & Save Job
          </Button>
        </div>
      </form>
    </div>
  );
};
