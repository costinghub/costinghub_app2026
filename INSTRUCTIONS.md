# Supabase Guest Mode Setup

Since authentication has been removed, the application uses a hardcoded Guest ID: `00000000-0000-0000-0000-000000000000`.

To see data in your dashboard and allow the app to save calculations, you **must** run the following SQL script in your Supabase SQL Editor.

## SQL Setup Script

```sql
-- 1. Create a profile for the Guest User
INSERT INTO profiles (id, email, name, plan_name, calculation_limit, calculations_used, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000000', 'guest@costinghub.com', 'Guest User', 'Enterprise', -1, 0, 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Update RLS Policies to allow public (anon) access for the Guest ID
-- Repeat this for all relevant tables (calculations, materials, machines, tools, region_costs)

CREATE POLICY "Allow anon access to Guest calculations" ON calculations 
FOR ALL TO anon USING (user_id = '00000000-0000-0000-0000-000000000000') 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Allow anon access to Guest materials" ON materials 
FOR ALL TO anon USING (user_id = '00000000-0000-0000-0000-000000000000' OR user_id IS NULL) 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Allow anon access to Guest machines" ON machines 
FOR ALL TO anon USING (user_id = '00000000-0000-0000-0000-000000000000' OR user_id IS NULL) 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Allow anon access to Guest tools" ON tools 
FOR ALL TO anon USING (user_id = '00000000-0000-0000-0000-000000000000' OR user_id IS NULL) 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Allow anon access to Guest region_costs" ON region_costs 
FOR ALL TO anon USING (user_id = '00000000-0000-0000-0000-000000000000') 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- 3. Seed a Sample Calculation for the Guest User
INSERT INTO calculations (id, user_id, status, inputs, created_at)
VALUES (
  'sample-guest-calc-001', 
  '00000000-0000-0000-0000-000000000000', 
  'draft', 
  '{
    "calculationNumber": "EST-101",
    "partNumber": "DEMO-PART-01",
    "partName": "Initial Sample Job",
    "customerName": "Demo Customer",
    "revision": "A",
    "annualVolume": 1000,
    "batchVolume": 100,
    "createdAt": "' || now()::text || '",
    "unitSystem": "Metric",
    "region": "USA",
    "currency": "USD",
    "materialCategory": "N - Non-ferrous",
    "materialType": "mat_011",
    "rawMaterialProcess": "Billet",
    "billetShape": "Block",
    "billetShapeParameters": {"length": 100, "width": 100, "height": 50},
    "rawMaterialWeightKg": 1.35,
    "finishedPartWeightKg": 0.8,
    "partSurfaceAreaM2": 0.04,
    "materialCostPerKg": 4.5,
    "materialDensityGcm3": 2.7,
    "setups": [],
    "markups": {"general": 8, "admin": 5, "sales": 2, "miscellaneous": 1, "packing": 5, "transport": 5, "profit": 20, "duty": 0}
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;
```

## Troubleshooting
If the dashboard is still empty:
1. Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct in your environment variables.
2. Confirm that the SQL above was executed successfully in the SQL Editor.
3. Check the browser console (F12) for any `403 Forbidden` or `PGRST116` errors, which indicate RLS is still blocking requests.
