import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const candidates = [
  'src/generated/backend-capabilities.json',
  'public/backend-capabilities.json'];
const rel = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)));
if (!rel) {
  console.error('FAIL: no AJN PDF backend capability manifest was found. Run the existing capability export before building.');
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
if (!Array.isArray(payload.tools)) {
  console.error(`FAIL: ${rel} does not contain the expected tools array.`);
  process.exit(1);
}
const unavailable = payload.tools.filter((tool) => tool.available === false);
const available = payload.tools.filter((tool) => tool.available === true);
console.log(`AJN PDF backend capability report: ${available.length}/${payload.tools.length} available.`);
if (unavailable.length === 0) console.log('Unavailable capabilities: none.');
else {
  console.log(`Unavailable capabilities (${unavailable.length}):`);
  for (const tool of unavailable) console.log(` - ${tool.id}: ${String(tool.unavailableReason || 'No reason supplied')}`);
}
const out = {
  generatedAt: new Date().toISOString(),
  source: rel,
  backendVersion: payload.backendVersion,
  availableCount: available.length,
  toolCount: payload.tools.length,
  unavailable: unavailable.map((tool) => ({ id: tool.id, name: tool.name, reason: tool.unavailableReason || '' })),
};
const outputPath = process.env.AJN_R13_CAPABILITY_REPORT || path.join(root, 'R13_CAPABILITY_REPORT.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
