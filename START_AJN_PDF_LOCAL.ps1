$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' AJN PDF :: ADSENSE + SEO READY LOCAL PREVIEW' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

if (-not (Test-Path '.\package.json')) {
    throw 'package.json not found. Run this script from the extracted AJN PDF project.'
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is not installed. Install Node.js 22 LTS or newer (below 25), then rerun this script.'
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is not available in PATH.'
}

$nodeVersion = (& node -p "process.versions.node").Trim()
$nodeMajor = [int](($nodeVersion -split '\.')[0])
Write-Host "[INFO] Node.js $nodeVersion"

if ($nodeMajor -lt 22 -or $nodeMajor -ge 25) {
    throw "AJN PDF requires Node.js >=22.12 and <25. Current version: $nodeVersion"
}

if (-not (Test-Path '.\node_modules')) {
    Write-Host '[INFO] Installing exact dependencies from package-lock.json...' -ForegroundColor Yellow
    & npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
}

$env:AJN_NEXT_DIST_DIR = '.next-local'

Write-Host ''
Write-Host '[READY] Local URL: http://127.0.0.1:9002' -ForegroundColor Green
Write-Host '[INFO] Press Ctrl+C to stop AJN PDF.' -ForegroundColor DarkGray
Write-Host ''

& npm run dev
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
