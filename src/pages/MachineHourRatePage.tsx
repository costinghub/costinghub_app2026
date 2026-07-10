import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  HelpCircle, 
  AlertCircle, 
  Printer, 
  DollarSign, 
  Wrench, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Plus, 
  Activity, 
  TrendingUp, 
  Info,
  Save,
  ChevronLeft
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CalculationHeader } from '../components/CalculationHeader';
import type { User, Calculation, View } from '../types';

interface MachineHourRatePageProps {
  user: User;
  onSave: (calculation: Calculation) => Promise<void>;
  onSaveDraft: (calculation: Calculation) => Promise<void>;
  onBack: () => void;
  existingCalculation: Calculation | null;
  theme: 'light' | 'dark';
  onNavigate: (view: View) => void;
}

interface FormData {
  id: string;
  calculationNumber: string;
  partNumber: string;
  partName: string;
  customerName: string;
  revision: string;
  createdAt: string;
  currency: string;
  region: string;
  notes: string;
  
  // Machine details
  machineName: string;
  brand: string;
  model: string;
  machineType: string;

  // 1. Machine Cost & Installation
  machineCost: number;
  installationPercent: number;
  scrapValue: number;

  // 2. Depreciation & Loan Interest
  depreciationPercent: number;
  lifeYears: number;
  loanAmount: number;
  loanInterestRate: number;

  // 3. Space / Rent
  spaceLengthFt: number;
  spaceWidthFt: number;
  annualRentPerSqFt: number;

  // 4. Supervision & Insurance
  supervisorAnnualSalary: number;
  supervisorTimePercent: number;
  annualInsurancePremium: number;

  // 6. Variable Cost
  powerUnitsPerHr: number;
  powerRatePerUnit: number;
  maintenancePercentOfCapital: number;
  consumablesPercentOfCapital: number;

  // 7. Utilisation
  workingDaysPerYear: number;
  workingHoursPerDay: number;
  efficiencyPercent: number;

  // 8. Labour
  hourlyLabourRate: number;
}

const INITIAL_FORM_DATA: FormData = {
  id: '',
  calculationNumber: '',
  partNumber: '',
  partName: 'Machine Hour Rate Estimation',
  customerName: '',
  revision: 'A',
  createdAt: '',
  currency: 'USD',
  region: 'USA',
  notes: '',

  machineName: 'CNC 5-Axis Machining Center',
  brand: 'Haas',
  model: 'UMC-750',
  machineType: 'CNC Milling',

  machineCost: 150000,
  installationPercent: 10, // 10%
  scrapValue: 15000,

  depreciationPercent: 12.5, // 12.5%
  lifeYears: 8,
  loanAmount: 100000,
  loanInterestRate: 6.5, // 6.5%

  spaceLengthFt: 15,
  spaceWidthFt: 15,
  annualRentPerSqFt: 25,

  supervisorAnnualSalary: 75000,
  supervisorTimePercent: 15, // 15%
  annualInsurancePremium: 3500,

  powerUnitsPerHr: 18, // 18 kW/hr
  powerRatePerUnit: 0.12, // $0.12 per kWh
  maintenancePercentOfCapital: 4, // 4% per annum
  consumablesPercentOfCapital: 2.5, // 2.5% per annum

  workingDaysPerYear: 250,
  workingHoursPerDay: 16, // 2 shifts
  efficiencyPercent: 85, // 85% efficiency

  hourlyLabourRate: 28.50,
};

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (¥)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' }
];

