
import { createClient } from '@supabase/supabase-js';
import { 
  User, UserRole, MHRCalculation, MachiningCostSheet, Customer, Enterprise, 
  MachiningMaterial, Tool, Machine, CastingCostSheet, CastingGrade, 
  MouldingBox, MeltingFurnace, ChemicalElement, FettlingProcess, 
  FoundryConsumables, AssemblyCostSheet, CostProfile, Process, 
  ModuleType, LicenseLimits, UserFeedback, ChatMessage 
} from '../types';

const FALLBACK_URL = 'https://mmlwbjtxfbzpniubzuie.supabase.co';
const FALLBACK_KEY = 'sb_publishable_2nPV6OmwzfgPPEQlYBTVRQ_zsrEnPap';

const detectSupabaseUrl = (): string => {
  let url = '';
  try {
    // @ts-ignore
    url = url || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL);
    // @ts-ignore
    url = url || (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL);
    url = url || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);
    url = url || (typeof window !== 'undefined' && (window as any).VITE_SUPABASE_URL);
  } catch (e) {}
  const result = (typeof url === 'string' && url.length > 10) ? url : FALLBACK_URL;
  return result.replace(/['"]/g, '').trim();
};

const detectSupabaseKey = (): string => {
  let key = '';
  try {
    // @ts-ignore
    key = key || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY);
    // @ts-ignore
    key = key || (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    // @ts-ignore
    key = key || (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);
    key = key || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);
    key = key || (typeof window !== 'undefined' && (window as any).VITE_SUPABASE_ANON_KEY);
  } catch (e) {}
  const result = (typeof key === 'string' && key.length > 10) ? key : FALLBACK_KEY;
  return result.split(' ')[0].replace(/['"]/g, '').trim();
};

const finalUrl = detectSupabaseUrl();
const finalKey = detectSupabaseKey();

export const supabase = createClient(finalUrl, finalKey);

// --- State & Context Management ---
let cachedUser: User | null = null;
let cachedEnterprise: Enterprise | null = null;
let cachedPlanFeatures: any = {
  // Hardcoded default: Allow everything for all plans initially to prevent "locked out" state
  FREE: ['MACHINING', 'MHR', 'CASTING', 'ASSEMBLY'],
  PRO: ['MACHINING', 'MHR', 'CASTING', 'ASSEMBLY'],
  ENTERPRISE: ['MACHINING', 'MHR', 'CASTING', 'ASSEMBLY', 'ADMIN']
};
let cachedPlanSubFeatures: any = {
  FREE: { MACHINING: ['BASIC_CALC', 'REPORTS', 'AI_TOOLS', 'BATCH_ESTIMATION'], MHR: ['BASIC_CALC', 'ANALYTICS', 'POWER_ANALYSIS'], CASTING: ['BASIC_CALC', 'MASTERS', 'CORE_MGMT'], ASSEMBLY: ['BASIC_CALC', 'BOM_MGMT', 'LABOR_MASTERS'] },
  PRO: { MACHINING: ['BASIC_CALC', 'REPORTS', 'AI_TOOLS', 'BATCH_ESTIMATION'], MHR: ['BASIC_CALC', 'ANALYTICS', 'POWER_ANALYSIS'], CASTING: ['BASIC_CALC', 'MASTERS', 'CORE_MGMT'], ASSEMBLY: ['BASIC_CALC', 'BOM_MGMT', 'LABOR_MASTERS'] },
  ENTERPRISE: { MACHINING: ['BASIC_CALC', 'REPORTS', 'AI_TOOLS', 'BATCH_ESTIMATION'], MHR: ['BASIC_CALC', 'ANALYTICS', 'POWER_ANALYSIS'], CASTING: ['BASIC_CALC', 'MASTERS', 'CORE_MGMT'], ASSEMBLY: ['BASIC_CALC', 'BOM_MGMT', 'LABOR_MASTERS'], ADMIN: ['DATA_BACKUP', 'SETTINGS_ADVANCED'] }
};
let isAuthReady = false;

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

async function performQuery<T>(query: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await query();
    if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('not found in the schema cache')) {
            return fallback;
        }
        throw error;
    }
    return data ? toCamelCase(data) : fallback;
  } catch (err: any) {
    console.error("Database Query Error:", JSON.stringify(err, null, 2));
    return fallback;
  }
}

