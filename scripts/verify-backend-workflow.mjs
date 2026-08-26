import fs from 'node:fs';

const failures = [];
const check = (label, condition) => condition ? console.log(`PASS: ${label}`) : failures.push(label);
const read = (file) => fs.readFileSync(file, 'utf8');

const pkg = JSON.parse(read('package.json'));
const main = read('backend/app/main.py');
const engine = read('backend/app/conversion_engine.py');
const worker = read('backend/app/job_worker.py');
const httpAcceptance = read('backend/http_acceptance_test.py');
const frontend = read('src/lib/pdf-backend.ts');
const serverTool = read('src/components/junction/ServerConversionTool.tsx');
const toolLimits = read('src/lib/tool-limits.ts');
const packageScript = read('PACKAGE_PRODUCTION.ps1');
const secretScan = read('scripts/secret-scan.mjs');

const recordEventStart = main.indexOf('async def _record_event(');
const recordEventEnd = main.indexOf('def _record_site_event_sync', recordEventStart);
const recordEventBody = recordEventStart >= 0 && recordEventEnd > recordEventStart ? main.slice(recordEventStart, recordEventEnd) : '';

check('Backend workflow release version is 3.1.0', pkg.version === '3.1.0' && /VERSION\s*=\s*['"]3\.1\.0['"]/.test(main));
check('Uploads stream to disk in bounded chunks', main.includes('async def _save_upload') && main.includes('await upload.read(1024 * 1024)') && !main.includes('await upload.read(MAX_FILE_BYTES + 1)'));
check('Per-file and combined upload limits remain enforced', main.includes('MAX_FILE_BYTES') && main.includes('MAX_TOTAL_BYTES') && main.includes('combined upload size exceeds'));
check('File-count and options payload limits are enforced', main.includes('MAX_UPLOAD_FILES') && main.includes('Too many source files') && main.includes('Form(max_length=20000)'));
check(
  'Content validation runs before converter execution',
  main.includes('validate_input_files(spec, input_paths)') &&
  /def validate_input_file\(path:\s*Path,\s*allow_encrypted_pdf:\s*bool\s*=\s*False\)/.test(engine) &&
  main.indexOf('validate_input_files(spec, input_paths)') < main.indexOf("'operation': 'conversion'")
);
check(
  'PDF, image, Office/archive and OLE signatures are validated',
  engine.includes("probe.startswith(b'%PDF-')") &&
  engine.includes('Image.open(path)') &&
  engine.includes('_ZIP_BASED_EXPECTATIONS') &&
  engine.includes('_OLE_SIGNATURE') &&
  engine.includes('zipfile.is_zipfile(path)')
);
check(
  'SVG external resources are rejected',
  engine.includes('External SVG resources are not allowed.') &&
  engine.includes("re.findall('url\\\\(([^)]+)\\\\)'") &&
  engine.includes("re.search('@import")
);
check('Multi-frame and in-memory image batches are bounded', engine.includes('MAX_IMAGE_FRAMES') && engine.includes('MAX_BATCH_PIXELS') && engine.includes('Too many image pages for one PDF'));
check('PDF page ZIP extraction respects the global page ceiling', engine.includes('def _pdf_pages_zip') && engine.includes('doc.page_count > MAX_PDF_PAGES'));
check(
  'Unlock accepts valid encrypted PDFs without weakening other PDF validation',
  main.includes('allow_encrypted=True') &&
  /def validate_input_file\(path:\s*Path,\s*allow_encrypted_pdf:\s*bool\s*=\s*False\)/.test(engine) &&
  engine.includes('if document.needs_pass:') &&
  engine.includes('if allow_encrypted_pdf:')
);
check('Structured outputs are validated by format', engine.includes('generated JSON is invalid') && engine.includes('generated XML is invalid') && engine.includes('missing required document data'));
check('Archive expanded-size and entry limits exist', engine.includes('len(names) > 20000') && engine.includes('512 * 1024 * 1024'));
check('PDF render workloads are bounded', engine.includes('MAX_PDF_PAGES') && engine.includes('MAX_RENDER_PIXELS') && engine.includes('_pdf_render_workload'));
check('Normal PDF rendering is page-by-page', engine.includes('def _iter_pdf_rendered_pages') && engine.includes('for index, image in _iter_pdf_rendered_pages'));
check('Image pixel and generated-output limits exist', engine.includes('MAX_IMAGE_PIXELS') && engine.includes('MAX_OUTPUT_BYTES'));
check('Generated outputs are structurally validated', main.includes('validate_output_file(target, spec.output_extension)') && engine.includes('def validate_output_file'));
check(
  'Processing jobs run in isolated child processes',
  main.includes('def _run_worker_job(') &&
  main.includes("'-m', 'app.job_worker'") &&
  main.includes('stdin=subprocess.PIPE') &&
  worker.includes('def main()') &&
  main.includes("'X-AJN-Worker-Isolation': 'process'")
);
check('Timed-out processing workers are terminated', main.includes('except subprocess.TimeoutExpired') && main.includes('_terminate_worker(process)') && main.includes('status_code=504'));
check(
  'Sensitive PDF security operations use stdin worker payloads',
  main.includes('process.communicate(input=request_bytes') &&
  worker.includes('json.load(sys.stdin)') &&
  worker.includes("operation == 'protect'") &&
  worker.includes("operation == 'unlock'") &&
  main.includes("'operation': 'protect'") &&
  main.includes("'operation': 'unlock'")
);
check('Job admission checks free processing disk', main.includes('def _ensure_job_disk') && main.includes('_ensure_job_disk(total_bytes)'));
check(
  'Analytics failures cannot mask conversion results',
  recordEventBody.includes('try:') &&
  recordEventBody.includes('except Exception as exc:') &&
  recordEventBody.includes('conversion_analytics_write_failed') &&
  !recordEventBody.includes('raise')
);
check(
  'Oversized and workload-limit failures return actionable codes',
  main.includes('def _http_error_code') &&
  main.includes("'too large' in text") &&
  main.includes("'too many pages' in text") &&
  main.includes("return 'FILE_TOO_LARGE'")
);
check(
  'Errors include stable request references',
  main.includes('request.state.request_id = request_id') &&
  main.includes("'request_id': request_id") &&
  main.includes("response.headers['X-Request-ID'] = request_id") &&
  frontend.includes('requestId?: string')
);
check('Client request references are sanitized before logging/echo', main.includes('def _safe_request_id') && main.includes('[:64]') && main.includes('character.isalnum()'));
check('Frontend processing readiness uses candidate /ready endpoints', frontend.includes('SERVICE_CANDIDATES') && frontend.includes('`${candidate}/ready`') && !frontend.includes('`${candidate}/health`'));
check('Frontend requires explicit live tool availability', serverTool.includes('backendReady') && /manifest\?\.available\s*===\s*true/.test(serverTool));
check('Frontend rechecks readiness before processing', /const\s+latestHealth\s*=\s*await\s+checkPdfBackendHealth\(\)/.test(serverTool));
check(
  'Frontend enforces live upload limits before upload and rechecks live limits at action time',
  /validateBackendSelection\(next\.map\(\s*\(?item\)?\s*=>\s*item\.file\s*\),\s*policy\.maxFiles,\s*backendHealth\)/.test(serverTool) &&
  /const\s+latestHealth\s*=\s*await\s+checkPdfBackendHealth\(\)/.test(serverTool) &&
  /validateBackendSelection\(files\.map\(\s*\(?item\)?\s*=>\s*item\.file\s*\),\s*policy\.maxFiles,\s*latestHealth\)/.test(serverTool) &&
  toolLimits.includes('export function resolveBackendLimits') &&
  toolLimits.includes('const limits = resolveBackendLimits(health)') &&
  toolLimits.includes('live ${limits.maxFileSizeMb} MB server limit') &&
  toolLimits.includes('live ${limits.maxTotalSizeMb} MB total server limit')
);
check('Backend URL CSP/client parity has one source', read('next.config.ts').includes('configuredPdfBackendCandidates') && frontend.includes('configuredPdfBackendCandidates'));
check('Live HTTP acceptance iterates registered conversion specs', httpAcceptance.includes('for tool_id, spec in sorted(SPECS.items())'));
check('Live HTTP acceptance validates process-isolation and request headers', httpAcceptance.includes('X-AJN-Worker-Isolation') && httpAcceptance.includes('X-Request-ID'));
check('Live HTTP acceptance includes negative/error-path tests', httpAcceptance.includes('def _negative_tests') && httpAcceptance.includes('fake.pdf') && httpAcceptance.includes('expected_status=415') && httpAcceptance.includes('http-accept-file-count'));
check('Live HTTP acceptance includes Protect/Unlock/Repair/Compress', httpAcceptance.includes('def _security_endpoints') && httpAcceptance.includes('/api/pdf/protect') && httpAcceptance.includes('/api/pdf/unlock') && httpAcceptance.includes('/api/pdf/repair') && httpAcceptance.includes('/api/pdf/compress'));
check(
  'Obsolete local deploy wrapper stays retired while live HTTP acceptance remains available',
  !fs.existsSync('R16_PRODUCTION_SETUP_AND_DEPLOY.ps1') && fs.existsSync('backend/http_acceptance_test.py')
);
check('HTTP acceptance results cannot ship in production packages', packageScript.includes('HTTP_ACCEPTANCE_RESULTS.json') && secretScan.includes('HTTP_ACCEPTANCE_RESULTS.json'));

if (failures.length) {
  console.error('FAIL: backend workflow verification failed:');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}
console.log('AJN PDF backend workflow verification completed successfully.');