# Cloudflare Pages Deployment Guide

This project is now configured for deployment on Cloudflare Pages. Follow these steps to deploy your application.

## Prerequisites

1. A Cloudflare account (https://dash.cloudflare.com)
2. Your GitHub repository connected to Cloudflare
3. Environment variables configured in Cloudflare

## Cloudflare Pages Configuration

### Build Settings

- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Node.js Version**: 18.x or higher (set in `wrangler.toml`)

### Environment Variables

Set these in your Cloudflare Pages project dashboard:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_database_connection_string
```

### Deployment Steps

1. **Connect Repository**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Select "Connect to Git"
   - Authorize GitHub and select your repository

2. **Configure Build**
   - Select branch: `master` (or your preferred branch)
   - Build command: `npm run build`
   - Build output directory: `dist`

3. **Add Environment Variables**
   - Go to project settings → Environment Variables
   - Add all required variables listed above
   - Configure for "Production" environment

4. **Deploy**
   - Cloudflare will automatically build and deploy on push to selected branch
   - Check deployment logs at: Dashboard → Pages → Your Project → Deployments

## Project Structure

```
costinghub-app/
├── dist/                 # Build output (Cloudflare serves from here)
├── functions/            # Cloudflare Workers functions
│   └── api/
│       └── [[route]].ts # Dynamic API route handler
├── src/                  # Frontend source (React)
├── public/               # Static assets
├── _headers              # Cloudflare security and cache headers
├── _routes.json          # URL routing rules
├── wrangler.toml         # Cloudflare Workers config
├── vite.config.ts        # Vite build config
└── package.json          # Dependencies

```

## Key Features

### 1. API Routes (`functions/api/[[route]].ts`)
- Handles all `/api/*` requests
- Environment variables are available via `context.env`
- Supports CORS and all HTTP methods
- Auto-scaling with no cold starts

### 2. Static File Serving
- React SPA automatically served from `dist/`
- All routes redirect to `index.html` (SPA behavior)
- Cache policies configured in `_headers`

### 3. Routing Rules (`_routes.json`)
- Protects `/api/*` from being treated as static files
- Ensures React Router handles all non-API routes
- Excludes static asset extensions

## Local Development

### Development Server
```bash
npm install
npm run dev
```
Runs Vite dev server on `http://localhost:5173`

### Environment Setup
Create `.env.local` in project root:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## API Functions

### Provision Subscription (`/api/provision-subscription`)
- **Method**: POST
- **Body**: 
  ```json
  {
    "user_email": "user@example.com",
    "plan": "Standard|Pro|Team|Free",
    "expiry_date": "2026-12-31",
    "payment_id": "payment_123"
  }
  ```
- **Response**: `{ "success": true, "message": "Subscription provisioned" }`

## Monitoring & Troubleshooting

### View Logs
1. Dashboard → Pages → Your Project → Deployments
2. Click on a deployment to view logs
3. Check "Build Log" for build errors
4. Check "Runtime Logs" for API errors

### Common Issues

**Error: "Cannot find module"**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check `wrangler.toml` includes all necessary files

**Environment variables not available**
- Verify variables are set in Cloudflare dashboard
- Restart deployment after adding variables
- Use `VITE_` prefix for client-side variables

**API routes returning 404**
- Check `_routes.json` includes `/api/*`
- Verify function file path: `functions/api/[[route]].ts`
- Check function exports `onRequest` handler

## Best Practices

1. ✅ Always test locally before pushing
2. ✅ Use preview deployments for testing
3. ✅ Store secrets in Cloudflare dashboard (not in git)
4. ✅ Monitor build logs for warnings
5. ✅ Use meaningful commit messages
6. ✅ Set up branch protection rules on `master`

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Documentation](https://vitejs.dev/)
