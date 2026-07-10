import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import pg from 'pg';
import { createClient } from "@supabase/supabase-js";

type Bindings = {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MARKETING_WEBHOOK_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Database pool helper (for direct Postgres/Neon access)
let pool: pg.Pool | null = null;

function getPool(databaseUrl: string) {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

// Plan Specs for provision-subscription
const PLAN_SPECS = {
  Free: {
    calculation_limit: 5,
    features: { 
      can_export_pdf: false, 
      can_export_excel: false, 
      can_use_cnc_costing: true, 
      can_use_should_costing: false, 
      can_manage_team: false, 
      max_team_members: 0 
    },
  },
  Standard: { // "Pro" in UI
    calculation_limit: 50,
    features: { 
      can_export_pdf: true, 
      can_export_excel: false, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: false, 
      max_team_members: 0 
    },
  },
  Pro: { // "Premium" / Unlimited
    calculation_limit: -1, 
    features: { 
      can_export_pdf: true, 
      can_export_excel: true, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: false, 
      max_team_members: 0 
    },
  },
  Team: { // "Enterprise"
    calculation_limit: -1, 
    features: { 
      can_export_pdf: true, 
      can_export_excel: true, 
      can_use_cnc_costing: true, 
      can_use_should_costing: true, 
      can_manage_team: true, 
      max_team_members: 5 
    },
  },
};

// Subscription Provisioning
app.post("/provision-subscription", async (c) => {
  const authHeader = c.req.header("Authorization");
  const providedSecret = authHeader?.split("Bearer ")[1];
  
  if (!providedSecret || providedSecret !== c.env.MARKETING_WEBHOOK_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await c.req.json();
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const planSpec = (PLAN_SPECS as any)[payload.plan] || PLAN_SPECS['Free'];

    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", payload.user_email)
      .maybeSingle();

    if (userError || !user) throw new Error("User not found");
    
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan_name: payload.plan,
        subscription_status: "active",
        subscription_expires_on: payload.expiry_date,
        calculation_limit: planSpec.calculation_limit,
        features: planSpec.features,
        calculations_used: 0,
        usage_reset_on: nextResetDate.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return c.json({ status: "ok" });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Generic Table Routes
app.get("/:table", async (c) => {
  const table = c.req.param('table');
  try {
    const db = getPool(c.env.DATABASE_URL);
    const result = await db.query(`SELECT * FROM ${table}`);
    return c.json(result.rows);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/:table/:id", async (c) => {
  const { table, id } = c.req.param();
  try {
    const db = getPool(c.env.DATABASE_URL);
    const result = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return c.json(result.rows[0] || null);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/:table", async (c) => {
  const table = c.req.param('table');
  const item = await c.req.json();
  try {
    const db = getPool(c.env.DATABASE_URL);
    const keys = Object.keys(item);
    const values = Object.values(item);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(k => `"${k}"`).join(', ');
    
    const conflictTarget = table === 'profiles' ? 'email' : 'id';
    const updates = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
    
    const queryText = `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates}
      RETURNING *
    `;
    
    const result = await db.query(queryText, values);
    return c.json(result.rows[0]);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/:table/:id", async (c) => {
  const { table, id } = c.req.param();
  try {
    const db = getPool(c.env.DATABASE_URL);
    await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export const onRequest = handle(app);
