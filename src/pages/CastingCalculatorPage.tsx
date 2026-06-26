import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Clock, Hammer, Layers, ShieldCheck, TrendingUp, HelpCircle, AlertCircle, Sparkles, Box } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import type { CastingInput, SurfaceTreatment, Markups, User, Calculation, View, RegionCost, RegionCurrencyMap } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { calculateCastingCosts } from '../services/castingCalculationService';
import { CastingSchematics } from '../components/CastingSchematics';
import { CalculationHeader } from '../components/CalculationHeader';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const uuid = () => `id_cast_${Math.random().toString(36).substring(2, 9)}`;

// --- Cast Materials Presets ---
interface CastMaterialPreset {
  name: string;
  category: 'Ferrous' | 'Non-Ferrous';
  density: number; // g/cm³
  costPerKg: number; // USD
  compatibleProcesses?: string[]; // Optional: list of compatible process names
}

const CAST_MATERIAL_PRESETS: CastMaterialPreset[] = [
  { name: 'Grey Iron (Class 30)', category: 'Ferrous', density: 7.20, costPerKg: 2.30, compatibleProcesses: ['Sand Casting', 'Shell Moulding'] },
  { name: 'Ductile Iron (65-45-12)', category: 'Ferrous', density: 7.10, costPerKg: 2.65, compatibleProcesses: ['Sand Casting', 'Shell Moulding', 'Investment Casting'] },
  { name: 'Cast Carbon Steel', category: 'Ferrous', density: 7.82, costPerKg: 3.40, compatibleProcesses: ['Sand Casting', 'Shell Moulding', 'Investment Casting'] },
  { name: 'Cast Stainless Steel (316)', category: 'Ferrous', density: 8.00, costPerKg: 6.80, compatibleProcesses: ['Investment Casting', 'Shell Moulding'] },
  { name: 'Cast Aluminum (A356)', category: 'Non-Ferrous', density: 2.68, costPerKg: 4.50, compatibleProcesses: ['GDC', 'LPDC', 'Sand Casting', 'Shell Moulding', 'Investment Casting'] },
  { name: 'Cast Bronze (C954)', category: 'Non-Ferrous', density: 7.45, costPerKg: 8.20, compatibleProcesses: ['GDC', 'Sand Casting', 'Investment Casting', 'Pressure Die Casting'] },
  { name: 'Cast Magnesium (AZ91D)', category: 'Non-Ferrous', density: 1.81, costPerKg: 5.90, compatibleProcesses: ['HPDC', 'Pressure Die Casting'] },
  { name: 'Aluminum Alloy (ADC12)', category: 'Non-Ferrous', density: 2.70, costPerKg: 2.95, compatibleProcesses: ['HPDC', 'LPDC', 'Pressure Die Casting'] },
];

