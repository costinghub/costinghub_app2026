-- CostingHub Neon PostgreSQL Schema

-- Materials Table
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    sub_category TEXT,
    density_gcm3 DOUBLE PRECISION,
    base_cost_per_kg DOUBLE PRECISION,
    currency TEXT,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Machines Table
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    power_kw DOUBLE PRECISION,
    hourly_rate DOUBLE PRECISION,
    currency TEXT,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tools Table
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    cost DOUBLE PRECISION,
    life_minutes DOUBLE PRECISION,
    currency TEXT,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Processes Table
CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "group" TEXT,
    "compatibleMachineTypes" JSONB,
    parameters JSONB,
    formula TEXT,
    "imageUrl" TEXT,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Region Currencies map table
CREATE TABLE IF NOT EXISTS region_currency_map (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    currency TEXT NOT NULL,
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT,
    company_name TEXT,
    role TEXT DEFAULT 'user',
    enterprise_id TEXT,
    plan_name TEXT,
    subscription_status TEXT,
    subscription_expires_on TEXT,
    calculation_limit INTEGER,
    calculations_created_this_period INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calculations Table
CREATE TABLE IF NOT EXISTS calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    inputs JSONB,
    results JSONB,
    approval_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Calculation Templates Table
CREATE TABLE IF NOT EXISTS calculation_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    setups JSONB NOT NULL,
    markups JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
