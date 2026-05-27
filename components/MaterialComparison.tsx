import React from 'react';
import { Radar } from 'react-chartjs-2';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList, Label } from 'recharts';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { MaterialMasterItem, MaterialProperty } from '../types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface MaterialComparisonProps {
  materials: MaterialMasterItem[];
  visibleProperties: string[];
  allMaterials: MaterialMasterItem[];
}

const PALETTE = [
    { bg: 'rgba(255, 0, 60, 0.2)', border: 'rgba(255, 0, 60, 1)' }, // Neon Red
    { bg: 'rgba(0, 204, 255, 0.2)', border: 'rgba(0, 204, 255, 1)' }, // Cyan
    { bg: 'rgba(57, 255, 20, 0.2)', border: 'rgba(57, 255, 20, 1)' }, // Neon Green
    { bg: 'rgba(255, 255, 0, 0.2)', border: 'rgba(255, 255, 0, 1)' }, // Yellow
    { bg: 'rgba(255, 0, 255, 0.2)', border: 'rgba(255, 0, 255, 1)' }, // Magenta
    { bg: 'rgba(255, 165, 0, 0.2)', border: 'rgba(255, 165, 0, 1)' }, // Orange
];

const getNumericPropertyValue = (material: MaterialMasterItem, propName: string): number | null => {
    if (material.properties && typeof material.properties === 'object') {
        const prop = (material.properties as any)[propName];
        if (prop && typeof prop === 'object' && 'value' in prop && typeof prop.value === 'number') {
            return prop.value;
        }
        else if (prop && typeof prop === 'object' && 'value' in prop && typeof prop.value === 'string') {
            const val = parseFloat(prop.value);
            if (!isNaN(val)) return val;
        }
    }
    return null;
}

const CustomTooltipScatter = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
     return (
       <div className="bg-surface border border-border p-2 rounded shadow-lg text-sm text-text-primary">
         <p className="font-bold border-b border-border mb-1 pb-1">{payload[0].payload.name}</p>
         <p>Tensile Strength: {payload[0].value} MPa</p>
         <p>Cost: {payload[1].value} / Kg</p>
       </div>
     );
   }
   return null;
};

export const MaterialComparison: React.FC<MaterialComparisonProps> = ({ materials, visibleProperties, allMaterials }) => {
    // Find max values for normalization ONLY for visible properties
    const maxValues = visibleProperties.reduce((acc, propName) => {
        const values = allMaterials
            .map(m => getNumericPropertyValue(m, propName))
            .filter(v => v !== null) as number[];
        acc[propName] = Math.max(...values, 0);
        return acc;
    }, {} as {[key: string]: number});

    const chartData = {
        labels: visibleProperties.map(p => p.replace(/, |\(.*\)/g, ' ')), // Shorten labels
        datasets: materials.map((material, index) => {
            const color = PALETTE[index % PALETTE.length];
            return {
                label: material.name,
                data: visibleProperties.map(prop => {
                    const value = getNumericPropertyValue(material, prop);
                    const max = maxValues[prop];
                    if (value !== null && max > 0) {
                        return (value / max) * 100;
                    }
                    return 0; // Return 0 for non-numeric or missing data
                }),
                backgroundColor: color.bg,
                borderColor: color.border,
                borderWidth: 2,
                pointBackgroundColor: color.border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: color.border,
            };
        }),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: { color: 'var(--color-border)' },
                grid: { color: 'var(--color-border)' },
                suggestedMin: 0,
                suggestedMax: 100,
                pointLabels: {
                    font: { size: 12 },
                    color: 'var(--color-text-primary)'
                },
                ticks: {
                    backdropColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)'
                }
            },
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: 'var(--color-text-primary)'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const materialName = context.dataset.label;
                        const material = materials.find(m => m.name === materialName);
                        const propName = visibleProperties[context.dataIndex];
                        if (material && material.properties && typeof material.properties === 'object') {
                            const originalValue = (material.properties as any)[propName];
                            if (originalValue && typeof originalValue === 'object' && 'value' in originalValue && 'unit' in originalValue) {
                                const prop = originalValue as MaterialProperty;
                                return `${materialName} - ${propName}: ${prop.value} ${prop.unit}`;
                            }
                        }
                        return '';
                    }
                }
            }
        }
    };

    const scatterData = materials.map(m => {
        let tsValue = 0;
        if (m.properties && typeof m.properties === 'object') {
            const tsMatch = Object.keys(m.properties).find(k => k.toLowerCase().includes('tensile'));
            if (tsMatch) {
                const tv = getNumericPropertyValue(m, tsMatch);
                if (tv !== null) tsValue = tv;
            }
        }
        return {
            name: m.name,
            x: tsValue,
            y: m.base_cost_per_kg || 0
        };
    }).filter(d => d.x > 0 || d.y > 0);

    return (
        <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 h-[450px]">
                <h4 className="text-center font-semibold mb-2 text-text-primary">Radar Comparison</h4>
                <Radar data={chartData} options={options} />
            </div>
            <div className="flex-1 h-[450px]">
                <h4 className="text-center font-semibold mb-2 text-text-primary">Cost vs. Tensile Strength</h4>
                <ResponsiveContainer width="100%" height="85%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" dataKey="x" name="Tensile Strength" stroke="var(--color-text-secondary)">
                            <Label value="Tensile Strength (MPa)" offset={-15} position="insideBottom" fill="var(--color-text-secondary)" style={{ fontSize: '10px' }} />
                        </XAxis>
                        <YAxis type="number" dataKey="y" name="Cost" stroke="var(--color-text-secondary)">
                            <Label value="Cost / Kg" angle={-90} position="insideLeft" fill="var(--color-text-secondary)" style={{ fontSize: '10px' }} />
                        </YAxis>
                        <RechartsTooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Materials" data={scatterData}>
                            {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length].border} />
                            ))}
                            <LabelList dataKey="name" position="bottom" style={{ fontSize: '10px', fill: 'var(--color-text-primary)' }} />
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};