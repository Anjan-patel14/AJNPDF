import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skipDirs = new Set(['node_modules','.next','.git','.venv','__pycache__']);
const forbiddenNames = new Set(['.env.local','ajn_analytics.sqlite3','ajn_public_media.sqlite3','FULL_ACCEPTANCE_RESULTS.json','HTTP_ACCEPTANCE_RESULTS.json']);
const allowRuntimeArtifacts = process.env.AJN_ALLOW_RUNTIME_ARTIFACTS === '1';
const allowedTextExt = new Set(['.ts','.tsx','.js','.mjs','.cjs','.json','.py','.ps1','.md','.txt','.yml','.yaml','.css','.html','.toml','.ini','.gitignore']);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:AJN_ANALYTICS_ADMIN_TOKEN|AJN_MEDIA_ADMIN_TOKEN)\s*=\s*(?!\$|<|CHANGE|REPLACE|your-|generate-|$)[A-Za-z0-9_\-+/=]{20,}/i,
  /(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9_\-+/=]{24,}["']?/i,
  /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/i,
  /redis:\/\/[^\s:]+:[^\s@]+@/i,
  /vercel_blob_rw_[A-Za-z0-9_\-]{20,}/i];
const findings = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (skipDirs.has(ent.name)) continue;
    const file = path.join(dir, ent.name);
    const rel = path.relative(root, file).replaceAll('\\','/');
    if (ent.isDirectory()) { walk(file); continue; }
    if (forbiddenNames.has(ent.name)) {
      if (allowRuntimeArtifacts) continue;
      findings.push(`${rel}: generated/runtime file must not ship`);
      continue;
    }
    if (!allowedTextExt.has(path.extname(ent.name).toLowerCase()) && ent.name !== '.gitignore') continue;
    let text; try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    for (const pattern of patterns) if (pattern.test(text)) findings.push(`${rel}: matches ${pattern}`);
  }
}
walk(root);
if (findings.length) {
  console.error('FAIL: potential secrets/runtime artifacts found:\n' + findings.slice(0,30).join('\n'));
  process.exit(1);
}
console.log(allowRuntimeArtifacts
  ? 'PASS: source secret scan is clean; known local runtime artifacts were ignored for setup verification.'
  : 'PASS: source secret/runtime-artifact scan is clean.');
