import React from 'react';
import { Calculator, Flame, Hammer, ChevronRight } from 'lucide-react';
import { SpeedFeedSandbox } from '../components/SpeedFeedSandbox';
import { MaterialMatrix } from '../components/MaterialMatrix';

interface Props {
  onModuleSelect: (module: 'machining' | 'casting' | 'forging') => void;
  onNavigate: (view: 'landing') => void;
}

export const ModuleSelectionPage: React.FC<Props> = ({ onModuleSelect, onNavigate }) => {
  const handleSelect = (module: 'machining' | 'casting' | 'forging') => {
    onModuleSelect(module);
    onNavigate('landing');
  };

  return (
    <div className="flex flex-col h-full w-full p-10 space-y-12 animate-fade-in overflow-y-auto">
        <div className="flex flex-col gap-1 items-start">
            <h1 className="text-2xl font-black text-primary tracking-tighter">CostingHub</h1>
            <p className="text-sm font-medium text-text-secondary">Engineered for precision and speed.</p>
        </div>

        <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Module Launchpad</h1>
            <p className="text-text-secondary text-lg">Select your manufacturing module to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
            <button
                onClick={() => handleSelect('machining')}
                className="group flex flex-col p-16 bg-surface border-2 border-emerald-500/30 hover:border-emerald-500 rounded-3xl shadow-lg hover:shadow-2xl transition-all"
            >
                <div className="p-8 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl w-max mb-10">
                    <Calculator className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-extrabold text-text-primary mb-4">Machining</h3>
                <p className="text-lg text-text-secondary flex-grow">Precision milling, turning, and drilling cycle analysis.</p>
                <div className="flex items-center text-emerald-600 font-bold text-lg mt-8 group-hover:gap-4 transition-all">
                    Select Module <ChevronRight className="w-6 h-6 ml-1" />
                </div>
            </button>

            <button
                onClick={() => handleSelect('casting')}
                className="group flex flex-col p-16 bg-surface border-2 border-indigo-500/30 hover:border-indigo-500 rounded-3xl shadow-lg hover:shadow-2xl transition-all"
            >
                <div className="p-8 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-2xl w-max mb-10">
                    <Flame className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-extrabold text-text-primary mb-4">Casting</h3>
                <p className="text-lg text-text-secondary flex-grow">Melt rate, cycle analysis, and mold amortization.</p>
                <div className="flex items-center text-indigo-600 font-bold text-lg mt-8 group-hover:gap-4 transition-all">
                    Select Module <ChevronRight className="w-6 h-6 ml-1" />
                </div>
            </button>

            <button
                onClick={() => handleSelect('forging')}
                className="group flex flex-col p-16 bg-surface border-2 border-rose-500/30 hover:border-rose-500 rounded-3xl shadow-lg hover:shadow-2xl transition-all"
            >
                <div className="p-8 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl w-max mb-10">
                    <Hammer className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-extrabold text-text-primary mb-4">Forging</h3>
                <p className="text-lg text-text-secondary flex-grow">Hot/cold forge cycles, trim recovery models.</p>
                <div className="flex items-center text-rose-600 font-bold text-lg mt-8 group-hover:gap-4 transition-all">
                    Select Module <ChevronRight className="w-6 h-6 ml-1" />
                </div>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto mt-12 pb-10">
          <SpeedFeedSandbox />
          <MaterialMatrix />
        </div>
    </div>
  );
};
