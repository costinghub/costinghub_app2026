import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, Hammer, Calculator, Box, LogOut, Menu, 
  Moon, Sun, Users, Building2, Wrench, FileSpreadsheet, ArrowLeft,
  Activity, SwitchCamera, Wifi, WifiOff, AlertTriangle, Layers, Cpu, Database, 
  Beaker, Droplets, Flame, ShieldCheck, Clock, ClipboardList, Container, Zap,
  CheckCircle, MessageSquare, Gauge
} from 'lucide-react';
import { Chatbot } from './Chatbot';
import { AuthService, supabase } from '../services/supabaseService';
import { UserRole } from '../types';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = AuthService.getCurrentUser();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isAdminPath = ['/enterprises', '/admin', '/super-admin'].some(p => location.pathname.startsWith(p));
  const isUserPath = !isAdminPath;
  const showAdminSidebar = isSuperAdmin && isAdminPath;

  const isMachiningModule = location.pathname.startsWith('/machining');
  const isMHRModule = location.pathname.startsWith('/mhr');
  const isCastingModule = location.pathname.startsWith('/casting');
  const isAssemblyModule = location.pathname.startsWith('/assembly');
  const isInsideModule = isMachiningModule || isMHRModule || isCastingModule || isAssemblyModule;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        setIsOnline(true);
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('fetch') || !navigator.onLine) setIsOnline(false);
        else setIsOnline(true);
      }
    };
    checkConnection();
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavItem = ({ to, icon: Icon, label, end = false }: { to: string; icon: any; label: string, end?: boolean }) => (
    <NavLink 
      to={to} 
      end={end}
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary-600'
        }`
      }
    >
      <Icon className="w-4 h-4 min-w-[1.25rem]" />
      {isSidebarOpen && <span className="text-sm truncate">{label}</span>}
    </NavLink>
  );

  const hasMachining = AuthService.hasModuleAccess('MACHINING');
  const hasMHR = AuthService.hasModuleAccess('MHR');
  const hasCasting = AuthService.hasModuleAccess('CASTING');
  const hasAssembly = AuthService.hasModuleAccess('ASSEMBLY');

  return (
    <div className={`min-h-screen flex bg-gray-50 dark:bg-slate-900 ${isDark ? 'dark' : ''}`}>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><LogOut className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Sign Out?</h3>
              <p className="text-slate-500 mb-6 text-sm">Are you sure you want to end your session?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium dark:text-white">Cancel</button>
                <button onClick={() => { AuthService.logout(); navigate('/login'); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className={`bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="p-4 flex items-center justify-between h-20 shrink-0">
            <div className="flex items-center gap-2 overflow-hidden px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              {isSidebarOpen ? (
                <div className="flex flex-col justify-center">
                  <div className="text-xl font-black leading-none tracking-tight">
                    <span className="text-slate-900 dark:text-white">Costing</span>
                    <span className="text-primary-600 dark:text-primary-400">Hub</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold tracking-widest mt-0.5 uppercase">Enterprise ZBC</span>
                </div>
              ) : (
                <div className="text-xl font-black text-primary-600">CH</div>
              )}
            </div>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Global Context (Always visible for easy switching) */}
            <div className="space-y-1">
               <div className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-2 ${!isSidebarOpen && 'hidden'}`}>Platform</div>
               <NavItem to="/dashboard" end icon={LayoutDashboard} label="Hub Home" />
               <NavItem to="/approvals" icon={ShieldCheck} label="Reviews" />
               <NavItem to="/my-requests" icon={Clock} label="My Workflow" />
            </div>

            {/* Machining Module */}
            {hasMachining && (
              <div className="space-y-1">
                <div className={`text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] px-4 mb-2 flex items-center justify-between ${!isSidebarOpen && 'hidden'}`}>
                  Machining
                  {isMachiningModule && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />}
                </div>
                <NavItem to="/machining" end icon={Box} label="Dashboard" />
                <NavItem to="/machining/calculator" icon={Calculator} label="Estimator" />
                
                {isInsideModule && isSidebarOpen && (
                  <div className="pl-4 py-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-700 ml-6">
                    <NavLink to="/machining/materials" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Materials</NavLink>
                    <NavLink to="/machining/tools" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Tools</NavLink>
                    <NavLink to="/machining/machines" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Machines</NavLink>
                    <NavLink to="/machining/processes" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-primary-600 font-bold bg-primary-50 dark:bg-primary-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Processes</NavLink>
                  </div>
                )}
              </div>
            )}

            {/* MHR Module */}
            {hasMHR && (
              <div className="space-y-1">
                <div className={`text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] px-4 mb-2 flex items-center justify-between ${!isSidebarOpen && 'hidden'}`}>
                  Rate Engine
                  {isMHRModule && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                </div>
                <NavItem to="/mhr" end icon={Gauge} label="MHR Library" />
                <NavItem to="/mhr/calculator" icon={Zap} label="Rate Calc" />
              </div>
            )}

            {/* Casting Module */}
            {hasCasting && (
              <div className="space-y-1">
                <div className={`text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] px-4 mb-2 flex items-center justify-between ${!isSidebarOpen && 'hidden'}`}>
                  Foundry
                  {isCastingModule && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
                </div>
                <NavItem to="/casting" end icon={Container} label="Calculations" />
                <NavItem to="/casting/calculator" icon={Flame} label="New Costing" />
                {isInsideModule && isSidebarOpen && (
                  <div className="pl-4 py-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-700 ml-6">
                    <NavLink to="/casting/masters/grade" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Grades</NavLink>
                    <NavLink to="/casting/masters/moulding" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Moulding</NavLink>
                    <NavLink to="/casting/masters/melting" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Melting</NavLink>
                    <NavLink to="/casting/masters/fettling" className={({isActive}) => `block text-xs py-1.5 px-3 rounded-lg transition-colors ${isActive ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>Fettling</NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Assembly Module */}
            {hasAssembly && (
              <div className="space-y-1">
                <div className={`text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] px-4 mb-2 flex items-center justify-between ${!isSidebarOpen && 'hidden'}`}>
                  Assembly
                  {isAssemblyModule && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />}
                </div>
                <NavItem to="/assembly" end icon={Layers} label="Dashboard" />
                <NavItem to="/assembly/calculator" icon={Wrench} label="BOM Estimator" />
              </div>
            )}

            {/* Admin Controls */}
            {(isSuperAdmin || user?.role === UserRole.ENTERPRISE_ADMIN) && (
              <div className="space-y-1 pt-4 border-t dark:border-slate-700">
                <div className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-2 ${!isSidebarOpen && 'hidden'}`}>Organization</div>
                {isSuperAdmin && <NavItem to="/enterprises" icon={Building2} label="Enterprises" />}
                {isSuperAdmin && <NavItem to="/admin/plan-features" icon={Activity} label="Plan Features" />}
                <NavItem to="/team" icon={Users} label="Manage Team" />
                <NavItem to="/settings" icon={Settings} label="Settings" />
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
            <div className="relative" ref={userMenuRef}>
               <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 w-full hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors">
                 <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-black shrink-0 border border-primary-200 dark:border-primary-800">{user?.name?.charAt(0)}</div>
                 {isSidebarOpen && <span className="text-sm font-bold text-slate-700 dark:text-gray-200 truncate">{user?.name}</span>}
               </button>
               {isUserMenuOpen && (
                 <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-1 z-20 overflow-hidden animate-in slide-in-from-bottom-2">
                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"><Settings className="w-3 h-3" /> Profile</button>
                    <button onClick={() => { setIsUserMenuOpen(false); setShowLogoutConfirm(true); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-black border-t dark:border-slate-700"><LogOut className="w-3 h-3" /> Sign Out</button>
                 </div>
               )}
            </div>
          </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight truncate max-w-[200px]">{user?.organizationId || 'Personal Workspace'}</h2>
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-700">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline === null ? 'bg-slate-300' : isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline === false ? 'text-red-500' : 'text-slate-500'}`}>
                  {isOnline === false ? 'Offline' : 'Connected'}
                </span>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/feedback')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-pink-50 text-pink-600 border border-pink-100 hover:bg-pink-100 dark:bg-pink-900/20 dark:border-pink-900/40 transition-colors">
              <MessageSquare className="w-3 h-3" /> Report Signal
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all">{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
            {isOnline === false && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    <span>CostingHub is in offline mode. Local changes will sync when connected.</span>
                </div>
            )}
            <Outlet />
        </div>
      </main>
      <Chatbot />
    </div>
  );
};