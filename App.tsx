import React, { useState, useEffect, useCallback, useRef } from 'react';
import { localDb } from './services/localDbService';

import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ResultsPage } from './pages/ResultsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { MachineLibraryPage } from './pages/MachineMasterPage';
import { ProcessLibraryPage } from './pages/ProcessMasterPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { EnterpriseManagementPage } from './pages/EnterpriseManagementPage';
import { EnterprisePage } from './pages/EnterprisePage';
import { ReportsPage } from './pages/ReportsPage';
import { ToolLibraryPage } from './pages/ToolLibraryPage';
import { CostMasterPage } from './pages/CostMasterPage';
import { MainLayout } from './layouts/MainLayout';
import { UserManagementPage } from './pages/UserManagementPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LandingPage } from './pages/LandingPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { FeedbackListPage } from './pages/FeedbackListPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { SubscriptionUpgradeModal } from './components/SubscriptionUpgradeModal';
import { PlansManagementPage } from './pages/PlansManagementPage';
import type { User, Calculation, MaterialMasterItem, Machine, Process, View, Tool, SubscriberInfo, Feedback, RegionCost, RegionCurrencyMap, CalculatorHeaderInfo, CalculationTemplate } from './types';
import { SUPER_ADMIN_EMAILS, DEFAULT_PROCESSES, DEFAULT_MACHINES_MASTER, INITIAL_MATERIALS_MASTER, DEFAULT_TOOLS_MASTER, DEFAULT_REGION_CURRENCY_MAP } from './constants';

declare global {
  interface Window {
    mixpanel: any;
    html2pdf: any;
  }
}

const uuid = () => crypto.randomUUID();

