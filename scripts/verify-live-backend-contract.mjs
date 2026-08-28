import fs from 'node:fs';

const base = (
  process.env.AJN_BACKEND_URL ||
  process.env.NEXT_PUBLIC_PDF_BACKEND_URL ||
  process.env.NEXT_PUBLIC_AJN_PDF_API_URL ||
  ''
).replace(/\/$/, '');

if (!base) {
  console.error('FAIL: set AJN_BACKEND_URL to the backend origin.');
  process.exit(2);
}

const expectedFileMb = Number(process.env.AJN_EXPECT_MAX_FILE_MB || 30);
const expectedTotalMb = Number(process.env.AJN_EXPECT_MAX_TOTAL_MB || 30);

const snapshot = JSON.parse(
  fs.readFileSync('src/generated/backend-capabilities.json', 'utf8')
);

const snapshotTools = Array.isArray(snapshot.tools) ? snapshot.tools : [];
const snapshotMap = new Map(snapshotTools.map((tool) => [tool.id, tool]));
const expectedConversionCount = Number(snapshot.toolCount ?? snapshotTools.length);
const expectedAvailableConversionCount = Number(
  snapshot.availableCount ?? snapshotTools.filter((tool) => tool.available === true).length
);

const securityIds = new Set(['protect-pdf', 'unlock-pdf', 'repair-pdf']);
const expectedTotalCount = expectedConversionCount + securityIds.size;
const failures = [];

const check = (label, condition) => {
  if (condition) console.log(`PASS: ${label}`);
  else failures.push(label);
};

const readyResponse = await fetch(`${base}/ready`, { cache: 'no-store' });
check('/ready HTTP 200', readyResponse.status === 200);
const ready = await readyResponse.json().catch(() => ({}));
check('/ready status=ok', ready.status === 'ok');
check(
  `/ready conversion_tools=${expectedConversionCount}`,
  Number(ready.conversion_tools) === expectedConversionCount
);
check(
  `/ready available_conversion_tools=${expectedAvailableConversionCount}`,
  Number(ready.available_conversion_tools) === expectedAvailableConversionCount
);
check(
  `/ready max_file_mb=${expectedFileMb}`,
  Number(ready.max_file_mb) === expectedFileMb
);
check(
  `/ready max_total_mb=${expectedTotalMb}`,
  Number(ready.max_total_mb) === expectedTotalMb
);

const toolsResponse = await fetch(`${base}/api/tools`, { cache: 'no-store' });
check('/api/tools HTTP 200', toolsResponse.status === 200);
const toolsPayload = await toolsResponse.json().catch(() => ({}));
const tools = Array.isArray(toolsPayload.tools) ? toolsPayload.tools : [];
const liveIds = new Set(tools.map((tool) => tool.id));
const conversionTools = tools.filter((tool) => !securityIds.has(tool.id));
const securityTools = tools.filter((tool) => securityIds.has(tool.id));

check(
  `/api/tools contains ${expectedTotalCount} backend capabilities`,
  tools.length === expectedTotalCount
);
check('/api/tools IDs are unique', liveIds.size === tools.length);
check(
  `/api/tools contains ${expectedConversionCount} conversion tools`,
  conversionTools.length === expectedConversionCount
);
check(
  '/api/tools includes Protect/Unlock/Repair exactly once',
  securityTools.length === securityIds.size &&
    [...securityIds].every((id) => tools.filter((tool) => tool.id === id).length === 1)
);
check(
  '/api/tools security workflows are available temporary-server tools',
  securityTools.length === securityIds.size &&
    securityTools.every(
      (tool) => tool.available === true && tool.processingMode === 'temporary-server'
    )
);

check(
  `static conversion manifest is ${expectedAvailableConversionCount}/${expectedConversionCount}`,
  snapshotTools.length === expectedConversionCount &&
    snapshotMap.size === expectedConversionCount &&
    Number(snapshot.availableCount) === expectedAvailableConversionCount
);

for (const tool of conversionTools) {
  const staticTool = snapshotMap.get(tool.id);
  if (!staticTool) {
    failures.push(`live conversion tool missing from static capability snapshot: ${tool.id}`);
  } else if (staticTool.available !== tool.available) {
    failures.push(`availability mismatch for ${tool.id}`);
  }
}

for (const staticTool of snapshotTools) {
  if (!liveIds.has(staticTool.id)) {
    failures.push(`static conversion capability missing from live /api/tools: ${staticTool.id}`);
  }
}

if (failures.length) {
  console.error('AJN PDF LIVE BACKEND CONTRACT: FAIL');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(
  `AJN PDF LIVE BACKEND CONTRACT: PASS (` +
  `${conversionTools.length} conversions + ${securityTools.length} security = ` +
  `${tools.length}/${expectedTotalCount}, ${ready.max_file_mb}/${ready.max_total_mb} MB)`
);
