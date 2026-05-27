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

// Initialize database schema
async function initDb() {
  if (dbInitialized) return;
  try {
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/calculations/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const result = await pool.query('UPDATE calculations SET approval_status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.get("/api/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const result = await pool.query(`SELECT * FROM ${table}`);
    res.json(result.rows);
  } catch (error: any) {
    console.error(`Error fetching from ${req.params.table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/:table/:id", async (req, res) => {
  try {
    const { table, id } = req.params;
    const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    res.json(result.rows[0] || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const item = req.body;

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
    console.error(`Error upserting to ${req.params.table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/:table/:id", async (req, res) => {
  try {
    const { table, id } = req.params;
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
