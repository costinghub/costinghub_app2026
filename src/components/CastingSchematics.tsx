import React from 'react';

interface CastingSchematicProps {
  type: 'Sand Casting' | 'Pressure Die Casting' | 'Investment Casting' | 'Permanent Mold' | 'Shell Moulding' | 'HPDC' | 'LPDC' | 'GDC';
  yieldRate: number;
}

export const CastingSchematics: React.FC<CastingSchematicProps> = ({ type, yieldRate }) => {
  switch (type) {
    case 'Sand Casting':
    case 'Shell Moulding':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-orange-950/20 rounded-xl p-4 border border-orange-500/10">
          <span className="text-[10px] font-black uppercase text-orange-600 mb-2">{type === 'Shell Moulding' ? 'Resin Shell Mold' : 'Cope & Drag Sand Mold'}</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Flask boundary */}
            <rect x="40" y="20" width="120" height="80" fill="#fef3c7" stroke="#d97706" strokeWidth={type === 'Shell Moulding' ? "3" : "1"} />
            <line x1="40" y1="60" x2="160" y2="60" stroke="#d97706" strokeDasharray="4 2" />
            
            {/* Pouring Basin */}
            <path d="M60,20 L80,20 L75,40 L65,40 Z" fill="#991b1b" />
            <rect x="68" y="40" width="4" height="20" fill="#b91c1c" />
            
            {/* Cavity */}
            <circle cx="100" cy="60" r="25" fill="#fef3c7" stroke="#92400e" strokeWidth="2" strokeDasharray="2 1" />
            <circle cx="100" cy="60" r="20" fill="#b91c1c" className="animate-pulse" />
            
            <text x="140" y="40" fill="#92400e" fontSize="7" fontWeight="bold">COPE</text>
            <text x="140" y="85" fill="#92400e" fontSize="7" fontWeight="bold">DRAG</text>
            <text x="100" y="110" fill="#92400e" fontSize="8" textAnchor="middle" fontWeight="black">{type.toUpperCase()} MOLD</text>
          </svg>
        </div>
      );
    case 'Pressure Die Casting':
    case 'HPDC':
    case 'LPDC':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-indigo-950/20 rounded-xl p-4 border border-indigo-500/10">
          <span className="text-[10px] font-black uppercase text-indigo-600 mb-2">{type === 'LPDC' ? 'Low Pressure' : 'High Pressure'} Injection</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Die Blocks */}
            <rect x="60" y="30" width="35" height="60" fill="#475569" stroke="#64748b" />
            <rect x="105" y="30" width="35" height="60" fill="#475569" stroke="#64748b" />
            
            {/* Gooseneck / Shot sleeve */}
            <rect x="20" y="55" width="45" height="10" fill="#334155" />
            <rect x="20" y="56" width="30" height="8" fill="#ef4444">
               <animate attributeName="x" values="-20;25;-20" dur="2s" repeatCount="indefinite" />
            </rect>
            
            {/* Cavity */}
            <path d="M95,45 L105,45 L115,55 L115,65 L105,75 L95,75 L85,65 L85,55 Z" fill="#dc2626" className="animate-pulse" />
            
            <text x="100" y="25" fill="#312e81" fontSize="7" textAnchor="middle" fontWeight="bold">STEEL DIE BLOCKS</text>
            <text x="100" y="105" fill="#312e81" fontSize="8" textAnchor="middle" fontWeight="black">{type} PROCESS</text>
          </svg>
        </div>
      );
    case 'Investment Casting':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-teal-950/20 rounded-xl p-4 border border-teal-500/10">
          <span className="text-[10px] font-black uppercase text-teal-600 mb-2">Lost-Wax Ceramic Shell</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Spree tree */}
            <rect x="95" y="20" width="10" height="80" fill="#ccfbf1" stroke="#0d9488" />
            
            {/* Wax patterns */}
            <rect x="75" y="40" width="20" height="10" rx="2" fill="#0d9488" opacity="0.3" stroke="#0d9488" />
            <rect x="105" y="40" width="20" height="10" rx="2" fill="#0d9488" opacity="0.3" stroke="#0d9488" />
            <rect x="75" y="65" width="20" height="10" rx="2" fill="#0d9488" opacity="0.3" stroke="#0d9488" />
            <rect x="105" y="65" width="20" height="10" rx="2" fill="#0d9488" opacity="0.3" stroke="#0d9488" />
            
            {/* Liquid Metal Filling animation */}
            <rect x="97" y="20" width="6" height="80" fill="#14b8a6">
               <animate attributeName="height" values="0;80" dur="3s" repeatCount="indefinite" />
            </rect>
            
            <text x="100" y="110" fill="#0d9488" fontSize="8" textAnchor="middle" fontWeight="black">PATTERN CLUSTER TREE</text>
          </svg>
        </div>
      );
    case 'Permanent Mold':
    case 'GDC':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-blue-950/20 rounded-xl p-4 border border-blue-500/10">
          <span className="text-[10px] font-black uppercase text-blue-600 mb-2">{type === 'GDC' ? 'Gravity Die Casting' : 'Gravity Metallic Mold'}</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Iron Mold */}
            <rect x="50" y="25" width="45" height="70" fill="#1e293b" />
            <rect x="105" y="25" width="45" height="70" fill="#1e293b" />
            
            {/* Pouring Channel */}
            <path d="M85,25 L115,25 L105,45 L95,45 Z" fill="#ef4444" />
            
            {/* Cavity */}
            <rect x="85" y="45" width="30" height="30" fill="#ef4444" className="animate-pulse" />
            
            <text x="100" y="110" fill="#1e3a8a" fontSize="8" textAnchor="middle" fontWeight="black">{type === 'GDC' ? 'GRAVITY DIE' : 'REUSABLE METAL'} MOLD</text>
          </svg>
        </div>
      );
    default:
      return null;
  }
};
