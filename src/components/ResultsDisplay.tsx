
import React from 'react';
import type { MachiningResult, CastingResult, ForgingResult, StampingResult, MarkupCosts, Markups } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { CastingSchematics } from './CastingSchematics';
import { ForgingSchematics } from './ForgingSchematics';
import { MachiningSchematics } from './MachiningSchematics';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ResultsDisplayProps {
  results: MachiningResult | CastingResult | ForgingResult | StampingResult | null;
  currency: string;
  markups: Markups;
  batchVolume?: number;
  isPdfMode?: boolean;
}

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(value);
  } catch (e) {
    console.error("Invalid currency code:", currency);
    return `$${value.toFixed(2)}`; 
  }
};

const formatNumber = (value: number, digits: number = 2) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

const ResultRow: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`flex justify-between items-center py-3 px-4 rounded-lg ${className}`}>
    <span className="text-text-secondary">{label}</span>
    <span className="font-semibold text-text-primary">{value}</span>
  </div>
);

const markupLabels: Record<string, string> = {
  general: 'General Markup',
  admin: 'Admin Markup',
  sales: 'Sales Markup',
  miscellaneous: 'Misc. Markup',
  packing: 'Packing Markup',
  transport: 'Transport Markup',
  profit: 'Profit Markup',
  duty: 'Duty Markup',
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, currency, markups, batchVolume, isPdfMode }) => {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-semibold text-primary">No Results</h3>
          <p>Calculation data could not be loaded.</p>
      </div>
    );
  }

  const vol = batchVolume && batchVolume > 0 ? batchVolume : 1;
  const isCasting = results && 'pouredWeightKg' in results;
  const isStamping = results && 'grossWeightKg' in results;
  const isForging = results && 'rawBilletWeightKg' in results;

  if (isCasting) {
    const castRes = results as any;
    const surfUnit = (castRes.surfaceTreatmentCost || 0) / vol;
    
    // markup splits
    const allMarkupCostsCast = Object.entries(castRes.markupCosts || {})
      .filter(([, value]) => (value as number) > 0)
      .map(([key, value]) => ({
        label: (markupLabels as Record<string, string>)[key] || key,
        value: value as number,
        percentage: markups[key as keyof Markups] || 0,
      }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Metallic Alloy & Weight Run</h3>
                  <div className="bg-surface rounded-lg p-2 space-y-1">
                     <ResultRow label="Poured Molten Metal Weight" value={`${formatNumber(castRes.pouredWeightKg, 3)} kg`} className="bg-background/50"/>
                     <ResultRow label="Risers & Gating Scrap Weight" value={`${formatNumber(castRes.scrapWeightKg, 3)} kg`} className=""/>
                     <ResultRow label="Raw Metallic Ore Cost / Part" value={formatCurrency(castRes.rawMaterialPartCost, currency)} className="bg-background/50 font-semibold" />
                     <ResultRow label="Solid Scrap Return Credit / Part" value={`-${formatCurrency(castRes.scrapCreditPerPart, currency)}`} className="text-green-600 font-mono bg-background/50"/>
                     <ResultRow label="Net Metallic Alloy Cost / Part" value={formatCurrency(castRes.netMaterialCostPerPart, currency)} className="bg-primary/5 font-extrabold" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Foundry Processing Routings</h3>
                  <div className="bg-surface rounded-lg p-2 space-y-1">
                     <ResultRow label="Melting Electricity & Energy" value={formatCurrency(castRes.meltingCostPerPart, currency)} className="bg-background/50"/>
                     <ResultRow label="Molding Station Labor" value={formatCurrency(castRes.moldingCostPerPart, currency)} className=""/>
                     <ResultRow label="Metal Pouring & Casting Team" value={formatCurrency(castRes.pouringCostPerPart, currency)} className="bg-background/50"/>
                     {castRes.coreCostPerPart > 0 && (
                       <ResultRow label="Sand Core Core-Making" value={formatCurrency(castRes.coreCostPerPart, currency)} className=""/>
                     )}
                     <ResultRow label="Shakeout, Fettling & Finishing" value={formatCurrency(castRes.fettlingCostPerPart, currency)} className="bg-background/50"/>
                     <ResultRow label="Amortized Pattern/Die Tooling" value={formatCurrency(castRes.toolingAmortizedCostPerPart, currency)} className=""/>
                  </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 border border-border/50 min-h-[300px]">
                <span className="text-[10px] font-black uppercase text-indigo-400 absolute top-4 left-4 tracking-widest">Foundry Process Visual</span>
                <CastingSchematics type={castRes.castingProcess || 'Sand Casting'} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Cost Breakdown (Unit)</h3>
            {(() => {
                const rawData = [
                  { label: 'Net metallic Cost', value: castRes.netMaterialCostPerPart },
                  { label: 'Melting energy', value: castRes.meltingCostPerPart },
                  { label: 'Molding Op', value: castRes.moldingCostPerPart },
                  { label: 'Pouring Op', value: castRes.pouringCostPerPart },
                  ...(castRes.coreCostPerPart > 0 ? [{ label: 'Sand cores', value: castRes.coreCostPerPart }] : []),
                  { label: 'Fettling finishing', value: castRes.fettlingCostPerPart },
                  { label: 'Mold Amortization', value: castRes.toolingAmortizedCostPerPart },
                  { label: 'Surface treatments', value: surfUnit },
                  ...allMarkupCostsCast.map(m => ({
                    label: m.label,
                    value: m.value / vol,
                  }))
                ].filter(item => item.value > 0);

                const totalSum = rawData.reduce((sum, item) => sum + item.value, 0);

                const colors = [
                  '#4f46e5', // Indigo
                  '#ef4444', // Red
                  '#10b981', // Emerald
                  '#f59e0b', // Amber
                  '#06b6d4', // Cyan
                  '#ec4899', // Pink
                  '#8b5cf6', // Violet
                  '#14b8a6', // Teal
                  '#64748b', // Slate
                ];

                const tableData = rawData.map((item, idx) => ({
                  ...item,
                  color: colors[idx % colors.length],
                  percentage: totalSum > 0 ? (item.value / totalSum * 100) : 0
                }));

                const pieChartData = {
                  labels: tableData.map(d => d.label),
                  datasets: [
                    {
                      data: tableData.map(d => d.value),
                      backgroundColor: tableData.map(d => d.color),
                      borderColor: '#ffffff',
                      borderWidth: 1.5,
                    }
                  ]
                };

                const pieChartOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const label = context.label || '';
                          const val = context.parsed || 0;
                          const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0';
                          return ` ${label}: ${formatCurrency(val, currency)} (${pct}%)`;
                        }
                      }
                    }
                  }
                };

                return (
                    <div className={`grid grid-cols-1 ${isPdfMode ? '' : 'lg:grid-cols-12'} gap-6 items-center bg-surface rounded-xl p-4 border border-border/50 shadow-sm`}>
                        {!isPdfMode && (
                          <div className="lg:col-span-5 h-44 md:h-48 relative flex justify-center items-center">
                              <Pie data={pieChartData} options={pieChartOptions} />
                          </div>
                        )}

                        <div className={isPdfMode ? 'overflow-x-auto w-full' : 'lg:col-span-7 overflow-x-auto w-full'}>
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border/60 bg-background/50 text-xxs font-semibold text-text-secondary uppercase select-none">
                                        <th className="py-2.5 px-3">Cost Element</th>
                                        <th className="py-2.5 px-3 text-right">{isPdfMode ? "Price" : "Unit Price"}</th>
                                        <th className="py-2.5 px-3 text-right">Share (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {tableData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-background/20 font-medium">
                                            <td className="py-2 px-3 flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                                <span className="text-text-primary capitalize">{item.label}</span>
                                            </td>
                                            <td className="py-2 px-3 text-right text-text-primary font-semibold whitespace-nowrap">
                                                {formatCurrency(item.value, currency)}
                                            </td>
                                            <td className="py-2 px-3 text-right text-text-secondary font-mono">
                                                {formatNumber(item.percentage, 1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Summary</h3>
          <div className="bg-surface rounded-lg p-2 space-y-1">
            {!isPdfMode && (
              <ResultRow label="Total Batch Cost" value={formatCurrency(castRes.totalCost, currency)} className="bg-background/50"/>
            )}
            <ResultRow label={isPdfMode ? "Cost / Part" : "Cost / Part (Unit Price)"} value={formatCurrency(castRes.costPerPart, currency)} className="bg-indigo-600 !text-white font-bold mt-2 pt-4 border-t border-border" />
          </div>
        </div>
      </div>
    );
  }

  if (isForging) {
    const forgeRes = results as any;
    const surfUnit = (forgeRes.surfaceTreatmentCost || 0) / vol;
    
    // markup splits
    const allMarkupCostsForge = Object.entries(forgeRes.markupCosts || {})
      .filter(([, value]) => (value as number) > 0)
      .map(([key, value]) => ({
        label: (markupLabels as Record<string, string>)[key] || key,
        value: value as number,
        percentage: markups[key as keyof Markups] || 0,
      }));

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Billet Spec & Mass Yield</h3>
                  <div className="bg-surface rounded-lg p-2 space-y-1">
                     <ResultRow label="Total Input Billet Weight" value={`${formatNumber(forgeRes.rawBilletWeightKg, 3)} kg`} className="bg-background/50"/>
                     <ResultRow label="Oxide Scale Evaporation Loss" value={`${formatNumber(forgeRes.scaleLossWeightKg, 3)} kg`} className=""/>
                     <ResultRow label="Flash & Trimming Scrap Weight" value={`${formatNumber(forgeRes.flashScrapWeightKg, 3)} kg`} className="bg-background/50"/>
                     <ResultRow label="Raw Billet Base Cost" value={formatCurrency(forgeRes.rawMaterialBilletCost, currency)} className="font-semibold" />
                     <ResultRow label="Trimmings Scrap Credit Return" value={`-${formatCurrency(forgeRes.scrapCreditPerPart, currency)}`} className="text-green-600 font-mono bg-background/50"/>
                     <ResultRow label="Net Billet Metal Cost" value={formatCurrency(forgeRes.netMaterialCostPerPart, currency)} className="bg-primary/5 font-extrabold" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Operational Press & Cycle Routings</h3>
                  <div className="bg-surface rounded-lg p-2 space-y-1">
                     <ResultRow label="Billet Furnace Heating (Gas/Electric)" value={formatCurrency(forgeRes.heatingCostPerPart, currency)} className="bg-background/50"/>
                     <ResultRow label="Billet Shearing / Cutting Op" value={formatCurrency(forgeRes.shearingCostPerPart, currency)} className=""/>
                     <ResultRow label="Primary Forging Press / Hammer Strike" value={formatCurrency(forgeRes.forgingPressCostPerPart, currency)} className="bg-background/50"/>
                     <ResultRow label="Residual Flash Trimming & Piercing" value={formatCurrency(forgeRes.trimmingCostPerPart, currency)} className=""/>
                     <ResultRow label="Amortized Die Set Tooling" value={formatCurrency(forgeRes.toolingAmortizedCostPerPart, currency)} className="bg-background/50"/>
                     {surfUnit > 0 && (
                       <ResultRow label="Surface Chemical/Blast Coatings" value={formatCurrency(surfUnit, currency)} className=""/>
                     )}
                  </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 border border-border/50 min-h-[300px]">
                <span className="text-[10px] font-black uppercase text-rose-400 absolute top-4 left-4 tracking-widest">Forging Schematic</span>
                <ForgingSchematics type={forgeRes.forgingType || 'Closed Die Forging'} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Should-Cost Breakdown (Unit)</h3>
            {(() => {
                const rawData = [
                  { label: 'Net metallic billet', value: forgeRes.netMaterialCostPerPart },
                  { label: 'Furnace heating', value: forgeRes.heatingCostPerPart },
                  { label: 'Cutting/shearing', value: forgeRes.shearingCostPerPart },
                  { label: 'Press forged operation', value: forgeRes.forgingPressCostPerPart },
                  { label: 'Flashing trimming', value: forgeRes.trimmingCostPerPart },
                  { label: 'Die set Amortization', value: forgeRes.toolingAmortizedCostPerPart },
                  ...(surfUnit > 0 ? [{ label: 'Surface treatment', value: surfUnit }] : []),
                  ...allMarkupCostsForge.map(m => ({
                    label: m.label,
                    value: m.value / vol,
                  }))
                ].filter(item => item.value > 0);

                const totalSum = rawData.reduce((sum, item) => sum + item.value, 0);

                const colors = [
                  '#e11d48', // Rose
                  '#f59e0b', // Amber
                  '#10b981', // Emerald
                  '#3b82f6', // Blue
                  '#06b6d4', // Cyan
                  '#8b5cf6', // Violet
                  '#14b8a6', // Teal
                  '#64748b', // Slate
                ];

                const tableData = rawData.map((item, idx) => ({
                  ...item,
                  color: colors[idx % colors.length],
                  percentage: totalSum > 0 ? (item.value / totalSum * 100) : 0
                }));

                const pieChartData = {
                  labels: tableData.map(d => d.label),
                  datasets: [
                    {
                      data: tableData.map(d => d.value),
                      backgroundColor: tableData.map(d => d.color),
                      borderColor: '#ffffff',
                      borderWidth: 1.5,
                    }
                  ]
                };

                const pieChartOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const label = context.label || '';
                          const val = context.parsed || 0;
                          const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0';
                          return ` ${label}: ${formatCurrency(val, currency)} (${pct}%)`;
                        }
                      }
                    }
                  }
                };

                return (
                    <div className={`grid grid-cols-1 ${isPdfMode ? '' : 'lg:grid-cols-12'} gap-6 items-center bg-surface rounded-xl p-4 border border-border/50 shadow-sm`}>
                        {!isPdfMode && (
                          <div className="lg:col-span-5 h-44 md:h-48 relative flex justify-center items-center">
                              <Pie data={pieChartData} options={pieChartOptions} />
                          </div>
                        )}

                        <div className={isPdfMode ? 'overflow-x-auto w-full' : 'lg:col-span-7 overflow-x-auto w-full'}>
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border/60 bg-background/50 text-xxs font-semibold text-text-secondary uppercase select-none">
                                        <th className="py-2.5 px-3">Cost Element</th>
                                        <th className="py-2.5 px-3 text-right">{isPdfMode ? "Price" : "Unit Price"}</th>
                                        <th className="py-2.5 px-3 text-right">Share (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {tableData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-background/20 font-medium">
                                            <td className="py-2 px-3 flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                                <span className="text-text-primary capitalize">{item.label}</span>
                                            </td>
                                            <td className="py-2 px-3 text-right text-text-primary font-semibold whitespace-nowrap">
                                                {formatCurrency(item.value, currency)}
                                            </td>
                                            <td className="py-2 px-3 text-right text-text-secondary font-mono">
                                                {formatNumber(item.percentage, 1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Summary</h3>
          <div className="bg-surface rounded-lg p-2 space-y-1">
            {!isPdfMode && (
              <ResultRow label="Total Batch Cost" value={formatCurrency(forgeRes.totalCost, currency)} className="bg-background/50"/>
            )}
            <ResultRow label={isPdfMode ? "Cost / Part" : "Cost / Part (Unit Price)"} value={formatCurrency(forgeRes.costPerPart, currency)} className="bg-rose-600 !text-white font-bold mt-2 pt-4 border-t border-border" />
          </div>
        </div>
      </div>
    );
  }

  if (isStamping) {
    const stampRes = results as any;
    
    // We can list all cost elements that are > 0 to render the Pie chart
    const rawData = [
      { label: 'Net Sheet Material', value: stampRes.netMaterialCost },
      { label: 'Die Set Amortization', value: stampRes.toolingAmortizationPerPart },
      { label: 'Raw Prep Shearing', value: stampRes.shearingCostPerPart },
      { label: 'Primary Press Forming', value: stampRes.formingCostPerPart },
      { label: 'CNC Laser Cutting', value: stampRes.laserCostPerPart },
      { label: 'Press Brake Bending', value: stampRes.bendingCostPerPart },
      { label: 'Secondary Assemblies', value: stampRes.secondaryCostPerPart },
      { label: 'Quality Inspection', value: stampRes.inspectionCostPerPart },
      { label: 'Setup Cost Allocation', value: stampRes.setupCostPerPart },
      { label: 'SG&A Overhead', value: stampRes.sgaAmount },
      { label: 'Manufacturer Profit', value: stampRes.profitAmount },
      { label: 'Logistics & Packing', value: stampRes.logisticsAmount }
    ].filter(item => item && item.value > 0);

    const totalSum = rawData.reduce((sum, item) => sum + item.value, 0);

    const colors = [
      '#a855f7', // purple
      '#ec4899', // pink
      '#3b82f6', // blue
      '#eab308', // yellow
      '#14b8a6', // teal
      '#f97316', // orange
      '#6366f1', // indigo
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#6b7280', // gray
      '#22c55e', // green
      '#ef4444'  // red
    ];

    const tableData = rawData.map((item, idx) => ({
      ...item,
      color: colors[idx % colors.length],
      percentage: totalSum > 0 ? (item.value / totalSum * 100) : 0
    }));

    const pieChartData = {
      labels: tableData.map(d => d.label),
      datasets: [
        {
          data: tableData.map(d => d.value),
          backgroundColor: tableData.map(d => d.color),
          borderColor: '#ffffff',
          borderWidth: 1.5,
        }
      ]
    };

    const pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const val = context.parsed || 0;
              const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0';
              return ` ${label}: ${formatCurrency(val, currency)} (${pct}%)`;
            }
          }
        }
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Blank Sheet & Mass Yield</h3>
                  <div className="bg-surface rounded-lg p-2 space-y-1">
                     <ResultRow label="Gross Blank Weight" value={`${formatNumber(stampRes.grossWeightKg, 3)} kg`} className="bg-background/50"/>
                     <ResultRow label="Scrap Weight Offcut" value={`${formatNumber(stampRes.scrapWeightKg, 3)} kg`} className=""/>
                     <ResultRow label="Raw Material Base Cost" value={formatCurrency(stampRes.materialCostRaw, currency)} className="bg-background/50 font-semibold" />
                     <ResultRow label="Offcut Scrap Recovery Credit" value={`-${formatCurrency(stampRes.recoveredScrapValue, currency)}`} className="text-green-600 font-mono bg-background/50"/>
                     <ResultRow label="Net Blank Metal Cost" value={formatCurrency(stampRes.netMaterialCost, currency)} className="bg-primary/5 font-extrabold" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">Operational Costs & Setup</h3>
                  <div className="bg-surface rounded-lg p-2 space-y-1">
                     <ResultRow label="Coil Prep & Blank Shearing" value={formatCurrency(stampRes.shearingCostPerPart, currency)} className="bg-background/50"/>
                     {stampRes.formingCostPerPart > 0 && (
                       <ResultRow label="Primary Press Forming Loop" value={formatCurrency(stampRes.formingCostPerPart, currency)} className=""/>
                     )}
                     {stampRes.laserCostPerPart > 0 && (
                       <ResultRow label="CNC Laser Cutting Center" value={formatCurrency(stampRes.laserCostPerPart, currency)} className=""/>
                     )}
                     <ResultRow label="Press Brake Bending Center" value={formatCurrency(stampRes.bendingCostPerPart, currency)} className="bg-background/50"/>
                     <ResultRow label="Secondary Assemblies & QA" value={formatCurrency(stampRes.secondaryCostPerPart + stampRes.inspectionCostPerPart, currency)} className=""/>
                     <ResultRow label="Amortized Die Set / Tooling" value={formatCurrency(stampRes.toolingAmortizationPerPart, currency)} className="bg-background/50"/>
                     <ResultRow label="Setup & Changeover Allocation" value={formatCurrency(stampRes.setupCostPerPart, currency)} className=""/>
                  </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 border border-border/50 min-h-[300px] relative">
                <span className="text-[10px] font-black uppercase text-purple-400 absolute top-4 left-4 tracking-widest">Stamping Layout</span>
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    {stampRes.processType === 'progressive' ? 'Progressive Die Stamping' :
                     stampRes.processType === 'tandem' ? 'Tandem & Transfer Press' : 'Laser & Brake Fabrication'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mt-2">
                    Multi-station precision-engineered stamping layout designed to capture continuous metal flow, coil feeding, shearing, and customized die sets.
                  </p>
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Should-Cost Breakdown (Unit)</h3>
            <div className={`grid grid-cols-1 ${isPdfMode ? '' : 'lg:grid-cols-12'} gap-6 items-center bg-surface rounded-xl p-4 border border-border/50 shadow-sm`}>
                {!isPdfMode && (
                  <div className="lg:col-span-5 h-44 md:h-48 relative flex justify-center items-center">
                      <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                )}

                <div className={isPdfMode ? 'overflow-x-auto w-full' : 'lg:col-span-7 overflow-x-auto w-full'}>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border/60 bg-background/50 text-xxs font-semibold text-text-secondary uppercase select-none">
                                <th className="py-2.5 px-3">Cost Element</th>
                                <th className="py-2.5 px-3 text-right">{isPdfMode ? "Price" : "Unit Price"}</th>
                                <th className="py-2.5 px-3 text-right">Share (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {tableData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-background/20 font-medium">
                                    <td className="py-2 px-3 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-text-primary capitalize">{item.label}</span>
                                    </td>
                                    <td className="py-2 px-3 text-right text-text-primary font-semibold whitespace-nowrap">
                                        {formatCurrency(item.value, currency)}
                                    </td>
                                    <td className="py-2 px-3 text-right text-text-secondary font-mono">
                                        {formatNumber(item.percentage, 1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Summary</h3>
          <div className="bg-surface rounded-lg p-2 space-y-1">
            {!isPdfMode && (
              <ResultRow label="Annual Spend Estimate" value={formatCurrency(stampRes.annualSpend || (stampRes.finalUnitCost * vol), currency)} className="bg-background/50"/>
            )}
            <ResultRow label={isPdfMode ? "Cost / Part" : "Cost / Part (Unit Price)"} value={formatCurrency(stampRes.finalUnitCost, currency)} className="bg-purple-600 !text-white font-bold mt-2 pt-4 border-t border-border" />
          </div>
        </div>
      </div>
    );
  }

  const allMarkupCosts = Object.entries(results.markupCosts || {})
    .filter(([, value]) => (value as number) > 0)
    .map(([key, value]) => ({
      // Fix: Use safer indexing to resolve "symbol cannot be used as index type" error
      label: (markupLabels as Record<string, string>)[key] || key,
      value: value as number,
      percentage: markups[key as keyof Markups] || 0,
    }));
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Material & Weight</h3>
                <div className="bg-surface rounded-lg p-2 space-y-1">
                   <ResultRow label="Raw Material Weight" value={`${formatNumber(results.rawMaterialWeightKg, 3)} kg`} className="bg-background/50"/>
                   <ResultRow label="Finished Part Weight" value={`${formatNumber(results.finishedPartWeightKg, 3)} kg`} className=""/>
                   <ResultRow label="Raw Material Cost / Part" value={formatCurrency(results.rawMaterialPartCost, currency)} className="bg-background/50 font-semibold" />
                   {!isPdfMode && (
                     <ResultRow label="Raw Material Cost (Total Batch)" value={formatCurrency(results.materialCost, currency)} className=""/>
                   )}
                   {isPdfMode && (
                     <ResultRow label="Raw Material Cost" value={formatCurrency(results.rawMaterialPartCost, currency)} className=""/>
                   )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Time Analysis</h3>
                <div className="bg-surface rounded-lg p-2 space-y-1">
                   <ResultRow label="Total Cutting Time" value={`${formatNumber(results.totalCuttingTimeMin)} min`} className="bg-background/50"/>
                   <ResultRow label="Total Setup Time" value={`${formatNumber(results.totalSetupTimeMin)} min`} className=""/>
                   <ResultRow label="Total Tool Change Time" value={`${formatNumber(results.totalToolChangeTimeMin)} min`} className="bg-background/50"/>
                   <ResultRow label="Cycle Time / Part" value={`${formatNumber(results.cycleTimePerPartMin)} min`} className=""/>
                   <ResultRow label="Total Machine Time" value={`${formatNumber(results.totalMachineTimeHours)} hrs`} className="bg-background/50"/>
                </div>
              </div>
          </div>

          <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 border border-border/50 min-h-[300px]">
              <span className="text-[10px] font-black uppercase text-emerald-400 absolute top-4 left-4 tracking-widest">CNC Operation Visual</span>
              <MachiningSchematics type={results.setupBreakdown?.[0]?.machineName || 'CNC Mill'} />
          </div>
      </div>

      {Array.isArray((results as any).setupBreakdown) && (results as any).setupBreakdown.length > 0 ? (
        <div>
          <h3 className="text-md font-semibold text-primary mb-3 ml-1">Machining Setup Breakup</h3>
          <div className="space-y-4">
            {(results as any).setupBreakdown.map((setup: any, sIdx: number) => (
              <div key={sIdx} className="border border-border rounded-lg overflow-hidden bg-background/30">
                <div className="bg-primary/5 px-4 py-2 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <span className="font-bold text-primary">{setup.setupName}</span>
                  <span className="text-xs font-mono text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
                    Machine: <span className="text-text-primary font-sans font-medium">{setup.machineName}</span>
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-background/50 text-xxs font-semibold text-text-secondary uppercase select-none">
                        <th className="py-2 px-4">Parameter / Operation Name</th>
                        <th className="py-2 px-4 text-right">Cycle Time</th>
                        <th className="py-2 px-4 text-right">{isPdfMode ? "Cost" : "Unit Cost"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {setup.elements.map((el, eIdx) => (
                        <tr key={eIdx} className="hover:bg-background/25">
                          <td className="py-2 px-4">
                            <div className="font-semibold text-text-primary">{el.name}</div>
                            {el.parameters && (
                              <div className="text-xxs text-text-muted mt-0.5 max-w-lg leading-relaxed font-mono">
                                {el.parameters}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right font-medium text-text-primary whitespace-nowrap">
                            {formatNumber(el.cycleTimeMin, 3)} min
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-text-primary whitespace-nowrap text-green-600 dark:text-green-400">
                            {formatCurrency(el.cost, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : Array.isArray((results as any).operationTimeBreakdown) && (results as any).operationTimeBreakdown.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-primary mb-2 ml-1">Operation Breakdown</h4>
          <div className="bg-surface rounded-lg p-2 space-y-1 text-sm">
              {(results as any).operationTimeBreakdown.map((op: any, index: number) => (
                  <div key={op.id} className={`flex justify-between items-center py-2 px-4 rounded-md ${index % 2 === 0 ? 'bg-background/50' : ''}`}>
                      <span className="text-text-secondary">{op.machineName ? `[${op.machineName}] ` : ''}{op.processName}</span>
                      <span className="font-medium text-text-primary">{formatNumber(op.timeMin)} min</span>
                  </div>
              ))}
          </div>
        </div>
      )}

      <div>
          <h3 className="text-lg font-semibold text-primary mb-3">Cost Breakdown (Unit)</h3>
          {(() => {
              const opCost = results.machiningCost / vol;
              const toolCost = (results.toolCost || 0) / vol;
              const surfaceCost = results.surfaceTreatmentCost / vol;

              const rawData = [
                { label: 'Operation Cost', value: opCost },
                { label: 'Tool Cost', value: toolCost },
                { label: 'Surface Treatment Cost', value: surfaceCost },
                ...allMarkupCosts.map(m => ({
                  label: m.label,
                  value: m.value / vol,
                }))
              ].filter(item => item.value > 0);

              const totalSum = rawData.reduce((sum, item) => sum + item.value, 0);

              const colors = [
                '#8b5cf6', // Violet
                '#3b82f6', // Blue
                '#10b981', // Emerald
                '#f59e0b', // Amber
                '#ec4899', // Pink
                '#ef4444', // Red
                '#6366f1', // Indigo
                '#14b8a6', // Teal
              ];

              const tableData = rawData.map((item, idx) => ({
                ...item,
                color: colors[idx % colors.length],
                percentage: totalSum > 0 ? (item.value / totalSum * 100) : 0
              }));

              const pieChartData = {
                labels: tableData.map(d => d.label),
                datasets: [
                  {
                    data: tableData.map(d => d.value),
                    backgroundColor: tableData.map(d => d.color),
                    borderColor: '#ffffff',
                    borderWidth: 1.5,
                  }
                ]
              };

              const pieChartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const label = context.label || '';
                        const val = context.parsed || 0;
                        const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0';
                        return ` ${label}: ${formatCurrency(val, currency)} (${pct}%)`;
                      }
                    }
                  }
                }
              };

              return (
                  <div className={`grid grid-cols-1 ${isPdfMode ? '' : 'lg:grid-cols-12'} gap-6 items-center bg-surface rounded-xl p-4 border border-border/50 shadow-sm`}>
                      {/* Pie Chart container */}
                      {!isPdfMode && (
                        <div className="lg:col-span-5 h-44 md:h-48 relative flex justify-center items-center">
                            <Pie data={pieChartData} options={pieChartOptions} />
                        </div>
                      )}

                      {/* Data Table container */}
                      <div className={isPdfMode ? 'overflow-x-auto w-full' : 'lg:col-span-7 overflow-x-auto w-full'}>
                          <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                  <tr className="border-b border-border/60 bg-background/50 text-xxs font-semibold text-text-secondary uppercase select-none">
                                      <th className="py-2.5 px-3">Cost Element</th>
                                      <th className="py-2.5 px-3 text-right">{isPdfMode ? "Price" : "Unit Price"}</th>
                                      <th className="py-2.5 px-3 text-right">Share (%)</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40">
                                  {tableData.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-background/20 font-medium">
                                          <td className="py-2 px-3 flex items-center gap-2">
                                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                              <span className="text-text-primary capitalize">{item.label}</span>
                                          </td>
                                          <td className="py-2 px-3 text-right text-text-primary font-semibold whitespace-nowrap">
                                              {formatCurrency(item.value, currency)}
                                          </td>
                                          <td className="py-2 px-3 text-right text-text-secondary font-mono">
                                              {formatNumber(item.percentage, 1)}%
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              );
          })()}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-primary mb-2">Summary</h3>
        <div className="bg-surface rounded-lg p-2 space-y-1">
          {!isPdfMode && (
            <ResultRow label="Total Batch Cost" value={formatCurrency(results.totalCost, currency)} className="bg-background/50"/>
          )}
          <ResultRow label={isPdfMode ? "Cost / Part" : "Cost / Part (Unit Price)"} value={formatCurrency(results.costPerPart, currency)} className="bg-green-600 !text-white font-bold mt-2 pt-4 border-t border-border" />
        </div>
      </div>
    </div>
  );
};
