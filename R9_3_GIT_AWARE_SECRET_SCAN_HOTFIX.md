# AJN PDF 3.1.0 R9.3 - Git-aware secret scan hotfix

R9.2 correctly preserved the target repository backend and runtime data, but the legacy secret scanner recursively inspected local runtime artifacts such as `.env.local`, backend SQLite databases, and acceptance result JSON files. Those files are not release-owned frontend source and are normally intentionally untracked.

R9.3 makes secret verification context-aware:

- In a Git working tree, it scans every Git-tracked file for credential patterns and fails if any forbidden runtime artifact is accidentally tracked.
- Untracked local runtime files are ignored and preserved; the updater does not delete, copy, stage, or modify them.
- In an extracted release/archive without `.git`, the scanner still walks the complete package and rejects `.env.local`, SQLite runtime databases, acceptance result JSON files, private keys, credential URLs, tokens, and other secret-like values.
- `scripts/secret-scan.mjs` is now explicitly release-owned, copied to the target repository, and staged only after all verification/build gates pass.

This hotfix does not change AJN PDF tool logic, backend code, package.json, package-lock.json, or live capability manifests.
