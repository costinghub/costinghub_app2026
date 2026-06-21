import React, { useState } from 'react';
import { Gauge, Flame, Cpu, Wrench } from 'lucide-react';

interface Props {
    cutterDiameter?: number;
    surfaceSpeed?: number;
    teethCount?: number;
    feedPerTooth?: number;
}

export const SpeedFeedSandbox: React.FC<Props> = (props) => {
  const [cutterDiameter, setCutterDiameter] = useState<number>(props.cutterDiameter || 10);
  const [surfaceSpeed, setSurfaceSpeed] = useState<number>(props.surfaceSpeed || 180);
  const [teethCount, setTeethCount] = useState<number>(props.teethCount || 4);
  const [feedPerTooth, setFeedPerTooth] = useState<number>(props.feedPerTooth || 0.08);

  const calculatedRPM = Math.round((surfaceSpeed * 1000) / (Math.PI * cutterDiameter));
  const calculatedFeed = Math.round(calculatedRPM * teethCount * feedPerTooth);

  return (
    <div className="bg-surface border border-blue-500/25 p-5 rounded-xl shadow-md relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center border-b border-border/50 pb-2.5 mb-4">
            <h2 className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <Gauge className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            Dynamic Speed & Feed Sandbox
            </h2>
            <span className="text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Live Calculator
            </span>
        </div>

        <p className="text-xs text-text-secondary mb-5 leading-relaxed">
            Slide and tweak the mechanical inputs on the fly to observe immediate cutting values!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-1.5 bg-background/50 p-3 rounded-lg border border-border/80">
            <div className="flex justify-between text-xs font-bold text-text-primary">
                <span className="flex items-center gap-1">📏 Cutter Diameter (D)</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{cutterDiameter} mm</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="200" 
                value={cutterDiameter}
                onChange={(e) => setCutterDiameter(Number(e.target.value))}
                className="w-full accent-blue-600 bg-background h-1.5 rounded-lg cursor-pointer"
            />
            </div>

            <div className="space-y-1.5 bg-background/50 p-3 rounded-lg border border-border/80">
            <div className="flex justify-between text-xs font-bold text-text-primary">
                <span className="flex items-center gap-1">⚡ Surface Speed (Vc)</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{surfaceSpeed} m/min</span>
            </div>
            <input 
                type="range" 
                min="10" 
                max="600" 
                value={surfaceSpeed}
                onChange={(e) => setSurfaceSpeed(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-background h-1.5 rounded-lg cursor-pointer"
            />
            </div>

            <div className="space-y-1.5 bg-background/50 p-3 rounded-lg border border-border/80">
            <div className="flex justify-between text-xs font-bold text-text-primary mb-1">
                <span className="flex items-center gap-1">⚙️ Flutes (z)</span>
                <span className="font-mono text-pink-600 dark:text-pink-400">{teethCount} teeth</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
                {[1, 2, 3, 4, 6, 8].map(flutes => (
                <button
                    key={flutes}
                    type="button"
                    onClick={() => setTeethCount(flutes)}
                    className={`py-1 text-xs font-bold border rounded-lg transition-all ${
                    teethCount === flutes 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black shadow-xs' 
                        : 'border-border bg-background hover:border-text-muted text-text-secondary'
                    }`}
                >
                    {flutes}
                </button>
                ))}
            </div>
            </div>

            <div className="space-y-1.5 bg-background/50 p-3 rounded-lg border border-border/80">
            <div className="flex justify-between text-xs font-bold text-text-primary">
                <span className="flex items-center gap-1">🚀 Feed per Tooth (fz)</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{feedPerTooth.toFixed(3)} mm/z</span>
            </div>
            <input 
                type="range" 
                min="0.010" 
                max="0.400" 
                step="0.005"
                value={feedPerTooth}
                onChange={(e) => setFeedPerTooth(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-background h-1.5 rounded-lg cursor-pointer"
            />
            </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-indigo-950/20 dark:to-blue-950/20 border-2 border-indigo-500/20 p-4 rounded-xl grid grid-cols-2 gap-4">
            <div className="text-left border-r border-border/80 pr-2">
            <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black block uppercase tracking-wider">Spindle speed (n)</span>
            <span className="text-2xl lg:text-3xl font-black font-mono text-indigo-700 dark:text-indigo-400 block mt-1">
                {calculatedRPM.toLocaleString()} <span className="text-xs font-bold text-text-secondary">rpm</span>
            </span>
            </div>
            <div className="text-left pl-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black block uppercase tracking-wider">Table Feed Rate (Vf)</span>
            <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                {calculatedFeed.toLocaleString()} <span className="text-xs font-bold text-text-secondary">mm/min</span>
            </span>
            </div>
        </div>
    </div>
  );
};
