[CmdletBinding()]
param([switch]$VerifyOnly)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Set-Location -LiteralPath $PSScriptRoot
$node = (Get-Command node -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$version = & $node -p 'process.versions.node'
$major = [int]($version.Split('.')[0])
if ($major -lt 22 -or $major -ge 25) { throw 'Install Node.js 22 LTS or Node.js 24 LTS, then run this command again.' }
if (Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 9002 is already in use. Close the existing local AJN PDF server and run again.' }
# All verification and browser processing stays local. No Git, deployment or billing command.
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:AJN_ENABLE_HSTS = 'false'
$env:NEXT_PUBLIC_PDF_BACKEND_URL = 'http://127.0.0.1:8000'
$env:NEXT_PUBLIC_AJN_PDF_API_URL = 'http://127.0.0.1:8000'
$env:NEXT_PUBLIC_GA4_MEASUREMENT_ID = ''
function Invoke-Npm {
  param([string[]]$Arguments)
  & $npm @Arguments
  if ($LASTEXITCODE -ne 0) { throw "npm $($Arguments -join ' ') failed with exit code $LASTEXITCODE. The source has been kept." }
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules\next\package.json'))) {
  Invoke-Npm -Arguments @('ci','--no-fund','--no-audit')
} else {
  Write-Host 'PASS: existing node_modules detected; npm ci skipped for this retry.' -ForegroundColor Green
}
Invoke-Npm -Arguments @('run','typecheck')
Invoke-Npm -Arguments @('run','lint')
Invoke-Npm -Arguments @('run','build')
& $node -e "const fs=require('fs');const {chromium}=require('playwright');process.exit(fs.existsSync(chromium.executablePath())?0:1)"
if ($LASTEXITCODE -ne 0) {
  & $node 'node_modules/playwright/cli.js' install chromium
  if ($LASTEXITCODE -ne 0) { throw 'Chromium installation failed. Check your internet connection and rerun this script.' }
} else {
  Write-Host 'PASS: Playwright Chromium already installed; download skipped.' -ForegroundColor Green
}
& $node 'tests/editor.browser.mjs' --production
if ($LASTEXITCODE -ne 0) { throw 'Editor browser verification failed. See test-results\production\editor-results.json and failure.png.' }
Write-Host 'PASS: Edit PDF production build and browser tests.' -ForegroundColor Green
Write-Host 'Results: test-results\production\editor-results.json'
if (-not $VerifyOnly) {
  Write-Host 'Opening http://127.0.0.1:9002/edit-pdf. Keep this window open; press Ctrl+C to stop.'
  $server = Start-Process -FilePath $node -ArgumentList @('node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','9002') -WorkingDirectory $PSScriptRoot -NoNewWindow -PassThru
  try {
    $ready = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
      if ($server.HasExited) { throw 'The local server stopped before becoming ready.' }
      try {
        $response = Invoke-WebRequest 'http://127.0.0.1:9002/edit-pdf' -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) { $ready = $true; break }
      } catch {}
      Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'The local server did not become ready.' }
    Start-Process 'http://127.0.0.1:9002/edit-pdf'
    Wait-Process -Id $server.Id
  } finally {
    if (-not $server.HasExited) { Stop-Process -Id $server.Id }
  }
}
