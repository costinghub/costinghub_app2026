import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Clock, Hammer, Layers, ShieldCheck, TrendingUp, AlertCircle, Flame, Scissors, Zap, HelpCircle, Info } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import type { ForgingInput, SurfaceTreatment, Markups, User, Calculation, View, RegionCost, RegionCurrencyMap } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { calculateForgingCosts } from '../services/forgingCalculationService';
import { ForgingSchematics } from '../components/ForgingSchematics';
import { MaterialFlowChart } from '../components/MaterialFlowChart';
import { CalculationHeader } from '../components/CalculationHeader';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const uuid = () => `id_forge_${Math.random().toString(36).substring(2, 9)}`;

// --- Forging Materials Presets ---
interface ForgingMaterialPreset {
  name: string;
  category: 'Carbon Steel' | 'Alloy Steel' | 'Stainless Steel' | 'Aluminum' | 'Titanium';
  density: number; // g/cm³
  costPerKg: number; // USD
}

const FORGING_MATERIAL_PRESETS: ForgingMaterialPreset[] = [
  { name: 'AISI 1045 Carbon Steel', category: 'Carbon Steel', density: 7.85, costPerKg: 1.95 },
  { name: 'AISI 4140 Alloy Steel', category: 'Alloy Steel', density: 7.85, costPerKg: 2.80 },
  { name: 'AISI 4340 Nickel-Moly Steel', category: 'Alloy Steel', density: 7.85, costPerKg: 3.50 },
  { name: 'AISI 316L Stainless Steel', category: 'Stainless Steel', density: 8.00, costPerKg: 6.20 },
  { name: 'Aluminum 6061-T6', category: 'Aluminum', density: 2.70, costPerKg: 4.80 },
  { name: 'Titanium Ti-6Al-4V', category: 'Titanium', density: 4.43, costPerKg: 26.00 },
];

const SCALE_LOSS_GUIDES: Record<string, string> = {
  'Carbon Steel': 'Standard furnace heating typically results in 3-5% loss. Induction heating reduces this to 0.5-1%.',
  'Alloy Steel': 'Medium alloy steels oxidize moderately. Expect 2.5-4% loss in gas furnaces depending on soak time.',
  'Stainless Steel': 'Chromium content forms a protective film, but high temps still cause 1.0-2.5% scale loss.',
  'Aluminum': 'Aluminum forms a very thin oxide layer. Scale loss is negligible (< 0.2%), but focus on flash volume.',
  'Titanium': 'Extremely reactive to oxygen at forging temps. Use protective coatings to keep loss under 0.5-1.5%.',
};

const TYPICAL_SCALE_LOSS_PRESETS: Record<string, { label: string; value: number }[]> = {
  'Carbon Steel': [
    { label: '0.8% - Induction Heating (Rapid, low-scale preheat)', value: 0.8 },
    { label: '3.0% - Controlled Gas Furnace (Standard heating)', value: 3.0 },
    { label: '5.0% - Open Fuel Furnace (High oxidation & soak)', value: 5.0 },
  ],
  'Alloy Steel': [
    { label: '0.6% - Shielded Induction Loop (Inert environment)', value: 0.6 },
    { label: '2.5% - Controlled Atmosphere Gas Oven', value: 2.5 },
    { label: '4.0% - Standard Heavy-duty Rotary Hearth', value: 4.0 },
  ],
  'Stainless Steel': [
    { label: '0.5% - Viscous Glass Coating (Protective barrier)', value: 0.5 },
    { label: '1.5% - High-frequency Induction preheater', value: 1.5 },
    { label: '2.5% - Standard Electric Muffle Furnace', value: 2.5 },
  ],
  'Aluminum': [
    { label: '0.05% - Clean Electric Radiant Heating', value: 0.05 },
    { label: '0.15% - Direct Fired Gas Convection Oven', value: 0.15 },
  ],
  'Titanium': [
    { label: '0.3% - Glass Enamel Dip Coating (Industry standard)', value: 0.3 },
    { label: '1.0% - Electric Chamber Preheat (Uncoated)', value: 1.0 },
    { label: '2.0% - Fuel-Fired Preheater (High reactive loss)', value: 2.0 },
  ],
};

