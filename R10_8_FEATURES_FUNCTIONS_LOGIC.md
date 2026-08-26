# AJN PDF R10.8 — Features, Functions & Logic

## Rendering logic
1. The homepage renders one responsive Hero component.
2. A single shared search/filter control feeds `ServicesGrid`.
3. `ServicesGrid` ranks all matching public workflows, then renders only the first 18 cards.
4. `Show more` adds up to 18 additional cards without changing search coverage.
5. Tool cards below the viewport are eligible for browser `content-visibility` skipping.

## Tool runtime logic
1. `ToolWorkspace` determines the current tool id from `/tools/<id>`.
2. `getToolLimitProfile()` reads the same frontend production policy already used to classify processing mode and upload limits.
3. Local tools display local/on-device processing facts without a network health request.
4. Server tools query `checkPdfBackendHealth()` against `/ready` with a bounded client timeout.
5. Live max-file, max-total and processing-timeout values override documented defaults when returned by the service.
6. Service availability is announced with an accessible live status badge.

## Trust/limits logic
- `/limits` documents current package defaults while clearly stating that live deployment values may be lower.
- `/` lists supported language packs and quality factors but does not claim a universal recognition percentage.
- Fair-use text explains that unusually high automated volume may be limited without publishing abuse-sensitive thresholds.

## Security-header logic
- CSP is static so normal Next.js static optimization remains available.
- HSTS is production default; preload requires an explicit environment opt-in.
- Trusted Types is deferred until compatibility QA is complete.

## Release safety logic
- Existing staged files stop the updater.
- Existing frontend work is backed up before release-owned files are copied.
- Backend/package/capability-manifest files are protected from copy and staging.
- Verification, live capability validation, ESLint, TypeScript and production build run before commit.
- Only release-owned frontend/extension/icon/docs/verifier files are staged.
- Commit/push occur only after all required gates pass.

## Live status logic
- `/status` calls the readiness endpoint immediately and refreshes it every 30 seconds while the page remains open.
- The user can still trigger an immediate manual refresh.
- Live version, max-file, max-total, timeout and available/registered conversion counts are shown when the service returns them.
- This is a current-state readiness view, not a fabricated historical uptime percentage.

## Brand-channel logic
- Product footer exposes the confirmed support contact but does not label personal developer social profiles as official AJN PDF brand accounts.
- Confirmed personal social links can remain on the developer profile.
- Dedicated AJN PDF Instagram/YouTube/etc. should be added only after those real accounts are created and verified.
