import React, { useState, useEffect } from 'react';
import type { User, View, Calculation, CalculatorHeaderInfo } from '../types';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { AIAssistantWidget } from '../components/AIAssistantWidget';

interface MainLayoutProps {
  user: User;
  session: { user: User; access_token: string } | null;
  currentView: View;
  onNavigate: (view: View) => void;
  children: React.ReactNode;
  editingCalculation: Calculation | null;
  calculatorHeaderInfo: CalculatorHeaderInfo;
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currentModule: 'machining' | 'casting' | 'forging' | null;
  onModuleChange: (module: 'machining' | 'casting' | 'forging' | null) => void;
}

const viewTitles: Record<View, string> = {
    auth: 'Authentication',
    landing: 'Welcome',
    calculations: 'Machining Calculation',
    calculator: 'New Calculation',
    results: 'Calculation Results',
    materials: 'Material Library',
    machines: 'Machine Library',
    processes: 'Process Library',
    toolLibrary: 'Tool Library',
    costMaster: 'Cost Master',
    settings: 'Settings',
    superadmin: 'Super Admin Panel',
    subscription: 'Subscription Plans',
    subscribersList: 'Subscribers List',
    feedback: 'Feedback & Requests',
    feedbackList: 'User Feedback',
    changelog: 'Software Changelog',
    resetPassword: 'Reset Password',
    oauthConsent: 'OAuth Consent',
};

const LogoutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const MenuIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const MainLayout: React.FC<MainLayoutProps> = ({ user, session, currentView, onNavigate, children, editingCalculation, calculatorHeaderInfo, onLogout, theme, setTheme, currentModule, onModuleChange }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const title = viewTitles[currentView] || 'Calculations';
    
    const isEditing = currentView === 'calculator' && editingCalculation; 
    const pageTitle = isEditing ? 'Edit Calculation' : title;

    const partNumber = calculatorHeaderInfo?.partNumber || editingCalculation?.inputs.partNumber;
    const calculationNumber = calculatorHeaderInfo?.calculationNumber || editingCalculation?.inputs.calculationNumber;

    const showSidebar = currentView !== 'auth' && currentView !== 'resetPassword' && currentView !== 'oauthConsent' && currentView !== 'landing' && currentView !== 'settings' && currentView !== 'subscription' && currentView !== 'profile' && !!currentModule;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [currentView]);

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      {showSidebar && isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {showSidebar && (
          <div className={`
              fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
              sidebar-container no-print
          `}>
              <Sidebar 
                  user={user} 
                  session={session}
                  currentView={currentView} 
                  onNavigate={onNavigate}
                  currentModule={currentModule}
                  onModuleChange={onModuleChange}
              />
          </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-surface text-text-primary sticky top-0 z-10 px-6 h-14 flex items-center border-b border-border flex-shrink-0 shadow-xs no-print">
          <div className="w-full flex justify-between items-center">
             <div className="flex items-center gap-4">
                {showSidebar && (
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-1 rounded-sm text-text-secondary hover:bg-background hover:text-text-primary focus:outline-none lg:hidden"
                    >
                        <MenuIcon />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    <h1 className="text-sm font-bold tracking-tight text-text-primary">{pageTitle}</h1>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                {currentView === 'calculator' && (partNumber || calculationNumber) && (
                    <div className="hidden md:flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-background px-3 py-1 rounded-sm border border-border">
                        {partNumber && <span>Part: {partNumber}</span>}
                        {calculationNumber && <span>Calc: {calculationNumber}</span>}
                    </div>
                )}
                <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>
                <ThemeToggle theme={theme} setTheme={setTheme} />
                 <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                    <LogoutIcon />
                    <span className="hidden sm:inline">Logout</span>
                </button>
             </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-background">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        
        {showSidebar && (
          <AIAssistantWidget onNavigate={(view) => onNavigate(view as any)} />
        )}
      </div>
    </div>
  );
};
