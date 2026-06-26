import React, { useState, useEffect, useCallback, useRef } from 'react';
import { localDb } from './services/localDbService';
import { supabase } from './services/supabaseClient';

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
import { ModuleSelectionPage } from './pages/ModuleSelectionPage';
import { MainLayout } from './layouts/MainLayout';
import { UserManagementPage } from './pages/UserManagementPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LandingPage } from './pages/LandingPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { CastingCalculatorPage } from './pages/CastingCalculatorPage';
import { ForgingCalculatorPage } from './pages/ForgingCalculatorPage';
import { StampingCalculatorPage } from './pages/StampingCalculatorPage';
import { FeedbackListPage } from './pages/FeedbackListPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { SubscriptionUpgradeModal } from './components/SubscriptionUpgradeModal';
import { NewEstimationModal } from './components/NewEstimationModal';
import { PlansManagementPage } from './pages/PlansManagementPage';
import type { User, Calculation, MaterialMasterItem, Machine, Process, View, Tool, SubscriberInfo, Feedback, RegionCost, RegionCurrencyMap, CalculatorHeaderInfo, CalculationTemplate } from './types';
import { SUPER_ADMIN_EMAILS, DEFAULT_PROCESSES, DEFAULT_MACHINES_MASTER, INITIAL_MATERIALS_MASTER, DEFAULT_TOOLS_MASTER, DEFAULT_REGION_CURRENCY_MAP, DEFAULT_CASTING_MATERIALS, DEFAULT_CASTING_MACHINES, DEFAULT_CASTING_PROCESSES, DEFAULT_CASTING_TOOLS, DEFAULT_FORGING_MATERIALS, DEFAULT_FORGING_MACHINES, DEFAULT_FORGING_PROCESSES, DEFAULT_FORGING_TOOLS, DEFAULT_STAMPING_MATERIALS, DEFAULT_STAMPING_MACHINES, DEFAULT_STAMPING_PROCESSES, DEFAULT_STAMPING_TOOLS } from './constants';

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
  const [currentModule, setCurrentModule] = useState<'machining' | 'casting' | 'forging' | 'stamping' | null>(() => {
    const saved = localStorage.getItem('costinghub_current_module');
    if (saved === 'null' || !saved) return null;
    return saved as 'machining' | 'casting' | 'forging' | 'stamping';
  });
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
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [calculatorHeaderInfo, setCalculatorHeaderInfo] = useState<CalculatorHeaderInfo>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNewEstimationModalOpen, setIsNewEstimationModalOpen] = useState(false);
  
  const hasInitializedView = useRef(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global captured error:", event.error);
      const messageStr = String(event.message || '').toLowerCase();
      const errorStr = event.error ? String(event.error.message || event.error).toLowerCase() : '';
      if (
        messageStr.includes('websocket') || 
        errorStr.includes('websocket') || 
        messageStr.includes('hmr') || 
        errorStr.includes('hmr') || 
        messageStr.includes('failed to connect') ||
        errorStr.includes('failed to connect')
      ) {
        return;
      }
      setError(`Application Error: ${event.message || 'Unknown runtime error'}`);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn("Unhandled Promise Rejection:", event.reason);
      const reasonStr = event.reason ? String(event.reason.message || event.reason).toLowerCase() : '';
      // Exclude HMR and WebSocket connections/reconnections
      if (
        reasonStr.includes('websocket') || 
        reasonStr.includes('hmr') || 
        reasonStr.includes('failed to connect') ||
        reasonStr.includes('ws://') || 
        reasonStr.includes('wss://')
      ) {
        return;
      }
      setError(`Connection Error: ${event.reason?.message || String(event.reason)}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentModule) {
      localStorage.setItem('costinghub_current_module', currentModule);
    } else {
      localStorage.removeItem('costinghub_current_module');
    }
  }, [currentModule]);

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

      // Map existing records to ensure they have the proper default module set
      localMaterials = localMaterials.map(m => m.module ? m : { ...m, module: 'machining' });
      localMachines = localMachines.map(m => m.module ? m : { ...m, module: 'machining' });
      localProcesses = localProcesses.map(p => p.module ? p : { ...p, module: 'machining' });
      localTools = localTools.map(t => t.module ? t : { ...t, module: 'machining' });

      // Check Machining Seeding
      if (localMaterials.filter(m => m.module === 'machining').length === 0) {
        console.log("No machining materials. Auto-seeding default list.");
        const seeded = INITIAL_MATERIALS_MASTER.map(m => ({ ...m, module: 'machining' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('materials', seeded);
        localMaterials = [...localMaterials, ...seeded];
      }
      if (localMachines.filter(m => m.module === 'machining').length === 0) {
        console.log("No machining machines. Auto-seeding default list.");
        const seeded = DEFAULT_MACHINES_MASTER.map(m => ({ ...m, module: 'machining' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('machines', seeded);
        localMachines = [...localMachines, ...seeded];
      }
      if (localProcesses.filter(p => p.module === 'machining').length === 0) {
        console.log("No machining processes. Auto-seeding default list.");
        const seeded = DEFAULT_PROCESSES.map(p => ({ ...p, module: 'machining' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('processes', seeded);
        localProcesses = [...localProcesses, ...seeded];
      }
      if (localTools.filter(t => t.module === 'machining').length === 0) {
        console.log("No machining tools. Auto-seeding default list.");
        const seeded = DEFAULT_TOOLS_MASTER.map(t => ({ ...t, module: 'machining' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('tools', seeded);
        localTools = [...localTools, ...seeded];
      }

      // Check Casting Seeding
      if (localMaterials.filter(m => m.module === 'casting').length === 0) {
        console.log("No casting materials. Auto-seeding default list.");
        const seeded = DEFAULT_CASTING_MATERIALS.map(m => ({ ...m, module: 'casting' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('materials', seeded);
        localMaterials = [...localMaterials, ...seeded];
      }
      if (localMachines.filter(m => m.module === 'casting').length === 0) {
        console.log("No casting machines. Auto-seeding default list.");
        const seeded = DEFAULT_CASTING_MACHINES.map(m => ({ ...m, module: 'casting' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('machines', seeded);
        localMachines = [...localMachines, ...seeded];
      }
      if (localProcesses.filter(p => p.module === 'casting').length === 0) {
        console.log("No casting processes. Auto-seeding default list.");
        const seeded = DEFAULT_CASTING_PROCESSES.map(p => ({ ...p, module: 'casting' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('processes', seeded);
        localProcesses = [...localProcesses, ...seeded];
      }
      if (localTools.filter(t => t.module === 'casting').length === 0) {
        console.log("No casting tools. Auto-seeding default list.");
        const seeded = DEFAULT_CASTING_TOOLS.map(t => ({ ...t, module: 'casting' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('tools', seeded);
        localTools = [...localTools, ...seeded];
      }

      // Check Forging Seeding
      if (localMaterials.filter(m => m.module === 'forging').length === 0) {
        console.log("No forging materials. Auto-seeding default list.");
        const seeded = DEFAULT_FORGING_MATERIALS.map(m => ({ ...m, module: 'forging' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('materials', seeded);
        localMaterials = [...localMaterials, ...seeded];
      }
      if (localMachines.filter(m => m.module === 'forging').length === 0) {
        console.log("No forging machines. Auto-seeding default list.");
        const seeded = DEFAULT_FORGING_MACHINES.map(m => ({ ...m, module: 'forging' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('machines', seeded);
        localMachines = [...localMachines, ...seeded];
      }
      if (localProcesses.filter(p => p.module === 'forging').length === 0) {
        console.log("No forging processes. Auto-seeding default list.");
        const seeded = DEFAULT_FORGING_PROCESSES.map(p => ({ ...p, module: 'forging' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('processes', seeded);
        localProcesses = [...localProcesses, ...seeded];
      }
      if (localTools.filter(t => t.module === 'forging').length === 0) {
        console.log("No forging tools. Auto-seeding default list.");
        const seeded = DEFAULT_FORGING_TOOLS.map(t => ({ ...t, module: 'forging' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('tools', seeded);
        localTools = [...localTools, ...seeded];
      }

      // Check Stamping Seeding
      if (localMaterials.filter(m => m.module === 'stamping').length === 0) {
        console.log("No stamping materials. Auto-seeding default list.");
        const seeded = DEFAULT_STAMPING_MATERIALS.map(m => ({ ...m, module: 'stamping' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('materials', seeded);
        localMaterials = [...localMaterials, ...seeded];
      }
      if (localMachines.filter(m => m.module === 'stamping').length === 0) {
        console.log("No stamping machines. Auto-seeding default list.");
        const seeded = DEFAULT_STAMPING_MACHINES.map(m => ({ ...m, module: 'stamping' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('machines', seeded);
        localMachines = [...localMachines, ...seeded];
      }
      if (localProcesses.filter(p => p.module === 'stamping').length === 0) {
        console.log("No stamping processes. Auto-seeding default list.");
        const seeded = DEFAULT_STAMPING_PROCESSES.map(p => ({ ...p, module: 'stamping' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('processes', seeded);
        localProcesses = [...localProcesses, ...seeded];
      }
      if (localTools.filter(t => t.module === 'stamping').length === 0) {
        console.log("No stamping tools. Auto-seeding default list.");
        const seeded = DEFAULT_STAMPING_TOOLS.map(t => ({ ...t, module: 'stamping' as const, id: uuid(), user_id: currentUser.id }));
        await localDb.insertMultiple('tools', seeded);
        localTools = [...localTools, ...seeded];
      }

      setCalculations((await localDb.getAll<Calculation>('calculations')).filter(c => c.user_id === currentUser.id && !c.is_hidden));
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
        setFatalError(`Failed to load application data: ${e.message || 'Unknown error'}`);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    let currentSession = localDb.auth.getSession();

    if (currentSession) {
      try {
        const { data: { session: sbSession }, error: sbError } = await supabase.auth.getSession();
        if (sbError) {
          console.error("Supabase authenticating session error on mount:", sbError);
          const errMsg = sbError.message?.toLowerCase() || '';
          if (errMsg.includes('refresh token') || errMsg.includes('not found') || sbError.status === 400) {
            console.warn("Invalid refresh token. Resetting credentials and redirecting to login.");
            localStorage.removeItem('costinghub_current_user');
            await supabase.auth.signOut().catch(() => {});
            currentSession = null;
          }
        } else if (!sbSession) {
          console.warn("No active Supabase session. Clearing cached credentials.");
          localStorage.removeItem('costinghub_current_user');
          currentSession = null;
        }
      } catch (err) {
        console.error("Error checking real Supabase session:", err);
      }
    }

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
    let resolvedView = view;
    if (resolvedView === 'newEstimation') {
        if (currentModule) {
            setEditingCalculation(null);
            setViewingCalculation(null);
            resolvedView = currentModule === 'casting' ? 'castingCalculator' : currentModule === 'forging' ? 'forgingCalculator' : currentModule === 'stamping' ? 'stampingCalculator' : 'calculator';
        } else {
            setIsNewEstimationModalOpen(true);
            return;
        }
    }

    // Module-specific navigation guard
    if (currentModule) {
      if (currentModule === 'machining') {
        const forbidden = ['castingCalculator', 'forgingCalculator', 'stampingCalculator', 'feedback'];
        if (forbidden.includes(resolvedView)) {
          resolvedView = 'calculations';
        }
      } else if (currentModule === 'casting') {
        const forbidden = ['calculator', 'forgingCalculator', 'stampingCalculator', 'feedback'];
        if (forbidden.includes(resolvedView)) {
          resolvedView = 'calculations';
        }
      } else if (currentModule === 'forging') {
        const forbidden = ['calculator', 'castingCalculator', 'stampingCalculator', 'feedback'];
        if (forbidden.includes(resolvedView)) {
          resolvedView = 'calculations';
        }
      } else if (currentModule === 'stamping') {
        const forbidden = ['calculator', 'castingCalculator', 'forgingCalculator', 'feedback'];
        if (forbidden.includes(resolvedView)) {
          resolvedView = 'calculations';
        }
      }
    }

    if (resolvedView !== 'calculator' && resolvedView !== 'results') {
        setEditingCalculation(null);
        setViewingCalculation(null);
    }
    
    let path = '/';
    switch (resolvedView) {
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
        case 'castingCalculator': path = '/casting-calculator'; break;
        case 'forgingCalculator': path = '/forging-calculator'; break;
        case 'enterpriseManagement': path = '/enterprise-management'; break;
        default: path = window.location.pathname;
    }
    
    if (path !== window.location.pathname) {
        try { window.history.pushState({}, '', path); } catch (e) {}
    }
    if (window.mixpanel) {
        window.mixpanel.track('View Changed', { view: resolvedView });
    }
    setCurrentView(resolvedView);
  }, [currentModule]);
  
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
    const enrichedCalculation = { ...calculation, approval_status: approvalStatusToSet, calculatorType: currentModule };
    const savedCalc = await localDb.upsert('calculations', enrichedCalculation);
    
    const wasAlreadyFinal = calculations.some(c => c.id === calculation.id && c.status === 'final');
    if (!wasAlreadyFinal) {
      const updatedUsage = (user.calculations_created_this_period || 0) + 1;
      await handleUpdateUser({ calculations_created_this_period: updatedUsage });
    }

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
  }, [user, handleNavigation, calculations, handleUpdateUser, currentModule]);

  const handleSaveCalculationDraft = useCallback(async (calculation: Calculation) => {
    if (!user) return;
    const approvalStatusToSet = calculation.approval_status || (user.role === 'enterprise_user' ? 'pending' : 'approved');
    const enrichedCalculation = { ...calculation, approval_status: approvalStatusToSet, calculatorType: currentModule };
    const savedCalc = await localDb.upsert('calculations', enrichedCalculation);
    setCalculations(prev => [...prev.filter(c => c.id !== calculation.id), savedCalc]);
    handleNavigation('calculations'); 
  }, [user, handleNavigation, currentModule]);

  const crudHandler = useCallback(async (table: 'materials' | 'machines' | 'processes' | 'tools' | 'region_costs', action: 'add' | 'update' | 'delete' | 'add_multiple' | 'delete_multiple', payload: any, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!user) return;
    if (action === 'add') {
      const newItem = await localDb.upsert(table, { ...payload, module: currentModule, id: uuid(), user_id: user.id });
      stateSetter(prev => [...prev, newItem]);
    } else if (action === 'update') {
      const updatedItem = await localDb.upsert(table, payload);
      stateSetter(prev => prev.map(item => item.id === payload.id ? updatedItem : item));
    } else if (action === 'delete') {
      await localDb.delete(table, payload);
      stateSetter(prev => prev.filter(item => item.id !== payload));
    } else if (action === 'add_multiple') {
      const fullPayloads = payload.map((item: any) => ({ ...item, module: currentModule, id: uuid(), user_id: user.id }));
      const addedItems = await localDb.insertMultiple(table, fullPayloads);
      stateSetter(prev => [...prev, ...addedItems]);
    } else if (action === 'delete_multiple') {
      await localDb.deleteMultiple(table, payload);
      stateSetter(prev => prev.filter(item => !payload.includes(item.id)));
    }
  }, [user, currentModule]);

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
  if (fatalError) return (
    <div className="flex flex-col items-center justify-center h-screen bg-background p-6 text-center">
      <div className="bg-surface border border-border p-8 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden text-left">
        {/* Visual design banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-rose-600" />
        
        <div className="flex items-start gap-4 mt-2">
          <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl w-max">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-text-primary font-black text-2xl tracking-tight leading-none">System Encountered an Error</h2>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest">CostingHub Diagnostic System</p>
          </div>
        </div>

        <div className="mt-6 bg-background/60 p-4 rounded-xl border border-border overflow-auto max-h-48 font-mono text-xs text-text-secondary select-all animate-pulse-once">
          {fatalError}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg transition-all"
          >
            Reload Dashboard
          </button>
          <button 
            onClick={() => setFatalError(null)}
            className="flex-1 bg-background hover:bg-surface border border-border text-text-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all"
          >
            Dismiss & Keep Session
          </button>
        </div>
      </div>
    </div>
  );

  if (!session || !user) {
    return (
       <AuthPage successMessage={authSuccessMessage} setSuccessMessage={setAuthSuccessMessage} onAuthSuccess={initializeAuth} />
    );
  }

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase());

  let content;
  const isGeneralView = ['auth', 'resetPassword', 'oauthConsent', 'settings', 'subscription'].includes(currentView);
  if (currentView === 'landing' || (!currentModule && !isGeneralView)) {
    content = (
      <LandingPage 
        onNavigate={handleNavigation} 
        user={user} 
        session={session}
        calculationsCount={calculations.filter(c => !c.is_hidden).length}
        materialsCount={materials.length}
        machinesCount={machines.length}
        processesCount={processes.length}
        toolsCount={tools.length}
        onModuleChange={setCurrentModule}
      />
    );
  } else {
    switch (currentView) {
      case 'landing': 
        content = (
          <LandingPage 
            onNavigate={handleNavigation} 
            user={user} 
            session={session}
            calculationsCount={calculations.filter(c => !c.is_hidden).length}
            materialsCount={materials.length}
            machinesCount={machines.length}
            processesCount={processes.length}
            toolsCount={tools.length}
            onModuleChange={setCurrentModule}
          />
        ); 
        break;
      case 'resetPassword': 
        content = <ResetPasswordPage onPasswordReset={() => handleNavigation('landing')} />; 
        break;
      case 'calculations': 
        content = <DashboardPage user={user} calculations={calculations.filter(c => (c.calculatorType || 'machining') === (currentModule || 'machining'))} onNavigate={handleNavigation} onEdit={(calc) => { setEditingCalculation(calc); handleNavigation(calc.calculatorType === 'forging' ? 'forgingCalculator' : calc.calculatorType === 'casting' ? 'castingCalculator' : calc.calculatorType === 'stamping' ? 'stampingCalculator' : 'calculator'); }} onDelete={async (id) => { const calc = calculations.find(c => c.id === id); if (calc) { await localDb.upsert('calculations', { ...calc, is_hidden: true }); } setCalculations(prev => prev.filter(c => c.id !== id)); }} onViewResults={(calc) => { setViewingCalculation(calc); handleNavigation('results'); }} onUpgrade={() => setIsUpgradeModalOpen(true)} isSuperAdmin={isSuperAdmin} theme={theme} activeModule={currentModule || 'machining'} />; 
        break;
      case 'calculator': 
        content = <CalculatorPage user={user} materials={materials.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} machines={machines.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} processes={processes.filter(p => (p.module || 'machining') === (currentModule || 'machining'))} tools={tools.filter(t => (t.module || 'machining') === (currentModule || 'machining'))} regionCosts={regionCosts} regionCurrencyMap={regionCurrencyMap} templates={templates} onSave={handleSaveCalculationFinal} onSaveDraft={handleSaveCalculationDraft} onAutoSaveDraft={handleAutoSaveCalculation} onSaveTemplate={async (tmpl) => { const saved = await localDb.upsert('calculation_templates', { ...tmpl, user_id: user.id }); setTemplates(prev => [...prev.filter(t => t.id !== saved.id), saved]); }} onDeleteTemplate={async (id) => { await localDb.delete('calculation_templates', id); setTemplates(prev => prev.filter(t => t.id !== id)); }} onBack={() => handleNavigation('calculations')} existingCalculation={editingCalculation} theme={theme} onNavigate={handleNavigation} onHeaderInfoChange={setCalculatorHeaderInfo} onAddTool={(t) => crudHandler('tools', 'add', t, setTools)} calculations={calculations} />; 
        break;
      case 'castingCalculator': 
        content = <CastingCalculatorPage user={user} onSave={handleSaveCalculationFinal} onSaveDraft={handleSaveCalculationDraft} onBack={() => handleNavigation('calculations')} existingCalculation={editingCalculation} theme={theme} onNavigate={handleNavigation} />; 
        break;
      case 'forgingCalculator': 
        content = <ForgingCalculatorPage user={user} onSave={handleSaveCalculationFinal} onSaveDraft={handleSaveCalculationDraft} onBack={() => handleNavigation('calculations')} existingCalculation={editingCalculation} theme={theme} onNavigate={handleNavigation} />; 
        break;
      case 'stampingCalculator': 
        content = <StampingCalculatorPage user={user} onSave={handleSaveCalculationFinal} onSaveDraft={handleSaveCalculationDraft} onBack={() => handleNavigation('calculations')} existingCalculation={editingCalculation} theme={theme} onNavigate={handleNavigation} />; 
        break;
      case 'results': 
        content = <ResultsPage user={user} calculation={viewingCalculation} onBack={() => handleNavigation('calculations')} materials={materials.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} />; 
        break;
      case 'settings': 
        content = <SettingsPage user={user} session={session as any} onUpdateUser={handleUpdateUser} onNavigate={handleNavigation} isSuperAdmin={isSuperAdmin} onExportData={() => ({
          module: currentModule || 'machining',
          calculations: calculations.filter(c => (c.calculatorType || 'machining') === (currentModule || 'machining')),
          materials: materials.filter(m => (m.module || 'machining') === (currentModule || 'machining')),
          machines: machines.filter(m => (m.module || 'machining') === (currentModule || 'machining')),
          processes: processes.filter(p => (p.module || 'machining') === (currentModule || 'machining')),
          tools: tools.filter(t => (t.module || 'machining') === (currentModule || 'machining'))
        })} onImportData={async (data) => {
          await localDb.insertMultiple('calculations', data.calculations);
          await localDb.insertMultiple('materials', data.materials);
          await localDb.insertMultiple('machines', data.machines);
          await localDb.insertMultiple('processes', data.processes);
          await localDb.insertMultiple('tools', data.tools);
          fetchData(user);
        }} />; 
        break;
      case 'subscribersList': content = <UserManagementPage subscribers={subscribers} theme={theme} onUpdateUser={async (id, updates) => { await localDb.upsert('profiles', { ...(await localDb.getById('profiles', id)), ...updates } as any); fetchData(user); }} onSendRecovery={async (email) => {}} onSendConfirmation={async (email) => {}} />; break;
      case 'plansList': content = <PlansManagementPage user={user} onBack={() => handleNavigation('superadmin')} />; break;
      case 'superadmin': content = <SuperAdminPage onNavigate={handleNavigation} />; break;
      case 'enterprise': content = <EnterprisePage user={user} />; break;
      case 'enterpriseManagement': content = <EnterpriseManagementPage user={user} onBack={() => handleNavigation('superadmin')} />; break;
      case 'reports': content = <ReportsPage user={user} onEdit={(calc) => { setEditingCalculation(calc); handleNavigation(calc.calculatorType === 'forging' ? 'forgingCalculator' : calc.calculatorType === 'casting' ? 'castingCalculator' : 'calculator'); }} />; break;
      case 'feedbackList': content = <FeedbackListPage feedbacks={feedbacks} />; break;
      case 'subscription': content = <SubscriptionPage user={user} onBack={() => handleNavigation('settings')} onUpdateUser={handleUpdateUser} />; break;
      case 'materials': content = <MaterialsPage materials={materials.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} user={user} onAddMaterial={(mat) => crudHandler('materials', 'add', mat, setMaterials)} onUpdateMaterial={(mat) => crudHandler('materials', 'update', mat, setMaterials)} onDeleteMaterial={(id) => crudHandler('materials', 'delete', id, setMaterials)} onAddMultipleMaterials={(mats) => crudHandler('materials', 'add_multiple', mats, setMaterials)} onDeleteMultipleMaterials={(ids) => crudHandler('materials', 'delete_multiple', ids, setMaterials)} />; break;
      case 'machines': content = <MachineLibraryPage machines={machines.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} user={user} onAddMachine={(mach) => crudHandler('machines', 'add', mach, setMachines)} onUpdateMachine={(mach) => crudHandler('machines', 'update', mach, setMachines)} onDeleteMachine={(id) => crudHandler('machines', 'delete', id, setMachines)} onAddMultipleMachines={(machs) => crudHandler('machines', 'add_multiple', machs, setMachines)} onDeleteMultipleMachines={(ids) => crudHandler('machines', 'delete_multiple', ids, setMachines)} />; break;
      case 'processes': content = <ProcessLibraryPage processes={processes.filter(p => (p.module || 'machining') === (currentModule || 'machining'))} user={user} onAddProcess={(proc) => crudHandler('processes', 'add', proc, setProcesses)} onUpdateProcess={(proc) => crudHandler('processes', 'update', proc, setProcesses)} onDeleteProcess={(id) => crudHandler('processes', 'delete', id, setProcesses)} onAddMultipleProcesses={(procs) => crudHandler('processes', 'add_multiple', procs, setProcesses)} onDeleteMultipleProcesses={(ids) => crudHandler('processes', 'delete_multiple', ids, setProcesses)} />; break;
      case 'toolLibrary': content = <ToolLibraryPage tools={tools.filter(t => (t.module || 'machining') === (currentModule || 'machining'))} user={user} onAddTool={(tool) => crudHandler('tools', 'add', tool, setTools)} onUpdateTool={(tool) => crudHandler('tools', 'update', tool, setTools)} onDeleteTool={(id) => crudHandler('tools', 'delete', id, setTools)} onAddMultipleTools={(tls) => crudHandler('tools', 'add_multiple', tls, setTools)} onDeleteMultipleTools={(ids) => crudHandler('tools', 'delete_multiple', ids, setTools)} />; break;
      case 'costMaster': content = <CostMasterPage materials={materials.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} machines={machines.filter(m => (m.module || 'machining') === (currentModule || 'machining'))} tools={tools.filter(t => (t.module || 'machining') === (currentModule || 'machining'))} regionCosts={regionCosts} regionCurrencyMap={regionCurrencyMap} user={user} onUpdateMaterial={(mat) => crudHandler('materials', 'update', mat, setMaterials)} onUpdateMachine={(mach) => crudHandler('machines', 'update', mach, setMachines)} onUpdateTool={(tool) => crudHandler('tools', 'update', tool, setTools)} onAddRegionCost={(cost) => crudHandler('region_costs', 'add', cost, setRegionCosts)} onUpdateRegionCost={(cost) => crudHandler('region_costs', 'update', cost, setRegionCosts)} onDeleteRegionCost={(id) => crudHandler('region_costs', 'delete', id, setRegionCosts)} onAddRegionCurrency={handleAddRegionCurrency} onDeleteRegionCurrency={handleDeleteRegionCurrency} />; break;
      case 'feedback': content = <FeedbackPage user={user} onSubmit={async (feedbackData) => {
        const newFeedback = {
          id: uuid(),
          user_id: user.id,
          user_email: user.email,
          created_at: new Date().toISOString(),
          ...feedbackData
        };
        await localDb.upsert('feedback', newFeedback as any);
        if (SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          setFeedbacks(await localDb.getAll<Feedback>('feedback'));
        }
      }} />; break;
      default: content = <LandingPage onNavigate={handleNavigation} user={user!} session={session} />;
    }
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
        currentModule={currentModule}
        onModuleChange={setCurrentModule}
    >
      {isUpgradeModalOpen && <SubscriptionUpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onNavigate={handleNavigation} />}
      {isNewEstimationModalOpen && (
        <NewEstimationModal 
          isOpen={isNewEstimationModalOpen} 
          onClose={() => setIsNewEstimationModalOpen(false)} 
          onSelect={(module, subType) => {
            setCurrentModule(module);
            if (subType) {
              if (module === 'casting') localStorage.setItem('costinghub_initial_casting_type', subType);
              if (module === 'forging') localStorage.setItem('costinghub_initial_forging_type', subType);
              if (module === 'stamping') localStorage.setItem('costinghub_initial_stamping_type', subType);
            }
            setIsNewEstimationModalOpen(false);
            handleNavigation(module === 'casting' ? 'castingCalculator' : module === 'forging' ? 'forgingCalculator' : module === 'stamping' ? 'stampingCalculator' : 'calculator');
          }}
        />
      )}
      {content}
      
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-zinc-900 border border-red-500/30 rounded-2xl shadow-xl shadow-red-500/5 p-4 animate-fade-in flex items-start gap-3">
          <div className="p-2 bg-red-500/10 text-red-600 rounded-xl flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-zinc-900 dark:text-zinc-100 text-xs font-black uppercase tracking-wider">System Notice</h4>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 font-mono break-words line-clamp-3 leading-relaxed">{error}</p>
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
              >
                Reload Dashboard
              </button>
              <button 
                onClick={() => setError(null)}
                className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default App;
