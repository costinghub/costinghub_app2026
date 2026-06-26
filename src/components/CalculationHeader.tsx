import React from 'react';
import { Clock, Hash, User as UserIcon, Calendar, Box, Activity, Layers } from 'lucide-react';

interface CalculationHeaderProps {
  calcId: string;
  partName: string;
  partNumber: string;
  customer: string;
  created: string;
  status?: string;
  type: 'machining' | 'casting' | 'forging' | 'stamping';
}

export const CalculationHeader: React.FC<CalculationHeaderProps> = ({ 
  calcId, 
  partName, 
  partNumber, 
  customer, 
  created, 
  status = 'Draft',
  type
}) => {
  const colorMap = {
    machining: 'emerald',
    casting: 'indigo',
    forging: 'rose',
    stamping: 'purple'
  };
  
  const color = colorMap[type] || 'primary';

  return (
    <div className={`w-full bg-surface border border-border rounded-3xl p-6 mb-8 shadow-sm relative overflow-hidden`}>
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-${color}-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none`} />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className={`p-2.5 bg-${color}-500/10 text-${color}-600 rounded-xl`}>
                {type === 'machining' && <Box className="w-6 h-6" />}
                {type === 'casting' && <Activity className="w-6 h-6" />}
                {type === 'forging' && <Activity className="w-6 h-6" />}
                {type === 'stamping' && <Layers className="w-6 h-6" />}
             </div>
             <div>
                <h1 className="text-3xl font-black text-text-primary tracking-tight leading-none">
                  {partName || 'Unnamed Project'}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                   <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-${color}-500/10 text-${color}-600 border border-${color}-500/20`}>
                      {type} Engine
                   </span>
                   <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 ml-2">
                      <Hash className="w-3 h-3" /> {calcId}
                   </span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6 lg:border-l lg:border-border lg:pl-8">
           <div className="space-y-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                 <Box className="w-3 h-3" /> Part No.
              </span>
              <p className="text-sm font-bold text-text-primary">{partNumber || 'N/A'}</p>
           </div>
           
           <div className="space-y-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                 <UserIcon className="w-3 h-3" /> Customer
              </span>
              <p className="text-sm font-bold text-text-primary">{customer || 'Direct'}</p>
           </div>

           <div className="space-y-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                 <Calendar className="w-3 h-3" /> Created
              </span>
              <p className="text-sm font-bold text-text-primary">
                 {new Date(created).toLocaleDateString()}
              </p>
           </div>

           <div className="space-y-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                 <Activity className="w-3 h-3" /> Status
              </span>
              <div className="flex items-center gap-1.5">
                 <div className={`w-2 h-2 rounded-full ${status === 'Draft' ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                 <p className="text-sm font-bold text-text-primary">{status}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