export const MachineHourRatePage: React.FC<MachineHourRatePageProps> = ({
  user,
  onSave,
  onSaveDraft,
  onBack,
  existingCalculation,
  theme,
  onNavigate
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
    if (existingCalculation && existingCalculation.inputs) {
      return {
        ...INITIAL_FORM_DATA,
        ...existingCalculation.inputs,
        id: existingCalculation.id,
        calculationNumber: existingCalculation.calculationNumber || existingCalculation.id,
        partName: existingCalculation.name || existingCalculation.inputs.partName || 'Machine Hour Rate Estimation',
        createdAt: existingCalculation.created_at || new Date().toISOString()
      };
    }
    const generatedId = `MHR-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      ...INITIAL_FORM_DATA,
      id: generatedId,
      calculationNumber: generatedId,
      createdAt: new Date().toISOString()
    };
  });

  const [saving, setSaving] = useState(false);

  // Sync inputs with state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const currentCurrency = useMemo(() => {
    return CURRENCY_OPTIONS.find(c => c.code === formData.currency) || CURRENCY_OPTIONS[0];
  }, [formData.currency]);

  // Calculations Logic (9 Sections as detailed by user)
  const results = useMemo(() => {
    // 1. Machine Cost & Installation
    const installationCost = formData.machineCost * (formData.installationPercent / 100);
    const capitalizedCost = formData.machineCost + installationCost;

    // 2. Depreciation & Loan Interest
    const annualDepreciation = capitalizedCost * (formData.depreciationPercent / 100);
    const slmDepreciationCrossCheck = formData.lifeYears > 0 
      ? (capitalizedCost - formData.scrapValue) / formData.lifeYears 
      : 0;
    
    const annualLoanInterest = formData.loanAmount * (formData.loanInterestRate / 100);

    // 3. Space / Rent
    const spaceAreaSqFt = formData.spaceLengthFt * formData.spaceWidthFt;
    const annualRentCost = spaceAreaSqFt * formData.annualRentPerSqFt;

    // 4. Supervision & Insurance
    const allocatedSupervisorCost = formData.supervisorAnnualSalary * (formData.supervisorTimePercent / 100);
    const totalSupervisionInsurance = allocatedSupervisorCost + formData.annualInsurancePremium;

    // 5. Total Fixed Cost (Annual)
    const totalFixedCost = annualDepreciation + annualLoanInterest + annualRentCost + totalSupervisionInsurance;

    // 7. Utilisation / Working Hours
    const totalNominalHours = formData.workingDaysPerYear * formData.workingHoursPerDay;
    const effectiveMachineHours = totalNominalHours * (formData.efficiencyPercent / 100);

    // 6. Variable Cost (excluding operator labor)
    const annualPowerCost = formData.powerUnitsPerHr * formData.powerRatePerUnit * effectiveMachineHours;
    const annualMaintenanceCost = capitalizedCost * (formData.maintenancePercentOfCapital / 100);
    const annualConsumablesCost = capitalizedCost * (formData.consumablesPercentOfCapital / 100);
    
    const totalVariableCost = annualPowerCost + annualMaintenanceCost + annualConsumablesCost;

    // Hourly Rates Calculation
    const hourlyFixedRate = effectiveMachineHours > 0 ? totalFixedCost / effectiveMachineHours : 0;
    const hourlyVariableRate = effectiveMachineHours > 0 ? totalVariableCost / effectiveMachineHours : 0;
    
    // Machine Burden Rate = Fixed Burden Rate + Variable Burden Rate
    const machineBurdenRate = hourlyFixedRate + hourlyVariableRate;

    // Total Machine Hour Rate = Machine Burden Rate + Labour operator rate
    const totalMachineHourRate = machineBurdenRate + formData.hourlyLabourRate;

    return {
      installationCost,
      capitalizedCost,
      annualDepreciation,
      slmDepreciationCrossCheck,
      annualLoanInterest,
      spaceAreaSqFt,
      annualRentCost,
      allocatedSupervisorCost,
      totalSupervisionInsurance,
      totalFixedCost,
      effectiveMachineHours,
      annualPowerCost,
      annualMaintenanceCost,
      annualConsumablesCost,
      totalVariableCost,
      hourlyFixedRate,
      hourlyVariableRate,
      machineBurdenRate,
      totalMachineHourRate
    };
  }, [formData]);

  const handleSaveDraftClick = async () => {
    setSaving(true);
    try {
      const calculation: Calculation = {
        id: formData.id,
        name: formData.partName || `${formData.brand} ${formData.model} MHR`,
        inputs: formData,
        results: results,
        status: 'draft',
        user_id: user.id,
        created_at: formData.createdAt,
        calculatorType: 'machineHourRate'
      };
      await onSaveDraft(calculation);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFinalClick = async () => {
    setSaving(true);
    try {
      const calculation: Calculation = {
        id: formData.id,
        name: formData.partName || `${formData.brand} ${formData.model} MHR`,
        inputs: formData,
        results: results,
        status: 'final',
        user_id: user.id,
        created_at: formData.createdAt,
        calculatorType: 'machineHourRate'
      };
      await onSave(calculation);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen text-left">
      <div className="flex justify-between items-center mb-6 no-print">
        <Button type="button" variant="secondary" onClick={onBack} size="sm">
          ← Calculations Dashboard
        </Button>
        <div className="flex gap-2">
          <Button type="button" onClick={() => window.print()} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1.5" />
            Print as PDF
          </Button>
          <Button type="button" onClick={handleSaveDraftClick} variant="secondary" size="sm" disabled={saving}>
            Save Draft
          </Button>
          <Button type="button" onClick={handleSaveFinalClick} variant="primary" size="sm" disabled={saving}>
            Save Final & Lock
          </Button>
        </div>
      </div>

      <CalculationHeader 
        calcId={formData.calculationNumber}
        partName={formData.partName}
        partNumber={formData.partNumber}
        customer={formData.customerName}
        created={formData.createdAt}
        type="machineHourRate"
        status={existingCalculation?.status === 'final' ? 'Final' : 'Draft'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-32">
        {/* Left Column - Detailed Inputs & Formula Previews */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Metadata & Machine Details */}
          <Card>
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-500" />
              Machine Profile & Job Specification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Machine Name</label>
                <input
                  type="text"
                  name="machineName"
                  value={formData.machineName}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Brand / Make</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Machine Type</label>
                <input
                  type="text"
                  name="machineType"
                  value={formData.machineType}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Internal / Direct"
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Part Name</label>
                <input
                  type="text"
                  name="partName"
                  value={formData.partName}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Part / Drg Number</label>
                <input
                  type="text"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleInputChange}
                  placeholder="MHR-A01"
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Active Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm font-black text-primary focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                >
                  {CURRENCY_OPTIONS.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* 1. Machine Cost & Installation */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4 flex justify-between items-center">
              <span>1. Capital Cost & Installation Details</span>
              <span className="text-xs font-medium text-text-muted font-mono">Inputs highlighted in blue font</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Machine Purchase Price ({currentCurrency.symbol})</label>
                <input
                  type="number"
                  name="machineCost"
                  value={formData.machineCost}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Installation Cost (% of machine)</label>
                <input
                  type="number"
                  name="installationPercent"
                  value={formData.installationPercent}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Estimated Scrap Value ({currentCurrency.symbol})</label>
                <input
                  type="number"
                  name="scrapValue"
                  value={formData.scrapValue}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Installation Cost</span>
                <span className="font-mono text-base font-bold text-text-primary">
                  {currentCurrency.symbol}{results.installationCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-sm border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Total Capitalized Cost</span>
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                  {currentCurrency.symbol}{results.capitalizedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Formula: Machine Cost + Installation Cost</p>
              </div>
            </div>
          </Card>

          {/* 2. Depreciation & Loan Interest */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">2. Depreciation & Financing Charges</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Depreciation (% per annum)</label>
                <input
                  type="number"
                  name="depreciationPercent"
                  value={formData.depreciationPercent}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Machine Life (Years)</label>
                <input
                  type="number"
                  name="lifeYears"
                  value={formData.lifeYears}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Financed / Loan Amount</label>
                <input
                  type="number"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Loan Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  name="loanInterestRate"
                  value={formData.loanInterestRate}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Annual Depreciation</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-text-secondary mt-1 font-mono">Capital Cost × Depr%</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Depr. Cross-Check (SLM)</span>
                <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                  {currentCurrency.symbol}{results.slmDepreciationCrossCheck.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-text-secondary mt-1 font-mono">Formula: (Capital Cost - Scrap) / Life</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Annual Interest on Loan</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualLoanInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-text-secondary mt-1 font-mono">Loan Amount × Interest%</p>
              </div>
            </div>
          </Card>

          {/* 3. Space & Rent */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">3. Floor Space & Rent Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Space Length (ft)</label>
                <input
                  type="number"
                  name="spaceLengthFt"
                  value={formData.spaceLengthFt}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Space Width (ft)</label>
                <input
                  type="number"
                  name="spaceWidthFt"
                  value={formData.spaceWidthFt}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Annual Rent rate (per Sq Ft)</label>
                <input
                  type="number"
                  name="annualRentPerSqFt"
                  value={formData.annualRentPerSqFt}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Allocated Machine Area</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {results.spaceAreaSqFt} Sq Ft
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Formula: Length × Width</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Annual Space Cost Allocation</span>
                <span className="font-mono text-base font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualRentCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Formula: Sq Ft Area × Rent Rate</p>
              </div>
            </div>
          </Card>

          {/* 4. Supervision & Insurance */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">4. Supervision & Insurance Premium</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Supervisor Annual Salary</label>
                <input
                  type="number"
                  name="supervisorAnnualSalary"
                  value={formData.supervisorAnnualSalary}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Supervisor Time Allocated (%)</label>
                <input
                  type="number"
                  name="supervisorTimePercent"
                  value={formData.supervisorTimePercent}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Flat Annual Insurance Premium</label>
                <input
                  type="number"
                  name="annualInsurancePremium"
                  value={formData.annualInsurancePremium}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Allocated Supervision Cost</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.allocatedSupervisorCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Salary × % Allocated</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Total Supervision & Insurance</span>
                <span className="font-mono text-base font-bold text-text-primary">
                  {currentCurrency.symbol}{results.totalSupervisionInsurance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Allocated Supervisor Cost + Insurance Premium</p>
              </div>
            </div>
          </Card>

          {/* 7. Utilisation */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">5. Operational Utilisation & Time Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Working Days per Year</label>
                <input
                  type="number"
                  name="workingDaysPerYear"
                  value={formData.workingDaysPerYear}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Shift Hours per Day</label>
                <input
                  type="number"
                  name="workingHoursPerDay"
                  value={formData.workingHoursPerDay}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Machine Efficiency (%)</label>
                <input
                  type="number"
                  name="efficiencyPercent"
                  value={formData.efficiencyPercent}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl">
              <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Effective Annual Machine Hours</span>
              <span className="font-mono text-xl font-black text-sky-600 dark:text-sky-400">
                {results.effectiveMachineHours.toLocaleString(undefined, { maximumFractionDigits: 0 })} Hours / Annum
              </span>
              <p className="text-[10px] text-text-muted mt-1 font-mono">Formula: Working Days × Shift Hours × Efficiency% (accounts for idle time loading)</p>
            </div>
          </Card>

          {/* 6. Variable Cost */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">6. Variable Cost & Resource Consumables</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Power Rating (units/hr)</label>
                <input
                  type="number"
                  name="powerUnitsPerHr"
                  value={formData.powerUnitsPerHr}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Power tariff (rate/unit)</label>
                <input
                  type="number"
                  name="powerRatePerUnit"
                  value={formData.powerRatePerUnit}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Maintenance (% capital)</label>
                <input
                  type="number"
                  name="maintenancePercentOfCapital"
                  value={formData.maintenancePercentOfCapital}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Consumables (% capital)</label>
                <input
                  type="number"
                  name="consumablesPercentOfCapital"
                  value={formData.consumablesPercentOfCapital}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Annual Power Cost</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualPowerCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Rating × Tariff × Effective Hours</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Annual Maintenance Cost</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Capital Cost × Maintenance %</p>
              </div>
              <div className="border-l border-border pl-4">
                <span className="text-text-muted block text-xs font-bold uppercase tracking-wider">Annual Consumables Cost</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualConsumablesCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-text-muted mt-1 font-mono">Capital Cost × Consumables %</p>
              </div>
            </div>
          </Card>

          {/* 8. Labour operator rate */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">7. Operator / Labour Rate</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-secondary">Hourly Operator / Labour Rate ({currentCurrency.symbol}/hr)</label>
                <input
                  type="number"
                  name="hourlyLabourRate"
                  value={formData.hourlyLabourRate}
                  onChange={handleInputChange}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm text-[#2563eb] font-bold"
                />
              </div>
              <div className="bg-sky-50/20 border border-sky-100 dark:border-sky-500/10 p-4 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-sky-700 dark:text-sky-400 block mb-1">Labour Separation Notice</span>
                  <p className="text-text-secondary leading-relaxed">
                    Accountancy standards keep operator labour separated from machine burden rates to allow flexible job cost matching when machines run unattended.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes and Assumptions */}
          <Card>
            <h3 className="text-base font-bold text-text-primary border-b border-border pb-2 mb-4">8. Notes & Documentation</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Record any cost engineering assumptions, technical constraints, or specific financing options here..."
              className="w-full bg-surface border border-border rounded-xl p-3 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </Card>

        </div>

        {/* Right Column - Cost Summary Results & Visualizations */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <Card className="bg-gradient-to-b from-slate-950 to-slate-900 text-white border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-lg font-black tracking-tight text-white mb-6 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>MHR Results Dashboard</span>
              <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                Live Solving
              </span>
            </h3>

            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Annual Fixed Cost Subtotal</span>
                <span className="font-mono text-lg font-bold text-slate-100">
                  {currentCurrency.symbol}{results.totalFixedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Annual Variable Cost Subtotal</span>
                <span className="font-mono text-lg font-bold text-slate-100">
                  {currentCurrency.symbol}{results.totalVariableCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Effective Operating Hours</span>
                <span className="font-mono text-lg font-bold text-sky-400">
                  {results.effectiveMachineHours.toLocaleString(undefined, { maximumFractionDigits: 0 })} Hours
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-sky-400 block mb-0.5">Machine Burden Rate (Hourly)</span>
                  <span className="font-mono text-2xl font-black text-white">
                    {currentCurrency.symbol}{results.machineBurdenRate.toFixed(2)}/hr
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">Burden Rate = (Fixed + Variable Cost) / Hours</p>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 block mb-0.5">Operator Labour Rate (Hourly)</span>
                  <span className="font-mono text-xl font-bold text-slate-200">
                    {currentCurrency.symbol}{formData.hourlyLabourRate.toFixed(2)}/hr
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3 bg-gradient-to-r from-sky-500/10 to-transparent p-3 rounded-lg border-l-4 border-sky-400">
                  <span className="text-[10px] uppercase font-black tracking-wider text-sky-300 block mb-1">Total Machine Hour Rate</span>
                  <span className="font-mono text-3xl font-black text-sky-400">
                    {currentCurrency.symbol}{results.totalMachineHourRate.toFixed(2)}/hr
                  </span>
                  <p className="text-[9px] text-slate-300 mt-1 font-mono">Combined Rate: Machine Burden + Operator Labour</p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-500 font-mono">
              PRECISION WORKBOOK • COSTINGHUB CORE
            </div>
          </Card>

          {/* Quick Stats Bento Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-2">Space Rent Cost</span>
              <div>
                <span className="text-xs text-text-muted block font-medium">Annualized rent</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{results.annualRentCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-2">Power Burden</span>
              <div>
                <span className="text-xs text-text-muted block font-medium">Hourly resource power</span>
                <span className="font-mono text-sm font-bold text-text-primary">
                  {currentCurrency.symbol}{(results.effectiveMachineHours > 0 ? results.annualPowerCost / results.effectiveMachineHours : 0).toFixed(2)}/hr
                </span>
              </div>
            </Card>
          </div>

          <Card className="bg-surface/50 border border-dashed border-border p-4 text-xs space-y-3">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Excel-Equivalent Formula References</h4>
            <ul className="space-y-2 font-mono text-[10px] text-text-secondary">
              <li><strong className="text-text-primary">Capital Cost:</strong> =Cost + (Cost * Install%)</li>
              <li><strong className="text-text-primary">SLM Depr:</strong> =(Capital Cost - Scrap) / Life</li>
              <li><strong className="text-text-primary">Rent Alloc:</strong> =Length * Width * Rate</li>
              <li><strong className="text-text-primary">Burden Rate:</strong> =Sum(Fixed + Variable) / Hours</li>
            </ul>
          </Card>
        </div>

      </div>
    </div>
  );
};
