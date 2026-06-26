import React from 'react';

interface MachiningSchematicProps {
  type: string;
  materialCategory?: string;
}

export const MachiningSchematics: React.FC<MachiningSchematicProps> = ({ type, materialCategory }) => {
  const getMachiningVisual = () => {
    switch (type) {
      case 'CNC Mill':
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-blue-950/20 rounded-xl p-4 border border-blue-500/10">
            <span className="text-[10px] font-black uppercase text-blue-600 mb-2">3-Axis Milling Operation</span>
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Table */}
              <rect x="40" y="90" width="120" height="10" fill="#334155" />
              
              {/* Workpiece */}
              <rect x="65" y="70" width="70" height="20" fill="#94a3b8" />
              
              {/* Spindle */}
              <rect x="92" y="10" width="16" height="30" fill="#1e293b" />
              
              {/* Tool (End Mill) */}
              <g className="animate-bounce" style={{ animationDuration: '0.5s' }}>
                 <rect x="95" y="40" width="10" height="30" fill="#475569" />
                 <path d="M95,70 L105,70 L100,75 Z" fill="#64748b" />
                 {/* Chips */}
                 <circle cx="90" cy="70" r="1.5" fill="#f59e0b">
                    <animate attributeName="cx" values="90;80" dur="0.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="70;65" dur="0.2s" repeatCount="indefinite" />
                 </circle>
                 <circle cx="110" cy="70" r="1.5" fill="#f59e0b">
                    <animate attributeName="cx" values="110;120" dur="0.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="70;65" dur="0.2s" repeatCount="indefinite" />
                 </circle>
              </g>
              
              <text x="100" y="115" fill="#1e3a8a" fontSize="8" textAnchor="middle" fontWeight="black">CARBIDE END MILLING</text>
            </svg>
          </div>
        );
      case 'CNC Lathe':
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-indigo-950/20 rounded-xl p-4 border border-indigo-500/10">
            <span className="text-[10px] font-black uppercase text-indigo-600 mb-2">Turning Center Schematic</span>
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Chuck */}
              <rect x="30" y="30" width="20" height="60" fill="#1e293b" />
              
              {/* Spindle axis */}
              <line x1="20" y1="60" x2="180" y2="60" stroke="#475569" strokeDasharray="4 2" />
              
              {/* Workpiece (Rotating) */}
              <rect x="50" y="45" width="80" height="30" fill="#94a3b8">
                 <animate attributeName="height" values="30;20;30" dur="1s" repeatCount="indefinite" />
                 <animate attributeName="y" values="45;50;45" dur="1s" repeatCount="indefinite" />
              </rect>
              
              {/* Cutting Tool */}
              <g className="animate-pulse">
                 <path d="M130,55 L150,55 L150,75 L140,65 L130,65 Z" fill="#4338ca" />
                 <rect x="135" y="60" width="3" height="3" fill="#f59e0b">
                    <animate attributeName="x" values="130;110" dur="0.1s" repeatCount="indefinite" />
                 </rect>
              </g>
              
              <text x="100" y="110" fill="#312e81" fontSize="8" textAnchor="middle" fontWeight="black">OD TURNING OPERATION</text>
            </svg>
          </div>
        );
      case 'Grinder':
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-background/20 rounded-xl p-4 border border-border/10">
            <span className="text-[10px] font-black uppercase text-zinc-600 mb-2">Surface Grinding</span>
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Magnetic Chuck */}
              <rect x="40" y="90" width="120" height="10" fill="#334155" />
              
              {/* Part */}
              <rect x="60" y="75" width="80" height="15" fill="#cbd5e1" />
              
              {/* Grinding Wheel */}
              <g>
                 <circle cx="100" cy="50" r="25" fill="#474747" stroke="#333" strokeWidth="2" />
                 <circle cx="100" cy="50" r="5" fill="#fff" />
                 <line x1="75" y1="50" x2="125" y2="50" stroke="#666" transform="rotate(45 100 50)">
                    <animateTransform attributeName="transform" type="rotate" from="0 100 50" to="360 100 50" dur="0.5s" repeatCount="indefinite" />
                 </line>
                 
                 {/* Sparks */}
                 <g>
                    <line x1="80" y1="75" x2="70" y2="80" stroke="#ea580c" strokeWidth="1">
                       <animate attributeName="x1" values="80;60" dur="0.1s" repeatCount="indefinite" />
                       <animate attributeName="x2" values="70;50" dur="0.1s" repeatCount="indefinite" />
                    </line>
                 </g>
              </g>
              
              <text x="100" y="115" fill="#18181b" fontSize="8" textAnchor="middle" fontWeight="black">ABRASIVE FINISHING</text>
            </svg>
          </div>
        );
      case 'Saw':
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-stone-950/20 rounded-xl p-4 border border-stone-500/10">
            <span className="text-[10px] font-black uppercase text-stone-600 mb-2">Bandsaw Preparation</span>
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Material Bar */}
              <rect x="20" y="50" width="160" height="20" fill="#78716c" />
              
              {/* Saw Blade */}
              <rect x="100" y="20" width="2" height="80" fill="#444" className="animate-pulse" />
              
              <text x="100" y="110" fill="#44403c" fontSize="8" textAnchor="middle" fontWeight="black">BILLET SIZING</text>
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/10 rounded-xl p-4 border border-slate-500/10">
             <span className="text-[10px] font-black uppercase text-slate-500 mb-2">Machine Process</span>
             <svg width="200" height="120" viewBox="0 0 200 120">
                <rect x="50" y="30" width="100" height="60" rx="4" fill="none" stroke="#64748b" strokeDasharray="4 4" />
                <text x="100" y="65" fill="#64748b" fontSize="8" textAnchor="middle">{type || 'Active Operation'}</text>
             </svg>
          </div>
        );
    }
  };

  return getMachiningVisual();
};
