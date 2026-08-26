import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();

const pkg = JSON.parse(
  fs.readFileSync(
    path.join(root, 'package.json'),
    'utf8'
  )
);

const sourcePath =
  path.join(
    root,
    'src/generated/backend-capabilities.json'
  );

const publicPath =
  path.join(
    root,
    'public/backend-capabilities.json'
  );

const conversionSource =
  fs.readFileSync(
    path.join(root, 'src/lib/conversion-tools.ts'),
    'utf8'
  );

const frontendServerIds = [
  ...conversionSource.matchAll(
    /\btool\(\s*['"]([^'"]+)['"]/g
  )
].map(match => match[1]);

const expectedIds = new Set([
  ...frontendServerIds,
  'png-to-pdf',
  'protect-pdf',
  'unlock-pdf',
  'repair-pdf']);

const expectedCount = expectedIds.size;

const failures = [];

const fail = message => failures.push(message);

const readJson = file => {
  try {
    return JSON.parse(
      fs.readFileSync(file, 'utf8')
    );
  } catch (error) {
    fail(
      `${path.relative(root, file)}: ${error.message}`
    );
    return {};
  }
};

function canonical(value) {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [
          key,
          canonical(value[key])])
    );
  }

  return value;
}

function fingerprint(tools) {
  const stable = [...tools].sort(
    (a, b) =>
      String(a.id).localeCompare(String(b.id))
  );

  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify(
        canonical(stable)
      )
    )
    .digest('hex');
}

function validate(payload, label) {
  const tools =
    Array.isArray(payload.tools)
      ? payload.tools
      : [];

  if (payload.schemaVersion !== 2) {
    fail(
      `${label}: schemaVersion must be 2`
    );
  }

  if (
    !payload.generatedAt ||
    Number.isNaN(
      Date.parse(payload.generatedAt)
    )
  ) {
    fail(
      `${label}: generatedAt is invalid`
    );
  }

  if (
    payload.backendVersion !== pkg.version
  ) {
    fail(
      `${label}: backendVersion must match package ${pkg.version}`
    );
  }

  if (
    tools.length !== expectedCount ||
    payload.toolCount !== expectedCount
  ) {
    fail(
      `${label}: capability snapshot must contain exactly ${expectedCount} current backend capabilities`
    );
  }

  const ids =
    tools.map(
      tool => String(tool.id || '')
    );

  if (
    ids.some(id => !id) ||
    new Set(ids).size !== ids.length
  ) {
    fail(
      `${label}: capability IDs are empty or duplicated`
    );
  }

  const available =
    tools.filter(
      tool => tool.available === true
    ).length;

  if (
    payload.availableCount !== available ||
    payload.unavailableCount !==
      tools.length - available
  ) {
    fail(
      `${label}: availability counts are inconsistent`
    );
  }

  if (
    process.env
      .AJN_ALLOW_PARTIAL_CAPABILITY_MANIFEST !== '1' &&
    available !== expectedCount
  ) {
    fail(
      `${label}: production snapshot is stale/degraded (${available}/${expectedCount}); export capabilities on a fully ready backend`
    );
  }

  for (const tool of tools) {
    for (
      const key of [
        'id',
        'name',
        'category',
        'inputExtensions',
        'outputExtension',
        'available',
        'multiFile',
        'processingMode']
    ) {
      if (!(key in tool)) {
        fail(
          `${label}: ${tool.id || 'unknown'} missing ${key}`
        );
      }
    }

    if (
      tool.available === false &&
      !String(
        tool.unavailableReason || ''
      ).trim()
    ) {
      fail(
        `${label}: ${tool.id} unavailable without reason`
      );
    }
  }

  const missing =
    [...expectedIds].filter(
      id => !ids.includes(id)
    );

  const extra =
    ids.filter(
      id => !expectedIds.has(id)
    );

  if (missing.length) {
    fail(
      `${label}: missing source capabilities: ${missing.join(', ')}`
    );
  }

  if (extra.length) {
    fail(
      `${label}: unexpected capabilities: ${extra.join(', ')}`
    );
  }

  const computed =
    fingerprint(tools);

  if (
    payload.capabilityFingerprint !== computed
  ) {
    fail(
      `${label}: fingerprint does not match canonical capability data`
    );
  }

  return {
    tools,
    computed,
  };
}

const source =
  readJson(sourcePath);

const publicManifest =
  readJson(publicPath);

const a =
  validate(
    source,
    'source manifest'
  );

const b =
  validate(
    publicManifest,
    'public manifest'
  );

if (
  JSON.stringify(source) !==
  JSON.stringify(publicManifest)
) {
  fail(
    'source/public capability manifests are not byte-equivalent JSON data'
  );
}

if (
  a.computed !== b.computed
) {
  fail(
    'source/public computed capability fingerprints differ'
  );
}

if (failures.length) {
  console.error(
    'AJN PDF CAPABILITY MANIFEST: FAIL'
  );

  failures.forEach(
    item =>
      console.error(`- ${item}`)
  );

  process.exit(1);
}

console.log(
  `AJN PDF CAPABILITY MANIFEST: PASS (${source.availableCount}/${source.toolCount}, ${source.capabilityFingerprint.slice(0,12)})`
);
