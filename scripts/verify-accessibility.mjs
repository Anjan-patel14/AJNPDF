import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function expect(label, ok) { if (!ok) { console.error(`FAIL: ${label}`); process.exitCode = 1; } else console.log(`PASS: ${label}`); }

const css = read('src/app/globals.css');
const search = read('src/components/search-modal.tsx');
const status = read('src/components/junction/backend-status.tsx');
const progress = read('src/components/ajnpdf/progress-bar.tsx');
const dropzone = read('src/components/ajnpdf/file-dropzone.tsx');

expect('reduced-motion fallback exists', css.includes('prefers-reduced-motion'));
expect('forced-colors/high-contrast fallback exists', css.includes('forced-colors'));
expect('visible keyboard focus styling exists', css.includes(':focus-visible'));
expect('search dialog exposes dialog semantics', search.includes('role="dialog"') && search.includes('aria-modal="true"'));
expect('search field has an accessible label', search.includes("aria-label={t('nav.searchLabel')}"));
expect('search close button has an accessible name', search.includes("aria-label={t('nav.closeSearch')}"));
expect('search dialog traps tab focus', search.includes("e.key === 'Tab'") && search.includes('dialogRef.current'));
expect('progress exposes progressbar semantics', progress.includes('role="progressbar"') && progress.includes('aria-valuenow'));
expect('service status is announced', status.includes('aria-live="polite"'));
expect('upload area exposes an accessible label', dropzone.includes('aria-label='));
if (process.exitCode) process.exit(process.exitCode);
console.log('PASS: source accessibility guardrails verified. Manual keyboard/screen-reader/contrast QA is still required on the rendered build.');