const syncFullContext = async (id: string, email: string) => {
  try {
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    
    if (profile) {
      cachedUser = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        plan: profile.plan || 'FREE',
        organizationId: profile.organization_id,
        mfaEnabled: profile.mfa_enabled || false,
        companyAddress: profile.company_address || '',
        phoneNumber: profile.phone_number || ''
      };

      if (cachedUser.organizationId) {
        const { data: ent } = await supabase.from('enterprises').select('*').eq('name', cachedUser.organizationId).maybeSingle();
        if (ent) {
          cachedEnterprise = toCamelCase(ent);
          cachedUser.plan = cachedEnterprise?.plan || cachedUser.plan;
        }
      }

      await AuthService.refreshPlanContext();
    } else if (!pError) {
      cachedUser = { id, name: 'New User', email, role: UserRole.COST_ENGINEER, plan: 'FREE', mfaEnabled: false };
    }
  } catch (e: any) {
    console.warn("Context Sync Warning:", e.message);
  } finally {
    isAuthReady = true;
  }
};

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    await syncFullContext(session.user.id, session.user.email!);
  } else {
    cachedUser = null;
    cachedEnterprise = null;
    isAuthReady = true;
  }
});

export const AuthService = {
  login: async (email: string, password?: string): Promise<{ user: User; mfaRequired: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password || 'password123',
    });
    if (error) throw error;

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = factors?.all?.some(f => f.status === 'verified' && f.factor_type === 'totp');

    await syncFullContext(data.user.id, data.user.email!);
    
    return {
        user: cachedUser!,
        mfaRequired: !!hasVerifiedFactor
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
    cachedUser = null;
    cachedEnterprise = null;
  },

  signup: async (name: string, email: string, company: string, password?: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password || 'password123',
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup failed. No user returned.");

    const role = email.toLowerCase() === 'admin@costinghub.com' ? UserRole.SUPER_ADMIN : UserRole.COST_ENGINEER;
    
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', authData.user.id).maybeSingle();
    
    if (!existing) {
        await supabase.from('profiles').insert([{
            id: authData.user.id,
            email: email.toLowerCase().trim(),
            name,
            organization_id: company,
            role,
            plan: 'FREE',
            mfa_enabled: false
        }]);
    }

    await syncFullContext(authData.user.id, email);
    return cachedUser!;
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    const snakeData: any = {};
    if (data.name !== undefined) snakeData.name = data.name;
    if (data.companyAddress !== undefined) snakeData.company_address = data.companyAddress;
    if (data.phoneNumber !== undefined) snakeData.phone_number = data.phoneNumber;
    if (data.mfaEnabled !== undefined) snakeData.mfa_enabled = data.mfaEnabled;
    if (data.organizationId !== undefined) snakeData.organization_id = data.organizationId;

    const { error } = await supabase.from('profiles').update(snakeData).eq('id', userId);
    if (error) throw error;
    if (cachedUser) {
        cachedUser = { ...cachedUser, ...data };
    }
  },

  enrollTOTP: async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'CostingHub'
    });
    if (error) throw error;
    return data; 
  },

  verifyTOTP: async (factorId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw error;
    
    const challengeId = data.id;
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    });
    
    if (verifyError) throw verifyError;
    
    if (cachedUser) {
        await AuthService.updateProfile(cachedUser.id, { mfaEnabled: true });
    }
    return true;
  },

  verifyMFA: async (code: string) => {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    
    const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
    if (!totpFactor) return false;

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeError) throw challengeError;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code
    });
    
    return !verifyError;
  },

  unenrollTOTP: async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    
    if (cachedUser) {
        await AuthService.updateProfile(cachedUser.id, { mfaEnabled: false });
    }
    return true;
  },

  listMFAFactors: async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data.all; 
  },

  getCurrentUser: () => cachedUser,
  isReady: () => isAuthReady,
  
  getTeam: async () => performQuery(async () => await supabase.from('profiles').select('*').eq('organization_id', cachedUser?.organizationId || ''), []),
  
  hasModuleAccess: (module: ModuleType) => {
    const user = cachedUser;
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    
    if (module === 'ADMIN') {
      return user?.role === UserRole.ENTERPRISE_ADMIN;
    }

    // Access Resolution Strategy:
    const effectivePlan = cachedEnterprise?.plan || user?.plan || 'FREE';
    
    // Check Global Plan Matrix
    const planAllowedModules = cachedPlanFeatures?.[effectivePlan] || [];
    const isGloballyAllowed = planAllowedModules.includes(module);

    // If enterprise exists, also check if the specific module is provisioned for this enterprise
    if (cachedEnterprise) {
      const provisionedModules = cachedEnterprise.modules || [];
      return isGloballyAllowed && provisionedModules.includes(module);
    }
    
    return isGloballyAllowed;
  },

  hasFeatureAccess: (module: ModuleType, feature: string) => {
    const user = cachedUser;
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    if (!AuthService.hasModuleAccess(module)) return false;
    
    const effectivePlan = cachedEnterprise?.plan || user?.plan || 'FREE';
    const planSubFeatures = cachedPlanSubFeatures?.[effectivePlan]?.[module] || [];
    return planSubFeatures.includes(feature);
  },

  refreshPlanContext: async () => {
    try {
      const [feats, subs] = await Promise.all([
        supabase.from('plan_features').select('*').eq('id', 'GLOBAL').maybeSingle(),
        supabase.from('plan_sub_features').select('*').eq('id', 'GLOBAL').maybeSingle()
      ]);
      
      if (feats.data) cachedPlanFeatures = feats.data.features;
      if (subs.data) cachedPlanSubFeatures = subs.data.sub_features;

      if (cachedUser?.organizationId) {
        const { data: ent } = await supabase.from('enterprises').select('*').eq('name', cachedUser.organizationId).maybeSingle();
        if (ent) {
          cachedEnterprise = toCamelCase(ent);
          if (cachedUser) {
            cachedUser.plan = cachedEnterprise?.plan || cachedUser.plan;
          }
        }
      }

      window.dispatchEvent(new CustomEvent('ch-plan-updated'));
    } catch (e) {
      console.warn("Plan context refresh failed", e);
    }
  },

  getLicenseUsage: async () => {
    const team = await AuthService.getTeam();
    const limits = cachedEnterprise?.licenses || {};
    return (Object.values(UserRole) as any[]).filter(r => r !== UserRole.SUPER_ADMIN).map(role => ({
      role: role as UserRole,
      used: team.filter(u => u.role === role).length,
      total: (limits as any)[role] || 0
    }));
  },

  resetPassword: async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
  },

  canAddUser: async (role: UserRole) => {
    const usage = await AuthService.getLicenseUsage();
    const stat = usage.find(s => s.role === role);
    return stat ? stat.used < stat.total : false;
  },

  addTeamMember: async (user: User) => {
    const { error } = await supabase.from('profiles').insert([toSnakeCase(user)]);
    if (error) throw error;
  },

  deleteTeamMember: async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
  }
};