const App: React.FC = () => {
  const [session, setSession] = useState<{ user: User; access_token: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [materials, setMaterials] = useState<MaterialMasterItem[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberInfo[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [regionCosts, setRegionCosts] = useState<RegionCost[]>([]);
  const [regionCurrencyMap, setRegionCurrencyMap] = useState<RegionCurrencyMap[]>([]);
  const [templates, setTemplates] = useState<CalculationTemplate[]>([]);
  
  const [currentView, setCurrentView] = useState<View>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('view') === 'resetPassword') return 'resetPassword';
    const path = window.location.pathname;
    if (path === '/signup' || path === '/login') return 'auth';
    return 'auth'; 
  });

  const [editingCalculation, setEditingCalculation] = useState<Calculation | null>(null);
  const [viewingCalculation, setViewingCalculation] = useState<Calculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [calculatorHeaderInfo, setCalculatorHeaderInfo] = useState<CalculatorHeaderInfo>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  const hasInitializedView = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Mixpanel User Identification
  useEffect(() => {
    if (user && window.mixpanel) {
      window.mixpanel.identify(user.id);
      window.mixpanel.people.set({
        '$email': user.email,
        '$name': user.name,
        'Company Name': user.companyName,
        'Plan': user.plan_name,
        'Subscription Status': user.subscription_status,
      });
    }
  }, [user]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login' || path === '/signup') {
        if (!session) setCurrentView('auth');
      } else if (session) {
        if (path === '/') setCurrentView('landing');
        else if (path === '/settings') setCurrentView('settings');
        else if (path === '/calculations') setCurrentView('calculations');
        else if (path === '/materials') setCurrentView('materials');
        else if (path === '/machines') setCurrentView('machines');
        else if (path === '/processes') setCurrentView('processes');
        else if (path === '/calculator') setCurrentView('calculator');
        else if (path === '/results') setCurrentView('results');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session]);

  const fetchData = useCallback(async (currentUser: User) => {
    try {
      console.log("Starting local data fetch for user:", currentUser.email);
      const isCurrentUserSuperAdmin = SUPER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase());

      let localProcesses = (await localDb.getAll<Process>('processes')).filter(p => p.user_id === currentUser.id);

      let localMachines = (await localDb.getAll<Machine>('machines')).filter(m => m.user_id === currentUser.id);

      let localMaterials = (await localDb.getAll<MaterialMasterItem>('materials')).filter(m => m.user_id === currentUser.id);

      let localTools = (await localDb.getAll<Tool>('tools')).filter(t => t.user_id === currentUser.id);

      // Auto-seed default materials if user's list is empty
      if (localMaterials.length === 0) {
        console.log("Blank materials master. Auto-seeding default list for user:", currentUser.id);
        const seededMaterials = INITIAL_MATERIALS_MASTER.map(m => ({
          ...m,
          id: uuid(),
          user_id: currentUser.id
        }));
        await localDb.insertMultiple('materials', seededMaterials);
        localMaterials = seededMaterials;
      }

      // Auto-seed default machines if user's list is empty
      if (localMachines.length === 0) {
        console.log("Blank machines master. Auto-seeding default list for user:", currentUser.id);
        const seededMachines = DEFAULT_MACHINES_MASTER.map(m => ({
          ...m,
          id: uuid(),
          user_id: currentUser.id
        }));
        await localDb.insertMultiple('machines', seededMachines);
        localMachines = seededMachines;
      }

      // Auto-seed default processes if user's list is empty
      if (localProcesses.length === 0) {
        console.log("Blank processes master. Auto-seeding default list for user:", currentUser.id);
        const seededProcesses = DEFAULT_PROCESSES.map(p => ({
          ...p,
          id: uuid(),
          user_id: currentUser.id
        }));
        await localDb.insertMultiple('processes', seededProcesses);
        localProcesses = seededProcesses;
      }

      // Auto-seed default tools if user's list is empty
      if (localTools.length === 0) {
        console.log("Blank tools master. Auto-seeding default list for user:", currentUser.id);
        const seededTools = DEFAULT_TOOLS_MASTER.map(t => ({
          ...t,
          id: uuid(),
          user_id: currentUser.id
        }));
        await localDb.insertMultiple('tools', seededTools);
        localTools = seededTools;
      }

      setCalculations((await localDb.getAll<Calculation>('calculations')).filter(c => c.user_id === currentUser.id));
      setMaterials(localMaterials);
      setMachines(localMachines);
      setTools(localTools);
      setProcesses(localProcesses);
      let localRegionCurrencyMap = await localDb.getAll<RegionCurrencyMap>('region_currency_map');
      if (localRegionCurrencyMap.length === 0) {
        console.log("Blank region currency map. Auto-seeding default regions.");
        await localDb.insertMultiple('region_currency_map', DEFAULT_REGION_CURRENCY_MAP);
        localRegionCurrencyMap = DEFAULT_REGION_CURRENCY_MAP;
      }
      setRegionCurrencyMap(localRegionCurrencyMap);
      setRegionCosts((await localDb.getAll<RegionCost>('region_costs')).filter(rc => rc.user_id === currentUser.id));
      setTemplates((await localDb.getAll<CalculationTemplate>('calculation_templates')).filter(t => t.user_id === currentUser.id));
      
      const profile = await localDb.getById<User>('profiles', currentUser.id);
      if (profile) {
        setUser(profile);
      } else {
        setUser(currentUser);
      }

      if (isCurrentUserSuperAdmin) {
          setSubscribers(await localDb.getAll<SubscriberInfo>('profiles') as any);
          setFeedbacks(await localDb.getAll<Feedback>('feedback'));
      }
      console.log("Local data fetch completed successfully.");
    } catch (e: any) {
        console.error("An error occurred during local data fetch.", e);
        setError(`Failed to load application data: ${e.message || 'Unknown error'}`);
    }
  }, []);

  const initializeAuth = useCallback(() => {
    const currentSession = localDb.auth.getSession();
    if (currentSession) {
      setSession(currentSession);
      setLoading(true);
      fetchData(currentSession.user).finally(() => {
        if (!hasInitializedView.current) {
          const path = window.location.pathname;
          if (path === '/login' || path === '/signup') {
              try { window.history.replaceState({}, '', '/'); } catch (e) {}
              setCurrentView('landing');
          } else {
              if (path === '/') setCurrentView('landing');
              else if (path === '/settings') setCurrentView('settings');
              else if (path === '/calculations') setCurrentView('calculations');
              else if (path === '/materials') setCurrentView('materials');
              else if (path === '/machines') setCurrentView('machines');
              else if (path === '/processes') setCurrentView('processes');
              else if (path === '/calculator') setCurrentView('calculator');
              else if (path === '/results') setCurrentView('results');
              else setCurrentView('landing');
          }
          hasInitializedView.current = true;
        }
        setLoading(false);
      });
    } else {
      setSession(null);
      setUser(null);
      setLoading(false);
      const currentPath = window.location.pathname;
      if (currentPath !== '/signup' && currentPath !== '/login') {
        try { window.history.replaceState({}, '', '/login'); } catch (e) {}
      }
      setCurrentView('auth');
    }
  }, [fetchData]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (session?.user && (currentView === 'subscribersList' || currentView === 'enterpriseManagement')) {
      fetchData(session.user);
    }
  }, [currentView, session, fetchData]);

  const handleNavigation = useCallback((view: View) => {
    if (view !== 'calculator' && view !== 'results') {
        setEditingCalculation(null);
        setViewingCalculation(null);
    }
    
    let path = '/';
    switch (view) {
        case 'auth': path = '/login'; break;
        case 'landing': path = '/'; break;
        case 'settings': path = '/settings'; break;
        case 'calculations': path = '/calculations'; break;
        case 'materials': path = '/materials'; break;
        case 'machines': path = '/machines'; break;
        case 'processes': path = '/processes'; break;
        case 'toolLibrary': path = '/tools'; break;
        case 'costMaster': path = '/costs'; break;
        case 'subscription': path = '/subscription'; break;
        case 'results': path = '/results'; break;
        case 'calculator': path = '/calculator'; break;
        case 'enterpriseManagement': path = '/enterprise-management'; break;
        default: path = window.location.pathname;
    }
    
    if (path !== window.location.pathname) {
        try { window.history.pushState({}, '', path); } catch (e) {}
    }
    if (window.mixpanel) {
        window.mixpanel.track('View Changed', { view: view });
    }
    setCurrentView(view);
  }, []);
  
  const handleUpdateUser = useCallback(async (updatedUser: Partial<User>) => {
    if (!user) return;
    const newItem = { ...user, ...updatedUser };
    await localDb.upsert('profiles', newItem);
    localStorage.setItem('costinghub_current_user', JSON.stringify(newItem));
    setUser(newItem);
  }, [user]);

  const handleAutoSaveCalculation = useCallback(async (calculation: Calculation) => {
    if (!user) return;
    const approvalStatusToSet = calculation.approval_status || (user.role === 'enterprise_user' ? 'pending' : 'approved');
    const enrichedCalculation = { ...calculation, approval_status: approvalStatusToSet };
    const savedCalc = await localDb.upsert('calculations', enrichedCalculation);
    setCalculations(prev => [...prev.filter(c => c.id !== calculation.id), savedCalc]);
    if (editingCalculation?.id === calculation.id) {
        setEditingCalculation(savedCalc);
    }
  }, [user, editingCalculation]);

  const handleSaveCalculationFinal = useCallback(async (calculation: Calculation) => {
    if (!user) return;
    const approvalStatusToSet = calculation.approval_status || (user.role === 'enterprise_user' ? 'pending' : 'approved');
    const enrichedCalculation = { ...calculation, approval_status: approvalStatusToSet };
    const savedCalc = await localDb.upsert('calculations', enrichedCalculation);
    if (window.mixpanel) {
        window.mixpanel.track('Calculation Saved', {
            calculationId: calculation.id,
            status: calculation.status,
            partName: calculation.inputs.partName
        });
    }
    setCalculations(prev => [...prev.filter(c => c.id !== calculation.id), savedCalc]);
    setViewingCalculation(savedCalc);
    handleNavigation('results');
  }, [user, handleNavigation]);

  const handleSaveCalculationDraft = useCallback(async (calculation: Calculation) => {
    if (!user) return;
    const approvalStatusToSet = calculation.approval_status || (user.role === 'enterprise_user' ? 'pending' : 'approved');
    const enrichedCalculation = { ...calculation, approval_status: approvalStatusToSet };
    const savedCalc = await localDb.upsert('calculations', enrichedCalculation);
    setCalculations(prev => [...prev.filter(c => c.id !== calculation.id), savedCalc]);
    handleNavigation('calculations'); 
  }, [user, handleNavigation]);

  const crudHandler = useCallback(async (table: 'materials' | 'machines' | 'processes' | 'tools' | 'region_costs', action: 'add' | 'update' | 'delete' | 'add_multiple' | 'delete_multiple', payload: any, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!user) return;
    if (action === 'add') {
      const newItem = await localDb.upsert(table, { ...payload, id: uuid(), user_id: user.id });
      stateSetter(prev => [...prev, newItem]);
    } else if (action === 'update') {
      const updatedItem = await localDb.upsert(table, payload);
      stateSetter(prev => prev.map(item => item.id === payload.id ? updatedItem : item));
    } else if (action === 'delete') {
      await localDb.delete(table, payload);
      stateSetter(prev => prev.filter(item => item.id !== payload));
    } else if (action === 'add_multiple') {
      const fullPayloads = payload.map((item: any) => ({ ...item, id: uuid(), user_id: user.id }));
      const addedItems = await localDb.insertMultiple(table, fullPayloads);
      stateSetter(prev => [...prev, ...addedItems]);
    } else if (action === 'delete_multiple') {
      await localDb.deleteMultiple(table, payload);
      stateSetter(prev => prev.filter(item => !payload.includes(item.id)));
    }
  }, [user]);

  const handleAddRegionCurrency = async (map: Omit<RegionCurrencyMap, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;
    const newItem = await localDb.upsert('region_currency_map', { ...map, id: uuid(), user_id: user.id } as any);
    setRegionCurrencyMap(prev => [...prev, newItem]);
  };

  const handleDeleteRegionCurrency = async (id: string) => {
      await localDb.delete('region_currency_map', id);
      setRegionCurrencyMap(prev => prev.filter(rcm => rcm.id !== id));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  if (!session || !user) {
    return (
       <AuthPage successMessage={authSuccessMessage} setSuccessMessage={setAuthSuccessMessage} onAuthSuccess={initializeAuth} />
    );
  }

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());

  let content;
  switch (currentView) {
    case 'landing': content = <LandingPage onNavigate={handleNavigation} user={user} />; break;
    case 'resetPassword': content = <ResetPasswordPage onPasswordReset={() => handleNavigation('landing')} />; break;
    case 'calculations': content = <DashboardPage user={user} calculations={calculations} onNavigate={handleNavigation} onEdit={(calc) => { setEditingCalculation(calc); handleNavigation('calculator'); }} onDelete={async (id) => { await localDb.delete('calculations', id); setCalculations(prev => prev.filter(c => c.id !== id)); }} onViewResults={(calc) => { setViewingCalculation(calc); handleNavigation('results'); }} onUpgrade={() => setIsUpgradeModalOpen(true)} isSuperAdmin={isSuperAdmin} theme={theme} />; break;
    case 'calculator': content = <CalculatorPage user={user} materials={materials} machines={machines} processes={processes} tools={tools} regionCosts={regionCosts} regionCurrencyMap={regionCurrencyMap} templates={templates} onSave={handleSaveCalculationFinal} onSaveDraft={handleSaveCalculationDraft} onAutoSaveDraft={handleAutoSaveCalculation} onSaveTemplate={async (tmpl) => { const saved = await localDb.upsert('calculation_templates', { ...tmpl, user_id: user.id }); setTemplates(prev => [...prev.filter(t => t.id !== saved.id), saved]); }} onDeleteTemplate={async (id) => { await localDb.delete('calculation_templates', id); setTemplates(prev => prev.filter(t => t.id !== id)); }} onBack={() => handleNavigation('calculations')} existingCalculation={editingCalculation} theme={theme} onNavigate={handleNavigation} onHeaderInfoChange={setCalculatorHeaderInfo} onAddTool={(t) => crudHandler('tools', 'add', t, setTools)} />; break;
    case 'results': content = <ResultsPage user={user} calculation={viewingCalculation} onBack={() => handleNavigation('calculations')} />; break;
    case 'settings': content = <SettingsPage user={user} session={session as any} onUpdateUser={handleUpdateUser} onNavigate={handleNavigation} isSuperAdmin={isSuperAdmin} />; break;
    case 'subscribersList': content = <UserManagementPage subscribers={subscribers} theme={theme} onUpdateUser={async (id, updates) => { await localDb.upsert('profiles', { ...(await localDb.getById('profiles', id)), ...updates } as any); fetchData(user); }} onSendRecovery={async (email) => {}} onSendConfirmation={async (email) => {}} />; break;
    case 'plansList': content = <PlansManagementPage user={user} onBack={() => handleNavigation('superadmin')} />; break;
    case 'superadmin': content = <SuperAdminPage onNavigate={handleNavigation} />; break;
    case 'enterprise': content = <EnterprisePage user={user} />; break;
    case 'enterpriseManagement': content = <EnterpriseManagementPage user={user} onBack={() => handleNavigation('superadmin')} />; break;
    case 'reports': content = <ReportsPage user={user} onEdit={(calc) => { setEditingCalculation(calc); handleNavigation('calculator'); }} />; break;
    case 'feedbackList': content = <FeedbackListPage feedbacks={feedbacks} />; break;
    case 'subscription': content = <SubscriptionPage user={user} onBack={() => handleNavigation('settings')} onUpdateUser={handleUpdateUser} />; break;
    case 'materials': content = <MaterialsPage materials={materials} user={user} onAddMaterial={(mat) => crudHandler('materials', 'add', mat, setMaterials)} onUpdateMaterial={(mat) => crudHandler('materials', 'update', mat, setMaterials)} onDeleteMaterial={(id) => crudHandler('materials', 'delete', id, setMaterials)} onAddMultipleMaterials={(mats) => crudHandler('materials', 'add_multiple', mats, setMaterials)} onDeleteMultipleMaterials={(ids) => crudHandler('materials', 'delete_multiple', ids, setMaterials)} />; break;
    case 'machines': content = <MachineLibraryPage machines={machines} user={user} onAddMachine={(mach) => crudHandler('machines', 'add', mach, setMachines)} onUpdateMachine={(mach) => crudHandler('machines', 'update', mach, setMachines)} onDeleteMachine={(id) => crudHandler('machines', 'delete', id, setMachines)} onAddMultipleMachines={(machs) => crudHandler('machines', 'add_multiple', machs, setMachines)} onDeleteMultipleMachines={(ids) => crudHandler('machines', 'delete_multiple', ids, setMachines)} />; break;
    case 'processes': content = <ProcessLibraryPage processes={processes} user={user} onAddProcess={(proc) => crudHandler('processes', 'add', proc, setProcesses)} onUpdateProcess={(proc) => crudHandler('processes', 'update', proc, setProcesses)} onDeleteProcess={(id) => crudHandler('processes', 'delete', id, setProcesses)} onAddMultipleProcesses={(procs) => crudHandler('processes', 'add_multiple', procs, setProcesses)} onDeleteMultipleProcesses={(ids) => crudHandler('processes', 'delete_multiple', ids, setProcesses)} />; break;
    case 'toolLibrary': content = <ToolLibraryPage tools={tools} user={user} onAddTool={(tool) => crudHandler('tools', 'add', tool, setTools)} onUpdateTool={(tool) => crudHandler('tools', 'update', tool, setTools)} onDeleteTool={(id) => crudHandler('tools', 'delete', id, setTools)} onAddMultipleTools={(tls) => crudHandler('tools', 'add_multiple', tls, setTools)} onDeleteMultipleTools={(ids) => crudHandler('tools', 'delete_multiple', ids, setTools)} />; break;
    case 'costMaster': content = <CostMasterPage materials={materials} machines={machines} tools={tools} regionCosts={regionCosts} regionCurrencyMap={regionCurrencyMap} user={user} onUpdateMaterial={(mat) => crudHandler('materials', 'update', mat, setMaterials)} onUpdateMachine={(mach) => crudHandler('machines', 'update', mach, setMachines)} onUpdateTool={(tool) => crudHandler('tools', 'update', tool, setTools)} onAddRegionCost={(cost) => crudHandler('region_costs', 'add', cost, setRegionCosts)} onUpdateRegionCost={(cost) => crudHandler('region_costs', 'update', cost, setRegionCosts)} onDeleteRegionCost={(id) => crudHandler('region_costs', 'delete', id, setRegionCosts)} onAddRegionCurrency={handleAddRegionCurrency} onDeleteRegionCurrency={handleDeleteRegionCurrency} />; break;
    case 'feedback': content = <FeedbackPage user={user} onSubmit={async () => {}} />; break;
    default: content = <LandingPage onNavigate={handleNavigation} user={user!} />;
  }

  return (
    <MainLayout 
        user={user} 
        session={session as any}
        currentView={currentView} 
        onNavigate={handleNavigation} 
        onLogout={async () => {
          if (window.mixpanel) {
            window.mixpanel.track('Logged Out');
          }
          await localDb.auth.signOut();
          initializeAuth();
        }} 
        editingCalculation={editingCalculation}
        calculatorHeaderInfo={calculatorHeaderInfo}
        theme={theme} 
        setTheme={setTheme}
    >
      {isUpgradeModalOpen && <SubscriptionUpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onNavigate={handleNavigation} />}
      {content}
    </MainLayout>
  );
};

export default App;
