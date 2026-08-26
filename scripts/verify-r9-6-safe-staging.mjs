import fs from 'node:fs';

const file = fs.readFileSync('APPLY_TEST_PUSH_FRONTEND.ps1', 'utf8');
const checks = [
  ['tracked-deletion helper exists', /function Stage-TrackedDeletion\(/],
  ['deletion helper checks git tracking', /git -C \$Repository ls-files -- \$Normalized/],
  ['already absent paths are skipped', /Skipping already-absent\/untracked cleanup path/],
  ['tracked deletions still use git add -u', /git -C \$Repository add -u -- \$Normalized/],
  ['deleted frontend loop uses safe helper', /foreach \(\$Relative in \$DeletedFrontendFiles\) \{\s*Stage-TrackedDeletion \$RepoPath \$Relative\s*\}/s]];
let failures = 0;
for (const [name, re] of checks) {
  if (re.test(file)) console.log(`PASS: ${name}`);
  else { console.error(`FAIL: ${name}`); failures += 1; }
}
if (failures) process.exit(1);
console.log('AJN PDF R9.6 SAFE DELETION STAGING SOURCE VERIFICATION: PASS');
