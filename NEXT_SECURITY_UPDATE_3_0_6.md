# AJN PDF 3.0.6 Next.js maintenance gate

The clean source ZIP retains the previously verified dependency lock so `npm ci` can reproduce the known R5 baseline. `SETUP_FULL_PRODUCTION.ps1` then installs and pins Next.js 15.5.21 from the public npm registry before any production verification or build runs. The dependency-policy verifier fails closed unless package.json, package-lock.json and installed Next.js all resolve to 15.5.21.

This two-stage installation is intentional because the packaging sandbox could not retrieve the maintenance package from its restricted npm mirror. The target Windows setup uses the public npm registry and is the final dependency/build authority.

- Windows setup also aligns `eslint-config-next` to `15.5.20` before running lint.
