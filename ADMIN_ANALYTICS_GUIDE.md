# Private Administration Access

AJN PDF uses two separate administrator tokens generated during setup:

- `AJN_ANALYTICS_ADMIN_TOKEN` for `/admin/analytics`
- `AJN_MEDIA_ADMIN_TOKEN` for `/admin/media`

Both values are printed after a successful local setup and stored only in `backend/.env.local`.

## Display and copy the analytics token

```powershell
$Line = Get-Content ".\backend\.env.local" | Where-Object { $_ -match '^AJN_ANALYTICS_ADMIN_TOKEN=' } | Select-Object -First 1
$Token = $Line.Substring('AJN_ANALYTICS_ADMIN_TOKEN='.Length).Trim()
$Token | Set-Clipboard
Write-Host $Token
```

## Display and copy the media token

```powershell
$Line = Get-Content ".\backend\.env.local" | Where-Object { $_ -match '^AJN_MEDIA_ADMIN_TOKEN=' } | Select-Object -First 1
$Token = $Line.Substring('AJN_MEDIA_ADMIN_TOKEN='.Length).Trim()
$Token | Set-Clipboard
Write-Host $Token
```

The browser keeps a submitted token in tab-scoped `sessionStorage`; closing the tab ends the local admin session. Use long, different production tokens, rotate them after suspected exposure, protect the backend environment, and keep admin pages behind HTTPS.
