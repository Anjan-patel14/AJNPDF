# AJN PDF R9 capability manifest policy

R9 is a frontend-only update package. It deliberately does not ship a generated backend capability manifest because a static or placeholder manifest can misrepresent the backend currently deployed with the target repository.

The Windows updater preserves the target repository's existing `src/generated/backend-capabilities.json` and `public/backend-capabilities.json` files. Before the production build it runs the target repository's `npm run verify:capabilities` gate. That verified target manifest remains the source of truth for which backend-assisted tools are available.

R9 does not copy, modify, stage, or manufacture backend capability data.
