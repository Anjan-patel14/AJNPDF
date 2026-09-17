$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' AJN PDF :: ADSENSE + SEO READINESS CHECK' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

if (-not (Test-Path '.\package.json')) {
    throw 'package.json not found.'
}

$adsTxtPath = '.\public\ads.txt'
$expectedAdsTxt = 'google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0'
if (-not (Test-Path $adsTxtPath)) {
    throw 'public/ads.txt is missing.'
}
$adsTxt = (Get-Content $adsTxtPath -Raw).Trim()
if ($adsTxt -ne $expectedAdsTxt) {
    throw 'public/ads.txt does not contain the expected authorised AdSense publisher declaration.'
}
Write-Host '[PASS] ads.txt publisher declaration' -ForegroundColor Green

if (-not (Test-Path '.\node_modules')) {
    Write-Host '[INFO] Installing dependencies first...' -ForegroundColor Yellow
    & npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
}

$checks = @(
    'node scripts/generate-sitemap-lastmod.mjs',
    'node scripts/verify-professional-seo.mjs',
    'node scripts/verify-edit-pdf-public.mjs',
    'node scripts/verify-browser-image-pdf.mjs',
    'npm run verify:seo-ads',
    'npm run verify:sitemap-indexing',
    'npm run verify:r20-seo',
    'npm run verify:r17-trust-seo',
    'npm run lint',
    'npm run typecheck',
    'npm run build'
)

foreach ($check in $checks) {
    Write-Host "`n==> $check" -ForegroundColor Yellow
    Invoke-Expression $check
    if ($LASTEXITCODE -ne 0) {
        throw "FAILED: $check"
    }
}

Write-Host ''
Write-Host '[PASS] AJN PDF source passed the AdSense/SEO release checks.' -ForegroundColor Green
Write-Host '[NOTE] Google AdSense approval is still decided by Google after live review.' -ForegroundColor DarkGray
