import express from "express";
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;
// Link with Supabase PostgreSQL connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let dbInitialized = false;
let dbInitializationAttempted = false;

const FALLBACK_FILE = path.join(process.cwd(), 'data-fallback.json');

// Initialize the fallback store structure
let localStore: Record<string, any[]> = {
  profiles: [],
  calculations: [],
  materials: [],
  machines: [],
  processes: [],
  tools: [],
  feedback: [],
  region_costs: [],
  region_currency_map: [],
  subscription_plans: [],
  calculation_templates: []
};

function loadLocalStore() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
      localStore = JSON.parse(data);
      console.log('Loaded local fallback database with', Object.keys(localStore).length, 'tables.');
    } else {
      saveLocalStore();
    }
  } catch (err) {
    console.error('Failed to load local fallback store:', err);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local fallback store:', err);
  }
}

// Load local store immediately
loadLocalStore();

// Initialize database schema
async function initDb() {
  if (dbInitialized || dbInitializationAttempted) return;
  dbInitializationAttempted = true;
  try {
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'src/db/schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    // Ensure calculations table doesn't have restrictive FKs if profiles aren't synced
    await pool.query('ALTER TABLE calculations DROP CONSTRAINT IF EXISTS calculations_user_id_fkey');

    dbInitialized = true;
    console.log('Database schema initialized.');

    // Seed super admin
    const superAdminEmail = 'designersworldcbe@gmail.com';
    const existing = await pool.query('SELECT id FROM profiles WHERE email = $1', [superAdminEmail]);
    if (existing.rows.length === 0) {
       await pool.query(`
         INSERT INTO profiles (id, email, password, name, role, plan_name, subscription_status) 
         VALUES ('user_superadmin', $1, 'password', 'Super Admin', 'enterprise_admin', 'Enterprise', 'active')
       `, [superAdminEmail]);
       console.log('Super admin seeded.');
    }
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
}

const app = express();
app.use(express.json());

// Lazy DB initialization middleware on all API requests
app.use(async (req, res, next) => {
  if (!dbInitialized && req.path.startsWith('/api')) {
    await initDb();
  }
  next();
});

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(user);
  } catch (error: any) {
    console.warn(`[Fallback] Error login:`, error.message);
    const { email, password } = req.body;
    const user = (localStore.profiles || []).find((u: any) => u.email === email);
    if (!user) {
      // Auto-register or fallback seed check for default super admin
      if (email === 'designersworldcbe@gmail.com') {
        const seedUser = {
          id: 'user_superadmin',
          email,
          password: 'password',
          name: 'Super Admin',
          role: 'enterprise_admin',
          plan_name: 'Enterprise',
          subscription_status: 'active'
        };
        if (!localStore.profiles) localStore.profiles = [];
        localStore.profiles.push(seedUser);
        saveLocalStore();
        return res.json(seedUser);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(user);
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;
    const existing = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const id = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
    const queryText = `
      INSERT INTO profiles (id, email, password, name, company_name, role, plan_name, calculation_limit, subscription_status)
      VALUES ($1, $2, $3, $4, $5, 'user', 'Free', 5, 'active')
      RETURNING *
    `;
    const result = await pool.query(queryText, [id, email, password, name, companyName || '']);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.warn(`[Fallback] Error signup:`, error.message);
    const { email, password, name, companyName } = req.body;
    if (!localStore.profiles) localStore.profiles = [];
    const existing = localStore.profiles.find((u: any) => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const id = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
    const newUser = {
      id,
      email,
      password,
      name,
      company_name: companyName || '',
      role: 'user',
      plan_name: 'Free',
      calculation_limit: 5,
      subscription_status: 'active'
    };
    localStore.profiles.push(newUser);
    saveLocalStore();
    res.json(newUser);
  }
});

app.post("/api/calculations/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const result = await pool.query('UPDATE calculations SET approval_status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.warn(`[Fallback] Error approving calculation:`, error.message);
    const { id } = req.params;
    const { status } = req.body;
    if (localStore.calculations) {
      const index = localStore.calculations.findIndex((c: any) => c.id === id);
      if (index !== -1) {
        localStore.calculations[index].approval_status = status;
        saveLocalStore();
        res.json(localStore.calculations[index]);
        return;
      }
    }
    res.json({ id, approval_status: status });
  }
});

