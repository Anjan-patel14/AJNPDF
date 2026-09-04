import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const eslintCli = resolve(projectRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
const eslintConfig = resolve(projectRoot, 'eslint.config.mjs');

if (!existsSync(eslintCli)) {
  console.error(`ESLint CLI was not found at ${eslintCli}. Run npm ci first.`);
  process.exit(1);
}
if (!existsSync(eslintConfig)) {
  console.error(`Flat ESLint config was not found at ${eslintConfig}.`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    eslintCli,
    '--config',
    eslintConfig,
    'src',
    'scripts',
    '--max-warnings',
    '0',
    '--report-unused-disable-directives',
  ],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'true' },
    windowsHide: true,
  },
);

if (result.error) {
  console.error('Failed to launch ESLint:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
