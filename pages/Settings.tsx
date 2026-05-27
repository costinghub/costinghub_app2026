
import React, { useState, useEffect } from 'react';
import { Save, Download, Hash, User, Lock, Server, CreditCard, Shield, AlertCircle, Smartphone, MapPin, X, ShieldCheck } from 'lucide-react';
import { DataService, AuthService, EnterpriseService } from '../services/supabaseService';
import { UserRole } from '../types';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'subscription' | 'system'>('profile');
  const user = AuthService.getCurrentUser();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isEnterpriseAdmin = user?.role === UserRole.ENTERPRISE_ADMIN;
  const canAccessSystem = isSuperAdmin || isEnterpriseAdmin;

  const canBackup = AuthService.hasFeatureAccess('ADMIN', 'DATA_BACKUP');
  const canAdvSettings = AuthService.hasFeatureAccess('ADMIN', 'SETTINGS_ADVANCED');

  // Profile State
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.organizationId || '',
    companyAddress: user?.companyAddress || '',
    phoneNumber: user?.phoneNumber || '',
    mfaEnabled: user?.mfaEnabled || false
  });

  // MFA Enrollment State
  const [isMFAEnrollOpen, setIsMFAEnrollOpen] = useState(false);
  const [mfaData, setMFAData] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMFACode] = useState('');
  const [mfaError, setMFAError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [usageStats, setUsageStats] = useState({ total: 0, limit: 0 });
  const [systemSettings, setSystemSettings] = useState<any>({ calcNumberPrefix: 'EST-', nextCalcNumber: 1001 });

  useEffect(() => {
    const loadSettings = async () => {
      if (canAccessSystem) {
        setSystemSettings(await DataService.getSettings());
      }
      const m = (await DataService.getMachining()).length;
      const h = (await DataService.getMHRs()).length;
      const c = (await DataService.getCasting()).length;
      const a = (await DataService.getAssembly()).length;
      
      let limit = 20; 
      if (user?.plan === 'PRO') limit = 200;
      if (user?.plan === 'ENTERPRISE') limit = 10000;
      
      const ent = await EnterpriseService.getCurrentEnterprise();
      if (ent && ent.maxCalculations) limit = ent.maxCalculations;

      setUsageStats({ total: m + h + c + a, limit });
    };
    loadSettings();
  }, [canAccessSystem, user?.plan, user?.organizationId]);

  const handleProfileSave = async () => {
    try {
        if (!user) return;
        await AuthService.updateProfile(user.id, {
            name: profile.name,
            companyAddress: profile.companyAddress,
            phoneNumber: profile.phoneNumber,
            organizationId: profile.company
        });
        alert('Profile updated successfully!');
    } catch (err: any) {
        alert('Failed to update profile: ' + err.message);
    }
  };

  const handleEnrollMFA = async () => {
    try {
      setMFAError(null);
      const data = await AuthService.enrollTOTP();
      setMFAData({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
      setIsMFAEnrollOpen(true);
    } catch (err: any) {
      alert('Failed to initiate MFA: ' + err.message);
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!mfaData || !mfaCode) return;
    try {
      setMFAError(null);
      await AuthService.verifyTOTP(mfaData.id, mfaCode);
      setProfile({ ...profile, mfaEnabled: true });
      setIsMFAEnrollOpen(false);
      setMFAData(null);
      setMFACode('');
      alert('Two-Factor Authentication is now ENABLED.');
    } catch (err: any) {
      setMFAError('Invalid code. Please try again.');
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Disable Two-Factor Authentication? Your account will be less secure.')) return;
    try {
      const factors = await AuthService.listMFAFactors();
      const totpFactor = factors.find(f => f.factor_type === 'totp');
      if (totpFactor) {
        await AuthService.unenrollTOTP(totpFactor.id);
        setProfile({ ...profile, mfaEnabled: false });
        alert('MFA has been disabled.');
      }
    } catch (err: any) {
      alert('Failed to disable MFA: ' + err.message);
    }
  };

  const handlePasswordChange = () => {
    alert('Password updated successfully (Mock)!');
    setPasswords({ current: '', new: '' });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Account Settings</h1>
        <p className="text-slate-500">Manage your profile, organization details, and security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-slate-600 hover:bg-gray-50'}`}>
              <User className="w-4 h-4" /> My Profile
            </button>
            <button onClick={() => setActiveTab('subscription')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscription' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-slate-600 hover:bg-gray-50'}`}>
              <CreditCard className="w-4 h-4" /> Usage & Plan
            </button>
            <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-slate-600 hover:bg-gray-50'}`}>
              <Lock className="w-4 h-4" /> Security (TOTP MFA)
            </button>
            {canAccessSystem && (
              <button onClick={() => setActiveTab('system')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-slate-600 hover:bg-gray-50'}`}>
                <Server className="w-4 h-4" /> System Admin
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
          
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Profile Information</h2>
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Full Name</label>
                    <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Email (System Locked)</label>
                    <input disabled value={profile.email} className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-slate-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input type="tel" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" placeholder="+1 (000) 000-0000" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Organization Name</label>
                    <input type="text" value={profile.company} onChange={e => setProfile({...profile, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Company Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <textarea rows={3} value={profile.companyAddress} onChange={e => setProfile({...profile, companyAddress: e.target.value})} className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Street, Building, City, Country" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <button onClick={handleProfileSave} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold transition-all">Save Profile Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY (MFA) */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-500 mb-8">Secure your account using a TOTP application like Google Authenticator or Microsoft Authenticator.</p>
              
              <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${profile.mfaEnabled ? 'bg-green-50 border-green-200 dark:bg-green-900/10' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/30'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${profile.mfaEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Status: {profile.mfaEnabled ? 'Enabled' : 'Disabled'}</h4>
                    <p className="text-xs text-slate-500 mt-1">Factor Type: TOTP (App Authenticator Only)</p>
                  </div>
                </div>
                {profile.mfaEnabled ? (
                  <button onClick={handleDisableMFA} className="px-6 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-sm">Disable MFA</button>
                ) : (
                  <button onClick={handleEnrollMFA} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm shadow-lg shadow-primary-500/20">Enable MFA</button>
                )}
              </div>

              <div className="mt-12 space-y-4 max-w-md">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Password</h3>
                 <input type="password" placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full border p-2 rounded-lg dark:bg-slate-700" />
                 <input type="password" placeholder="New Password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full border p-2 rounded-lg dark:bg-slate-700" />
                 <button onClick={handlePasswordChange} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900">Update Password</button>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION */}
          {activeTab === 'subscription' && (
             <div className="animate-in fade-in">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Usage & Plan</h2>
                <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden shadow-xl">
                   <div className="relative z-10">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Subscription Tier</div>
                      <div className="text-4xl font-black mb-6">{user?.plan}</div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400 font-medium">Calculation Usage</span>
                        <span className="font-bold">{usageStats.total} / {usageStats.limit}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-1000" style={{ width: `${Math.min(100, (usageStats.total / usageStats.limit) * 100)}%` }} />
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* MFA ENROLLMENT MODAL */}
      {isMFAEnrollOpen && mfaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border dark:border-slate-700 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Setup TOTP MFA</h3>
              <button onClick={() => setIsMFAEnrollOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Scan this QR code in your authenticator app (Google Authenticator, Microsoft, Authy, etc).</p>
            
            <div className="flex justify-center mb-6 bg-white p-4 rounded-xl shadow-inner inline-block mx-auto border-2 border-slate-100">
              <img src={mfaData.qrCode} alt="MFA QR Code" className="w-48 h-48" />
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border">
               <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enter Verification Code</label>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="000 000" 
                 className="w-full text-center text-3xl font-black tracking-widest bg-transparent focus:outline-none dark:text-white"
                 maxLength={6}
                 value={mfaCode}
                 onChange={e => setMFACode(e.target.value.replace(/\D/g, ''))}
               />
               {mfaError && <p className="text-xs text-red-500 mt-2 text-center font-bold">{mfaError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setIsMFAEnrollOpen(false)} className="py-3 text-slate-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={verifyAndEnableMFA} className="py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 active:scale-95 transition-all">Confirm & Activate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
