# AJN PDF UX + Performance + Processing Workflow R3

## User experience
- Root Next.js route skeleton.
- Tool-directory skeleton.
- Individual tool-page skeleton.
- PDF-tools skeleton.
- Skeletons are server-rendered and add no client JavaScript.
- Reduced-motion support.
- Mobile responsive layouts.

## Server processing experience
A global client-side observer is mounted once in the root layout.

It watches only server-processing POST paths:
- `/api/convert/*`
- `/api/pdf/protect`
- `/api/pdf/unlock`
- `/api/pdf/repair`
- `/api/pdf/compress`

It does not interfere with browser-only tools or ordinary GET/health/capability requests.

For server processing it provides:
1. Preparing secure processing
2. Starting the document processor
3. Processing your document
4. Finishing and validating the result
5. Preparing your download

It displays honest elapsed time rather than a fake exact percentage.
Fast operations under ~220 ms never flash the modal.

## Performance
- No new npm packages.
- Route skeletons are Server Components.
- Cloud backend `preconnect` reduces connection setup latency without issuing a processing request.
- Processing timers exist only while a server job is active.
- Background-tab timer frequency is reduced.
- CSS uses containment where appropriate.
- No backend warm request is sent on every page load, preserving scale-to-zero cost behavior.

## Backend workflow correction
`smoke_test.py` and `capability_audit.py` are HTTP integration tests.
They must not run inside `docker build` before Uvicorn starts.

Docker build now keeps:
- Python compilation
- FastAPI import
- native-engine verification already present in the Dockerfile
- `full_acceptance_test.py` direct conversion gate

After Cloud Run starts:
- startup probe -> `/ready`
- liveness probe -> `/health`
- deploy script -> `/health`, `/ready`, `/api/tools`
- `TEST_CLOUD_RUN_BACKEND.ps1` -> real HTTP conversion/security/ acceptance
