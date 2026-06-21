# Supabase Relational Schema for Casting & Forging Costing

This schema provides highly structured relational tables for **Casting Costing** and **Forging Costing** calculations. By storing each cost driver and parameter in individual table columns (instead of singular `JSONB` blobs), you build a robust data platform ready for:
* **Advanced Multi-site BI Analytics** (PowerBI, Tableau, Supabase Charts)
* **Direct SQL Queries & Performance Indexing**
* **Seamless ERP/MRP integration** (SAP, Oracle, NetSuite, etc.)

---

## 🗂️ Table Schemas Overview

We introduce two clean master tables:
1. `casting_calculations`: Dedicated columns for molten metal weight, yields, pattern/die costs, binder rates, molding/pouring/fettling operations, and final should-cost output values.
2. `forging_calculations`: Dedicated columns for raw billet sizing, scale evaporation losses, shearing cutting, press tonnage strike setups, trims, and final forging yield metrics.

Both tables cleanly reference the standard `profiles` user credentials.

---

## 🚀 Supabase SQL Script
Paste the following DDL script directly inside the **Supabase SQL Editor**:

```sql
-- Create Casting Costing table with robust relational types
CREATE TABLE IF NOT EXISTS public.casting_calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft' | 'final'
    approval_status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    is_hidden BOOLEAN DEFAULT FALSE,
    calculation_number TEXT NOT NULL,
    part_number TEXT NOT NULL,
    part_name TEXT NOT NULL,
    customer_name TEXT,
    revision TEXT,
    annual_volume NUMERIC,
    batch_volume NUMERIC,
    unit_system TEXT DEFAULT 'Metric', -- 'Metric' | 'Imperial'
    region TEXT,
    currency TEXT,
    
    -- Casting Material Info
    material_category TEXT,       -- e.g. "Ferrous", "Non-Ferrous"
    material_type TEXT,           -- e.g. "Grey Cast Iron", "Ductile Iron", "Cast Aluminum"
    raw_material_weight_kg NUMERIC, 
    finished_part_weight_kg NUMERIC,
    material_cost_per_kg NUMERIC,
    material_density_gcm3 NUMERIC,
    
    -- Casting Process Yield Metrics
    casting_process TEXT,         -- 'Sand Casting' | 'Pressure Die Casting' | 'Investment Casting' | 'Permanent Mold'
    yield_rate NUMERIC,           -- e.g. 0.60 for 60%
    scrap_return_value_percent NUMERIC,
    scrap_return_rate NUMERIC,
    
    -- Pattern & Core Tooling Drivers
    pattern_cost NUMERIC,
    pattern_life_shots NUMERIC,
    cores_used BOOLEAN DEFAULT FALSE,
    core_weight_kg NUMERIC,
    core_material_cost_per_kg NUMERIC,
    core_binder_cost_per_kg NUMERIC,
    
    -- Operational Process Cycles
    melting_cost_per_kg NUMERIC,
    molding_cycle_time_min NUMERIC,
    molding_hourly_rate NUMERIC,
    pouring_time_sec NUMERIC,
    pouring_hourly_rate NUMERIC,
    fettling_time_min NUMERIC,
    fettling_hourly_rate NUMERIC,
    inspection_cost_per_part NUMERIC,
    heat_treatment_cost_per_part NUMERIC,
    
    -- Dynamic Lists
    surface_treatments JSONB DEFAULT '[]'::jsonb,
    markups JSONB DEFAULT '{}'::jsonb,
    
    -- Calculated Output Columns
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
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Forging Costing table with robust relational types
CREATE TABLE IF NOT EXISTS public.forging_calculations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft' | 'final'
    approval_status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    is_hidden BOOLEAN DEFAULT FALSE,
    calculation_number TEXT NOT NULL,
    part_number TEXT NOT NULL,
    part_name TEXT NOT NULL,
    customer_name TEXT,
    revision TEXT,
    annual_volume NUMERIC,
    batch_volume NUMERIC,
    unit_system TEXT DEFAULT 'Metric', -- 'Metric' | 'Imperial'
    region TEXT,
    currency TEXT,
    
    -- Forging Material Info
    material_category TEXT,       -- e.g. "Alloy Steel", "Carbon Steel"
    material_type TEXT,           -- e.g. "AISI 4140", "AISI 1045", "Aluminum 6061"
    finished_part_weight_kg NUMERIC,
    material_cost_per_kg NUMERIC,
    material_density_gcm3 NUMERIC,
    
    -- Forging Specific Yield / Parameters
    forging_process TEXT,         -- 'Closed Die Forging' | 'Open Die Forging' | 'Ring Rolling' | 'Warm/Cold Forging'
    yield_rate NUMERIC,           -- e.g. 0.75 for 75%
    scale_loss_percent NUMERIC,   -- e.g. 0.03 for 3% furnace oxidization
    scrap_return_value_percent NUMERIC,
    scrap_return_rate NUMERIC,
    
    -- Tooling & Dies Amortization
    die_cost NUMERIC,
    die_life_shots NUMERIC,
    
    -- Operational press speeds & furnace heating
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
    
    -- Dynamic Lists
    surface_treatments JSONB DEFAULT '[]'::jsonb,
    markups JSONB DEFAULT '{}'::jsonb,
    
    -- Calculated Output Columns
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
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Security & Row Level Access Setup (RLS)
-- ==========================================

-- Disable RLS by default to allow seamless applet client-side reads
ALTER TABLE public.casting_calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.forging_calculations DISABLE ROW LEVEL SECURITY;

-- Permissive Backup Policies if RLS is accidentally enabled
DROP POLICY IF EXISTS "Enable read access for all" ON public.casting_calculations;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.casting_calculations;
DROP POLICY IF EXISTS "Enable update access for all" ON public.casting_calculations;
DROP POLICY IF EXISTS "Enable delete access for all" ON public.casting_calculations;

CREATE POLICY "Enable read access for all" ON public.casting_calculations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON public.casting_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all" ON public.casting_calculations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all" ON public.casting_calculations FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all" ON public.forging_calculations;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.forging_calculations;
DROP POLICY IF EXISTS "Enable update access for all" ON public.forging_calculations;
DROP POLICY IF EXISTS "Enable delete access for all" ON public.forging_calculations;

CREATE POLICY "Enable read access for all" ON public.forging_calculations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON public.forging_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all" ON public.forging_calculations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all" ON public.forging_calculations FOR DELETE USING (true);

-- ==========================================
-- Database Indexes for Ultra-Fast Analytics
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_casting_calculations_user ON public.casting_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_casting_calculations_part ON public.casting_calculations(part_number);
CREATE INDEX IF NOT EXISTS idx_forging_calculations_user ON public.forging_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_forging_calculations_part ON public.forging_calculations(part_number);
```

