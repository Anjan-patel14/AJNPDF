# AJN PDF R10.7.1 Conversion Icon Hotfix

This hotfix fixes the R10.7 TypeScript failure in `ToolArtwork` by destructuring the optional `priority` prop with a default value.

It also updates the production updater so `public/assets/conversion-icons` is copied, verified, staged, committed and pushed with the frontend release.

Expected icon inventory:
- 74 live conversion/ icons
- 75 catalog icons
- 5 source sheets

Backend, package.json, package-lock.json and live capability manifests remain protected.
