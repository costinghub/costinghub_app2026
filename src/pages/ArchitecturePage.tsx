import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Shield, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Cpu, 
  Zap, 
  Activity, 
  Play, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ArchitecturePage: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<'none' | 'auth' | 'api' | 'telemetry'>('none');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const mhrSqlSchema = `-- 1. Machine Hour Rate (MHR) Dedicated Table Schema
-- Execute this SQL in your Supabase SQL Editor to create the structured table.

CREATE TABLE IF NOT EXISTS public.machine_hour_rate_calculations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    calculation_number TEXT NOT NULL,
    part_number TEXT NOT NULL,
    part_name TEXT NOT NULL DEFAULT 'Machine Hour Rate Estimation',
    customer_name TEXT,
    revision TEXT DEFAULT 'A',
    currency TEXT DEFAULT 'USD',
    region TEXT DEFAULT 'USA',
    notes TEXT,
    
    -- Machine details
    machine_name TEXT NOT NULL DEFAULT 'CNC 5-Axis Machining Center',
    brand TEXT,
    model TEXT,
    machine_type TEXT,

    -- 1. Machine Capital & Cost
    machine_cost NUMERIC DEFAULT 0,
    installation_percent NUMERIC DEFAULT 0,
    scrap_value NUMERIC DEFAULT 0,

    -- 2. Depreciation & Loan
    depreciation_percent NUMERIC DEFAULT 0,
    life_years NUMERIC DEFAULT 0,
    loan_amount NUMERIC DEFAULT 0,
    loan_interest_rate NUMERIC DEFAULT 0,

    -- 3. Space & Rent
    space_length_ft NUMERIC DEFAULT 0,
    space_width_ft NUMERIC DEFAULT 0,
    annual_rent_per_sq_ft NUMERIC DEFAULT 0,

    -- 4. Supervision & Insurance
    supervisor_annual_salary NUMERIC DEFAULT 0,
    supervisor_time_percent NUMERIC DEFAULT 0,
    annual_insurance_premium NUMERIC DEFAULT 0,

    -- 5. Variable Cost Metrics
    power_units_per_hr NUMERIC DEFAULT 0,
    power_rate_per_unit NUMERIC DEFAULT 0,
    maintenance_percent_of_capital NUMERIC DEFAULT 0,
    consumables_percent_of_capital NUMERIC DEFAULT 0,

    -- 6. Utilization Rates
    working_days_per_year NUMERIC DEFAULT 250,
    working_hours_per_day NUMERIC DEFAULT 16,
    efficiency_percent NUMERIC DEFAULT 85,

    -- 7. Labor Metrics
    hourly_labour_rate NUMERIC DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.machine_hour_rate_calculations ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies
CREATE POLICY "Users can view their own MHR calculations" 
ON public.machine_hour_rate_calculations 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own MHR calculations" 
ON public.machine_hour_rate_calculations 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own MHR calculations" 
ON public.machine_hour_rate_calculations 
FOR UPDATE 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own MHR calculations" 
ON public.machine_hour_rate_calculations 
FOR DELETE 
USING (auth.uid()::text = user_id);`;

  const genericCalculationsSchema = `-- Supabase calculations Table Integration Schema
-- If you want to use the unified JSONB schemaless integration format (default):

CREATE TABLE IF NOT EXISTS public.calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    inputs JSONB NOT NULL,
    results JSONB,
    approval_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'draft',
    is_hidden BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER DEFAULT 0,
    parent_id TEXT DEFAULT NULL,
    revision_number INTEGER DEFAULT NULL,
    "calculatorType" TEXT DEFAULT 'machining',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`;

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in space-y-12 pb-24 px-4 sm:px-6">
      
      {/* Header */}
      <header className="relative p-8 rounded-3xl bg-gradient-to-br from-surface to-background border border-border shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Core Systems Blueprint
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">
              SaaS Integration Architecture
            </h1>
            <p className="text-base text-text-secondary max-w-2xl">
              Production-ready hybrid edge architecture utilizing **Supabase** for secure auth and datastores, combined with **Cloudflare Workers** as an ultra-low latency gateway.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={activeFlow === 'auth' ? 'primary' : 'secondary'}
              onClick={() => setActiveFlow(activeFlow === 'auth' ? 'none' : 'auth')}
              className="flex items-center gap-2 !px-4 !py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              <Shield className="w-4 h-4" /> Simulate Auth Flow
            </Button>
            <Button 
              variant={activeFlow === 'api' ? 'primary' : 'secondary'}
              onClick={() => setActiveFlow(activeFlow === 'api' ? 'none' : 'api')}
              className="flex items-center gap-2 !px-4 !py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              <Cpu className="w-4 h-4" /> Simulate API Flow
            </Button>
            <Button 
              variant={activeFlow === 'telemetry' ? 'primary' : 'secondary'}
              onClick={() => setActiveFlow(activeFlow === 'telemetry' ? 'none' : 'telemetry')}
              className="flex items-center gap-2 !px-4 !py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
            >
              <Activity className="w-4 h-4" /> Simulate Telemetry
            </Button>
          </div>
        </div>
      </header>

      {/* Main Diagram Canvas */}
      <Card className="p-6 md:p-8 bg-surface/40 backdrop-blur-sm border border-border shadow-xl rounded-3xl overflow-hidden relative">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="relative overflow-x-auto">
          <div className="min-w-[1050px] p-2">
            <svg 
              viewBox="0 0 1200 800" 
              className="w-full h-auto drop-shadow-xl"
              style={{ maxHeight: '720px' }}
            >
              {/* Defs for gradients & patterns */}
              <defs>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                
                {/* Glow Filters */}
                <filter id="glowBlue" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#0ea5e9" floodOpacity="0.6" />
                </filter>
                <filter id="glowGreen" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10b981" floodOpacity="0.6" />
                </filter>
                <filter id="glowOrange" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f97316" floodOpacity="0.6" />
                </filter>

                {/* Arrow Markers */}
                <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#0ea5e9" />
                </marker>
                <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
                </marker>
                <marker id="arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                </marker>
              </defs>

              {/* ==================== 1. FRONTEND LAYER ==================== */}
              <g id="g-frontend" className="cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]">
                {/* Background Shadow Card */}
                <rect x="50" y="50" width="280" height="150" rx="20" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <rect x="50" y="50" width="280" height="150" rx="20" fill="url(#blueGrad)" fillOpacity="0.08" stroke="#0ea5e9" strokeWidth="2.5" filter={activeFlow === 'auth' || activeFlow === 'api' ? 'url(#glowBlue)' : ''} />
                
                {/* React Icon Iconography */}
                <circle cx="90" cy="100" r="18" fill="#0ea5e9" fillOpacity="0.2" />
                {/* Orbiting ellipses */}
                <ellipse cx="90" cy="100" rx="14" ry="5" fill="none" stroke="#0ea5e9" strokeWidth="1.5" transform="rotate(30, 90, 100)" />
                <ellipse cx="90" cy="100" rx="14" ry="5" fill="none" stroke="#0ea5e9" strokeWidth="1.5" transform="rotate(150, 90, 100)" />
                <circle cx="90" cy="100" r="3" fill="#0ea5e9" />

                {/* Text Content */}
                <text x="125" y="98" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif">CostingHub App</text>
                <text x="125" y="116" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">Google AI Studio</text>
                
                {/* Visual Note inside React Card */}
                <rect x="70" y="140" width="240" height="42" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="80" y="156" fill="#cbd5e1" fontSize="10.5" fontWeight="500" fontFamily="sans-serif">Built with React + Tailwind + Supabase SDK</text>
                <text x="80" y="172" fill="#38bdf8" fontSize="9.5" fontWeight="bold" fontFamily="monospace">ENV: VITE_SUPABASE_ANON_KEY</text>
              </g>


              {/* ==================== 2. SUPABASE BACKEND (LEFT) ==================== */}
              {/* Outer boundary frame */}
              <rect x="50" y="270" width="460" height="500" rx="24" fill="#0b1315" stroke="#064e3b" strokeWidth="2" strokeDasharray="4 4" />
              <text x="70" y="302" fill="#10b981" fontSize="14" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">SUPABASE ENTERPRISE STACK</text>
              <text x="440" y="302" fill="#047857" fontSize="10" fontWeight="bold" fontFamily="monospace">costinghub</text>

              {/* A. Supabase Authentication */}
              <g id="g-supabase-auth" className="cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]">
                <rect x="80" y="330" width="400" height="190" rx="18" fill="#0d1e1a" stroke="#047857" strokeWidth="2" filter={activeFlow === 'auth' ? 'url(#glowGreen)' : ''} />
                
                {/* Shield badge */}
                <circle cx="120" cy="370" r="16" fill="#10b981" fillOpacity="0.2" />
                <path d="M120 361.5 l8 4.5 v5.5 c0 5-3.5 9-8 10.5 c-4.5-1.5-8-5.5-8-10.5 v-5.5 z" fill="none" stroke="#10b981" strokeWidth="2" />
                
                <text x="148" y="370" fill="#ffffff" fontSize="15" fontWeight="800" fontFamily="sans-serif">Supabase Authentication</text>
                <text x="148" y="386" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace">JWT Token Authority</text>
                
                {/* Provider Icons Simulation */}
                <g transform="translate(100, 410)">
                  {/* Email */}
                  <rect x="0" y="0" width="80" height="28" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                  <text x="40" y="18" fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">✉ Email</text>

                  {/* Google */}
                  <rect x="90" y="0" width="80" height="28" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                  <text x="130" y="18" fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">G Google</text>

                  {/* GitHub */}
                  <rect x="180" y="0" width="80" height="28" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                  <text x="220" y="18" fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">⚙ GitHub</text>
                </g>

                {/* JWT Issued Subbox */}
                <rect x="100" y="455" width="360" height="45" rx="10" fill="#064e3b" stroke="#059669" strokeWidth="1.5" />
                <circle cx="125" cy="477" r="10" fill="#10b981" />
                <path d="M121 477 l3 3 l5 -5" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                <text x="145" y="475" fill="#ffffff" fontSize="12" fontWeight="800" fontFamily="sans-serif">JWT Session Token Issued</text>
                <text x="145" y="490" fill="#a7f3d0" fontSize="10" fontWeight="bold" fontFamily="monospace">Header: HS256 RS256 Auth Bearer</text>
              </g>

              {/* B. Supabase Postgres Database */}
              <g id="g-supabase-db" className="cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]">
                <rect x="80" y="550" width="400" height="195" rx="18" fill="#0d1e1a" stroke="#047857" strokeWidth="2" filter={activeFlow === 'api' ? 'url(#glowGreen)' : ''} />
                
                {/* DB Database Icon */}
                <circle cx="120" cy="590" r="16" fill="#10b981" fillOpacity="0.2" />
                <path d="M110 584 c0 -4 10 -4 10 -4 s10 0 10 4 s-10 4 -10 4 s-10 0-10 -4" fill="none" stroke="#10b981" strokeWidth="2" />
                <path d="M110 584 v8 c0 4 10 4 10 4 s10 0 10 -4 v-8" fill="none" stroke="#10b981" strokeWidth="2" />
                <path d="M110 592 v8 c0 4 10 4 10 4 s10 0 10 -4 v-8" fill="none" stroke="#10b981" strokeWidth="2" />

                <text x="148" y="590" fill="#ffffff" fontSize="15" fontWeight="800" fontFamily="sans-serif">Supabase Postgres Database</text>
                <text x="148" y="606" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace">User Accounts, Billing Info, SaaS Data</text>

                {/* DB Stats info tags */}
                <rect x="100" y="630" width="360" height="95" rx="12" fill="#070f0d" stroke="#064e3b" strokeWidth="1" />
                <text x="115" y="650" fill="#10b981" fontSize="10.5" fontWeight="bold" fontFamily="monospace">➤ machine_hour_rate_calculations</text>
                <text x="115" y="666" fill="#94a3b8" fontSize="10" fontWeight="500" fontFamily="sans-serif">Calculations, installations, rent ratios, variable loads</text>
                
                <text x="115" y="692" fill="#10b981" fontSize="10.5" fontWeight="bold" fontFamily="monospace">➤ profiles, machines, tools, materials</text>
                <text x="115" y="708" fill="#94a3b8" fontSize="10" fontWeight="500" fontFamily="sans-serif">Multi-tenant schemas, usage metrics, subscription roles</text>

                {/* Overlay Badge for Supabase docs */}
                <rect x="300" y="563" width="165" height="22" rx="6" fill="#047857" />
                <text x="382" y="577" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Metrics API | Supabase Docs</text>
              </g>


              {/* ==================== 3. CLOUDFLARE EDGE LAYER (RIGHT) ==================== */}
              {/* Outer boundary frame */}
              <rect x="690" y="150" width="460" height="620" rx="24" fill="#17110d" stroke="#7c2d12" strokeWidth="2" strokeDasharray="4 4" />
              <text x="710" y="182" fill="#ea580c" fontSize="14" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">CLOUDFLARE CLOUD NETWORK</text>
              <text x="1080" y="182" fill="#9a3412" fontSize="10" fontWeight="bold" fontFamily="monospace">Edge-Node</text>

              {/* A. Cloudflare Workers (Edge Gateway) */}
              <g id="g-cloudflare-workers" className="cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]">
                <rect x="720" y="210" width="400" height="200" rx="18" fill="#251610" stroke="#c2410c" strokeWidth="2" filter={activeFlow === 'api' || activeFlow === 'telemetry' ? 'url(#glowOrange)' : ''} />
                
                {/* Cloudflare worker SVG Icon shape */}
                <circle cx="760" cy="250" r="16" fill="#ea580c" fillOpacity="0.2" />
                <path d="M750 250 l10 -10 l10 10 l-10 10 z" fill="none" stroke="#ea580c" strokeWidth="2.5" />
                <path d="M754 250 l6 -6 l6 6" fill="none" stroke="#ea580c" strokeWidth="2" />

                <text x="788" y="248" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif">Cloudflare Workers</text>
                <text x="788" y="264" fill="#ea580c" fontSize="11" fontWeight="bold" fontFamily="monospace">Edge-based API Gateway for CostingHub</text>

                {/* Sub features */}
                <rect x="740" y="285" width="360" height="105" rx="12" fill="#100a08" stroke="#7c2d12" strokeWidth="1" />
                
                {/* Verify JWT item */}
                <g transform="translate(760, 305)">
                  <rect x="0" y="0" width="14" height="14" rx="3" fill="#ea580c" />
                  <path d="M3 7 l3 3 l5 -5" fill="none" stroke="#ffffff" strokeWidth="2" />
                  <text x="24" y="11" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Verify Supabase JWT</text>
                </g>

                {/* Route Request item */}
                <g transform="translate(760, 335)">
                  <rect x="0" y="0" width="14" height="14" rx="3" fill="#ea580c" />
                  <path d="M3 7 l3 3 l5 -5" fill="none" stroke="#ffffff" strokeWidth="2" />
                  <text x="24" y="11" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Smart Route & CORS Filters</text>
                </g>

                {/* Performance metadata */}
                <text x="760" y="373" fill="#f97316" fontSize="10" fontWeight="bold" fontFamily="monospace">LATENCY &lt; 15ms | CORS SANITIZATION</text>
              </g>

              {/* B. Cloudflare Storage */}
              <g id="g-cloudflare-storage" className="cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]">
                <rect x="720" y="445" width="400" height="170" rx="18" fill="#251610" stroke="#c2410c" strokeWidth="2" filter={activeFlow === 'api' ? 'url(#glowOrange)' : ''} />
                
                {/* Storage drawer icon */}
                <circle cx="760" cy="485" r="16" fill="#ea580c" fillOpacity="0.2" />
                <rect x="748" y="477" width="24" height="16" rx="3" fill="none" stroke="#ea580c" strokeWidth="2" />
                <line x1="748" y1="485" x2="772" y2="485" stroke="#ea580c" strokeWidth="1.5" />
                <circle cx="760" cy="481" r="1.5" fill="#ea580c" />

                <text x="788" y="483" fill="#ffffff" fontSize="15" fontWeight="800" fontFamily="sans-serif">KV / D1 / Durable Objects</text>
                <text x="788" y="499" fill="#f97316" fontSize="10.5" fontWeight="bold" fontFamily="monospace">Fast Global Reads & Caching</text>

                {/* Cached elements */}
                <rect x="740" y="520" width="360" height="75" rx="12" fill="#100a08" stroke="#7c2d12" strokeWidth="1" />
                <text x="755" y="542" fill="#ea580c" fontSize="11" fontWeight="bold" fontFamily="monospace">Cached Metadata & Tenant Session Cache</text>
                <text x="755" y="558" fill="#94a3b8" fontSize="10.5" fontFamily="sans-serif">Ensures zero database load on active route requests</text>
                <text x="755" y="578" fill="#f97316" fontSize="9.5" fontWeight="black" fontFamily="monospace">TTL: 3600S | HIGH-FREQUENCY READ REGIONS</text>
              </g>

              {/* C. Analytics & Logs (Advanced Layer) */}
              <g id="g-cloudflare-analytics" className="cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]">
                <rect x="720" y="650" width="400" height="95" rx="18" fill="#251610" stroke="#c2410c" strokeWidth="2" filter={activeFlow === 'telemetry' ? 'url(#glowOrange)' : ''} />
                
                {/* Bar chart icon */}
                <circle cx="760" cy="695" r="16" fill="#ea580c" fillOpacity="0.2" />
                <line x1="750" y1="703" x2="750" y2="693" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="760" y1="703" x2="760" y2="687" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="770" y1="703" x2="770" y2="695" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />

                <text x="788" y="692" fill="#ffffff" fontSize="14" fontWeight="800" fontFamily="sans-serif">Analytics & Logs Gateway</text>
                <text x="788" y="708" fill="#f97316" fontSize="10.5" fontFamily="sans-serif">Edge latency metrics, error ratios, cache hit ratios</text>
                
                <rect x="1035" y="662" width="70" height="18" rx="4" fill="#ea580c" fillOpacity="0.1" stroke="#ea580c" strokeWidth="1" />
                <text x="1070" y="710" fill="#ea580c" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace" transform="translate(0, -36)">TELEMETRY</text>
              </g>


              {/* ==================== 4. DATA FLOW ARROWS & TRAFFIC LINES ==================== */}
              {/* Note: Dynamic classes will style the dashes differently based on simulation states */}

              {/* A. React App -> Supabase Auth */}
              <g id="flow-app-to-auth">
                <path 
                  d="M 120 200 L 120 330" 
                  fill="none" 
                  stroke={activeFlow === 'auth' ? '#10b981' : '#475569'} 
                  strokeWidth={activeFlow === 'auth' ? '4' : '2'} 
                  markerEnd="url(#arrow-green)" 
                  strokeDasharray={activeFlow === 'auth' ? '6 6' : ''} 
                  className={activeFlow === 'auth' ? 'animate-[dash_2s_linear_infinite]' : ''} 
                />
                <text x="128" y="260" fill={activeFlow === 'auth' ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Login / Auth Request
                </text>
              </g>

              {/* B. React App -> Cloudflare Worker (Direct API query) */}
              <g id="flow-app-to-worker">
                <path 
                  d="M 330 120 L 820 120 L 820 210" 
                  fill="none" 
                  stroke={activeFlow === 'api' ? '#38bdf8' : '#475569'} 
                  strokeWidth={activeFlow === 'api' ? '4' : '2'} 
                  markerEnd="url(#arrow-blue)" 
                  strokeDasharray={activeFlow === 'api' ? '6 6' : ''}
                  className={activeFlow === 'api' ? 'animate-[dash_2s_linear_infinite]' : ''}
                />
                <text x="490" y="112" fill={activeFlow === 'api' ? '#38bdf8' : '#94a3b8'} fontSize="11.5" fontWeight="bold" fontFamily="sans-serif">
                  API Query (authorized with JWT Session)
                </text>
              </g>

              {/* C. Supabase Auth Token Sent Back to React App */}
              <g id="flow-token-back">
                <path 
                  d="M 230 330 L 230 200" 
                  fill="none" 
                  stroke={activeFlow === 'auth' ? '#10b981' : '#475569'} 
                  strokeWidth={activeFlow === 'auth' ? '3' : '1.5'} 
                  markerEnd="url(#arrow-gray)" 
                  strokeDasharray={activeFlow === 'auth' ? '6 6' : ''}
                  className={activeFlow === 'auth' ? 'animate-[dash_2s_linear_infinite_reverse]' : ''}
                />
                <text x="238" y="270" fill={activeFlow === 'auth' ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Token Return
                </text>
              </g>

              {/* D. Supabase Auth -> Cloudflare Worker (Verify token lookup) */}
              <g id="flow-auth-to-worker">
                <path 
                  d="M 480 370 L 720 370" 
                  fill="none" 
                  stroke={activeFlow === 'api' ? '#10b981' : '#475569'} 
                  strokeWidth={activeFlow === 'api' ? '3' : '2'} 
                  markerEnd="url(#arrow-green)" 
                  strokeDasharray={activeFlow === 'api' ? '6 6' : ''}
                  className={activeFlow === 'api' ? 'animate-[dash_1.5s_linear_infinite]' : ''}
                />
                <text x="510" y="360" fill={activeFlow === 'api' ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Auth Validation Link
                </text>
              </g>

              {/* E. Cloudflare Workers -> Supabase Database (Fetch relation) */}
              <g id="flow-worker-to-db">
                <path 
                  d="M 880 410 L 880 430 L 460 430 L 460 550" 
                  fill="none" 
                  stroke={activeFlow === 'api' ? '#ea580c' : '#475569'} 
                  strokeWidth={activeFlow === 'api' ? '3.5' : '2'} 
                  markerEnd="url(#arrow-orange)" 
                  strokeDasharray={activeFlow === 'api' ? '6 6' : ''}
                  className={activeFlow === 'api' ? 'animate-[dash_2.5s_linear_infinite]' : ''}
                />
                <text x="510" y="422" fill={activeFlow === 'api' ? '#ea580c' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Fetch Relational Data
                </text>
              </g>

              {/* F. Cloudflare Workers -> Cloudflare KV cache */}
              <g id="flow-worker-to-kv">
                <path 
                  d="M 920 410 L 920 445" 
                  fill="none" 
                  stroke={activeFlow === 'api' ? '#ea580c' : '#475569'} 
                  strokeWidth={activeFlow === 'api' ? '4' : '2'} 
                  markerEnd="url(#arrow-orange)" 
                  strokeDasharray={activeFlow === 'api' ? '6 6' : ''}
                  className={activeFlow === 'api' ? 'animate-[dash_1s_linear_infinite]' : ''}
                />
                <text x="930" y="432" fill={activeFlow === 'api' ? '#ea580c' : '#94a3b8'} fontSize="10.5" fontWeight="black" fontFamily="monospace">
                  CACHE LOOKUP
                </text>
              </g>

              {/* G. Cloudflare Workers -> Analytics logs */}
              <g id="flow-worker-to-analytics">
                <path 
                  d="M 1040 410 L 1040 650" 
                  fill="none" 
                  stroke={activeFlow === 'telemetry' ? '#ea580c' : '#475569'} 
                  strokeWidth={activeFlow === 'telemetry' ? '4' : '2'} 
                  markerEnd="url(#arrow-orange)" 
                  strokeDasharray={activeFlow === 'telemetry' ? '6 6' : ''}
                  className={activeFlow === 'telemetry' ? 'animate-[dash_1.2s_linear_infinite]' : ''}
                />
                <text x="1048" y="550" fill={activeFlow === 'telemetry' ? '#ea580c' : '#94a3b8'} fontSize="11" fontWeight="bold" fontFamily="sans-serif" transform="rotate(90, 1048, 550)">
                  Telemetry Stream
                </text>
              </g>

              {/* H. Response return path */}
              <g id="flow-response">
                <path 
                  d="M 720 300 L 330 300 L 330 200" 
                  fill="none" 
                  stroke={activeFlow === 'api' ? '#0ea5e9' : '#475569'} 
                  strokeWidth={activeFlow === 'api' ? '3' : '1.5'} 
                  markerEnd="url(#arrow-blue)" 
                  strokeDasharray={activeFlow === 'api' ? '6 6' : ''}
                  className={activeFlow === 'api' ? 'animate-[dash_2s_linear_infinite_reverse]' : ''}
                />
                <text x="440" y="292" fill={activeFlow === 'api' ? '#0ea5e9' : '#94a3b8'} fontSize="11.5" fontWeight="bold" fontFamily="sans-serif">
                  Unified Response to Client
                </text>
              </g>
              
              {/* Dynamic Key CSS animations in SVGs */}
              <style>{`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -40;
                  }
                }
              `}</style>
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border mt-4">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-sky-500 shadow-glow-primary block" />
            <div className="text-left">
              <p className="text-xs font-black text-text-primary uppercase tracking-wider leading-none">Frontend React Layer</p>
              <p className="text-[10px] text-text-muted mt-0.5">Built with React, Tailwind, Supabase Client SDK</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-emerald-500 block" />
            <div className="text-left">
              <p className="text-xs font-black text-text-primary uppercase tracking-wider leading-none">Supabase Core Backend</p>
              <p className="text-[10px] text-text-muted mt-0.5">PostgreSQL Engine, RLS security policies, auth server</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-orange-500 block" />
            <div className="text-left">
              <p className="text-xs font-black text-text-primary uppercase tracking-wider leading-none">Cloudflare Edge Layer</p>
              <p className="text-[10px] text-text-muted mt-0.5">Serverless Workers gateway, KV database, cached states</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Integration details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Supabase Setup Guide</h2>
              <p className="text-xs text-text-muted uppercase font-mono">Setup database & schemas in 3 steps</p>
            </div>
          </div>
          
          <ol className="space-y-4 text-sm text-text-secondary">
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <p className="font-extrabold text-text-primary">Create a Supabase Project</p>
                <p className="text-xs text-text-muted">Launch a free or premium Postgres database on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center">supabase.com <ExternalLink className="w-3 h-3 ml-0.5" /></a>.</p>
              </div>
            </li>
            
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <p className="font-extrabold text-text-primary">Copy & Execute Schemas</p>
                <p className="text-xs text-text-muted">Navigate to your project's **SQL Editor** panel in Supabase. Paste the database tables and Row Level Security policies from the copy panels on the right.</p>
              </div>
            </li>

            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <p className="font-extrabold text-text-primary">Inject App Keys</p>
                <p className="text-xs text-text-muted">Add your Supabase URL and Anon key credentials in your CostingHub app's workspace environment configurations or settings panel to sync databases seamlessly.</p>
              </div>
            </li>
          </ol>

          <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20 flex gap-3">
            <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black text-emerald-500 uppercase tracking-wider">Multi-Tenant Row Level Security (RLS)</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Both SQL schemas include strict `auth.uid()::text = user_id` Row Level Security parameters. This guarantees that registered clients can never view, overwrite, or edit cost calculations belonging to other tenants.
              </p>
            </div>
          </div>
        </Card>

        {/* Copy SQL Tables */}
        <div className="space-y-6">
          <Card className="p-6 border border-border">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-text-primary">MHR SQL Schema (Supabase)</h3>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => copyToClipboard(mhrSqlSchema, 'mhr')}
                className="flex items-center gap-1.5 !px-3 !py-1.5 text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5" /> {copiedId === 'mhr' ? 'Copied!' : 'Copy SQL'}
              </Button>
            </div>
            
            <div className="bg-background/80 p-4 rounded-xl border border-border max-h-[220px] overflow-y-auto font-mono text-xs text-text-secondary select-all text-left">
              <pre>{mhrSqlSchema}</pre>
            </div>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-500" />
                <h3 className="font-extrabold text-text-primary">JSONB Generic Schema</h3>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => copyToClipboard(genericCalculationsSchema, 'generic')}
                className="flex items-center gap-1.5 !px-3 !py-1.5 text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5" /> {copiedId === 'generic' ? 'Copied!' : 'Copy SQL'}
              </Button>
            </div>
            
            <div className="bg-background/80 p-4 rounded-xl border border-border max-h-[140px] overflow-y-auto font-mono text-xs text-text-secondary select-all text-left">
              <pre>{genericCalculationsSchema}</pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
