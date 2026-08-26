import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ps = fs.readFileSync(path.join(root, 'APPLY_TEST_PUSH_FRONTEND.ps1'), 'utf8');
const failures = [];
const pass = (name, ok) => {
  if (ok) console.log(`PASS: ${name}`);
  else { console.log(`FAIL: ${name}`); failures.push(name); }
};

pass('public/tool-icons cleanup uses tracked-deletion helper', /Stage-TrackedDeletion\s+\$RepoPath\s+["']public\/tool-icons["']/.test(ps));
pass('unsafe direct git add -u public/tool-icons staging is removed', !/git\s+-C\s+\$RepoPath\s+add\s+-u\s+--\s+public\/tool-icons/.test(ps));
pass('tracked-deletion helper checks Git index before staging', /git\s+-C\s+\$Repository\s+ls-files\s+--\s+\$Normalized/.test(ps));
pass('tracked-deletion helper skips absent or untracked paths', /Skipping already-absent\/untracked cleanup path/.test(ps));
pass('tracked deletions still use git add -u', /git\s+-C\s+\$Repository\s+add\s+-u\s+--\s+\$Normalized/.test(ps));

if (failures.length) {
  console.error(`AJN PDF R9.7 safe directory staging verification failed with ${failures.length} issue(s).`);
  process.exit(1);
}
console.log('AJN PDF R9.7 SAFE DIRECTORY STAGING SOURCE VERIFICATION: PASS');
