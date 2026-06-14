-- Drop existing tables so we can recreate them correctly
DROP TABLE IF EXISTS region_currency_map CASCADE;
DROP TABLE IF EXISTS region_costs CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS calculation_templates CASCADE;
DROP TABLE IF EXISTS casting_calculations CASCADE;
DROP TABLE IF EXISTS forging_calculations CASCADE;
DROP TABLE IF EXISTS calculations CASCADE;
DROP TABLE IF EXISTS processes CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    "companyName" TEXT,
    company_name TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    enterprise_id TEXT,
    calculations_created_this_period INTEGER DEFAULT 0,
    calculation_limit INTEGER DEFAULT -1,
    plan_name TEXT DEFAULT 'Free',
    subscription_status TEXT DEFAULT 'active',
    subscription_expires_on TEXT,
    gemini_api_key TEXT,
    claude_api_key TEXT,
    openai_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calculations table
CREATE TABLE IF NOT EXISTS calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    inputs JSONB NOT NULL,
    results JSONB,
    approval_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'draft',
    is_hidden BOOLEAN DEFAULT FALSE,
    duration_seconds INTEGER DEFAULT 0,
    parent_id TEXT DEFAULT NULL,
    revision_number INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Casting Calculations Table
CREATE TABLE IF NOT EXISTS casting_calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    approval_status TEXT DEFAULT 'pending',
    is_hidden BOOLEAN DEFAULT FALSE,
    calculation_number TEXT NOT NULL,
    part_number TEXT NOT NULL,
    part_name TEXT NOT NULL,
    customer_name TEXT,
    revision TEXT,
    annual_volume NUMERIC,
    batch_volume NUMERIC,
    unit_system TEXT DEFAULT 'Metric',
    region TEXT,
    currency TEXT,
    
    -- Casting Material Info
    material_category TEXT,
    material_type TEXT,
    raw_material_weight_kg NUMERIC,
    finished_part_weight_kg NUMERIC,
    material_cost_per_kg NUMERIC,
    material_density_gcm3 NUMERIC,
    
    -- Casting Specific Parameters
    casting_process TEXT,
    yield_rate NUMERIC,
    scrap_return_value_percent NUMERIC,
    scrap_return_rate NUMERIC,
    
    -- Tooling & Pattern
    pattern_cost NUMERIC,
    pattern_life_shots NUMERIC,
    cores_used BOOLEAN DEFAULT FALSE,
    core_weight_kg NUMERIC,
    core_material_cost_per_kg NUMERIC,
    core_binder_cost_per_kg NUMERIC,
    
    -- Casting Process Rates & Operations
    melting_cost_per_kg NUMERIC,
    molding_cycle_time_min NUMERIC,
    molding_hourly_rate NUMERIC,
    pouring_time_sec NUMERIC,
    pouring_hourly_rate NUMERIC,
    fettling_time_min NUMERIC,
    fettling_hourly_rate NUMERIC,
    inspection_cost_per_part NUMERIC,
    heat_treatment_cost_per_part NUMERIC,
    
    surface_treatments JSONB DEFAULT '[]'::jsonb,
    markups JSONB DEFAULT '{}'::jsonb,
    
    -- Results
    result_poured_weight_kg NUMERIC,
    result_scrap_weight_kg NUMERIC,
    result_raw_material_part_cost NUMERIC,
    result_scrap_credit_per_part NUMERIC,
    result_net_material_cost_per_part NUMERIC,
    result_melting_cost_per_part NUMERIC,
    result_molding_cost_per_part NUMERIC,
    result_pouring_cost_per_part NUMERIC,
    result_core_cost_per_part NUMERIC,
    result_fettling_cost_per_part NUMERIC,
    result_tooling_amortized_cost_per_part NUMERIC,
    result_surface_treatment_cost NUMERIC,
    result_base_manufacturing_cost NUMERIC,
    result_markup_costs JSONB DEFAULT '{}'::jsonb,
    result_total_cost NUMERIC,
    result_cost_per_part NUMERIC,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forging Calculations Table
