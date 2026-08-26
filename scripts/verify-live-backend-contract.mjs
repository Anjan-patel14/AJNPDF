import fs from 'node:fs';

const base = (
  process.env.AJN_BACKEND_URL ||
  process.env.NEXT_PUBLIC_PDF_BACKEND_URL ||
  ''
).replace(/\/$/, '');

if (!base) {
  console.error('FAIL: set AJN_BACKEND_URL to the backend origin.');
  process.exit(2);
}

const expectedFileMb = Number(
  process.env.AJN_EXPECT_MAX_FILE_MB || 30
);

const expectedTotalMb = Number(
  process.env.AJN_EXPECT_MAX_TOTAL_MB || 30
);

const snapshot = JSON.parse(
  fs.readFileSync(
    'src/generated/backend-capabilities.json',
    'utf8'
  )
);

const failures = [];

const check = (label, condition) => {
  if (condition) console.log(`PASS: ${label}`);
  else failures.push(label);
};

const response = await fetch(
  `${base}/ready`,
  { cache: 'no-store' }
);

check('/ready HTTP 200', response.status === 200);

const ready = await response.json().catch(() => ({}));

check(
  '/ready status=ok',
  ready.status === 'ok'
);

check(
  '/ready conversion_tools=75',
  Number(ready.conversion_tools) === 75
);

check(
  '/ready available_conversion_tools=75',
  Number(ready.available_conversion_tools) === 75
);

check(
  `/ready max_file_mb=${expectedFileMb}`,
  Number(ready.max_file_mb) === expectedFileMb
);

check(
  `/ready max_total_mb=${expectedTotalMb}`,
  Number(ready.max_total_mb) === expectedTotalMb
);

const toolsResponse = await fetch(
  `${base}/api/tools`,
  { cache: 'no-store' }
);

check(
  '/api/tools HTTP 200',
  toolsResponse.status === 200
);

const toolsPayload = await toolsResponse
  .json()
  .catch(() => ({}));

const tools = Array.isArray(toolsPayload.tools)
  ? toolsPayload.tools
  : [];

const securityIds = new Set([
  'protect-pdf',
  'unlock-pdf',
  'repair-pdf']);

const conversionTools = tools.filter(
  (tool) => !securityIds.has(tool.id)
);

const securityTools = tools.filter(
  (tool) => securityIds.has(tool.id)
);

const liveIds = new Set(
  tools.map((tool) => tool.id)
);

check(
  '/api/tools contains 78 backend capabilities',
  tools.length === 78
);

check(
  '/api/tools IDs are unique',
  liveIds.size === 78
);

check(
  '/api/tools contains 75 conversion tools',
  conversionTools.length === 75
);

check(
  '/api/tools includes Protect/Unlock/Repair',
  securityTools.length === 3 &&
    [...securityIds].every((id) => liveIds.has(id))
);

check(
  '/api/tools all 78 backend capabilities available',
  tools.length === 78 &&
    tools.every((tool) => tool.available === true)
);

const snapshotTools = Array.isArray(snapshot.tools)
  ? snapshot.tools
  : [];

const snapshotMap = new Map(
  snapshotTools.map((tool) => [tool.id, tool])
);

check(
  'static manifest is 78/78',
  snapshot.toolCount === 78 &&
    snapshot.availableCount === 78 &&
    snapshot.unavailableCount === 0
);

check(
  'static manifest contains 78 tool records',
  snapshotMap.size === 78
);

for (const tool of tools) {
  const staticTool = snapshotMap.get(tool.id);

  if (!staticTool) {
    failures.push(
      `live tool missing from static capability snapshot: ${tool.id}`
    );
  } else if (staticTool.available !== tool.available) {
    failures.push(
      `availability mismatch for ${tool.id}`
    );
  }
}

for (const staticTool of snapshotTools) {
  if (!liveIds.has(staticTool.id)) {
    failures.push(
      `static capability missing from live /api/tools: ${staticTool.id}`
    );
  }
}

if (failures.length) {
  console.error(
    'AJN PDF LIVE BACKEND CONTRACT: FAIL'
  );

  failures.forEach((item) =>
    console.error(`- ${item}`)
  );

  process.exit(1);
}

console.log(
  `AJN PDF LIVE BACKEND CONTRACT: PASS ` +
  `(${conversionTools.length} conversions + ` +
  `${securityTools.length} security = ` +
  `${tools.length}/${snapshot.toolCount}, ` +
  `${ready.max_file_mb}/${ready.max_total_mb} MB)`
);