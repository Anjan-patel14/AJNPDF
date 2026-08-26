# AJN PDF 3.1.0 R9.4 - ESLint Zero-Warning Hotfix

This hotfix changes no backend behavior and no user-facing R9 design or workflow.

It resolves the nine zero-warning ESLint findings reported by the live Windows repository gate:

- Removes eight unused Lucide icon imports from `src/app/admin/analytics/page.tsx`.
- Stops destructuring the unused `badge` prop in `src/components/junction/ImageToPdfTool.tsx` while retaining the prop in the public `Props` interface for caller compatibility.

R9.3 Git-aware secret scanning, R9.2 capability-manifest handling, backend byte-integrity protection, exact release-owned staging, SEO, accessibility, i18n, processing, sharing and UI behavior remain unchanged.
