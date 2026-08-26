import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const readJsonPath = (filePath) => { try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return null; } };
const readJson = (name) => readJsonPath(path.join(root, name));
const built = process.env.AJN_R13_BUILT_REPORT ? readJsonPath(process.env.AJN_R13_BUILT_REPORT) : readJson('R13_BUILT_RUNTIME_REPORT.json');
const caps = process.env.AJN_R13_CAPABILITY_REPORT ? readJsonPath(process.env.AJN_R13_CAPABILITY_REPORT) : readJson('R13_CAPABILITY_REPORT.json');
const live = process.env.AJN_R13_LIVE_REPORT_DIR ? readJsonPath(path.join(process.env.AJN_R13_LIVE_REPORT_DIR, 'R13_LIVE_AUDIT_RESULT.json')) : readJson('R13_LIVE_AUDIT_RESULT.json');
let commit = 'unknown';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
const localGates = process.env.AJN_R13_LOCAL_GATES || (built && !(built.failures||[]).length ? 'PASS' : 'PENDING');
const browserGate = process.env.AJN_R13_BROWSER_GATE || 'PENDING';
const backendAcceptance = process.env.AJN_R13_BACKEND_ACCEPTANCE || 'PENDING';
const output = process.env.AJN_R13_FINAL_REPORT || path.join(root, 'AJN-PDF-R13-PRODUCTION-FINAL-REPORT.md');
const unavailable = caps?.unavailable || caps?.unavailableCapabilities || [];
const livePass = live && live.summary?.failures === 0;
const lines = [
  '# AJN PDF R13 Production Final Report','',
  `Generated: ${new Date().toISOString()}`,
  `Git commit: ${commit}`,'',
  '## Local release gates',
  `- Source / lint / TypeScript / build / built-runtime gates: **${localGates}**`,
  `- Real Chrome/Edge layout automation: **${browserGate}**`,
  `- Existing-backend acceptance harness: **${backendAcceptance}**`,
  `- Built canonical tool routes: **${built ? `${built.canonicalTools?.filter(x=>x.ok).length || 0}/${built.canonicalTools?.length || 0}` : 'PENDING'}**`,
  `- Built legacy redirects: **${built ? `${built.legacyTools?.filter(x=>x.ok).length || 0}/${built.legacyTools?.length || 0}` : 'PENDING'}**`,
  '', '## Capability report',
  `- Unavailable backend capabilities reported by current target manifest: **${unavailable.length}**`,
  ...(unavailable.length ? unavailable.map((item) => `- ${typeof item === 'string' ? item : `${item.id || item.tool || 'unknown'}${item.reason ? ` — ${item.reason}` : ''}`}`) : ['- Exact target manifest report is generated during installation.']),
  '', '## Deployed production',
  `- R13 live HTTP audit: **${livePass ? 'PASS' : live ? 'FAIL' : 'PENDING'}**`,
  `- Live canonical root pages: **${live ? `${live.summary?.canonicalPass || 0}/${live.summary?.canonicalToolCount || 0}` : 'PENDING'}**`,
  `- Live legacy redirects: **${live ? `${live.summary?.legacyRedirectPass || 0}/${live.summary?.canonicalToolCount || 0}` : 'PENDING'}**`,
  '- Vercel R13 marker: checked by the live audit; remains PENDING until the deployed homepage exposes `ajn-release=3.1.0-r13`.',
  '', '## Manual / field gates',
  '- 100/110/125/150/200% visual zoom review: **PENDING until rendered browser audit/manual confirmation**',
  '- Merge/Protect/Unlock + six-language server  production workflows: **PENDING until live backend files are tested**',
  '- Field Core Web Vitals (LCP/CLS/INP): **PENDING**',
  '- CMP / AdSense / CSP visual behavior: **PENDING**',
  '- Search Console sitemap/priority inspections and recrawl: **PENDING**',
  '- Chrome Web Store external review: **PENDING**',
  '- Durable long-lived media/analytics migration, if still needed: **PENDING / non-blocking web release infrastructure work**',
  '', '## Production-final rule',
  'Do not label AJN PDF “Production Final” solely from this source/build report. The deployed release marker, live redirects/canonicals and critical real workflows must also pass.'];
fs.writeFileSync(output, `${lines.join('\n')}\n`);
console.log(`R13 final report: ${output}`);
