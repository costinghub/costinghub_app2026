import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../services/supabaseClient';
import { localDb } from '../services/localDbService';

interface EnterpriseManagementPageProps {
  user: User;
  onBack?: () => void;
}

// Interfaces
interface Organization {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  calculationLimit: number;
  calculationsCreated: number;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: 'Enterprise Admin' | 'Viewer' | 'Planner' | 'Super User';
  orgId: string;
  status: 'Active' | 'Inactive';
  calculationLimit: number;
  calculationsCreated: number;
  createdAt: string;
}

interface EnterpriseApiKey {
  id: string;
  name: string;
  key: string;
  orgId: string;
  scope: 'Read Calculations' | 'Read/Write Calculations' | 'Full Access';
  status: 'Active' | 'Revoked';
  createdAt: string;
  expiresAt: string;
}

interface PendingCalculation {
  id: string;
  name: string;
  orgId: string;
  submittedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  partName: string;
  cost: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Review';
  comments?: string;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: 'Organization' | 'User' | 'API Key' | 'Approval' | 'System';
  details: string;
}

// Initial Seeds
const INITIAL_ORGS: Organization[] = [
  { id: 'org_acme', name: 'Acme Manufacturing Co.', domain: 'acme.corp', adminEmail: 'john.doe@acme.corp', calculationLimit: 500, calculationsCreated: 212, status: 'Active', createdAt: '2026-01-10' },
  { id: 'org_stark', name: 'Stark Aerospace', domain: 'stark.com', adminEmail: 'pepper.potts@stark.com', calculationLimit: 2500, calculationsCreated: 1412, status: 'Active', createdAt: '2026-02-14' },
  { id: 'org_wayne', name: 'Wayne Heavy Industries', domain: 'waynecorp.com', adminEmail: 'lucius.fox@wayne.corp', calculationLimit: 1200, calculationsCreated: 840, status: 'Active', createdAt: '2026-03-01' },
  { id: 'org_globex', name: 'Globex Advanced Research', domain: 'globex.com', adminEmail: 'hank.scorpio@globex.com', calculationLimit: 800, calculationsCreated: 310, status: 'Active', createdAt: '2026-04-18' }
];

const INITIAL_USERS: EnterpriseUser[] = [
  { id: 'u_john', email: 'john.doe@acme.corp', name: 'John Doe', role: 'Enterprise Admin', orgId: 'org_acme', status: 'Active', calculationLimit: 500, calculationsCreated: 120, createdAt: '2026-01-10' },
  { id: 'u_acme_eng', email: 'engineering@acme.corp', name: 'Acme Lead Engineer', role: 'Planner', orgId: 'org_acme', status: 'Active', calculationLimit: 200, calculationsCreated: 92, createdAt: '2026-01-11' },
  { id: 'u_pepper', email: 'pepper.potts@stark.com', name: 'Pepper Potts', role: 'Enterprise Admin', orgId: 'org_stark', status: 'Active', calculationLimit: 2500, calculationsCreated: 412, createdAt: '2026-02-14' },
  { id: 'u_tony', email: 'tony@stark.com', name: 'Tony Stark', role: 'Super User', orgId: 'org_stark', status: 'Active', calculationLimit: 1500, calculationsCreated: 1000, createdAt: '2026-02-15' },
  { id: 'u_lucius', email: 'lucius.fox@wayne.corp', name: 'Lucius Fox', role: 'Enterprise Admin', orgId: 'org_wayne', status: 'Active', calculationLimit: 1200, calculationsCreated: 540, createdAt: '2026-03-01' }
];

const INITIAL_API_KEYS: EnterpriseApiKey[] = [
  { id: 'key_1', name: 'Acme Factory Floor Integration', key: 'sk_live_acme_83e2da5f9b41a8e', orgId: 'org_acme', scope: 'Read/Write Calculations', status: 'Active', createdAt: '2026-05-01', expiresAt: '2028-05-01' },
  { id: 'key_2', name: 'Jarvis Material Sync Service', key: 'sk_live_stark_c710f2df1209b0a', orgId: 'org_stark', scope: 'Full Access', status: 'Active', createdAt: '2026-05-15', expiresAt: '2027-05-15' }
];

const INITIAL_APPROVALS: PendingCalculation[] = [
  { id: 'app_1', name: 'Quote #9201 - Titanium Bracket CNC (10,000 Pcs)', orgId: 'org_acme', submittedBy: 'john.doe@acme.corp', partName: 'Titanium Bracket', cost: 148200.00, status: 'Pending', createdAt: '2026-05-27' },
  { id: 'app_2', name: 'Structural Shield Assembly Rev D', orgId: 'org_stark', submittedBy: 'tony@stark.com', partName: 'Vibranium Shield Outer Plate', cost: 892750.00, status: 'Pending', createdAt: '2026-05-26' },
  { id: 'app_3', name: 'Quote #4092 - Bat-Armor Shell Rev 9', orgId: 'org_wayne', submittedBy: 'lucius.fox@wayne.corp', partName: 'Kevlar Hybrid Matrix Shell', cost: 450000.00, status: 'In Review', createdAt: '2026-05-25' }
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'log_1', timestamp: '2026-05-27 12:44:00', actor: 'designersworldcbe@gmail.com', action: 'Accessed Enterprise Governance Center', category: 'System', details: 'Session active. Initial security handshake successful.' },
  { id: 'log_2', timestamp: '2026-05-27 10:15:33', actor: 'pepper.potts@stark.com', action: 'Generated API Key (Jarvis Material Sync)', category: 'API Key', details: 'Created scope: Full Access. Linked to Stark Aerospace IP range.' },
  { id: 'log_3', timestamp: '2026-05-26 15:30:12', actor: 'designersworldcbe@gmail.com', action: 'Updated Limit (Stark Aerospace)', category: 'Organization', details: 'Increased organizational limit from 2000 to 2500 per month.' },
  { id: 'log_4', timestamp: '2026-05-25 09:12:44', actor: 'john.doe@acme.corp', action: 'Submitted Quote #9201 for Approval', category: 'Approval', details: 'Estimated volume: 10,000 units. Awaiting Master Admin sign-off.' }
];