const CASTING_PROCESSES = [
  { name: 'Sand Casting', defaultYield: 60, defaultPatternCost: 1500, defaultPatternLife: 5000, defaultMoldingTime: 5.0, defaultMeltingCost: 0.35 },
  { name: 'Shell Moulding', defaultYield: 65, defaultPatternCost: 3500, defaultPatternLife: 15000, defaultMoldingTime: 4.0, defaultMeltingCost: 0.38 },
  { name: 'HPDC', defaultYield: 85, defaultPatternCost: 45000, defaultPatternLife: 150000, defaultMoldingTime: 0.4, defaultMeltingCost: 0.45 },
  { name: 'LPDC', defaultYield: 80, defaultPatternCost: 28000, defaultPatternLife: 80000, defaultMoldingTime: 1.5, defaultMeltingCost: 0.42 },
  { name: 'GDC', defaultYield: 75, defaultPatternCost: 12000, defaultPatternLife: 40000, defaultMoldingTime: 3.0, defaultMeltingCost: 0.40 },
  { name: 'Investment Casting', defaultYield: 50, defaultPatternCost: 8500, defaultPatternLife: 20000, defaultMoldingTime: 12.0, defaultMeltingCost: 0.55 },
  { name: 'Pressure Die Casting', defaultYield: 85, defaultPatternCost: 38000, defaultPatternLife: 100000, defaultMoldingTime: 0.5, defaultMeltingCost: 0.45 },
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
  isToolingAmortizedAuto: true,
  toolingSharingFactor: 1.0,
  toolingAmortizedCostOverride: 0,
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

const CASTING_PROCESS_GUIDES: Record<string, string> = {
  'Sand Casting': 'Standard gravity filling. High yield variability (55-80%). Use loose patterns for prototypes, matchplates for production.',
  'Shell Moulding': 'Resin-coated sand shell molds. Excellent for thin-walled complex parts. Surface better than sand (Yield 60-75%).',
  'HPDC': 'Highly complex high-pressure injection. High tool cost, very low cycle time. Yield is typically high (85-90%).',
  'LPDC': 'Bottom-up low-pressure filling minimizes turbulence. Ideal for aluminum wheels and safety components. Yield is high (90-95%).',
  'GDC': 'Gravity metallic mold casting. Good surface finish and structure. Tool life 5k-50k shots. Yield 70-85%.',
  'Investment Casting': 'Lost wax process. Extremely high detail and tight tolerances. Gating trees are complex (Yield 45-60%).',
  'Pressure Die Casting': 'Metal forced into dies at high pressure. High productivity, excellent finish, and precision.',
  'Permanent Mold': 'Reusable metallic molds. Fast cooling improves mechanical properties over sand casting.'
};

export const CastingCalculatorPage: React.FC<CastingCalculatorPageProps> = ({
  user,
  onSave,
  onSaveDraft,
  onBack,
  existingCalculation,
  onNavigate
}) => {
  const [isProcessLocked, setIsProcessLocked] = useState(false);
  const [formData, setFormData] = useState<CastingInput>(() => {
    let initialData = { ...INITIAL_CASTING_INPUT };
    if (existingCalculation && existingCalculation.calculatorType === 'casting') {
      initialData = { ...initialData, ...existingCalculation.inputs } as CastingInput;
    } else {
      initialData = {
        ...initialData,
        id: uuid(),
        calculationNumber: `EST-CAST-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };
      
      // Check for initial type from landing page
      const savedType = localStorage.getItem('costinghub_initial_casting_type');
      if (savedType) {
        initialData.castingProcess = savedType as any;
        
        // Apply process defaults
        const processPreset = CASTING_PROCESSES.find(p => p.name === savedType);
        if (processPreset) {
          initialData.yieldRate = processPreset.defaultYield;
          initialData.patternCost = processPreset.defaultPatternCost;
          initialData.patternLifeShots = processPreset.defaultPatternLife;
          initialData.moldingCycleTimeMin = processPreset.defaultMoldingTime;
          initialData.meltingCostPerKg = processPreset.defaultMeltingCost;
        }
      }
    }
    return initialData;
  });

  useEffect(() => {
    const savedType = localStorage.getItem('costinghub_initial_casting_type');
    if (savedType && !existingCalculation) {
      setIsProcessLocked(true);
      localStorage.removeItem('costinghub_initial_casting_type');
    }
  }, [existingCalculation]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isCoresOpen, setIsCoresOpen] = useState(formData.coresUsed);
  const [showProcessGuide, setShowProcessGuide] = useState(false);
  const processGuideTip = CASTING_PROCESS_GUIDES[formData.castingProcess] || 'Standard industrial casting process modeling.';

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
    const numericFields = [
      'annualVolume', 'batchVolume', 'finishedPartWeightKg', 'partSurfaceAreaM2',
      'projectedAreaCm2', 'runnerProjectedAreaCm2', 'injectionPressureBar', 
      'intensificationPressureBar', 'safetyFactor', 'waxWeightKg',
      'waxCostPerKg', 'shellLayersCount', 'patternInjectionTimeSec', 'numberOfCavities'
    ];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name)
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
      setFormData(prev => {
        let materialCategory = prev.materialCategory;
        let materialType = prev.materialType;
        let density = prev.materialDensityGcm3;
        let cost = prev.materialCostPerKg;

        // Constraint: LPDC and HPDC can only have Non-Ferrous items
        if (['HPDC', 'LPDC', 'Pressure Die Casting'].includes(processName) && materialCategory === 'Ferrous') {
          materialCategory = 'Non-Ferrous';
          const nonFerrousPreset = CAST_MATERIAL_PRESETS.find(m => m.category === 'Non-Ferrous')!;
          materialType = nonFerrousPreset.name;
          density = nonFerrousPreset.density;
          cost = nonFerrousPreset.costPerKg;
        }

        return {
          ...prev,
          castingProcess: processName,
          yieldRate: preset.defaultYield,
          patternCost: preset.defaultPatternCost,
          patternLifeShots: preset.defaultPatternLife,
          moldingCycleTimeMin: preset.defaultMoldingTime,
          meltingCostPerKg: preset.defaultMeltingCost,
          materialCategory,
          materialType,
          materialDensityGcm3: density,
          materialCostPerKg: cost,
        };
      });
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

  const handleSaveDraftClick = useCallback(() => {
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
  }, [formData, castingResults, user.id, existingCalculation, elapsedSeconds, onSaveDraft]);

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
    const wax = castingResults.waxCostPerPart || 0;
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
      ...(wax > 0 ? ['Lost Wax/Pattern'] : []),
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
      ...(wax > 0 ? [wax] : []),
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
            ...(wax > 0 ? ['#f97316'] : []), // Orange
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
        type="casting"
        status={existingCalculation?.status === 'final' ? 'Final' : 'Draft'}
      />

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
                    {CAST_MATERIAL_PRESETS
                      .filter(m => {
                        // User constraint: LPDC and HPDC can only have Non-Ferrous items
                        if (['HPDC', 'LPDC', 'Pressure Die Casting'].includes(formData.castingProcess)) {
                          return m.category === 'Non-Ferrous';
                        }
                        
                        // Refined constraint based on process compatibility library
                        if (m.compatibleProcesses && m.compatibleProcesses.length > 0) {
                          return m.compatibleProcesses.includes(formData.castingProcess);
                        }
                        
                        return true;
                      })
                      .map(m => (
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-indigo-500" />
                  Casting Process & Tooling Amortization
                </h2>
                <button 
                  type="button"
                  onClick={() => setShowProcessGuide(!showProcessGuide)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                    showProcessGuide 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-indigo-50/50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showProcessGuide ? 'Hide Guide' : 'Process Guide'}
                </button>
              </div>

              {showProcessGuide && (
                <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-3">
                    <Box className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Contextual Tip for {formData.castingProcess}:</p>
                      <p className="text-sm text-text-secondary leading-relaxed italic">
                        "{processGuideTip}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Casting Process Type"
                  name="castingProcess"
                  value={formData.castingProcess}
                  onChange={handleProcessChange}
                  disabled={isProcessLocked}
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
                      {formData.castingProcess === 'Shell Moulding' && 'Higher precision sand-resin mold process.'}
                      {formData.castingProcess === 'HPDC' && 'High-pressure injection for high-volume non-ferrous parts.'}
                      {formData.castingProcess === 'LPDC' && 'Low-pressure controlled filling for safety-critical parts.'}
                      {formData.castingProcess === 'GDC' && 'Gravity metallic mold casting for structural aluminum.'}
                      {formData.castingProcess === 'Investment Casting' && 'Complex net-shapes & highest aesthetic grade.'}
                      {formData.castingProcess === 'Pressure Die Casting' && 'Ultra-high dimensional accuracy, perfect for light alloys.'}
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

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      id="tooling-amort-auto-toggle"
                      type="checkbox"
                      checked={formData.isToolingAmortizedAuto !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isToolingAmortizedAuto: e.target.checked }))}
                      className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
                    />
                    <label htmlFor="tooling-amort-auto-toggle" className="text-sm font-bold text-text-primary cursor-pointer select-none flex items-center gap-2">
                      Auto-Amortize Cost
                      <HelpCircle className="w-3.5 h-3.5 text-text-muted" title="Calculates (Tool Cost * Sharing Factor) / Lifetime" />
                    </label>
                  </div>

                  {formData.isToolingAmortizedAuto !== false ? (
                    <Input
                      label="Tooling Sharing Factor"
                      name="toolingSharingFactor"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.toolingSharingFactor ?? 1.0}
                      onChange={(e) => setFormData(prev => ({ ...prev, toolingSharingFactor: parseFloat(e.target.value) || 0 }))}
                      unit="ratio"
                      helperText="1.0 = Fully assigned, < 1.0 = Shared die cost"
                    />
                  ) : (
                    <Input
                      label="Manual Amortization Cost / Part"
                      name="toolingAmortizedCostOverride"
                      type="number"
                      step="0.01"
                      value={formData.toolingAmortizedCostOverride || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, toolingAmortizedCostOverride: parseFloat(e.target.value) || 0 }))}
                      unit="USD/part"
                    />
                  )}

                  <div className="bg-indigo-50/10 border border-indigo-500/20 p-3 rounded-lg">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">Effective Tooling Impact</span>
                        <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                           ${castingResults.toolingAmortizedCostPerPart.toFixed(4)} / part
                        </span>
                     </div>
                     {formData.annualVolume > 0 && (
                        <div className="flex justify-between items-center mt-1">
                           <span className="text-[10px] text-text-muted uppercase font-semibold">Annual Investment Recovery</span>
                           <span className="text-[10px] text-text-muted font-bold">
                              ${(castingResults.toolingAmortizedCostPerPart * formData.annualVolume).toLocaleString()} / yr
                           </span>
                        </div>
                     )}
                  </div>
                </div>
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

            {/* Dedicated Engineering Calculations Split */}
            {(['HPDC', 'GDC', 'Pressure Die Casting'].includes(formData.castingProcess)) && (
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Die Casting Tonnage & Gating Analysis
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  <Input
                    label="Part Projected Area"
                    name="projectedAreaCm2"
                    type="number"
                    value={formData.projectedAreaCm2 || 0}
                    onChange={handleInputChange}
                    unit="cm²"
                  />
                  <Input
                    label="Runner/Overflow Area"
                    name="runnerProjectedAreaCm2"
                    type="number"
                    value={formData.runnerProjectedAreaCm2 || 0}
                    onChange={handleInputChange}
                    unit="cm²"
                  />
                  <Input
                    label="Internal Pressure"
                    name="injectionPressureBar"
                    type="number"
                    value={formData.injectionPressureBar || (formData.castingProcess === 'HPDC' ? 800 : 100)}
                    onChange={handleInputChange}
                    unit="bar"
                  />
                  <Input
                    label="Intensification Peak"
                    name="intensificationPressureBar"
                    type="number"
                    value={formData.intensificationPressureBar || 0}
                    onChange={handleInputChange}
                    unit="bar"
                  />
                  <Input
                    label="Safety Factor"
                    name="safetyFactor"
                    type="number"
                    step="0.1"
                    value={formData.safetyFactor || 1.2}
                    onChange={handleInputChange}
                  />
                  <div className="bg-indigo-600/10 border border-indigo-600/20 p-4 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block mb-1">Clamping Force</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-text-primary">
                        {castingResults.calculatedTonnage?.toFixed(0) || '0'}
                      </span>
                      <span className="text-xs font-bold text-text-muted">TONS</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {formData.castingProcess === 'Investment Casting' && (
              <Card>
                <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Investment Casting Engineering
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Wax Weight per Part/Cluster"
                    name="waxWeightKg"
                    type="number"
                    step="any"
                    value={formData.waxWeightKg || 0}
                    onChange={handleInputChange}
                    unit="kg"
                  />
                  <Input
                    label="Wax Material Cost"
                    name="waxCostPerKg"
                    type="number"
                    value={formData.waxCostPerKg || 10}
                    onChange={handleInputChange}
                    unit="$/kg"
                  />
                  <Input
                    label="Wax Pattern Injection Cycle"
                    name="patternInjectionTimeSec"
                    type="number"
                    value={formData.patternInjectionTimeSec || 0}
                    onChange={handleInputChange}
                    unit="sec"
                  />
                </div>
              </Card>
            )}

            {/* Supportive Materials Section */}
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <Box className="w-5 h-5 text-teal-500" />
                Supportive Materials & Consumables
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(formData.castingProcess === 'Sand Casting' || formData.castingProcess === 'Shell Moulding') && (
                  <>
                    <div className="p-4 bg-orange-50/20 border border-orange-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-orange-600 uppercase block mb-1">Molding Media</span>
                      <p className="text-sm font-bold text-text-primary">Silica/Resin Sand</p>
                      <p className="text-[10px] text-text-secondary mt-1">AFS Grain size 45-65 recommended.</p>
                    </div>
                    <div className="p-4 bg-orange-50/20 border border-orange-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-orange-600 uppercase block mb-1">Binding Agent</span>
                      <p className="text-sm font-bold text-text-primary">Bentonite/Phenolic</p>
                      <p className="text-[10px] text-text-secondary mt-1">3-10% mix ratio based on volume.</p>
                    </div>
                  </>
                )}
                {(['HPDC', 'LPDC', 'GDC', 'Pressure Die Casting'].includes(formData.castingProcess)) && (
                  <>
                    <div className="p-4 bg-indigo-50/20 border border-indigo-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1">Die Care</span>
                      <p className="text-sm font-bold text-text-primary">Water-based Lubricant</p>
                      <p className="text-[10px] text-text-secondary mt-1">Automated spray distribution system.</p>
                    </div>
                    <div className="p-4 bg-indigo-50/20 border border-indigo-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1">Injection Consumables</span>
                      <p className="text-sm font-bold text-text-primary">Plunger Beads/Oil</p>
                      <p className="text-[10px] text-text-secondary mt-1">Ensures smooth shot velocity response.</p>
                    </div>
                  </>
                )}
                {formData.castingProcess === 'Investment Casting' && (
                  <>
                    <div className="p-4 bg-emerald-50/20 border border-emerald-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Pattern Media</span>
                      <p className="text-sm font-bold text-text-primary">Virgin/Filled Wax</p>
                      <p className="text-[10px] text-text-secondary mt-1">0.1-0.2% linear shrinkage allowance.</p>
                    </div>
                    <div className="p-4 bg-emerald-50/20 border border-emerald-500/10 rounded-xl">
                      <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Shell Coating</span>
                      <p className="text-sm font-bold text-text-primary">Zircon/Silica Slurry</p>
                      <p className="text-[10px] text-text-secondary mt-1">5-9 layers required for structural mold.</p>
                    </div>
                  </>
                )}
                <div className="p-4 bg-slate-50/20 border border-slate-500/10 rounded-xl">
                  <span className="text-[10px] font-black text-slate-600 uppercase block mb-1">Gas Treatment</span>
                  <p className="text-sm font-bold text-text-primary">Argon/Nitrogen</p>
                  <p className="text-[10px] text-text-secondary mt-1">Degassing and rotary fluxing agent.</p>
                </div>
                <div className="p-4 bg-slate-50/20 border border-slate-500/10 rounded-xl">
                  <span className="text-[10px] font-black text-slate-600 uppercase block mb-1">Filtering</span>
                  <p className="text-sm font-bold text-text-primary">Ceramic Foam Filters</p>
                  <p className="text-[10px] text-text-secondary mt-1">In-runner dross entrapment system.</p>
                </div>
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Casting Operational Cycle Times & Rates
              </h2>
              
              <div className="grid grid-cols-1 gap-6">
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
                <h3 className="font-bold text-base text-text-primary">Process Visualization</h3>
              </div>
              <div className="h-44 bg-slate-900 flex justify-center items-center relative select-none">
                <CastingSchematics type={formData.castingProcess} yieldRate={formData.yieldRate} />
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

                {castingResults.waxCostPerPart ? (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-emerald-50/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Lost-Wax Pattern Cost</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(castingResults.waxCostPerPart)}
                    </span>
                  </div>
                ) : null}

                {castingResults.calculatedTonnage ? (
                  <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-indigo-50/10 border border-indigo-500/20">
                    <span className="text-indigo-700 dark:text-indigo-400 font-bold">Required Ton Capacity</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">
                      ~ {castingResults.calculatedTonnage.toFixed(0)} T
                    </span>
                  </div>
                ) : null}

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
