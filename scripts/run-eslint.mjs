import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const eslintCli = resolve('node_modules', 'eslint', 'bin', 'eslint.js');
if (!existsSync(eslintCli)) {
  console.error(`ESLint CLI was not found at ${eslintCli}. Run npm ci first.`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    eslintCli,
    'src',
    'scripts',
    '--max-warnings',
    '0',
    '--report-unused-disable-directives'],
  {
    stdio: 'inherit',
    env: { ...process.env },
    windowsHide: true,
  },
);

if (result.error) {
  console.error('Failed to launch ESLint:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
