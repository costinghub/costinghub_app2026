import React, { useState, useRef, useEffect } from 'react';
import type { User, View } from '../types';
import { SUPER_ADMIN_EMAILS } from '../constants';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  user: User;
  session: { user: User; access_token: string } | null;
  currentModule: 'machining' | 'casting' | 'forging' | null;
  onModuleChange: (module: 'machining' | 'casting' | 'forging' | null) => void;
}

const NavItem: React.FC<{
  label: string;
  view: View;
  currentView: View;
  onNavigate: (view: View) => void;
  icon: React.ReactElement;
}> = ({ label, view, currentView, onNavigate, icon }) => {
  const isActive = currentView === view;
  const classes = `flex items-center px-4 py-2.5 text-sm rounded-xs transition-all duration-150 w-full text-left relative border-l-4 ${
    isActive
      ? 'border-primary bg-primary/8 text-primary font-bold'
      : 'border-transparent text-text-secondary hover:bg-background/80 hover:text-text-primary'
  }`;

  return (
    <button onClick={() => onNavigate(view)} className={classes} title={label}>
      <span className="mr-3 text-text-muted group-hover:text-primary">{icon}</span>
      {label}
    </button>
  );
};

const Icons = {
    Calculations: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h4m6 0h-2m-6-4h-2m8-4H9m-2 14h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Materials: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 4-8 4" /></svg>,
    Machines: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4M6 12a2 2 0 100-4m0 4a2 2 0 110-4M6 18a2 2 0 100-4m0 4a2 2 0 110-4m12 0a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>,
    Processes: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    Tools: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    CostMaster: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1H8m12 1h-4m-7 11H8m12 0h-4M12 21v-1m0 1v.01M12 18v-1m0-1H8m12 0h-4m-4 5a9 9 0 110-18 9 9 0 010 18z" /></svg>,
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, user, session, currentModule, onModuleChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());
  const avatarUrl = session?.user?.user_metadata?.avatar_url;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  // Usage Logic
  const usage = user.calculations_created_this_period || 0;
  const limit = user.calculation_limit;
  const percentage = limit > 0 ? Math.min(100, (usage / limit) * 100) : 0;
  const isUnlimited = limit === -1;

  return (
    <aside className="bg-surface text-text-primary flex flex-col p-3 shadow-xs border-r border-border/80 transition-all duration-200 w-64 h-full">
        <div className="py-4 mb-3 border-b border-border/50 h-[76px] flex items-center justify-between">
            <button onClick={() => onNavigate('landing')} className="text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-xs p-1 ml-3 flex-shrink-0 animate-fade-in">
                <h1 className="text-2xl font-bold tracking-wide text-text-primary">
                  Costing<span className="text-primary font-extrabold ml-1">Hub</span>
                </h1>
                <p className="text-xs text-text-muted font-semibold tracking-normal mt-0.5">All Costs. One Hub.</p>
            </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
            {currentModule && (
              <>
                {currentModule === 'machining' && (
                  <>
                    <NavItem label="Machining Calcs" view="calculations" icon={Icons.Calculations} {...{ currentView, onNavigate }} />
                    <NavItem label="New Machining Calc" view="calculator" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg>} {...{ currentView, onNavigate }} />
                  </>
                )}
                {currentModule === 'casting' && (
                  <>
                    <NavItem label="Casting Calcs" view="calculations" icon={Icons.Calculations} {...{ currentView, onNavigate }} />
                    <NavItem label="New Casting Calc" view="castingCalculator" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>} {...{ currentView, onNavigate }} />
                  </>
                )}
                {currentModule === 'forging' && (
                  <>
                    <NavItem label="Forging Calcs" view="calculations" icon={Icons.Calculations} {...{ currentView, onNavigate }} />
                    <NavItem label="New Forging Calc" view="forgingCalculator" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4"/><path d="M22 2s-3 3-5 5l-7 7s-1 2-2 3c-1 1-2 2-3 2l-3 1 1-3c0-1 1-2 2-3 1-1 3-2 3-2l7-7s3-5 5-5z"/></svg>} {...{ currentView, onNavigate }} />
                  </>
                )}

                <NavItem label="Reports" view="reports" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} {...{ currentView, onNavigate }} />
                <NavItem label="Feedback" view="feedback" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} {...{ currentView, onNavigate }} />
                
                <div className="pt-2 border-t border-border/50 my-2"></div>
                
                <NavItem label={`${currentModule === 'machining' ? 'Machining' : currentModule === 'casting' ? 'Casting' : 'Forging'} Cost Master`} view="costMaster" icon={Icons.CostMaster} {...{ currentView, onNavigate }} />
                <NavItem label={`${currentModule === 'machining' ? 'Materials' : currentModule === 'casting' ? 'Alloys' : 'Billets'}`} view="materials" icon={Icons.Materials} {...{ currentView, onNavigate }} />
                <NavItem label={`${currentModule === 'machining' ? 'Machines' : currentModule === 'casting' ? 'Equipment' : 'Presses'}`} view="machines" icon={Icons.Machines} {...{ currentView, onNavigate }} />
                <NavItem label={`${currentModule === 'machining' ? 'Processes' : currentModule === 'casting' ? 'Cast Methods' : 'Methods'}`} view="processes" icon={Icons.Processes} {...{ currentView, onNavigate }} />
                <NavItem label={`${currentModule === 'machining' ? 'Cutting Tools' : currentModule === 'casting' ? 'Patterns' : 'Dies'}`} view="toolLibrary" icon={Icons.Tools} {...{ currentView, onNavigate }} />
              </>
            )}
        </nav>
        
        <div className="mt-auto pt-2 border-t border-border/50 space-y-2">
            
            {currentModule && (
              <div className="mx-2 mb-2 p-4 bg-background/50 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Active Plan</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                    (user.plan_name || 'Free').toLowerCase().includes('enterprise')
                      ? 'bg-purple-100 text-purple-800'
                      : (user.plan_name || 'Free').toLowerCase().includes('pro')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-primary/10 text-primary'
                  }`}>
                      {user.plan_name || 'Free'}
                  </span>
                </div>
                
                <div className="mb-2 flex justify-between text-xs items-end">
                  <span className="text-text-secondary font-medium">Usage</span>
                  <span className="font-bold text-text-primary">
                    {isUnlimited ? 'Unlimited' : `${usage} / ${limit}`}
                  </span>
                </div>
                
                {!isUnlimited ? (
                  <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${percentage > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                ) : (
                    <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border/50">
                    <div className="h-full rounded-full bg-green-500 w-full" />
                  </div>
                )}
              </div>
            )}

            <div ref={dropdownRef} className="relative mt-2 border-t border-border/50 pt-2 pb-6 sm:pb-2">
                {isDropdownOpen && (
                    <div className="absolute bottom-full mb-2 w-full origin-bottom bg-surface rounded-md shadow-lg ring-1 ring-border ring-opacity-5 focus:outline-none z-20 animate-fade-in">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            <button onClick={() => { onNavigate('settings'); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-text-primary hover:bg-background/60">
                                Settings
                            </button>
                            {user.role === 'enterprise_admin' && (
                                <button onClick={() => { onNavigate('enterprise'); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-text-primary hover:bg-background/60">
                                    Enterprise Dashboard
                                </button>
                            )}
                            {isSuperAdmin && (
                                <>
                                    <button onClick={() => { onNavigate('superadmin'); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-text-primary hover:bg-background/60">
                                        Admin Panel
                                    </button>
                                    <button onClick={() => { onNavigate('subscribersList'); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-text-primary hover:bg-background/60">
                                        User Management
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => setIsDropdownOpen(p => !p)} 
                    className="flex items-center w-full p-2 rounded-lg hover:bg-surface transition-colors"
                >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <span>{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="ml-3 text-left animate-fade-in flex-grow">
                        <p className="text-sm font-semibold text-text-primary truncate">{user.name || user.email}</p>
                        <p className="text-xs text-text-muted truncate">{user.companyName || 'Personal'}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-text-secondary transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.293a1 1 0 011.414 0L10 12.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    </aside>
  );
};