const FORGING_PROCESSES = [
  { name: 'Closed Die Forging', defaultYield: 78, defaultScaleLoss: 3.0, defaultDieCost: 18500, defaultDieLife: 15000, defaultPressRate: 150, defaultPressTime: 25 },
  { name: 'Open Die Forging', defaultYield: 85, defaultScaleLoss: 4.0, defaultDieCost: 2000, defaultDieLife: 5000, defaultPressRate: 95, defaultPressTime: 120 },
  { name: 'Ring Rolling', defaultYield: 88, defaultScaleLoss: 2.0, defaultDieCost: 9500, defaultDieLife: 8000, defaultPressRate: 140, defaultPressTime: 45 },
  { name: 'Warm/Cold Forging', defaultYield: 94, defaultScaleLoss: 0.5, defaultDieCost: 32000, defaultDieLife: 40000, defaultPressRate: 180, defaultPressTime: 12 },
];

const INITIAL_FORGING_INPUT: ForgingInput = {
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
  materialCategory: 'Alloy Steel',
  materialType: 'AISI 4140 Alloy Steel',
  finishedPartWeightKg: 2.4,
  materialCostPerKg: 2.80,
  materialDensityGcm3: 7.85,
  forgingProcess: 'Closed Die Forging',
  yieldRate: 78,
  scaleLossPercent: 3.0,
  scrapReturnValuePercent: 35,
  scrapReturnRate: 90,
  dieCost: 18500,
  dieLifeShots: 15000,
  heatingEnergyCostPerKg: 0.22,
  shearingHourlyRate: 50,
  shearingCycleTimeSec: 12,
  forgingCycleTimeSec: 25,
  forgingMachineHourlyRate: 150,
  trimmingCycleTimeSec: 15,
  trimmingHourlyRate: 55,
  inspectionCostPerPart: 1.50,
  heatTreatmentCostPerPart: 0.75,
  partSurfaceAreaM2: 0.085,
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

interface ForgingCalculatorPageProps {
  user: User;
  onSave: (calc: Calculation) => void;
  onSaveDraft: (calc: Calculation) => void;
  onBack: () => void;
  existingCalculation?: Calculation | null;
  theme?: string;
  onNavigate: (view: View) => void;
}

export const ForgingCalculatorPage: React.FC<ForgingCalculatorPageProps> = ({
  user,
  onSave,
  onSaveDraft,
  onBack,
  existingCalculation,
  onNavigate
}) => {
  const [formData, setFormData] = useState<ForgingInput>(() => {
    let initialData = { ...INITIAL_FORGING_INPUT };
    if (existingCalculation && existingCalculation.calculatorType === 'forging') {
      initialData = { ...initialData, ...existingCalculation.inputs } as ForgingInput;
    } else {
      initialData = {
        ...initialData,
        id: uuid(),
        calculationNumber: `EST-FORGE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };
      
      // Check for initial type from landing page
      const savedType = localStorage.getItem('costinghub_initial_forging_type');
      if (savedType) {
        initialData.forgingProcess = savedType as any;
        localStorage.removeItem('costinghub_initial_forging_type'); // Clear after use
        
        // Apply process defaults
        const processPreset = FORGING_PROCESSES.find(p => p.name === savedType);
        if (processPreset) {
          initialData.yieldRate = processPreset.defaultYield;
          initialData.scaleLossPercent = processPreset.defaultScaleLoss;
        }
      }
    }
    return initialData;
  });

  const [showProcessGuide, setShowProcessGuide] = useState(false);

  const selectedMaterial = FORGING_MATERIAL_PRESETS.find(m => m.name === formData.materialType);
  const materialCategory = selectedMaterial?.category || 'Carbon Steel';
  const scaleLossTip = SCALE_LOSS_GUIDES[materialCategory];

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const startTimeRef = useRef(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer trackers
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSaveStatus('unsaved');
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['annualVolume', 'batchVolume', 'finishedPartWeightKg', 'partSurfaceAreaM2'].includes(name)
        ? (parseFloat(value) || 0)
        : value,
    }));
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const alloyName = e.target.value;
    const preset = FORGING_MATERIAL_PRESETS.find(m => m.name === alloyName);
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

  const handleProcessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const processName = e.target.value as any;
    const preset = FORGING_PROCESSES.find(p => p.name === processName);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        forgingProcess: processName,
        yieldRate: preset.defaultYield,
        scaleLossPercent: preset.defaultScaleLoss,
        dieCost: preset.defaultDieCost,
        dieLifeShots: preset.defaultDieLife,
        forgingMachineHourlyRate: preset.defaultPressRate,
        forgingCycleTimeSec: preset.defaultPressTime,
      }));
    }
  };

  const handleMarkupChange = (name: keyof Markups, value: number) => {
    setFormData(prev => ({
      ...prev,
      markups: {
        ...prev.markups,
        [name]: value,
      },
    }));
  };

  const addSurfaceTreatment = () => {
    const newTreatment: SurfaceTreatment = {
      id: `treatment_forge_${Math.random().toString(36).substring(2, 9)}`,
      name: 'Shot Blasting & Descaling',
      cost: 1.25,
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.partNumber.trim()) newErrors.partNumber = 'Part Number is required';
    if (!formData.partName.trim()) newErrors.partName = 'Part Name is required';
    if (formData.finishedPartWeightKg <= 0) newErrors.finishedPartWeightKg = 'Must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const forgingResults = useMemo(() => {
    return calculateForgingCosts(formData);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSaveStatus('saving');
      const calcObj: Calculation = {
        id: formData.id,
        name: formData.partName,
        inputs: formData,
        results: forgingResults,
        status: 'final',
        user_id: user.id || '00000000-0000-0000-0000-000000000000',
        created_at: existingCalculation ? (existingCalculation.created_at || formData.createdAt) : formData.createdAt,
        duration_seconds: (existingCalculation?.duration_seconds || 0) + elapsedSeconds,
        calculatorType: 'forging',
      };
      onSave(calcObj);
      setSaveStatus('saved');
    }
  };

  const handleSaveDraftClick = useCallback(() => {
    setSaveStatus('saving');
    const calcObj: Calculation = {
      id: formData.id,
      name: formData.partName || 'Unnamed Forging Job',
      inputs: formData,
      results: forgingResults,
      status: 'draft',
      user_id: user.id || '00000000-0000-0000-0000-000000000000',
      created_at: existingCalculation ? (existingCalculation.created_at || formData.createdAt) : formData.createdAt,
      duration_seconds: (existingCalculation?.duration_seconds || 0) + elapsedSeconds,
      calculatorType: 'forging',
    };
    onSaveDraft(calcObj);
    setSaveStatus('saved');
  }, [formData, forgingResults, user.id, existingCalculation, elapsedSeconds, onSaveDraft]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraftClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveDraftClick]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(val);
  };

  // Cost splits representation for ChartJS
  const pieChartData = useMemo(() => {
    const netBillet = forgingResults.netMaterialCostPerPart;
    const heating = forgingResults.heatingCostPerPart;
    const shear = forgingResults.shearingCostPerPart;
    const press = forgingResults.forgingPressCostPerPart;
    const trim = forgingResults.trimmingCostPerPart;
    const tool = forgingResults.toolingAmortizedCostPerPart;
    const surf = (forgingResults.surfaceTreatmentCost || 0) / (formData.batchVolume || 1);
    
    const markupsSum = Object.values(forgingResults.markupCosts).reduce((a, b) => a + b, 0) / (formData.batchVolume || 1);

    const labels = [
      'Net Material Billet',
      'Gas/Electric Heating',
      'Billet Shearing',
      'Forging Press Squeeze',
      'Trim Flash / Piercing',
      'Forge Die Amortization',
      ...(surf > 0 ? ['Surface Treatment'] : []),
      'Commercial Markups',
    ];

    const data = [
      netBillet,
      heating,
      shear,
      press,
      trim,
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
            '#e11d48', // Rose
            '#f59e0b', // Amber
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#06b6d4', // Cyan
            '#8b5cf6', // Violet
            ...(surf > 0 ? ['#14b8a6'] : []), // Teal
            '#64748b', // Slate
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [forgingResults, formData.batchVolume]);

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: { size: 10.5 },
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
      <div className="flex justify-between items-center mb-6 no-print">
        <Button type="button" variant="secondary" onClick={onBack} size="sm">
          ← Calculations Dashboard
        </Button>
        <div className="flex gap-2">
            <Button type="button" onClick={() => onNavigate('calculator')} variant="outline" size="sm">
                Switch to Machining
            </Button>
            <Button type="button" onClick={handleSaveDraftClick} variant="secondary" size="sm">
                Save Draft
            </Button>
        </div>
      </div>

      <CalculationHeader 
        calcId={formData.calculationNumber}
        partName={formData.partName}
        partNumber={formData.partNumber}
        customer={formData.customerName}
        created={formData.createdAt}
        type="forging"
        status={existingCalculation?.status === 'final' ? 'Final' : 'Draft'}
      />

      <form onSubmit={handleSubmit} className="space-y-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column Input Cards */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Cards 1: Header job specifications */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                Forging Job Identification
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

            {/* Cards 2: Billet Alloys & Mass Parameters */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                Raw Billet & Material Alloy Specification
              </h2>

              <div className="bg-background/40 border border-border p-4 rounded-xl mb-6">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Select Predefined Billet Steel / Alloy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                    value={formData.materialType}
                    onChange={handleMaterialChange}
                  >
                    {FORGING_MATERIAL_PRESETS.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-4 items-center text-xs font-mono bg-surface border border-dashed border-border px-4 py-2.5 rounded-lg">
                    <div>
                      <span className="text-text-muted uppercase text-[9px] block">Material Density</span>
                      <strong className="text-text-primary text-sm">{formData.materialDensityGcm3} g/cm³</strong>
                    </div>
                    <div className="w-px h-8 bg-border border-l border-dashed" />
                    <div>
                      <span className="text-text-muted uppercase text-[9px] block">Raw Billet Price</span>
                      <strong className="text-text-primary text-sm">${formData.materialCostPerKg}/kg</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Finished Forged Weight"
                  name="finishedPartWeightKg"
                  type="number"
                  step="any"
                  value={formData.finishedPartWeightKg}
                  onChange={handleInputChange}
                  error={errors.finishedPartWeightKg}
                  unit="kg"
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-text-secondary">Forging Yield Rate (%)</label>
                  <input
                    type="range"
                    min="35"
                    max="98"
                    value={formData.yieldRate}
                    onInput={(e: any) => setFormData(prev => ({ ...prev, yieldRate: parseFloat(e.target.value) || 75 }))}
                    onChange={() => {}} 
                    className="w-full h-1.5 bg-background rounded-lg cursor-pointer accent-rose-600 mt-3"
                  />
                  <div className="flex justify-between text-xs font-mono text-text-secondary mt-1">
                    <span>35% (Heavy Flash)</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{formData.yieldRate}%</span>
                    <span>98% (Flashless Cold)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-text-secondary">Furnace Scale Loss (%)</label>
                    <button 
                      type="button"
                      onClick={() => setShowProcessGuide(!showProcessGuide)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                        showProcessGuide 
                          ? 'bg-rose-600 text-white shadow-sm' 
                          : 'bg-rose-50/50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
                      }`}
                    >
                      <Info className="w-3 h-3" />
                      {showProcessGuide ? 'Hide Guide' : 'Process Guide'}
                    </button>
                  </div>
                  
                  {showProcessGuide && (
                    <div className="mt-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex gap-2">
                        <HelpCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Contextual Tip for {materialCategory}:</p>
                          <p className="text-[11px] text-text-secondary leading-relaxed italic">
                            "{scaleLossTip}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto-Suggest Preset Drop-down based on the selected material group */}
                  <div className="mt-2 space-y-1">
                    <label className="block text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      Auto-Suggest Preset ({materialCategory})
                    </label>
                    <select
                      className="block w-full px-3 py-2 text-xs border border-border rounded-xl bg-background/50 text-text-primary focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all cursor-pointer"
                      value={TYPICAL_SCALE_LOSS_PRESETS[materialCategory]?.some(preset => Math.abs(preset.value - formData.scaleLossPercent) < 0.001) ? TYPICAL_SCALE_LOSS_PRESETS[materialCategory].find(p => Math.abs(p.value - formData.scaleLossPercent) < 0.001)?.value : ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          setFormData(prev => ({ ...prev, scaleLossPercent: val }));
                        }
                      }}
                    >
                      <option value="">-- Choose a typical heating preset configuration --</option>
                      {TYPICAL_SCALE_LOSS_PRESETS[materialCategory]?.map((preset, idx) => (
                        <option key={idx} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.05"
                    value={formData.scaleLossPercent}
                    onInput={(e: any) => setFormData(prev => ({ ...prev, scaleLossPercent: parseFloat(e.target.value) || 0 }))}
                    onChange={() => {}}
                    className="w-full h-1.5 bg-background rounded-lg cursor-pointer accent-rose-600 mt-3"
                  />
                  <div className="flex justify-between text-xs font-mono text-text-secondary mt-1">
                    <span>0% (Scale-free)</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{formData.scaleLossPercent.toFixed(2)}%</span>
                    <span>10% (High Scale)</span>
                  </div>
                </div>
              </div>

              {/* Billet calculated status layout */}
              <div className="mt-6 bg-rose-50/10 border border-rose-100/10 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-text-secondary block font-bold">Total Input Billet Weight</span>
                  <span className="text-base font-black text-text-primary">
                    {forgingResults.rawBilletWeightKg.toFixed(3)} kg
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block font-bold">Evaporated Oxide Scale Loss</span>
                  <span className="text-base text-text-primary">
                    {forgingResults.scaleLossWeightKg.toFixed(3)} kg
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block font-bold">Flash Trimmings Scrap</span>
                  <span className="text-base text-text-primary">
                    {forgingResults.flashScrapWeightKg.toFixed(3)} kg
                  </span>
                </div>
              </div>
            </Card>

            {/* Cards 3: Process type & Die Amortization */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-rose-500" />
                Forging Tooling & Die Sets Amortization
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Forging Method Style"
                  name="forgingProcess"
                  value={formData.forgingProcess}
                  onChange={handleProcessChange}
                >
                  {FORGING_PROCESSES.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </Select>

                <div className="bg-background/40 border border-border p-4.5 rounded-xl flex items-center">
                  <p className="text-xs text-text-primary leading-relaxed font-semibold">
                    {formData.forgingProcess === 'Closed Die Forging' && 'Employs matched top/bottom impression dies. Highest dimensional grade.'}
                    {formData.forgingProcess === 'Open Die Forging' && 'Simple flat or curved tools. Squeezes billet without enclosing entirely.'}
                    {formData.forgingProcess === 'Ring Rolling' && 'Squeezes ring blanks between driven rolls. Great for gears & pipes.'}
                    {formData.forgingProcess === 'Warm/Cold Forging' && 'Near-net shape tolerances with minimal scale, high initial tooling capital.'}
                  </p>
                </div>

                <Input
                  label="Die Set Development Cost ($)"
                  name="dieCost"
                  type="number"
                  value={formData.dieCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, dieCost: parseFloat(e.target.value) || 0 }))}
                  unit="USD"
                />

                <Input
                  label="Die Wear Lifespan (Shots)"
                  name="dieLifeShots"
                  type="number"
                  value={formData.dieLifeShots}
                  onChange={(e) => setFormData(prev => ({ ...prev, dieLifeShots: parseInt(e.target.value) || 1 }))}
                  unit="parts"
                />
              </div>
            </Card>

            {/* Cards 4: Detailed Forging Operational Routings */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                Operational Cost Centers & Cycle Routings
              </h2>

              <div className="grid grid-cols-1 gap-6">
                
                {/* 1. Heating center */}
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    1. Billet Heating
                  </h3>
                  <Input
                    label="Heating Energy Rate / Kg"
                    name="heatingEnergyCostPerKg"
                    type="number"
                    step="any"
                    value={formData.heatingEnergyCostPerKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, heatingEnergyCostPerKg: parseFloat(e.target.value) || 0 }))}
                    unit="$/kg"
                  />
                </div>

                {/* 2. Shearing center */}
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                    2. Billet Shearing
                  </h3>
                  <Input
                    label="Shearing Cycle Time"
                    name="shearingCycleTimeSec"
                    type="number"
                    value={formData.shearingCycleTimeSec}
                    onChange={(e) => setFormData(prev => ({ ...prev, shearingCycleTimeSec: parseFloat(e.target.value) || 0 }))}
                    unit="sec"
                  />
                  <Input
                    label="Shearing Station Rate"
                    name="shearingHourlyRate"
                    type="number"
                    value={formData.shearingHourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, shearingHourlyRate: parseFloat(e.target.value) || 0 }))}
                    unit="$/hr"
                  />
                </div>

                {/* 3. Forging press center */}
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    3. Forging Press Line
                  </h3>
                  <Input
                    label="Primary Press Cycle"
                    name="forgingCycleTimeSec"
                    type="number"
                    value={formData.forgingCycleTimeSec}
                    onChange={(e) => setFormData(prev => ({ ...prev, forgingCycleTimeSec: parseFloat(e.target.value) || 0 }))}
                    unit="sec"
                  />
                  <Input
                    label="Press Line Hourly Rate"
                    name="forgingMachineHourlyRate"
                    type="number"
                    value={formData.forgingMachineHourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, forgingMachineHourlyRate: parseFloat(e.target.value) || 0 }))}
                    unit="$/hr"
                  />
                </div>

                {/* 4. Trimming and flash scrap center */}
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    4. Flash Trimming Op
                  </h3>
                  <Input
                    label="Trimming Cycle Time"
                    name="trimmingCycleTimeSec"
                    type="number"
                    value={formData.trimmingCycleTimeSec}
                    onChange={(e) => setFormData(prev => ({ ...prev, trimmingCycleTimeSec: parseFloat(e.target.value) || 0 }))}
                    unit="sec"
                  />
                  <Input
                    label="Trimming Line Rate"
                    name="trimmingHourlyRate"
                    type="number"
                    value={formData.trimmingHourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, trimmingHourlyRate: parseFloat(e.target.value) || 0 }))}
                    unit="$/hr"
                  />
                </div>

                {/* 5. Post-treatment heat-treatment */}
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    5. Heat Treatment
                  </h3>
                  <Input
                    label="Post-Forge Heat Treat"
                    name="heatTreatmentCostPerPart"
                    type="number"
                    step="any"
                    value={formData.heatTreatmentCostPerPart}
                    onChange={(e) => setFormData(prev => ({ ...prev, heatTreatmentCostPerPart: parseFloat(e.target.value) || 0 }))}
                    unit="$/part"
                  />
                </div>

                {/* 6. Inspection audit NDT */}
                <div className="p-4 bg-background/20 rounded-xl border border-border">
                  <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest border-b border-border mb-3 pb-1">
                    6. Inspection Quality
                  </h3>
                  <Input
                    label="Audit / NDT Dye Cost"
                    name="inspectionCostPerPart"
                    type="number"
                    step="any"
                    value={formData.inspectionCostPerPart}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectionCostPerPart: parseFloat(e.target.value) || 0 }))}
                    unit="$/part"
                  />
                </div>

              </div>
            </Card>

            {/* Cards 5: Post-Forging Surface Treatments */}
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                  Post-Forging Surface Coatings & Treatments
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
                  No post-forging blast cleaning or surface chemical coatings are applied.
                </p>
              )}
            </Card>

            {/* Cards 6: Markups & Margins */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                Additional Commercial Margins & Pricing Markups (%)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries({
                  general: 'General overhead factory charge',
                  admin: 'Corporate office fees',
                  sales: 'Sales agents commission incentive',
                  miscellaneous: 'Engineering security backup buffer',
                  packing: 'Heavy cargo wooden pallets',
                  transport: 'Container freight transit cost',
                  duty: 'Inter-regional import duties',
                  profit: 'Target corporate gross profit %',
                }).map(([key, label]) => (
                  <div key={key} className="space-y-1 bg-background/30 p-3.5 rounded-lg border border-border">
                    <div className="flex justify-between text-xs font-bold text-text-primary">
                      <span>{label}</span>
                      <span className="text-rose-600 font-mono">{(formData.markups as any)[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(formData.markups as any)[key]}
                      onChange={(e) => handleMarkupChange(key as keyof Markups, parseFloat(e.target.value) || 0)}
                      className="w-full h-1.5 cursor-pointer accent-rose-600 bg-background rounded-lg mt-2"
                    />
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Right sticky sidebar column */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
            
            {/* SVG Die process schematic card */}
            <Card className="!p-0 overflow-hidden bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20 relative">
              <div className="p-5">
                <span className="text-[10px] font-black uppercase text-rose-600 block mb-0.5 tracking-wider">Operational Blueprint</span>
                <h3 className="font-bold text-base text-text-primary">Process Visualization</h3>
              </div>
              <div className="h-44 bg-slate-900 flex justify-center items-center select-none">
                <ForgingSchematics type={formData.forgingProcess} yieldRate={formData.yieldRate} />
              </div>
            </Card>

            {/* Calculations breakdown list */}
            <Card>
              <h2 className="text-xl font-bold text-primary border-b border-border pb-3 mb-4">
                Billet & Process Pricing Breakup
              </h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Input Billet Weight</span>
                  <span className="font-mono text-text-primary font-bold">
                    {forgingResults.rawBilletWeightKg.toFixed(3)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50 font-medium">
                  <span className="text-text-secondary">Raw Material cost</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(forgingResults.rawMaterialBilletCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Billet heating energy</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(forgingResults.heatingCostPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Flash scrap credit</span>
                  <span className="text-green-600 font-bold font-mono">
                    -{formatCurrency(forgingResults.scrapCreditPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Press forging & tooling</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(forgingResults.forgingPressCostPerPart + forgingResults.toolingAmortizedCostPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Flash trim & piercing</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(forgingResults.trimmingCostPerPart)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-background/50">
                  <span className="text-text-secondary">Sub-post surface blast</span>
                  <span className="text-text-primary font-semibold">
                    {formatCurrency(forgingResults.surfaceTreatmentCost / (formData.batchVolume || 1))}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 px-3 rounded-lg bg-rose-500/10 border-t-2 border-rose-500 mt-2">
                  <span className="font-bold text-rose-700 dark:text-rose-400">Total Unit Price</span>
                  <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-lg">
                    {formatCurrency(forgingResults.costPerPart)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Material Flow Chart Recharts */}
            <Card>
              <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider mb-4">Weight & Material Mass Flow (kg)</h3>
              <div className="h-60 relative">
                <MaterialFlowChart 
                  rawBilletWeight={forgingResults.rawBilletWeightKg}
                  scaleLoss={forgingResults.scaleLossWeightKg}
                  flashScrap={forgingResults.flashScrapWeightKg}
                  finishedWeight={formData.finishedPartWeightKg}
                />
              </div>
            </Card>

            {/* Cost Share ChartJS Pie */}
            <Card>
              <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider mb-4">Should-Cost Share Distribution</h3>
              <div className="h-60 relative flex justify-center items-center">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </Card>

            {/* Total batch volume sum */}
            <Card className="!p-0 overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-rose-500/5 to-transparent">
              <div className="p-4 text-center">
                <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">Total Batch Cost Summary</span>
                <h3 className="text-2xl font-black text-primary mt-1">
                  {formatCurrency(forgingResults.totalCost)}
                </h3>
                <p className="text-xxs text-text-muted uppercase mt-0.5 font-bold">
                  for {formData.batchVolume} forged parts
                </p>
              </div>
            </Card>

          </div>

        </div>

        {/* Sticky Action parameters bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border z-20 sm:static sm:bg-transparent sm:border-0 sm:p-0 flex justify-end items-center space-x-4 shadow-2xl sm:shadow-none animate-fade-in">
          <div className="flex items-center space-x-3 mr-auto text-xs text-text-muted font-mono">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-rose-500 animate-pulse" />
            <span>Time on Forging Job: {elapsedSeconds}s</span>
            <span> | DB State: {saveStatus === 'saved' ? 'Synced ✓' : 'Drafting'}</span>
          </div>

          <Button type="button" variant="secondary" onClick={handleSaveDraftClick}>
            Save Forging Draft
          </Button>
          <Button type="submit" className="shadow-lg bg-rose-600 text-white hover:bg-rose-700 font-bold uppercase transition-all">
            Publish & Save Estimation
          </Button>
        </div>

      </form>
    </div>
  );
};
