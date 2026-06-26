import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Clock, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  HelpCircle, 
  AlertCircle, 
  Sparkles, 
  Box, 
  ChevronLeft, 
  Save, 
  FileText, 
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import type { User, Calculation, View, RegionCost, RegionCurrencyMap } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { CalculationHeader } from '../components/CalculationHeader';

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const uuid = () => `id_stamp_${Math.random().toString(36).substring(2, 9)}`;

// --- Sheet Metal Alloys Presets ---
interface SheetMaterialPreset {
  name: string;
  category: string;
  density: number; // g/cm³
  costPerKg: number; // USD
}

const SHEET_MATERIAL_PRESETS: SheetMaterialPreset[] = [
  { name: 'Cold Rolled Steel (SPCC)', category: 'Carbon Steel', density: 7.85, costPerKg: 1.85 },
  { name: 'Hot Rolled Steel (SPHC)', category: 'Carbon Steel', density: 7.85, costPerKg: 1.65 },
  { name: 'Stainless Steel 304 (SS304)', category: 'Stainless Steel', density: 7.93, costPerKg: 4.25 },
  { name: 'Stainless Steel 316 (SS316)', category: 'Stainless Steel', density: 8.00, costPerKg: 5.95 },
  { name: 'Aluminum Alloy 5052-H32', category: 'Aluminum', density: 2.68, costPerKg: 3.80 },
  { name: 'Aluminum Alloy 6061-T6', category: 'Aluminum', density: 2.70, costPerKg: 4.50 },
  { name: 'Galvanized Steel (SGCC)', category: 'Coated Steel', density: 7.85, costPerKg: 1.95 },
  { name: 'Brass Alloy C260', category: 'Copper/Brass', density: 8.53, costPerKg: 7.80 },
];

interface StampingFormState {
  id: string;
  partName: string;
  partNumber: string;
  processType: 'progressive' | 'tandem' | 'fabrication';
  annualVolume: number;
  batchVolume: number;
  
  // Sheet Blank Info
  thickness: number;
  width: number;
  length: number;
  materialDensity: number;
  materialCostPerKg: number;
  finishedWeightKg: number;
  
  // Scrap & Recovery
  scrapRecoveryRate: number;
  scrapValuePerKg: number;

  // Tooling / Die Set
  dieCost: number;
  dieLife: number;
  dieSharingFactor: number;
  cavityCount: number;

  // Setup Details
  setupTime: number;
  setupHourlyRate: number;

  // Cost Centers Rates & parameters
  shearRate: number;
  strokesPerMinuteShear: number;
  
  pressRate: number;
  strokesPerMinutePress: number;
  pressEfficiency: number;

  laserRate: number;
  cuttingLength: number;
  cuttingSpeed: number;

  bendingRate: number;
  numberOfBends: number;
  secondsPerBend: number;

  secondaryRate: number;
  secondaryCycleTime: number;

  inspectionRate: number;
  inspectionCycleTime: number;

  // Markups
  sgaRate: number;
  profitRate: number;
  logisticsRate: number;
  
  createdAt: string;
}

interface StampingCalculatorPageProps {
  user: User;
  onSave: (calc: Calculation) => void;
  onSaveDraft: (calc: Calculation) => void;
  onBack: () => void;
  existingCalculation: Calculation | null;
  theme: 'light' | 'dark';
  onNavigate: (view: View) => void;
}

