import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const write = (p, t) => fs.writeFileSync(p, t, "utf8");
const ensure = (condition, message) => { if (!condition) throw new Error(message); };
const replaceOnce = (source, from, to, label) => {
  if (source.includes(to)) return source;
  ensure(source.includes(from), `Patch marker not found: ${label}`);
  return source.replace(from, to);
};

// 1) Registry record. Source always contains the scanner; public visibility remains controlled by policy.
{
  const p = "src/lib/tools-data.ts";
  let s = read(p);
  s = replaceOnce(s, "ImageIcon, Stamp,", "ImageIcon, ScanLine, Stamp,", "ScanLine icon import");
  if (!s.includes("id: 'scan-to-pdf'")) {
    const marker = "  // --- 2. OFFICE CONVERSION ---";
    ensure(s.includes(marker), "tools-data office conversion marker missing");
    const block = `  {
    id: 'scan-to-pdf', name: 'Scan to PDF', desc: 'Scan document photos into corrected, enhanced and optionally searchable PDFs directly in your browser.',
    icon: ScanLine, tag: 'create', cat: 'pdf', mode: 'PDF', badge: 'New', color: 'text-blue-700', perfIndex: 'Browser',
    benefits: ['Automatic document edge detection', 'Manual corner correction', 'Local searchable OCR', 'Multi-page scanning'],
    useCases: ['Scanning forms and notes', 'Digitizing printed documents', 'Creating searchable scan archives'],
    instructions: ['Capture or upload document photos', 'Review document corners and enhancement', 'Optionally run local OCR', 'Create and download PDF'],
    keywords: ['scan to pdf', 'document scanner', 'scan document online', 'searchable pdf', 'camera to pdf', 'ocr scan']
  },

`;
    s = s.replace(marker, block + marker);
  }
  write(p, s);
}

// 2) Tool policy. Normal CI/local builds remain at the current catalog unless explicitly enabled.
// Vercel production is enabled directly by VERCEL_ENV; local/CI scanner builds can use NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF=true.
{
  const p = "src/lib/tool-policy.ts";
  let s = read(p);
  s = s.replace(
    "export const SCAN_TO_PDF_ENABLED = process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF === 'true';",
    "export const SCAN_TO_PDF_ENABLED = process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF === 'true' || process.env.VERCEL_ENV === 'production';",
  );
  const setClose = "]);\n\nconst browserImageToPdfIds";
  if (!s.includes("NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF")) {
    ensure(s.includes(setClose), "tool policy allowlist marker missing");
    s = s.replace(setClose, `]);

export const SCAN_TO_PDF_ENABLED = process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF === 'true' || process.env.VERCEL_ENV === 'production';
if (SCAN_TO_PDF_ENABLED) PRODUCTION_PUBLIC_TOOL_IDS.add('scan-to-pdf');

const browserImageToPdfIds`);
  }
  if (!s.includes("'scan-to-pdf',\n  // Source-only image processors")) {
    s = replaceOnce(
      s,
      "  ...browserImageToPdfIds,\n  // Source-only image processors",
      "  ...browserImageToPdfIds,\n  'scan-to-pdf',\n  // Source-only image processors",
      "stable scanner policy",
    );
  }
  s = replaceOnce(
    s,
    "maxFiles: browserImageToPdfIds.has(id) ? 30 : id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxFiles : 1,\n      maxFileSizeMb: browserImageToPdfIds.has(id) ? 15 : id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxFileSizeMb : 50,",
    "maxFiles: id === 'scan-to-pdf' ? 30 : browserImageToPdfIds.has(id) ? 30 : id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxFiles : 1,\n      maxFileSizeMb: id === 'scan-to-pdf' ? 18 : browserImageToPdfIds.has(id) ? 15 : id === 'merge-pdf' ? MERGE_PDF_LIMITS.maxFileSizeMb : 50,",
    "scanner limits",
  );
  write(p, s);
}

// 3) Workspace mapping.
{
  const p = "src/components/junction/tool-workspace-client.tsx";
  let s = read(p);
  if (!s.includes("'scan-to-pdf': dynamic(() => import('./ScanToPdf')")) {
    const marker = "  // Browser-only image -> PDF conversions. These routes never require Cloud Run.";
    ensure(s.includes(marker), "workspace scanner insertion marker missing");
    s = s.replace(marker, `  'scan-to-pdf': dynamic(() => import('./ScanToPdf'), { ssr: false }),\n\n${marker}`);
  }
  write(p, s);
}

