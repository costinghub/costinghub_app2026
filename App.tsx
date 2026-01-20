
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { MFA } from './pages/MFA';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { SuperAdminLanding } from './pages/SuperAdminLanding';
import { Machining } from './pages/Machining';
import { MachiningDashboard } from './pages/MachiningDashboard';
import { MachiningReports } from './pages/MachiningReports';
import { MachiningMasters } from './pages/MachiningMasters';
import { ProcessMaster } from './pages/ProcessMaster';
import { MHR } from './pages/MHR';
import { MHRDashboard } from './pages/MHRDashboard';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { EnterpriseManagement } from './pages/EnterpriseManagement';
import { ApprovalConfiguration } from './pages/ApprovalConfiguration';
import { CostMaster } from './pages/CostMaster';
import { PlanFeatureManagement } from './pages/PlanFeatureManagement';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { MyRequests } from './pages/MyRequests';
import { FeedbackForm } from './pages/FeedbackForm';
import { AdminFeedbacks } from './pages/AdminFeedbacks';
import { AuthService } from './services/supabaseService';
import { Loader2 } from 'lucide-react';

import { CastingCalculator } from './pages/CastingCalculator';
import { CastingDashboard } from './pages/CastingDashboard';
import { CastingMasters } from './pages/CastingMasters';
import { AssemblyCalculator } from './pages/AssemblyCalculator';
import { AssemblyDashboard } from './pages/AssemblyDashboard';
import { AssemblyMasters } from './pages/AssemblyMasters';

const ProtectedRoute: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [ready, setReady] = useState(AuthService.isReady());
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    if (ready) return;
    const check = setInterval(() => {
      if (AuthService.isReady()) {
        setReady(true);
        clearInterval(check);
      }
    }, 150);
    return () => clearInterval(check);
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <p className="text-slate-500 font-medium animate-pulse">Syncing Hub Context...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mfa" element={<MFA />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="super-admin" element={<SuperAdminLanding />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="machining">
             <Route index element={<MachiningDashboard />} />
             <Route path="calculator" element={<Machining />} />
             <Route path="materials" element={<MachiningMasters type="MATERIAL" />} />
             <Route path="tools" element={<MachiningMasters type="TOOL" />} />
             <Route path="machines" element={<MachiningMasters type="MACHINE" />} />
             <Route path="processes" element={<ProcessMaster />} />
             <Route path="reports" element={<MachiningReports />} />
          </Route>

          <Route path="approvals" element={<ApprovalCenter />} />
          <Route path="my-requests" element={<MyRequests />} />
          
          <Route path="mhr">
            <Route index element={<MHRDashboard />} />
            <Route path="calculator" element={<MHR />} />
          </Route>

          <Route path="casting">
             <Route index element={<CastingDashboard />} />
             <Route path="calculator" element={<CastingCalculator />} />
             <Route path="masters/grade" element={<CastingMasters type="GRADE" />} />
             <Route path="masters/moulding" element={<CastingMasters type="BOX" />} />
             <Route path="masters/melting" element={<CastingMasters type="FURNACE" />} />
             <Route path="masters/fettling" element={<CastingMasters type="GRADE" />} /> {/* Routing to CastingMasters is tab-based */}
             <Route path="masters/consumables" element={<CastingMasters type="GRADE" />} />
             <Route path="masters/elements" element={<CastingMasters type="GRADE" />} />
          </Route>
          
          <Route path="assembly">
             <Route index element={<AssemblyDashboard />} />
             <Route path="calculator" element={<AssemblyCalculator />} />
             <Route path="masters/bom" element={<AssemblyMasters type="BOM" />} />
             <Route path="masters/labor" element={<AssemblyMasters type="LABOR" />} />
          </Route>
          
          <Route path="cost-master" element={<CostMaster />} />
          <Route path="team" element={<UserManagement />} />
          <Route path="approval-config" element={<ApprovalConfiguration />} />
          <Route path="enterprises" element={<EnterpriseManagement />} />
          <Route path="admin/plan-features" element={<PlanFeatureManagement />} />
          <Route path="admin/feedbacks" element={<AdminFeedbacks />} />
          <Route path="settings" element={<Settings />} />
          <Route path="feedback" element={<FeedbackForm />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
