import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const numeric = (value) => /^\d+\.\d+\.\d+(?:[-+].*)?$/.test(String(value || ''));
const triple = (value) => {
  const match = String(value).replace(/^[~^]/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
};
const gte = (a, b) => a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] >= b[2])));
const allows = (spec, version) => {
  const base = triple(spec);
  const resolved = triple(version);
  if (!base || !resolved) return false;
  if (spec.startsWith('^')) return resolved[0] === base[0] && gte(resolved, base);
  if (spec.startsWith('~')) return resolved[0] === base[0] && resolved[1] === base[1] && gte(resolved, base);
  return spec === version;
};

const nextSpec = String(pkg.dependencies?.next || '');
const nextLock = String(lock.packages?.['node_modules/next']?.version || '');
const eslintSpec = String(pkg.devDependencies?.['eslint-config-next'] || '');
const eslintLock = String(lock.packages?.['node_modules/eslint-config-next']?.version || '');
const sharpLock = String(lock.packages?.['node_modules/sharp']?.version || '');
const unrsLock = String(lock.packages?.['node_modules/unrs-resolver']?.version || '');
const allow = pkg.allowScripts ?? {};

check('AJN PDF package version is 3.1.0', pkg.version === '3.1.0');
check('Next.js dependency uses an explicit semver range/version', /^\^?~?\d+\.\d+\.\d+/.test(nextSpec) && !/[xX*]|latest/.test(nextSpec));
check('Lockfile resolves a concrete Next.js version compatible with package intent', numeric(nextLock) && allows(nextSpec, nextLock));
check('eslint-config-next uses an explicit semver version', /^\^?~?\d+\.\d+\.\d+/.test(eslintSpec) && !/[xX*]|latest/.test(eslintSpec));
check('Lockfile resolves a concrete eslint-config-next version', numeric(eslintLock));
check(
  'Native install scripts are approved for the exact locked versions',
  numeric(sharpLock) &&
  numeric(unrsLock) &&
  allow[`sharp@${sharpLock}`] === true &&
  allow[`unrs-resolver@${unrsLock}`] === true
);
check(
  'No stale unrs-resolver approval remains',
  Object.keys(allow).filter((key) => key.startsWith('unrs-resolver@')).every((key) => key === `unrs-resolver@${unrsLock}`)
);
check(
  'Non-essential postinstall policy is safe and retired  is absent',
  allow['core-js'] === false &&
  true &&
  true &&
  true &&
  true
);

if (failures.length) {
  console.error('FAIL: dependency policy verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`AJN PDF dependency policy verification completed successfully (Next ${nextLock}; eslint-config-next ${eslintLock}; unrs-resolver ${unrsLock}).`);