export const DataService = {
  getSettings: async () => performQuery(async () => await supabase.from('settings').select('*').eq('id', 'GLOBAL').maybeSingle(), { calcNumberPrefix: 'EST-', nextCalcNumber: 1001 }),
  saveSettings: async (settings: any) => { await supabase.from('settings').upsert({ id: 'GLOBAL', ...toSnakeCase(settings) }); },
  
  getGlobalMetrics: async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    try {
      const [mach, cast, asmb] = await Promise.all([
          supabase.from('machining_calculations').select('status, updated_at, final_price'),
          supabase.from('casting_calculations').select('status, updated_at, final_price'),
          supabase.from('assembly_calculations').select('status, updated_at, final_price')
      ]);

      const all = [...(mach.data || []), ...(cast.data || []), ...(asmb.data || [])];
      
      const createdThisMonth = all.filter(item => new Date(item.updated_at) >= startOfMonth).length;
      const pendingApproval = all.filter(item => item.status === 'PENDING_APPROVAL').length;
      
      const totalSavings = all
          .filter(item => (item.status === 'APPROVED' || item.status === 'FINAL') && item.final_price)
          .reduce((sum, item) => sum + (item.final_price * 0.12), 0);

      return { createdThisMonth, pendingApproval, totalSavings };
    } catch (err) {
      console.error("Metrics sync failed", err);
      return { createdThisMonth: 0, pendingApproval: 0, totalSavings: 0 };
    }
  },

  saveMachining: async (data: MachiningCostSheet) => {
    if (!data.calculationNumber) {
      const settings = await DataService.getSettings();
      data.calculationNumber = `${settings.calcNumberPrefix}${settings.nextCalcNumber}`;
      await DataService.saveSettings({ ...settings, nextCalcNumber: settings.nextCalcNumber + 1 });
    }
    await supabase.from('machining_calculations').upsert({ ...toSnakeCase(data), updated_at: new Date().toISOString() });
    return data;
  },
  getMachining: async () => performQuery(async () => await supabase.from('machining_calculations').select('*').order('updated_at', { ascending: false }), []),
  deleteMachining: async (id: string) => { await supabase.from('machining_calculations').delete().eq('id', id); },

  getMHRs: async () => performQuery(async () => await supabase.from('mhr_calculations').select('*'), []),
  saveMHR: async (data: MHRCalculation) => { await supabase.from('mhr_calculations').upsert(toSnakeCase(data)); },

  getCustomers: async () => performQuery(async () => await supabase.from('master_customers').select('*'), []),
  saveCustomer: async (cust: Customer) => { await supabase.from('master_customers').upsert(toSnakeCase(cust)); },

  getCasting: async () => performQuery(async () => await supabase.from('casting_calculations').select('*').order('updated_at', { ascending: false }), []),
  saveCasting: async (data: CastingCostSheet) => { 
    await supabase.from('casting_calculations').upsert({ ...toSnakeCase(data), updated_at: new Date().toISOString() });
    return data;
  },

  getAssembly: async () => performQuery(async () => await supabase.from('assembly_calculations').select('*').order('updated_at', { ascending: false }), []),
  saveAssembly: async (data: AssemblyCostSheet) => { 
    await supabase.from('assembly_calculations').upsert({ ...toSnakeCase(data), updated_at: new Date().toISOString() });
    return data;
  },

  generateXMLBackup: async () => {
    const [machining, mhr, casting, assembly] = await Promise.all([
        DataService.getMachining(),
        DataService.getMHRs(),
        DataService.getCasting(),
        DataService.getAssembly()
    ]);
    return `<backup timestamp="${new Date().toISOString()}">
      <machining>${JSON.stringify(machining)}</machining>
      <mhr>${JSON.stringify(mhr)}</mhr>
      <casting>${JSON.stringify(casting)}</casting>
      <assembly>${JSON.stringify(assembly)}</assembly>
    </backup>`;
  },

  getMaterials: async () => performQuery(async () => await supabase.from('master_materials').select('*'), []),
  saveMaterial: async (mat: MachiningMaterial) => { await supabase.from('master_materials').upsert(toSnakeCase(mat)); },
  deleteMaterial: async (id: string) => { await supabase.from('master_materials').delete().eq('id', id); },
  importMaterials: async (data: any[]) => { await supabase.from('master_materials').upsert(toSnakeCase(data)); },
  
  getTools: async () => performQuery(async () => await supabase.from('master_tools').select('*'), []),
  saveTool: async (t: Tool) => { await supabase.from('master_tools').upsert(toSnakeCase(t)); },
  deleteTool: async (id: string) => { await supabase.from('master_tools').delete().eq('id', id); },
  importTools: async (data: any[]) => { await supabase.from('master_tools').upsert(toSnakeCase(data)); },
  
  getMachines: async () => performQuery(async () => await supabase.from('master_machines').select('*'), []),
  saveMachine: async (m: Machine) => { await supabase.from('master_machines').upsert(toSnakeCase(m)); },
  deleteMachine: async (id: string) => { await supabase.from('master_machines').delete().eq('id', id); },
  importMachines: async (data: any[]) => { await supabase.from('master_machines').upsert(toSnakeCase(data)); },

  getProcesses: async () => performQuery(async () => await supabase.from('master_processes').select('*'), []),
  saveProcess: async (p: Process) => { await supabase.from('master_processes').upsert(toSnakeCase(p)); },
  deleteProcess: async (id: string) => { await supabase.from('master_processes').delete().eq('id', id); },

  getCostProfiles: async () => performQuery(async () => await supabase.from('master_cost_profiles').select('*'), []),
  saveCostProfile: async (p: CostProfile) => { await supabase.from('master_cost_profiles').upsert(toSnakeCase(p)); },
  deleteCostProfile: async (id: string) => { await supabase.from('master_cost_profiles').delete().eq('id', id); },

  getCastingGrades: async () => performQuery(async () => await supabase.from('master_casting_grades').select('*'), []),
  saveCastingGrade: async (data: CastingGrade) => { await supabase.from('master_casting_grades').upsert(toSnakeCase(data)); },
  getMouldingBoxes: async () => performQuery(async () => await supabase.from('master_moulding_boxes').select('*'), []),
  saveMouldingBox: async (data: MouldingBox) => { await supabase.from('master_moulding_boxes').upsert(toSnakeCase(data)); },
  getMeltingFurnaces: async () => performQuery(async () => await supabase.from('master_melting_furnaces').select('*'), []),
  saveMeltingFurnace: async (data: MeltingFurnace) => { await supabase.from('master_melting_furnaces').upsert(toSnakeCase(data)); },
  getFettlingProcesses: async () => performQuery(async () => await supabase.from('master_fettling_processes').select('*'), []),
  saveFettlingProcess: async (item: FettlingProcess) => { await supabase.from('master_fettling_processes').upsert(toSnakeCase(item)); },
  getFoundryConsumables: async () => performQuery(async () => await supabase.from('foundry_consumables').select('*').eq('id', 'GLOBAL').maybeSingle(), { sandCostPerKg: 0.05, binderCostPerKg: 0.50, energyCostPerKwh: 0.12, laborRatePerHr: 15 }),
  saveFoundryConsumables: async (data: FoundryConsumables) => { await supabase.from('foundry_consumables').upsert({ id: 'GLOBAL', ...toSnakeCase(data) }); },
  getCastingElements: async () => performQuery(async () => await supabase.from('master_casting_elements').select('*'), []),
  saveCastingElement: async (item: ChemicalElement) => { await supabase.from('master_casting_elements').upsert(toSnakeCase(item)); },

  getAssemblyMasters: async (type: string) => {
    const table = type === 'BOM' ? 'master_assembly_bom' : type === 'LABOR' ? 'master_assembly_labor' : 'master_assembly_overheads';
    return performQuery(async () => await supabase.from(table).select('*'), []);
  },
  saveAssemblyMaster: async (type: string, item: any) => {
    const table = type === 'BOM' ? 'master_assembly_bom' : type === 'LABOR' ? 'master_assembly_labor' : 'master_assembly_overheads';
    await supabase.from(table).upsert(toSnakeCase(item));
  },

  saveFeedback: async (fb: UserFeedback) => { await supabase.from('user_feedback').insert([toSnakeCase(fb)]); },
  getFeedbacks: async () => performQuery(async () => await supabase.from('user_feedback').select('*').order('created_at', { ascending: false }), []),

  saveChatMessage: async (msg: ChatMessage, userId: string) => { await supabase.from('chat_history').upsert({ id: msg.id, user_id: userId, role: msg.role, text: msg.text, timestamp: msg.timestamp.toISOString() }); },
  getChatHistory: async (userId: string) => {
    const data = await performQuery(async () => await supabase.from('chat_history').select('*').eq('user_id', userId).order('timestamp', { ascending: true }), []);
    return (data || []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  },
  clearChatHistory: async (userId: string) => { await supabase.from('chat_history').delete().eq('user_id', userId); }
};