// Proxy for Anthropic Claude API to circumvent browser CORS restrictions
app.post("/api/ai/anthropic-proxy", async (req, res) => {
  try {
    const { model, prompt, system } = req.body;
    const apiKey = req.headers['x-user-api-key']?.toString();
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing Anthropic API Key header (x-user-api-key)' });
    }
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: system || "You are a helpful assistant.",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });
    
    const responseData: any = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: responseData.error?.message || 'Anthropic API failed' });
    }
    
    res.json(responseData);
  } catch (err: any) {
    console.error("Error in Anthropic proxy route:", err);
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.get("/api/:table", async (req, res) => {
  const { table } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM ${table}`);
    res.json(result.rows);
  } catch (error: any) {
    console.warn(`[Fallback] Error fetching from table ${table}:`, error.message);
    const list = localStore[table] || [];
    res.json(list);
  }
});

app.get("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    res.json(result.rows[0] || null);
  } catch (error: any) {
    console.warn(`[Fallback] Error fetching from ${table}/${id}:`, error.message);
    const list = localStore[table] || [];
    const found = list.find((item: any) => item.id === id);
    res.json(found || null);
  }
});

app.post("/api/:table", async (req, res) => {
  const { table } = req.params;
  const item = req.body;
  try {
    // Get valid columns for the table
    const columnsReq = await pool.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
      [table]
    );
    const validColumns = columnsReq.rows.map(row => row.column_name);

    // Filter and sanitize item
    const filteredItem: Record<string, any> = {};
    for (const key of Object.keys(item)) {
      if (validColumns.includes(key)) {
        let value = item[key];
        // Stringify if it's an object/array so it can be handled by PG JSONB
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        filteredItem[key] = value;
      }
    }

    const keys = Object.keys(filteredItem);
    const values = Object.values(filteredItem);
    
    // Determine conflict target: email for profiles, id otherwise
    const conflictTarget = table === 'profiles' ? 'email' : 'id';
    
    // Upsert logic for PostgreSQL with quoted identifiers
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const quotedKeys = keys.map(key => `"${key}"`).join(', ');
    
    // Exclude 'id' from updates if conflicting on email
    const updateKeys = table === 'profiles' ? keys.filter(k => k !== 'id') : keys;
    const updates = updateKeys.map(key => `"${key}" = EXCLUDED."${key}"`).join(', ');
    
    const queryText = `
      INSERT INTO ${table} (${quotedKeys})
      VALUES (${placeholders})
      ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates}
      RETURNING *
    `;
    
    const result = await pool.query(queryText, values);
    res.json(result.rows[0]);
  } catch (error: any) {
    console.warn(`[Fallback] Error upserting to ${table}:`, error.message);
    if (!localStore[table]) {
      localStore[table] = [];
    }
    
    const conflictTarget = table === 'profiles' ? 'email' : 'id';
    const index = localStore[table].findIndex((existing: any) => existing[conflictTarget] === item[conflictTarget]);
    
    if (index !== -1) {
      localStore[table][index] = { ...localStore[table][index], ...item };
      saveLocalStore();
      res.json(localStore[table][index]);
    } else {
      localStore[table].push(item);
      saveLocalStore();
      res.json(item);
    }
  }
});

app.delete("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  try {
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.warn(`[Fallback] Error deleting from ${table}/${id}:`, error.message);
    if (localStore[table]) {
      localStore[table] = localStore[table].filter((item: any) => item.id !== id);
      saveLocalStore();
    }
    res.json({ success: true });
  }
});

// Setup Vite middleware or static files asynchronously
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
    app.get("*all", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }
}

// Call setupVite immediately
setupVite().catch(err => console.error("Error setting up Vite:", err));

// Only run listener if not in Vercel Serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", async () => {
    await initDb();
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
