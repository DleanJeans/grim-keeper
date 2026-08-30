import { spawnSync } from 'node:child_process';

process.env.EXPO_PUBLIC_DEPLOYED_AT = new Date().toISOString();

function run(command, args) {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['exec', 'expo', 'export', '--platform', 'web', '--clear']);
run('eas', ['deploy', ...process.argv.slice(2)]);