export const EnterpriseService = {
  getEnterprises: async () => performQuery(async () => await supabase.from('enterprises').select('*'), []),
  updateEnterprise: async (ent: Enterprise) => { await supabase.from('enterprises').update(toSnakeCase(ent)).eq('id', ent.id); },
  getCurrentEnterprise: async () => cachedEnterprise,
  createEnterprise: async (name: string, adminName: string, adminEmail: string, plan: string, domain: string, modules: string[], licenses: any, maxCalculations: number) => {
    const ent = {
      id: `ent-${Date.now()}`,
      name, domain, plan, adminEmail,
      approvalRequired: false,
      approvalRules: [],
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
      maxCalculations,
      modules,
      licenses,
      createdAt: new Date()
    };
    await supabase.from('enterprises').insert([toSnakeCase(ent)]);
    return ent;
  },
};

export const PlanService = {
  getPlanFeatures: async () => {
    const { data } = await supabase.from('plan_features').select('*').eq('id', 'GLOBAL').maybeSingle();
    return data?.features || {};
  },
  getPlanSubFeatures: async () => {
    const { data } = await supabase.from('plan_sub_features').select('*').eq('id', 'GLOBAL').maybeSingle();
    return data?.sub_features || {};
  },
  savePlanFeatures: async (features: any) => { await supabase.from('plan_features').upsert({ id: 'GLOBAL', features }); },
  savePlanSubFeatures: async (subFeatures: any) => { await supabase.from('plan_sub_features').upsert({ id: 'GLOBAL', sub_features: subFeatures }); }
};
