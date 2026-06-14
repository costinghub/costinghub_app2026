
import React from 'react';
import type { MachiningResult, MarkupCosts, Markups } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ResultsDisplayProps {
  results: MachiningResult | null;
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

  const isForging = results && 'rawBilletWeightKg' in results;

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

      {results.setupBreakdown && results.setupBreakdown.length > 0 ? (
        <div>
          <h3 className="text-md font-semibold text-primary mb-3 ml-1">Machining Setup Breakup</h3>
          <div className="space-y-4">
            {results.setupBreakdown.map((setup, sIdx) => (
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
      ) : results.operationTimeBreakdown.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-primary mb-2 ml-1">Operation Breakdown</h4>
          <div className="bg-surface rounded-lg p-2 space-y-1 text-sm">
              {results.operationTimeBreakdown.map((op, index) => (
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