export const StampingCalculatorPage: React.FC<StampingCalculatorPageProps> = ({
  user,
  onSave,
  onSaveDraft,
  onBack,
  existingCalculation,
  theme,
  onNavigate
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 1. Initialize Form state
  const [formData, setFormData] = useState<StampingFormState>(() => {
    if (existingCalculation && existingCalculation.calculatorType === 'stamping') {
      return existingCalculation.inputs as StampingFormState;
    }

    const initialSubtype = localStorage.getItem('costinghub_initial_stamping_type') as 'progressive' | 'tandem' | 'fabrication' || 'progressive';
    
    return {
      id: uuid(),
      partName: '',
      partNumber: '',
      processType: initialSubtype,
      annualVolume: 10000,
      batchVolume: 1000,
      thickness: 1.5,
      width: 200,
      length: 250,
      materialDensity: 7.85,
      materialCostPerKg: 1.85,
      finishedWeightKg: 0.45,
      scrapRecoveryRate: 85,
      scrapValuePerKg: 0.45,
      dieCost: initialSubtype === 'progressive' ? 28000 : initialSubtype === 'tandem' ? 14000 : 0,
      dieLife: initialSubtype === 'progressive' ? 120000 : initialSubtype === 'tandem' ? 80000 : 0,
      dieSharingFactor: 1,
      cavityCount: 1,
      setupTime: initialSubtype === 'progressive' ? 2.5 : initialSubtype === 'tandem' ? 1.5 : 0.5,
      setupHourlyRate: 65,
      
      // Cost Center Defaults
      shearRate: 45,
      strokesPerMinuteShear: 35,
      pressRate: initialSubtype === 'progressive' ? 95 : 125,
      strokesPerMinutePress: initialSubtype === 'progressive' ? 65 : 18,
      pressEfficiency: 85,
      laserRate: 85,
      cuttingLength: 450,
      cuttingSpeed: 2200,
      bendingRate: 55,
      numberOfBends: 4,
      secondsPerBend: 12,
      secondaryRate: 45,
      secondaryCycleTime: 30,
      inspectionRate: 35,
      inspectionCycleTime: 20,
      
      sgaRate: 5,
      profitRate: 10,
      logisticsRate: 3,
      createdAt: new Date().toISOString()
    };
  });

  // Track Time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(p => p + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update fields when process type switcher is clicked
  const handleProcessTypeChange = (type: 'progressive' | 'tandem' | 'fabrication') => {
    setFormData(prev => ({
      ...prev,
      processType: type,
      dieCost: type === 'progressive' ? 28000 : type === 'tandem' ? 14000 : 0,
      dieLife: type === 'progressive' ? 120000 : type === 'tandem' ? 80000 : 0,
      setupTime: type === 'progressive' ? 2.5 : type === 'tandem' ? 1.5 : 0.5,
      pressRate: type === 'progressive' ? 95 : type === 'tandem' ? 125 : 0,
      strokesPerMinutePress: type === 'progressive' ? 65 : type === 'tandem' ? 18 : 0
    }));
  };

  // Handle Material Preset Apply
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const preset = SHEET_MATERIAL_PRESETS.find(p => p.name === val);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        materialDensity: preset.density,
        materialCostPerKg: preset.costPerKg
      }));
    }
  };

  // Calculate costs in real-time
  const calculatedResults = useMemo(() => {
    const {
      processType,
      thickness,
      width,
      length,
      materialDensity,
      materialCostPerKg,
      finishedWeightKg,
      scrapRecoveryRate,
      scrapValuePerKg,
      dieCost,
      dieLife,
      dieSharingFactor,
      cavityCount,
      setupTime,
      setupHourlyRate,
      batchVolume,
      
      shearRate,
      strokesPerMinuteShear,
      pressRate,
      strokesPerMinutePress,
      pressEfficiency,
      laserRate,
      cuttingLength,
      cuttingSpeed,
      bendingRate,
      numberOfBends,
      secondsPerBend,
      secondaryRate,
      secondaryCycleTime,
      inspectionRate,
      inspectionCycleTime,
      
      sgaRate,
      profitRate,
      logisticsRate
    } = formData;

    // Gross Blank Weight (kg) = L * W * T * Density / 1,000,000
    const grossWeightKg = Math.max(0.01, (length * width * thickness * materialDensity) / 1000000);
    
    // Ensure finished part weight is never greater than gross blank weight
    const adjustedFinishedWeight = Math.min(finishedWeightKg, grossWeightKg);
    const scrapWeightKg = Math.max(0, grossWeightKg - adjustedFinishedWeight);

    // Material Cost Components
    const materialCostRaw = grossWeightKg * materialCostPerKg;
    const recoveredScrapValue = scrapWeightKg * (scrapRecoveryRate / 100) * scrapValuePerKg;
    const netMaterialCost = Math.max(0.01, materialCostRaw - recoveredScrapValue);

    // Tooling Amortization per Part
    let toolingAmortizationPerPart = 0;
    if (processType !== 'fabrication' && dieLife > 0 && dieCost > 0) {
      toolingAmortizationPerPart = (dieCost * dieSharingFactor) / (dieLife * cavityCount);
    }

    // Setup cost per Part
    const setupCostPerPart = batchVolume > 0 ? (setupTime * setupHourlyRate) / batchVolume : 0;

    // Operational Cycles
    // 1. Shearing Prep
    const shearingCostPerPart = shearRate / (strokesPerMinuteShear * 60);

    // 2. Main Press forming (Progressive or Tandem)
    let formingCostPerPart = 0;
    if (processType !== 'fabrication' && strokesPerMinutePress > 0) {
      formingCostPerPart = pressRate / (strokesPerMinutePress * 60 * (pressEfficiency / 100));
    }

    // 3. Laser Cutting (for Fabrication)
    let laserCostPerPart = 0;
    if (processType === 'fabrication' && cuttingSpeed > 0) {
      const minutesOfLaser = cuttingLength / cuttingSpeed;
      laserCostPerPart = (minutesOfLaser / 60) * laserRate;
    }

    // 4. Press Brake Bending (for Fabrication / Secondary Forming)
    let bendingCostPerPart = 0;
    if (numberOfBends > 0) {
      const bendingHours = (numberOfBends * secondsPerBend) / 3600;
      bendingCostPerPart = bendingHours * bendingRate;
    }

    // 5. Secondary Assembly/Welding
    const secondaryCostPerPart = (secondaryCycleTime / 3600) * secondaryRate;

    // 6. Quality Audit & Packing
    const inspectionCostPerPart = (inspectionCycleTime / 3600) * inspectionRate;

    // Total Process Costs
    const processSum = 
      shearingCostPerPart + 
      formingCostPerPart + 
      laserCostPerPart + 
      bendingCostPerPart + 
      secondaryCostPerPart + 
      inspectionCostPerPart;

    const totalManufacturingCost = processSum + setupCostPerPart;

    // Subtotal
    const baseUnitCost = netMaterialCost + toolingAmortizationPerPart + totalManufacturingCost;

    // Markup allocations
    const sgaAmount = baseUnitCost * (sgaRate / 100);
    const profitAmount = (baseUnitCost + sgaAmount) * (profitRate / 100);
    const logisticsAmount = baseUnitCost * (logisticsRate / 100);

    const finalUnitCost = baseUnitCost + sgaAmount + profitAmount + logisticsAmount;

    return {
      grossWeightKg: Number(grossWeightKg.toFixed(3)),
      scrapWeightKg: Number(scrapWeightKg.toFixed(3)),
      materialCostRaw: Number(materialCostRaw.toFixed(2)),
      recoveredScrapValue: Number(recoveredScrapValue.toFixed(2)),
      netMaterialCost: Number(netMaterialCost.toFixed(2)),
      toolingAmortizationPerPart: Number(toolingAmortizationPerPart.toFixed(3)),
      setupCostPerPart: Number(setupCostPerPart.toFixed(2)),
      
      shearingCostPerPart: Number(shearingCostPerPart.toFixed(2)),
      formingCostPerPart: Number(formingCostPerPart.toFixed(2)),
      laserCostPerPart: Number(laserCostPerPart.toFixed(2)),
      bendingCostPerPart: Number(bendingCostPerPart.toFixed(2)),
      secondaryCostPerPart: Number(secondaryCostPerPart.toFixed(2)),
      inspectionCostPerPart: Number(inspectionCostPerPart.toFixed(2)),
      
      totalManufacturingCost: Number(totalManufacturingCost.toFixed(2)),
      baseUnitCost: Number(baseUnitCost.toFixed(2)),
      sgaAmount: Number(sgaAmount.toFixed(2)),
      profitAmount: Number(profitAmount.toFixed(2)),
      logisticsAmount: Number(logisticsAmount.toFixed(2)),
      finalUnitCost: Number(finalUnitCost.toFixed(2)),
      annualSpend: Number((finalUnitCost * formData.annualVolume).toFixed(2))
    };
  }, [formData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.partNumber.trim()) newErrors.partNumber = 'Part Number is required';
    if (!formData.partName.trim()) newErrors.partName = 'Part Name is required';
    if (formData.thickness <= 0) newErrors.thickness = 'Thickness must be > 0';
    if (formData.width <= 0) newErrors.width = 'Width must be > 0';
    if (formData.length <= 0) newErrors.length = 'Length must be > 0';
    if (formData.finishedWeightKg <= 0) newErrors.finishedWeightKg = 'Part Weight must be > 0';
    if (formData.finishedWeightKg > (formData.length * formData.width * formData.thickness * formData.materialDensity) / 1000000) {
      newErrors.finishedWeightKg = 'Finished weight exceeds sheet blank gross weight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof StampingFormState, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setSaveStatus('saving');
      const calcObj: Calculation = {
        id: formData.id,
        name: formData.partName,
        inputs: formData,
        results: calculatedResults,
        status: 'final',
        user_id: user.id || '00000000-0000-0000-0000-000000000000',
        created_at: existingCalculation ? (existingCalculation.created_at || formData.createdAt) : formData.createdAt,
        duration_seconds: (existingCalculation?.duration_seconds || 0) + elapsedSeconds,
        calculatorType: 'stamping'
      };
      onSave(calcObj);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleSaveDraftClick = useCallback(() => {
    setSaveStatus('saving');
    const calcObj: Calculation = {
      id: formData.id,
      name: formData.partName || 'Unnamed Stamping Job',
      inputs: formData,
      results: calculatedResults,
      status: 'draft',
      user_id: user.id || '00000000-0000-0000-0000-000000000000',
      created_at: existingCalculation ? (existingCalculation.created_at || formData.createdAt) : formData.createdAt,
      duration_seconds: (existingCalculation?.duration_seconds || 0) + elapsedSeconds,
      calculatorType: 'stamping'
    };
    onSaveDraft(calcObj);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [formData, calculatedResults, user.id, existingCalculation, elapsedSeconds, onSaveDraft]);

  // Export to PDF using standard browser printing API styled cleanly
  const handlePrintPDF = () => {
    window.print();
  };

  // Setup Pie Chart
  const chartData = useMemo(() => {
    const {
      netMaterialCost,
      toolingAmortizationPerPart,
      shearingCostPerPart,
      formingCostPerPart,
      laserCostPerPart,
      bendingCostPerPart,
      secondaryCostPerPart,
      inspectionCostPerPart,
      setupCostPerPart,
      sgaAmount,
      profitAmount,
      logisticsAmount
    } = calculatedResults;

    const labels = [
      'Net Material',
      'Tooling Amort.',
      'Raw Preparation',
      'Forming Process',
      'Laser Profiling',
      'Bending Brake',
      'Secondary Operations',
      'Quality Inspection',
      'Setup Costs',
      'SGA & Overhead',
      'Margin Markup',
      'Logistics'
    ];

    const dataValues = [
      netMaterialCost,
      toolingAmortizationPerPart,
      shearingCostPerPart,
      formingCostPerPart,
      laserCostPerPart,
      bendingCostPerPart,
      secondaryCostPerPart,
      inspectionCostPerPart,
      setupCostPerPart,
      sgaAmount,
      profitAmount,
      logisticsAmount
    ];

    // Filter out zero entries to make the chart readable
    const filteredLabels: string[] = [];
    const filteredData: number[] = [];
    const colors = [
      '#a855f7', // purple-500
      '#ec4899', // pink-500
      '#3b82f6', // blue-500
      '#eab308', // yellow-500
      '#14b8a6', // teal-500
      '#f97316', // orange-500
      '#6366f1', // indigo-500
      '#06b6d4', // cyan-500
      '#84cc16', // lime-500
      '#6b7280', // gray-500
      '#22c55e', // green-500
      '#ef4444'  // red-500
    ];
    const filteredColors: string[] = [];

    dataValues.forEach((val, idx) => {
      if (val > 0) {
        filteredLabels.push(labels[idx]);
        filteredData.push(val);
        filteredColors.push(colors[idx % colors.length]);
      }
    });

    return {
      labels: filteredLabels,
      datasets: [
        {
          data: filteredData,
          backgroundColor: filteredColors,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)'
        }
      ]
    };
  }, [calculatedResults]);

  const chartOptions = {
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        color: '#ffffff',
        font: {
          family: 'JetBrains Mono',
          size: 9,
          weight: 'bold' as const
        },
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
          const percent = ((value / total) * 100).toFixed(0);
          return percent === '0' ? '' : `${percent}%`;
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background text-foreground" id="stamping-calc-page">
      {/* Header section */}
      <div className="border-b border-border/60 bg-surface/50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={onBack} className="rounded-xl border border-border/80 bg-zinc-900/40 hover:bg-zinc-800">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              Stamping & Sheet Metal Should-Cost Model
            </h1>
            <p className="text-xs text-text-muted font-bold tracking-widest uppercase mt-0.5">
              CostingHub Operations • Full Lifecycle Estimator
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleSaveDraftClick} disabled={saveStatus === 'saving'} className="rounded-xl border border-border bg-zinc-900/40 hover:bg-zinc-800 text-zinc-200">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saveStatus === 'saving'} className="rounded-xl bg-primary hover:bg-primary-dark shadow-glow-primary">
            {saveStatus === 'saving' ? 'Saving...' : 'Save Calculation'}
          </Button>
          <Button variant="secondary" onClick={handlePrintPDF} className="rounded-xl border border-border bg-zinc-900/40 hover:bg-zinc-800">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Form Panel */}
        <div className="space-y-6">
          
          {/* Subtype Process Selector Tabs */}
          <div className="p-1 bg-zinc-900/60 rounded-xl border border-border flex gap-1">
            <button
              onClick={() => handleProcessTypeChange('progressive')}
              className={`flex-1 py-3 text-center rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                formData.processType === 'progressive'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              Progressive Die Stamping
            </button>
            <button
              onClick={() => handleProcessTypeChange('tandem')}
              className={`flex-1 py-3 text-center rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                formData.processType === 'tandem'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              Tandem & Transfer Press
            </button>
            <button
              onClick={() => handleProcessTypeChange('fabrication')}
              className={`flex-1 py-3 text-center rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                formData.processType === 'fabrication'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              Laser / Brake Fabrication
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. General Info Card */}
            <Card className="p-6 bg-zinc-900/40 border-border/80 rounded-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" />
                Part & Volume Identifiers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Part Name"
                  value={formData.partName}
                  onChange={e => handleInputChange('partName', e.target.value)}
                  error={errors.partName}
                  placeholder="e.g. Structural Bracket"
                  className="rounded-xl"
                />
                <Input
                  label="Part Number / SKU"
                  value={formData.partNumber}
                  onChange={e => handleInputChange('partNumber', e.target.value)}
                  error={errors.partNumber}
                  placeholder="e.g. PN-12030"
                  className="rounded-xl"
                />
                <Input
                  label="Annual Volume (Parts/Year)"
                  type="number"
                  value={formData.annualVolume}
                  onChange={e => handleInputChange('annualVolume', Math.max(1, Number(e.target.value)))}
                  className="rounded-xl"
                />
                <Input
                  label="Production Batch Size"
                  type="number"
                  value={formData.batchVolume}
                  onChange={e => handleInputChange('batchVolume', Math.max(1, Number(e.target.value)))}
                  className="rounded-xl"
                />
              </div>
            </Card>

            {/* 2. Sheet Blank Material Specs Card */}
            <Card className="p-6 bg-zinc-900/40 border-border/80 rounded-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Raw Blank Material Specifications
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Apply Sheet Metal Preset"
                    onChange={handlePresetChange}
                    className="rounded-xl"
                  >
                    <option value="">-- Choose Preset Material --</option>
                    {SHEET_MATERIAL_PRESETS.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.density} g/cm³)
                      </option>
                    ))}
                  </Select>
                  
                  <Input
                    label="Finished Part Weight (kg)"
                    type="number"
                    step="0.001"
                    value={formData.finishedWeightKg}
                    onChange={e => handleInputChange('finishedWeightKg', Math.max(0.001, Number(e.target.value)))}
                    error={errors.finishedWeightKg}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Thickness (mm)"
                    type="number"
                    step="0.1"
                    value={formData.thickness}
                    onChange={e => handleInputChange('thickness', Math.max(0.1, Number(e.target.value)))}
                    error={errors.thickness}
                    className="rounded-xl"
                  />
                  <Input
                    label="Width (mm)"
                    type="number"
                    value={formData.width}
                    onChange={e => handleInputChange('width', Math.max(1, Number(e.target.value)))}
                    error={errors.width}
                    className="rounded-xl"
                  />
                  <Input
                    label="Length (mm)"
                    type="number"
                    value={formData.length}
                    onChange={e => handleInputChange('length', Math.max(1, Number(e.target.value)))}
                    error={errors.length}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Material Density (g/cm³)"
                    type="number"
                    step="0.01"
                    value={formData.materialDensity}
                    onChange={e => handleInputChange('materialDensity', Math.max(0.1, Number(e.target.value)))}
                    className="rounded-xl"
                  />
                  <Input
                    label="Raw Material Base Cost ($/kg)"
                    type="number"
                    step="0.01"
                    value={formData.materialCostPerKg}
                    onChange={e => handleInputChange('materialCostPerKg', Math.max(0.1, Number(e.target.value)))}
                    className="rounded-xl"
                  />
                </div>

                <div className="pt-2 px-4 py-3 bg-zinc-800/20 border border-zinc-800 rounded-xl grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Gross Sheet Weight</span>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">
                      {calculatedResults.grossWeightKg} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Scrap Weight Offcut</span>
                    <p className="text-sm font-mono font-bold text-primary mt-0.5">
                      {calculatedResults.scrapWeightKg} kg
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Scrap Recovery Parameters */}
            <Card className="p-6 bg-zinc-900/40 border-border/80 rounded-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Scrap Offcut Recovery Program
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Scrap Reclaim Efficiency (%)"
                  type="number"
                  value={formData.scrapRecoveryRate}
                  onChange={e => handleInputChange('scrapRecoveryRate', Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="rounded-xl"
                />
                <Input
                  label="Offcut Scrap Value ($/kg)"
                  type="number"
                  step="0.01"
                  value={formData.scrapValuePerKg}
                  onChange={e => handleInputChange('scrapValuePerKg', Math.max(0, Number(e.target.value)))}
                  className="rounded-xl"
                />
              </div>
            </Card>

            {/* 4. Custom Tooling & Dies (if Stamping Press) */}
            {formData.processType !== 'fabrication' && (
              <Card className="p-6 bg-zinc-900/40 border-border/80 rounded-2xl">
                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Stamping Tooling & Custom Dies
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Custom Die/Tool Set Cost ($)"
                    type="number"
                    value={formData.dieCost}
                    onChange={e => handleInputChange('dieCost', Math.max(0, Number(e.target.value)))}
                    className="rounded-xl"
                  />
                  <Input
                    label="Expected Die Life (Strokes)"
                    type="number"
                    value={formData.dieLife}
                    onChange={e => handleInputChange('dieLife', Math.max(1, Number(e.target.value)))}
                    className="rounded-xl"
                  />
                  <Input
                    label="Tool Sharing Factor"
                    type="number"
                    step="0.01"
                    value={formData.dieSharingFactor}
                    onChange={e => handleInputChange('dieSharingFactor', Math.max(0.01, Number(e.target.value)))}
                    className="rounded-xl"
                  />
                  <Input
                    label="Cavities per Stroke"
                    type="number"
                    value={formData.cavityCount}
                    onChange={e => handleInputChange('cavityCount', Math.max(1, Number(e.target.value)))}
                    className="rounded-xl"
                  />
                </div>
              </Card>
            )}

            {/* 5. Production Setup details */}
            <Card className="p-6 bg-zinc-900/40 border-border/80 rounded-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Line Setup & Batch Changeovers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Setup & Changeover Duration (Hrs)"
                  type="number"
                  step="0.1"
                  value={formData.setupTime}
                  onChange={e => handleInputChange('setupTime', Math.max(0, Number(e.target.value)))}
                  className="rounded-xl"
                />
                <Input
                  label="Setup Labor Rate ($/Hr)"
                  type="number"
                  value={formData.setupHourlyRate}
                  onChange={e => handleInputChange('setupHourlyRate', Math.max(0, Number(e.target.value)))}
                  className="rounded-xl"
                />
              </div>
            </Card>

            {/* 6. Operational Cost Centers & Cycle Routings (PLACED ONE BY ONE IN 1 COLUMN AS REQUESTED) */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase text-zinc-400 tracking-widest border-b border-border/40 pb-2 mb-2">
                Operational Cost Centers & Cycle Routings
              </h2>

              <div className="grid grid-cols-1 gap-6">
                
                {/* 1. Coil Unwinding / Shearing */}
                <div className="p-5 bg-zinc-900/20 rounded-2xl border border-border">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border/40 mb-3 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    1. Coil Prep & Blank Shearing
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Shearing Hourly Rate ($/hr)"
                      type="number"
                      value={formData.shearRate}
                      onChange={e => handleInputChange('shearRate', Math.max(0, Number(e.target.value)))}
                      className="rounded-xl"
                    />
                    <Input
                      label="Shearing Speed (Strokes/min)"
                      type="number"
                      value={formData.strokesPerMinuteShear}
                      onChange={e => handleInputChange('strokesPerMinuteShear', Math.max(1, Number(e.target.value)))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* 2. Main forming Press (progressive / tandem) */}
                {formData.processType !== 'fabrication' && (
                  <div className="p-5 bg-zinc-900/20 rounded-2xl border border-border">
                    <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border/40 mb-3 pb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      2. Primary Press Forming Loop
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          label="Press Rate ($/hr)"
                          type="number"
                          value={formData.pressRate}
                          onChange={e => handleInputChange('pressRate', Math.max(0, Number(e.target.value)))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          label="Speed (SPM)"
                          type="number"
                          value={formData.strokesPerMinutePress}
                          onChange={e => handleInputChange('strokesPerMinutePress', Math.max(1, Number(e.target.value)))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          label="Press OEE (%)"
                          type="number"
                          value={formData.pressEfficiency}
                          onChange={e => handleInputChange('pressEfficiency', Math.min(100, Math.max(1, Number(e.target.value))))}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Laser Cut Profile (for fabrication) */}
                {formData.processType === 'fabrication' && (
                  <div className="p-5 bg-zinc-900/20 rounded-2xl border border-border">
                    <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border/40 mb-3 pb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      2. CNC Laser Cutting Center
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          label="Laser Rate ($/hr)"
                          type="number"
                          value={formData.laserRate}
                          onChange={e => handleInputChange('laserRate', Math.max(0, Number(e.target.value)))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          label="Cut Length (mm)"
                          type="number"
                          value={formData.cuttingLength}
                          onChange={e => handleInputChange('cuttingLength', Math.max(1, Number(e.target.value)))}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          label="Feed Speed (mm/min)"
                          type="number"
                          value={formData.cuttingSpeed}
                          onChange={e => handleInputChange('cuttingSpeed', Math.max(1, Number(e.target.value)))}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CNC Press Brake Bending (visible for both bending brake tasks) */}
                <div className="p-5 bg-zinc-900/20 rounded-2xl border border-border">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border/40 mb-3 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {formData.processType === 'fabrication' ? '3. CNC Brake Bending Center' : '3. Post-forming Bending Center'}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3 sm:col-span-1">
                      <Input
                        label="Brake Rate ($/hr)"
                        type="number"
                        value={formData.bendingRate}
                        onChange={e => handleInputChange('bendingRate', Math.max(0, Number(e.target.value)))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <Input
                        label="No. of Bends"
                        type="number"
                        value={formData.numberOfBends}
                        onChange={e => handleInputChange('numberOfBends', Math.max(0, Number(e.target.value)))}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <Input
                        label="Secs per Bend"
                        type="number"
                        value={formData.secondsPerBend}
                        onChange={e => handleInputChange('secondsPerBend', Math.max(0, Number(e.target.value)))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Secondary Processing (Welding/Riveting) */}
                <div className="p-5 bg-zinc-900/20 rounded-2xl border border-border">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border/40 mb-3 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    4. Secondary Station Operations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Secondary Rate ($/hr)"
                      type="number"
                      value={formData.secondaryRate}
                      onChange={e => handleInputChange('secondaryRate', Math.max(0, Number(e.target.value)))}
                      className="rounded-xl"
                    />
                    <Input
                      label="Cycle Time (Sec)"
                      type="number"
                      value={formData.secondaryCycleTime}
                      onChange={e => handleInputChange('secondaryCycleTime', Math.max(0, Number(e.target.value)))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* 6. Inspection & packaging */}
                <div className="p-5 bg-zinc-900/20 rounded-2xl border border-border">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b border-border/40 mb-3 pb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    5. Quality Assurance & Packaging
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="QA Hourly Rate ($/hr)"
                      type="number"
                      value={formData.inspectionRate}
                      onChange={e => handleInputChange('inspectionRate', Math.max(0, Number(e.target.value)))}
                      className="rounded-xl"
                    />
                    <Input
                      label="Inspection Time (Sec)"
                      type="number"
                      value={formData.inspectionCycleTime}
                      onChange={e => handleInputChange('inspectionCycleTime', Math.max(0, Number(e.target.value)))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* 7. Markups / SG&A Card */}
            <Card className="p-6 bg-zinc-900/40 border-border/80 rounded-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                SGA, Profits & Packing Markups
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Overhead SG&A (%)"
                  type="number"
                  value={formData.sgaRate}
                  onChange={e => handleInputChange('sgaRate', Math.max(0, Number(e.target.value)))}
                  className="rounded-xl"
                />
                <Input
                  label="Profit Margin (%)"
                  type="number"
                  value={formData.profitRate}
                  onChange={e => handleInputChange('profitRate', Math.max(0, Number(e.target.value)))}
                  className="rounded-xl"
                />
                <Input
                  label="Logistics & Pack (%)"
                  type="number"
                  value={formData.logisticsRate}
                  onChange={e => handleInputChange('logisticsRate', Math.max(0, Number(e.target.value)))}
                  className="rounded-xl"
                />
              </div>
            </Card>

          </form>

        </div>

        {/* Right Cost Summary Card */}
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl sticky top-6 shadow-2xl">
            <div className="border-b border-border/50 pb-4 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Should-Cost Estimate Sheet</h2>
                <p className="text-[10px] text-zinc-400 font-mono">STAMPING CORE CALCULATOR • SYSTEM RUN</p>
              </div>
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                formData.processType === 'progressive' ? 'bg-purple-500/10 text-purple-400' :
                formData.processType === 'tandem' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {formData.processType}
              </span>
            </div>

            {/* Core Big Cost Display */}
            <div className="text-center p-6 bg-background/80 rounded-2xl border border-border/80 mb-6">
              <span className="text-[11px] uppercase tracking-widest font-black text-zinc-500">Target Part Cost</span>
              <p className="text-4xl font-black text-white tracking-tight font-mono mt-1">
                ${calculatedResults.finalUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-zinc-800/60 text-xs">
                <div>
                  <span className="text-zinc-500 block uppercase font-black text-[9px] tracking-wide">Gross Raw Material</span>
                  <span className="font-mono font-bold text-zinc-300">
                    ${calculatedResults.materialCostRaw.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-black text-[9px] tracking-wide">Scrap Credit</span>
                  <span className="font-mono font-bold text-green-500">
                    -${calculatedResults.recoveredScrapValue.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase font-black text-[9px] tracking-wide">Tooling Cost / Part</span>
                  <span className="font-mono font-bold text-zinc-300">
                    ${calculatedResults.toolingAmortizationPerPart.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pie Chart display */}
            <div className="h-56 relative mb-6 flex items-center justify-center">
              <div className="w-56 h-56">
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Structured Itemized costs */}
            <div className="space-y-3 font-mono text-xs">
              <h3 className="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 border-b border-zinc-800 pb-1">
                Itemized Cost Breakdown
              </h3>
              
              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">1. Net Sheet Material Cost</span>
                <span className="font-bold text-white">${calculatedResults.netMaterialCost.toFixed(2)}</span>
              </div>

              {formData.processType !== 'fabrication' && (
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-400">2. Die Set Amortization</span>
                  <span className="font-bold text-white">${calculatedResults.toolingAmortizationPerPart.toFixed(3)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">3. Raw Prep Shearing</span>
                <span className="font-bold text-white">${calculatedResults.shearingCostPerPart.toFixed(2)}</span>
              </div>

              {formData.processType !== 'fabrication' && (
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-400">4. Main Press Forming</span>
                  <span className="font-bold text-white">${calculatedResults.formingCostPerPart.toFixed(2)}</span>
                </div>
              )}

              {formData.processType === 'fabrication' && (
                <div className="flex justify-between py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-400">4. CNC Laser Cutting</span>
                  <span className="font-bold text-white">${calculatedResults.laserCostPerPart.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">5. Press Brake Bending</span>
                <span className="font-bold text-white">${calculatedResults.bendingCostPerPart.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">6. Secondary Assemblies</span>
                <span className="font-bold text-white">${calculatedResults.secondaryCostPerPart.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">7. Quality Inspection</span>
                <span className="font-bold text-white">${calculatedResults.inspectionCostPerPart.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">8. Setup Cost Allocation</span>
                <span className="font-bold text-white">${calculatedResults.setupCostPerPart.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">9. SGA & Admin overhead</span>
                <span className="font-bold text-white">${calculatedResults.sgaAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">10. Manufacturer Profit</span>
                <span className="font-bold text-white">${calculatedResults.profitAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/40">
                <span className="text-zinc-400">11. Logistics & Packing</span>
                <span className="font-bold text-white">${calculatedResults.logisticsAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-3 text-sm border-t border-zinc-700">
                <span className="font-black text-white">Annual Production Spend</span>
                <span className="font-black text-primary">${calculatedResults.annualSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Call to Action and Save */}
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="primary" onClick={handleSubmit} disabled={saveStatus === 'saving'} className="w-full rounded-2xl py-3 bg-primary hover:bg-primary-dark font-bold shadow-glow-primary">
                {saveStatus === 'saving' ? 'Processing...' : 'Save Cost Model'}
              </Button>
              <p className="text-[10px] text-center text-zinc-500 mt-2 uppercase tracking-wide">
                Values mapped instantly to database tables
              </p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
