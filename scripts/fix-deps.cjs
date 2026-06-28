const { execFileSync } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

try {
  console.log('======================================================');
  console.log('⚙️  RUNNING DEPLOYMENT DEPENDENCY RESOLVER');
  console.log('======================================================');

  console.log('📦 Setting legacy-peer-deps configuration...');
  run(npmCommand, ['config', 'set', 'legacy-peer-deps', 'true']);

  console.log('🔒 Syncing package-lock.json with package.json...');
  run(npmCommand, ['install', '--package-lock-only', '--legacy-peer-deps']);

  console.log('✅ Dependency setup complete!');
  console.log('======================================================');
} catch (error) {
  console.error('Dependency setup failed.');
  process.exit(error.status || 1);
}
