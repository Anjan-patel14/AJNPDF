# AJN PDF 3.1.0 R10.5 - TypeScript Gate Hotfix

R10.5 keeps the R10 Chrome extension and all retained R9 production polish. It fixes only the TypeScript blockers exposed after R10.4 cleared the zero-warning ESLint gate.

## Fixed

- `MetricCard` now has a typed default icon, so existing analytics cards do not need to pass an icon prop.
- `CropPdf` copies `pdf-lib` output into a real `ArrayBuffer` before creating the PDF `Blob`, satisfying modern DOM `BlobPart` typing without changing PDF bytes.
- `ImageToPdfTool.badge` is optional, preserving compatibility while allowing the JPG and PNG wrappers to omit the unused prop.
- Added a preflight verifier for these exact TypeScript regressions.

## Safety

No backend source, package dependency file, lockfile, or live capability manifest is replaced by the updater. The real repository gates still run before staging, commit, and push.
