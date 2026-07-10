const { execFileSync } = require('node:child_process');

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

function runNpm(args) {
  if (process.env.npm_execpath) {
    run(process.execPath, [process.env.npm_execpath, ...args]);
    return;
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npmCommand, args);
}

try {
  console.log('======================================================');
  console.log('⚙️  RUNNING DEPLOYMENT DEPENDENCY RESOLVER');
  console.log('======================================================');

  console.log('📦 Setting legacy-peer-deps configuration...');
  runNpm(['config', 'set', 'legacy-peer-deps', 'true']);

  console.log('🔒 Syncing package-lock.json with package.json...');
  runNpm(['install', '--package-lock-only', '--legacy-peer-deps']);

  console.log('✅ Dependency setup complete!');
  console.log('======================================================');
} catch (error) {
  console.error('Dependency setup failed.');
  process.exit(error.status || 1);
}
