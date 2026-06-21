import React from 'react';

interface ForgingSchematicProps {
  type: 'Closed Die Forging' | 'Open Die Forging' | 'Ring Rolling' | 'Warm/Cold Forging';
  yieldRate: number;
}

export const ForgingSchematics: React.FC<ForgingSchematicProps> = ({ type, yieldRate }) => {
  switch (type) {
    case 'Closed Die Forging':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 rounded-xl p-4">
          <span className="text-[10px] font-black uppercase text-rose-500 mb-2">Impression Die Schematic</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Upper Die */}
            <path d="M40,20 L160,20 L160,40 L130,40 L115,50 L85,50 L70,40 L40,40 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Squeezed Billet */}
            <path d="M68,52 L132,52 L145,60 L145,65 L132,73 L68,73 L55,65 L55,60 Z" fill="#f43f5e" className="animate-pulse">
               <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </path>
            
            {/* Lower Die */}
            <path d="M40,100 L160,100 L160,80 L130,80 L115,70 L85,70 L70,80 L40,80 Z" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
            
            <text x="100" y="32" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">UPPER DIE</text>
            <text x="100" y="93" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">LOWER DIE</text>
            <text x="100" y="65" fill="white" fontSize="9" textAnchor="middle" fontWeight="black">BILLET {yieldRate}%</text>
          </svg>
          <p className="text-[10px] text-slate-400 mt-2 text-center">Precise flash-controlled impression forging</p>
        </div>
      );
    case 'Open Die Forging':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-black uppercase text-amber-500 mb-2">Flat Platen Schematic</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Upper Platen */}
            <rect x="60" y="10" width="80" height="25" rx="2" fill="#94a3b8" stroke="#cbd5e1" />
            
            {/* Squeezed Billet (Bulging) */}
            <ellipse cx="100" cy="62" rx={40 + (100 - yieldRate) / 2} ry="22" fill="#ea580c" className="animate-pulse" />
            
            {/* Lower Platen */}
            <rect x="50" y="90" width="100" height="20" rx="2" fill="#475569" stroke="#64748b" />
            
            <text x="100" y="27" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">HAMMER</text>
            <text x="100" y="103" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">ANVIL</text>
            <text x="100" y="65" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="black">UPSETTING</text>
          </svg>
          <p className="text-[10px] text-slate-400 mt-2 text-center">Free-form material displacement</p>
        </div>
      );
    case 'Ring Rolling':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-900 rounded-xl p-4">
          <span className="text-[10px] font-black uppercase text-blue-500 mb-2">Radial-Axial Schematic</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Main Roll */}
            <circle cx="60" cy="60" r="25" fill="#475569" stroke="#64748b" />
            <circle cx="60" cy="60" r="5" fill="#1e293b" />
            
            {/* Mandrel Roll */}
            <circle cx="110" cy="60" r="12" fill="#94a3b8" stroke="#cbd5e1" />
            
            {/* Ring Section */}
            <path d="M85,35 A40,40 0 0,1 135,85" stroke="#f43f5e" strokeWidth="8" fill="none" strokeLinecap="round" className="animate-pulse" />
            
            <text x="60" y="63" fill="white" fontSize="6" textAnchor="middle">MAIN</text>
            <text x="110" y="63" fill="white" fontSize="6" textAnchor="middle">MANDREL</text>
            <text x="110" y="100" fill="white" fontSize="9" textAnchor="middle" fontWeight="black">RING GROWTH</text>
          </svg>
          <p className="text-[10px] text-slate-400 mt-2 text-center">Seamless concentric grain flow</p>
        </div>
      );
    case 'Warm/Cold Forging':
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-emerald-950 rounded-xl p-4">
          <span className="text-[10px] font-black uppercase text-emerald-400 mb-2">Precision Cold-Extrusion</span>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Die block */}
            <rect x="50" y="30" width="100" height="60" fill="#334155" stroke="#475569" />
            <rect x="75" y="30" width="50" height="60" fill="#0f172a" />
            
            {/* Punch */}
            <rect x="85" y="10" width="30" height="40" fill="#94a3b8" stroke="#cbd5e1">
               <animate attributeName="y" values="10;35;10" dur="1.5s" repeatCount="indefinite" />
            </rect>
            
            {/* Billet */}
            <rect x="87" y="55" width="26" height="30" fill="#10b981" />
            
            <text x="100" y="105" fill="white" fontSize="9" textAnchor="middle" fontWeight="black">NEAR-NET SHAPE</text>
          </svg>
          <p className="text-[10px] text-emerald-300 mt-2 text-center">High tolerance room-temp forming</p>
        </div>
      );
    default:
      return null;
  }
};
