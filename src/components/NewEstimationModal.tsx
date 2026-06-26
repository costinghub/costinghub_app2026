import React, { useState } from 'react';
import { 
  Calculator, 
  Flame, 
  Hammer, 
  ChevronRight, 
  X,
  Target,
  Cpu,
  Layers
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

interface NewEstimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (module: 'machining' | 'casting' | 'forging' | 'stamping', subType?: string) => void;
}

export const NewEstimationModal: React.FC<NewEstimationModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [step, setStep] = useState<'module' | 'submodule'>('module');
  const [selectedModule, setSelectedModule] = useState<'machining' | 'casting' | 'forging' | 'stamping' | null>(null);

  const modules = [
    { 
      id: 'machining' as const, 
      name: 'Machining', 
      icon: <Calculator className="w-6 h-6" />, 
      color: 'emerald',
      description: 'Milling, turning, drilling, and multi-axis CNC cycle time analysis.'
    },
    { 
      id: 'casting' as const, 
      name: 'Casting', 
      icon: <Flame className="w-6 h-6" />, 
      color: 'indigo',
      description: 'LPD, HPD, Sand, Shell, and Investment casting yield models.'
    },
    { 
      id: 'forging' as const, 
      name: 'Forging', 
      icon: <Hammer className="w-6 h-6" />, 
      color: 'rose',
      description: 'Closed die, open die, ring rolling, and cold forging analysis.'
    },
    { 
      id: 'stamping' as const, 
      name: 'Stamping & Sheet Metal', 
      icon: <Layers className="w-6 h-6" />, 
      color: 'purple',
      description: 'Progressive die, transfer press, and laser cut/bend fabrication should-cost models.'
    }
  ];

  const subModules = {
    machining: [
      { id: 'standard', name: 'Standard Machining', icon: <Target className="w-4 h-4" /> },
      { id: 'cnc', name: 'High Speed CNC', icon: <Cpu className="w-4 h-4" /> },
      { id: 'precision', name: 'Precision Turning', icon: <Layers className="w-4 h-4" /> }
    ],
    casting: [
      { id: 'Sand Casting', name: 'Sand Casting', icon: <Layers className="w-4 h-4" /> },
      { id: 'Shell Moulding', name: 'Shell Moulding', icon: <Layers className="w-4 h-4" /> },
      { id: 'HPDC', name: 'High Pressure Die (HPDC)', icon: <Layers className="w-4 h-4" /> },
      { id: 'LPDC', name: 'Low Pressure Die (LPDC)', icon: <Layers className="w-4 h-4" /> },
      { id: 'GDC', name: 'Gravity Die (GDC)', icon: <Layers className="w-4 h-4" /> },
      { id: 'Investment Casting', name: 'Investment Casting', icon: <Layers className="w-4 h-4" /> }
    ],
    forging: [
      { id: 'Closed Die Forging', name: 'Closed Die Forging', icon: <Hammer className="w-4 h-4" /> },
      { id: 'Open Die Forging', name: 'Open Die Forging', icon: <Hammer className="w-4 h-4" /> },
      { id: 'Ring Rolling', name: 'Ring Rolling', icon: <Hammer className="w-4 h-4" /> },
      { id: 'Warm/Cold Forging', name: 'Warm/Cold Forging', icon: <Hammer className="w-4 h-4" /> }
    ],
    stamping: [
      { id: 'progressive', name: 'Progressive Die Stamping', icon: <Layers className="w-4 h-4" /> },
      { id: 'tandem', name: 'Tandem & Transfer Press', icon: <Layers className="w-4 h-4" /> },
      { id: 'fabrication', name: 'Laser & Press Brake Fabrication', icon: <Layers className="w-4 h-4" /> }
    ]
  };

  const handleModuleSelect = (moduleId: 'machining' | 'casting' | 'forging' | 'stamping') => {
    setSelectedModule(moduleId);
    setStep('submodule');
  };

  const handleBack = () => {
    setStep('module');
    setSelectedModule(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border"
        >
          <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                {step === 'module' ? 'New Estimation' : `Configure ${selectedModule ? selectedModule.charAt(0).toUpperCase() + selectedModule.slice(1) : ''}`}
              </h2>
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-0.5">
                {step === 'module' ? 'Step 1: Select Manufacturing Process' : 'Step 2: Select Specific Method'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors text-text-muted hover:text-text-primary">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 'module' ? (
                <motion.div 
                  key="module-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {modules.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleModuleSelect(m.id)}
                      className={`group relative flex flex-col p-6 rounded-2xl border-2 border-transparent hover:border-${m.color}-500/50 bg-${m.color}-500/5 hover:bg-${m.color}-500/10 transition-all text-left h-full`}
                    >
                      <div className={`p-4 bg-${m.color}-500/10 text-${m.color}-600 rounded-xl w-max mb-6 group-hover:scale-110 transition-transform`}>
                        {m.icon}
                      </div>
                      <h3 className="text-xl font-black text-text-primary mb-2 group-hover:text-primary transition-colors">{m.name}</h3>
                      <p className="text-xs text-text-secondary leading-relaxed flex-grow">{m.description}</p>
                      <div className={`flex items-center text-${m.color}-600 font-black text-[10px] uppercase tracking-widest mt-6 group-hover:gap-1 transition-all`}>
                        Launch <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="submodule-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Button variant="secondary" size="sm" onClick={handleBack} className="mb-4">
                    ← Back to Modules
                  </Button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedModule && subModules[selectedModule].map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onSelect(selectedModule, sub.id)}
                        className="flex items-center p-5 bg-background border border-border hover:border-primary hover:shadow-md rounded-2xl transition-all text-left"
                      >
                        <div className="p-3 bg-primary/10 text-primary rounded-xl mr-4">
                          {sub.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{sub.name}</p>
                          <p className="text-[10px] text-text-muted uppercase tracking-tighter">Click to start calculation</p>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto text-text-muted" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-8 py-6 bg-background/50 border-t border-border flex justify-between items-center">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              Standardized Estimating Procedure • CostingHub AI Engine
            </p>
          </div>
        </motion.div>
    </div>
  );
};