---

## 🏗️ Relationship Diagram

```
   ┌──────────────────┐
   │     profiles     │
   ├──────────────────┤
   │ id (PK)          │
   │ email            │
   └────────┬─────────┘
            │
            ├───────────────────────────────┐
            ▼ 1:N                           ▼ 1:N
 ┌──────────────────────┐        ┌──────────────────────┐
 │ casting_calculations │        │ forging_calculations │
 ├──────────────────────┤        ├──────────────────────┤
 │ id (PK)              │        │ id (PK)              │
 │ user_id (FK) ────────┼┐       │ user_id (FK) ────────┼┐
 │ calculation_number   ││       │ calculation_number   ││
 │ part_number          ││       │ part_number          ││
 │ material_type        ││       │ material_type        ││
 │ yield_rate           ││       │ yield_rate           ││
 │ result_total_cost    ││       │ result_total_cost    ││
 │ result_cost_per_part ││       │ result_cost_per_part ││
 └──────────────────────┘│       └──────────────────────┘│
                         │                               │
                         ▼                               ▼
                 [ profiles.id ]                 [ profiles.id ]
```

---

## ⚡ How to sync this in the Application Code

When updating the database service / client code to save direct columns instead of generalized JSONB:

```typescript
// Example Insertion mapping for casting
const insertCastingToSupabase = async (calc: CastingCalculation) => {
  const data = {
    id: calc.id,
    user_id: calc.user_id,
    name: calc.name,
    status: calc.status,
    approval_status: calc.approval_status,
    calculation_number: calc.inputs.calculationNumber,
    part_number: calc.inputs.partNumber,
    part_name: calc.inputs.partName,
    customer_name: calc.inputs.customerName,
    revision: calc.inputs.revision,
    annual_volume: calc.inputs.annualVolume,
    batch_volume: calc.inputs.batchVolume,
    unit_system: calc.inputs.unitSystem,
    region: calc.inputs.region,
    currency: calc.inputs.currency,
    
    material_category: calc.inputs.materialCategory,
    material_type: calc.inputs.materialType,
    raw_material_weight_kg: calc.inputs.rawMaterialWeightKg,
    finished_part_weight_kg: calc.inputs.finishedPartWeightKg,
    material_cost_per_kg: calc.inputs.materialCostPerKg,
    material_density_gcm3: calc.inputs.materialDensityGcm3,
    
    casting_process: calc.inputs.castingProcess,
    yield_rate: calc.inputs.yieldRate,
    scrap_return_value_percent: calc.inputs.scrapReturnValuePercent,
    scrap_return_rate: calc.inputs.scrapReturnRate,
    
    pattern_cost: calc.inputs.patternCost,
    pattern_life_shots: calc.inputs.patternLifeShots,
    cores_used: calc.inputs.coresUsed,
    core_weight_kg: calc.inputs.coreWeightKg,
    core_material_cost_per_kg: calc.inputs.coreMaterialCostPerKg,
    core_binder_cost_per_kg: calc.inputs.coreBinderCostPerKg,
    
    melting_cost_per_kg: calc.inputs.meltingCostPerKg,
    molding_cycle_time_min: calc.inputs.moldingCycleTimeMin,
    molding_hourly_rate: calc.inputs.moldingHourlyRate,
    pouring_time_sec: calc.inputs.pouringTimeSec,
    pouring_hourly_rate: calc.inputs.pouringHourlyRate,
    fettling_time_min: calc.inputs.fettlingTimeMin,
    fettling_hourly_rate: calc.inputs.fettlingHourlyRate,
    inspection_cost_per_part: calc.inputs.inspectionCostPerPart,
    heat_treatment_cost_per_part: calc.inputs.heatTreatmentCostPerPart,
    
    surface_treatments: JSON.stringify(calc.inputs.surfaceTreatments),
    markups: JSON.stringify(calc.inputs.markups),
    
    // Results
    result_poured_weight_kg: calc.results?.pouredWeightKg,
    result_scrap_weight_kg: calc.results?.scrapWeightKg,
    result_raw_material_part_cost: calc.results?.rawMaterialPartCost,
    result_scrap_credit_per_part: calc.results?.scrapCreditPerPart,
    result_net_material_cost_per_part: calc.results?.netMaterialCostPerPart,
    result_melting_cost_per_part: calc.results?.meltingCostPerPart,
    result_molding_cost_per_part: calc.results?.moldingCostPerPart,
    result_pouring_cost_per_part: calc.results?.pouringCostPerPart,
    result_core_cost_per_part: calc.results?.coreCostPerPart,
    result_fettling_cost_per_part: calc.results?.fettlingCostPerPart,
    result_tooling_amortized_cost_per_part: calc.results?.toolingAmortizedCostPerPart,
    result_surface_treatment_cost: calc.results?.surfaceTreatmentCost,
    result_base_manufacturing_cost: calc.results?.baseManufacturingCost,
    result_markup_costs: JSON.stringify(calc.results?.markupCosts),
    result_total_cost: calc.results?.totalCost,
    result_cost_per_part: calc.results?.costPerPart,
  };

  // Perform database insert through Supabase client
  const { error } = await supabase.from('casting_calculations').upsert(data);
  if (error) throw error;
};
```