// 4) Primary PDF directory card.
{
  const p = "src/components/landing/services-grid.tsx";
  let s = read(p);
  s = replaceOnce(
    s,
    'ids: ["image-to-pdf", "jpg-to-pdf", "jpeg-to-pdf", "png-to-pdf", "webp-to-pdf"],',
    'ids: ["scan-to-pdf", "image-to-pdf", "jpg-to-pdf", "jpeg-to-pdf", "png-to-pdf", "webp-to-pdf"],',
    "scanner directory group",
  );
  write(p, s);
}

// 5) Explicit SEO profile.
{
  const p = "src/lib/seo-strategy.ts";
  let s = read(p);
  if (!s.includes("'scan-to-pdf': {")) {
    const marker = "  'sign-pdf': {";
    ensure(s.includes(marker), "SEO scanner insertion marker missing");
    const block = `  'scan-to-pdf': {
    title: 'Scan to PDF Online - Create Searchable PDFs | AJN PDF',
    description: 'Scan document photos into corrected, enhanced and optionally searchable PDFs in your browser with local OCR and no document upload.',
  },
`;
    s = s.replace(marker, block + marker);
  }
  write(p, s);
}

// 6) Next.js production enablement, route compatibility, cache policy.
{
  const p = "next.config.ts";
  let s = read(p);
  s = s.replace(
    "const scanToPdfEnabled = process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF === 'true';",
    "const scanToPdfEnabled = process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF === 'true' || process.env.VERCEL_ENV === 'production';",
  );

  if (!s.includes("const scanToPdfEnabled =")) {
    const marker = "const isIndexableDeployment = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production';";
    ensure(s.includes(marker), "next.config deployment marker missing");
    s = s.replace(
      marker,
      `${marker}\nconst scanToPdfEnabled = process.env.NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF === 'true' || process.env.VERCEL_ENV === 'production';`,
    );
  }

  if (!s.includes("...(scanToPdfEnabled ? ['scan-to-pdf'] : [])")) {
    const marker = "  'sign-pdf', 'split-pdf', 'unlock-pdf', 'watermark-pdf', 'webp-to-pdf',\n];";
    ensure(s.includes(marker), "next.config public tool list end marker missing");
    s = s.replace(
      marker,
      "  'sign-pdf', 'split-pdf', 'unlock-pdf', 'watermark-pdf', 'webp-to-pdf',\n  ...(scanToPdfEnabled ? ['scan-to-pdf'] : []),\n];",
    );
  }

  if (!s.includes("NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF: scanToPdfEnabled ? 'true' : 'false'")) {
    const marker = "const nextConfig: NextConfig = {\n";
    ensure(s.includes(marker), "next.config object marker missing");
    s = s.replace(
      marker,
      `${marker}  env: { NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF: scanToPdfEnabled ? 'true' : 'false' },\n`,
    );
  }

  if (!s.includes("source: '/ajn-scan/opencv-4.10.0/:path*'")) {
    const marker = "    return [\n      { source: '/admin/:path*'";
    ensure(s.includes(marker), "next.config headers marker missing");
    s = s.replace(
      marker,
      "    return [\n      { source: '/ajn-scan/opencv-4.10.0/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },\n      { source: '/admin/:path*'",
    );
  }

  write(p, s);
}

// 7) Update the legacy regression that required scanner source deletion.
{
  const p = "scripts/verify-r20-conversion-accuracy.mjs";
  let s = read(p);
  const old = `if (fs.existsSync('src/components/junction/DocumentScanner.tsx')) fail('Retired scanner source must be physically deleted');
else pass('Retired scanner source is physically deleted');
forbidText(junctionIndex, 'DocumentScanner', 'Retired scanner component is not exported');`;
  const newer = `if (fs.existsSync('src/components/junction/DocumentScanner.tsx')) fail('Legacy DocumentScanner source must remain deleted');
else pass('Legacy DocumentScanner source remains deleted');
if (fs.existsSync('src/components/junction/ScanToPdf.tsx')) pass('New feature-gated Scan to PDF source exists');
else fail('New feature-gated Scan to PDF source is missing');
forbidText(junctionIndex, 'DocumentScanner', 'Legacy scanner component is not exported');`;
  if (s.includes(old)) s = s.replace(old, newer);
  else if (!s.includes("New feature-gated Scan to PDF source exists")) throw new Error("R20 scanner regression marker changed; refusing unsafe patch.");
  write(p, s);
}

// 8) Document the switch. Vercel production turns it on automatically in next.config.ts.
{
  const p = ".env.example";
  let s = read(p);
  if (!s.includes("NEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF")) {
    s += `\n# Scanner is auto-enabled on Vercel production by next.config.ts. Set true for local/CI scanner builds.\nNEXT_PUBLIC_AJN_ENABLE_SCAN_TO_PDF=false\n`;
  }
  write(p, s);
}

console.log("PASS: AJN PDF Scan to PDF production integration patched");
