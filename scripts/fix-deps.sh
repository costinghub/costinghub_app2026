#!/bin/bash
# This script enforces --legacy-peer-deps and ensures package-lock.json is synchronized
# to prevent ERESOLVE and EUSAGE errors in Vercel, Cloudflare Pages, or other CI environments.

echo "======================================================"
echo "⚙️  RUNNING DEPLOYMENT DEPENDENCY RESOLVER"
echo "======================================================"

# 1. Force global & local npm configuration for legacy peer deps
echo "📦 Setting legacy-peer-deps configuration..."
npm config set legacy-peer-deps true

# 2. Check if we need to regenerate or sync the lockfile
if [ -f "package-lock.json" ]; then
  echo "🔒 Syncing package-lock.json with package.json..."
  # Regenerates/syncs the lockfile with legacy-peer-deps allowed
  npm install --package-lock-only --legacy-peer-deps
else
  echo "⚠️  No package-lock.json found. Creating one..."
  npm install --package-lock-only --legacy-peer-deps
fi

echo "✅ Dependency setup complete!"
echo "======================================================"
