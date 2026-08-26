# AJN PDF R10.9 Admin Runtime Guide

AJN PDF uses separate private backend tokens:

- `AJN_ANALYTICS_ADMIN_TOKEN` for `/admin/analytics`
- `AJN_MEDIA_ADMIN_TOKEN` for `/admin/media`

Anonymous analytics additionally require `AJN_ANALYTICS_ENABLED=true` on the running backend.

## Local Windows configuration

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\CONFIGURE_AJN_ADMIN_LOCAL.ps1 -RepoPath (Get-Location).Path
```

To copy one local token to the clipboard without printing it:

```powershell
.\CONFIGURE_AJN_ADMIN_LOCAL.ps1 -RepoPath (Get-Location).Path -CopyToken Analytics
.\CONFIGURE_AJN_ADMIN_LOCAL.ps1 -RepoPath (Get-Location).Path -CopyToken Media
```

Restart the backend after changing `.env.local`.

## Production

Local `.env.local` does not configure a deployed backend. Configure these variables in the production backend environment and redeploy/restart it:

```env
AJN_ANALYTICS_ENABLED=true
AJN_ANALYTICS_RETENTION_DAYS=90
AJN_ANALYTICS_ADMIN_TOKEN=<private random analytics token>
AJN_MEDIA_ADMIN_TOKEN=<different private random media token>
```

Never place either token in `NEXT_PUBLIC_*`, Git, URLs, screenshots or public documentation.
