import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/app/loading.tsx",
  "src/app/tools/loading.tsx",
  "src/app/tools/[slug]/loading.tsx",
  "src/app/pdf-tools/loading.tsx",
  "src/components/ajnpdf/professional-skeleton.tsx",
  "src/components/ajnpdf/professional-skeleton.module.css",
  "src/components/ajnpdf/processing-activity-provider.tsx",
  "src/components/ajnpdf/processing-activity-provider.module.css"];

const failures = [];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    failures.push(`Missing ${rel}`);
  }
}

const layoutPath = path.join(root, "src/app/layout.tsx");
if (!fs.existsSync(layoutPath)) {
  failures.push("Missing src/app/layout.tsx");
} else {
  const layout = fs.readFileSync(layoutPath, "utf8");
  if (!layout.includes("ProcessingActivityProvider")) {
    failures.push("ProcessingActivityProvider is not mounted in src/app/layout.tsx");
  }
}

const dockerfilePath = path.join(root, "backend/Dockerfile");
if (fs.existsSync(dockerfilePath)) {
  const dockerfile = fs.readFileSync(dockerfilePath, "utf8");
  const buildSection = dockerfile.split(/^CMD\s/m)[0] ?? dockerfile;
  if (/python\s+smoke_test\.py/.test(buildSection)) {
    failures.push("Docker build still runs HTTP smoke_test.py before Uvicorn starts");
  }
  if (/python\s+capability_audit\.py/.test(buildSection)) {
    failures.push("Docker build still runs HTTP capability_audit.py before Uvicorn starts");
  }
  if (!/python\s+full_acceptance_test\.py/.test(buildSection)) {
    failures.push("Docker build is missing the direct full_acceptance_test.py gate");
  }
}

if (failures.length) {
  console.error("AJN PDF UX/PERFORMANCE R3: FAIL");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("AJN PDF UX/PERFORMANCE R3: PASS");
console.log(" - route skeletons present");
console.log(" - server-processing activity UI mounted");
console.log(" - build-time HTTP checks removed");
console.log(" - direct backend acceptance gate retained");
