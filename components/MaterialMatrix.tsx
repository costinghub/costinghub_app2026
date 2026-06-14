import React, { useState } from 'react';
import { Cpu, Flame } from 'lucide-react';

interface MaterialSnippet {
  name: string;
  category: string;
  density: number; // g/cm³
  machinability: number; // %
  hardness: string;
  baseVc: number; // m/min
  coolant: string;
  wearFactor: string;
  colorClass: string;
  badgeClass: string;
}

const MATERIAL_PRESETS: MaterialSnippet[] = [
  {
    name: "Aluminum 6061-T6",
    category: "Non-Ferrous",
    density: 2.70,
    machinability: 100,
    hardness: "95 HB",
    baseVc: 350,
    coolant: "Soluble Oil / Mist",
    wearFactor: "Very Low",
    colorClass: "from-emerald-500/20 to-teal-500/5 border-emerald-500/30",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
  },
  {
    name: "Stainless Steel 304",
    category: "Stainless Steel",
    density: 8.00,
    machinability: 45,
    hardness: "170 HB",
    baseVc: 110,
    coolant: "High concentration oil",
    wearFactor: "High (Work-Hardening)",
    colorClass: "from-blue-500/20 to-indigo-500/5 border-blue-500/30",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
  },
  {
    name: "Titanium Grade 5 (Ti-6Al-4V)",
    category: "Superalloys",
    density: 4.43,
    machinability: 22,
    hardness: "340 HB",
    baseVc: 55,
    coolant: "High Pressure Coolant",
    wearFactor: "Extreme",
    colorClass: "from-purple-500/20 to-pink-500/5 border-purple-500/30",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
  },
  {
    name: "Carbon Steel 1018",
    category: "Low Carbon Steel",
    density: 7.87,
    machinability: 70,
    hardness: "125 HB",
    baseVc: 210,
    coolant: "Emulsion / Flood",
    wearFactor: "Moderate",
    colorClass: "from-amber-500/20 to-orange-500/5 border-amber-500/30",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
  },
  {
    name: "Yellow Brass C360",
    category: "Copper Alloys",
    density: 8.50,
    machinability: 120,
    hardness: "80 HB",
    baseVc: 400,
    coolant: "Dry / Light Mist",
    wearFactor: "Minimal",
    colorClass: "from-rose-500/20 to-orange-500/5 border-rose-500/30",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
  }
];

export const MaterialMatrix: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const activeMaterial = MATERIAL_PRESETS[selectedPresetIndex];

  return (
    <div className="bg-surface border border-emerald-500/20 p-5 rounded-xl shadow-sm relative">
        <h2 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest border-b border-border/50 pb-2.5 mb-4 flex items-center gap-1.5">
        <Cpu className="w-4.5 h-4.5 text-emerald-500" />
        Dynamic Material Matrix
        </h2>
        
        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
        Select standard mechanical alloys to auto-populate properties.
        </p>

        <div className="space-y-3 mb-4">
        <select
            value={selectedPresetIndex}
            onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
            className="w-full bg-background border-2 border-emerald-500/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 text-text-primary font-bold shadow-xs transition"
        >
            {MATERIAL_PRESETS.map((mat, i) => (
            <option key={mat.name} value={i}>
                {mat.name} ({mat.category})
            </option>
            ))}
        </select>

        <button
            type="button"
            className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
        >
            <Flame className="w-4 h-4 text-yellow-300" /> Apply {activeMaterial.baseVc} m/min
        </button>
        </div>

        <div className={`bg-gradient-to-br ${activeMaterial.colorClass} border-2 rounded-xl p-4 text-xs space-y-2.5 transition-all duration-300`}>
            <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-text-secondary font-medium">Type Classification:</span>
                <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${activeMaterial.badgeClass}`}>
                {activeMaterial.category}
                </span>
            </div>
            <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-text-secondary font-medium">Volumetric Density:</span>
                <span className="font-mono text-text-primary font-bold">{activeMaterial.density.toFixed(2)} g/cm³</span>
            </div>
            <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-text-secondary font-medium">Machinability Rating:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{activeMaterial.machinability}%</span>
            </div>
            <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-text-secondary font-medium">Nominal Hardness Level:</span>
                <span className="font-mono text-text-primary font-bold">{activeMaterial.hardness}</span>
            </div>
            <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-text-secondary font-medium">Standard Lubricant:</span>
                <span className="text-text-primary font-medium italic">{activeMaterial.coolant}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Wear Coefficient:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">{activeMaterial.wearFactor}</span>
            </div>
        </div>
    </div>
  );
};
