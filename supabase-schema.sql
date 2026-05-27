-- Drop existing tables so we can recreate them correctly
DROP TABLE IF EXISTS region_currency_map CASCADE;
DROP TABLE IF EXISTS region_costs CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS calculation_templates CASCADE;
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