CREATE TABLE IF NOT EXISTS forging_calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    approval_status TEXT DEFAULT 'pending',
    is_hidden BOOLEAN DEFAULT FALSE,
    calculation_number TEXT NOT NULL,
    part_number TEXT NOT NULL,
    part_name TEXT NOT NULL,
    customer_name TEXT,
    revision TEXT,
    annual_volume NUMERIC,
    batch_volume NUMERIC,
    unit_system TEXT DEFAULT 'Metric',
    region TEXT,
    currency TEXT,
    
    -- Forging Material Info
    material_category TEXT,
    material_type TEXT,
    finished_part_weight_kg NUMERIC,
    material_cost_per_kg NUMERIC,
    material_density_gcm3 NUMERIC,
    
    -- Forging Specific Yield / Parameters
    forging_process TEXT,
    yield_rate NUMERIC,
    scale_loss_percent NUMERIC,
    scrap_return_value_percent NUMERIC,
    scrap_return_rate NUMERIC,
    
    -- Tooling & Forging Dies
    die_cost NUMERIC,
    die_life_shots NUMERIC,
    
    -- Forging Operational / Cycle Rates
    heating_energy_cost_per_kg NUMERIC,
    shearing_hourly_rate NUMERIC,
    shearing_cycle_time_sec NUMERIC,
    forging_cycle_time_sec NUMERIC,
    forging_machine_hourly_rate NUMERIC,
    trimming_cycle_time_sec NUMERIC,
    trimming_hourly_rate NUMERIC,
    inspection_cost_per_part NUMERIC,
    heat_treatment_cost_per_part NUMERIC,
    part_surface_area_m2 NUMERIC,
    
    surface_treatments JSONB DEFAULT '[]'::jsonb,
    markups JSONB DEFAULT '{}'::jsonb,
    
    -- Results
    result_raw_billet_weight_kg NUMERIC,
    result_flash_scrap_weight_kg NUMERIC,
    result_scale_loss_weight_kg NUMERIC,
    result_raw_material_billet_cost NUMERIC,
    result_scrap_credit_per_part NUMERIC,
    result_net_material_cost_per_part NUMERIC,
    result_heating_cost_per_part NUMERIC,
    result_shearing_cost_per_part NUMERIC,
    result_forging_press_cost_per_part NUMERIC,
    result_trimming_cost_per_part NUMERIC,
    result_tooling_amortized_cost_per_part NUMERIC,
    result_surface_treatment_cost NUMERIC,
    result_base_manufacturing_cost NUMERIC,
    result_markup_costs JSONB DEFAULT '{}'::jsonb,
    result_total_cost NUMERIC,
    result_cost_per_part NUMERIC,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    "subCategory" TEXT,
    density_gcm3 NUMERIC,
    properties JSONB,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    "hourlyRate" NUMERIC,
    "machineType" TEXT,
    "xAxis" NUMERIC,
    "yAxis" NUMERIC,
    "zAxis" NUMERIC,
    "powerKw" NUMERIC,
    "additionalAxis" TEXT,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    "toolType" TEXT,
    material TEXT,
    diameter NUMERIC,
    "cornerRadius" NUMERIC,
    "numberOfTeeth" INTEGER,
    "arborOrInsert" TEXT,
    "compatibleMachineTypes" JSONB,
    "cuttingSpeedVc" NUMERIC,
    "feedPerTooth" NUMERIC,
    "speedRpm" NUMERIC,
    "feedRate" NUMERIC,
    "estimatedLife" NUMERIC,
    price NUMERIC,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    usage_duration TEXT,
    usage_experience TEXT,
    feature_requests TEXT,
    suggested_changes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Region Costs table
CREATE TABLE IF NOT EXISTS region_costs (
    id TEXT PRIMARY KEY,
    item_id TEXT,
    item_type TEXT,
    region TEXT NOT NULL,
    price NUMERIC,
    currency TEXT,
    valid_from TEXT,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "group" TEXT,
    "compatibleMachineTypes" JSONB,
    parameters JSONB,
    formula TEXT,
    "imageUrl" TEXT,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Region Currencies table
CREATE TABLE IF NOT EXISTS region_currency_map (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    currency TEXT NOT NULL,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    calculation_limit INTEGER NOT NULL,
    period TEXT NOT NULL,
    prices JSONB NOT NULL,
    features JSONB NOT NULL,
    is_custom_price BOOLEAN DEFAULT FALSE,
    cta TEXT,
    most_popular BOOLEAN DEFAULT FALSE,
    payment_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calculation Templates table
CREATE TABLE IF NOT EXISTS calculation_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    setups JSONB NOT NULL,
    markups JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable Row Level Security (RLS) for all tables to allow the app to work seamlessly without policy configuration
ALTER TABLE region_currency_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE region_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE casting_calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE forging_calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE processes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- If RLS is accidentally enabled, these permissive policies ensure normal operation continues
CREATE POLICY "Enable read access for all users" ON region_currency_map FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON region_currency_map FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON region_currency_map FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON region_currency_map FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON region_costs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON region_costs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON region_costs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON region_costs FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON feedback FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON feedback FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON feedback FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON calculation_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON calculation_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON calculation_templates FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON calculation_templates FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON calculations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON calculations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON calculations FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON casting_calculations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON casting_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON casting_calculations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON casting_calculations FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON forging_calculations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON forging_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON forging_calculations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON forging_calculations FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON processes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON processes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON processes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON processes FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON tools FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tools FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON tools FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON machines FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON machines FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON machines FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON machines FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON materials FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON materials FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON materials FOR DELETE USING (true);

-- Helper to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
    AND (role = 'enterprise_admin' OR email = 'designersworldcbe@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
    AND (role = 'enterprise_admin' OR email = 'designersworldcbe@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Drop and re-create policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
    DROP POLICY IF EXISTS "Enable insert access for admins" ON profiles;
    DROP POLICY IF EXISTS "Enable update access for admins" ON profiles;
    DROP POLICY IF EXISTS "Enable delete access for admins" ON profiles;
END $$;

CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for admins" ON profiles FOR INSERT WITH CHECK (is_admin() OR id = auth.uid()::text);
CREATE POLICY "Enable update access for admins" ON profiles FOR UPDATE USING (is_admin() OR id = auth.uid()::text);
CREATE POLICY "Enable delete access for admins" ON profiles FOR DELETE USING (is_admin());

-- Subscription Plans: Drop and re-create policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON subscription_plans;
    DROP POLICY IF EXISTS "Enable insert access for admins" ON subscription_plans;
    DROP POLICY IF EXISTS "Enable update access for admins" ON subscription_plans;
    DROP POLICY IF EXISTS "Enable delete access for admins" ON subscription_plans;
END $$;

CREATE POLICY "Enable read access for all users" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Enable insert access for admins" ON subscription_plans FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Enable update access for admins" ON subscription_plans FOR UPDATE USING (is_admin());
CREATE POLICY "Enable delete access for admins" ON subscription_plans FOR DELETE USING (is_admin());



