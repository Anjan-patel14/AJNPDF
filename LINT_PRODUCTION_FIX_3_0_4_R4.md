# AJN PDF 3.0.4 R4 - Production lint gate repair

This revision keeps ESLint strict for application source while allowing the verifier scripts' intentional conditional-expression assertion style.

Changes:
- Added a narrow ESLint override for `scripts/**/*.js` and `scripts/**/*.mjs` disabling only `@typescript-eslint/no-unused-expressions`.
- Replaced the `/pdf-tools` URL-navigation ternary expression with explicit `if/else` control flow.
- Replaced three non-reassigned `height` bindings with `const` in JSON, TXT and XML to PDF components.
- Keeps unused variables and `<img>` findings as warnings; they do not bypass the production error gate.
- Retains the Windows-safe ESLint launcher and runtime-artifact-aware secret scan from R3/R2.