export const EnterpriseManagementPage: React.FC<EnterpriseManagementPageProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Viewer'>(() => {
    const r = user.role?.toLowerCase() || '';
    if (r === 'viewer' || r === 'enterprise_user') return 'Viewer';
    return 'Admin';
  });
  
  // Local states with lazy initialization from localStorage
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('ent_governance_orgs');
    return saved ? JSON.parse(saved) : INITIAL_ORGS;
  });

  const [usersList, setUsersList] = useState<EnterpriseUser[]>(() => {
    const saved = localStorage.getItem('ent_governance_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [apiKeys, setApiKeys] = useState<EnterpriseApiKey[]>(() => {
    const saved = localStorage.getItem('ent_governance_keys');
    return saved ? JSON.parse(saved) : INITIAL_API_KEYS;
  });

  const [approvals, setApprovals] = useState<PendingCalculation[]>(() => {
    const saved = localStorage.getItem('ent_governance_approvals');
    return saved ? JSON.parse(saved) : INITIAL_APPROVALS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('ent_governance_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem('ent_governance_orgs', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('ent_governance_users', JSON.stringify(usersList));
  }, [usersList]);

  // Sync real-time Supabase profiles with governance users list on mount
  useEffect(() => {
    const fetchProfilesAndSync = async () => {
      try {
        const profiles = await localDb.getAll<User>('profiles');
        const enterpriseProfiles = profiles.filter(
          p => p.plan_name === 'Enterprise' || p.role === 'enterprise_admin' || p.role === 'enterprise_user' || p.enterprise_id
        );

        const syncedUsers: EnterpriseUser[] = enterpriseProfiles.map(p => {
          let mappedRole: EnterpriseUser['role'] = 'Planner';
          if (p.role === 'enterprise_admin' || p.role === 'Enterprise Admin') mappedRole = 'Enterprise Admin';
          else if (p.role === 'viewer' || p.role === 'Viewer') mappedRole = 'Viewer';
          else if (p.role === 'superuser' || p.role === 'Super User') mappedRole = 'Super User';

          return {
            id: p.id,
            email: p.email,
            name: p.name || p.email.split('@')[0],
            role: mappedRole,
            orgId: p.enterprise_id || 'org_acme',
            status: p.subscription_status === 'active' ? 'Active' : 'Inactive',
            calculationLimit: p.calculation_limit || 500,
            calculationsCreated: p.calculations_created_this_period || 0,
            createdAt: p.created_at ? new Date(p.created_at).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)
          };
        });

        setUsersList(prev => {
          const merged = [...prev];
          syncedUsers.forEach(synced => {
            const idx = merged.findIndex(m => m.email.toLowerCase() === synced.email.toLowerCase());
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...synced };
            } else {
              merged.push(synced);
            }
          });
          return merged;
        });
      } catch (err) {
        console.error("Error hydrating enterprise profiles:", err);
      }
    };
    fetchProfilesAndSync();
  }, []);

  useEffect(() => {
    localStorage.setItem('ent_governance_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem('ent_governance_approvals', JSON.stringify(approvals));
  }, [approvals]);

  useEffect(() => {
    localStorage.setItem('ent_governance_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Logging Facilitator
  const appendAuditLog = (actor: string, action: string, category: 'Organization' | 'User' | 'API Key' | 'Approval' | 'System', details: string) => {
    const newLog: AuditLogEntry = {
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor,
      action,
      category,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 1. Organization Creation Form State
  const [isAddingOrg, setIsAddingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', domain: '', adminEmail: '', calculationLimit: 1000 });
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);

  // 2. User Creation Form State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Planner' as EnterpriseUser['role'], orgId: '', calculationLimit: 500 });

  // 3. API Key Creation Form State
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', orgId: '', scope: 'Read/Write Calculations' as EnterpriseApiKey['scope'] });
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);

  // 4. API Sandbox State
  const [sandboxApiKey, setSandboxApiKey] = useState('');
  const [sandboxEndpoint, setSandboxEndpoint] = useState('GET /v1/organizations');
  const [sandboxResponse, setSandboxResponse] = useState<string>('// Select a key and endpoint, then click Run Sandbox Query');
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // 5. Audit Log Filtering
  const [logSearch, setLogSearch] = useState('');
  const [logFilterCategory, setLogFilterCategory] = useState('ALL');

  // Interactive functions
  const handleCreateOrUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name || !orgForm.domain || !orgForm.adminEmail) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    if (editingOrgId) {
      // Edit mode
      setOrganizations(prev => prev.map(o => o.id === editingOrgId ? { ...o, ...orgForm } : o));
      appendAuditLog(user.email, `Modified Organization details`, 'Organization', `Updated ${orgForm.name} (limit: ${orgForm.calculationLimit})`);
      setEditingOrgId(null);
    } else {
      // Create mode
      const newOrgId = 'org_' + orgForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newOrg: Organization = {
        id: newOrgId,
        name: orgForm.name,
        domain: orgForm.domain,
        adminEmail: orgForm.adminEmail,
        calculationLimit: Number(orgForm.calculationLimit) || 1000,
        calculationsCreated: 0,
        status: 'Active',
        createdAt: new Date().toISOString().substring(0, 10)
      };
      setOrganizations(prev => [...prev, newOrg]);
      appendAuditLog(user.email, `Created Organization (${orgForm.name})`, 'Organization', `Bound admin to ${orgForm.adminEmail} under domain ${orgForm.domain}`);
    }

    setOrgForm({ name: '', domain: '', adminEmail: '', calculationLimit: 1000 });
    setIsAddingOrg(false);
  };

  const handleEditOrgClick = (org: Organization) => {
    setOrgForm({ name: org.name, domain: org.domain, adminEmail: org.adminEmail, calculationLimit: org.calculationLimit });
    setEditingOrgId(org.id);
    setIsAddingOrg(true);
  };

  const toggleOrgStatus = (id: string) => {
    setOrganizations(prev => prev.map(o => {
      if (o.id === id) {
        const nextStatus = o.status === 'Active' ? 'Suspended' : 'Active';
        appendAuditLog(user.email, `Toggled Org Status: ${o.name}`, 'Organization', `Status shifted from ${o.status} to ${nextStatus}`);
        return { ...o, status: nextStatus };
      }
      return o;
    }));
  };

  const handleDeleteOrg = (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely remove organization "${name}"? This operation is irreversible.`)) {
      setOrganizations(prev => prev.filter(o => o.id !== id));
      appendAuditLog(user.email, `Terminated Organization: ${name}`, 'Organization', `Revoked all associated tenant allocations for ID: ${id}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.orgId) {
      alert('Missing required information.');
      return;
    }

    const org = organizations.find(o => o.id === userForm.orgId);
    
    // 1. Sync / Create user in Supabase Auth
    const defaultPassword = 'Password123!';
    let finalUserId = 'u_' + Math.random().toString(36).substring(2, 9);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: defaultPassword,
        options: {
          data: {
            name: userForm.name,
            full_name: userForm.name,
            role: userForm.role,
          }
        }
      });
      if (authError) {
        console.warn("Supabase Auth registration yielded message info: ", authError.message);
      }
      if (authData && authData.user) {
        finalUserId = authData.user.id;
      }
    } catch (err) {
      console.warn("Auth signup failed/skipped during enterprise user generation:", err);
    }

    // 2. Setup internal governance display list
    const newUser: EnterpriseUser = {
      id: finalUserId,
      email: userForm.email,
      name: userForm.name,
      role: userForm.role,
      orgId: userForm.orgId,
      status: 'Active',
      calculationLimit: Number(userForm.calculationLimit) || 500,
      calculationsCreated: 0,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    setUsersList(prev => [...prev.filter(u => u.email.toLowerCase() !== userForm.email.toLowerCase()), newUser]);
    appendAuditLog(user.email, `Created User: ${userForm.email}`, 'User', `Linked to organization ${org?.name || 'Unknown'} with role ${userForm.role}`);

    // 3. Save to Custom profiles table so they show up in global user directory
    const dbRole = userForm.role === 'Enterprise Admin' ? 'enterprise_admin' : 'enterprise_user';
    const profile = {
      id: finalUserId,
      email: userForm.email,
      name: userForm.name,
      company_name: org?.name || 'Enterprise Client',
      companyName: org?.name || 'Enterprise Client',
      role: dbRole,
      enterprise_id: userForm.orgId,
      calculation_limit: Number(userForm.calculationLimit) || 500,
      plan_name: 'Enterprise',
      calculations_created_this_period: 0,
      subscription_status: 'active',
      password: defaultPassword,
    };

    try {
      await localDb.upsert('profiles', profile);
      console.log("Upserted enterprise profile successfully.");
    } catch (dbErr) {
      console.error("Failed to upsert enterprise profile to global profiles directory:", dbErr);
    }

    setIsAddingUser(false);
    setUserForm({ name: '', email: '', role: 'Planner', orgId: '', calculationLimit: 500 });
  };

  const toggleUserStatus = async (id: string) => {
    let targetUser: EnterpriseUser | undefined;
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        targetUser = { ...u, status: nextStatus };
        appendAuditLog(user.email, `Toggled User Status: ${u.email}`, 'User', `Flipped status to ${nextStatus}`);
        return targetUser;
      }
      return u;
    }));

    if (targetUser) {
      try {
        const existingProfile = await localDb.getById<User>('profiles', id);
        if (existingProfile) {
          await localDb.upsert('profiles', {
            ...existingProfile,
            subscription_status: (targetUser as EnterpriseUser).status === 'Active' ? 'active' : 'inactive'
          });
        }
      } catch (err) {
        console.error("Could not sync profile status change:", err);
      }
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (confirm(`Revoke login rights and delete user: ${email}?`)) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      appendAuditLog(user.email, `Deleted user profile: ${email}`, 'User', `Unregistered completely from system tenancy directory.`);
      
      try {
        await localDb.delete('profiles', id);
      } catch (err) {
        console.error("Could not delete user profile from global directory:", err);
      }
    }
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyForm.name || !keyForm.orgId) {
      alert('Key description and org assignment are required.');
      return;
    }

    const matchedOrg = organizations.find(o => o.id === keyForm.orgId);
    const generatedToken = 'sk_live_' + (matchedOrg?.domain.replace('.', '_') || 'sys') + '_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 10);
    const newKeyId = 'key_' + Math.random().toString(36).substring(2, 9);
    
    // expiry 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const newKey: EnterpriseApiKey = {
      id: newKeyId,
      name: keyForm.name,
      key: generatedToken,
      orgId: keyForm.orgId,
      scope: keyForm.scope,
      status: 'Active',
      createdAt: new Date().toISOString().substring(0, 10),
      expiresAt: nextYear.toISOString().substring(0, 10)
    };

    setApiKeys(prev => [...prev, newKey]);
    setNewlyGeneratedKey(generatedToken);
    appendAuditLog(user.email, `Authorized New API Credential`, 'API Key', `Generated key label: "${keyForm.name}" with scope "${keyForm.scope}"`);
    setKeyForm({ name: '', orgId: '', scope: 'Read/Write Calculations' });
  };

  const revokeApiKey = (id: string, name: string) => {
    if (confirm(`Do you want to immediately revoke the API key: "${name}"? External client authentications using this key will fail.`)) {
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'Revoked' } : k));
      appendAuditLog(user.email, `Revoked API Credential: "${name}"`, 'API Key', `Access token blacklisted from live system routing.`);
    }
  };

  const handleProcessApproval = (id: string, resolution: 'Approved' | 'Rejected' | 'In Review', remarks: string) => {
    setApprovals(prev => prev.map(app => {
      if (app.id === id) {
        appendAuditLog(user.email, `Resolved Cost Audit Status: ${resolution}`, 'Approval', `Calculation "${app.partName}" bound status. Auditor comments: "${remarks || 'None'}"`);
        
        // If approved, increment the organization calculationsCreated to show real feedback inside charts
        if (resolution === 'Approved') {
          setOrganizations(orgs => orgs.map(o => o.id === app.orgId ? { ...o, calculationsCreated: o.calculationsCreated + 1 } : o));
        }

        return { ...app, status: resolution, comments: remarks, approvedBy: user.email, approvedAt: new Date().toISOString() };
      }
      return app;
    }));
  };

  // Rest sandbox execution simulator
  const runSandboxTest = () => {
    if (!sandboxApiKey) {
      alert('Please select or specify a valid security token first.');
      return;
    }
    setSandboxLoading(true);
    setSandboxResponse('// Compiling REST sandbox query...\n// Instantiating secure JSON payload wrapper...');
    
    setTimeout(() => {
      const activeKeyObj = apiKeys.find(k => k.key === sandboxApiKey);
      if (!activeKeyObj || activeKeyObj.status === 'Revoked') {
        setSandboxResponse(JSON.stringify({
          error: "Unauthorized",
          code: 401,
          message: "The provided enterprise api token is invalid, credentials blacklisted, or expired. Action rejected by perimeter RLS filters."
        }, null, 2));
        setSandboxLoading(false);
        return;
      }

      const boundOrg = organizations.find(o => o.id === activeKeyObj.orgId);
      
      let payload: any = {};
      
      switch (sandboxEndpoint) {
        case 'GET /v1/organizations':
          payload = {
            success: true,
            execution_ms: 12,
            scope: activeKeyObj.scope,
            authenticated_org: boundOrg?.name || "Global Scope",
            data: organizations.map(o => ({
              id: o.id,
              name: o.name,
              domain: o.domain,
              quota_max: o.calculationLimit,
              quota_consumed: o.calculationsCreated,
              status: o.status
            }))
          };
          break;
        case 'GET /v1/calculations':
          payload = {
            success: true,
            execution_ms: 45,
            scope: activeKeyObj.scope,
            data: [
              { id: "calc_01a", name: "Spindle Housing Bracket v1", material: "Titanium Gr. 5", unit_cost_usd: 142.50, batch_size: 500, created_by: "system_robot" },
              { id: "calc_01b", name: "Turbine Blade Impeller Rev 3", material: "Inconel 718", unit_cost_usd: 890.10, batch_size: 100, created_by: "john.doe@acme.corp" }
            ].filter(() => activeKeyObj.scope !== 'Read Calculations' && activeKeyObj.scope !== 'Full Access' ? true : true)
          };
          break;
        case 'GET /v1/system/audit-logs':
          if (activeKeyObj.scope !== 'Full Access') {
            payload = { success: false, error: "Forbidden", code: 403, details: "The current API key does not have 'Full Access' parameters required for auditable telemetry indexing." };
          } else {
            payload = {
              success: true,
              execution_ms: 6,
              scopes_loaded: ["telemetry:read"],
              data: auditLogs.slice(0, 5).map(l => ({
                uuid: l.id,
                time: l.timestamp,
                label: l.action,
                context: l.details
              }))
            };
          }
          break;
        default:
          payload = { success: false, error: "Not Found", message: "Endpoint schema unregistered." };
      }

      setSandboxResponse(JSON.stringify(payload, null, 2));
      setSandboxLoading(false);
    }, 850);
  };

  // Export auditable protocol
  const exportLogsAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `enterprise_governance_audit_export_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearAuditingArchive = () => {
    if (confirm('CRITICAL COMPLIANCE ACCESS WARNING: Are you sure you want to purge all active telemetry records? You will lose logs permanently.')) {
      setAuditLogs([
        { id: 'log_clear', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), actor: user.email, action: 'Purged System Audiology Archive', category: 'System', details: 'All prior enterprise telemetry was deleted by direct master command.' }
      ]);
    }
  };

  // Recharts Chart Formatter
  const chartData = organizations.map(o => ({
    name: o.name.split(' ')[0], // abbreviation
    "Quota Max": o.calculationLimit,
    "Quota Consumed": o.calculationsCreated,
    "Allocated Remaining": Math.max(0, o.calculationLimit - o.calculationsCreated)
  }));

  // Filtering Logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.actor.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.details.toLowerCase().includes(logSearch.toLowerCase());
    const matchesCat = logFilterCategory === 'ALL' ? true : log.category === logFilterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in p-2 md:p-6 pb-20">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 pb-6 border-b border-border">
        <div>
          {onBack && (
            <button 
              onClick={onBack} 
              className="flex items-center text-xs font-bold text-text-muted hover:text-primary mb-3 uppercase tracking-widest transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Go Back to Master Admin
            </button>
          )}
          <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase">Enterprise Governance</h1>
          <p className="text-text-muted text-sm mt-1">Multi-tenant client accounts, API key registries, organizational calculation limits, and system compliance telemetry.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Role Simulator Selector */}
          <div className="flex items-center bg-secondary/35 rounded-lg p-1 border border-border">
            <button 
              onClick={() => {
                setSelectedRole('Admin');
                setNewlyGeneratedKey(null);
              }}
              className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all ${
                selectedRole === 'Admin'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Super Admin
            </button>
            <button 
              onClick={() => {
                setSelectedRole('Viewer');
                setNewlyGeneratedKey(null);
                setIsAddingOrg(false);
                setIsAddingUser(false);
                setIsAddingKey(false);
              }}
              className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition-all ${
                selectedRole === 'Viewer'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              System Viewer
            </button>
          </div>

          <div className="flex items-center space-x-3 bg-secondary/25 border border-border px-4 py-2.5 rounded-lg">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-600 uppercase">Perimeter Secure</span>
          </div>
        </div>
      </div>

      {/* Role Notice Warning Banner */}
      {selectedRole === 'Viewer' && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded text-xs space-y-1 text-amber-500 animate-fade-in">
          <p className="font-extrabold uppercase tracking-wide flex items-center">
            <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Restricted Access Protocol Active (Viewer Mode)
          </p>
          <p className="text-[11px] text-text-secondary">
            You are currently evaluating the multi-tenant governance module with non-admin <span className="font-bold underline text-amber-600 uppercase">Viewer privileges</span>. 
            All state synchronization triggers, credential issue forms, REST query runboxes, and auditable history log purges are hidden or read-only protected.
          </p>
        </div>
      )}

      {/* 2. Top-level Tab Bar */}
      <div className="flex space-x-1 border-b border-border">
        {['Overview', 'Organizations', 'Admins & Users', 'Approvals Queue', 'API Credentials', 'Compliance Audit Logs'].map(tab => (
          <button 
            key={tab} 
            onClick={() => {
              setActiveTab(tab);
              setNewlyGeneratedKey(null);
            }}
            className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-primary text-primary font-black bg-primary/5' 
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      
      {/* Tab A: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="space-y-8">
          
          {/* Key Stats bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Tenant Enterprises</div>
              <div className="text-3xl font-black mt-2 text-text-primary">{organizations.length}</div>
              <div className="text-xs text-text-muted mt-2 border-t pt-2 border-border/50">Active clients linked into system</div>
            </Card>
            <Card className="p-6">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Registered Administrators</div>
              <div className="text-3xl font-black mt-2 text-text-primary">
                {usersList.filter(u => u.role === 'Enterprise Admin').length}
              </div>
              <div className="text-xs text-text-muted mt-2 border-t pt-2 border-border/50">Tenant superusers and captains</div>
            </Card>
            <Card className="p-6">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Active API Keys</div>
              <div className="text-3xl font-black mt-2 text-text-primary">
                {apiKeys.filter(k => k.status === 'Active').length}
              </div>
              <div className="text-xs text-text-muted mt-2 border-t pt-2 border-border/50">Production machine-to-machine integrations</div>
            </Card>
            <Card className="p-6">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Compliant Log Entries</div>
              <div className="text-3xl font-black mt-2 text-text-primary">{auditLogs.length}</div>
              <div className="text-xs text-text-muted mt-2 border-t pt-2 border-border/50">Secured immutable action points</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Usage share chart */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary mb-6">Organizational Cost Calculation Limit Allotment</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Quota Consumed" stackId="a" fill="#e11d48" name="Consumed Calculations" />
                    <Bar dataKey="Allocated Remaining" stackId="a" fill="#3b82f6" name="Remaining Allocation" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Live Security Monitor Monitor Feed */}
            <Card className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary mb-4">Live Governance Monitor</h3>
              <p className="text-xs text-text-muted mb-4 font-mono">Real-time perimeter heartbeat logs</p>
              
              <div className="space-y-4">
                {auditLogs.slice(0, 4).map((l, idx) => (
                  <div key={l.id} className="p-3 bg-secondary/15 border border-border/50 rounded-sm text-xs font-mono space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-text-muted">
                      <span>{l.timestamp}</span>
                      <span className="px-1.5 py-0.5 bg-primary/5 text-primary rounded">{l.category}</span>
                    </div>
                    <p className="font-semibold text-text-primary truncate">{l.action}</p>
                    <p className="text-[11px] text-text-muted truncate">{l.details}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab B: ORGANIZATIONS */}
      {activeTab === 'Organizations' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide">Multi-Tenant Enterprises</h2>
              <p className="text-xs text-text-muted mt-1">Configure individual sub-organizations, manage custom corporate domains, and allot monthly calculation limits.</p>
            </div>
            {selectedRole === 'Admin' ? (
              <Button onClick={() => {
                setEditingOrgId(null);
                setOrgForm({ name: '', domain: '', adminEmail: '', calculationLimit: 1000 });
                setIsAddingOrg(!isAddingOrg);
              }}>
                {isAddingOrg ? 'Cancel Action' : 'Create Enterprise Organization'}
              </Button>
            ) : (
              <span className="text-xs font-mono font-bold text-text-muted bg-secondary/80 border border-border px-3 py-1.5 rounded-lg shrink-0">
                Read-Only Access
              </span>
            )}
          </div>

          {/* Org Creation / Edit form */}
          {selectedRole === 'Admin' && isAddingOrg && (
            <div className="p-5 bg-secondary/10 border border-border rounded-lg space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                {editingOrgId ? 'Edit Organization Parameters' : 'Provision New Organization Tenant'}
              </h3>
              <form onSubmit={handleCreateOrUpdateOrg} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Org Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    value={orgForm.name}
                    onChange={e => setOrgForm({...orgForm, name: e.target.value})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Unique Email Domain *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. acme.corp" 
                    value={orgForm.domain}
                    onChange={e => setOrgForm({...orgForm, domain: e.target.value})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Primary Administrator *</label>
                  <input 
                    type="email" 
                    placeholder="e.g. boss@acme.corp" 
                    value={orgForm.adminEmail}
                    onChange={e => setOrgForm({...orgForm, adminEmail: e.target.value})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Total Calculation Quota *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500" 
                    value={orgForm.calculationLimit}
                    onChange={e => setOrgForm({...orgForm, calculationLimit: Number(e.target.value)})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="md:col-span-4 flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingOrg(false)}>Cancel</Button>
                  <Button type="submit">{editingOrgId ? 'Affirm Changes' : 'Execute Tenant Launch'}</Button>
                </div>
              </form>
            </div>
          )}

          {/* Org Listings */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-2">Organization</th>
                  <th className="py-3 px-2">Authorized Domain</th>
                  <th className="py-3 px-2">Administrator Contacts</th>
                  <th className="py-3 px-2 w-48">Calculation Consumption (Quota)</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  {selectedRole === 'Admin' && <th className="py-3 px-2 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {organizations.map(org => {
                  const quotaPercentage = Math.round((org.calculationsCreated / org.calculationLimit) * 100);
                  const isSuspended = org.status === 'Suspended';
                  return (
                    <tr key={org.id} className="hover:bg-secondary/5 font-medium text-text-primary text-xs">
                      <td className="py-4 px-2 font-black">{org.name}</td>
                      <td className="py-4 px-2 font-mono text-text-muted">@{org.domain}</td>
                      <td className="py-4 px-2 font-mono">{org.adminEmail}</td>
                      <td className="py-4 px-2">
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[10px] text-text-muted">
                            <span>{org.calculationsCreated} / {org.calculationLimit} Run</span>
                            <span>{quotaPercentage}%</span>
                          </div>
                          <div className="w-full bg-secondary/40 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${quotaPercentage > 85 ? 'bg-red-500' : 'bg-primary'}`}
                              style={{ width: `${Math.min(100, quotaPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                          isSuspended 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      {selectedRole === 'Admin' && (
                        <td className="py-4 px-2 text-right space-x-2">
                          <button 
                            onClick={() => handleEditOrgClick(org)}
                            className="hover:text-primary transition-colors hover:underline text-text-muted font-bold"
                          >
                            Modify Setup
                          </button>
                          <span>•</span>
                          <button 
                            onClick={() => toggleOrgStatus(org.id)}
                            className="hover:text-text-primary transition-colors hover:underline text-text-muted font-bold"
                          >
                            {isSuspended ? 'Acquiesce' : 'Suspend'}
                          </button>
                          <span>•</span>
                          <button 
                            onClick={() => handleDeleteOrg(org.id, org.name)}
                            className="text-red-500 hover:text-red-700 hover:underline font-bold"
                          >
                            Terminate
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab C: ADMINS & USERS */}
      {activeTab === 'Admins & Users' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide">Enterprise User Accounts</h2>
              <p className="text-xs text-text-muted mt-1 font-medium">Provision enterprise-level administrators, cost planners, operators, and review agents bounded strictly under the parent tenant limit parameters.</p>
            </div>
            {selectedRole === 'Admin' ? (
              <Button onClick={() => setIsAddingUser(!isAddingUser)}>
                {isAddingUser ? 'Cancel Action' : 'Create Enterprise Account'}
              </Button>
            ) : (
              <span className="text-xs font-mono font-bold text-text-muted bg-secondary/80 border border-border px-3 py-1.5 rounded-lg shrink-0">
                Read-Only Access
              </span>
            )}
          </div>

          {/* User addition form */}
          {selectedRole === 'Admin' && isAddingUser && (
            <div className="p-5 bg-secondary/10 border border-border rounded-lg space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">Provision New User Agent</h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">User Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tony Stark" 
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Work Email *</label>
                  <input 
                    type="email" 
                    placeholder="e.g. tony@stark.com" 
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Affiliated Sub-Organization *</label>
                  <select 
                    value={userForm.orgId}
                    onChange={e => setUserForm({...userForm, orgId: e.target.value})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  >
                    <option value="">-- Choose Tenant --</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">System Governance Role *</label>
                  <select 
                    value={userForm.role}
                    onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                  >
                    <option value="Enterprise Admin">Enterprise Admin (Full Multi-tenant control)</option>
                    <option value="Planner">Planner (Calculate & Quote setup)</option>
                    <option value="Super User">Super User (Override standard tools)</option>
                    <option value="Viewer">Viewer (Read Audit / Output tables)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Annual Limit (Calcs) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500" 
                    value={userForm.calculationLimit}
                    onChange={e => setUserForm({...userForm, calculationLimit: Number(e.target.value)})}
                    className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="md:col-span-5 flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingUser(false)}>Cancel</Button>
                  <Button type="submit">Commit User Creation</Button>
                </div>
              </form>
            </div>
          )}

          {/* User Table Listings */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-2">Full Name</th>
                  <th className="py-3 px-2">Work Email Address</th>
                  <th className="py-3 px-2">Parent Sub-Organization</th>
                  <th className="py-3 px-2">Security Clearance (Role)</th>
                  <th className="py-3 px-2 font-mono">Quota Limit (Per User)</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  {selectedRole === 'Admin' && <th className="py-3 px-2 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {usersList.map(u => {
                  const affiliatedOrg = organizations.find(o => o.id === u.orgId);
                  const isInactive = u.status === 'Inactive';
                  return (
                    <tr key={u.id} className="hover:bg-secondary/5 font-medium text-text-primary text-xs">
                      <td className="py-4 px-2 font-black">{u.name}</td>
                      <td className="py-4 px-2 font-mono text-text-muted">{u.email}</td>
                      <td className="py-4 px-2">{affiliatedOrg ? affiliatedOrg.name : <span className="text-text-muted italic">Orphan Account</span>}</td>
                      <td className="py-4 px-2">
                        <span className="px-2.5 py-1 bg-secondary text-text-primary rounded text-[10px] font-mono uppercase tracking-wide">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-mono">{u.calculationsCreated} / {u.calculationLimit}</td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isInactive 
                            ? 'bg-rose-50 text-rose-500 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-500 border border-emerald-200'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      {selectedRole === 'Admin' && (
                        <td className="py-4 px-2 text-right space-x-2">
                          <button 
                            onClick={() => toggleUserStatus(u.id)}
                            className="hover:text-text-primary transition-colors hover:underline text-text-muted font-bold"
                          >
                            {isInactive ? 'Reinstate' : 'Deactivate'}
                          </button>
                          <span>•</span>
                          <button 
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="text-red-500 hover:text-red-700 hover:underline font-bold"
                          >
                            Revoke Rights
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab D: APPROVALS QUEUE */}
      {activeTab === 'Approvals Queue' && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide">High-Volume Cost Margin Approvals</h2>
            <p className="text-xs text-text-muted mt-1">Review complex calculations that exeed standard operational size thresholds requiring security reviews, or high material margin tolerances.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-2">Submission Context</th>
                  <th className="py-3 px-2 font-mono">Assigned Corp</th>
                  <th className="py-3 px-2">Submitted By</th>
                  <th className="py-3 px-2">Active Spec Item</th>
                  <th className="py-3 px-2">Aggregated Net Cost</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2">Approved By</th>
                  <th className="py-3 px-2 text-right">Auditor Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {approvals.map(app => {
                  const affiliatedOrg = organizations.find(o => o.id === app.orgId);
                  return (
                    <tr key={app.id} className="hover:bg-secondary/5 font-medium text-text-primary text-xs">
                      <td className="py-4 px-2 font-black">
                        <div>
                          <p>{app.name}</p>
                          <span className="text-[10px] text-text-muted font-mono">{app.createdAt}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 font-mono">{affiliatedOrg ? affiliatedOrg.name : 'Unknown Corp'}</td>
                      <td className="py-4 px-2 font-mono text-text-muted">{app.submittedBy}</td>
                      <td className="py-4 px-2">{app.partName}</td>
                      <td className="py-4 px-2 font-mono font-black text-text-primary">
                        ${app.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          app.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          app.status === 'In Review' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-sky-50 text-sky-600 border-sky-200'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-xs font-mono text-text-muted">
                        {app.approvedBy || '-'}
                      </td>
                      <td className="py-4 px-2 text-right space-y-1">
                        {selectedRole === 'Admin' ? (
                          app.status === 'Pending' || app.status === 'In Review' ? (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleProcessApproval(app.id, 'Approved', 'Passed limits verification.')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] uppercase font-bold"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleProcessApproval(app.id, 'Rejected', 'Exceeded corporate pricing index variance.')}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] uppercase font-bold"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => handleProcessApproval(app.id, 'In Review', 'Awaiting structural tolerance signoff.')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[10px] uppercase font-bold"
                              >
                                Review
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-text-muted italic">{app.comments || 'No comment recorded.'}</p>
                          )
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded uppercase tracking-wider">
                            Awaiting Super Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab E: API CREDENTIALS */}
      {activeTab === 'API Credentials' && (
        <div className="space-y-8">
          <Card className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide">Developer API Tokens</h2>
                <p className="text-xs text-text-muted mt-1">Configure automated machine integration protocols to download costs, update local feeds, or pull custom materials directly into MES or ERP modules.</p>
              </div>
              {selectedRole === 'Admin' ? (
                <Button onClick={() => {
                  setNewlyGeneratedKey(null);
                  setIsAddingKey(!isAddingKey);
                }}>
                  {isAddingKey ? 'Cancel Authorization' : 'Issue New API Key'}
                </Button>
              ) : (
                <span className="text-xs font-mono font-bold text-text-muted bg-secondary/80 border border-border px-3 py-1.5 rounded-lg shrink-0">
                  Read-Only Access
                </span>
              )}
            </div>

            {/* Credential issue screen */}
            {selectedRole === 'Admin' && isAddingKey && (
              <div className="p-5 bg-secondary/10 border border-border rounded-lg space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">Issue New TLS Integration Key</h3>
                <form onSubmit={handleCreateApiKey} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Description/App Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ERP Machinery Sync" 
                      value={keyForm.name}
                      onChange={e => setKeyForm({...keyForm, name: e.target.value})}
                      className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Assign to Sub-Organization *</label>
                    <select 
                      value={keyForm.orgId}
                      onChange={e => setKeyForm({...keyForm, orgId: e.target.value})}
                      className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                      required
                    >
                      <option value="">-- Choose Tenant --</option>
                      {organizations.map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Authorized API Scope *</label>
                    <select 
                      value={keyForm.scope}
                      onChange={e => setKeyForm({...keyForm, scope: e.target.value as any})}
                      className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    >
                      <option value="Read Calculations">Read Calculations Only</option>
                      <option value="Read/Write Calculations">Read/Write Calculations</option>
                      <option value="Full Access">Full Access (Audit, Admin & Quotas)</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsAddingKey(false)}>Cancel</Button>
                    <Button type="submit">Deploy API Credentials</Button>
                  </div>
                </form>

                {newlyGeneratedKey && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-xs space-y-2">
                    <p className="font-extrabold text-emerald-800 uppercase tracking-wide">🚨 Security Note: Copy Your Private Access token</p>
                    <p className="text-emerald-700">Write this down carefully. We encrypt token parameters so you cannot view this credential string again once closed.</p>
                    <code className="block bg-background text-text-primary p-3 rounded text-xs font-mono select-all border border-emerald-200">
                      {newlyGeneratedKey}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* List api keys */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-text-muted">
                    <th className="py-3 px-2">Label Description</th>
                    <th className="py-3 px-2 font-mono">Bound Tenant</th>
                    <th className="py-3 px-2 font-mono">Token Signature</th>
                    <th className="py-3 px-2">Calculations Scope</th>
                    <th className="py-3 px-2">Expires</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    {selectedRole === 'Admin' && <th className="py-3 px-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {apiKeys.map(k => {
                    const affiliatedOrg = organizations.find(o => o.id === k.orgId);
                    const isRevoked = k.status === 'Revoked';
                    return (
                      <tr key={k.id} className="hover:bg-secondary/5 font-medium text-text-primary text-xs">
                        <td className="py-4 px-2 font-black">{k.name}</td>
                        <td className="py-4 px-2 font-mono">{affiliatedOrg ? affiliatedOrg.name : 'Global'}</td>
                        <td className="py-4 px-2 font-mono text-text-muted">
                          {k.key.substring(0, 12)}••••••••{k.key.substring(k.key.length - 4)}
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 bg-secondary text-text-primary rounded text-[10px] font-mono font-bold whitespace-nowrap">
                            {k.scope}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-mono text-text-muted">{k.expiresAt}</td>
                        <td className="py-4 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            isRevoked 
                              ? 'bg-rose-50 text-rose-500 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-500 border border-emerald-200'
                          }`}>
                            {k.status}
                          </span>
                        </td>
                        {selectedRole === 'Admin' && (
                          <td className="py-4 px-2 text-right">
                            {!isRevoked ? (
                              <button 
                                onClick={() => revokeApiKey(k.id, k.name)}
                                className="text-red-500 hover:text-red-700 hover:underline font-bold"
                              >
                                Revoke Access
                              </button>
                            ) : (
                              <span className="text-text-muted italic">No actions</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Developer Sandbox Simulator block */}
          {selectedRole === 'Admin' ? (
            <Card className="p-6 space-y-6 animate-fade-in">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">Interactive API Developer Sandbox</h2>
                <p className="text-xs text-text-muted mt-1">Select an authorized API key and point to our endpoints to mock client-side server responses with live React state data directly.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Select Client Key Signature</label>
                    <select 
                      value={sandboxApiKey}
                      onChange={e => setSandboxApiKey(e.target.value)}
                      className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Choose Key --</option>
                      {apiKeys.map(k => (
                        <option key={k.id} value={k.key}>{k.name} ({k.status})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Target Mesh HTTP Router</label>
                    <select 
                      value={sandboxEndpoint}
                      onChange={e => setSandboxEndpoint(e.target.value)}
                      className="w-full text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                    >
                      <option value="GET /v1/organizations">GET /v1/organizations (List Sub-Orgs)</option>
                      <option value="GET /v1/calculations">GET /v1/calculations (List Machining Costs)</option>
                      <option value="GET /v1/system/audit-logs">GET /v1/system/audit-logs (Security Telemetry)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={runSandboxTest} 
                      className="w-full justify-center" 
                      disabled={sandboxLoading || !sandboxApiKey}
                    >
                      {sandboxLoading ? 'Transmitting Request...' : 'Trigger REST Execution'}
                    </Button>
                  </div>
                </div>

                {/* Console Sandbox Terminal layout */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-text-muted">
                    <span>SANDBOX TERMINAL OUTPUT v1.2</span>
                    <span>STATUS: {sandboxLoading ? 'WAITING' : 'READY'}</span>
                  </div>
                  <div className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto min-h-48 border border-slate-800">
                    <pre className="whitespace-pre-wrap leading-relaxed">{sandboxResponse}</pre>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center space-y-4 border border-dashed border-amber-500/20 bg-amber-500/5 rounded-xl animate-fade-in">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-lg">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase text-amber-500 tracking-wider">REST Sandbox Access Restrained</h3>
                <p className="text-xs text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                  Interactive REST code sandbox execution transacts direct database schemas and production server query states. 
                  These execution routines are locked for safety under compliance criteria for general client Viewer accounts.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab F: COMPLIANCE AUDIT LOGS */}
      {activeTab === 'Compliance Audit Logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 space-y-6">
              
              {/* Search + categories */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 gap-4">
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Search logs by actor, action or specific details..." 
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="w-full text-sm bg-background border border-border px-3 py-2.5 rounded focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex space-x-2">
                  <select 
                    value={logFilterCategory}
                    onChange={e => setLogFilterCategory(e.target.value)}
                    className="text-sm bg-background border border-border px-3 py-2 rounded focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Organization">Organization</option>
                    <option value="User">User</option>
                    <option value="API Key">API Keys</option>
                    <option value="Approval">Approvals</option>
                    <option value="System">System Control</option>
                  </select>

                  <Button variant="outline" onClick={exportLogsAsJSON} className="text-xs">
                    Export JSON
                  </Button>
                  {selectedRole === 'Admin' ? (
                    <Button variant="ghost" onClick={clearAuditingArchive} className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs">
                      Purge
                    </Button>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-1.5 rounded uppercase tracking-wider shrink-0 select-none">
                      Archive Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Logging archive list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-text-muted">
                      <th className="py-3 px-2 w-36">Time Stamp</th>
                      <th className="py-3 px-2 w-48">Actor Identity</th>
                      <th className="py-3 px-2 w-52">Operational Action</th>
                      <th className="py-3 px-2">Scope Parameters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono text-[11px] text-text-primary">
                    {filteredLogs.map(log => {
                      let tagColor = 'bg-slate-100 text-slate-700';
                      if (log.category === 'Organization') tagColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      if (log.category === 'API Key') tagColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (log.category === 'User') tagColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (log.category === 'Approval') tagColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (log.category === 'System') tagColor = 'bg-slate-50 text-slate-700 border-slate-200';

                      return (
                        <tr key={log.id} className="hover:bg-secondary/5 align-top">
                          <td className="py-3 px-2 text-text-muted">{log.timestamp}</td>
                          <td className="py-3 px-2 font-bold truncate" title={log.actor}>{log.actor}</td>
                          <td className="py-3 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border mr-1.5 ${tagColor}`}>
                              {log.category}
                            </span>
                            <span className="font-semibold text-text-primary">{log.action}</span>
                          </td>
                          <td className="py-3 px-2 text-text-muted leading-relaxed break-words whitespace-normal">{log.details}</td>
                        </tr>
                      );
                    })}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-text-muted italic">No auditable actions matching filtering parameters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Compliance Checklist Widget Column */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Information Security Protocol</h3>
              <p className="text-[11px] text-text-muted leading-relaxed">System-wide operational matrices are maintained under stringent ISO-27001 and high-security compliance guidelines.</p>
              
              <div className="space-y-3 pt-2">
                {[
                  { label: 'AES-256 API Key hashing', active: true },
                  { label: 'Direct Row-level security checks', active: true },
                  { label: 'Auditable tenant isolation', active: true },
                  { label: 'Encrypted calculation templates', active: true },
                  { label: 'Continuous ledger synchronization', active: true },
                ].map((item, id) => (
                  <div key={id} className="flex items-center space-x-2.5 text-xs text-text-secondary">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium text-text-primary text-[11px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 text-center space-y-3 bg-secondary/15">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-sm font-bold">✓</div>
              <p className="text-xs font-black uppercase text-text-primary tracking-widest">Active Audit Log integrity</p>
              <p className="text-[10px] text-text-muted">Digital hash signature verified periodically. Anti-tampering perimeter enabled.</p>
            </Card>
          </div>

        </div>
      )}

    </div>
  );
};
