import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const failures = [];
const check = (label, ok) => ok ? console.log(`PASS: ${label}`) : failures.push(label);

const layout = read('src/app/layout.tsx');
const ga = read('src/components/analytics/google-analytics.tsx');
const site = read('src/components/analytics/site-analytics.tsx');
const backend = read('backend/app/main.py');
const env = read('.env.example');

check('Google Analytics component is mounted globally', layout.includes('<GoogleAnalytics />'));
check('site analytics component is mounted globally', layout.includes('<SiteAnalytics />'));
check('GA4 is environment-configured and consent gated', ga.includes('NEXT_PUBLIC_GA4_MEASUREMENT_ID') && ga.includes("ajn_cookie_consent") && ga.includes("accepted"));
check('GA4 disables Google signals and ad personalization signals', ga.includes('allow_google_signals: false') && ga.includes('allow_ad_personalization_signals: false'));
check('Core Web Vitals are measured after consent', site.includes('useReportWebVitals') && site.includes("event_name: 'web_vital'"));
check('tool funnel events are represented', ['tool_open','tool_start','tool_complete','tool_error','download'].every((name) => site.includes(`'${name}'`)));
check('analytics payload strips query strings and fragments', site.includes("event.path.split('?')[0].split('#')[0]"));
check('backend analytics is rate-limited and retention bounded', backend.includes('AJN_ANALYTICS_RATE_LIMIT_PER_MINUTE') && backend.includes('AJN_ANALYTICS_RETENTION_DAYS'));
check('backend analytics privacy report excludes document contents, filenames and IP persistence', backend.includes("'document_contents_stored': False") && backend.includes("'filenames_stored': False") && backend.includes("'ip_addresses_stored': False"));
check('analytics admin endpoint requires a timing-safe token check', backend.includes("@app.get('/api/admin/analytics')") && backend.includes('secrets.compare_digest'));
check('analytics environment keys are documented', env.includes('NEXT_PUBLIC_GA4_MEASUREMENT_ID=') && env.includes('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION='));

if (failures.length) {
  console.error('AJN PDF CURRENT ANALYTICS/MEASUREMENT: FAIL');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AJN PDF CURRENT ANALYTICS/MEASUREMENT: PASS');
