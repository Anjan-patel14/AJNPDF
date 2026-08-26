# AJN PDF 3.1.0 R9.5 - TypeScript Clean Hotfix

R9.4 passed the R9 source audit, backend integrity, SEO, production, trust, conversion, growth SEO, light-theme, branding, accessibility, mobile, i18n, tool UX, dependency policy, Git-aware secret scan, code-quality, backend workflow, capability manifest, and zero-warning ESLint gates.

The Windows TypeScript gate then reported 19 errors in four files. R9.5 fixes only those compile-time contract issues without changing the R9 public design or backend.

Fixes:
- Makes the analytics MetricCard icon optional and defaults it to Activity, matching the existing call sites.
- Removes the obsolete required ImageToPdfTool badge prop, matching the JPG/PNG wrappers and the R9 workspace UI.
- Copies pdf-lib output bytes into a real ArrayBuffer before creating the Crop PDF Blob, avoiding the Uint8Array<ArrayBufferLike> / BlobPart incompatibility.
- Keeps all R9.4 zero-warning ESLint cleanup.

Backend, package.json, package-lock.json, runtime files, and live backend capability manifests remain protected by the updater.
