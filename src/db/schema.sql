-- CostingHub Neon PostgreSQL Schema

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    "companyName" TEXT,
    calculations_created_this_period INTEGER DEFAULT 0,
    calculation_limit INTEGER DEFAULT -1,
    plan_name TEXT DEFAULT 'Free',
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safely add newly introduced columns for profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='password') THEN
        ALTER TABLE profiles ADD COLUMN password TEXT;
        ALTER TABLE profiles ADD COLUMN company_name TEXT;
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        ALTER TABLE profiles ADD COLUMN enterprise_id TEXT;
        ALTER TABLE profiles ADD COLUMN subscription_expires_on TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gemini_api_key') THEN
        ALTER TABLE profiles ADD COLUMN gemini_api_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='claude_api_key') THEN
        ALTER TABLE profiles ADD COLUMN claude_api_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='openai_api_key') THEN
        ALTER TABLE profiles ADD COLUMN openai_api_key TEXT;
    END IF;
END $$;

-- Calculations table
CREATE TABLE IF NOT EXISTS calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    inputs JSONB NOT NULL,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safely add newly introduced columns for calculations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='approval_status') THEN
        ALTER TABLE calculations ADD COLUMN approval_status TEXT DEFAULT 'pending';
        ALTER TABLE calculations ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='is_hidden') THEN
        ALTER TABLE calculations ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='duration_seconds') THEN
        ALTER TABLE calculations ADD COLUMN duration_seconds INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='parent_id') THEN
        ALTER TABLE calculations ADD COLUMN parent_id TEXT DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='revision_number') THEN
        ALTER TABLE calculations ADD COLUMN revision_number INTEGER DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='calculatorType') THEN
        ALTER TABLE calculations ADD COLUMN "calculatorType" TEXT DEFAULT 'machining';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='calculator_type') THEN
        ALTER TABLE calculations ADD COLUMN calculator_type TEXT DEFAULT 'machining';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculations' AND column_name='calculator_module') THEN
        ALTER TABLE calculations ADD COLUMN calculator_module TEXT DEFAULT 'machining';
    END IF;
END $$;

-- Casting Calculations Table
CREATE TABLE IF NOT EXISTS casting_calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
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
    user_id TEXT,
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

-- Safely add newly introduced columns for masters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='module') THEN
        ALTER TABLE materials ADD COLUMN module TEXT DEFAULT 'machining';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='machines' AND column_name='module') THEN
        ALTER TABLE machines ADD COLUMN module TEXT DEFAULT 'machining';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tools' AND column_name='module') THEN
        ALTER TABLE tools ADD COLUMN module TEXT DEFAULT 'machining';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='module') THEN
        ALTER TABLE processes ADD COLUMN module TEXT DEFAULT 'machining';
    END IF;
END $$;

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    "subCategory" TEXT,
    density_gcm3 NUMERIC,
    properties JSONB,
    module TEXT DEFAULT 'machining',
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
    module TEXT DEFAULT 'machining',
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
    module TEXT DEFAULT 'machining',
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
    module TEXT DEFAULT 'machining',
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

-- Calculation Templates table
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

CREATE TABLE IF NOT EXISTS calculation_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    setups JSONB NOT NULL,
    markups JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
