
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// Fix: Added missing Calculator icon to lucide-react imports
import { Save, RefreshCw, PieChart as PieIcon, Lock, AlertCircle, ArrowLeft, Calculator } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DataService, AuthService } from '../services/supabaseService';
import { MHRCalculation } from '../types';
import { SaveSuccessModal } from '../components/SaveSuccessModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const MHR: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');

  const [data, setData] = useState<MHRCalculation>({
    id: `mhr-${Date.now()}`,
    machineName: 'New Machine',
    purchasePrice: 50000,
    installationCost: 2000,
    usefulLifeYears: 10,
    salvageValuePercent: 10,
    interestRatePercent: 12,
    powerRatingKw: 15,
    powerRatePerUnit: 0.15,
    spaceSqFt: 150,
    rentPerSqFt: 2.5,
    consumablesPerMonth: 300,
    maintenanceAnnualPercent: 3,
    operatorSalary: 2500,
    supervisionPercent: 20,
    shiftsPerDay: 2,
    hoursPerShift: 8,
    daysPerYear: 300,
    efficiencyPercent: 85
  });

  const [results, setResults] = useState<any>(null);
  const [saveModal, setSaveModal] = useState({ isOpen: false, calcNumber: '' });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (id) {
      loadExisting();
    }
  }, [id]);

  const loadExisting = async () => {
    const list = await DataService.getMHRs();
    const found = list.find(m => m.id === id);
    if (found) setData(found);
  };

  const calculate = () => {
    const totalInvestment = data.purchasePrice + data.installationCost;
    const salvageValue = totalInvestment * (data.salvageValuePercent / 100);
    const depreciableAmount = totalInvestment - salvageValue;

    const depreciation = depreciableAmount / (data.usefulLifeYears || 1);
    const averageInvestment = (totalInvestment + salvageValue) / 2;
    const interestCost = averageInvestment * (data.interestRatePercent / 100);
    const rentCost = data.spaceSqFt * data.rentPerSqFt * 12;
    const maintenanceCost = totalInvestment * (data.maintenanceAnnualPercent / 100);
    
    const annualOperatorCost = data.operatorSalary * 12;
    const supervisionCost = annualOperatorCost * (data.supervisionPercent / 100);
    const consumablesCost = data.consumablesPerMonth * 12;

    const totalHoursAvailable = data.shiftsPerDay * data.hoursPerShift * data.daysPerYear;
    const productiveHours = Math.max(1, totalHoursAvailable * (data.efficiencyPercent / 100));

    const loadFactor = 0.6; 
    const annualPowerUnits = data.powerRatingKw * loadFactor * productiveHours;
    const annualPowerCost = annualPowerUnits * data.powerRatePerUnit;

    const totalAnnualCost = depreciation + interestCost + rentCost + maintenanceCost + annualOperatorCost + supervisionCost + consumablesCost + annualPowerCost;
    const costPerHour = totalAnnualCost / productiveHours;

    setResults({
      mhr: costPerHour.toFixed(2),
      productiveHours: productiveHours.toFixed(0),
      breakdown: [
        { name: 'Depreciation', value: depreciation },
        { name: 'Interest', value: interestCost },
        { name: 'Power', value: annualPowerCost },
        { name: 'Labor & Superv.', value: annualOperatorCost + supervisionCost },
        { name: 'Space & Maint.', value: rentCost + maintenanceCost + consumablesCost }
      ]
    });
  };

  useEffect(() => {
    calculate();
  }, [data]);

  const handleChange = (field: keyof MHRCalculation, value: number | string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await DataService.saveMHR(data);
    setSaveModal({ isOpen: true, calcNumber: data.machineName }); 
  };

  const canShowAnalytics = AuthService.hasFeatureAccess('MHR', 'ANALYTICS');
  const canModifyPower = AuthService.hasFeatureAccess('MHR', 'POWER_ANALYSIS');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <SaveSuccessModal 
        isOpen={saveModal.isOpen}
        onClose={() => { setSaveModal({...saveModal, isOpen: false}); navigate('/mhr'); }}
        calcNumber={saveModal.calcNumber}
        revision="-"
        type="Machine Hour Rate"
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/mhr')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
           <div>
             <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Zero-Based MHR Calculator</h1>
             <p className="text-slate-500">Derive hourly rates from capital and operational expenses.</p>
           </div>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-500/20 neon-hover"
        >
          <Save className="w-5 h-5" /> Save Result
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary-500" /> Capital Investment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Machine Name / Asset ID" type="text" value={data.machineName} onChange={(v: string) => handleChange('machineName', v)} />
              <Input label="Purchase Price ($)" type="number" value={data.purchasePrice} onChange={(v: string) => handleChange('purchasePrice', Number(v))} />
              <Input label="Installation & Training ($)" type="number" value={data.installationCost} onChange={(v: string) => handleChange('installationCost', Number(v))} />
              <Input label="Useful Life (Years)" type="number" value={data.usefulLifeYears} onChange={(v: string) => handleChange('usefulLifeYears', Number(v))} />
              <Input label="Salvage Value (%)" type="number" value={data.salvageValuePercent} onChange={(v: string) => handleChange('salvageValuePercent', Number(v))} />
              <Input label="Interest Rate / WACC (%)" type="number" value={data.interestRatePercent} onChange={(v: string) => handleChange('interestRatePercent', Number(v))} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            {!canModifyPower && (
              <div className="absolute inset-0 z-10 bg-white/40 dark:bg-slate-800/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 max-w-xs">
                    <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800 dark:text-white text-sm">Detailed OPEX Locked</p>
                    <p className="text-xs text-slate-500 mt-1">Granular power and space analysis requires a higher tier plan.</p>
                 </div>
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Operational Expenses (OPEX)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Connected Load (kW)" type="number" value={data.powerRatingKw} onChange={(v: string) => handleChange('powerRatingKw', Number(v))} />
              <Input label="Electricity Tariff ($/kWh)" type="number" value={data.powerRatePerUnit} onChange={(v: string) => handleChange('powerRatePerUnit', Number(v))} />
              <Input label="Floor Space Used (sq.ft)" type="number" value={data.spaceSqFt} onChange={(v: string) => handleChange('spaceSqFt', Number(v))} />
              <Input label="Space Rent ($/sq.ft/mo)" type="number" value={data.rentPerSqFt} onChange={(v: string) => handleChange('rentPerSqFt', Number(v))} />
              <Input label="Operator Monthly Salary ($)" type="number" value={data.operatorSalary} onChange={(v: string) => handleChange('operatorSalary', Number(v))} />
              <Input label="Annual Maintenance %" type="number" value={data.maintenanceAnnualPercent} onChange={(v: string) => handleChange('maintenanceAnnualPercent', Number(v))} />
            </div>
          </div>
          
           <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Availability & Efficiency</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Shifts per Day" type="number" value={data.shiftsPerDay} onChange={(v: string) => handleChange('shiftsPerDay', Number(v))} />
              <Input label="Hours per Shift" type="number" value={data.hoursPerShift} onChange={(v: string) => handleChange('hoursPerShift', Number(v))} />
              <Input label="Planned Op Days/Year" type="number" value={data.daysPerYear} onChange={(v: string) => handleChange('daysPerYear', Number(v))} />
              <div className="md:col-span-3">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Plant Efficiency (%)</label>
                 <div className="flex items-center gap-6">
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      step="1" 
                      value={data.efficiencyPercent} 
                      onChange={e => handleChange('efficiencyPercent', Number(e.target.value))} 
                      className="flex-1 accent-primary-600" 
                    />
                    <span className="text-2xl font-black text-primary-600 w-16 text-right">{data.efficiencyPercent}%</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator className="w-32 h-32 rotate-12" /></div>
             <div className="relative z-10">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Calculated Rate</div>
                <div className="text-6xl font-black text-emerald-400 tracking-tighter mb-6">
                  ${results?.mhr}
                  <span className="text-lg text-slate-400 font-normal ml-2">/hr</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                   <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Productive Hrs</div>
                      <div className="text-xl font-bold">{results?.productiveHours}</div>
                   </div>
                   <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Idle Loss</div>
                      <div className="text-xl font-bold text-red-500">{(100 - data.efficiencyPercent).toFixed(0)}%</div>
                   </div>
                </div>
             </div>
          </div>

          {!canShowAnalytics ? (
            <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-2xl flex items-center justify-center mb-4">
                 <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white">Analysis Restricted</h4>
              <p className="text-xs text-slate-500 mt-2">Visual cost breakdowns and trend impact studies are PRO features.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                 <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-6 text-center">Annual Cost Breakdown</h4>
                 <div className="h-64 w-full">
                   {isMounted && results?.breakdown && (
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={results.breakdown}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={85}
                           paddingAngle={5}
                           dataKey="value"
                         >
                           {results.breakdown.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                         <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                       </PieChart>
                     </ResponsiveContainer>
                   )}
                 </div>
              </div>

               <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                 <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-6 text-center">Cost Factor Impact</h4>
                 <div className="h-64 w-full">
                   {isMounted && results?.breakdown && (
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={results.breakdown} layout="vertical" margin={{ left: 0, right: 30 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                          <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                          <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                       </BarChart>
                     </ResponsiveContainer>
                   )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, type, value, onChange }: any) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
    />
  </div>
);
