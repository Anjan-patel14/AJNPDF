import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) throw new Error(`Missing required file: ${rel}`);
  return fs.readFileSync(p, "utf8");
}

function write(rel, text) {
  const p = path.join(root, rel);
  fs.writeFileSync(p, text.replace(/\r\n/g, "\n"), "utf8");
}

function patchFilterRows(rel) {
  let text = read(rel);
  const original = text;

  // The R13 browser report showed category/filter controls living beyond the
  // effective viewport. Convert horizontal no-wrap filter strips to wrapping
  // rows on the two affected public directory surfaces.
  text = text.replace(/\boverflow-x-auto\b/g, "overflow-x-visible flex-wrap");
  text = text.replace(/\boverflow-x-scroll\b/g, "overflow-x-visible flex-wrap");
  text = text.replace(/\bflex-nowrap\b/g, "flex-wrap");

  if (text !== original) {
    write(rel, text);
    console.log(`PASS: responsive filter-row source hardened: ${rel}`);
  } else {
    console.log(`INFO: no horizontal filter utility needed replacement in ${rel}; CSS fallback will cover multi-button rows.`);
  }
}

patchFilterRows("src/app/page.tsx");
patchFilterRows("src/app/pdf-tools/page.tsx");

const cssRel = "src/app/globals.css";
let css = read(cssRel);
const cssMarker = "/* AJN R13 FINAL BROWSER-AUDIT MULTI-BUTTON REFLOW */";

if (!css.includes(cssMarker)) {
  css += `

${cssMarker}
@media (max-width: 768px) {
  main .flex:has(> button:nth-child(3)) {
    min-width: 0;
    max-width: 100%;
    flex-wrap: wrap !important;
    overflow-x: visible !important;
  }

  main .flex:has(> button:nth-child(3)) > button {
    max-width: 100%;
    flex: 0 1 auto;
  }

  main [role="tablist"] {
    min-width: 0;
    max-width: 100%;
    flex-wrap: wrap !important;
    overflow-x: visible !important;
  }

  main [role="tablist"] > button {
    max-width: 100%;
    flex: 0 1 auto;
    white-space: normal;
  }
}
`;
  write(cssRel, css);
  console.log("PASS: mobile/high-zoom multi-button reflow fallback added.");
} else {
  console.log("PASS: mobile/high-zoom multi-button reflow fallback already present.");
}

// Merge PDF is a browser-local PDF workflow. Keep its heavy browser execution
// behind an explicit client-only boundary so SSR cannot execute browser-only
// code and there is no server/client hydration divergence from that tool body.
const mergeRel = "src/components/junction/MergePdf.tsx";
const mergeSource = read(mergeRel);
const wrapperRel = "src/components/junction/MergePdfNoSsr.tsx";

let loader;
if (/export\s+default\b/.test(mergeSource) || /export\s*\{[^}]*\bas\s+default\b[^}]*\}/s.test(mergeSource)) {
  loader = `() => import("./MergePdf")`;
} else if (/export\s+(?:async\s+)?function\s+MergePdf\b/.test(mergeSource) ||
           /export\s+const\s+MergePdf\b/.test(mergeSource) ||
           /export\s+class\s+MergePdf\b/.test(mergeSource)) {
  loader = `() => import("./MergePdf").then((module) => module.MergePdf)`;
} else {
  throw new Error("Could not determine MergePdf export style safely. No import rewrite was performed.");
}

const wrapper = `"use client";

import dynamic from "next/dynamic";

const MergePdfClient = dynamic(${loader}, {
  ssr: false,
  loading: () => (
    <div
      className="mx-auto min-h-[420px] w-full max-w-5xl px-4 py-10"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-center text-sm font-medium text-slate-600">
        Loading Merge PDFâ€¦
      </p>
    </div>
  ),
});

export function MergePdf() {
  return <MergePdfClient />;
}

export default MergePdf;
`;

write(wrapperRel, wrapper);

const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      walk(full);
    } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      sourceFiles.push(full);
    }
  }
}
walk(path.join(root, "src"));

let importRewrites = 0;
for (const full of sourceFiles) {
  const rel = path.relative(root, full).replace(/\\/g, "/");
  if (rel === mergeRel || rel === wrapperRel) continue;

  const before = fs.readFileSync(full, "utf8");
  const after = before.replace(
    /(["'])([^"']*\/MergePdf|\.\/MergePdf)\1/g,
    (match, quote, specifier) => {
      if (specifier.endsWith("MergePdfNoSsr")) return match;
      importRewrites++;
      return `${quote}${specifier}NoSsr${quote}`;
    }
  );

  if (after !== before) {
    fs.writeFileSync(full, after.replace(/\r\n/g, "\n"), "utf8");
    console.log(`PASS: Merge PDF client-boundary import updated: ${rel}`);
  }
}

if (importRewrites === 0) {
  throw new Error(
    "No MergePdf module import was found to redirect through MergePdfNoSsr. Stop rather than guessing the component registry."
  );
}

const auditRel = "scripts/audit-r13-browser-layout.mjs";
let audit = read(auditRel);

// Preserve the prior zero-warning correction.
audit = audit.replace(/\bserverLog\b/g, "_serverLog");
write(auditRel, audit);

console.log(`PASS: Merge PDF browser-only boundary installed (${importRewrites} import rewrite(s)).`);
console.log("AJN PDF R13 FINAL BROWSER SOURCE HOTFIX: APPLIED");